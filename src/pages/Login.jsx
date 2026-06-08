import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showEmail, setShowEmail] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (!accepted) {
      setError("Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité pour continuer.")
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const data = err?.response?.data
      if (!err?.response) {
        setError(
          'Impossible de joindre le serveur API. Vérifiez votre connexion Internet.',
        )
      } else if (data?.detail) {
        setError(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      } else if (data?.non_field_errors) {
        setError(Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : String(data.non_field_errors))
      } else {
        const parts = Object.entries(data || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
        setError(parts.length ? parts.join('\n') : 'Identifiants incorrects ou compte non autorisé.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/40">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400/80">Application de gestion de flotte</p>
          <h1 className="text-4xl font-semibold text-white">Connexion</h1>
          <p className="text-slate-400">Connexion administrateur — accédez au tableau de bord après authentification.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Identifiant ou Email</label>
            <div className="relative">
              <input
                type={showEmail ? "text" : "password"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 pl-4 pr-12 py-3 text-white outline-none transition focus:border-emerald-400"
                placeholder="nom@entreprise.com"
              />
              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showEmail ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 pl-4 pr-12 py-3 text-white outline-none transition focus:border-emerald-400"
                placeholder="•••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* ── Consentement légal ── */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-emerald-500 cursor-pointer"
              />
              <span className="text-sm text-slate-400 leading-relaxed">
                J'accepte les{' '}
                <Link
                  to="/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition"
                >
                  Conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition"
                >
                  Politique de confidentialité
                </Link>{' '}
                de l'application.
              </span>
            </label>
          </div>

          {error ? <p className="text-sm text-rose-400 whitespace-pre-line">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

      {/* Footer légal sous le formulaire */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
        <Link to="/privacy-policy" className="hover:text-slate-400 transition">Politique de confidentialité</Link>
        <span>·</span>
        <Link to="/terms-of-use" className="hover:text-slate-400 transition">Conditions d'utilisation</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} Société ATL — v1.0.0</span>
      </div>
    </div>
  )
}
