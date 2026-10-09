// 1.1 Intake console: upload & virus scan. Files are staged in quarantine and scanned; only released, Verified
// files can enter RAG, and only through "Start ingestion run". Every scan state comes from the backend snapshot;
// the eligibility rule is the same pure check the backend enforces (api/scanGate.ts).
// Every selection (browse, drop, many files, folder, ZIP) is triaged first: incompatible files are filtered out,
// then the user chooses what fits the batch (25 files, 250 MB) before Upload turns on.
import { useRef, useState } from 'react'
import { useUppyState } from '@uppy/react'
import { api } from '../api/adapter'
import type { ScanOutcome } from '../api/adapter'
import { ACCEPTED_TYPES, AV_NAME, AV_VENDOR, CHUNK_BYTES, chunkCount, MAX_BATCH_BYTES, MAX_BATCH_FILES, MAX_UPLOAD_BYTES, type ScanEvent, type Snapshot, type UploadRecord } from '../api/types'
import { autoPick, chunkNames, fit, ingestionBlock, scanView, triage, type ScanAction, type Triage } from '../api/scanGate.ts'
import type { StepProps } from '../App'
import { useAction } from '../lib/data'
import { setUi, toast, uploadFiles, uppy } from '../lib/store'
import { goScreen } from '../lib/route'
import { DEMO_RUN, demoControls } from '../lib/demo'
import { isRunning, ragPipeline, useRag } from '../rag/ragPipeline.ts'
import { PipelineCard } from '../rag/RagScreens'
import { buildOkfBundle } from '../rag/okf.ts'
import { useUploadsInFlight } from '../components/shell'
import { Dialog, Empty, GateButton, Icon, StatusPill, Time, fmtBytes } from '../components/ui'

const TYPES_LABEL = ACCEPTED_TYPES.map(t => t.slice(1).toUpperCase()).join(', ')
const MB = (n: number) => `${Math.round(n / 1048576)} MB`
type Filter = 'all' | UploadRecord['scan']
type Source = 'files' | 'folder' | 'zip' | 'drop'

const HOWTO: { key: Exclude<Source, 'drop'>; icon: string; title: string; button: string; steps: string[] }[] = [
  { key: 'files', icon: 'file', title: 'Many files', button: 'Choose files', steps: [
    'In the file picker, press Ctrl+A (Cmd+A on Mac) for everything, or Ctrl/Cmd-click and Shift-click to pick several.',
    `Up to ${MAX_BATCH_FILES} files and ${MB(MAX_BATCH_BYTES)} per batch. Files over ${MB(CHUNK_BYTES)} are sent automatically in ${MB(CHUNK_BYTES)} chunks.`,
  ] },
  { key: 'folder', icon: 'expand', title: 'A whole folder', button: 'Choose folder', steps: [
    'Every file inside, including subfolders, is checked before anything uploads.',
    'System files (.DS_Store, Thumbs.db, desktop.ini, ~$ temp files) are skipped.',
    `More than ${MAX_BATCH_FILES} files? Upload one subfolder at a time, or ZIP related documents together.`,
  ] },
  { key: 'zip', icon: 'db', title: 'ZIP archive', button: 'Choose ZIP', steps: [
    'Windows: select the files, right-click, Send to, Compressed (zipped) folder.',
    'macOS: select the files, right-click, Compress.',
    `A ZIP counts as one file and can use the whole ${MB(MAX_UPLOAD_BYTES)} batch (sent in ${MB(CHUNK_BYTES)} chunks). It is scanned as an archive; password-protected ZIPs cannot be scanned.`,
  ] },
]
/** Native pickers: the browser builds the file list; nothing reaches the uploader until it passes triage and fits the batch. */
function Picker({ source, onPick, children, disabled, className = 'btn btn-secondary sm' }: {
  source: Exclude<Source, 'drop'>; onPick: (l: FileList, s: Source) => void; children: React.ReactNode; disabled?: boolean; className?: string
}) {
  const input = useRef<HTMLInputElement | null>(null)
  return <>
    <button type="button" className={className} disabled={disabled} onClick={() => input.current?.click()}>{children}</button>
    <input ref={el => { input.current = el; if (el && source === 'folder') el.setAttribute('webkitdirectory', '') }} type="file" hidden
      multiple={source !== 'zip' || undefined} accept={source === 'zip' ? '.zip' : source === 'files' ? ACCEPTED_TYPES.join(',') : undefined}
      onChange={e => { if (e.target.files) onPick(e.target.files, source); e.target.value = '' }} />
  </>
}

function BulkDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (l: FileList, s: Source) => void }) {
  return (
    <Dialog open={open} title="Bulk upload" onClose={onClose} className="dialog wide"
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}>
      <p className="muted sm">Pick as much as you like: incompatible files are filtered out first, then you choose what goes into this batch ({TYPES_LABEL}; up to {MAX_BATCH_FILES} files and {MB(MAX_BATCH_BYTES)}). Files over {MB(CHUNK_BYTES)} are sent as {MB(CHUNK_BYTES)} chunks. Everything is quarantined and virus-scanned before anything else.</p>
      <div className="howto">
        {HOWTO.map(h => (
          <section key={h.key} className="howto-card">
            <header><span className="howto-icon"><Icon name={h.icon} size={14} /></span><strong>{h.title}</strong></header>
            <ol>{h.steps.map(s => <li key={s}>{s}</li>)}</ol>
            <Picker source={h.key} onPick={onPick} className="btn btn-primary sm">{h.button}</Picker>
          </section>
        ))}
      </div>
      <p className="faint xs"><Icon name="question" size={11} /> Name files so they explain themselves (for example "RFQ-0147 Requirements v2.pdf"), one topic per file: extraction in RAG works better.</p>
    </Dialog>
  )
}

export interface Review { source: Source; t: Triage<File> }
type Existing = { count: number; bytes: number }
// ponytail: renders the first 400 usable files; a bigger folder should be narrowed before picking.
const LIST_CAP = 400

// Uppy-style file tiles: a coloured preview per type, shrinking as the selection grows.
const FILE_TYPES: Record<string, { label: string; color: string }> = {
  '.pdf': { label: 'PDF', color: '#E2514A' }, '.docx': { label: 'DOCX', color: '#2B579A' }, '.xlsx': { label: 'XLSX', color: '#217346' },
  '.pptx': { label: 'PPTX', color: '#D24726' }, '.txt': { label: 'TXT', color: '#5A5E69' }, '.zip': { label: 'ZIP', color: '#00A88E' },
}
const fileType = (name: string) => FILE_TYPES[name.slice(name.lastIndexOf('.')).toLowerCase()] ?? { label: 'FILE', color: '#7B8BA3' }
const tileSize = (n: number) => (n <= 5 ? 150 : n <= 12 ? 104 : n <= 24 ? 92 : n <= 48 ? 80 : 70)

