import { useEffect, useState, ReactNode } from 'react'
import { Activity, Thermometer, Stethoscope, Users, BarChart3, ClipboardCheck, Home, X, LogOut } from 'lucide-react'
import { CAP, DB, FEVER, Patient, Role, addDays, eligible, feverFree, isActive, seed, stamp, stats, tempOn, todayOf, visitOn } from './logic'

const KEY = 'viruscare-db', NAMES: Record<Role, string> = { admin: 'Admin Anita', nurse: 'Nurse Priya', doctor: 'Dr. Rao', manager: 'Manager Mehra' }
const TABS: Record<Role, { id: string; label: string; icon: ReactNode }[]> = {
  admin: [{ id: 'dash', label: 'Dashboard', icon: <Home size={16} /> }, { id: 'patients', label: 'Patients', icon: <Users size={16} /> }, { id: 'discharge', label: 'Discharge', icon: <ClipboardCheck size={16} /> }],
  nurse: [{ id: 'dash', label: 'Dashboard', icon: <Home size={16} /> }, { id: 'temp', label: 'Temperature', icon: <Thermometer size={16} /> }],
  doctor: [{ id: 'dash', label: 'Dashboard', icon: <Home size={16} /> }, { id: 'visits', label: 'Visits', icon: <Stethoscope size={16} /> }, { id: 'discharge', label: 'Discharge', icon: <ClipboardCheck size={16} /> }],
  manager: [{ id: 'dash', label: 'Dashboard', icon: <Home size={16} /> }, { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> }]
}
const load = (): DB => { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch { /* ignore */ } return seed() }

