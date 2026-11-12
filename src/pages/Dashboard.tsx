import { ReactNode } from 'react'
import { AlertTriangle, BedDouble, Thermometer, Stethoscope, HeartPulse, LogOut, Activity } from 'lucide-react'
import { CAP } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { useAuth, ROLE_TITLES } from '../state/AuthContext'
import { Card, PageHeader, Stat } from '../components/ui'

export function Dashboard() {
  const { stats, db } = useFacility()
  const { role, name } = useAuth()
  const S = stats

  return (
    <>
      <PageHeader
        title={`Welcome, ${name}`}
        description={role ? `${ROLE_TITLES[role]} - facility overview for today` : undefined}
      />

      {S.mort > 15 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={18} /> Mortality rate ({S.mort.toFixed(1)}%) exceeds the 15% benchmark. Review treatment quality.
        </div>
      )}
      {S.delayDays > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <LogOut size={18} /> {S.delayed.length} dischargeable patient(s) still occupying rooms &mdash; {S.delayDays}{' '}
          extra patient-day(s). Clear these to free capacity.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Stat label="Admitted patients" value={S.act.length} icon={<BedDouble size={16} />} />
        <Stat label="Rooms available" value={`${CAP - S.act.length} / ${CAP}`} icon={<BedDouble size={16} />} />
        <Stat label="Temperatures pending" value={S.tPend.length} tone={S.tPend.length ? 'orange' : 'navy'} icon={<Thermometer size={16} />} />
        <Stat label="Doctor visits pending" value={S.vPend.length} tone={S.vPend.length ? 'orange' : 'navy'} icon={<Stethoscope size={16} />} />
        <Stat label="Eligible for discharge" value={S.elig.length + S.approved.length} tone="emerald" icon={<LogOut size={16} />} />
        <Stat label="Discharge delay (patient-days)" value={S.delayDays} tone={S.delayDays ? 'orange' : 'navy'} />
        <Stat label="Mortality rate" value={`${S.mort.toFixed(1)}%`} tone={S.mort > 15 ? 'red' : 'navy'} sub="Benchmark 15%" icon={<HeartPulse size={16} />} />
        <Stat label="Success rate" value={`${S.success.toFixed(1)}%`} tone="emerald" sub="Target 85%" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title="Recent activity" className="lg:col-span-3">
          {db.log.length ? (
            <ol className="space-y-3">
              {db.log.slice(0, 10).map((l, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-300" />
                  <div>
                    <div className="text-slate-700">{l.msg}</div>
                    <div className="text-xs text-slate-400">
                      {l.at} &middot; {l.by}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-400">No activity yet.</p>
          )}
        </Card>

        <Card title="Facility snapshot" className="lg:col-span-2">
          <dl className="space-y-3 text-sm">
            <Row label="Total admitted (all time)" value={S.total} />
            <Row label="Currently active" value={S.act.length} />
            <Row label="Approved, awaiting discharge" value={S.approved.length} />
            <Row label="Discharged" value={S.discharged} />
            <Row label="Deaths" value={S.deaths} />
          </dl>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">
            <Activity size={14} /> Occupancy {Math.round((S.act.length / CAP) * 100)}% of {CAP} beds
          </div>
        </Card>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  )
}
