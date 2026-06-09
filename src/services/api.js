import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('fleet_token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // S'assurer de ne pas tourner en boucle
      if (!response.config.url.includes('/dashboard/')) {
        window.dispatchEvent(new CustomEvent('triggerDashboardRefresh'))
        window.dispatchEvent(new CustomEvent('globalDataMutation'))
      }
    }
    return response
  },
  (error) => {
    if (error?.response?.status === 401) {
      window.localStorage.removeItem('fleet_token')
      window.localStorage.removeItem('fleet_user')
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export default api
