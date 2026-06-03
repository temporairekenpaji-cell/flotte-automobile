import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiHome, FiTruck, FiUsers, FiMapPin, FiTool, FiDroplet, FiAlertTriangle, FiBell, FiBarChart2, FiSettings, FiLogOut, FiDollarSign, FiShield } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { getUnreadCount } from '../services/notifications'

const links = [
  { label: 'Dashboard', to: '/', icon: FiHome },
  { label: 'Véhicules', to: '/vehicles', icon: FiTruck },
  { label: 'Chauffeurs', to: '/drivers', icon: FiUsers },
  { label: 'Missions', to: '/missions', icon: FiMapPin },
  { label: 'Maintenance', to: '/maintenance', icon: FiTool },
  { label: 'Carburant', to: '/fuel', icon: FiDroplet },
  { label: 'Péages', to: '/tolls', icon: FiDollarSign },
  { label: 'Prévention Routière', to: '/road-checks', icon: FiShield },
  { label: 'Alertes', to: '/alerts', icon: FiAlertTriangle },
  { label: 'Notifications', to: '/notifications', icon: FiBell },
  { label: 'Statistiques', to: '/statistics', icon: FiBarChart2 },
  { label: 'Paramètres', to: '/settings', icon: FiSettings },
]

export default function Sidebar() {
  const { logout, user } = useAuth()
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
    // Also poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000)

    return () => {
      window.removeEventListener('unreadNotificationsUpdated', fetchUnreadCount)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div>
        <div className="mb-10 flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-xl font-semibold text-emerald-400">
            S.A
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-400/80">Societe ATL</p>
            <h1 className="text-xl font-semibold">Logistics Suite</h1>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-3xl px-4 py-3 text-sm font-medium transition ${isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {label}
                  </div>
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-emerald-400' : 'bg-rose-500 text-white'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800/80 pt-6">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-semibold">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{user?.email || 'Admin'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-rose-400/90 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <FiLogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  )
}
