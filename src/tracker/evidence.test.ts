// npm test
import { templateKey, type StepApprovals } from '../lib/approvals.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceStatuses, previousRun } from './evidence.ts'
import { effectiveStatuses, initialStatuses } from './trackerConfig.ts'
import { createMockApi } from '../api/mock.ts'
import { createMockRagService } from '../rag/ragPipeline.ts'

const until = async (cond: () => Promise<boolean> | boolean) => {
  for (let i = 0; i < 600; i++) { if (await cond()) return; await new Promise(r => setTimeout(r, 5)) }
  throw new Error('timeout')
}

test('screens fill in as the workflow produces evidence', async () => {
  const api = createMockApi({ speed: 0.01 })
  const rag = createMockRagService({ speed: 0.01, loadDelay: 1 })
  let approvals: StepApprovals = {}
  const ev = async () => evidenceStatuses(await api.getSnapshot(), rag.getState(), approvals)

  assert.deepEqual(Object.values(await ev()).filter(s => s !== 'not_started'), [], 'nothing done before any work')
  let e0: Record<string, string>

  await api.uploadFile({ name: 'rfq.pdf', size: 1000 }, () => {})
  e0 = await ev()
  assert.deepEqual([e0['1.1'], e0['1.5'], e0['1.8'], e0['1.4'], e0['1.7']], ['done', 'in_progress', 'in_progress', 'not_started', 'in_progress'], 'upload is transfer only: the checks, Standardize and Review are not done')
  await until(async () => (await api.getSnapshot()).uploads[0].scan === 'verified')
  e0 = await ev()
  assert.deepEqual([e0['1.1'], e0['1.5'], e0['1.8'], e0['1.4'], e0['1.7']], ['done', 'done', 'in_progress', 'not_started', 'done'], 'checked and released: Standardize still open; not handed on yet')
  await api.startIngestionRun()
  e0 = await ev()
  assert.deepEqual([e0['1.8'], e0['1.9'], e0['1.4']], ['done', 'not_started', 'not_started'], 'handed on: Standardize done; Parse and Review follow the extraction')

  rag.start()
  await until(() => rag.getState().steps.every(s => s.status === 'done'))
  // The background build alone never completes Context: nothing counts until Start on Sync.
  for (const id of ['2.5', '2.1', '2.2', '2.3', '2.4']) assert.equal((await ev())[id], 'not_started', `${id} before Sync's Start`)
  rag.markContextStarted()
  assert.equal((await ev())['2.3'], 'needs_review', 'Verify waits for its Approve')
  rag.markVerified()
  let e = await ev()
  assert.equal(e['2.1'], 'done'); assert.equal(e['2.3'], 'done')
  assert.equal(e['2.2'], 'needs_review', 'schemas ready but not handed off')
  assert.equal((await ev())['2.4'], 'needs_review', 'RAG review waits for a reviewed hand-off')
  rag.sendToWorkbench('QuoteLine')
  assert.equal((await ev())['2.2'], 'done')
  assert.equal((await ev())['2.4'], 'done')

  await api.startSowGeneration()
  await until(async () => !!(await api.getSnapshot()).sow)
  assert.equal((await ev())['3.1'], 'needs_review')
  await api.approveSow((await api.getSnapshot()).sow!.version)
  e = await ev()
  assert.equal(e['3.1'], 'done')
  await until(async () => (await ev())['3.2'] === 'needs_review')

  await api.markGridReviewed()
  await api.generateContract()
  await until(async () => (await api.getSnapshot()).workflow?.status === 'succeeded')
  e = await ev()
  assert.equal(e['4.1'], 'done', 'activities A–C passed')
  assert.deepEqual([e['4.2'], e['4.3'], e['3.3'], e['3.4']], ['needs_review', 'not_started', 'needs_review', 'needs_review'], 'Template awaits its Approve; Translate opens after it')
  approvals = { template: templateKey((await api.getSnapshot()).workflow) }
  e = await ev()
  assert.deepEqual([e['4.2'], e['4.3']], ['done', 'needs_review'], 'Template approved: Translate awaits the FDE')
  await api.approveManifest()
  e = await ev()
  assert.deepEqual([e['4.2'], e['4.3'], e['3.3'], e['3.4'], e['3.2']], ['done', 'done', 'done', 'done', 'done'])

  // Validation: Sandbox > Check > Certify (review) > Commit (freeze), each from its own gate; deploy follows Commit.
  assert.deepEqual([e['4.8'], e['4.4'], e['4.5'], e['4.6'], e['4.7']], ['not_started', 'not_started', 'not_started', 'not_started', 'not_started'])
  await api.runTests()
  await until(async () => (await api.getSnapshot()).tests?.promptfoo.status === 'succeeded')
  e = await ev()
  assert.deepEqual([e['4.8'], e['4.4'], e['4.5']], ['needs_review', 'not_started', 'not_started'], 'nothing advances by itself: Sandbox awaits its Approve')
  const tests = (await api.getSnapshot()).tests!
  approvals = { ...approvals, sandbox: tests.manifestHash }
  e = await ev()
  assert.deepEqual([e['4.8'], e['4.4']], ['done', 'needs_review'], 'Sandbox approved: Check awaits its Approve')
  approvals = { ...approvals, check: tests.runId }
  e = await ev()
  assert.deepEqual([e['4.8'], e['4.4'], e['4.5']], ['done', 'done', 'needs_review'], 'clean run approved: Certify awaits the FDE')
  await api.markTestsReviewed()
  e = await ev()
  assert.deepEqual([e['4.5'], e['4.6']], ['done', 'needs_review'], 'certified: Commit awaits the save')
  await api.commitToPostgres()
  await until(async () => (await ev())['4.6'] === 'done')
  await api.deployToStaging()
  await until(async () => (await ev())['4.7'] === 'done')
  assert.equal((await ev())['4.6'], 'done')
})

