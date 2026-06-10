import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function OnlineBadge() {
  const { isOnline, isSyncing, pendingCount } = useContext(AuthContext)

  // Synchronisation en cours
  if (isSyncing) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400"
        title="Synchronisation avec le serveur en cours..."
      >
        <svg className="animate-spin h-2.5 w-2.5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Sync...
      </div>
    )
  }

  // Hors ligne
  if (!isOnline) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400"
        title={pendingCount > 0 ? `${pendingCount} opération(s) en attente — Sera synchronisé dès le retour du réseau` : 'Application hors ligne'}
      >
        <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
        Hors ligne
        {pendingCount > 0 && (
          <span className="bg-rose-500/20 text-rose-300 rounded-full px-1.5 text-[10px] font-semibold">
            {pendingCount}
          </span>
        )}
      </div>
    )
  }

  // En ligne avec opérations en attente
  if (pendingCount > 0) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400"
        title={`${pendingCount} opération(s) en attente de synchronisation`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        {pendingCount} en attente
      </div>
    )
  }

  // En ligne — tout synchronisé
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400"
      title="Application connectée et synchronisée"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      En ligne
    </div>
  )
}
