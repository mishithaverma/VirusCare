import { ReactNode } from 'react'
import {
  LayoutDashboard,
  Thermometer,
  Stethoscope,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'
import { Role } from './logic'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'nurse', 'doctor', 'manager'] },
  { to: '/temperature', label: 'Temperature', icon: <Thermometer size={18} />, roles: ['nurse'] },
  { to: '/visits', label: 'Doctor Visits', icon: <Stethoscope size={18} />, roles: ['doctor'] },
  { to: '/discharge', label: 'Discharge', icon: <ClipboardCheck size={18} />, roles: ['admin', 'doctor'] },
  { to: '/patients', label: 'Patients', icon: <Users size={18} />, roles: ['admin', 'manager'] },
  { to: '/reports', label: 'Reports', icon: <BarChart3 size={18} />, roles: ['manager'] },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} />, roles: ['admin', 'nurse', 'doctor', 'manager'] },
]

export const navForRole = (role: Role) => NAV_ITEMS.filter((n) => n.roles.includes(role))
