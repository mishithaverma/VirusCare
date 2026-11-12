import { useState } from 'react'
import { ClipboardCheck, Printer, Clock, CheckCircle2 } from 'lucide-react'
import { Patient, dischargeDelay, eligible, feverFree } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { useAuth } from '../state/AuthContext'
import { useConfirm } from '../components/ConfirmDialog'
import { printDischargeSummary } from '../lib/print'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import { PatientDetail } from '../components/PatientDetail'

export function DischargePage() {
  const { stats, today, approve, discharge, db } = useFacility()
  const { role } = useAuth()
  const confirm = useConfirm()
  const [sel, setSel] = useState<Patient | null>(null)

  const notEligible = stats.act.filter((p) => p.status === 'active' && !eligible(p, today))
  const eligibleList = stats.act.filter((p) => p.status === 'active' && eligible(p, today))

  const NameButton = ({ p }: { p: Patient }) => (
    <button className="min-w-[160px] flex-1 text-left" onClick={() => setSel(p)}>
      <span className="font-medium text-navy">{p.name}</span>{' '}
      <span className="text-xs text-slate-400">
        {p.id} &middot; Room {p.room}
      </span>
    </button>
  )

  return (
    <>
      <PageHeader title="Discharge workflow" description="Two-step process: a doctor approves, then an administrator discharges and releases the room." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="1. In treatment" description="Not yet fever-free for 3 days">
          {notEligible.length ? (
            <div className="divide-y divide-slate-100">
              {notEligible.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-2.5">
                  <NameButton p={p} />
                  <Badge tone="orange">{feverFree(p, today)}/3 days</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No patients in treatment" />
          )}
        </Card>

        <Card title="2. Doctor approval" description="Eligible - needs a doctor sign-off">
          {eligibleList.length ? (
            <div className="divide-y divide-slate-100">
              {eligibleList.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <NameButton p={p} />
                  <Badge tone="green">{feverFree(p, today)} days fever-free</Badge>
                  {dischargeDelay(p, today) > 0 && (
                    <Badge tone="orange">
                      <Clock size={12} /> +{dischargeDelay(p, today)}d
                    </Badge>
                  )}
                  <Button size="sm" disabled={role !== 'doctor'} onClick={() => approve(p.id)}>
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nobody awaiting approval" />
          )}
          {role !== 'doctor' && eligibleList.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">Only a doctor can approve discharges.</p>
          )}
        </Card>

        <Card title="3. Administrative discharge" description="Approved - release the room">
          {stats.approved.length ? (
            <div className="divide-y divide-slate-100">
              {stats.approved.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <NameButton p={p} />
                  {dischargeDelay(p, today) > 0 && (
                    <Badge tone="orange">
                      <Clock size={12} /> +{dischargeDelay(p, today)}d waiting
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Printer size={14} />}
                    onClick={() => printDischargeSummary(p, db.settings.facilityName, today)}
                  >
                    Summary
                  </Button>
                  <Button
                    size="sm"
                    disabled={role !== 'admin'}
                    icon={<ClipboardCheck size={14} />}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Discharge patient?',
                          message: `Discharge ${p.name} and release room ${p.room}?`,
                          confirmLabel: 'Discharge',
                        })
                      )
                        discharge(p.id)
                    }}
                  >
                    Discharge
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 size={24} />} title="No approved patients" />
          )}
          {role !== 'admin' && stats.approved.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">Only an administrator can complete a discharge.</p>
          )}
        </Card>
      </div>

      <PatientDetail patient={sel} onClose={() => setSel(null)} />
    </>
  )
}
