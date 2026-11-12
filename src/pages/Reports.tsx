import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { Download } from 'lucide-react'
import { addDays } from '../logic'
import { useFacility } from '../state/FacilityContext'
import { exportPatientsCsv } from '../lib/export'
import { Button, Card, PageHeader, Stat } from '../components/ui'

export function ReportsPage() {
  const { db, stats, today } = useFacility()
  const S = stats
  const all = db.patients

  // Last 14 days of admissions vs outcomes.
  const daily = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i - 13)
      return {
        date: d.slice(5),
        Admissions: all.filter((p) => p.admitted === d).length,
        Discharges: all.filter((p) => p.outcomeDate === d && p.status === 'discharged').length,
        Deaths: all.filter((p) => p.outcomeDate === d && p.status === 'deceased').length,
      }
    })
  }, [all, today])

  // Cumulative mortality trend over the same window.
  const mortalityTrend = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i - 13)
      const admittedBy = all.filter((p) => p.admitted <= d).length
      const deathsBy = all.filter((p) => p.status === 'deceased' && p.outcomeDate && p.outcomeDate <= d).length
      return {
        date: d.slice(5),
        Mortality: admittedBy ? +((deathsBy / admittedBy) * 100).toFixed(1) : 0,
      }
    })
  }, [all, today])

  const monthly = useMemo(() => {
    const months = Array.from(new Set(all.map((p) => p.admitted.slice(0, 7)))).sort()
    return months.map((m) => ({
      month: m,
      admitted: all.filter((p) => p.admitted.startsWith(m)).length,
      discharged: all.filter((p) => p.outcomeDate?.startsWith(m) && p.status === 'discharged').length,
      deaths: all.filter((p) => p.outcomeDate?.startsWith(m) && p.status === 'deceased').length,
    }))
  }, [all])

  return (
    <>
      <PageHeader
        title="Reports & outcomes"
        description="Performance against the 85% success benchmark"
        actions={
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => exportPatientsCsv(all, today)}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total admitted" value={S.total} />
        <Stat label="Active" value={S.act.length} />
        <Stat label="Discharged" value={S.discharged} tone="emerald" />
        <Stat label="Deaths" value={S.deaths} tone="red" />
        <Stat label="Mortality" value={`${S.mort.toFixed(1)}%`} tone={S.mort > 15 ? 'red' : 'navy'} sub="Benchmark 15%" />
        <Stat label="Success" value={`${S.success.toFixed(1)}%`} tone="emerald" sub="Target 85%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Admissions vs outcomes" description="Last 14 days">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Admissions" fill="#0f2a52" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Discharges" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Deaths" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Mortality trend" description="Cumulative rate vs 15% benchmark">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mortalityTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '15% benchmark', fontSize: 10, fill: '#ef4444', position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="Mortality" stroke="#1763c6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Monthly breakdown" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2">Month</th>
                <th className="py-2">Admitted</th>
                <th className="py-2">Discharged</th>
                <th className="py-2">Deaths</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-b border-slate-50">
                  <td className="py-2.5 font-medium text-navy">{m.month}</td>
                  <td className="py-2.5">{m.admitted}</td>
                  <td className="py-2.5 text-emerald-600">{m.discharged}</td>
                  <td className="py-2.5 text-red-600">{m.deaths}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">Mortality = deaths / total admitted. Figures include seeded demonstration data.</p>
      </Card>
    </>
  )
}
