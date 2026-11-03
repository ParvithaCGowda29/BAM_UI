// npm test: Enterprise Assistant answers from live workflow state and never acts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FILE_CHIPS, STARTER_CHIPS, attachmentReply, chipReply, intentOf, isObjective, objectiveReply, reply, screenNote, type AssistantFacts } from './assistant.ts'
import { createMockApi } from '../api/mock.ts'

const facts = (snap: AssistantFacts['snap'], extra: Partial<AssistantFacts> = {}): AssistantFacts =>
  ({ snap, stages: [{ label: 'Ingestion', status: 'In progress', done: 1, total: 4 }], active: 'Scan', statuses: {}, ...extra })

test('assistant: refuses to approve, certify, hand over or deploy', async () => {
  const snap = await createMockApi({ speed: 0.01 }).getSnapshot()
  for (const q of ['Approve the SOW', 'deploy it now', 'please commit it', 'publish the workflow'])
    assert.match(reply(q, facts(snap)), /cannot approve, certify, hand over or deploy/, q)
})

test('assistant: explains a locked screen with the same reason the screen shows', async () => {
  const snap = await createMockApi({ speed: 0.01 }).getSnapshot()
  const f = facts(snap, { screen: { id: '3.2', label: 'Skills grid', stage: 'FDE Workbench', locked: 'SOW v1 is a draft awaiting approval.' } })
  assert.match(reply('Why is this locked?', f), /Skills grid is locked: SOW v1 is a draft/)
  assert.match(screenNote(f), /^Skills grid is locked/)
})

test('assistant: scan answers come from the snapshot; upload is never called safe', async () => {
  const api = createMockApi({ speed: 0.01 })
  assert.match(reply('scan status', facts(await api.getSnapshot())), /No files uploaded yet/)
  await api.uploadFile({ name: 'rfq.pdf', size: 1000 }, () => {})
  const snap = await api.getSnapshot()
  assert.match(reply('scan status', facts(snap)), /1 files: 0 ready, 1 being checked/)
  assert.doesNotMatch(reply('scan status', facts(snap)), /scan|quarantin|clamav|repel/i)
  assert.match(screenNote(facts(snap, { screen: { id: '1.1', label: 'Upload', stage: 'Ingestion' } })), /1 file added; checking uploads/)
})

test('assistant: progress lists the stages', async () => {
  const snap = await createMockApi({ speed: 0.01 }).getSnapshot()
  assert.equal(reply('Workflow progress', facts(snap)), 'Ingestion: In progress (1/4)')
})

test('assistant: the intake objective is captured through the composer', async () => {
  const snap = await createMockApi({ speed: 0.01 }).getSnapshot()
  const intake = { objective: '', inFlight: 0, checksReady: 0, checksTotal: 4, capture: true }
  assert.match(screenNote(facts(snap, { screen: { id: '1.1', label: 'Upload', stage: 'Ingestion' }, intake })), /^Add your first files with \+ Add files on the left\. What would you like this RFQ pack to help you do\?$/)
  assert.ok(isObjective('Extract RFQ line items'))
  assert.ok(!isObjective('What is next?'), 'a question is answered, not saved as the objective')
  assert.equal(objectiveReply(facts(snap, { intake })), 'Saved as the intake objective.')
})

test('assistant: questions are answered, ambiguous messages are confirmed before saving', () => {
  for (const q of ['What is next?', 'How many files are ready', 'can you check the BOM', 'Is the SOW approved']) assert.equal(intentOf(q), 'question', q)
  for (const a of ['Check the BOM? then quote it', 'Tell me about the quote pack', 'show tolerances please', 'Quote pack']) assert.equal(intentOf(a), 'ambiguous', a)
  for (const o of ['Extract RFQ line items', 'Build a costing agent for the Meridian PCBA quote']) assert.equal(intentOf(o), 'objective', o)
  assert.equal(intentOf('   '), 'question', 'empty text is never saved')
})

test('assistant: suggestion chips are answered, never saved, and content chips admit no model', async () => {
  const snap = await createMockApi({ speed: 0.01 }).getSnapshot()
  for (const c of [...STARTER_CHIPS, ...FILE_CHIPS]) assert.ok(chipReply(c, facts(snap)), c)
  assert.match(chipReply('Find gaps in these files', facts(snap))!, /No language model is connected/)
  assert.equal(chipReply('Summarize the pack', facts(snap)), undefined)
  assert.match(attachmentReply(['a.pdf']), /a.pdf is attached to this chat only, not added to the pack/)
})
