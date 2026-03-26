import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface AuthState {
  token: string | null
  adminId: string
  adminName: string
  adminEmail: string
  isSuperAdmin: boolean
}

interface AuthContextType extends AuthState {
  saveAuth: (token: string, id: string, name: string, email: string, isSuperAdmin: boolean) => void
  clearAuth: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const KEYS = {
  token: 'admin_token',
  id: 'admin_id',
  name: 'admin_name',
  email: 'admin_email',
  superAdmin: 'admin_is_super',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: localStorage.getItem(KEYS.token),
    adminId: localStorage.getItem(KEYS.id) ?? '',
    adminName: localStorage.getItem(KEYS.name) ?? '',
    adminEmail: localStorage.getItem(KEYS.email) ?? '',
    isSuperAdmin: localStorage.getItem(KEYS.superAdmin) === 'true',
  }))

  const saveAuth = useCallback(
    (token: string, id: string, name: string, email: string, isSuperAdmin: boolean) => {
      localStorage.setItem(KEYS.token, token)
      localStorage.setItem(KEYS.id, id)
      localStorage.setItem(KEYS.name, name)
      localStorage.setItem(KEYS.email, email)
      localStorage.setItem(KEYS.superAdmin, String(isSuperAdmin))
      setState({ token, adminId: id, adminName: name, adminEmail: email, isSuperAdmin })
    },
    [],
  )

  const clearAuth = useCallback(() => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
    setState({ token: null, adminId: '', adminName: '', adminEmail: '', isSuperAdmin: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, saveAuth, clearAuth, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
