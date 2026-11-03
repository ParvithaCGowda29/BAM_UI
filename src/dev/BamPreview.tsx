// DEV-ONLY preview of the shared action button and stage stepper (/?preview=bam). Sample data, not live task status;
// nothing here talks to the backend. Forced hover/focus/pressed classes exist only in this file's <style>.
import { useState } from 'react'
import { BamActionButton, Icon } from '../components/ui'
import { BAM_ACTIONS, stageMarkers, type BamAction } from '../lib/bamUi.ts'
import { StageStep } from '../tracker/Tracker'
import { TASKS, type TrackerStatus } from '../tracker/trackerConfig.ts'

const LABEL: Record<BamAction, string> = { ingest: 'Ingest', generate: 'Generate skills', validate: 'Validate', deploy: 'Deploy', approve: 'Approve SOW', save: 'Save', review: 'Mark reviewed', commit: 'Commit' }
const STATES = ['Default', 'Hover', 'Focus', 'Pressed', 'Loading', 'Success'] as const
const FORCE = `
.pv .force-hover { transform: translateY(-1.5px); filter: brightness(1.05); box-shadow: inset 0 1px 0 rgba(255,255,255,.65), var(--bam-glow-hi); }
.pv .force-focus { outline: 2.5px solid var(--bam-focus); outline-offset: 3px; }
.pv .force-pressed { transform: translateY(.5px); background: linear-gradient(180deg, var(--bam-fill) 0%, var(--bam-fill-press) 100%); box-shadow: inset 0 2px 5px rgba(0,0,0,.28); }
.pv { padding: 28px 24px 60px; display: flex; flex-direction: column; gap: 22px; max-width: 1400px; margin: 0 auto; }
.pv-grid { display: grid; grid-template-columns: 130px repeat(6, max-content); gap: 18px 22px; align-items: center; justify-items: center; overflow-x: auto; padding: 8px 4px; }
.pv-head { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); text-align: center; }
.pv-row { font-size: 13px; color: var(--muted); }
.pv-snap { display: flex; flex-direction: column; gap: 6px; }
.pv-snap h3 { font-size: 13px; color: var(--muted); margin: 0; }
.pv-strip { overflow-x: auto; padding: 4px 4px 16px; }
`
const ns = 'not_started', ip = 'in_progress', d = 'done'
const SNAPSHOTS: [string, TrackerStatus[]][] = [
  ['01 Data Ingestion in progress', [ip, ns, ns, ns]],
  ['02 RAG in progress', [d, ip, ns, ns]],
  ['03 FDE Workbench in progress', [d, d, ip, ns]],
  ['04 All four stages done', [d, d, d, d]],
  ['Sandbox in progress', [d, d, d, ip]],
  ['All not started', [ns, ns, ns, ns]],
  ['RAG blocked', [d, 'blocked', ns, ns]],
  ['FDE Workbench needs review', [d, d, 'needs_review', ns]],
]

function Stepper({ statuses }: { statuses: TrackerStatus[] }) {
  const { markers, earned } = stageMarkers(statuses)
  return (
    <div className="pv-strip">
      <ol className="bam-stepper">
        {TASKS.map((t, i) => <StageStep key={t.id} item={t} marker={markers[i]} earned={earned[i] ?? false} last={i === 3} open={false}
          done={statuses[i] === 'done' ? 4 : statuses[i] === 'not_started' ? 0 : 2} total={4} prev={0} onToggle={() => {}} />)}
      </ol>
    </div>
  )
}

export function BamPreview() {
  const [theme, setTheme] = useState(() => {
    const t = new URLSearchParams(location.search).get('theme') ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    document.documentElement.dataset.theme = t
    document.documentElement.dataset.env = new URLSearchParams(location.search).get('env') ?? 'FDE'
    return t
  })
  const flip = () => { const t = theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; setTheme(t) }
  // Interactive sample: a fake 1.5 s async job, preview only.
  const [done, setDone] = useState(0)
  const [busy, setBusy] = useState(false)
  const fake = () => { setBusy(true); return new Promise(r => setTimeout(r, 1500)).then(() => { setBusy(false); setDone(n => n + 1) }) }
  return (
    <main className="pv" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <style>{FORCE}</style>
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0, fontSize: 22 }}>BAM action buttons and stage tracker</h1>
          <p className="muted sm" style={{ margin: '4px 0 0' }}>Development preview · sample data, not live task status</p></div>
        <button className="btn btn-secondary" onClick={flip}><Icon name={theme === 'dark' ? 'sun' : 'moon'} />{theme === 'dark' ? 'Light' : 'Dark'} theme</button>
      </header>
      <section className="pv-grid" aria-label="Button states (sample)">
        <span />
        {STATES.map(s => <span key={s} className="pv-head">{s}</span>)}
        {(Object.keys(BAM_ACTIONS) as BamAction[]).map(a => [
          <span key={a} className="pv-row">{LABEL[a]}</span>,
          ...STATES.map(s => (
            <BamActionButton key={a + s} action={a} onClick={() => {}} tabIndex={-1}
              className={s === 'Hover' ? 'force-hover' : s === 'Focus' ? 'force-focus' : s === 'Pressed' ? 'force-pressed' : ''}
              status={s === 'Loading' ? 'loading' : s === 'Success' ? 'success' : 'idle'}>{LABEL[a]}</BamActionButton>
          )),
        ])}
      </section>
      <section className="row" aria-label="Interactive sample">
        <BamActionButton action="save" busy={busy} successKey={done || undefined} onClick={fake}>Save</BamActionButton>
        <BamActionButton action="deploy" blocked onClick={() => {}}>Deploy</BamActionButton>
        <span className="muted sm">Live sample: Save runs a fake 1.5 s job; Deploy is blocked by an eligibility rule.</span>
      </section>
      {SNAPSHOTS.map(([title, st]) => <section key={title} className="pv-snap"><h3>{title}</h3><Stepper statuses={st} /></section>)}
    </main>
  )
}
