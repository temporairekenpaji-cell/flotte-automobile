import { useEffect, useState } from 'react'
import { FiUser, FiMail, FiLock, FiShield, FiSave } from 'react-icons/fi'
import { getProfile, updateProfile } from '../services/settings'
import { useFetch } from '../hooks/useFetch'

export default function Settings() {
  const [profile, setProfile] = useState({ username: '', email: '', first_name: '', last_name: '', password: '' })
  const [message, setMessage] = useState(null)
  const { loading, error, run } = useFetch()

  const loadProfile = async () => {
    try {
      const response = await run(getProfile())
      setProfile({
        username: response.username || '',
        email: response.email || '',
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        password: '',
      })
    } catch (err) {
      console.error('Erreur chargement profil:', err)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((curr) => ({ ...curr, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
      }
      if (profile.password) {
        payload.password = profile.password
      }
      await run(updateProfile(payload))
      setMessage('Profil mis à jour avec succès.')
      setProfile(curr => ({ ...curr, password: '' }))
    } catch (err) {
      setMessage('Erreur lors de la mise à jour.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Système & Compte</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Paramètres Professionnels</h2>
        </div>
      </div>

      {message ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20">
          <h3 className="text-xl font-semibold text-white">Profil Utilisateur</h3>
          <p className="mt-1 text-sm text-slate-400">Gérez vos informations de connexion et vos accès.</p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Prénom</label>
                <input
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Nom</label>
                <input
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Nom d'utilisateur (Identifiant de connexion)</label>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3">
                <FiUser className="h-5 w-5 text-slate-400" />
                <input
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Adresse Email</label>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3">
                <FiMail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3">
                <FiLock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={profile.password}
                  onChange={handleChange}
                  className="w-full bg-transparent text-white outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <FiSave className="h-4 w-4" /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400">
                <FiShield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Rôle et Sécurité</p>
                <p className="text-xl font-semibold text-white">Super Administrateur</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Vous disposez des privilèges complets en lecture et écriture sur toute l'infrastructure PostgreSQL et l'API Django.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
