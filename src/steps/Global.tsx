// Global destinations outside the four workflow stages (BAM v3): Usage & improvement (top-bar gauge) and
// Admin > Masters (profile menu). Both are read-only with respect to the workflow: nothing here approves,
// regenerates, publishes or deploys.
import { useEffect, useState } from 'react'
import type { Snapshot } from '../api/types'
import { setUi, useUi } from '../lib/store'
import { GLOBAL_ROUTES, STATUS_LABEL, TASKS, countedOf, doneCount, taskStatus } from '../tracker/trackerConfig.ts'
import { useStatuses } from '../tracker/useTrackerStore'
import { MASTER_SUMMARIES } from '../rag/CogneePreflightCockpit'
import { Empty, Icon, Kpis, StatusPill, Time } from '../components/ui'

// ---- Usage & improvement ----------------------------------------------------------------------------------
export function UsagePage({ snap }: { snap: Snapshot }) {
  const statuses = useStatuses()
  const usage = useUi(s => s.usage)
  const notes = useUi(s => s.notes)
  const [draft, setDraft] = useState('')
  const client = snap.sow?.meta.client
  const set = (patch: Partial<typeof usage>) => setUi(s => ({ usage: { ...s.usage, ...patch } }))
  const stages = TASKS.map(t => ({ t, done: doneCount(countedOf(t.id), statuses), total: countedOf(t.id).length, st: taskStatus(t.id, statuses) }))
  const screensDone = stages.reduce((n, s) => n + s.done, 0), screens = stages.reduce((n, s) => n + s.total, 0)
  const runs = snap.testHistory.length + (snap.tests ? 1 : 0)
  const blocked = Object.values(statuses).filter(s => s === 'blocked').length
  const add = () => {
    const text = draft.trim()
    if (!text) return
    setUi(s => ({ notes: [{ id: crypto.randomUUID(), text, at: new Date().toISOString() }, ...s.notes] }))
    setDraft('')
  }
  return (
    <div className="rag">
      <div className="rag-col">
        <header className="v3-head">
          <h2 id="center-title" tabIndex={-1}>Usage &amp; improvement</h2>
          <p className="muted sm">How this workflow is progressing, and proposals to improve it. Read-only: nothing here changes a workflow.</p>
        </header>
        <div className="filter-chips" role="group" aria-label="Filters">
          <label className="v3-filter">Client
            <select className="select" value={usage.client} onChange={e => set({ client: e.target.value })}>
              <option value="all">All clients</option>{client && <option value={client}>{client}</option>}
            </select>
          </label>
          <label className="v3-filter">Workflow
            <select className="select" value={usage.workflow} onChange={e => set({ workflow: e.target.value })}>
              <option value="all">All workflows</option><option value={snap.workflowName}>{snap.workflowName}</option>
            </select>
          </label>
          <label className="v3-filter">Date range
            <select className="select" value={usage.range} onChange={e => set({ range: e.target.value as typeof usage.range })}>
              <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>
            </select>
          </label>
        </div>
        <Kpis label="This workflow" items={[
          { value: `${stages.filter(s => s.st === 'done').length} of ${stages.length}`, label: 'Stages done' },
          { value: `${screensDone} of ${screens}`, label: 'Screens done' },
          { value: runs, label: 'Test runs' },
          { value: blocked, label: 'Blocked screens', tone: blocked ? 'err' : undefined },
        ]} />
        <section className="v3-card" aria-labelledby="us-stage">
          <h3 id="us-stage" className="v3-card-title"><Icon name="checklist" size={14} />Stage completion (this workflow)</h3>
          <ul className="bars">{stages.map(s => (
            <li key={s.t.id}>
              <span className="bar-label">{s.t.label}</span>
              <span className="v3-meter" role="meter" aria-valuemin={0} aria-valuemax={s.total} aria-valuenow={s.done} aria-label={`${s.t.label}: ${s.done} of ${s.total} screens done`}><span style={{ width: `${s.total ? s.done / s.total * 100 : 0}%` }} /></span>
              <span className="muted xs bar-value">{s.done}/{s.total} · {STATUS_LABEL[s.st]}</span>
            </li>
          ))}</ul>
        </section>
        <section className="v3-card" aria-labelledby="us-week">
          <h3 id="us-week" className="v3-card-title"><Icon name="gauge" size={14} />Accepted outcomes per week</h3>
          <Empty icon="gauge" title="No usage analytics yet">Cross-workflow trends are not available yet. No usage events are captured; prompts, document names and credentials never would be.</Empty>
        </section>
        <section className="v3-card" aria-labelledby="us-notes">
          <h3 id="us-notes" className="v3-card-title"><Icon name="note" size={14} />Improvement notes</h3>
          <p className="muted xs">A note is a proposal for the team. It never approves, regenerates, publishes or deploys anything. Saved on this device.</p>
          <label className="sr-only" htmlFor="us-note">Improvement note</label>
          <textarea id="us-note" className="textarea" rows={3} value={draft} onChange={e => setDraft(e.target.value)} placeholder="What would make this workflow better?" />
          <div className="row"><button className="btn btn-primary" disabled={!draft.trim()} onClick={add}><Icon name="note" />Create improvement note</button></div>
          {notes.length > 0 && <ul className="note-list">{notes.map(n => (
            <li key={n.id}><span className="note-text">{n.text}</span><Time iso={n.at} />
              <button className="icon-btn sm" aria-label="Delete note" title="Delete note" onClick={() => setUi(s => ({ notes: s.notes.filter(x => x.id !== n.id) }))}><Icon name="x" size={12} /></button></li>
          ))}</ul>}
        </section>
      </div>
    </div>
  )
}

