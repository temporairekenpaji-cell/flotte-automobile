import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FiBell, FiLogOut, FiMenu } from 'react-icons/fi'
import { getUnreadCount } from '../services/notifications'

export default function Navbar({ onMenuToggle }) {
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

    const handleDashboardUpdate = (e) => {
      if (e.detail && typeof e.detail.unread_notifications !== 'undefined') {
        setUnreadCount(e.detail.unread_notifications)
      }
    }

    const handleMutation = () => {
      fetchUnreadCount()
    }

    window.addEventListener('dashboardDataUpdated', handleDashboardUpdate)
    window.addEventListener('unreadNotificationsUpdated', handleMutation)
    window.addEventListener('globalDataMutation', handleMutation)

    return () => {
      window.removeEventListener('dashboardDataUpdated', handleDashboardUpdate)
      window.removeEventListener('unreadNotificationsUpdated', handleMutation)
      window.removeEventListener('globalDataMutation', handleMutation)
    }
  }, [user])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        {/* Left side: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu — visible only on mobile */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden rounded-2xl p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Ouvrir le menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500 truncate">Tableau de bord transport</p>
            <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl font-semibold text-white truncate">Gestion de flotte</h2>
          </div>
        </div>

        {/* Right side: actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 sm:p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Notifications"
            >
              <FiBell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <FiLogOut className="h-4 w-4" /> Déconnexion
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
