/**
 * User Data Hook
 * Loads and manages user's positions and activity from the backend
 * Replaces useDemoPortfolio for real user data
 */

'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useBackendUser } from './useBackendUser'
import { PositionsApi, ActivityApi } from '@/lib/api-client'
import type { DbUserPositionWithVault, DbActivityEvent } from '@/lib/db/schema'
import { MS_PER_DAY } from '@/lib/constants'

const POSITIONS_QUERY_KEY = 'user-positions'
const ACTIVITY_QUERY_KEY = 'user-activity'

// Types for the UI
export interface UserPositionLine {
  id: string
  vaultId: string
  vaultName: string
  deposited: number
  claimable: number
  currentYield: number // Total accumulated yield
  state: 'active' | 'matured' | 'withdrawn'
  createdAt: number
  maturityDate: number
  daysRemaining: number
  progressPercent: number
  isMatured: boolean
  canWithdraw: boolean
  apr: number
  target: string
  strategy: string
  risk: string
  fees: string
}

export interface UserActivityItem {
  id: string
  type: 'deposit' | 'claim' | 'withdraw'
  vaultId: string
  vaultName: string
  amount: number
  timestamp: number
}

export interface UserDataStats {
  totalDeposited: number
  totalClaimable: number
  totalYieldClaimed: number
  activePositionsCount: number
}

// Helper to hydrate position with calculated fields
function hydratePosition(position: DbUserPositionWithVault): UserPositionLine {
  const now = Date.now()
  const daysRemaining = Math.max(0, Math.ceil((position.maturityDate - now) / MS_PER_DAY))
  const totalDays = Math.max(1, Math.ceil((position.maturityDate - position.createdAt) / MS_PER_DAY))
  const progressPercent = Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100))
  const isMatured = now >= position.maturityDate
  const claimable = position.accumulatedYield - position.claimedYield

  return {
    id: position.id,
    vaultId: position.vaultId,
    vaultName: position.vaultName,
    deposited: position.deposited,
    claimable: Math.max(0, claimable),
    currentYield: position.accumulatedYield,
    state: isMatured ? 'matured' : position.state,
    createdAt: position.createdAt,
    maturityDate: position.maturityDate,
    daysRemaining,
    progressPercent,
    isMatured,
    canWithdraw: isMatured && position.state !== 'withdrawn',
    apr: position.vaultApr,
    target: position.vaultTarget,
    strategy: position.vaultStrategy,
    risk: position.vaultRisk,
    fees: position.vaultFees,
  }
}

export function useUserData() {
  const { isAuthenticated } = useBackendUser()
  const queryClient = useQueryClient()

  // Query positions - now derived from authenticated wallet header
  const {
    data: positions = [],
    isLoading: isPositionsLoading,
    error: positionsError,
  } = useQuery<DbUserPositionWithVault[]>({
    queryKey: [POSITIONS_QUERY_KEY],
    queryFn: async () => {
      const result = await PositionsApi.listByUser()
      return result.positions
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  })

  // Query activity - now derived from authenticated wallet header
  const {
    data: activity = [],
    isLoading: isActivityLoading,
    error: activityError,
  } = useQuery<DbActivityEvent[]>({
    queryKey: [ACTIVITY_QUERY_KEY],
    queryFn: async () => {
      const result = await ActivityApi.listByUser(50)
      return result.events
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
  })

  // Hydrated positions with calculated fields
  const hydratedPositions = positions.map(hydratePosition)

  // Stats
  const stats: UserDataStats = {
    totalDeposited: hydratedPositions.reduce((sum, p) => sum + p.deposited, 0),
    totalClaimable: hydratedPositions.reduce((sum, p) => sum + p.claimable, 0),
    totalYieldClaimed: positions.reduce((sum, p) => sum + p.claimedYield, 0),
    activePositionsCount: hydratedPositions.filter(p => p.state !== 'withdrawn').length,
  }

  // Mutations - no userId needed, derived from wallet header
  const depositMutation = useMutation({
    mutationFn: async ({
      vaultId,
      amount,
      maturityDate,
      vaultName,
      txHash,
    }: {
      vaultId: string
      amount: number
      maturityDate: number
      vaultName: string
      txHash?: string
    }) => {
      const result = await PositionsApi.addDeposit(vaultId, amount, maturityDate, vaultName, txHash)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_QUERY_KEY] })
    },
  })

  const claimMutation = useMutation({
    mutationFn: async ({
      positionId,
      vaultId,
      vaultName,
      amount,
      txHash,
    }: {
      positionId: string
      vaultId: string
      vaultName: string
      amount: number
      txHash?: string
    }) => {
      // Update position accumulated/claimed yield
      const position = positions.find(p => p.id === positionId)
      if (!position) throw new Error('Position not found')

      const newAccumulated = position.accumulatedYield + amount
      await PositionsApi.update(positionId, {
        accumulatedYield: newAccumulated,
        claimedYield: position.claimedYield + amount,
        vaultName,
        txHash,
      })

      // Log activity
      await ActivityApi.logClaim(vaultId, vaultName, amount, txHash)

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_QUERY_KEY] })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: async ({
      positionId,
      vaultId,
      vaultName,
      amount,
      txHash,
    }: {
      positionId: string
      vaultId: string
      vaultName: string
      amount: number
      txHash?: string
    }) => {
      // Update position state to withdrawn
      await PositionsApi.update(positionId, { state: 'withdrawn', vaultName, txHash })

      // Log activity (amount includes principal + unclaimed yield)
      await ActivityApi.logWithdraw(vaultId, vaultName, amount, txHash)

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [ACTIVITY_QUERY_KEY] })
    },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [ACTIVITY_QUERY_KEY] })
  }

  // Convert to UI format
  const activityLines: UserActivityItem[] = activity.map(event => ({
    id: event.id,
    type: event.type,
    vaultId: event.vaultId,
    vaultName: event.vaultName,
    amount: event.amount,
    timestamp: event.timestamp,
  }))

  return {
    positions: hydratedPositions,
    activity: activityLines,
    stats,
    isLoading: isPositionsLoading || isActivityLoading,
    isPositionsLoading,
    isActivityLoading,
    error: positionsError || activityError,
    isAuthenticated,
    hasPositions: positions.length > 0,
    hasActivity: activity.length > 0,
    actions: {
      deposit: depositMutation.mutateAsync,
      claim: claimMutation.mutateAsync,
      withdraw: withdrawMutation.mutateAsync,
      refresh,
    },
    isDepositing: depositMutation.isPending,
    isClaiming: claimMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
  }
}
