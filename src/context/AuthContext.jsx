import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { login as authLogin, logout as authLogout } from '../services/auth'
import { queueGetAll, queueDelete, queueCount } from '../services/offlineDB'
import api from '../services/api'
import axios from 'axios'

export const AuthContext = createContext({
  user: null, token: null, loading: false,
  isOnline: true, isSyncing: false, pendingCount: 0,
  login: async () => {}, logout: () => {},
})

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const isSyncingRef = useRef(false)

  // Rafraîchir le compteur de la file d'attente
  const refreshPendingCount = useCallback(async () => {
    const count = await queueCount()
    setPendingCount(count)
  }, [])

  // Synchroniser les opérations en attente avec le serveur
  const syncPendingOperations = useCallback(async (currentToken) => {
    if (isSyncingRef.current || !navigator.onLine) return
    const tkn = currentToken || window.localStorage.getItem('fleet_token')
    if (!tkn) return

    const pending = await queueGetAll()
    if (pending.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)
    console.log(`[Sync] Démarrage de la synchronisation — ${pending.length} opération(s) en attente`)

    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    for (const op of pending) {
      try {
        await axios({
          method: op.method,
          url: `${BASE}${op.endpoint}`,
          headers: { Authorization: `Bearer ${tkn}`, 'Content-Type': 'application/json' },
          ...(op.data ? { data: op.data } : {}),
        })
        await queueDelete(op.id)
        console.log(`[Sync] ✓ ${op.method?.toUpperCase()} ${op.endpoint}`)
      } catch (err) {
        console.error(`[Sync] ✗ ${op.method?.toUpperCase()} ${op.endpoint}`, err?.response?.status)
      }
    }

    isSyncingRef.current = false
    setIsSyncing(false)
    await refreshPendingCount()
    window.dispatchEvent(new CustomEvent('globalDataMutation'))
    window.dispatchEvent(new CustomEvent('triggerDashboardRefresh'))
  }, [refreshPendingCount])

  // Initialisation : lire le token et le profil du localStorage
  useEffect(() => {
    const fetchProfile = async (tokenVal) => {
      try {
        const response = await api.get('/users/me/', { headers: { Authorization: `Bearer ${tokenVal}` } })
        if (response.data) {
          window.localStorage.setItem('fleet_user', JSON.stringify(response.data))
          setUser(response.data)
        }
      } catch (err) {
        console.error('Impossible de rafraîchir le profil utilisateur :', err)
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
    refreshPendingCount()
  }, [refreshPendingCount])

  // Polling de fond (dashboard) + écoute des mutations
  useEffect(() => {
    if (!token) return
    const pollData = async () => {
      try {
        const response = await api.get('/dashboard/')
        if (response.data) {
          window.sessionStorage.setItem('fleet_dashboard_summary', JSON.stringify(response.data))
          window.dispatchEvent(new CustomEvent('dashboardDataUpdated', { detail: response.data }))
        }
      } catch { /* hors ligne — silencieux */ }
    }
    pollData()
    const interval = setInterval(pollData, 5000)
    const handleManualTrigger = () => pollData()
    window.addEventListener('triggerDashboardRefresh', handleManualTrigger)
    return () => {
      clearInterval(interval)
      window.removeEventListener('triggerDashboardRefresh', handleManualTrigger)
    }
  }, [token])

  // Surveiller l'état de la connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Lancer la sync dès le retour d'Internet
      setTimeout(() => syncPendingOperations(), 500)
    }
    const handleOffline = () => setIsOnline(false)
    const handleQueueChange = () => refreshPendingCount()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offlineQueueChanged', handleQueueChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offlineQueueChanged', handleQueueChange)
    }
  }, [syncPendingOperations, refreshPendingCount])

  const login = useCallback(async (email, password) => {
    const response = await authLogin(email, password)
    const savedToken = response.token || response.access || ''
    if (!savedToken) throw new Error('Authentification échouée')
    const userProfile = response.user || { email }
    window.localStorage.setItem('fleet_token', savedToken)
    window.localStorage.setItem('fleet_user', JSON.stringify(userProfile))
    setToken(savedToken)
    setUser(userProfile)
    // Sync éventuelle après reconnexion
    setTimeout(() => syncPendingOperations(savedToken), 1000)
    return savedToken
  }, [syncPendingOperations])

  const logout = useCallback(() => {
    authLogout()
    window.localStorage.removeItem('fleet_token')
    window.localStorage.removeItem('fleet_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, isOnline, isSyncing, pendingCount, login, logout }),
    [user, token, loading, isOnline, isSyncing, pendingCount, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
