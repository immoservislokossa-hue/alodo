'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Hook to manage PWA installation
 * Returns state and handlers for install functionality
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    // Check if PWA is supported
    const checkSupport = () => {
      const supported =
        'serviceWorker' in navigator &&
        'onbeforeinstallprompt' in window &&
        window.matchMedia('(display-mode: standalone)').matches === false

      setIsSupported(supported)
    }

    if (checkInstalled()) return

    checkSupport()

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return

    setIsInstalling(true)

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  return {
    installPrompt,
    isInstalled,
    isInstalling,
    isSupported,
    install,
    canInstall: !isInstalled && installPrompt !== null,
  }
}
