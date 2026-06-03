import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FiBell, FiLogOut } from 'react-icons/fi'
import { getUnreadCount } from '../services/notifications'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    try {
      if (user) {
        const response = await getUnreadCount()
        const count = response.data?.count ?? 0
        setUnreadCount(count)
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Listen to custom update event
    window.addEventListener('unreadNotificationsUpdated', fetchUnreadCount)
    // Also poll every 60 seconds just in case the scheduler updates it in background
    const interval = setInterval(fetchUnreadCount, 60000)

    return () => {
      window.removeEventListener('unreadNotificationsUpdated', fetchUnreadCount)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tableau de bord transport</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Gestion de flotte professionnelle</h2>
        </div>
        <div className="flex items-center gap-3">
          
          {user && (
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Notifications"
            >
              <FiBell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <FiLogOut className="h-4 w-4" /> Déconnexion
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
