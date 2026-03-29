'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/register-sw'

/**
 * PWAProvider component
 * Registers Service Worker on mount
 * Should be placed in root layout as a client component
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker()
  }, [])

  return <>{children}</>
}
