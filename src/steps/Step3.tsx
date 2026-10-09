// Sandbox 4.1 Activities, 4.2 Manifest JSON and 4.3 Generated code: three routes over ONE validation run.
// They share the editors, the backend document versions and one draft store (lib/drafts), so moving
// between them never loses or forks an unsaved edit.
import { useEffect, useRef, useState } from 'react'
import Editor, { DiffEditor, type BeforeMount, type OnMount } from '@monaco-editor/react'
import { api } from '../api/adapter'
import type { Activity, CodeFile, Finding, Snapshot, StepInfo } from '../api/types'
import type { StepProps } from '../App'
import { useAction, useCode, useSkills } from '../lib/data'
import { setUi, toast, useUi } from '../lib/store'
import { goScreen, goStep } from '../lib/route'
import { setCodeDraft, setDrafts, unsaved, useDrafts } from '../lib/drafts'
import { certifiedBaseline, currentTests } from '../lib/certification'
import { Banner, Copy, Empty, ErrorState, GateButton, Icon, Pane, Section, Skeleton, StatusPill, Time, fmtDuration, fmtTime, shortHash } from '../components/ui'

export const codeRev = (snap: Snapshot) => {
  const c = snap.workflow?.activities[2]
  return `${snap.workflow?.runId}:${c?.attempts}:${c?.status}:${c?.endedAt}:${snap.workflow?.manifest?.hash}`
}

