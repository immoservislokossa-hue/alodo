'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * InstallPWAButton component
 * Modern card-style install prompt: centered top, white card, blue button, emoji, dismiss
 * Falls back to manual instructions if beforeinstallprompt doesn't fire
 */
export function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    console.log('[PWA] InstallPWAButton mounted')

    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    console.log('[PWA] display-mode standalone =', standalone)
    if (standalone) {
      setIsInstalled(true)
      return
    }

    // Check if user dismissed before (skip in dev mode for testing)
    const isDev = process.env.NODE_ENV === 'development'
    const dismissed = isDev ? false : localStorage.getItem('pwa_install_dismissed')
    if (dismissed) {
      console.log('[PWA] User previously dismissed install prompt')
      return
    }

    let promptTimeout: NodeJS.Timeout

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event captured')
      e.preventDefault()
      clearTimeout(promptTimeout)
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      console.log('[PWA] appinstalled event')
      setIsInstalled(true)
      setInstallPrompt(null)
      setShowPrompt(false)
      localStorage.removeItem('pwa_install_dismissed')
    }

    // If beforeinstallprompt doesn't fire within 3 seconds, show fallback
    promptTimeout = setTimeout(() => {
      console.log('[PWA] beforeinstallprompt not available, showing fallback')
      setShowPrompt(true)
    }, 3000)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      clearTimeout(promptTimeout)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) {
      // In dev: simulate installation with a brief loading state
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        console.log('[PWA] Dev mode: simulating installation')
        setIsInstalling(true)
        
        // Simulate download/install delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        console.log('[PWA] Installation simulated, marking as installed')
        setIsInstalled(true)
        setShowPrompt(false)
        setIsInstalling(false)
        return
      }
      return
    }

    setIsInstalling(true)

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted')
        setIsInstalled(true)
      }

      setShowPrompt(false)
      setInstallPrompt(null)
    } catch (error) {
      console.error('[PWA] Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const dismiss = () => {
    console.log('[PWA] User dismissed install prompt')
    localStorage.setItem('pwa_install_dismissed', '1')
    setShowPrompt(false)
  }

  // Don't render if already installed or not showing
  if (isInstalled || !showPrompt) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[420px] bg-white text-gray-900 px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-4 z-[9999] border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="text-3xl flex-shrink-0 pt-0.5">📱</div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base mb-3 leading-tight">
          Installer <span className="font-bold text-blue-600">ALODO</span>
        </p>

        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-md hover:bg-blue-700 transition w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isInstalling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Installation...
            </>
          ) : (
            'Installer l\'application'
          )}
        </button>
      </div>

      <button
        onClick={dismiss}
        className="text-gray-500 hover:text-gray-800 text-2xl font-light px-1 flex-shrink-0 h-6 w-6 flex items-center justify-center"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}

/**
 * Alternative: Mobile-focused install button
 * Shows only on mobile devices with a bottom card design
 */
export function InstallPWAButtonMobile() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user dismissed
    const dismissed = localStorage.getItem('pwa_install_dismissed_mobile')
    if (dismissed) return

    // Only show on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    if (!isMobile) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setShowPrompt(false)
      localStorage.removeItem('pwa_install_dismissed_mobile')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setShowPrompt(false)
      setInstallPrompt(null)
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed_mobile', '1')
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt || !installPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-lg p-4 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-3">
        <div className="text-2xl pt-1">📱</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">
            Installer <span className="text-blue-600 font-bold">ALODO</span>
          </h3>
          <p className="text-xs text-gray-600 mb-3">Accédez rapidement à l'application</p>
          <button
            onClick={handleInstall}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-xs shadow-md hover:bg-blue-700 transition w-full"
          >
            Installer l'application
          </button>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  )
}
