import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { setToken, clearToken } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('minhal_user')
      const token = localStorage.getItem('minhal_token')
      if (stored && token) {
        const parsed = JSON.parse(stored)
        if (parsed.role === 'superadmin') {
          setUser(parsed)
          setToken(token)
        }
      }
    } catch {}
    setIsLoading(false)
  }, [])

  const login = useCallback((userData, token) => {
    if (userData.role !== 'superadmin') throw new Error('Superadmin access required')
    localStorage.setItem('minhal_token', token)
    localStorage.setItem('minhal_user', JSON.stringify(userData))
    setToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('minhal_token')
    localStorage.removeItem('minhal_user')
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
