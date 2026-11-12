import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, Bell, LogOut, Menu, CalendarClock, RotateCcw } from 'lucide-react'
import { useAuth, ROLE_TITLES } from '../state/AuthContext'
import { useFacility } from '../state/FacilityContext'
import { useConfirm } from './ConfirmDialog'
import { navForRole } from '../navigation'
import { Badge, cx } from './ui'

function Notifications() {
  const { stats } = useFacility()
  const [open, setOpen] = useState(false)
  const items: { tone: 'orange' | 'red'; text: string }[] = []
  if (stats.tPend.length) items.push({ tone: 'orange', text: `${stats.tPend.length} temperature(s) pending today` })
  if (stats.vPend.length) items.push({ tone: 'orange', text: `${stats.vPend.length} doctor visit(s) pending today` })
  if (stats.delayed.length)
    items.push({ tone: 'orange', text: `${stats.delayed.length} patient(s) awaiting discharge` })
  if (stats.mort > 15) items.push({ tone: 'red', text: `Mortality ${stats.mort.toFixed(1)}% exceeds the 15% benchmark` })

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-pop animate-fade-in">
            <p className="px-2 py-1 text-xs font-semibold text-slate-400">Notifications</p>
            {items.length ? (
              items.map((it, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', it.tone === 'red' ? 'bg-red-500' : 'bg-orange-500')} />
                  {it.text}
                </div>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-slate-400">You are all caught up.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function Layout() {
  const { role, name, logout } = useAuth()
  const { db, today, advanceDay, reset } = useFacility()
  const confirm = useConfirm()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  if (!role) return null
  const items = navForRole(role)

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 text-white">
        <Activity size={22} />
        <div>
          <div className="font-bold leading-tight">VirusCare</div>
          <div className="text-[10px] uppercase tracking-wide text-white/60">Patient Management</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            {it.icon}
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3 text-xs text-white/60">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="font-medium text-white/80">{name}</div>
          <div>{ROLE_TITLES[role]}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-navy lg:block no-print">{SidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden no-print">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-navy animate-slide-in">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-navy px-4 py-3 text-white no-print">
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="hidden text-sm text-white/80 sm:block">{db.settings.facilityName}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Badge tone="blue">
              <CalendarClock size={12} /> {today}
            </Badge>
            <button className="hidden items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10 sm:flex" onClick={advanceDay}>
              <CalendarClock size={14} /> Next day
            </button>
            <button
              className="hidden items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10 sm:flex"
              onClick={async () => {
                if (
                  await confirm({
                    title: 'Reset demo data?',
                    message: 'This restores the seeded demonstration dataset and discards your current changes.',
                    confirmLabel: 'Reset',
                    danger: true,
                  })
                )
                  reset()
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
            <Notifications />
            <button
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10"
              onClick={async () => {
                if (await confirm({ title: 'Sign out?', message: 'You will return to the login screen.', confirmLabel: 'Sign out' }))
                  logout()
              }}
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main key={location.pathname} className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
