import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import {
  CAP,
  DB,
  FEVER,
  Patient,
  Role,
  Settings,
  eligible,
  isActive,
  stamp,
  stats,
  tempOn,
  todayOf,
  visitOn,
} from '../logic'
import { repository } from '../data/repository'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

type Mutator = (d: DB) => string

interface FacilityValue {
  db: DB
  stats: ReturnType<typeof stats>
  today: string
  admit: (name: string, age: number, room: number) => boolean
  recordTemp: (id: string, value: number) => boolean
  visit: (id: string, notes: string, treatment: string, emergency: string) => boolean
  approve: (id: string) => boolean
  discharge: (id: string) => boolean
  recordDeath: (id: string) => boolean
  advanceDay: () => void
  reset: () => void
  updateSettings: (patch: Partial<Settings>) => void
}

const FacilityContext = createContext<FacilityValue | null>(null)

export function FacilityProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => repository.load())
  const { role, name } = useAuth()
  const { push } = useToast()

  // Keep this tab in sync if another tab (or adapter) writes new data.
  useEffect(() => repository.subscribe(setDb), [])

  const persist = (next: DB) => {
    setDb(next)
    repository.save(next)
  }

  const find = (d: DB, id: string) => d.patients.find((p) => p.id === id)!

  // Central mutation pipe: role gate -> validation (error strings start with '!') -> activity log -> toast.
  const act = (allowed: Role[], f: Mutator): boolean => {
    if (!role || !allowed.includes(role)) {
      push('error', 'Your role is not permitted to perform this action.')
      return false
    }
    const draft: DB = structuredClone(db)
    const result = f(draft)
    if (result.startsWith('!')) {
      push('error', result.slice(1))
      return false
    }
    draft.log.unshift({ at: stamp(), by: name, msg: result })
    persist(draft)
    push('success', result)
    return true
  }

  const admit: FacilityValue['admit'] = (patientName, age, room) =>
    act(['admin'], (d) => {
      if (!patientName.trim()) return '!Enter a patient name.'
      if (!(age > 0 && age < 120)) return '!Enter a valid age (1-119).'
      if (d.patients.filter(isActive).length >= CAP)
        return `!Facility is full (${CAP}/${CAP}). Discharge a patient first.`
      if (!(room >= 1 && room <= CAP)) return `!Room must be between 1 and ${CAP}.`
      if (d.patients.some((p) => isActive(p) && p.room === room)) return `!Room ${room} is occupied.`
      const id = 'P' + String(d.patients.length + 1).padStart(3, '0')
      d.patients.push({
        id,
        name: patientName.trim(),
        age,
        room,
        admitted: todayOf(d),
        status: 'active',
        temps: [],
        visits: [],
      })
      return `Admitted ${patientName.trim()} (${id}) to room ${room}.`
    })

  const recordTemp: FacilityValue['recordTemp'] = (id, value) =>
    act(['nurse'], (d) => {
      const p = find(d, id)
      if (!isActive(p)) return '!Patient is not currently admitted.'
      if (tempOn(p, todayOf(d))) return '!Temperature already recorded today. Duplicates are blocked.'
      if (isNaN(value) || value < 34 || value > 42) return '!Enter a value between 34 and 42 C.'
      p.temps.push({ date: todayOf(d), value, by: name, at: new Date().toLocaleTimeString() })
      return `Recorded ${value} C for ${p.name}${value >= FEVER ? ' (FEVER)' : ''}.`
    })

  const visit: FacilityValue['visit'] = (id, notes, treatment, emergency) =>
    act(['doctor'], (d) => {
      const p = find(d, id)
      const t = todayOf(d)
      if (visitOn(p, t)) return '!Visit already completed today.'
      if (!notes.trim() || !treatment.trim()) return '!Notes and treatment are required.'
      if (!tempOn(p, t) && !emergency.trim())
        return '!Temperature not recorded today. Enter an emergency reason to proceed.'
      p.visits.push({
        date: t,
        by: name,
        at: new Date().toLocaleTimeString(),
        notes,
        treatment,
        emergency: !tempOn(p, t) ? emergency : undefined,
      })
      return `Visit completed for ${p.name}${
        !tempOn(p, t) ? ' - FLAGGED: emergency visit without temperature' : ''
      }.`
    })

  const approve: FacilityValue['approve'] = (id) =>
    act(['doctor'], (d) => {
      const p = find(d, id)
      if (!eligible(p, todayOf(d)))
        return '!Not eligible: patient needs 3 consecutive fever-free days.'
      p.status = 'approved'
      p.approvedDate = todayOf(d)
      return `Discharge approved for ${p.name}.`
    })

  const discharge: FacilityValue['discharge'] = (id) =>
    act(['admin'], (d) => {
      const p = find(d, id)
      if (p.status !== 'approved') return '!Doctor approval is required before discharge.'
      p.status = 'discharged'
      p.outcomeDate = todayOf(d)
      const room = p.room
      p.room = null
      return `Discharged ${p.name}; room ${room} released.`
    })

  const recordDeath: FacilityValue['recordDeath'] = (id) =>
    act(['doctor'], (d) => {
      const p = find(d, id)
      p.status = 'deceased'
      p.outcomeDate = todayOf(d)
      const room = p.room
      p.room = null
      return `Death recorded: ${p.name}; room ${room} released.`
    })

  const advanceDay = () => {
    const next = structuredClone(db)
    next.offset++
    next.log.unshift({ at: stamp(), by: name || 'System', msg: 'Advanced simulation to the next day.' })
    persist(next)
    push('info', 'Advanced to the next day (demo).')
  }

  const reset = () => {
    const fresh = repository.reset()
    setDb(fresh)
    push('info', 'Demonstration data has been reset.')
  }

  const updateSettings = (patch: Partial<Settings>) => {
    const next = structuredClone(db)
    next.settings = { ...next.settings, ...patch }
    persist(next)
    push('success', 'Settings updated.')
  }

  const value = useMemo<FacilityValue>(
    () => ({
      db,
      stats: stats(db),
      today: todayOf(db),
      admit,
      recordTemp,
      visit,
      approve,
      discharge,
      recordDeath,
      advanceDay,
      reset,
      updateSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, role, name],
  )

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>
}

export function useFacility() {
  const ctx = useContext(FacilityContext)
  if (!ctx) throw new Error('useFacility must be used within FacilityProvider')
  return ctx
}

export type { Patient }
