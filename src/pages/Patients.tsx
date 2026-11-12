import { useMemo, useState } from 'react'
import { UserPlus, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { CAP, Patient, Status, isActive } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { useAuth } from '../state/AuthContext'
import { exportPatientsCsv } from '../lib/export'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, StatusBadge } from '../components/ui'
import { PatientDetail } from '../components/PatientDetail'

type SortKey = 'name' | 'age' | 'room' | 'status'
const PAGE = 10

export function PatientsPage() {
  const { db, stats, admit } = useFacility()
  const { role } = useAuth()
  const canAdmit = role === 'admin'

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [room, setRoom] = useState('')
  const [formErr, setFormErr] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [asc, setAsc] = useState(true)
  const [page, setPage] = useState(0)
  const [sel, setSel] = useState<Patient | null>(null)

  const nextFree = useMemo(
    () => Array.from({ length: CAP }, (_, i) => i + 1).find((x) => !stats.act.some((p) => p.room === x)),
    [stats.act],
  )

  const filtered = useMemo(() => {
    let list = db.patients.filter(
      (p) => `${p.name} ${p.id} ${p.room ?? ''}`.toLowerCase().includes(query.toLowerCase()),
    )
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sort === 'name') cmp = a.name.localeCompare(b.name)
      else if (sort === 'age') cmp = a.age - b.age
      else if (sort === 'room') cmp = (a.room ?? 999) - (b.room ?? 999)
      else cmp = a.status.localeCompare(b.status)
      return asc ? cmp : -cmp
    })
    return list
  }, [db.patients, query, statusFilter, sort, asc])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, pages - 1)
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE)

  const submitAdmit = () => {
    if (!name.trim()) return setFormErr('Enter a patient name.')
    const a = parseInt(age, 10)
    if (!(a > 0 && a < 120)) return setFormErr('Enter a valid age.')
    const r = parseInt(room, 10)
    if (!(r >= 1 && r <= CAP)) return setFormErr(`Room must be between 1 and ${CAP}.`)
    setFormErr('')
    if (admit(name, a, r)) {
      setName('')
      setAge('')
      setRoom('')
    }
  }

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((v) => !v)
    else {
      setSort(key)
      setAsc(true)
    }
  }

  return (
    <>
      <PageHeader
        title="Patient register"
        description={`${db.patients.length} total records - ${db.patients.filter(isActive).length} active`}
        actions={
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportPatientsCsv(db.patients, stats.today)}>
            Export CSV
          </Button>
        }
      />

      {canAdmit && (
        <Card title="Admit a patient" className="mb-4">
          {stats.act.length >= CAP && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Facility is full ({CAP}/{CAP}). Discharge a patient to free a room.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] md:items-end">
            <Field label="Full name" error={formErr && !name.trim() ? formErr : ''}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient name" />
            </Field>
            <Field label="Age">
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
            </Field>
            <Field label="Room" hint={nextFree ? `Next free: ${nextFree}` : 'No free rooms'}>
              <Input type="number" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room no." />
            </Field>
            <Button icon={<UserPlus size={16} />} disabled={stats.act.length >= CAP} onClick={submitAdmit}>
              Admit
            </Button>
          </div>
          {formErr && name.trim() && <p className="mt-2 text-xs text-red-600">{formErr}</p>}
        </Card>
      )}

      <Card
        title="All patients"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                className="w-44 pl-8"
                placeholder="Search..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <Select
              className="w-36"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | Status)
                setPage(0)
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="approved">Approved</option>
              <option value="discharged">Discharged</option>
              <option value="deceased">Deceased</option>
            </Select>
          </div>
        }
      >
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <Th label="Patient" onClick={() => toggleSort('name')} active={sort === 'name'} />
                  <Th label="Age" onClick={() => toggleSort('age')} active={sort === 'age'} />
                  <Th label="Room" onClick={() => toggleSort('room')} active={sort === 'room'} />
                  <Th label="Status" onClick={() => toggleSort('status')} active={sort === 'status'} />
                  <th className="py-2">Admitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                    onClick={() => setSel(p)}
                  >
                    <td className="py-2.5">
                      <span className="font-medium text-navy">{p.name}</span>{' '}
                      <span className="text-xs text-slate-400">{p.id}</span>
                    </td>
                    <td className="py-2.5">{p.age}</td>
                    <td className="py-2.5">{p.room ?? <span className="text-slate-300">-</span>}</td>
                    <td className="py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 text-slate-500">{p.admitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing {current * PAGE + 1}-{Math.min((current + 1) * PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" icon={<ChevronLeft size={14} />} disabled={current === 0} onClick={() => setPage(current - 1)}>
                  Prev
                </Button>
                <Badge tone="slate">
                  {current + 1} / {pages}
                </Badge>
                <Button size="sm" variant="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="No patients match your filters" hint="Try adjusting the search or status filter." />
        )}
      </Card>

      <PatientDetail patient={sel} onClose={() => setSel(null)} />
    </>
  )
}

function Th({ label, onClick, active }: { label: string; onClick: () => void; active: boolean }) {
  return (
    <th className="py-2">
      <button className="inline-flex items-center gap-1 hover:text-navy" onClick={onClick}>
        {label}
        <ArrowUpDown size={12} className={active ? 'text-navy' : 'text-slate-300'} />
      </button>
    </th>
  )
}
