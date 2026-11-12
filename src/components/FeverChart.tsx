import { FEVER, Patient } from '../logic'
import { cx } from './ui'

const MIN = 35
const MAX = 41
const pct = (v: number) => Math.max(4, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100))

export function FeverChart({ patient, height = 'h-24' }: { patient: Patient; height?: string }) {
  if (!patient.temps.length) {
    return <p className="text-sm text-slate-400">No temperatures recorded yet.</p>
  }
  return (
    <div>
      <div className={cx('relative flex items-end gap-1', height)}>
        {/* fever threshold line */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400"
          style={{ bottom: `${pct(FEVER)}%` }}
        />
        {patient.temps.map((t) => (
          <div
            key={t.date}
            className="group relative flex flex-1 flex-col items-center justify-end"
            title={`${t.date}: ${t.value} C`}
          >
            <div
              className={cx('w-full rounded-t transition-all', t.value >= FEVER ? 'bg-red-500' : 'bg-emerald-500')}
              style={{ height: `${pct(t.value)}%` }}
            />
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        Red = fever (&ge;{FEVER} C) &middot; Green = normal &middot; dashed line = {FEVER} C threshold
      </p>
    </div>
  )
}
