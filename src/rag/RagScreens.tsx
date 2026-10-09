// Stage 2 (RAG: Cognee + OKF) screen 2.1. EXAMPLE MOCKUP data; nothing here approves or deploys.
import { useState, type ReactNode } from 'react'
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './rag.css'
import { toast, useUi } from '../lib/store'
import { goScreen } from '../lib/route'
import { demoControls } from '../lib/demo'
import { Copy, Empty, ErrorState, Icon, Skeleton, fmtTime } from '../components/ui'
import { CLASS_COUNTS, EDGES, JOBS, NODES, type OkfClass } from './mockData.ts'
import { isRunning, ragPipeline, relations, stepStatus, useRag, type JobStatus, type RagStepKey, type RagStepStatus } from './ragPipeline.ts'

// Stage 2 has one screen (2.2–2.4 removed 9 Oct 2026).
export function RagScreen() {
  const loaded = useRag(s => s.loaded)
  return (
    <div className="rag">
      {!loaded ? <div className="rag-card"><Skeleton rows={8} label="Loading context pipeline" /></div>
        : <GraphExplorer />}
    </div>
  )
}

// ---- shared ---------------------------------------------------------------------
const STEP_ICON: Record<RagStepStatus, { icon: string; cls: string; text: string; spin?: boolean }> = {
  queued: { icon: 'circle', cls: 'q', text: 'Queued' },
  running: { icon: 'spinner', cls: 'r', text: 'Running', spin: true },
  done: { icon: 'check', cls: 'd', text: 'Done' },
  failed: { icon: 'x', cls: 'f', text: 'Failed' },
}

/** `lead` adds a gate row before the RAG steps (1.1's virus scan); `controls` replaces the re-run controls. */
export function PipelineCard({ title = 'Build pipeline', lead, controls }: { title?: string; lead?: ReactNode; controls?: ReactNode }) {
  const s = useRag(x => x)
  const [failAt, setFailAt] = useState<RagStepKey | ''>('')
  const running = isRunning(s)
  const jobsDone = s.jobs.filter(j => j === 'done' || j === 'skipped').length
  return (
    <section className="rag-card" aria-labelledby="pipe-title">
      <header className="rag-card-head"><h3 id="pipe-title">{title}</h3>{s.runId && <span className="mono xs muted">{s.runId}</span>}
        <span className={`tag ${s.engine === 'cognee' ? 'engine-live' : ''}`} title={s.engine === 'cognee' ? 'Runs on the Cognee server (VITE_RAG_BACKEND=cognee)' : 'Simulated pipeline over the EXAMPLE fixture'}>{s.engine === 'cognee' ? 'Cognee · live' : 'Cognee · simulated'}</span></header>
      <ol className="pipe">
        {lead}
        {s.steps.map(st => {
          const ic = STEP_ICON[st.status]
          const detail = st.status === 'running' && st.key === 'extract' ? `${jobsDone}/${JOBS.length} objects` : st.detail
          return (
            <li key={st.key} className={`pipe-step ps-${ic.cls}`}>
              <span className="pipe-icon"><Icon name={ic.icon} size={13} spin={ic.spin} /><span className="sr-only">{ic.text}</span></span>
              <span className="pipe-label">{st.label}</span>
              <span className="pipe-detail">{detail ?? (st.status === 'queued' ? 'queued' : '')}{st.status === 'done' && st.at && <span className="muted"> · {fmtTime(st.at)}</span>}</span>
              {st.status === 'failed' && <>
                <p className="stage-error pipe-error"><Icon name="alert" size={12} /> {st.error}</p>
                <button className="btn btn-secondary sm pipe-retry" onClick={() => ragPipeline.retry(st.key)}><Icon name="refresh" />Retry</button>
              </>}
            </li>
          )
        })}
      </ol>
      {controls ?? (!running && (
        <div className="pipe-controls">
          {/* The first run starts from 1.1's scan-gated "Start ingestion run"; this button is only for re-runs. */}
          {s.runId
            ? <button className="btn btn-secondary sm" onClick={() => { ragPipeline.start({ failAt: failAt || undefined }); toast('RAG run started again (simulated).') }}><Icon name="refresh" />Run again</button>
            : <span className="muted xs"><Icon name="clock" size={11} /> Starts from 1.1 once every virus scan passes.</span>}
          {demoControls() && <label className="pipe-sim">Simulate failure (demo)
            <select value={failAt} onChange={e => setFailAt(e.target.value as RagStepKey | '')}>
              <option value="">None</option><option value="chunk">Chunk + embed</option><option value="extract">Entity extraction</option>
              <option value="graph">Graph build</option><option value="schemas">Schema proposals</option>
            </select>
          </label>}
        </div>
      ))}
    </section>
  )
}

