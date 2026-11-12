import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { Role } from '../logic'

export const USER_NAMES: Record<Role, string> = {
  admin: 'Admin Anita',
  nurse: 'Nurse Priya',
  doctor: 'Dr. Rao',
  manager: 'Manager Mehra',
}

export const ROLE_TITLES: Record<Role, string> = {
  admin: 'Administrative Staff',
  nurse: 'Registered Nurse',
  doctor: 'Attending Doctor',
  manager: 'Facility Manager',
}

interface AuthValue {
  role: Role | null
  name: string
  login: (role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
const SESSION_KEY = 'viruscare-role'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    return saved ? (saved as Role) : null
  })

  const login = (r: Role) => {
    sessionStorage.setItem(SESSION_KEY, r)
    setRole(r)
  }
  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setRole(null)
  }

  const value = useMemo<AuthValue>(
    () => ({ role, name: role ? USER_NAMES[role] : '', login, logout }),
    [role],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
