/**
 * Register Service Worker for PWA functionality
 * Only runs in browser environment
 */
export async function registerServiceWorker() {
  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('Service Worker registered successfully:', registration)

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60000) // Check every minute

    return true
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}

/**
 * Unregister Service Worker (if needed)
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (let registration of registrations) {
      await registration.unregister()
    }
    console.log('Service Workers unregistered')
    return true
  } catch (error) {
    console.error('Failed to unregister Service Workers:', error)
    return false
  }
}
