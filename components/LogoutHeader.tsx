"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import supabase from "@/src/lib/supabase/browser"

export default function LogoutHeader() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setUser(data.user ?? null)
      } catch (e) {
        console.error('LogoutHeader getUser error', e)
        if (mounted) setUser(null)
      } finally {
        if (mounted) setChecking(false)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_IN') setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') setUser(null)
    })

    return () => {
      mounted = false
      // @ts-ignore
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      setLoading(false)
      router.replace('/langue')
    }
  }

  const handleLangue = () => {
    router.push('/langue')
  }

  if (checking) return null

  return (
    <header style={{ width: '100%', borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fff', position: 'fixed', top: 0, left: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push('/') }>
          <img src="/icon-192x192.png" alt="ALODO" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <strong style={{ fontSize: 16, color: '#0a2a44' }}>ALODO</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{ background: loading ? '#e5e7eb' : '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
            >
              {loading ? 'Déconnexion...' : 'Se déconnecter'}
            </button>
          ) : (
            <button onClick={handleLangue} style={{ background: '#0a66ff', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Langue</button>
          )}
        </div>
      </div>
    </header>
  )
}