test('a failed RAG step shows as blocked', async () => {
  const rag = createMockRagService({ speed: 0.01, loadDelay: 1 })
  const api = createMockApi({ speed: 0.01 })
  rag.start({ failAt: 'graph' })
  rag.markContextStarted()
  await until(() => rag.getState().steps[2].status === 'failed')
  const e = evidenceStatuses(await api.getSnapshot(), rag.getState())
  assert.equal(e['2.1'], 'blocked')
  assert.equal(e['2.2'], 'blocked')
})

test('a new RAG run marks stage 3-4 work as from a previous run; manual statuses lapse when evidence changes', async () => {
  const api = createMockApi({ speed: 0.01 })
  const rag = createMockRagService({ speed: 0.01, loadDelay: 1 })
  await api.uploadFile({ name: 'rfq.pdf', size: 1000 }, () => {})
  await until(async () => (await api.getSnapshot()).uploads[0].scan === 'verified')
  await api.startIngestionRun()
  rag.start()
  await until(() => rag.getState().steps.every(s => s.status === 'done'))
  await api.startSowGeneration(rag.getState().runId)
  await until(async () => !!(await api.getSnapshot()).sow)
  await api.approveSow((await api.getSnapshot()).sow!.version)
  const snap = await api.getSnapshot()
  assert.equal(evidenceStatuses(snap, rag.getState())['3.1'], 'done')
  assert.deepEqual(previousRun(snap, rag.getState()), [])

  rag.start() // Run again: the approved SOW was built on the earlier run's context
  rag.markContextStarted()
  const e = evidenceStatuses(snap, rag.getState())
  assert.deepEqual(previousRun(snap, rag.getState()).slice(0, 2), ['3.1', '3.2'])
  assert.equal(e['3.1'], 'not_started', 'no tick for work from a previous run')
  assert.equal(e['2.1'], 'in_progress')

  const manual = { ...initialStatuses(), '2.1': 'blocked' as const }
  assert.equal(effectiveStatuses(e, manual, { '2.1': 'in_progress' })['2.1'], 'blocked', 'manual holds while evidence is unchanged')
  assert.equal(effectiveStatuses({ ...e, '2.1': 'done' }, manual, { '2.1': 'in_progress' })['2.1'], 'done', 'evidence change ends it')
  assert.equal(effectiveStatuses(e, manual, {})['2.1'], 'in_progress', 'a status saved without a basis never overrides')
})
