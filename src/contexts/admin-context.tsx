'use client'

import { createContext, useContext, ReactNode } from 'react'

interface AdminContextValue {
  // Add admin-specific state here if needed
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  // Add admin state management here
  return (
    <AdminContext.Provider value={{}}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
