/**
 * SIWE Authentication Hook
 * Handles Sign-In with Ethereum flow:
 * 1. Request nonce from server
 * 2. Sign SIWE message with wallet
 * 3. Verify signature with server
 * 4. Server sets HTTP-only session cookie
 *
 * NOTE: siwe@3 ABNF parser is broken under Webpack bundling.
 * We build the EIP-4361 message string manually on the client.
 * The server still uses `new SiweMessage(string)` for parsing+verify (works fine).
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { setApiAuthenticated } from '@/lib/api-client'

interface SiweAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  address: string | null
  isAdmin: boolean
  hasRejected: boolean
}

function buildSiweMessage(params: {
  domain: string
  address: string
  statement: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
}): string {
  return [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    params.address,
    '',
    params.statement,
    '',
    `URI: ${params.uri}`,
    `Version: ${params.version}`,
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
  ].join('\n')
}

export function useSiweAuth() {
  const { address, chainId, connector } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [state, setState] = useState<SiweAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    address: null,
    isAdmin: false,
    hasRejected: false,
  })

  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            address: data.address,
            isAdmin: data.isAdmin,
            hasRejected: false,
          })
          setApiAuthenticated(true)
        }
      } catch {
        // No valid session — silent
      } finally {
        if (!cancelled) setSessionChecked(true)
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [])

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address || !chainId) {
      setState(s => ({ ...s, error: 'Wallet not connected' }))
      return false
    }

    if (!connector) {
      setState(s => ({ ...s, error: 'Wallet connector not ready' }))
      return false
    }

    try {
      await connector.getChainId()
    } catch {
      setState(s => ({ ...s, error: 'Wallet not ready. Please try again.' }))
      return false
    }

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!nonceRes.ok) {
        throw new Error('Failed to get nonce')
      }

      const { nonce } = await nonceRes.json()

      if (!nonce || typeof nonce !== 'string') {
        throw new Error('Invalid nonce received from server')
      }

      // 2. Build EIP-4361 message manually (siwe@3 ABNF parser broken under Webpack)
      const message = buildSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Hearst Connect',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      })

      console.log('[useSiweAuth] Message built, signing...')

      // 3. Sign with wallet
      const signature = await signMessageAsync({ message, account: address })

      console.log('[useSiweAuth] Signed, verifying with server...')

      // 4. Verify with server
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
        credentials: 'include',
      })

      if (!verifyRes.ok) {
        const errBody = await verifyRes.json()
        throw new Error(errBody.error || 'Verification failed')
      }

      const result = await verifyRes.json()

      setState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        address: result.address,
        isAdmin: result.isAdmin,
        hasRejected: false,
      })

      setApiAuthenticated(true)
      console.log('[useSiweAuth] Authenticated:', result.address)
      return true

    } catch (error) {
      const isRejection = error instanceof Error &&
        (error.name === 'UserRejectedRequestError' ||
         error.message?.includes('User rejected') ||
         error.message?.includes('rejected') ||
         error.message?.includes('Request denied'))

      const msg = isRejection
        ? 'Signature rejected. Click Sign In to continue.'
        : (error instanceof Error ? error.message : 'Authentication failed')

      setState({
        isAuthenticated: false,
        isLoading: false,
        error: msg,
        address: null,
        isAdmin: false,
        hasRejected: isRejection,
      })
      setApiAuthenticated(false)

      if (isRejection) {
        console.log('[useSiweAuth] User rejected signature')
      } else {
        console.error('[useSiweAuth] Auth failed:', error)
      }
      return false
    }
  }, [address, chainId, connector, signMessageAsync])

  // No auto-authenticate: SIWE signing is user-initiated via AccessGate button only

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        address: null,
        isAdmin: false,
        hasRejected: false,
      })
      setApiAuthenticated(false)
    }
  }, [])

  const retry = useCallback(() => {
    setState(s => ({ ...s, hasRejected: false, error: null }))
  }, [])

  return {
    ...state,
    sessionChecked,
    authenticate,
    logout,
    retry,
  }
}
