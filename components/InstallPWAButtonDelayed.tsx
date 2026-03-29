'use client'

import { useEffect, useState } from 'react'
import { InstallPWAButton } from '@/components/InstallPWAButton'

/**
 * InstallPWAButtonDelayed component
 * Wraps InstallPWAButton and delays its appearance by 4 seconds (or 0 in dev)
 */
export function InstallPWAButtonDelayed() {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    console.log('[PWA] InstallPWAButtonDelayed mounted, will show prompt')
    
    // In development, show immediately for testing; in production, delay 4s
    const isDev = process.env.NODE_ENV === 'development'
    const delay = isDev ? 100 : 4000
    
    const timer = setTimeout(() => {
      console.log('[PWA] Showing install prompt now')
      setShowButton(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [])

  if (!showButton) {
    return null
  }

  return <InstallPWAButton />
}
