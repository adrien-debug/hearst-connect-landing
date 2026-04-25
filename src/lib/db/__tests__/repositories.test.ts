import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initDb, closeDb, _setTestDb } from '../connection'
import { UserRepository, VaultRepository, PositionRepository, ActivityRepository } from '../repositories'
import Database from 'better-sqlite3'

function generateWallet(): `0x${string}` {
  const random = Math.random().toString(36).substring(2, 15)
  return `0x${random.padStart(40, '0')}` as `0x${string}`
}

describe('Database Repositories', () => {
  beforeAll(() => {
    _setTestDb(new Database(':memory:'))
    initDb()
  })

  afterAll(() => {
    closeDb()
  })

  describe('UserRepository', () => {
    it('should create and find user by wallet', () => {
      const walletAddress = generateWallet()
      
      const user = UserRepository.create({ walletAddress })
      expect(user).toBeDefined()
      expect(user.walletAddress).toBe(walletAddress)
      expect(user.id).toBeDefined()
      
      const found = UserRepository.findByWalletAddress(walletAddress)
      expect(found).toBeDefined()
      expect(found?.id).toBe(user.id)
    })

    it('should find or create user', () => {
      const walletAddress = generateWallet()
      
      // First call creates
      const user1 = UserRepository.findOrCreateByWallet(walletAddress)
      expect(user1).toBeDefined()
      
      // Second call finds existing
      const user2 = UserRepository.findOrCreateByWallet(walletAddress)
      expect(user2.id).toBe(user1.id)
    })
  })

  describe('VaultRepository', () => {
    it('should create and find vault', () => {
      const vault = VaultRepository.create({
        name: 'Test Vault',
        vaultAddress: '0x1111111111111111111111111111111111111111' as `0x${string}`,
        usdcAddress: '0x2222222222222222222222222222222222222222' as `0x${string}`,
        chainId: 8453,
        chainName: 'Base',
        apr: 12.5,
        target: '36%',
        lockPeriodDays: 365,
        minDeposit: 100000,
        strategy: 'Test Strategy',
        fees: '1.5% Mgmt',
        risk: 'Low',
      })
      
      expect(vault).toBeDefined()
      expect(vault.name).toBe('Test Vault')
      expect(vault.isActive).toBe(1)
      
      const found = VaultRepository.findById(vault.id)
      expect(found?.id).toBe(vault.id)
    })

    it('should list active vaults', () => {
      const vaults = VaultRepository.findActive()
      expect(Array.isArray(vaults)).toBe(true)
    })
  })

  describe('PositionRepository', () => {
    it('should create position for user', () => {
      // Create user
      const user = UserRepository.create({ 
        walletAddress: generateWallet()
      })
      
      // Create vault
      const vault = VaultRepository.create({
        name: 'Position Test Vault',
        vaultAddress: '0x3333333333333333333333333333333333333333' as `0x${string}`,
        usdcAddress: '0x4444444444444444444444444444444444444444' as `0x${string}`,
        chainId: 8453,
        chainName: 'Base',
        apr: 15,
        target: '50%',
        lockPeriodDays: 180,
        minDeposit: 50000,
        strategy: 'Growth',
        fees: '2%',
        risk: 'Medium',
      })
      
      const position = PositionRepository.create({
        userId: user.id,
        vaultId: vault.id,
        deposited: 1000000000, // 1000 USDC with 6 decimals
        maturityDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
      })
      
      expect(position).toBeDefined()
      expect(position.userId).toBe(user.id)
      expect(position.vaultId).toBe(vault.id)
      expect(position.state).toBe('active')
    })
  })

  describe('ActivityRepository', () => {
    it('should create and list activity events', () => {
      // Create user
      const user = UserRepository.create({ 
        walletAddress: generateWallet()
      })
      
      // Create vault
      const vault = VaultRepository.create({
        name: 'Activity Test Vault',
        vaultAddress: '0x5555555555555555555555555555555555555555' as `0x${string}`,
        usdcAddress: '0x6666666666666666666666666666666666666666' as `0x${string}`,
        chainId: 8453,
        chainName: 'Base',
        apr: 10,
        target: '20%',
        lockPeriodDays: 90,
        minDeposit: 10000,
        strategy: 'Conservative',
        fees: '1%',
        risk: 'Low',
      })
      
      // Create activity event
      const event = ActivityRepository.create({
        userId: user.id,
        vaultId: vault.id,
        vaultName: vault.name,
        type: 'deposit',
        amount: 500000000, // 500 USDC
      })
      
      expect(event).toBeDefined()
      expect(event.type).toBe('deposit')
      expect(event.amount).toBe(500000000)
      
      // List activity
      const activities = ActivityRepository.findByUserId(user.id)
      expect(activities.length).toBeGreaterThan(0)
      expect(activities[0].id).toBe(event.id)
    })
  })
})
