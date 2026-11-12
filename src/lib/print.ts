import { Patient } from '../logic'

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)

export function printDischargeSummary(patient: Patient, facilityName: string, today: string) {
  const temps = patient.temps
    .map((t) => `<tr><td>${esc(t.date)}</td><td>${esc(t.value)} C</td><td>${esc(t.by)}</td></tr>`)
    .join('')
  const visits = patient.visits
    .map(
      (v) =>
        `<tr><td>${esc(v.date)}</td><td>${esc(v.notes)}</td><td>${esc(v.treatment)}</td><td>${esc(v.by)}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Discharge summary - ${esc(patient.name)}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;color:#0f2a52;padding:40px;max-width:760px;margin:auto}
    h1{font-size:20px;margin:0}
    .muted{color:#64748b;font-size:12px}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:18px 0}
    .box{border:1px solid #e2e8f0;border-radius:8px;padding:10px}
    .label{font-size:11px;text-transform:uppercase;color:#94a3b8}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
    th{background:#f1f5f9}
    h2{font-size:14px;margin-top:24px}
    .sign{margin-top:48px;display:flex;justify-content:space-between}
    .sign div{border-top:1px solid #0f2a52;width:40%;padding-top:6px;font-size:12px}
  </style></head><body>
    <h1>${esc(facilityName)}</h1>
    <div class="muted">Patient Discharge Summary &middot; generated ${esc(today)}</div>
    <div class="grid">
      <div class="box"><div class="label">Patient</div>${esc(patient.name)} (${esc(patient.id)})</div>
      <div class="box"><div class="label">Age</div>${esc(patient.age)} years</div>
      <div class="box"><div class="label">Admitted</div>${esc(patient.admitted)}</div>
      <div class="box"><div class="label">Status</div>${esc(patient.status)}${patient.outcomeDate ? ' on ' + esc(patient.outcomeDate) : ''}</div>
    </div>
    <h2>Temperature history</h2>
    <table><thead><tr><th>Date</th><th>Reading</th><th>Recorded by</th></tr></thead><tbody>${temps || '<tr><td colspan="3">None</td></tr>'}</tbody></table>
    <h2>Doctor visits</h2>
    <table><thead><tr><th>Date</th><th>Notes</th><th>Treatment</th><th>Doctor</th></tr></thead><tbody>${visits || '<tr><td colspan="4">None</td></tr>'}</tbody></table>
    <div class="sign"><div>Doctor signature</div><div>Administrator signature</div></div>
  </body></html>`

  const w = window.open('', '_blank', 'width=820,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}
