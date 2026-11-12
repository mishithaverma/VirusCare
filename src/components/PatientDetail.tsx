import { ReactNode } from 'react'
import { FEVER, Patient, feverFree } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { FeverChart } from './FeverChart'
import { Badge, Modal, StatusBadge } from './ui'

export function PatientDetail({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const { today } = useFacility()
  if (!patient) return null
  const ff = feverFree(patient, today)

  return (
    <Modal
      open={!!patient}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {patient.name}
          <StatusBadge status={patient.status} />
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Meta label="Patient ID" value={patient.id} />
        <Meta label="Age" value={`${patient.age} yrs`} />
        <Meta label="Room" value={patient.room ?? '-'} />
        <Meta label="Admitted" value={patient.admitted} />
        <Meta label="Fever-free days" value={`${ff}/3`} />
        {patient.approvedDate && <Meta label="Approved" value={patient.approvedDate} />}
        {patient.outcomeDate && <Meta label="Outcome date" value={patient.outcomeDate} />}
      </div>

      <h4 className="mt-5 mb-2 text-sm font-semibold text-navy">Fever trend</h4>
      <FeverChart patient={patient} />

      <h4 className="mt-5 mb-2 text-sm font-semibold text-navy">Temperature log</h4>
      {patient.temps.length ? (
        <div className="max-h-40 overflow-auto rounded-lg border border-slate-100 scrollbar-thin">
          {[...patient.temps].reverse().map((t) => (
            <div key={t.date} className="flex items-center justify-between border-b border-slate-50 px-3 py-1.5 text-sm last:border-0">
              <span className="text-slate-500">
                {t.date} <span className="text-slate-300">&middot; {t.by}</span>
              </span>
              <Badge tone={t.value >= FEVER ? 'red' : 'green'}>{t.value} C</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No temperatures recorded.</p>
      )}

      <h4 className="mt-5 mb-2 text-sm font-semibold text-navy">Doctor visits &amp; treatment</h4>
      {patient.visits.length ? (
        <ol className="relative space-y-3 border-l border-slate-200 pl-4">
          {[...patient.visits].reverse().map((v, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-navy ring-4 ring-white" />
              <div className="text-xs text-slate-400">
                {v.date} &middot; {v.at} &middot; {v.by}
              </div>
              <div className="text-sm text-slate-700">{v.notes}</div>
              <div className="text-sm text-slate-500">Treatment: {v.treatment}</div>
              {v.emergency && (
                <div className="mt-1 text-xs text-orange-600">Flagged emergency visit: {v.emergency}</div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-400">No doctor visits recorded.</p>
      )}
    </Modal>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-medium text-navy">{value}</div>
    </div>
  )
}
