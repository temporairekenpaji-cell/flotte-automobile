import axios from 'axios'
import { cacheGet, cachePut, queueAdd } from './offlineDB'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Construire une clé de cache reproductible à partir de la config Axios
function buildCacheKey(config) {
  let key = config.url || ''
  if (config.params && Object.keys(config.params).length > 0) {
    const sorted = Object.entries(config.params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
    const qs = new URLSearchParams(sorted).toString()
    if (qs) key += '?' + qs
  }
  return key
}

// ─── Intercepteur de requêtes — injecter le token d'authentification ──────────

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('fleet_token')
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})

// ─── Intercepteur de réponses ─────────────────────────────────────────────────

api.interceptors.response.use(
  async (response) => {
    const method = response.config?.method?.toUpperCase()

    // Mettre en cache toutes les réponses GET réussies dans IndexedDB
    if (method === 'GET' && response.status === 200) {
      const key = buildCacheKey(response.config)
      cachePut(key, response.data).catch(() => {})
    }

    // Déclencher le rafraîchissement du dashboard après toute mutation
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!response.config.url?.includes('/dashboard/')) {
        window.dispatchEvent(new CustomEvent('triggerDashboardRefresh'))
        window.dispatchEvent(new CustomEvent('globalDataMutation'))
      }
    }

    return response
  },

  async (error) => {
    // 1. Erreur 401 → déconnexion
    if (error?.response?.status === 401) {
      window.localStorage.removeItem('fleet_token')
      window.localStorage.removeItem('fleet_user')
      window.location.replace('/login')
      return Promise.reject(error)
    }

    // 2. Erreur réseau (hors ligne) → fallback intelligent
    const isNetworkError = !error.response && !navigator.onLine
    if (isNetworkError && error.config) {
      const method = error.config.method?.toUpperCase()
      const cacheKey = buildCacheKey(error.config)

      // GET hors ligne → servir depuis IndexedDB
      if (method === 'GET') {
        const cached = await cacheGet(cacheKey)
        if (cached) {
          console.log(`[Offline] Cache hit : ${cacheKey}`)
          return { data: cached, status: 200, headers: {}, config: error.config, _fromCache: true }
        }
      }

      // Mutation hors ligne → mettre en file d'attente
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        let bodyData = null
        try {
          bodyData = error.config.data
            ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data)
            : null
        } catch { bodyData = null }

        await queueAdd({ method: error.config.method, endpoint: error.config.url, data: bodyData })
        window.dispatchEvent(new CustomEvent('offlineQueueChanged'))
        console.log(`[Offline] Opération mise en attente : ${method} ${error.config.url}`)
        // Réponse optimiste pour ne pas bloquer l'interface
        return { data: { _offline: true }, status: 200, headers: {}, config: error.config, _offline: true }
      }
    }

    return Promise.reject(error)
  },
)

export default api