/** Staged review: what was filtered out, what is usable, and a choice that must fit the batch before Upload turns on. */
function ReviewDialog({ review, existing, onClose, onUpload }: { review?: Review; existing: Existing; onClose: () => void; onUpload: (files: File[]) => void }) {
  const t = review?.t
  const [chosen, setChosen] = useState<Set<File>>(new Set())
  const [shown, setShown] = useState<Review>()
  if (review !== shown) { // new selection: preselect everything if it all fits, otherwise let the user choose
    setShown(review)
    setChosen(new Set(t && fit(t.usable, existing).ok ? t.usable : []))
  }
  if (!t || !review) return <Dialog open={false} title="" onClose={onClose} footer={null}>{null}</Dialog>
  const picked = t.usable.filter(f => chosen.has(f))
  const f = fit(picked, existing)
  const excluded = t.total - t.usable.length
  const toggle = (file: File) => setChosen(s => { const n = new Set(s); if (n.has(file)) n.delete(file); else n.add(file); return n })
  const pctFiles = Math.min(100, (f.count / Math.max(f.roomFiles, 1)) * 100), pctBytes = Math.min(100, (f.bytes / Math.max(f.roomBytes, 1)) * 100)
  const over = (n: number, room: number) => (n > room ? 'over' : n ? 'ok' : '')
  return (
    <Dialog open title="Review your selection" onClose={onClose} className="dialog wide review"
      footer={<>
        <span className={`review-reason ${f.ok ? 'tone-ok' : ''}`}><Icon name={f.ok ? 'check' : 'lock'} size={12} />{f.ok ? 'Fits the batch. Ready to upload.' : f.reason}</span>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${f.ok ? 'btn-ok' : 'btn-primary'}`} disabled={!f.ok} onClick={() => onUpload(picked)}>
          <Icon name="upload" />Upload {f.count || ''} file{f.count === 1 ? '' : 's'}{f.count ? ` · ${fmtBytes(f.bytes)}` : ''}
        </button>
      </>}>
      <ol className="funnel" aria-label="Selection funnel">
        <li><span className="funnel-n">{t.total.toLocaleString()}</span><span className="funnel-l">selected</span></li>
        <li className={t.usable.length ? 'is-ok' : 'is-err'}><span className="funnel-n">{t.usable.length.toLocaleString()}</span><span className="funnel-l">compatible</span>{excluded > 0 && <span className="funnel-sub">{excluded.toLocaleString()} filtered out</span>}</li>
        <li className={f.ok ? 'is-ok' : f.count ? 'is-err' : ''}><span className="funnel-n">{f.count}</span><span className="funnel-l">chosen for this batch</span></li>
      </ol>
      <p className="review-lead">
        {t.usable.length === 0 ? <>None of the {t.total.toLocaleString()} file{t.total === 1 ? '' : 's'} can be uploaded. Accepted types: {TYPES_LABEL}.</>
          : <>Out of <strong>{t.total.toLocaleString()}</strong> file{t.total === 1 ? '' : 's'}, <strong>{t.usable.length.toLocaleString()}</strong> {t.usable.length === 1 ? 'is' : 'are'} usable.{' '}
            {fit(t.usable, existing).ok ? 'All of them fit this batch.' : `Choose the important ones: up to ${Math.max(f.roomFiles, 0)} files and ${MB(Math.max(f.roomBytes, 0))}.`}</>}
      </p>
      {t.usable.length > 0 && <>
        <div className="meters">
          <div className={`meter ${over(f.count, f.roomFiles)}`}><span className="meter-l">Files</span><span className="meter-bar"><span style={{ width: `${pctFiles}%` }} /></span><span className="meter-n">{f.count} / {Math.max(f.roomFiles, 0)}</span></div>
          <div className={`meter ${over(f.bytes, f.roomBytes)}`}><span className="meter-l">Size</span><span className="meter-bar"><span style={{ width: `${pctBytes}%` }} /></span><span className="meter-n">{fmtBytes(f.bytes)} / {MB(Math.max(f.roomBytes, 0))}</span></div>
        </div>
        <div className="tile-panel">
          <div className="tile-bar">
            <button className="link sm" onClick={() => setChosen(new Set())}>Clear</button>
            <strong className="tile-bar-title">{f.count} of {t.usable.length.toLocaleString()} file{t.usable.length === 1 ? '' : 's'} selected</strong>
            <span className="row">
              <button className="link sm" onClick={() => setChosen(new Set(t.usable))}>Select all</button>
              <button className="link sm" onClick={() => setChosen(new Set(autoPick(t.usable, existing)))}><Icon name="bolt" size={12} />Auto-select what fits</button>
            </span>
          </div>
          <ul className="tile-grid" style={{ '--tile': `${tileSize(Math.min(t.usable.length, LIST_CAP))}px` } as React.CSSProperties}>
            {t.usable.slice(0, LIST_CAP).map(file => {
              const parts = chunkNames(file.name, file.size)
              const on = chosen.has(file)
              const ft = fileType(file.name)
              return (
                <li key={`${file.webkitRelativePath || file.name}-${file.size}-${file.lastModified}`} className={`tile ${on ? 'on' : ''}`}>
                  <label title={`${file.webkitRelativePath || file.name}${parts.length ? `\nSent as ${parts.length} chunks:\n${parts.join('\n')}` : ''}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(file)} />
                    <span className="tile-preview" style={{ '--ft': ft.color } as React.CSSProperties}>
                      <span className="tile-doc"><span className="tile-ext">{ft.label}</span></span>
                      <span className="tile-check" aria-hidden="true">{on && <Icon name="check" size={11} />}</span>
                      {parts.length > 0 && <span className="tile-chunks">{parts.length} chunks</span>}
                    </span>
                    <span className="tile-name">{file.name}</span>
                    <span className="tile-size">{fmtBytes(file.size)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          {t.usable.length > LIST_CAP && <p className="muted xs tile-more">Showing {LIST_CAP} of {t.usable.length.toLocaleString()} usable files. Use Auto-select, or pick a smaller folder.</p>}
        </div>
        {t.usable.some(x => x.size > CHUNK_BYTES) && <details className="excluded chunk-branches">
          <summary><Icon name="upload" size={12} /> Chunk branches: files over {MB(CHUNK_BYTES)} are sent in {MB(CHUNK_BYTES)} parts</summary>
          {t.usable.filter(x => x.size > CHUNK_BYTES).slice(0, 20).map(file => {
            const parts = chunkNames(file.name, file.size)
            return <div key={`${file.name}-${file.size}`} className="branch-file">
              <span className="branch-root"><Icon name="file" size={12} />{file.name}<span className="muted">{fmtBytes(file.size)}</span></span>
              <ul className="branch" aria-label={`${file.name} chunks`}>
                {(parts.length > 4 ? [0, 1, 2, -1, parts.length - 1] : parts.map((_, i) => i)).map(i =>
                  <li key={i}>{i < 0 ? <span className="muted">… {parts.length - 4} more</span>
                    : <><span className="mono">{parts[i]}</span><span className="muted">{fmtBytes(Math.min(CHUNK_BYTES, file.size - i * CHUNK_BYTES))}</span></>}</li>)}
              </ul>
            </div>
          })}
        </details>}
      </>}
      {excluded > 0 && <details className="excluded">
        <summary><Icon name="minus" size={12} /> Filtered out: {excluded.toLocaleString()} file{excluded === 1 ? '' : 's'} (never uploaded)</summary>
        {t.byExt.length > 0 && <p><strong>{t.unsupported.length.toLocaleString()} unsupported type{t.unsupported.length === 1 ? '' : 's'}</strong> <span className="ext-chips">{t.byExt.slice(0, 12).map(([e, n]) => <span key={e} className="tag">{e} · {n.toLocaleString()}</span>)}{t.byExt.length > 12 && <span className="muted xs">+{t.byExt.length - 12} more types</span>}</span></p>}
        {t.empty.length > 0 && <p><strong>{t.empty.length} empty</strong> <span className="muted">{t.empty.slice(0, 5).map(x => x.name).join(', ')}{t.empty.length > 5 ? '…' : ''}</span></p>}
        {t.tooLarge.length > 0 && <p><strong>{t.tooLarge.length} over {MB(MAX_UPLOAD_BYTES)}</strong> <span className="muted">{t.tooLarge.slice(0, 5).map(x => `${x.name} (${fmtBytes(x.size)})`).join(', ')}. Split or compress them.</span></p>}
        {t.system.length > 0 && <p><strong>{t.system.length} system files</strong> <span className="muted">(.DS_Store, Thumbs.db, ~$ temp files)</span></p>}
        <p className="muted xs">Convert documents you need to {TYPES_LABEL} (for example, save as PDF) and pick them again.</p>
      </details>}
    </Dialog>
  )
}

