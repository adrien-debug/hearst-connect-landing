'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface PatternBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function PatternBackground({ children, className = '', ...props }: PatternBackgroundProps) {
  return (
    <div className={`relative min-h-screen bg-(--color-bg-primary) overflow-hidden ${className}`} {...props}>
      {/* Pattern Background Layer */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/pattern-bg.svg')" }}
      />
      
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
