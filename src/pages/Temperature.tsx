import { useState } from 'react'
import { Thermometer, CheckCircle2 } from 'lucide-react'
import { FEVER, Patient, tempOn } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select } from '../components/ui'
import { PatientDetail } from '../components/PatientDetail'

export function TemperaturePage() {
  const { stats, today, recordTemp } = useFacility()
  const [id, setId] = useState('')
  const [value, setValue] = useState('')
  const [err, setErr] = useState('')
  const [sel, setSel] = useState<Patient | null>(null)

  const save = () => {
    const v = parseFloat(value)
    if (!id) return setErr('Select a patient.')
    if (isNaN(v) || v < 34 || v > 42) return setErr('Enter a value between 34 and 42 C.')
    setErr('')
    if (recordTemp(id, v)) {
      setId('')
      setValue('')
    }
  }

  return (
    <>
      <PageHeader title="Temperature rounds" description={`Record one temperature per patient per day. Today: ${today}`} />

      <Card title="Record a temperature" description="Duplicate entries for the same day are blocked." className="mb-4">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto] md:items-end">
          <Field label="Patient (pending today)">
            <Select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">Select patient...</option>
              {stats.tPend.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - Room {p.room}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Temperature (C)" error={err}>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 37.2"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </Field>
          <Button icon={<Thermometer size={16} />} disabled={!id} onClick={save}>
            Save reading
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Fever threshold is {FEVER} C. Valid range 34-42 C.</p>
      </Card>

      <Card
        title="Today's rounds"
        description={`${stats.tPend.length} of ${stats.act.length} patients still need a temperature`}
      >
        {stats.act.length ? (
          <div className="divide-y divide-slate-100">
            {stats.act.map((p) => {
              const t = tempOn(p, today)
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <button className="min-w-[160px] flex-1 text-left" onClick={() => setSel(p)}>
                    <span className="font-medium text-navy">{p.name}</span>{' '}
                    <span className="text-xs text-slate-400">
                      {p.id} &middot; Room {p.room}
                    </span>
                  </button>
                  {t ? (
                    <Badge tone={t.value >= FEVER ? 'red' : 'green'}>
                      <CheckCircle2 size={12} /> {t.value} C
                    </Badge>
                  ) : (
                    <Badge tone="orange">Pending</Badge>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={<Thermometer size={28} />} title="No active patients" hint="Admitted patients will appear here for daily temperature rounds." />
        )}
      </Card>

      <PatientDetail patient={sel} onClose={() => setSel(null)} />
    </>
  )
}
