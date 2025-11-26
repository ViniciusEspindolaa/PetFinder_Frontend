'use client'

import { useEffect } from 'react'

export function HighContrastManager() {
  useEffect(() => {
    const isHighContrast = localStorage.getItem('high-contrast') === 'true'
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Listen for storage changes to sync across tabs/windows
    const handleStorageChange = () => {
      const isHighContrast = localStorage.getItem('high-contrast') === 'true'
      if (isHighContrast) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Custom event for in-app toggling
    window.addEventListener('high-contrast-change', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('high-contrast-change', handleStorageChange)
    }
  }, [])

  return null
}
