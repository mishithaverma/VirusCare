import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ShieldCheck } from 'lucide-react'
import { Role } from '../logic'
import { useAuth, ROLE_TITLES, USER_NAMES } from '../state/AuthContext'
import { Button, Input, Field, cx } from '../components/ui'

const ROLES: Role[] = ['admin', 'nurse', 'doctor', 'manager']

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('nurse')

  const signIn = () => {
    login(role)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-navy p-10 text-white lg:flex">
        <div className="flex items-center gap-2 font-bold">
          <Activity /> VirusCare
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Coordinated care for a<br />quarantine &amp; treatment facility
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Track daily temperatures, coordinate doctor visits, manage discharges against the 3-day
            fever-free rule, and monitor outcomes against the 15% mortality benchmark.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><ShieldCheck size={16} /> Role-based access &amp; full activity log</li>
            <li className="flex items-center gap-2"><ShieldCheck size={16} /> 74-bed capacity &amp; room management</li>
            <li className="flex items-center gap-2"><ShieldCheck size={16} /> Outcome reporting &amp; trends</li>
          </ul>
        </div>
        <p className="text-xs text-white/40">Demonstration build &middot; data stored locally in your browser</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 text-navy lg:hidden">
            <Activity /> <span className="text-xl font-bold">VirusCare</span>
          </div>
          <h2 className="text-xl font-bold text-navy">Sign in</h2>
          <p className="mb-6 text-sm text-slate-500">Select your role to continue to the console.</p>

          <div className="space-y-3">
            <Field label="Email">
              <Input defaultValue="staff@viruscare.health" />
            </Field>
            <Field label="Password">
              <Input type="password" defaultValue="demo-password" />
            </Field>
          </div>

          <p className="mt-5 mb-2 text-xs font-medium text-slate-600">Sign in as</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cx(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  role === r ? 'border-navy bg-navy-50 text-navy' : 'border-slate-200 text-slate-600 hover:border-navy/40',
                )}
              >
                <div className="font-medium capitalize">{r}</div>
                <div className="text-[11px] text-slate-400">{USER_NAMES[r]}</div>
              </button>
            ))}
          </div>

          <Button className="mt-5 w-full" onClick={signIn}>
            Continue as {ROLE_TITLES[role]}
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Demo mode &mdash; authentication is simulated. Choose any role to explore.
          </p>
        </div>
      </div>
    </div>
  )
}
