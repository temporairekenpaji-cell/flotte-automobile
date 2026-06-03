import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { login as authLogin, logout as authLogout } from '../services/auth'

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
    const storedToken = window.localStorage.getItem('fleet_token')
    const storedUser = window.localStorage.getItem('fleet_user')
    if (storedToken) {
      setToken(storedToken)
      setUser(storedUser ? JSON.parse(storedUser) : { email: '' })
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authLogin(email, password)
    const savedToken = response.token || response.access || ''
    if (!savedToken) {
      throw new Error('Authentification échouée')
    }
    window.localStorage.setItem('fleet_token', savedToken)
    window.localStorage.setItem('fleet_user', JSON.stringify({ email }))
    setToken(savedToken)
    setUser({ email })
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
