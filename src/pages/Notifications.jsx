import { useEffect, useState } from 'react'
import { FiBell, FiCheck, FiMail, FiCalendar, FiTruck, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi'
import { getNotifications, updateNotification, markAllAsRead } from '../services/notifications'
import { useFetch } from '../hooks/useFetch'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [message, setMessage] = useState(null)
  const { loading, run } = useFetch()

  const fetchNotifications = async () => {
    try {
      const response = await run(getNotifications({ urgency: 'true' }))
      setNotifications(response.results || response)
    } catch (err) {
      console.error('Erreur lors du chargement des notifications :', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      await run(updateNotification(id, { is_read: true }))
      setMessage('Notification marquée comme lue.')
      fetchNotifications()
      // Dispatch custom event to update navbar/sidebar counts globally
      window.dispatchEvent(new Event('unreadNotificationsUpdated'))
    } catch (err) {
      setMessage('Impossible de mettre à jour la notification.')
    }
  }

  const handleMarkAllAsRead = async () => {
    if (notifications.filter(n => !n.is_read).length === 0) return
    try {
      await run(markAllAsRead())
      setMessage('Toutes les notifications ont été marquées comme lues.')
      fetchNotifications()
      window.dispatchEvent(new Event('unreadNotificationsUpdated'))
    } catch (err) {
      setMessage('Erreur lors de la mise à jour des notifications.')
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'read') return notif.is_read
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Alertes Administratives</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Notifications internes</h2>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={notifications.filter(n => !n.is_read).length === 0}
          className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition border border-slate-750"
        >
          <FiCheck className="h-4 w-4 text-emerald-400" /> Tout marquer comme lu
        </button>
      </div>

      {message && (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
          <FiCheck className="h-5 w-5" />
          {message}
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
        
        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Non lues ({notifications.filter(n => !n.is_read).length})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
              filter === 'read' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lues ({notifications.filter(n => n.is_read).length})
          </button>
        </div>

        {/* Notifications list */}
        {loading && notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400">Chargement des notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="rounded-full bg-slate-950 p-6 border border-slate-850 mb-4">
              <FiMail className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-white">Aucune notification</h3>
            <p className="text-xs text-slate-500 mt-1">Vous n'avez pas d'alertes correspondant à ce filtre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const isExpired = notif.message.toLowerCase().includes('expiré')
              
              return (
                <div
                  key={notif.id}
                  className={`relative rounded-2xl border p-4 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    !notif.is_read 
                      ? 'bg-slate-950/60 border-slate-700/65 shadow-md shadow-emerald-500/2'
                      : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Left part: Icon & Message */}
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 rounded-full p-2 border ${
                      !notif.is_read
                        ? isExpired 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {isExpired ? (
                        <FiAlertCircle className="h-5 w-5" />
                      ) : (
                        <FiAlertTriangle className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FiTruck className="h-3 w-3 text-emerald-400" /> {notif.vehicle_plate}
                        </span>
                        {notif.document_type_display && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            {notif.document_type_display}
                          </span>
                        )}
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400" title="Non lue" />
                        )}
                      </div>
                      <p className="text-sm text-slate-200 pr-4">{notif.message}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <FiCalendar className="h-3.5 w-3.5" />
                        <span>Créé le : {new Date(notif.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right part: Actions */}
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="self-end md:self-center inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-750 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                    >
                      <FiCheck className="h-4 w-4 text-emerald-400" /> Marquer lue
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
