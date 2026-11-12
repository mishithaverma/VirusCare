import { useState } from 'react'
import { Stethoscope, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { FEVER, Patient, tempOn } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { useConfirm } from '../components/ConfirmDialog'
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Textarea, Input } from '../components/ui'
import { PatientDetail } from '../components/PatientDetail'

export function VisitsPage() {
  const { stats, today, visit, recordDeath } = useFacility()
  const confirm = useConfirm()
  const [active, setActive] = useState<Patient | null>(null)
  const [detail, setDetail] = useState<Patient | null>(null)
  const [notes, setNotes] = useState('')
  const [treatment, setTreatment] = useState('')
  const [emergency, setEmergency] = useState('')
  const [err, setErr] = useState('')

  const openVisit = (p: Patient) => {
    setActive(p)
    setNotes('')
    setTreatment('')
    setEmergency('')
    setErr('')
  }

  const submit = () => {
    if (!active) return
    if (!notes.trim() || !treatment.trim()) return setErr('Notes and treatment are required.')
    const noTemp = !tempOn(active, today)
    if (noTemp && !emergency.trim()) return setErr('Temperature not recorded today. Provide an emergency reason.')
    setErr('')
    if (visit(active.id, notes, treatment, emergency)) setActive(null)
  }

  return (
    <>
      <PageHeader title="Doctor visits" description={`Complete one visit per patient per day. Today: ${today}`} />

      <Card title="Pending visits" description={`${stats.vPend.length} patient(s) awaiting a doctor today`}>
        {stats.vPend.length ? (
          <div className="divide-y divide-slate-100">
            {stats.vPend.map((p) => {
              const t = tempOn(p, today)
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <button className="min-w-[160px] flex-1 text-left" onClick={() => setDetail(p)}>
                    <span className="font-medium text-navy">{p.name}</span>{' '}
                    <span className="text-xs text-slate-400">
                      {p.id} &middot; Room {p.room}
                    </span>
                  </button>
                  {t ? (
                    <Badge tone={t.value >= FEVER ? 'red' : 'green'}>{t.value} C</Badge>
                  ) : (
                    <Badge tone="orange">
                      <AlertTriangle size={12} /> No temp today
                    </Badge>
                  )}
                  <Button size="sm" variant="secondary" icon={<Stethoscope size={14} />} onClick={() => openVisit(p)}>
                    Start visit
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={<CheckCircle2 size={28} />} title="All visits complete" hint="Every active patient has been seen today." />
        )}
      </Card>

      {/* Visit modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Visit: ${active.name}` : ''}
        footer={
          <>
            <Button
              variant="danger"
              onClick={async () => {
                if (!active) return
                if (
                  await confirm({
                    title: 'Record death?',
                    message: `This records ${active.name} as deceased and releases their room. This cannot be undone.`,
                    confirmLabel: 'Record death',
                    danger: true,
                  })
                ) {
                  recordDeath(active.id)
                  setActive(null)
                }
              }}
            >
              Record death
            </Button>
            <Button onClick={submit}>Mark visit complete</Button>
          </>
        }
      >
        {active && !tempOn(active, today) && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <AlertTriangle size={16} className="mt-0.5" /> Temperature not recorded today. Provide an emergency reason to
            proceed; this visit will be flagged.
          </div>
        )}
        <div className="space-y-3">
          <Field label="Medical notes" error={err && !notes.trim() ? err : ''}>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, symptoms, status..." />
          </Field>
          <Field label="Treatment" error={err && notes.trim() && !treatment.trim() ? err : ''}>
            <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Medication, care plan..." />
          </Field>
          {active && !tempOn(active, today) && (
            <Field label="Emergency reason" error={err && notes.trim() && treatment.trim() ? err : ''}>
              <Input value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="Why is this visit happening without a temperature?" />
            </Field>
          )}
        </div>
      </Modal>

      <PatientDetail patient={detail} onClose={() => setDetail(null)} />
    </>
  )
}