function UploadZone({ closed, onPick, onBulk }: { closed?: string; onPick: (l: FileList, s: Source) => void; onBulk: () => void }) {
  const [over, setOver] = useState(false)
  return (
    <div className={`dropzone scan-drop ${over ? 'over' : ''} ${closed ? 'is-disabled' : ''}`}
      onDragOver={e => { if (closed) return; e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); if (!closed) onPick(e.dataTransfer.files, 'drop') }}>
      <span className="scan-drop-icon"><Icon name="upload" size={20} /></span>
      <div className="scan-drop-text">
        <strong>Drag and drop files here</strong>
        <span>or browse to upload discovery documents</span>
        <span className="faint xs">{TYPES_LABEL} · up to {MAX_BATCH_FILES} files / {MB(MAX_BATCH_BYTES)} per batch · files over {MB(CHUNK_BYTES)} upload in {MB(CHUNK_BYTES)} chunks</span>
        {closed && <span className="gate-reason"><Icon name="lock" size={12} />{closed}</span>}
      </div>
      <div className="scan-drop-actions">
        <Picker source="files" onPick={onPick} disabled={!!closed} className="btn btn-primary"><Icon name="upload" />Browse files</Picker>
        <button className="btn btn-secondary" disabled={!!closed} onClick={onBulk}>Bulk upload<Icon name="chevron" size={12} /></button>
      </div>
    </div>
  )
}

