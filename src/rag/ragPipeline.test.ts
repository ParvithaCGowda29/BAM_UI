// npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMockRagService, type RagPipelineService, type RagState } from './ragPipeline.ts'
import { JOBS, SCHEMAS } from './mockData.ts'

const until = async (svc: RagPipelineService, cond: (s: RagState) => boolean) => {
  for (let i = 0; i < 400; i++) { if (cond(svc.getState())) return; await new Promise(r => setTimeout(r, 5)) }
  throw new Error('timeout: ' + JSON.stringify(svc.getState().steps))
}

test('loads, then a run advances the 4 steps in order to done', async () => {
  const svc = createMockRagService({ speed: 0.01, loadDelay: 1 })
  assert.equal(svc.getState().loaded, false)
  await until(svc, s => s.loaded)
  assert.throws(() => svc.sendToWorkbench('QuoteLine'), /not ready/, 'schemas locked before a run')
  const seen = new Set<string>()
  svc.subscribe(() => { const r = svc.getState().steps.find(x => x.status === 'running'); if (r) seen.add(r.key) })
  svc.start()
  await until(svc, s => s.steps.every(x => x.status === 'done'))
  const s = svc.getState()
  assert.deepEqual([...seen], ['chunk', 'extract', 'graph', 'schemas'])
  assert.deepEqual(s.steps.map(x => x.detail), [`${JOBS.length} objects`, '214 entities', '385 relations', `${SCHEMAS.length} drafts ready`])
  assert.equal(s.jobs.filter(j => j === 'skipped').length, 1, 'unclassified object is skipped, not extracted')
  assert.ok(s.lastSyncAt)
})

test('a failed step stops the run and Retry resumes from it', async () => {
  const svc = createMockRagService({ speed: 0.01, loadDelay: 1 })
  svc.start({ failAt: 'extract' })
  await until(svc, s => s.steps[1].status === 'failed')
  const s = svc.getState()
  assert.equal(s.steps[2].status, 'queued')
  assert.ok(s.jobs.includes('failed'))
  assert.equal(s.lastSyncAt, undefined)
  svc.retry('extract')
  await until(svc, x => x.steps.every(st => st.status === 'done'))
  assert.ok(!svc.getState().jobs.includes('failed'))
})

test('hand-off creates a Workbench draft with the pinned context version; edits bump the draft version', async () => {
  const svc = createMockRagService({ speed: 0.01, loadDelay: 1 })
  svc.start()
  await until(svc, s => s.steps[3].status === 'done')
  svc.saveSchemaDraft('QuoteLine', svc.getState().drafts.QuoteLine.code + '\n# reviewed\n')
  assert.equal(svc.getState().drafts.QuoteLine.version, 'v0.4')
  const h = svc.sendToWorkbench('QuoteLine')
  assert.equal(h.version, 'v0.4')
  assert.equal(h.contextVersion, svc.getState().runId)
  assert.deepEqual(Object.keys(h).sort(), ['at', 'contextVersion', 'schema', 'version'], 'no approval field')
})

test('centredViewport puts the root at the canvas centre and keeps every node inside', async () => {
  const { centredViewport } = await import('./ragPipeline.ts')
  const pts = [{ x: 400, y: 250, r: 48 }, { x: 700, y: 290, r: 34 }, { x: 150, y: 340, r: 34 }]
  for (const [w, h] of [[860, 560], [330, 380]]) {
    const v = centredViewport(pts, pts[0], w, h)
    assert.equal(pts[0].x * v.zoom + v.x, w / 2)
    assert.equal(pts[0].y * v.zoom + v.y, h / 2)
    for (const p of pts) {
      assert.ok((p.x - p.r) * v.zoom + v.x >= 0 && (p.x + p.r) * v.zoom + v.x <= w)
      assert.ok((p.y - p.r) * v.zoom + v.y >= 0 && (p.y + p.r) * v.zoom + v.y <= h)
    }
  }
  assert.deepEqual(centredViewport(pts, pts[0], 860, 560), centredViewport(pts, pts[0], 860, 560))
})
