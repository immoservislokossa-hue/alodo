'use client'

import { useEffect, useState } from 'react'
import { Download, Check } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * InstallPWAButton component
 * Displays install button for PWA installation
 * Handles beforeinstallprompt event
 */
export function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
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

  // Don't render if already installed or no install prompt available
  if (isInstalled || !installPrompt) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#008751] to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Installation...
        </>
      ) : (
        <>
          <Download size={18} />
          Installer l&apos;app
        </>
      )}
    </button>
  )
}

/**
 * Alternative: Mobile-focused install button
 * Shows only on mobile devices
 */
export function InstallPWAButtonMobile() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Only show on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    if (!isMobile) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

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

  if (isInstalled || !installPrompt) {
    return null
  }

  const handleInstall = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border-l-4 border-[#008751]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Installer ALODO</h3>
          <p className="text-sm text-gray-600">Accédez rapidement à l&apos;application</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-3 py-2 bg-[#008751] text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download size={16} />
          Installer
        </button>
      </div>
    </div>
  )
}
