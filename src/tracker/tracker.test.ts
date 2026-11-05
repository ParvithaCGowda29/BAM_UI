// npm test  (Node's built-in runner; no extra dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GLOBAL_ROUTES, ROUTE_ALIASES, SCREEN_ROUTES, STEP_SCREEN, SUBTASKS, countedOf, globalByPath, screenByPath, screenLabel, TASKS, TRACKER_ITEMS, initialStatuses, rollup, subtasksOf, taskStatus } from './trackerConfig.ts'
import { LEGACY_TRACKER_KEY, TRACKER_KEY, localTrackerStorage } from './trackerStorage.ts'

// Final workflow (15 Oct 2026): stage > steps in nav order, by stable ID. Labels are names, never numbers.
const NAV: Record<string, [string, string[]]> = {
  '1': ['Ingestion', ['Upload', 'Standardize', 'Parse', 'Review']],
  '2': ['Context', ['Sync', 'Index', 'Schema', 'Verify']],
  '3': ['Workbench', ['Scope', 'Grid', 'Template', 'Translate']],
  '4': ['Validation', ['Sandbox', 'Check', 'Certify', 'Commit']],
}
const ICONS: Record<string, string> = {
  '1': 'tb-inbox', '2': 'tb-git-branch', '3': 'tb-briefcase', '4': 'tb-shield-check',
  Upload: 'tb-upload', Standardize: 'tb-transform', Parse: 'tb-file-code', Review: 'tb-clipboard-check', Sync: 'tb-refresh', Index: 'tb-search', Schema: 'tb-schema', Verify: 'tb-shield-check',
  Scope: 'tb-target', Grid: 'tb-table', Template: 'tb-template', Translate: 'tb-code', Sandbox: 'tb-box', Check: 'tb-list-check', Certify: 'tb-certificate', Commit: 'tb-database-import',
}

test('registry: 4 stages with the final steps in navigation order', () => {
  assert.deepEqual(TASKS.map(t => t.id), ['1', '2', '3', '4'])
  for (const t of TASKS) assert.deepEqual([t.label, subtasksOf(t.id).map(s => s.label)], NAV[t.id], t.label)
  assert.equal(new Set(TRACKER_ITEMS.map(i => i.id)).size, TRACKER_ITEMS.length, 'unique IDs')
})

test('icons: the Tabler map for every stage and step; scan and quarantine stay internal', () => {
  for (const t of TASKS) assert.equal(t.icon, ICONS[t.id], t.label)
  for (const t of TASKS) for (const s of subtasksOf(t.id)) assert.equal(s.icon, ICONS[s.label], s.label)
  for (const id of ['1.5', '1.7', '1.3']) {
    const s = SUBTASKS.find(x => x.id === id)!
    assert.ok(s.hidden && s.internal, `${s.label} is internal`)
  }
  assert.ok(!TRACKER_ITEMS.some(i => /upload\s*&\s*scan/i.test(i.label)))
})

test('labels: no numeric prefixes, every screen has an icon', () => {
  for (const i of TRACKER_ITEMS) {
    assert.ok(!/^(step\s*)?\d/i.test(i.label), `${i.id} label starts with a number: ${i.label}`)
    assert.ok(i.icon, `${i.id} has an icon`)
    assert.equal(screenLabel(i.id), i.label, 'screenLabel is the name, never the ID')
  }
})

test('global destinations: Admin is not a workflow screen', () => {
  assert.equal(GLOBAL_ROUTES.admin.label, 'Masters')
  assert.equal(globalByPath('/usage'), undefined)
  assert.equal(globalByPath('/admin/masters'), 'admin')
  assert.ok(!SUBTASKS.some(s => /usage|workflows|agents|admin/i.test(s.label)), 'no left-rail Usage / Workflows / Agents entries')
})

test('counting: hidden and optional screens never count toward a stage', () => {
  assert.deepEqual(countedOf('1').map(s => s.label), ['Upload', 'Standardize', 'Parse', 'Review'])
  const s = initialStatuses()
  for (const x of countedOf('1')) s[x.id] = 'done'
  assert.equal(taskStatus('1', s), 'done', 'Connectors (optional) and File detail (hidden) do not hold the stage back')
})

test('routes: unique, resolvable, gated as before; old paths alias to the new ones', () => {
  const paths = Object.values(SCREEN_ROUTES).map(r => r.path)
  assert.equal(new Set(paths).size, paths.length, 'unique paths')
  for (const s of SUBTASKS) assert.equal(screenByPath(s.path!)?.id, s.id, `${s.path} resolves back to ${s.id}`)
  assert.deepEqual(['4.1', '4.2', '4.3'].map(id => SCREEN_ROUTES[id].step), [3, 3, 3])
  assert.deepEqual(['1.1', '1.5'].map(id => SCREEN_ROUTES[id].step), [1, 1], 'Upload and Scan share the intake gate')
  assert.deepEqual(['4.8', '4.4', '4.5', '4.6', '4.7'].map(id => SCREEN_ROUTES[id].step), [4, 4, 4, 4, 4])
  assert.deepEqual(STEP_SCREEN, { 1: '3.1', 2: '3.2', 3: '4.2', 4: '4.8' })
  for (const [from, to] of Object.entries(ROUTE_ALIASES)) {
    assert.ok(screenByPath(to), `${from} → ${to} resolves`)
    assert.equal(screenByPath(from), undefined, `${from} is only an alias`)
  }
  assert.equal(ROUTE_ALIASES['/ingestion'], '/ingestion/upload', 'old combined Upload & scan route → Upload')
  assert.equal(screenByPath('/nope'), undefined)
})

