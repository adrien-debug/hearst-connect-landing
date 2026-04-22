'use client'

import { useState, useCallback } from 'react'

type TxStatus = 'idle' | 'pending' | 'success' | 'error'

interface TransactionState {
  status: TxStatus
  message: string
  error?: string
}

interface UseTransactionReturn {
  status: TxStatus
  message: string
  error?: string
  isIdle: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  execute: (operation: () => Promise<void>, messages: { pending: string; success: string; error: string }) => Promise<void>
  reset: () => void
}

export function useTransaction(): UseTransactionReturn {
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    message: '',
  })

  const execute = useCallback(async (
    operation: () => Promise<void>,
    messages: { pending: string; success: string; error: string }
  ) => {
    setState({ status: 'pending', message: messages.pending })

    try {
      await operation()
      setState({ status: 'success', message: messages.success })
    } catch (err) {
      setState({
        status: 'error',
        message: messages.error,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', message: '' })
  }, [])

  return {
    status: state.status,
    message: state.message,
    error: state.error,
    isIdle: state.status === 'idle',
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    execute,
    reset,
  }
}
