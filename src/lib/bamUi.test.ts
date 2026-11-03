import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BAM_ACTIONS, actionView, isNewSuccess, plural, stageMarkers } from './bamUi.ts'

test('action button: loading locks, success is transient and never overrides eligibility', () => {
  assert.deepEqual(actionView({ busy: true }), { phase: 'loading', locked: true })
  assert.deepEqual(actionView({ flash: true }), { phase: 'success', locked: true })
  assert.deepEqual(actionView({}), { phase: 'idle', locked: false })
  // Approved / deployed: the confirmed success still shows, and the business rule keeps it locked after.
  assert.deepEqual(actionView({ flash: true, blocked: true }), { phase: 'success', locked: true })
  assert.deepEqual(actionView({ blocked: true }), { phase: 'idle', locked: true })
  assert.deepEqual(actionView({ busy: true, flash: true }).phase, 'loading')
})

test('action button: success only on a new confirmed result, not a queued or failed one', () => {
  assert.equal(isNewSuccess(undefined, undefined), false) // enqueue resolved, no terminal result yet
  assert.equal(isNewSuccess(3, 3), false) // already approved on mount / unchanged after failure
  assert.equal(isNewSuccess(3, 4), true)
  assert.equal(isNewSuccess(undefined, 'run-1'), true)
  assert.equal(isNewSuccess('run-1', undefined), false)
})

test('tracker: reference snapshots, Sandbox active, all done and all not started', () => {
  const ns = 'not_started', ip = 'in_progress', d = 'done'
  assert.equal(stageMarkers([ip, ns, ns, ns]).current, 0)
  assert.deepEqual(stageMarkers([d, ip, ns, ns]).earned, [true, false, false])
  assert.deepEqual(stageMarkers([d, d, ip, ns]).earned, [true, true, false])
  const sandbox = stageMarkers([d, d, d, ip])
  assert.equal(sandbox.current, 3)
  assert.deepEqual(sandbox.earned, [true, true, true])
  const all = stageMarkers([d, d, d, d])
  assert.equal(all.current, -1) // no halo, no chevron
  assert.ok(all.markers.every(m => !m.current))
  assert.equal(stageMarkers([ns, ns, ns, ns]).current, -1)
  assert.deepEqual(stageMarkers([d, ns, ns, ns]).earned, [false, false, false]) // RAG has no evidence yet
})

test('tracker: blocked and needs review stay unresolved, never done', () => {
  const r = stageMarkers(['done', 'needs_review', 'blocked', 'not_started'])
  assert.equal(r.current, 1)
  assert.equal(r.markers[1].status, 'needs_review')
  assert.equal(r.markers[2].status, 'blocked')
  assert.deepEqual(r.earned, [true, false, false])
})

test('Certify (review) says what it does while running', () => {
  assert.equal(BAM_ACTIONS.review.loading, 'Signing off…')
  assert.equal(actionView({ busy: true }).locked, true, 'disabled while signing off')
})

test('plural: singular only for exactly one', () => {
  assert.equal(plural(1, 'file'), '1 file')
  assert.equal(plural(0, 'file'), '0 files')
  assert.equal(plural(2, 'batch', 'batches'), '2 batches')
})
