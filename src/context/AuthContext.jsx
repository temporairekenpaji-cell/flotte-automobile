import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { login as authLogin, logout as authLogout } from '../services/auth'
import api from '../services/api'

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async (tokenVal) => {
      try {
        const response = await api.get('/users/me/', {
          headers: { Authorization: `Bearer ${tokenVal}` }
        })
        if (response.data) {
          const userProfile = response.data
          window.localStorage.setItem('fleet_user', JSON.stringify(userProfile))
          setUser(userProfile)
        }
      } catch (err) {
        console.error("Impossible de rafraîchir le profil utilisateur :", err)
      }
    }

    const storedToken = window.localStorage.getItem('fleet_token')
    const storedUser = window.localStorage.getItem('fleet_user')
    if (storedToken) {
      setToken(storedToken)
      setUser(storedUser ? JSON.parse(storedUser) : { email: '' })
      fetchProfile(storedToken)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return

    const pollData = async () => {
      try {
        const response = await api.get('/dashboard/')
        if (response.data) {
          window.sessionStorage.setItem('fleet_dashboard_summary', JSON.stringify(response.data))
          const event = new CustomEvent('dashboardDataUpdated', { detail: response.data })
          window.dispatchEvent(event)
        }
      } catch (err) {
        console.error("Erreur lors de la synchronisation en arrière-plan :", err)
      }
    }

    pollData()
    const interval = setInterval(pollData, 5000)

    const handleManualTrigger = () => {
      pollData()
    }
    window.addEventListener('triggerDashboardRefresh', handleManualTrigger)

    return () => {
      clearInterval(interval)
      window.removeEventListener('triggerDashboardRefresh', handleManualTrigger)
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    const response = await authLogin(email, password)
    const savedToken = response.token || response.access || ''
    if (!savedToken) {
      throw new Error('Authentification échouée')
    }
    const userProfile = response.user || { email }
    window.localStorage.setItem('fleet_token', savedToken)
    window.localStorage.setItem('fleet_user', JSON.stringify(userProfile))
    setToken(savedToken)
    setUser(userProfile)
    return savedToken
  }, [])

  const logout = useCallback(() => {
    authLogout()
    window.localStorage.removeItem('fleet_token')
    window.localStorage.removeItem('fleet_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
