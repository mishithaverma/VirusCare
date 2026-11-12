export type Role = 'admin' | 'nurse' | 'doctor' | 'manager'
export type Status = 'active' | 'approved' | 'discharged' | 'deceased'
export interface Temp { date: string; value: number; by: string; at: string }
export interface Visit { date: string; by: string; at: string; notes: string; treatment: string; emergency?: string }
export interface Patient { id: string; name: string; age: number; room: number | null; admitted: string; outcomeDate?: string; status: Status; temps: Temp[]; visits: Visit[] }
export interface Log { at: string; by: string; msg: string }
export interface DB { offset: number; patients: Patient[]; log: Log[] }
export const CAP = 74, FEVER = 38

const pad = (n: number) => String(n).padStart(2, '0')
export const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` // local date, not UTC
export const addDays = (s: string, n: number) => { const [y, m, d] = s.split('-').map(Number); return fmt(new Date(y, m - 1, d + n)) }
export const todayOf = (db: DB) => addDays(fmt(new Date()), db.offset)
export const stamp = () => new Date().toLocaleString()
export const isActive = (p: Patient) => p.status === 'active' || p.status === 'approved'
export const tempOn = (p: Patient, d: string) => p.temps.find(t => t.date === d)
export const visitOn = (p: Patient, d: string) => p.visits.find(v => v.date === d)

// Consecutive complete days without fever, counted back from today (if recorded) else yesterday. Missing day or fever stops the count.
export function feverFree(p: Patient, today: string): number {
  let d = tempOn(p, today) ? today : addDays(today, -1), n = 0
  for (;;) { const t = tempOn(p, d); if (!t || t.value >= FEVER) break; n++; d = addDays(d, -1) }
  return n
}
export const eligible = (p: Patient, today: string) => p.status === 'active' && feverFree(p, today) >= 3

export function seed(): DB {
  const today = fmt(new Date()), patients: Patient[] = []
  const F = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Isha', 'Arjun', 'Sara', 'Vivaan', 'Anaya', 'Neil', 'Tara'], L = ['Shah', 'Mehta', 'Iyer', 'Nair', 'Khan', 'Patil', 'Gupta', 'Rao']
  for (let i = 0; i < 50; i++) {
    const days = 3 + (i % 7), s = i % 5, temps: Temp[] = [], visits: Visit[] = []
    for (let o = -(days - 1); o <= 0; o++) {
      if (o === 0 && i % 3 === 0) continue
      const fever = -o >= s || (s === 0)
      const v = fever ? 38.2 + ((i * 7 + o + 20) % 14) / 10 : 36.6 + ((i + o + 20) % 8) / 10
      temps.push({ date: addDays(today, o), value: +v.toFixed(1), by: 'Nurse Priya', at: '08:30' })
    }
    if (i % 4 === 0 && i % 3 !== 0) visits.push({ date: today, by: 'Dr. Rao', at: '10:15', notes: 'Stable, continue monitoring', treatment: 'Hydration, paracetamol' })
    patients.push({ id: 'P' + String(i + 1).padStart(3, '0'), name: `${F[i % 12]} ${L[(i * 3) % 8]}`, age: 20 + ((i * 11) % 55), room: i + 1, admitted: addDays(today, -days), status: 'active', temps, visits })
  }
  patients.filter((p, i) => i % 17 === 0 && feverFree(p, today) >= 3).forEach(p => { p.status = 'approved'; p.visits.push({ date: today, by: 'Dr. Rao', at: '09:40', notes: 'Fever-free 3 days. Approved.', treatment: 'None' }) })
  for (let i = 0; i < 14; i++) patients.push({ id: 'P' + String(51 + i).padStart(3, '0'), name: `${F[(i + 4) % 12]} ${L[(i + 2) % 8]}`, age: 25 + i * 3, room: null, admitted: addDays(today, -12 - i), outcomeDate: addDays(today, -(i % 6) - 1), status: i < 11 ? 'discharged' : 'deceased', temps: [], visits: [] })
  return { offset: 0, patients, log: [{ at: stamp(), by: 'System', msg: 'Demonstration data loaded' }] }
}
export const stats = (db: DB) => {
  const today = todayOf(db), act = db.patients.filter(isActive), total = db.patients.length
  const deaths = db.patients.filter(p => p.status === 'deceased').length, mort = total ? deaths / total * 100 : 0
  return { today, act, total, deaths, mort, success: total ? 100 - mort : 100, discharged: db.patients.filter(p => p.status === 'discharged').length,
    tPend: act.filter(p => !tempOn(p, today)), vPend: act.filter(p => !visitOn(p, today)), elig: act.filter(p => eligible(p, today)), approved: act.filter(p => p.status === 'approved') }
}
