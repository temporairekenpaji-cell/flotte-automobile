import { Link } from 'react-router-dom'

const APP_VERSION = '1.0.0'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 bg-slate-900/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          {/* Copyright */}
          <p>
            © {year}{' '}
            <span className="text-slate-400 font-medium">Gestion Flotte — Société ATL</span>
            {' '}— Tous droits réservés
          </p>

          {/* Links + version */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              to="/privacy-policy"
              className="hover:text-emerald-400 transition-colors"
            >
              Politique de confidentialité
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              to="/terms-of-use"
              className="hover:text-emerald-400 transition-colors"
            >
              Conditions d'utilisation
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-600">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