// ---- Admin > Masters --------------------------------------------------------------------------------------
const MASTERS = [
  { name: 'Organization', records: MASTER_SUMMARIES.org.length, editable: true },
  { name: 'Rules', records: MASTER_SUMMARIES.rules.length, editable: true },
  { name: 'Agents', records: MASTER_SUMMARIES.agents.length, editable: true },
  { name: 'Skills', records: MASTER_SUMMARIES.skills.length, editable: true },
  { name: 'Filetype', records: MASTER_SUMMARIES.filetypes.length, editable: false },
]

/** The Masters page scrolled to one master (Verify's failed-answer Edit / "Open in … master"), or undefined. */
export const masterLink = (name?: string) => name && MASTERS.some(m => m.name === name) ? `${GLOBAL_ROUTES.admin.path}#master-${name.toLowerCase()}` : undefined

export function MastersPage() {
  // Opened for one master (masterLink): scroll to it and mark its row.
  const [focus] = useState(() => decodeURIComponent(location.hash.slice(1)))
  useEffect(() => { if (focus) document.getElementById(focus)?.scrollIntoView({ block: 'center' }) }, [focus])
  const readme = () => [
    '# BAM Masters', '', 'EXAMPLE fixture data (Manufacturing_Masters_v0.2.xlsx). Masters drive every workflow.', '',
    '| Master | Records | Editable |', '|---|---|---|',
    ...MASTERS.map(m => `| ${m.name} | ${m.records} | ${m.editable ? 'Yes' : 'Frozen: add a new version instead'} |`), '',
  ].join('\n')
  const exportReadme = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([readme()], { type: 'text/markdown' })); a.download = 'BAM-Masters-README.md'; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <div className="rag">
      <div className="rag-col">
        <header className="v3-head">
          <h2 id="center-title" tabIndex={-1}>Masters <span className="tag example-tag">EXAMPLE fixture</span></h2>
          <p className="muted sm">Masters drive every workflow. Filetype is frozen: change it by adding a new version, never by editing.</p>
        </header>
        <Kpis label="Masters summary" items={[
          { value: MASTERS.length, label: 'Masters' },
          { value: MASTER_SUMMARIES.org.length, label: 'Org records' },
          { value: MASTER_SUMMARIES.rules.length, label: 'Rules' },
          { value: MASTERS.filter(m => !m.editable).length, label: 'Frozen' },
        ]} />
        <section className="v3-card table-card" aria-labelledby="ms-title">
          <h3 id="ms-title" className="sr-only">Masters</h3>
          <div className="scroll-box">
            <table className="table v3-table">
              <thead><tr><th scope="col">Master</th><th scope="col">Records</th><th scope="col">Editable</th></tr></thead>
              <tbody>{MASTERS.map(m => (
                <tr key={m.name} id={`master-${m.name.toLowerCase()}`} className={focus === `master-${m.name.toLowerCase()}` ? 'ms-hl' : undefined} aria-current={focus === `master-${m.name.toLowerCase()}` || undefined}><th scope="row">{m.name}</th><td>{m.records}</td>
                  <td>{m.editable ? <StatusPill status="pass" text="Yes" /> : <StatusPill status="locked" text="Frozen · new version only" />}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        <section className="v3-card" aria-labelledby="ms-readme">
          <h3 id="ms-readme" className="v3-card-title"><Icon name="file-text" size={14} />README</h3>
          <pre className="readme">{readme()}</pre>
        </section>
        <div className="row">
          <button className="btn btn-primary" onClick={exportReadme}><Icon name="download" />Export README</button>
          <span className="gate"><button className="btn btn-secondary" aria-disabled aria-describedby="ms-why"><Icon name="edit" />New version</button>
            <span id="ms-why" className="gate-reason"><Icon name="lock" size={12} />New versions can't be created here yet</span></span>
        </div>
      </div>
    </div>
  )
}