// ---- entity relations (Cognee graph edges) ------------------------------------------
const KIND_OF: Record<string, string> = { request: 'request', document: 'document', table: 'table', cadgeometry: 'cad', correspondence: 'correspondence', material: 'material', customer: 'customer' }

function RelationList({ focus }: { focus: string }) {
  const s = useRag(x => x)
  const rel = relations(s).filter(r => r.from === focus || r.to === focus)
  if (!rel.length) return <span className="muted">none</span>
  return <ul className="rel-list compact">{rel.map((r, i) => <li key={i}><span className={r.from === focus ? 'rel-self' : ''}>{r.from}</span><span className="rel-label">{r.label}</span><span className={r.to === focus ? 'rel-self' : ''}>{r.to}</span></li>)}</ul>
}

/** Every relation in the run's knowledge graph, by label; these triples also feed the OKF bundle and the SOW judge. */
function RelationsCard({ focus }: { focus?: string }) {
  const s = useRag(x => x)
  const [label, setLabel] = useState<string | null>(null)
  const done = stepStatus(s, 'graph') === 'done'
  const all = done ? relations(s) : []
  const counts = [...all.reduce((m, r) => m.set(r.label, (m.get(r.label) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])
  const shown = all.filter(r => (!label || r.label === label) && (!focus || r.from === focus || r.to === focus))
  return (
    <section className="rag-card" aria-labelledby="rel-title">
      <header className="rag-card-head"><h3 id="rel-title">Entity relations</h3><span className="muted xs">{s.engine === 'cognee' ? 'from Cognee' : 'EXAMPLE graph'}</span><span className="tag">{all.length}</span></header>
      {!done ? <p className="muted sm">Relations appear when the graph build (Cognee) finishes.</p> : <>
        <div className="filter-chips" role="group" aria-label="Filter relations by type">
          <button className="class-chip" aria-pressed={!label} onClick={() => setLabel(null)}>All {all.length}</button>
          {counts.map(([l, n]) => <button key={l} className="class-chip" aria-pressed={label === l} onClick={() => setLabel(label === l ? null : l)}>{l} {n}</button>)}
        </div>
        {focus && <p className="muted xs">Relations of <strong>{focus}</strong>. Clear the selection in the graph to see all.</p>}
        <ul className="rel-list">{shown.slice(0, 60).map((r, i) => (
          <li key={i}><span className={r.from === focus ? 'rel-self' : ''} title={r.fromType}>{r.from}</span><span className="rel-label">{r.label}</span><span className={r.to === focus ? 'rel-self' : ''} title={r.toType}>{r.to}</span></li>
        ))}</ul>
        {shown.length > 60 && <p className="muted xs">Showing 60 of {shown.length}.</p>}
        <p className="faint xs">Used as discovery facts for the SOW judge (Laya) and as Relations in the OKF bundle.</p>
      </>}
    </section>
  )
}

// ---- 2.1 Context graph explorer ---------------------------------------------------
type OkfNodeData = { label: string; sub?: string; kind: string; selected: boolean }

function OkfNode({ data }: NodeProps<Node<OkfNodeData>>) {
  return (
    <div className={`okf-node k-${data.kind} ${data.selected ? 'sel' : ''}`}>
      <Handle type="target" position={Position.Top} className="okf-handle" />
      <span className="okf-label">{data.label}</span>
      {data.sub && <span className="okf-sub">{data.sub}</span>}
      <Handle type="source" position={Position.Bottom} className="okf-handle" />
    </div>
  )
}
const nodeTypes = { okf: OkfNode }

function GraphExplorer() {
  const s = useRag(x => x)
  const theme = useUi(x => x.theme)
  const [hidden, setHidden] = useState<Set<OkfClass>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const chunk = stepStatus(s, 'chunk'), extract = stepStatus(s, 'extract'), graph = stepStatus(s, 'graph'), schemas = stepStatus(s, 'schemas')
  const jobsDone = s.jobs.filter(j => j === 'done' || j === 'skipped').length

  const visible = NODES.filter(n => (extract === 'running' || extract === 'done' || extract === 'failed') && jobsDone >= n.after && !(n.filter && hidden.has(n.filter)))
  const ids = new Set(visible.map(n => n.id))
  const nodes: Node<OkfNodeData>[] = visible.map(n => {
    const r = n.kind === 'request' ? 48 : 34
    return { id: n.id, type: 'okf', position: { x: n.x - r, y: n.y - r }, data: { label: n.label, sub: n.sub, kind: n.kind, selected: selected === n.id }, draggable: false }
  })
  const edges: Edge[] = graph === 'done'
    ? EDGES.filter(e => ids.has(e.source) && ids.has(e.target)).map((e, i) => ({ id: `e${i}`, source: e.source, target: e.target, label: e.label, type: 'straight', className: 'okf-edge' }))
    : []
  const node = NODES.find(n => n.id === selected)
  // Live Cognee graph: its own entities and labelled relations, laid out on a circle grouped by entity type.
  const live = s.graphData
  if (live) {
    const sorted = [...live.nodes].sort((a, b) => a.type.localeCompare(b.type))
    const R = Math.max(220, sorted.length * 14)
    nodes.splice(0, nodes.length, ...sorted.map((n, i) => {
      const a = (2 * Math.PI * i) / sorted.length
      return { id: n.id, type: 'okf', position: { x: 400 + R * Math.cos(a), y: 300 + R * Math.sin(a) }, draggable: false,
        data: { label: n.label, sub: n.type, kind: KIND_OF[n.type.toLowerCase()] ?? 'document', selected: selected === n.id } }
    }))
    edges.splice(0, edges.length, ...live.edges.map((e, i) => ({ id: `l${i}`, source: e.source, target: e.target, label: e.label, type: 'straight', className: 'okf-edge' })))
  }
  const liveNode = live?.nodes.find(n => n.id === selected)
  const focus = liveNode?.label ?? (node ? node.label + (node.sub ?? '') : undefined)

  let canvas
  if (!s.runId) canvas = <Empty icon="bolt" title="No context graph yet" action={<button className="btn btn-primary" onClick={() => goScreen('1.1')}><Icon name="upload" />Upload documents in 1.1</button>}>The pipeline starts when verified documents are sent from 1.1 (Start ingestion run); the graph builds here as it runs.</Empty>
  else if (chunk === 'running' || chunk === 'queued') canvas = <Empty icon="clock" title="Chunking and embedding objects…"><Icon name="spinner" spin size={12} /> {JOBS.length} objects from stage 1 are being chunked. Nodes appear during entity extraction.</Empty>
  else if (chunk === 'failed') canvas = <ErrorState title="Chunk + embed failed" action={<button className="btn btn-primary" onClick={() => ragPipeline.retry('chunk')}><Icon name="refresh" />Retry</button>}>No objects reached the graph.</ErrorState>
  else canvas = (
    <div className="graph-box">
      <ReactFlow key={`${nodes.length}-${edges.length}`} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }} colorMode={theme}
        nodesConnectable={false} onNodeClick={(_, n) => setSelected(n.id)} onPaneClick={() => setSelected(null)}
        minZoom={0.4} maxZoom={2} aria-label="Context graph">
        <Background gap={24} size={1} />
      </ReactFlow>
      {graph !== 'done' && <div className="graph-note" role="status">
        {graph === 'failed' ? <><Icon name="alert" size={12} /> Graph build failed; nodes shown without relations. Retry from the pipeline.</>
          : extract === 'running' ? <><Icon name="spinner" size={12} spin /> Entity extraction: nodes appear as objects are processed ({jobsDone}/{JOBS.length}). Relations come with the graph build.</>
          : extract === 'failed' ? <><Icon name="alert" size={12} /> Entity extraction failed. Retry from the pipeline.</>
          : <><Icon name="spinner" size={12} spin /> Graph build (Cognee) running: relations appear when it finishes.</>}
      </div>}
    </div>
  )

  return (
    <div className="rag-grid g21">
      <section className="rag-card graph-card" aria-labelledby="graph-title">
        <header className="rag-card-head">
          <h3 id="graph-title">Context graph</h3><span className="muted xs">{s.runId ?? 'no run'} · OKF classes</span>
          <div className="class-chips" role="group" aria-label="Filter by OKF class">
            {CLASS_COUNTS.map(([c, n]) => (
              <button key={c} className={`class-chip c-${c}`} aria-pressed={!hidden.has(c)} onClick={() => setHidden(h => { const x = new Set(h); if (x.has(c)) x.delete(c); else x.add(c); return x })}>
                {hidden.has(c) ? <Icon name="minus" size={10} /> : <Icon name="check" size={10} />}{c} {n}
              </button>
            ))}
          </div>
        </header>
        {canvas}
      </section>
      <div className="rag-side">
        <section className="rag-card" aria-labelledby="insp-title">
          <header className="rag-card-head"><h3 id="insp-title">Node inspector</h3>{focus && <span className="tag mono">{focus}</span>}</header>
          {liveNode ? <dl className="kv">
              <div><dt>Entity type</dt><dd><span className="okf-pill k-document">{liveNode.type}</span></dd></div>
              <div><dt>Relations</dt><dd><RelationList focus={liveNode.label} /></dd></div>
              <div><dt>Source</dt><dd>Cognee dataset <span className="mono">{s.datasetId}</span></dd></div>
            </dl>
          : !node ? <p className="muted sm">Select a node in the graph to see its OKF class, source objects, facts, relations and confidence. The graph is read-only.</p> : (
            <dl className="kv">
              <div><dt>OKF class</dt><dd><span className={`okf-pill k-${node.kind}`}>{node.okfClass}</span></dd></div>
              <div><dt>Source objects</dt><dd className="src-list">{node.sources.map(src => {
                const job = JOBS.find(j => j.object === src)
                return <Copy key={src} value={job?.s3 ?? src} display={src} label="source object URI" />
              })}</dd></div>
              <div><dt>Relations</dt><dd>{graph === 'done' ? <RelationList focus={node.label + (node.sub ?? '')} /> : 'after graph build'}</dd></div>
              <div><dt>Facts</dt><dd>{node.facts}</dd></div>
              <div><dt>Confidence</dt><dd className="conf">{node.confidence.toFixed(2)}</dd></div>
            </dl>
          )}
        </section>
        <RelationsCard focus={focus} />
        <PipelineCard />
        <section className="rag-card rag-cta">
          <p className="muted sm">The SOW is generated from this context in 3.1 SOW generation and approval (FDE Workbench).</p>
          <span className="gate">
            {/* ponytail: SOW generation already starts when the RAG run finishes (useStageHandoffs); this opens 3.1 to follow it. */}
            <button className="btn btn-primary sm" aria-disabled={schemas !== 'done' || undefined} onClick={() => schemas === 'done' && goScreen('3.1')}><Icon name="bolt" />Generate SOW</button>
            {schemas !== 'done' && <span className="gate-reason"><Icon name="lock" size={12} />Available when the RAG run finishes</span>}
          </span>
        </section>
      </div>
    </div>
  )
}
