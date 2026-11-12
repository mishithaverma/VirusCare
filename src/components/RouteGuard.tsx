import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Role } from '../logic'
import { useAuth } from '../state/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
