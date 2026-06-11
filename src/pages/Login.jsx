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

  const [showColdStartWarning, setShowColdStartWarning] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (!accepted) {
      setError("Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité pour continuer.")
      return
    }

    setLoading(true)
    setShowColdStartWarning(false)

    // Détecter si Render dort (avertir après 4 secondes)
    const coldStartTimer = setTimeout(() => {
      setShowColdStartWarning(true)
    }, 4000)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (!err?.response) {
        setError(
          'Connexion impossible. Veuillez vérifier votre connexion Internet ou le démarrage du serveur API.',
        )
      } else if (err.response.status === 401 || err.response.status === 400) {
        setError('Identifiant ou mot de passe incorrect.')
      } else {
        setError('Connexion impossible. Veuillez vérifier vos informations.')
      }
    } finally {
      clearTimeout(coldStartTimer)
      setLoading(false)
      setShowColdStartWarning(false)
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

          {showColdStartWarning && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-xs text-amber-300 animate-pulse">
              Le serveur de production est en veille (Render). Démarrage en cours... Merci de patienter quelques secondes.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vérification en cours...
              </>
            ) : 'Se connecter'}
          </button>
        </form>
      </div>

      {/* Footer légal sous le formulaire */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
        <Link to="/privacy-policy" className="hover:text-slate-400 transition">Politique de confidentialité</Link>
        <span>·</span>
        <Link to="/terms-of-use" className="hover:text-slate-400 transition">Conditions d'utilisation</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} Société ATL </span>
      </div>
    </div>
  )
}
