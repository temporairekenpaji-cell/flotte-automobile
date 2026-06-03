import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">Page non trouvée</p>
        <h1 className="mt-4 text-6xl font-semibold text-white">404</h1>
        <p className="mt-4 text-lg text-slate-400">La page recherchée est introuvable. Revenez à l’espace de gestion.</p>
        <Link to="/" className="mt-8 inline-flex rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
