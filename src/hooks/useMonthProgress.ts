'use client'

import { useEffect, useState } from 'react'
const MS_PER_MINUTE = 60_000

const INITIAL_DAY = 12
const INITIAL_DAYS_IN_MONTH = 30

export function useMonthProgress() {
  const [dayOfMonth, setDayOfMonth] = useState(INITIAL_DAY)
  const [daysInMonth, setDaysInMonth] = useState(INITIAL_DAYS_IN_MONTH)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDayOfMonth(now.getDate())
      setDaysInMonth(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
    }
    update()
    const id = setInterval(update, MS_PER_MINUTE)
    return () => clearInterval(id)
  }, [])

  const progress = Math.min(1, dayOfMonth / daysInMonth)
  const daysRemaining = daysInMonth - dayOfMonth

  return {
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    progress,
  }
}