test('rollup: all four done → done', () => {
  assert.equal(rollup(['done', 'done', 'done', 'done']), 'done')
})

test('rollup: blocked beats needs review and progress', () => {
  assert.equal(rollup(['done', 'blocked', 'needs_review', 'in_progress']), 'blocked')
})

test('rollup: needs review beats in progress and partly done', () => {
  assert.equal(rollup(['needs_review', 'in_progress', 'done', 'not_started']), 'needs_review')
})

test('rollup: any started → in progress; nothing started → not started; empty is not done', () => {
  assert.equal(rollup(['in_progress', 'not_started', 'not_started', 'not_started']), 'in_progress')
  assert.equal(rollup(['done', 'not_started', 'not_started', 'not_started']), 'in_progress')
  assert.equal(rollup(['not_started', 'not_started', 'not_started', 'not_started']), 'not_started')
  assert.equal(rollup([]), 'not_started')
})

test('taskStatus uses only that stage’s screens', () => {
  const s = initialStatuses()
  for (const x of countedOf('1')) s[x.id] = 'done'
  s['2.2'] = 'needs_review'
  assert.equal(taskStatus('1', s), 'done')
  assert.equal(taskStatus('2', s), 'needs_review')
  assert.equal(taskStatus('4', s), 'not_started')
})

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) }, data }
}

test('persistence: new namespace; all screens start not started', async () => {
  assert.notEqual(TRACKER_KEY, LEGACY_TRACKER_KEY)
  const r = await localTrackerStorage(memory()).load()
  assert.equal(r.error, undefined)
  assert.equal(Object.keys(r.statuses).length, SUBTASKS.length)
  assert.ok(Object.values(r.statuses).every(v => v === 'not_started'))
})

test('persistence: old 21-item data is not read, migrated, overwritten or deleted', async () => {
  const legacy = JSON.stringify({ version: 1, statuses: { '1.1': 'done', '1.5': 'done', '2.6': 'blocked' } })
  const mem = memory({ [LEGACY_TRACKER_KEY]: legacy })
  const store = localTrackerStorage(mem)
  const r = await store.load()
  assert.equal(r.statuses['1.1'], 'not_started', 'old positional status not mapped onto new 1.1')
  await store.save({ ...r.statuses, '1.1': 'in_progress' })
  assert.equal(mem.data.get(LEGACY_TRACKER_KEY), legacy)
})

test('persistence: round-trips by stable screen ID under one versioned key', async () => {
  const mem = memory()
  const s = initialStatuses()
  s['1.1'] = 'done'; s['4.4'] = 'needs_review'; s['2.3'] = 'blocked'
  await localTrackerStorage(mem).save(s)
  assert.deepEqual([...mem.data.keys()], [TRACKER_KEY])
  const saved = JSON.parse(mem.data.get(TRACKER_KEY)!)
  assert.equal(saved.version, 1)
  assert.equal(saved.statuses['4.4'], 'needs_review')
  assert.deepEqual((await localTrackerStorage(mem).load()).statuses, s)
})

test('persistence: unreadable data is reported and left in place; unknown IDs ignored', async () => {
  const mem = memory({ [TRACKER_KEY]: '{not json' })
  const r = await localTrackerStorage(mem).load()
  assert.match(r.error ?? '', /unreadable/)
  assert.equal(mem.data.get(TRACKER_KEY), '{not json')
  const wrongVersion = await localTrackerStorage(memory({ [TRACKER_KEY]: JSON.stringify({ version: 2, statuses: { '1.1': 'done' } }) })).load()
  assert.ok(wrongVersion.error)
  assert.equal(wrongVersion.statuses['1.1'], 'not_started')
  const partial = await localTrackerStorage(memory({ [TRACKER_KEY]: JSON.stringify({ version: 1, statuses: { '1.1': 'done', '2.1': 'bogus', '9.9': 'done' } }) })).load()
  assert.equal(partial.error, undefined)
  assert.equal(partial.statuses['1.1'], 'done')
  assert.equal(partial.statuses['2.1'], 'not_started')
  assert.ok(!('9.9' in partial.statuses))
})

test('persistence: storage failures surface as errors, never silently', async () => {
  const none = await localTrackerStorage(undefined).load()
  assert.match(none.error ?? '', /unavailable/)
  await assert.rejects(localTrackerStorage(undefined).save(initialStatuses()), /unavailable/)
  const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('quota exceeded') } }
  assert.match((await localTrackerStorage(broken).load()).error ?? '', /blocked/)
  await assert.rejects(localTrackerStorage(broken).save(initialStatuses()), /could not be saved.*quota exceeded/)
})