export const defineThemes: BeforeMount = monaco => {
  monaco.editor.defineTheme('bam-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#0B1526', 'editor.lineHighlightBackground': '#101E32', 'editorGutter.background': '#0B1526' } })
  monaco.editor.defineTheme('bam-light', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#FFFFFF', 'editorGutter.background': '#FFFFFF' } })
  // Staging view: the editors follow the orange palette too.
  monaco.editor.defineTheme('bam-dark-staging', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#1A1108', 'editor.lineHighlightBackground': '#24180C', 'editorGutter.background': '#1A1108' } })
  monaco.editor.defineTheme('bam-light-staging', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#FFFCF8', 'editorGutter.background': '#FFFCF8' } })
}
export const editorTheme = (theme: 'dark' | 'light', staging: boolean) => `bam-${theme}${staging ? '-staging' : ''}`

/** Open a file (and line) in the canonical 4.3 Generated code editor. */
export const openCode = (file: string, line?: number) => { setUi({ codeFocus: { file, line } }); goScreen('4.3') }

export function FindingItem({ f, files }: { f: Finding; files?: CodeFile[] }) {
  const file = f.file ?? files?.find(x => x.skillId === f.skillId)?.path
  return (
    <li className={`finding ${f.resolved ? 'resolved' : ''}`}>
      <StatusPill status={f.resolved ? 'succeeded' : f.severity === 'error' ? 'fail' : 'needs_review'} text={f.resolved ? 'Resolved' : f.severity === 'error' ? 'Error' : 'Warning'} />
      <span className="finding-msg">{f.message}</span>
      <span className="finding-refs">
        {f.skillId && <span className="mono xs">{f.skillId}</span>}
        {file && <button className="link xs" onClick={() => openCode(file, f.line)} title={`Open ${file}${f.line ? ` at line ${f.line}` : ''} in 4.3 Generated code`}>
          <Icon name="file" size={11} />{file}{f.line ? `:${f.line}` : ''}{!f.resolved && ' · open in 4.3'}
        </button>}
      </span>
    </li>
  )
}

function ActivityCard({ a, editable, files, onRetry, busy }: { a: Activity; editable: boolean; files?: CodeFile[]; onRetry: () => void; busy: boolean }) {
  const dur = fmtDuration(a.startedAt, a.endedAt)
  const earlierFailures = a.history.filter(h => h.status === 'failed' && h.attempt < a.attempts)
  return (
    <li className={`activity st-${a.status}`}>
      <div className="activity-rail"><span className="activity-key" aria-hidden>{a.key}</span></div>
      <article className="activity-card" aria-label={`Activity ${a.key}: ${a.label}, ${a.status}`}>
        <header>
          <h3><span className="sr-only">Activity {a.key}: </span>{a.label}</h3>
          <StatusPill status={a.status} text={a.status === 'succeeded' && earlierFailures.length ? `Succeeded on attempt ${a.attempts}` : undefined} />
        </header>
        <dl className="meta">
          <div><dt>Attempts</dt><dd>{a.attempts}</dd></div>
          <div><dt>Duration</dt><dd>{dur ?? (a.status === 'running' ? 'in progress' : '—')}</dd></div>
          <div><dt>Started</dt><dd><Time iso={a.startedAt} /></dd></div>
        </dl>
        {a.detail && <p className="stage-detail">{a.detail}</p>}
        {a.status === 'failed' && a.reason && <p className="stage-error"><Icon name="alert" size={12} /> {a.reason}</p>}
        {a.history.length > 1 && (
          <details className="attempts">
            <summary>Attempt history ({a.history.length})</summary>
            <ol>{a.history.map(h => (
              <li key={h.attempt}>
                <span className="mono xs">#{h.attempt}</span>
                <StatusPill status={h.status} />
                <span className="muted xs">{fmtDuration(h.startedAt, h.endedAt) ?? ''} · <Time iso={h.endedAt} /></span>
                {h.reason && h.status === 'failed' && <span className="xs attempt-reason">{h.reason}</span>}
              </li>
            ))}</ol>
          </details>
        )}
        {a.findings.length > 0 && (
          <details className="findings" open={a.status === 'failed' || a.findings.some(f => !f.resolved)}>
            <summary>{a.findings.length} finding{a.findings.length === 1 ? '' : 's'}{a.findings.every(f => f.resolved) ? ' (all resolved)' : ''}</summary>
            <ul>{a.findings.map(f => <FindingItem key={f.id} f={f} files={files} />)}</ul>
          </details>
        )}
        {a.status === 'failed' && editable && (
          <button className="btn btn-secondary sm" onClick={onRetry} disabled={busy}><Icon name="refresh" />Retry from {a.key}</button>
        )}
      </article>
    </li>
  )
}

// ---- shared review state for 4.1–4.3 ------------------------------------------------------------
function useReview(snap: Snapshot, info: StepInfo) {
  const wf = snap.workflow
  const m = wf?.manifest
  const code = useCode(codeRev(snap))
  const drafts = useDrafts(d => d)
  const manifestJson = m ? JSON.stringify(m, null, 2) : ''
  const pending = unsaved(drafts, { code: Object.fromEntries((code.files ?? []).map(f => [f.path, f.content])), manifest: m ? manifestJson : undefined })
  const approved = !!m && wf?.approval?.hash === m.hash
  const running = wf?.status === 'running'
  const editable = info.editable && !running
  const lockedReason = approved ? `Approved ${fmtTime(wf!.approval!.at)} by ${wf!.approval!.by}. The manifest and code are locked.`
    : running ? 'The workflow is running; edit once it finishes.' : 'This screen is read-only.'
  const unsavedText = [pending.files.length ? `${pending.files.length} code file${pending.files.length === 1 ? '' : 's'} (4.3)` : '', pending.manifest ? 'the manifest (4.2)' : ''].filter(Boolean).join(' and ')
  const approveReason = !wf ? 'No validation run yet' : !info.editable ? (approved ? 'Already approved' : 'This screen is read-only')
    : running ? 'Wait for the workflow to finish' : wf.status !== 'succeeded' || !m ? 'Activities A–C must pass first (see open findings)'
    : pending.any ? `Save or discard your edits to ${unsavedText} first` : undefined
  const retryReason = !info.editable ? (approved ? 'Approved; the run is locked' : 'This screen is read-only') : running ? 'The workflow is already running' : undefined
  return { wf, m, ...code, drafts, pending, manifestJson, approved, running, editable, lockedReason, approveReason, retryReason }
}

/** The former 4.1 tabs, now links to the canonical 4.1 / 4.2 / 4.3 routes. */
function SandboxNav({ current, snap, info }: { current: '4.1' | '4.2' | '4.3'; snap: Snapshot; info: StepInfo }) {
  const r = useReview(snap, info)
  const openFindings = r.wf?.activities.some(a => a.findings.some(f => !f.resolved && f.file))
  const items: ['4.1' | '4.2' | '4.3', string, boolean, boolean][] = [
    ['4.1', 'Activities', false, false], ['4.2', 'Manifest JSON', false, r.pending.manifest], ['4.3', 'Generated code', !!openFindings, r.pending.files.length > 0],
  ]
  return (
    <nav className="tabs subnav" aria-label="Validation views">
      {items.map(([id, label, dot, dirty]) => (
        <button key={id} className="tab" aria-current={current === id ? 'page' : undefined} onClick={() => goScreen(id)}>
          <span className="mono xs">{id}</span> {label}
          {dot && <span className="tab-dot" aria-label="has open findings" />}
          {dirty && <span className="tab-unsaved" aria-label="unsaved changes">•</span>}
        </button>
      ))}
    </nav>
  )
}

/** The same decision at the end of 4.1, 4.2 and 4.3: Start validation approves the manifest and code (tied to the hash),
 *  starts the 4.4 sandbox + assertion run and opens 4.4. With an existing run for this hash it only opens 4.4. */
function ReviewActions({ snap, info }: StepProps & { screen: '4.1' | '4.2' | '4.3' }) {
  const r = useReview(snap, info)
  const { busy, run } = useAction()
  const { wf, m } = r
  if (!wf) return null
  const tests = currentTests(snap)
  const tested = !!tests
  // "Validated" only when the sandbox + assertion run for this manifest hash actually passed.
  const passedRun = tests?.promptfoo.status === 'succeeded' ? tests.runId : undefined
  const start = () => run('Start validation', async () => {
    if (!r.approved) await api.approveManifest()
    if (!tested) await api.runTests()
  }, { success: tested ? undefined : `Manifest ${m?.version} approved. Sandbox and assertions are running in 4.4.`, step: 4 }).then(() => goStep(4))
  return (
    <div className="foot-stack end-actions">
      <div className="validation-row">
        <StatusPill status={r.running ? 'running' : wf.status === 'failed' ? 'fail' : 'pass'} text={r.running ? 'Validation running' : wf.status === 'failed' ? 'Validation failed' : 'Validation passed'} />
        <span className="muted sm">Temporal activities A–D. Approve the manifest (4.2) and generated code (4.3) to unlock 4.4 testing.</span>
        <GateButton variant="secondary" icon="refresh" reason={r.retryReason} busy={busy === 'Retry workflow'}
          onClick={() => void run('Retry workflow', () => api.retryActivity('A'), { success: 'Workflow re-run started (A–D). Your code edits are kept.', step: 3 })}>Retry</GateButton>
      </div>
      <div className="approve-row">
        <span className="muted sm">{r.approved ? `Approved ${fmtTime(wf.approval!.at)}: manifest ${m!.version} (${shortHash(m!.hash)})${tested ? '. Sandbox run started; results in 4.4.' : ''}`
          : m ? `Approves manifest ${m.version} (${shortHash(m.hash)}) and its code, runs the CubeSandbox and Promptfoo assertions, and opens 4.4` : 'Approves the manifest and code, then runs the sandbox and assertions in 4.4'}</span>
        <GateButton action="validate" reason={r.approved ? undefined : r.approveReason} busy={busy === 'Start validation'} successKey={passedRun} onClick={start}>Start validation</GateButton>
      </div>
    </div>
  )
}

function NoRun({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Pane id="center-title" kicker={kicker} title={title} className="center">
      <Empty icon="clock" title="No validation run">Generate the ISATVON Contract in 3.2 to start the Temporal validation workflow.</Empty>
    </Pane>
  )
}

function ChangesSwitch({ on, set, title }: { on: boolean; set: (v: boolean) => void; title: string }) {
  return (
    <label className="switch" title={title}>
      <input type="checkbox" role="switch" checked={on} onChange={e => set(e.target.checked)} />
      <span className="switch-track" aria-hidden><span /></span>Changes
    </label>
  )
}

function RunPill({ r }: { r: ReturnType<typeof useReview> }) {
  const wf = r.wf!
  return <StatusPill status={r.approved ? 'done' : r.running ? 'running' : wf.status === 'failed' ? 'failed' : 'needs_review'}
    text={r.approved ? 'Approved' : r.running ? 'Workflow running' : wf.status === 'failed' ? 'Workflow failed' : 'Awaiting approval'} />
}

// ---- 4.1 Activities ------------------------------------------------------------------------------
export function ActivitiesCenter({ snap, info }: StepProps) {
  const r = useReview(snap, info)
  const { busy, run } = useAction()
  const wf = r.wf
  if (!wf) return <NoRun kicker="4.1 · Activities" title="Validation activities" />
  const c = wf.activities[2], d = wf.activities[3]
  const cFirstFail = c.history.find(h => h.status === 'failed')
  const open = wf.activities.flatMap(a => a.findings.filter(f => !f.resolved))
  return (
    <Pane id="center-title" kicker="4.1 · Activities" title="Validation activities" className="center"
      actions={<RunPill r={r} />}>
      <SandboxNav current="4.1" snap={snap} info={info} />
      <dl className="kv inline">
        <div><dt>Workflow ID</dt><dd><Copy value={wf.workflowId} label="workflow ID" /></dd></div>
        <div><dt>Run ID</dt><dd><Copy value={wf.runId} display={`${wf.runId.slice(0, 13)}…`} label="run ID" /></dd></div>
        <div><dt>Started</dt><dd><Time iso={wf.startedAt} /></dd></div>
        <div><dt>Duration</dt><dd>{fmtDuration(wf.startedAt, wf.endedAt) ?? 'in progress'}</dd></div>
      </dl>
      {/* One narrative: a recovered failure is history, not a current failure. */}
      {d.status === 'succeeded' && c.status === 'succeeded' && cFirstFail && (
        <Banner tone="ok" icon="refresh">Recovered: C attempt {cFirstFail.attempt} failed ({cFirstFail.reason}); fallback D re-routed the payload; C passed on attempt {c.attempts}. The failed attempt stays in C's history. No open failure.</Banner>)}
      {d.status === 'succeeded' && c.status === 'failed' && <Banner tone="err" icon="alert">Fallback D ran, but C still fails on attempt {c.attempts}. Fix the open findings in 4.3, then retry.</Banner>}
      {wf.status === 'failed' && !(d.status === 'succeeded' && c.status === 'failed') && <Banner tone="err" icon="alert">The workflow stopped. Failed activities stay listed below with their reason; fix the cause and retry.</Banner>}
      {open.length > 0 && (
        <Section title="Open findings" aside={<span className="muted sm">{open.length}</span>}>
          <ul className="findings compact">{open.map(f => <FindingItem key={f.id} f={f} files={r.files} />)}</ul>
        </Section>
      )}
      <ol className="timeline">
        {wf.activities.map(a => <ActivityCard key={a.key} a={a} files={r.files} editable={info.editable} busy={!!busy}
          onRetry={() => run(`Retry ${a.key}`, () => api.retryActivity(a.key), { step: 3 })} />)}
      </ol>
      <ReviewActions snap={snap} info={info} screen="4.1" />
    </Pane>
  )
}

// ---- 4.3 Generated code ----------------------------------------------------------------------------
export function CodeCenter({ snap, info }: StepProps) {
  const r = useReview(snap, info)
  const [showChanges, setShowChanges] = useState(true)
  if (!r.wf) return <NoRun kicker="4.3 · Generated code" title="Generated code" />
  const findings = r.wf.activities.flatMap(a => a.findings)
  return (
    <Pane id="center-title" kicker="4.3 · Generated code" title="Generated code" className="center"
      actions={<span className="row"><ChangesSwitch on={showChanges} set={setShowChanges} title="Colour-code edits against the generated code" /><RunPill r={r} /></span>}>
      <SandboxNav current="4.3" snap={snap} info={info} />
      {r.error ? <ErrorState title="Could not load generated code" action={<button className="btn btn-primary" onClick={() => r.refetch()}>Retry</button>}>{r.error.message}</ErrorState>
        : r.isLoading && !r.files ? <Skeleton rows={8} label="Loading generated code" />
        : !r.files?.length ? <Empty icon="file" title="No generated code yet">Activity C renders each skill through the Jinja2 template and parses it.</Empty>
        : <CodeView files={r.files} findings={findings} editable={r.editable} lockedReason={r.lockedReason} showChanges={showChanges} cStatus={r.wf.activities[2].status} />}
      <ReviewActions snap={snap} info={info} screen="4.3" />
    </Pane>
  )
}

// ---- 4.2 Manifest JSON ----------------------------------------------------------------------------
export function ManifestCenter({ snap, info }: StepProps) {
  const r = useReview(snap, info)
  const [showChanges, setShowChanges] = useState(true)
  const base = certifiedBaseline(snap)
  const [baseline, setBaseline] = useState<'certified' | 'generated'>(base ? 'certified' : 'generated')
  useEffect(() => { if (!base && baseline === 'certified') setBaseline('generated') }, [base, baseline])
  if (!r.wf) return <NoRun kicker="4.2 · Manifest JSON" title="Manifest JSON" />
  const m = r.m
  const original = baseline === 'certified' && base ? base.manifest : r.wf.generatedManifest ?? r.manifestJson
  const baseLabel = baseline === 'certified' && base ? `certified ${base.version} (${base.hash.slice(0, 8)})` : 'generated by the run (not certified)'
  return (
    <Pane id="center-title" kicker="4.2 · Manifest JSON" title="Manifest JSON" className="center"
      actions={<span className="row"><ChangesSwitch on={showChanges} set={setShowChanges} title="Colour-code edits against the chosen baseline" /><RunPill r={r} /></span>}>
      <SandboxNav current="4.2" snap={snap} info={info} />
      {!m ? <Empty icon="file" title="No manifest yet">The manifest is written when activities A–C pass{r.running ? '. The workflow is running now.' : '.'}</Empty> : <>
        <dl className="kv inline">
          <div><dt>Version</dt><dd className="mono">{m.version}</dd></div>
          <div><dt>Hash (SHA-256)</dt><dd><Copy value={m.hash} display={shortHash(m.hash)} label="manifest hash" /></dd></div>
          <div><dt>Updated</dt><dd><Time iso={m.createdAt} /></dd></div>
          <div><dt>Approval</dt><dd>{r.approved ? <StatusPill status="done" text="Approved for this hash" /> : <StatusPill status="pending" text="Not approved" />}</dd></div>
        </dl>
        <div className="baseline-bar">
          <label className="field inline">Diff baseline
            <select value={baseline} onChange={e => setBaseline(e.target.value as 'certified' | 'generated')} aria-label="Diff baseline">
              <option value="certified" disabled={!base}>{base ? `Certified ${base.version} (release comparison)` : 'Certified (none yet)'}</option>
              <option value="generated">Generated by the run</option>
            </select>
          </label>
          {!base && <span className="muted xs"><Icon name="alert" size={11} /> First build: no certified baseline exists yet, so the comparison uses the generated manifest.</span>}
        </div>
        <ManifestView key={baseline} original={original} baseLabel={baseLabel} current={r.manifestJson} editable={r.editable && r.wf.status === 'succeeded'} lockedReason={r.lockedReason} showChanges={showChanges} />
      </>}
      <ReviewActions snap={snap} info={info} screen="4.2" />
    </Pane>
  )
}

export function Left({ snap }: StepProps) {
  const { rows, isLoading } = useSkills(snap.skillsRevision)
  const { files } = useCode(codeRev(snap))
  const findings = snap.workflow?.activities.flatMap(a => a.findings.filter(f => !f.resolved)) ?? []
  if (isLoading && !rows) return <Pane id="left-title" kicker="Context and navigation" title="Skills"><Skeleton rows={6} /></Pane>
  const agents = [...new Set((rows ?? []).map(r => r.agent))]
  return (
    <Pane id="left-title" kicker="Context and navigation" title="Skills in this contract">
      {!rows?.length ? <Empty title="No skills">Skills come from the reviewed grid in 3.2.</Empty> : agents.map(m => (
        <Section key={m} title={m}>
          <ul className="nav-list">
            {rows.filter(r => r.agent === m).map(r => {
              const n = findings.filter(f => f.skillId === r.id).length
              const file = files?.find(f => f.skillId === r.id)?.path
              return (
                <li key={r.id}>
                  <button className="nav-item" disabled={!file} onClick={() => file && openCode(file)} title={file ? `Open ${file} in 4.3` : 'Code not generated yet'}>
                    <span>{r.name}</span>
                    {n > 0 ? <StatusPill status="fail" text={`${n}`} /> : <span className="mono xs muted">{r.id}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>
      ))}
    </Pane>
  )
}

type MonacoEditor = Parameters<OnMount>[0]
type Monaco = Parameters<OnMount>[1]

/**
 * Editable Monaco view. With `showChanges` it is an inline diff against `original` (green added, red removed),
 * like the colour coding on the SOW and the grid; the right-hand (current) side is the one you edit.
 */
export function ReviewEditor({ path, language, original, value, editable, lockedReason, showChanges, onChange, onSave, onReady }: {
  path: string; language: string; original: string; value: string; editable: boolean; lockedReason: string; showChanges: boolean
  onChange: (v: string) => void; onSave: () => void; onReady?: (e: MonacoEditor, m: Monaco) => void
}) {
  const theme = useUi(s => s.theme)
  const staging = useUi(s => s.env === 'Staging')
  const latest = useRef({ onChange, onSave, editable, value })
  latest.current = { onChange, onSave, editable, value }
  const bind = (e: MonacoEditor, m: Monaco) => {
    e.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => latest.current.onSave())
    // Only user typing is a draft: when the app syncs new content in (after a save or a re-run), the editor
    // already holds the value it was given, so that change is ignored.
    e.onDidChangeModelContent(() => {
      const v = e.getValue()
      if (latest.current.editable && v !== latest.current.value) latest.current.onChange(v)
    })
    onReady?.(e, m)
  }
  const options = {
    readOnly: !editable, readOnlyMessage: { value: lockedReason }, automaticLayout: true, minimap: { enabled: false }, glyphMargin: true,
    fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", scrollBeyondLastLine: false, tabSize: language === 'json' ? 2 : 4, insertSpaces: true,
  }
  return showChanges
    ? <DiffEditor key={`diff:${path}`} height="100%" language={language} original={original} modified={value}
        originalModelPath={`base/${path}`} modifiedModelPath={`current/${path}`} beforeMount={defineThemes} theme={editorTheme(theme, staging)}
        // Models are reused by path; letting the wrapper dispose them on unmount races the diff widget.
        keepCurrentOriginalModel keepCurrentModifiedModel
        onMount={(d, m) => bind(d.getModifiedEditor(), m)} loading={<Skeleton rows={8} label="Loading editor" />}
        options={{ ...options, renderSideBySide: false, originalEditable: false, renderOverviewRuler: false, ignoreTrimWhitespace: false }} />
    : <Editor key={`edit:${path}`} height="100%" language={language} path={`current/${path}`} value={value} beforeMount={defineThemes}
        theme={editorTheme(theme, staging)} onMount={bind} loading={<Skeleton rows={8} label="Loading editor" />}
        options={{ ...options, ariaLabel: `Editor for ${path}` }} />
}

function CodeView({ files, findings, editable, lockedReason, showChanges, cStatus }: {
  files: CodeFile[]; findings: Finding[]; editable: boolean; lockedReason: string; showChanges: boolean; cStatus: Activity['status']
}) {
  const focus = useUi(s => s.codeFocus)
  const drafts = useDrafts(d => d.code)
  const [path, setPath] = useState(files[0]?.path)
  const [saveError, setSaveError] = useState<string>()
  const [savedAt, setSavedAt] = useState<number>()
  const { busy, run } = useAction()
  const ed = useRef<MonacoEditor | null>(null)
  const mon = useRef<Monaco | null>(null)
  const deco = useRef<{ clear(): void } | null>(null)
  useEffect(() => { if (focus?.file && files.some(f => f.path === focus.file)) setPath(focus.file) }, [focus, files])
  const current = files.find(f => f.path === path) ?? files[0]
  const fileFindings = findings.filter(f => f.file === current?.path)
  const openHere = fileFindings.filter(f => !f.resolved)
  const draft = current ? drafts[current.path] : undefined
  const dirty = draft !== undefined && draft !== current?.content
  const isDirty = (f: CodeFile) => drafts[f.path] !== undefined && drafts[f.path] !== f.content
  const dirtyCount = files.filter(isDirty).length
  // A saved draft is dropped only once the server's content matches it, so the editor never flips back to old text.
  useEffect(() => {
    const done = files.filter(f => drafts[f.path] !== undefined && drafts[f.path] === f.content).map(f => f.path)
    if (done.length) setDrafts(d => { const code = { ...d.code }; for (const p of done) delete code[p]; return { code } })
  }, [files, drafts])

  const reveal = () => {
    const line = focus?.file === current?.path ? focus?.line : undefined
    deco.current?.clear()
    if (!ed.current || !mon.current || !line) return
    ed.current.revealLineInCenter(line)
    ed.current.setPosition({ lineNumber: line, column: 1 })
    deco.current = ed.current.createDecorationsCollection([{ range: new mon.current.Range(line, 1, line, 1), options: { isWholeLine: true, className: 'code-hl', glyphMarginClassName: 'code-glyph' } }])
  }
  useEffect(reveal, [focus, current?.path, showChanges])

  // Backend findings shown as squiggles on the lines they point at.
  useEffect(() => {
    const model = ed.current?.getModel()
    const m = mon.current
    if (!model || !m) return
    m.editor.setModelMarkers(model, 'bam', fileFindings.filter(f => !f.resolved && f.line && f.line <= model.getLineCount()).map(f => ({
      startLineNumber: f.line!, endLineNumber: f.line!, startColumn: 1, endColumn: model.getLineMaxColumn(f.line!),
      message: f.message, severity: m.MarkerSeverity.Error,
    })))
  })

  async function save() {
    if (!current || !dirty || !editable || busy) return
    setSaveError(undefined)
    const passed = await run('Save code', async () => {
      try { return await api.saveCode(current.path, draft!) } catch (e) { setSaveError((e as Error).message); throw e }
    }, { step: 3 })
    if (passed === undefined) return // save failed; the draft is kept
    if (passed) setSavedAt(Date.now())
    toast(passed ? `${current.path} saved. Activity C's AST check passed; the manifest hash was recomputed.` : `${current.path} saved, but activity C's AST check failed. See the findings.`, passed ? 'success' : 'error', '4.3')
  }

  return (
    <div className="code-view">
      <div className="code-bar">
        <label className="field inline">File
          <select value={current?.path} onChange={e => setPath(e.target.value)}>
            {files.map(f => (
              <option key={f.path} value={f.path}>
                {f.path}{isDirty(f) ? ' • unsaved' : f.edited ? ' • edited' : ''}{findings.some(x => x.file === f.path && !x.resolved) ? ' • findings' : ''}
              </option>
            ))}
          </select>
        </label>
        {current && <Copy value={current.path} display="" label="file path" />}
        {current?.edited && !dirty && <span className="mark-edited"><Icon name="edit" size={10} />Edited by you</span>}
        {dirty && <span className="mark-unsaved" role="status"><Icon name="dot" size={10} />Unsaved changes</span>}
        {showChanges && <span className="diff-legend"><ins className="d-added">Added</ins><del className="d-removed">Removed</del><span className="muted xs">baseline: generated code</span></span>}
      </div>
      {!editable && <Banner tone="ok" icon="lock">{lockedReason}</Banner>}
      {saveError && <Banner tone="err" icon="alert"><strong>Save failed:</strong> {saveError}. Your edits are kept in the editor; fix the cause and save again.</Banner>}
      {dirty && editable && <Banner tone="warn" icon="refresh"><strong>Validation is stale for your edits.</strong> Activity C's AST check last ran on the saved version of this file. Save and re-validate to check the edited code.</Banner>}
      {!dirty && openHere.length > 0 && <Banner tone="err" icon="alert">Activity C's AST check fails on this file ({openHere.map(f => `line ${f.line}`).join(', ')}). Approval is blocked until it passes.</Banner>}
      {!dirty && cStatus === 'succeeded' && current?.edited && openHere.length === 0 && <Banner tone="ok" icon="check">Your edits to this file passed activity C's AST check.</Banner>}
      {fileFindings.length > 0 && <ul className="findings compact">{fileFindings.map(f => <FindingItem key={f.id} f={f} />)}</ul>}
      <div className="monaco-box">
        {current && <ReviewEditor path={current.path} language="python" original={current.generated} value={draft ?? current.content}
          editable={editable} lockedReason={lockedReason} showChanges={showChanges}
          onChange={v => setCodeDraft(current.path, v)} onSave={() => void save()}
          onReady={(e, m) => { ed.current = e; mon.current = m; reveal() }} />}
      </div>
      {editable && (
        <div className="code-actions">
          <span className="muted xs">{dirtyCount > 1 ? `${dirtyCount} files have unsaved changes · ` : ''}Saving re-runs activity C's AST check · Ctrl/Cmd+S</span>
          <button className="btn btn-ghost sm" disabled={!dirty || !!busy} onClick={() => current && setCodeDraft(current.path, undefined)}>Discard</button>
          <GateButton action="save" reason={dirty ? undefined : 'No changes to save'} busy={busy === 'Save code'} successKey={savedAt} onClick={save}>Save and re-validate</GateButton>
        </div>
      )}
    </div>
  )
}

function ManifestView({ original, baseLabel, current, editable, lockedReason, showChanges }: {
  original: string; baseLabel: string; current: string; editable: boolean; lockedReason: string; showChanges: boolean
}) {
  const draft = useDrafts(d => d.manifest)
  const setDraft = (v: string | undefined) => setDrafts({ manifest: v })
  const { busy, run } = useAction()
  const [saveError, setSaveError] = useState<string>()
  const [savedAt, setSavedAt] = useState<number>()
  const savedFrom = useRef<string | null>(null)
  // Once the saved manifest arrives (hash recomputed), the draft is replaced by it.
  useEffect(() => { if (savedFrom.current !== null && current !== savedFrom.current) { savedFrom.current = null; setDrafts({ manifest: undefined }) } }, [current])
  const dirty = draft !== undefined && draft !== current && savedFrom.current === null
  let invalid: string | undefined
  if (dirty) try { JSON.parse(draft) } catch (e) { invalid = (e as Error).message }
  async function save() {
    if (!dirty || !editable || busy || invalid) return
    const from = current
    setSaveError(undefined)
    await run('Save manifest', async () => {
      try { await api.saveManifest(draft!); savedFrom.current = from; setSavedAt(Date.now()) } catch (e) { setSaveError((e as Error).message); throw e }
    }, { success: 'Manifest saved. Version and hash updated; the approval for the previous hash no longer applies.', step: 3 })
  }
  return (
    <div className="code-view">
      <div className="code-bar">
        <span className="muted sm">Editable: <code>version</code>, agent and skill <code>name</code>s. <code>hash</code> and <code>createdAt</code> are recomputed on save.</span>
        {dirty && <span className="mark-unsaved" role="status"><Icon name="dot" size={10} />Unsaved changes</span>}
        {showChanges && <span className="diff-legend"><ins className="d-added">Added</ins><del className="d-removed">Removed</del><span className="muted xs">baseline: {baseLabel}</span></span>}
      </div>
      {!editable && <Banner tone="ok" icon="lock">{lockedReason}</Banner>}
      {invalid && <Banner tone="err" icon="alert"><strong>Invalid JSON:</strong> {invalid}. Fix it to save; your text is kept.</Banner>}
      {saveError && <Banner tone="err" icon="alert"><strong>Save failed:</strong> {saveError}. Your edits are kept.</Banner>}
      <div className="monaco-box">
        <ReviewEditor path="manifest.json" language="json" original={original} value={draft ?? current} editable={editable} lockedReason={lockedReason}
          showChanges={showChanges} onChange={v => setDraft(v)} onSave={() => void save()} />
      </div>
      {editable && (
        <div className="code-actions">
          <span className="muted xs">Saving validates the JSON and clears the approval · Ctrl/Cmd+S</span>
          <button className="btn btn-ghost sm" disabled={!dirty || !!busy} onClick={() => setDraft(undefined)}>Discard</button>
          <GateButton action="save" reason={!dirty ? 'No changes to save' : invalid ? 'Fix the JSON first' : undefined} busy={busy === 'Save manifest'} successKey={savedAt} onClick={save}>Save manifest</GateButton>
        </div>
      )}
    </div>
  )
}

// Evidence only: no editing here. Links open the code in 4.3.
export function Right({ snap }: StepProps) {
  const wf = snap.workflow
  const m = wf?.manifest
  const { files } = useCode(codeRev(snap))
  const open = wf?.activities.flatMap(a => a.findings.filter(f => !f.resolved)) ?? []
  return (
    <Pane id="right-title" kicker="Evidence and status" title="Manifest and findings">
      {!m ? <Empty icon="file" title="No manifest yet">The manifest is written when activities A–C pass{wf?.status === 'running' ? '. The workflow is running now.' : '.'}</Empty> : <>
        <dl className="kv">
          <div><dt>Version</dt><dd className="mono">{m.version}</dd></div>
          <div><dt>SHA-256</dt><dd><Copy value={m.hash} display={shortHash(m.hash)} label="manifest hash" /></dd></div>
          <div><dt>Updated</dt><dd><Time iso={m.createdAt} /></dd></div>
          <div><dt>From SOW</dt><dd className="mono">v{m.sowVersion}</dd></div>
        </dl>
        <Section title="Skills → files">
          <ul className="nav-list">
            {m.skills.map(s => <li key={s.id} className="file-link">
              <button className="nav-item" onClick={() => openCode(s.file)} title={`Open ${s.file} in 4.3 Generated code`}>
                <span>{s.agent} › {s.name}</span></button>
              <Copy value={s.file} display={s.file.replace('skills/', '')} label="file path" />
            </li>)}
          </ul>
        </Section>
      </>}
      <Section title="Open findings" aside={<span className="muted sm">{open.length}</span>}>
        {open.length === 0 ? <p className="muted sm">{wf ? 'No open findings.' : 'Findings appear while the workflow runs.'}</p>
          : <ul className="findings compact">{open.map(f => <FindingItem key={f.id} f={f} files={files} />)}</ul>}
      </Section>
    </Pane>
  )
}
