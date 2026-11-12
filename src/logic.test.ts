import { describe, it, expect } from 'vitest'
import {
  CAP,
  FEVER,
  Patient,
  addDays,
  dischargeDelay,
  eligible,
  feverFree,
  fmt,
  isActive,
  migrate,
  seed,
  stats,
} from './logic'

const base = (over: Partial<Patient> = {}): Patient => ({
  id: 'P001',
  name: 'Test Patient',
  age: 40,
  room: 1,
  admitted: '2026-01-01',
  status: 'active',
  temps: [],
  visits: [],
  ...over,
})

const temp = (date: string, value: number) => ({ date, value, by: 'Nurse', at: '08:00' })

describe('date helpers', () => {
  it('formats dates in local time', () => {
    expect(fmt(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('feverFree', () => {
  const today = '2026-01-10'
  it('counts consecutive fever-free days back from today', () => {
    const p = base({
      temps: [temp('2026-01-08', 36.8), temp('2026-01-09', 37.1), temp('2026-01-10', 36.5)],
    })
    expect(feverFree(p, today)).toBe(3)
  })
  it('stops counting at a fever day', () => {
    const p = base({
      temps: [temp('2026-01-08', 38.5), temp('2026-01-09', 36.9), temp('2026-01-10', 36.7)],
    })
    expect(feverFree(p, today)).toBe(2)
  })
  it('stops counting at a missing day', () => {
    const p = base({ temps: [temp('2026-01-08', 36.8), temp('2026-01-10', 36.7)] })
    expect(feverFree(p, today)).toBe(1)
  })
  it('treats the fever threshold as inclusive', () => {
    const p = base({ temps: [temp('2026-01-10', FEVER)] })
    expect(feverFree(p, today)).toBe(0)
  })
})

describe('eligible', () => {
  const today = '2026-01-10'
  it('is eligible after 3 fever-free days while active', () => {
    const p = base({
      temps: [temp('2026-01-08', 36.8), temp('2026-01-09', 36.9), temp('2026-01-10', 36.7)],
    })
    expect(eligible(p, today)).toBe(true)
  })
  it('is not eligible when already approved', () => {
    const p = base({
      status: 'approved',
      temps: [temp('2026-01-08', 36.8), temp('2026-01-09', 36.9), temp('2026-01-10', 36.7)],
    })
    expect(eligible(p, today)).toBe(false)
  })
})

describe('dischargeDelay', () => {
  const today = '2026-01-10'
  it('reports extra fever-free days beyond the required 3', () => {
    const p = base({
      temps: [
        temp('2026-01-06', 36.6),
        temp('2026-01-07', 36.6),
        temp('2026-01-08', 36.8),
        temp('2026-01-09', 36.9),
        temp('2026-01-10', 36.7),
      ],
    })
    expect(feverFree(p, today)).toBe(5)
    expect(dischargeDelay(p, today)).toBe(2)
  })
  it('counts days since approval for approved patients', () => {
    const p = base({ status: 'approved', approvedDate: '2026-01-08' })
    expect(dischargeDelay(p, today)).toBe(2)
  })
})

describe('status helpers', () => {
  it('treats active and approved as active', () => {
    expect(isActive(base({ status: 'active' }))).toBe(true)
    expect(isActive(base({ status: 'approved' }))).toBe(true)
    expect(isActive(base({ status: 'discharged' }))).toBe(false)
    expect(isActive(base({ status: 'deceased' }))).toBe(false)
  })
})

describe('seed and stats', () => {
  it('seeds within capacity and produces coherent stats', () => {
    const db = seed()
    const s = stats(db)
    expect(s.act.length).toBeLessThanOrEqual(CAP)
    expect(s.total).toBe(db.patients.length)
    expect(s.mort).toBeGreaterThanOrEqual(0)
    expect(s.success).toBeCloseTo(100 - s.mort, 5)
  })
  it('computes mortality as deaths over total admitted', () => {
    const db = seed()
    const s = stats(db)
    expect(s.mort).toBeCloseTo((s.deaths / s.total) * 100, 5)
  })
})

describe('migrate', () => {
  it('upgrades a legacy blob missing version and settings', () => {
    const legacy = { offset: 0, patients: [], log: [] }
    const db = migrate(legacy)
    expect(db.version).toBeGreaterThanOrEqual(1)
    expect(db.settings.facilityName).toBeTruthy()
  })
  it('falls back to a fresh seed for malformed input', () => {
    expect(migrate(null).patients.length).toBeGreaterThan(0)
    expect(migrate({ patients: 'bad' }).patients.length).toBeGreaterThan(0)
  })
})