/** Live security pipeline for the batch: upload, quarantine, BuLL*Sav scan, verdict, release. Every count comes from real state. */
function AvStatus({ uploads }: { uploads: UploadRecord[] }) {
  const files = useUppyState(uppy, s => s.files)
  const list = Object.values(files)
  const sending = list.filter(f => f.progress.uploadStarted && !f.progress.uploadComplete && !f.error)
  const failed = list.filter(f => f.error)
  const sendTotal = sending.reduce((n, f) => n + (f.size ?? 0), 0)
  const chunked = sending.filter(f => chunkCount(f.size ?? 0) > 1)
  const sendPct = sendTotal ? Math.round(sending.reduce((n, f) => n + (f.progress.bytesUploaded || 0), 0) / sendTotal * 100) : 0
  const total = uploads.length
  const pending = uploads.filter(u => u.scan === 'scanning' && !u.scanError)
  const inScan = pending.filter(u => u.scanStartedAt)
  const queued = pending.length - inScan.length
  const blocked = uploads.filter(u => u.scan === 'blocked').length
  const errors = uploads.filter(u => u.scanError).length
  const clean = uploads.filter(u => u.scan === 'verified').length
  const released = uploads.filter(u => u.released).length
  const state = sending.length || pending.length ? 'scanning' : !total ? 'idle' : blocked ? 'threat' : errors ? 'error' : 'clear'
  const s = (n: number) => (n === 1 ? '' : 's')
  const [title, sub] = {
    idle: [`${AV_NAME} ready`, 'Every upload is quarantined and virus-scanned before it can enter the pipeline.'],
    scanning: sending.length && !pending.length
      ? [`Uploading ${sending.length} file${s(sending.length)} to quarantine · ${sendPct}%`, chunked.length ? `${chunked.length} large file${s(chunked.length)} sent in ${MB(CHUNK_BYTES)} chunks, 3 files at a time. Each file is scanned as soon as it lands.` : 'Up to 3 files at a time. Each file is scanned as soon as it lands in quarantine.']
      : [`Scanning for threats · ${total - pending.length} of ${total} checked`, 'Signature check running. Files stay in quarantine until they pass.'],
    threat: [`${blocked} threat${s(blocked)} quarantined`, 'Blocked files cannot be opened or ingested. Remove them to continue.'],
    error: [`${errors} scan${s(errors)} did not finish`, 'No verdict means not clean. Retry the scan or remove the file.'],
    clear: [`All ${total} file${s(total)} clean`, 'Released to the BAM pipeline. Ready for the ingestion run.'],
  }[state]
  type St = 'idle' | 'active' | 'done' | 'alert'
  const resolved = total > 0 && !pending.length
  const nodes: { label: string; st: St; count: string; icon: string }[] = [
    { label: 'Upload', icon: 'upload', st: sending.length ? 'active' : failed.length ? 'alert' : total ? 'done' : 'idle',
      count: sending.length ? `${sendPct}%` : failed.length ? `${failed.length} failed` : total ? `${total} sent` : '—' },
    { label: 'Quarantine', icon: 'lock', st: queued ? 'active' : total ? 'done' : 'idle', count: queued ? `${queued} waiting` : total ? `${total} held` : '—' },
    { label: `${AV_NAME} scan`, icon: 'shield', st: inScan.length ? 'active' : errors ? 'alert' : resolved ? 'done' : 'idle', count: total ? `${total - pending.length}/${total}` : '—' },
    { label: 'Verdict', icon: blocked ? 'alert' : 'check', st: blocked || errors ? 'alert' : resolved ? 'done' : clean ? 'active' : 'idle',
      count: total ? `${clean} clean${blocked ? ` · ${blocked} blocked` : ''}` : '—' },
    { label: 'Released', icon: 'bolt', st: released && released === total ? 'done' : released ? 'active' : 'idle', count: total ? `${released} of ${total}` : '—' },
  ]
  const pct = sending.length && !pending.length ? sendPct : total ? Math.round((total - pending.length) / total * 100) : 0
  return (
    <section id="av-status" className={`av av-${state}`} aria-label="Virus scan status">
      <div className="av-head" role="status" aria-live="polite">
        <span className="av-radar" aria-hidden="true"><Icon name={state === 'threat' ? 'alert' : 'shield'} size={16} /></span>
        <span className="av-text"><strong>{title}</strong><span>{sub}</span></span>
      </div>
      <ol className="av-flow">
        {nodes.map(n => (
          <li key={n.label} className={`av-node is-${n.st}`}>
            <span className="av-dot"><Icon name={n.st === 'active' ? 'spinner' : n.icon} size={12} spin={n.st === 'active'} /></span>
            <span className="av-label">{n.label}</span>
            <span className="av-count">{n.count}</span>
          </li>
        ))}
      </ol>
      {(total > 0 || sending.length > 0) && <span className="av-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>}
      {chunked.length > 0 && <p className="av-now xs"><Icon name="upload" size={11} /> Chunked upload:
        {chunked.slice(0, 3).map(f => { const n = chunkCount(f.size ?? 0); const done = Math.min(n, Math.floor((f.progress.bytesUploaded || 0) / CHUNK_BYTES)); return <span key={f.id} className="mono">part {Math.min(n, done + 1)}/{n} · {f.name}</span> })}</p>}
      {inScan.length > 0 && <p className="av-now xs"><Icon name="eye" size={11} /> Now scanning:
        {inScan.slice(0, 3).map(u => <span key={u.id} className="mono">{u.name}</span>)}{queued > 0 && <span className="muted">+{queued} waiting in quarantine</span>}</p>}
      {failed.length > 0 && <div className="av-failed">
        <span className="stage-error"><Icon name="alert" size={12} /> {failed.length} upload{s(failed.length)} failed and never reached quarantine: {failed.slice(0, 3).map(f => f.name).join(', ')}{failed.length > 3 ? ` and ${failed.length - 3} more` : ''}.</span>
        <span className="row"><button className="btn btn-secondary sm" onClick={() => void uppy.retryAll()}><Icon name="refresh" />Retry</button>
          <button className="btn btn-ghost sm" onClick={() => uppy.removeFiles(failed.map(f => f.id))}>Dismiss</button></span>
      </div>}
    </section>
  )
}

function FilesTable({ uploads, editable }: { uploads: UploadRecord[]; editable: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const { busy, run } = useAction()
  const n = (s: Filter) => uploads.filter(u => u.scan === s).length
  // Filtering is display only: eligibility always uses the full batch.
  const shown = filter === 'all' ? uploads : uploads.filter(u => u.scan === filter)
  const view = (u: UploadRecord) => run('View file', async () => {
    await api.getVerifiedFileAccess(u.id)
    setUi({ fileDetail: u.id }); goScreen('1.3')
  }, { step: 1 })
  return (
    <section className="scan-files" aria-labelledby="files-title">
      <header className="scan-files-head">
        <h3 id="files-title">Uploaded files <span className="muted xs">{uploads.length} file{uploads.length === 1 ? '' : 's'}</span></h3>
        <span className="scan-counts xs">
          <span className="muted">{n('scanning')} scanning</span><span className="tone-ok">{n('verified')} verified</span><span className="tone-err">{n('blocked')} blocked</span>
        </span>
        <label className="sr-only" htmlFor="scan-filter">Filter by scan status</label>
        <select id="scan-filter" className="select" value={filter} onChange={e => setFilter(e.target.value as Filter)}>
          <option value="all">All statuses</option><option value="verified">Verified</option><option value="scanning">Scanning</option><option value="blocked">Blocked</option>
        </select>
      </header>
      {!uploads.length ? <Empty icon="upload" title="No files uploaded yet">Uploaded files are scanned automatically. Clean files are released to the BAM pipeline.</Empty>
        : !shown.length ? <Empty icon="file" title="No files with this status">Choose another filter. Hidden files still count toward the ingestion gate.</Empty>
        : <div className="scroll-box">
          <table className="table scan-table">
            <thead><tr><th scope="col">File name</th><th scope="col">Size</th><th scope="col">Uploaded time</th><th scope="col">Scan status</th><th scope="col" className="ta-r">Actions</th></tr></thead>
            <tbody>{shown.map(u => {
              const v = scanView(u)
              const can = (a: ScanAction) => editable && v.actions.includes(a)
              return (
                <tr key={u.id} className={u.scan === 'blocked' ? 'row-fail' : u.scan === 'scanning' && !u.scanError ? 'row-scanning' : ''}>
                  <th scope="row"><span className="scan-file"><Icon name="file" />
                    <span className="file-main"><span className="file-name">{u.name}</span><span className="mono xs faint scan-path" title={u.objectKey}>{u.objectKey}</span></span></span></th>
                  <td>{fmtBytes(u.size)}{u.parts > 1 && <div className="muted xs">{u.parts} × {MB(CHUNK_BYTES)} chunks</div>}</td>
                  <td><Time iso={u.uploadedAt} /></td>
                  <td><StatusPill status={v.pill} text={v.label} /><div className={`xs ${u.scan === 'blocked' ? 'tone-err' : 'muted'} scan-note`}>{v.text}</div>
                    {u.scan === 'scanning' && !u.scanError && <span className="av-laser" aria-hidden="true" />}</td>
                  <td className="ta-r"><span className="scan-actions">
                    {v.actions.includes('view') && <button className="link sm" disabled={!!busy} onClick={() => void view(u)}>View file</button>}
                    {can('retry') && <button className="btn btn-secondary sm" disabled={!!busy} onClick={() => run('Retry scan', () => api.retryScan(u.id), { step: 1 })}><Icon name="refresh" />Retry scan</button>}
                    {can('remove') && (u.scan === 'blocked'
                      ? <button className="btn btn-danger sm" disabled={!!busy} onClick={() => run('Remove file', () => api.removeUpload(u.id), { step: 1, success: `${u.name} removed from the batch. The object stays in quarantine.` })}>Remove</button>
                      : <button className="icon-btn sm" disabled={!!busy} aria-label={`Remove ${u.name}`} title="Remove from batch" onClick={() => run('Remove file', () => api.removeUpload(u.id), { step: 1 })}><Icon name="x" size={12} /></button>)}
                    {!v.actions.length && <span className="faint xs">Unavailable</span>}
                  </span></td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>}
      <footer className="rag-card-foot">
        <span>{uploads.length} files · {n('verified')} verified · {n('scanning')} scanning · {n('blocked')} blocked</span>
      </footer>
    </section>
  )
}

const EVENT: Record<ScanEvent['kind'], { icon: string; tone: string; text: string }> = {
  staged: { icon: 'upload', tone: 'muted', text: 'staged in quarantine' },
  started: { icon: 'clock', tone: 'muted', text: 'scan started' },
  clean: { icon: 'check', tone: 'tone-ok', text: 'clean, released' },
  threat: { icon: 'x', tone: 'tone-err', text: 'threat found, quarantined' },
  removed: { icon: 'minus', tone: 'muted', text: 'removed from batch' },
  error: { icon: 'alert', tone: 'tone-warn', text: 'scan error (not a threat)' },
}

function ScanActivity({ events }: { events: ScanEvent[] }) {
  return (
    <section className="rag-card" aria-labelledby="scan-act-title">
      <header className="rag-card-head"><h3 id="scan-act-title">Scan activity</h3></header>
      {!events.length ? <p className="muted sm">No scan events yet.</p> : (
        <ul className="scan-log">
          {[...events].sort((a, b) => b.at.localeCompare(a.at)).map(e => {
            const k = EVENT[e.kind]
            return (
              <li key={e.id} className={k.tone}>
                <Icon name={k.icon} size={12} label={e.kind === 'error' ? 'Error' : undefined} />
                <span className="scan-log-text">{e.name} — {k.text}</span>
                <Time iso={e.at} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function scanRow(snap: Snapshot) {
  const u = snap.uploads
  const scanning = u.filter(x => x.scan === 'scanning' && !x.scanError).length
  const errors = u.filter(x => x.scanError).length
  const blocked = u.filter(x => x.scan === 'blocked').length
  const st = !u.length ? { cls: 'q', icon: 'circle', text: 'Queued', detail: 'waiting for uploads' }
    : scanning ? { cls: 'r', icon: 'spinner', text: 'Running', detail: `${scanning} scanning` }
    : errors ? { cls: 'f', icon: 'alert', text: 'Scan error', detail: `${errors} scan error${errors === 1 ? '' : 's'}` }
    : blocked ? { cls: 'f', icon: 'x', text: 'Blocked', detail: `${blocked} blocked` }
    : { cls: 'd', icon: 'check', text: 'Done', detail: `${u.length} clean` }
  return (
    <li className={`pipe-step ps-${st.cls}`}>
      <span className="pipe-icon"><Icon name={st.icon} size={13} spin={st.cls === 'r'} /><span className="sr-only">{st.text}</span></span>
      <span className="pipe-label">Virus scan ({AV_NAME})</span>
      <span className="pipe-detail">{st.detail}</span>
    </li>
  )
}

/** 1.1 Intake console: upload & virus scan. */
export function Intake({ snap, info }: StepProps) {
  const rag = useRag(s => s)
  const uploading = useUploadsInFlight()
  const uploadErrors = useUppyState(uppy, s => Object.values(s.files).filter(f => f.error).length)
  const { busy, run } = useAction()
  const startingRef = useRef(false)
  const [outcome, setOutcome] = useState<ScanOutcome>('clean')
  const closed = info.editable ? undefined : 'Uploads are closed while the SOW is approved. Reopen 3.1 to add documents.'
  const starting = busy === 'Start ingestion run'
  const block = closed ? 'Reopen 3.1 to change the intake batch'
    : uploadErrors ? 'Retry or dismiss failed uploads'
    : ingestionBlock(snap.uploads, { uploading, starting, running: isRunning(rag), ingestion: snap.ingestion })

  // Staged intake: triage the selection; upload straight away only when nothing was filtered and it all fits.
  const [bulk, setBulk] = useState(false)
  const [review, setReview] = useState<Review>()
  const sendingFiles = useUppyState(uppy, s => Object.values(s.files).filter(f => !f.progress.uploadComplete && !f.error))
  const existing = { count: snap.uploads.length + sendingFiles.length, bytes: snap.uploads.reduce((n, u) => n + u.size, 0) + sendingFiles.reduce((n, f) => n + (f.size ?? 0), 0) }
  const send = (files: File[]) => {
    setReview(undefined)
    uploadFiles(files)
    const big = files.filter(f => f.size > CHUNK_BYTES).length
    toast(`${files.length} file${files.length === 1 ? '' : 's'} uploading to quarantine${big ? `, ${big} in ${MB(CHUNK_BYTES)} chunks` : ''}. The virus scan starts as each one lands.`, 'info', '1.1')
    // Let the dialog fade out, then bring the live scan into view.
    setTimeout(() => {
      const el = document.getElementById('av-status')
      if (!el) return
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash')
    }, 220)
  }
  const take = (list: FileList, source: Source) => {
    setBulk(false)
    const tr = triage(list)
    const filtered = tr.unsupported.length + tr.empty.length + tr.tooLarge.length
    if (filtered) setUi(s => ({ rejected: [...s.rejected, { name: `${list.length.toLocaleString()} picked (${source})`, reason: `${filtered.toLocaleString()} filtered out: ${tr.unsupported.length} unsupported, ${tr.empty.length} empty, ${tr.tooLarge.length} over ${MB(MAX_UPLOAD_BYTES)}`, at: new Date().toISOString() }] }))
    if (!filtered && tr.usable.length && fit(tr.usable, existing).ok) send(tr.usable)
    else setReview({ source, t: tr })
  }

  const start = async () => {
    if (startingRef.current) return // double-click guard; the backend also rejects a repeated start
    startingRef.current = true
    const r = await run('Start ingestion run', () => api.startIngestionRun(), { step: 1 })
    startingRef.current = false
    if (!r) return false
    // Hand RAG what BuLL*Sav released: the OKF v0.2 source concepts and the clean object URIs.
    const okf = buildOkfBundle(snap.uploads, ragPipeline.getState(), new Date().toISOString()).filter(f => f.path.startsWith('sources/'))
    ragPipeline.start({ input: { files: okf, objects: snap.uploads.filter(u => r.fileIds.includes(u.id)).map(u => u.objectKey) } })
    return true
  }
  // Opens RAG; starts the ingestion run first when the verified batch has not been ingested yet.
  const ingested = !!snap.ingestion && !!rag.runId
  const extractContext = async () => { if (ingested || await start()) goScreen('2.1') }
  const demo = demoControls() && api.demo

  return (
    <main className="intake">
      <section className="rag-card intake-main" aria-labelledby="center-title">
        <header>
          <p className="kicker">Step 1 · Documents</p>
          <h2 id="center-title" tabIndex={-1}>Upload &amp; virus scan</h2>
          <p className="muted sm">Upload discovery documents. Clean files are released to the BAM pipeline.</p>
        </header>
        <UploadZone closed={closed} onPick={take} onBulk={() => setBulk(true)} />
        <BulkDialog open={bulk} onClose={() => setBulk(false)} onPick={take} />
        <ReviewDialog review={review} existing={existing} onClose={() => setReview(undefined)} onUpload={send} />
        <div className="scan-gate" role="note">
          <Icon name="shield" />
          <strong>Files only enter the pipeline after the virus scan passes</strong>
          {DEMO_RUN && <span className="tag scan-mock" title="No antivirus runs in this build. Verdicts come from the mock scan adapter.">Mock scan service</span>}
          <span className="faint xs scan-powered" title="Scan engine: ClamAV (clamd)">Powered by <strong className="av-brand">{AV_NAME}</strong> · {AV_VENDOR}</span>
        </div>
        <AvStatus uploads={snap.uploads} />
        <FilesTable uploads={snap.uploads} editable={info.editable} />
        <footer className="rag-card-foot">
          <span>Blocked files are quarantined and cannot be opened or ingested.</span><span>Automatic scan on upload</span>
        </footer>
      </section>
      <div className="intake-side">
        <PipelineCard title="Hand-off to RAG (stage 2)" lead={scanRow(snap)} controls={
          <div className="pipe-controls scan-start">
            <GateButton action="ingest" reason={starting ? undefined : block} busy={starting} successKey={snap.ingestion?.runId} onClick={start}>Start ingestion run</GateButton>
            {snap.ingestion && <span className="muted xs">Last run <span className="mono">{snap.ingestion.runId}</span> · {snap.ingestion.fileIds.length} verified file{snap.ingestion.fileIds.length === 1 ? '' : 's'} · <Time iso={snap.ingestion.at} /></span>}
            {demo && <div className="row">
              <label className="pipe-sim">Simulate scan (mock)
                <select value={outcome} onChange={e => { const o = e.target.value as ScanOutcome; setOutcome(o); demo.setScanOutcome(o) }}>
                  <option value="clean">None (clean)</option><option value="threat">Threat detected</option><option value="error">Scanner outage</option>
                </select>
              </label>
              <button className="btn btn-ghost sm" disabled={!!snap.ingestion} onClick={() => { demo.loadScanFixture(); void run('Load fixture', async () => {}) }}>Load mockup batch</button>
            </div>}
          </div>} />
        <section className="rag-card rag-cta">
          <p className="muted sm">Only virus-scanned, verified documents enter RAG, when the ingestion run starts. The SOW is generated from that context in 3.1.</p>
          <GateButton variant="secondary" icon="bolt" reason={ingested ? undefined : block} busy={starting} onClick={() => void extractContext()}>Extract context</GateButton>
        </section>
        <ScanActivity events={snap.scanEvents} />
      </div>
    </main>
  )
}
