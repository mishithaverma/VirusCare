import { Patient } from '../logic'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const escapeCell = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportPatientsCsv(patients: Patient[], today: string) {
  const header = ['ID', 'Name', 'Age', 'Room', 'Status', 'Admitted', 'Outcome date', 'Temperatures recorded', 'Doctor visits', 'Latest temp (C)']
  const rows = patients.map((p) => [
    p.id,
    p.name,
    p.age,
    p.room ?? '',
    p.status,
    p.admitted,
    p.outcomeDate ?? '',
    p.temps.length,
    p.visits.length,
    p.temps.length ? p.temps[p.temps.length - 1].value : '',
  ])
  const csv = [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n')
  download(`viruscare-patients-${today}.csv`, csv, 'text/csv;charset=utf-8')
}