const Card = ({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">{title && <div className="flex justify-between items-center mb-3"><h2 className="font-semibold text-navy">{title}</h2>{right}</div>}{children}</section>)
const Badge = ({ c, children }: { c: 'g' | 'o' | 'r' | 'b'; children: ReactNode }) => {
  const m = { g: 'bg-emerald-50 text-emerald-700', o: 'bg-orange-50 text-orange-700', r: 'bg-red-50 text-red-700', b: 'bg-blue-50 text-blue-700' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m[c]}`}>{children}</span>
}
const Btn = ({ onClick, children, v = 'p', disabled }: { onClick: () => void; children: ReactNode; v?: 'p' | 's' | 'd'; disabled?: boolean }) => (
  <button disabled={disabled} onClick={onClick} className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${v === 'p' ? 'bg-navy text-white' : v === 'd' ? 'bg-red-600 text-white' : 'border border-navy text-navy'}`}>{children}</button>)
const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'

export default function App() {
  const [db, setDb] = useState<DB>(load), [role, setRole] = useState<Role | null>(null), [tab, setTab] = useState('dash')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null), [sel, setSel] = useState<string | null>(null), [q, setQ] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ } }, [db])
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t) } }, [msg])
  const S = stats(db), today = S.today, who = role ? NAMES[role] : ''
  const err = (t: string) => { setMsg({ ok: false, t }); return false }
  // Every mutation goes through here: role check, validation (returns error string), activity log.
  const act = (allowed: Role[], f: (d: DB) => string): boolean => {
    if (!role || !allowed.includes(role)) return err('Your role is not permitted to do this.')
    const d: DB = structuredClone(db), r = f(d)
    if (r.startsWith('!')) return err(r.slice(1))
    d.log.unshift({ at: stamp(), by: who, msg: r }); setDb(d); setMsg({ ok: true, t: r }); return true
  }
  const P = (d: DB, id: string) => d.patients.find(p => p.id === id)!
  const admit = (name: string, age: number, room: number) => act(['admin'], d => {
    if (!name.trim()) return '!Enter patient name'; if (!(age > 0 && age < 120)) return '!Enter a valid age'
    if (d.patients.filter(isActive).length >= CAP) return `!Facility is full (${CAP}/${CAP}). Discharge a patient first.`
    if (!(room >= 1 && room <= CAP)) return `!Room must be 1–${CAP}`
    if (d.patients.some(p => isActive(p) && p.room === room)) return `!Room ${room} is occupied`
    const id = 'P' + String(d.patients.length + 1).padStart(3, '0')
    d.patients.push({ id, name: name.trim(), age, room, admitted: todayOf(d), status: 'active', temps: [], visits: [] }); return `Admitted ${name.trim()} (${id}) to room ${room}`
  })
  const recTemp = (id: string, v: number) => act(['nurse'], d => {
    const p = P(d, id), t = todayOf(d)
    if (!isActive(p)) return '!Patient is not admitted'
    if (tempOn(p, t)) return '!Temperature already recorded today. Duplicate entries are blocked.'
    if (isNaN(v) || v < 34 || v > 42) return '!Enter a value between 34 and 42 °C'
    p.temps.push({ date: t, value: v, by: who, at: new Date().toLocaleTimeString() }); return `Recorded ${v}°C for ${p.name}${v >= FEVER ? ' (FEVER)' : ''}`
  })
  const visit = (id: string, notes: string, treatment: string, emergency: string) => act(['doctor'], d => {
    const p = P(d, id), t = todayOf(d)
    if (visitOn(p, t)) return '!Visit already completed today'
    if (!notes.trim() || !treatment.trim()) return '!Notes and treatment are required'
    if (!tempOn(p, t) && !emergency.trim()) return '!Temperature not recorded today. Enter an emergency reason to proceed.'
    p.visits.push({ date: t, by: who, at: new Date().toLocaleTimeString(), notes, treatment, emergency: !tempOn(p, t) ? emergency : undefined })
    return `Visit completed for ${p.name}${!tempOn(p, t) ? ' – FLAGGED: emergency visit without temperature' : ''}`
  })
  const approve = (id: string) => act(['doctor'], d => { const p = P(d, id); if (!eligible(p, todayOf(d))) return '!Not eligible: needs 3 consecutive fever-free days'; p.status = 'approved'; return `Discharge approved for ${p.name}` })
  const discharge = (id: string) => act(['admin'], d => { const p = P(d, id); if (p.status !== 'approved') return '!Doctor approval required before discharge'; p.status = 'discharged'; p.outcomeDate = todayOf(d); const r = p.room; p.room = null; return `Discharged ${p.name}; room ${r} released` })
  const death = (id: string) => act(['doctor'], d => { const p = P(d, id); p.status = 'deceased'; p.outcomeDate = todayOf(d); const r = p.room; p.room = null; return `Death recorded: ${p.name}; room ${r} released` })

  if (!role) return (
    <div className="min-h-screen flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-sm border p-6 w-full max-w-sm">
      <div className="flex items-center gap-2 text-navy font-bold text-xl mb-1"><Activity /> VirusCare</div><p className="text-sm text-slate-500 mb-4">Patient Management System</p>
      <input className={inp + ' mb-2'} placeholder="Email" /><input className={inp + ' mb-3'} type="password" placeholder="Password" />
      <p className="text-xs text-slate-500 mb-2">Demo mode: choose a role to sign in (Supabase login is not configured).</p>
      <div className="grid grid-cols-2 gap-2">{(Object.keys(NAMES) as Role[]).map(r => <Btn key={r} v="s" onClick={() => { setRole(r); setTab('dash') }}>{r[0].toUpperCase() + r.slice(1)}</Btn>)}</div></div></div>)

  const rows = (list: Patient[], cols: (p: Patient) => ReactNode) => (
    <div className="divide-y">{list.length ? list.map(p => <div key={p.id} className="flex flex-wrap items-center gap-2 py-2">
      <button className="flex-1 min-w-[150px] text-left" onClick={() => setSel(p.id)}><b className="text-navy">{p.name}</b> <span className="text-xs text-slate-500">{p.id} · {p.age}y · Room {p.room ?? '–'}</span></button>{cols(p)}</div>) : <p className="text-sm text-slate-500">Nothing here.</p>}</div>)
  const stat = (l: string, v: string | number, c = 'text-navy') => <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3"><div className={`text-2xl font-bold ${c}`}>{v}</div><div className="text-xs text-slate-500">{l}</div></div>
  const filt = S.act.filter(p => (p.name + p.id + p.room).toLowerCase().includes(q.toLowerCase()))

  const Dash = () => <>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      {stat('Admitted patients', S.act.length)}{stat('Rooms available', `${CAP - S.act.length} / ${CAP}`)}{stat('Temperatures pending', S.tPend.length, 'text-orange-600')}
      {stat('Doctor visits pending', S.vPend.length, 'text-orange-600')}{stat('Eligible for discharge', S.elig.length + S.approved.length, 'text-emerald-600')}{stat('Total discharged', S.discharged)}
      {stat('Total deaths', S.deaths, 'text-red-600')}{stat('Mortality rate', S.mort.toFixed(1) + '%', S.mort > 15 ? 'text-red-600' : 'text-navy')}{stat('Success rate', S.success.toFixed(1) + '%')}</div>
    {S.mort > 15 && <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-4 text-sm">⚠ Mortality exceeds the 15% benchmark.</div>}
    <Card title="Recent activity">{db.log.slice(0, 8).map((l, i) => <div key={i} className="text-sm py-1 border-b last:border-0"><span className="text-xs text-slate-400">{l.at} · {l.by}</span><br />{l.msg}</div>)}</Card></>

  const TempPage = () => { const [id, setId] = useState(''), [v, setV] = useState('')
    return <><Card title="Record temperature"><div className="grid md:grid-cols-3 gap-2">
      <select className={inp} value={id} onChange={e => setId(e.target.value)}><option value="">Select patient (pending)</option>{S.tPend.map(p => <option key={p.id} value={p.id}>{p.name} · Room {p.room}</option>)}</select>
      <input className={inp} type="number" step="0.1" placeholder="°C" value={v} onChange={e => setV(e.target.value)} />
      <Btn disabled={!id} onClick={() => { if (recTemp(id, parseFloat(v))) { setId(''); setV('') } }}>Save ({NAMES.nurse})</Btn></div>
      <p className="text-xs text-slate-500 mt-2">Fever threshold {FEVER}°C. Valid range 34–42°C. {today}</p></Card>
      <Card title={`All patients – ${S.tPend.length} pending`}>{rows(S.act, p => { const t = tempOn(p, today); return t ? <Badge c={t.value >= FEVER ? 'r' : 'g'}>{t.value}°C ✓</Badge> : <Badge c="o">Pending</Badge> })}</Card></>
  }
  const VisitPage = () => { const [id, setId] = useState<string | null>(null), [n, setN] = useState(''), [t, setT] = useState(''), [e, setE] = useState(''); const p = S.act.find(x => x.id === id)
    return <><Card title="Pending visits">{rows(S.vPend, x => <><Badge c={tempOn(x, today) ? 'g' : 'o'}>{tempOn(x, today) ? tempOn(x, today)!.value + '°C' : 'No temp'}</Badge><Btn v="s" onClick={() => { setId(x.id); setN(''); setT(''); setE('') }}>Visit</Btn></>)}</Card>
      {p && <Card title={`Visit: ${p.name}`} right={<button onClick={() => setId(null)}><X size={16} /></button>}>
        {!tempOn(p, today) && <div className="bg-orange-50 text-orange-700 text-sm rounded-lg p-2 mb-2">⚠ Temperature not recorded today. Provide an emergency reason to proceed; the visit will be flagged.</div>}
        <textarea className={inp + ' mb-2'} placeholder="Medical notes" value={n} onChange={x => setN(x.target.value)} /><textarea className={inp + ' mb-2'} placeholder="Treatment details" value={t} onChange={x => setT(x.target.value)} />
        {!tempOn(p, today) && <input className={inp + ' mb-2'} placeholder="Emergency reason" value={e} onChange={x => setE(x.target.value)} />}
        <div className="flex gap-2"><Btn onClick={() => { if (visit(p.id, n, t, e)) setId(null) }}>Mark complete</Btn><Btn v="d" onClick={() => { if (confirm('Record death for ' + p.name + '?')) { death(p.id); setId(null) } }}>Record death</Btn></div></Card>}</>
  }
  const Discharge = () => { const non = S.act.filter(p => p.status === 'active' && !eligible(p, today)), el = S.act.filter(p => p.status === 'active' && eligible(p, today))
    return <><Card title="1. Not eligible">{rows(non, p => <Badge c="o">{feverFree(p, today)}/3 days</Badge>)}</Card>
      <Card title="2. Eligible for doctor approval">{rows(el, p => <><Badge c="g">{feverFree(p, today)} days</Badge><Btn disabled={role !== 'doctor'} onClick={() => approve(p.id)}>Approve</Btn></>)}</Card>
      <Card title="3. Approved – waiting for admin">{rows(S.approved, p => <Btn disabled={role !== 'admin'} onClick={() => discharge(p.id)}>Discharge</Btn>)}</Card></>
  }
  const PatientsPage = () => { const [n, setN] = useState(''), [a, setA] = useState(''), [r, setR] = useState('')
    const free = Array.from({ length: CAP }, (_, i) => i + 1).find(x => !S.act.some(p => p.room === x))
    return <><Card title="Add patient">{S.act.length >= CAP && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-2 mb-2">Facility full ({CAP}/{CAP}). Discharge a patient to free a room.</div>}
      <div className="grid md:grid-cols-4 gap-2"><input className={inp} placeholder="Name" value={n} onChange={e => setN(e.target.value)} /><input className={inp} type="number" placeholder="Age" value={a} onChange={e => setA(e.target.value)} />
        <input className={inp} type="number" placeholder={`Room (next free: ${free ?? 'none'})`} value={r} onChange={e => setR(e.target.value)} /><Btn onClick={() => { if (admit(n, +a, +r)) { setN(''); setA(''); setR('') } }}>Admit</Btn></div></Card>
      <Card title="Active patients" right={<input className="border rounded-lg px-2 py-1 text-sm" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />}>{rows(filt, p => <Badge c={p.status === 'approved' ? 'g' : 'b'}>{p.status}</Badge>)}</Card></>
  }
  const Reports = () => { const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)), all = db.patients
    const mx = Math.max(1, ...days.map(d => all.filter(p => p.admitted === d).length), ...days.map(d => all.filter(p => p.outcomeDate === d).length))
    const bar = (n: number, c: string) => <div className={`${c} rounded-t w-4`} style={{ height: 8 + n / mx * 70 }} title={String(n)} />
    return <><Card title="Summary"><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{stat('Total admissions', S.total)}{stat('Discharged', S.discharged)}{stat('Deaths', S.deaths, 'text-red-600')}{stat('Active', S.act.length)}{stat('Mortality', S.mort.toFixed(1) + '%', S.mort > 15 ? 'text-red-600' : 'text-navy')}{stat('Success (85% target)', S.success.toFixed(1) + '%')}</div>
      <p className="text-xs text-slate-500 mt-2">Mortality = deaths ÷ total admitted × 100. Seeded data is demonstration data.</p></Card>
      <Card title="Daily trend (last 7 days)"><div className="flex items-end gap-3 h-24">{days.map(d => <div key={d} className="flex-1 text-center"><div className="flex items-end justify-center gap-1 h-20">{bar(all.filter(p => p.admitted === d).length, 'bg-navy')}{bar(all.filter(p => p.outcomeDate === d).length, 'bg-emerald-500')}</div><div className="text-[10px] text-slate-500">{d.slice(5)}</div></div>)}</div><p className="text-xs text-slate-500">Navy = admissions · Green = discharges/deaths</p></Card>
      <Card title="Monthly">{Array.from(new Set(all.map(p => p.admitted.slice(0, 7)))).sort().map(m => <div key={m} className="text-sm py-1 border-b">{m}: {all.filter(p => p.admitted.startsWith(m)).length} admitted · {all.filter(p => p.outcomeDate?.startsWith(m) && p.status === 'discharged').length} discharged · {all.filter(p => p.outcomeDate?.startsWith(m) && p.status === 'deceased').length} deaths</div>)}</Card></>
  }
  const page: Record<string, JSX.Element> = { dash: <Dash />, temp: <TempPage />, visits: <VisitPage />, discharge: <Discharge />, patients: <PatientsPage />, reports: <Reports /> }
  const sp = db.patients.find(p => p.id === sel)

  return <div className="min-h-screen"><header className="bg-navy text-white px-4 py-3 flex flex-wrap items-center gap-2 justify-between">
    <div className="flex items-center gap-2 font-bold"><Activity size={18} /> VirusCare <span className="text-xs font-normal opacity-70">{today}</span></div>
    <div className="flex items-center gap-2 text-xs"><select className="text-slate-800 rounded px-1 py-1" value={role} onChange={e => { setRole(e.target.value as Role); setTab('dash') }}>{(Object.keys(NAMES) as Role[]).map(r => <option key={r} value={r}>{NAMES[r]}</option>)}</select>
      <button className="underline" onClick={() => { const d = structuredClone(db); d.offset++; setDb(d) }}>Next day (demo)</button>
      <button className="underline" onClick={() => { if (confirm('Reset demo data?')) setDb(seed()) }}>Reset demo</button><button onClick={() => setRole(null)}><LogOut size={16} /></button></div></header>
    <nav className="bg-white border-b flex gap-1 px-2 overflow-x-auto">{TABS[role].map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1 px-3 py-2 text-sm border-b-2 ${tab === t.id ? 'border-navy text-navy font-semibold' : 'border-transparent text-slate-500'}`}>{t.icon}{t.label}</button>)}</nav>
    <main className="max-w-4xl mx-auto p-4">{msg && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.t}</div>}{page[tab] ?? page.dash}</main>
    {sp && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10" onClick={() => setSel(null)}><div className="bg-white rounded-2xl p-4 w-full max-w-md max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between"><h3 className="font-bold text-navy">{sp.name} <span className="text-xs font-normal text-slate-500">{sp.id} · {sp.age}y · {sp.status} · admitted {sp.admitted}</span></h3><button onClick={() => setSel(null)}><X size={16} /></button></div>
      <h4 className="font-semibold text-sm mt-3">Temperatures</h4>{[...sp.temps].reverse().map(t => <div key={t.date} className="text-sm flex justify-between"><span>{t.date}</span><span className={t.value >= FEVER ? 'text-red-600' : 'text-emerald-600'}>{t.value}°C</span></div>)}
      <h4 className="font-semibold text-sm mt-3">Doctor visits</h4>{[...sp.visits].reverse().map((v, i) => <div key={i} className="text-sm border-t py-1">{v.date} · {v.by}<br />{v.notes} – {v.treatment}{v.emergency && <div className="text-orange-600">Flag: emergency visit ({v.emergency})</div>}</div>)}</div></div>}</div>
}
