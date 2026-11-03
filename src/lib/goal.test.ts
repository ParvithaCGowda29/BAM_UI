// npm test: Upload goal capture → ISATVON draft, the assistant's draft edits, and the draft's chips.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EXAMPLE, OTHERS, WHAT_OPTIONS, WHERE_OPTIONS, WHO_OPTIONS, amountOf, canAddFiles, conversationChips, flowLine, applyEdit, changedSections, draftChips, draftHtml, draftReply, expandGoal, missingUploads, plain, readHtml, sentence } from './goal.ts'

test('goal: the example expands into the quotation draft and its required uploads', () => {
  assert.equal(sentence(EXAMPLE), 'Build an AI agent that automates quoting for sales managers at SMB manufacturers in India')
  const d = expandGoal(EXAMPLE)
  assert.equal(d.title, 'Quote Automation Agent')
  assert.equal(d.subtitle, 'For sales managers at SMB manufacturers in India.')
  assert.match(plain(d.sections.N), /^Notify the sales manager of missing inputs/)
  assert.deepEqual(d.uploads.map(u => [u.name, u.required]), [['Enquiry samples', true], ['Pricing rules', true], ['Product catalogue', true], ['Approval policy', false]])
  assert.deepEqual(missingUploads(d, ['RFQ_Package.pdf', 'Pricing_Targets.xlsx']).map(u => u.name), ['Product catalogue', 'Approval policy'])
  assert.equal(expandGoal({ what: 'invoice matching', who: 'Finance teams', where: 'Germany' }).title, 'Invoice Matching Agent')
})

test('goal: amounts in words and digits', () => {
  assert.equal(amountOf('quotes above 2 lakh'), 200000)
  assert.equal(amountOf('₹2,00,000'), 200000)
  assert.equal(amountOf('1.5 crore'), 15000000)
  assert.equal(amountOf('50k'), 50000)
  assert.equal(amountOf('no number'), undefined)
})

test('goal: a sign-off threshold edit updates Automation and Variables (wireframe text)', () => {
  const d = expandGoal(EXAMPLE)
  const e = applyEdit(d, 'Tighten the approval step - quotes above 2 lakh should need a senior sign-off.')!
  assert.equal(plain(e.draft.sections.A), 'Enquiry → cost estimate → draft quote → approval → delivery. Quotes above ₹2,00,000 route to a senior approver first.')
  assert.equal(plain(e.draft.sections.V), 'Currency, pricing, margins, approval limits and retry bounds. Senior sign-off threshold: ₹2,00,000.')
  assert.match(e.reply, /^Done\. Automation now routes quotes above ₹2,00,000/)
  assert.deepEqual(changedSections(e.draft), ['A', 'V'])
  // A second threshold replaces the first.
  assert.equal((plain(applyEdit(e.draft, 'senior sign-off above 5 lakh')!.draft.sections.V).match(/threshold/g) ?? []).length, 1)
  assert.equal(applyEdit(d, 'What is this?'), undefined)
})

test('goal: chips follow the draft on screen', () => {
  const d = expandGoal(EXAMPLE)
  assert.deepEqual(draftChips(d, []), ['Which files are still missing?', 'Explain the Variables in plain words', 'Add a margin guardrail'])
  const t = applyEdit(d, 'quotes above 2 lakh need senior sign-off')!.draft
  assert.deepEqual(draftChips(t, []), ['Which files are still missing?', 'Explain the Variables in plain words', 'Add a margin guardrail', 'Show what changed in the draft'])
  const m = applyEdit(t, 'Add a margin guardrail')!.draft
  assert.ok(!draftChips(m, []).includes('Add a margin guardrail'))
  assert.match(draftReply(m, 'Show what changed in the draft', [])!, /Automation.*Variables/)
  assert.match(draftReply(d, 'Which files are still missing?', [])!, /Still required: Enquiry samples/)
})

test('goal: editor HTML round-trips into the sections', () => {
  const d = expandGoal(EXAMPLE)
  const edited = draftHtml(d).replace('Reviewed quote', '<strong>Signed</strong> quote')
  assert.equal(readHtml(d, edited).sections.O, '<strong>Signed</strong> quote with cost breakdown, approval status and an audit trail.')
})

test('goal: Add files opens only on approval, never on expansion', () => {
  const draft = expandGoal(EXAMPLE)
  assert.equal(canAddFiles({ goal: EXAMPLE, draft: null, approved: false }), false)
  assert.equal(canAddFiles({ goal: EXAMPLE, draft, approved: false }), false, 'expanded is not enough')
  assert.equal(canAddFiles({ goal: { ...EXAMPLE, where: 'Europe' }, draft, approved: false }), false)
  assert.equal(canAddFiles({ goal: EXAMPLE, draft, approved: true }), true)
})

test('goal: at most two chips; after the first message only follow-ups to it', () => {
  const d = expandGoal(EXAMPLE), files = ['RFQ_Package.pdf']
  assert.deepEqual(conversationChips(d, files, null), ['Which files are still missing?', 'Explain the Variables in plain words'])
  assert.deepEqual(conversationChips(d, files, 'Which files are still missing?'), ['What goes into Pricing rules?', 'What goes into Product catalogue?'])
  assert.match(draftReply(d, 'What goes into Pricing rules?', files)!, /^Pricing rules: rates, discounts and margins\. It is required/)
  const t = applyEdit(d, 'quotes above 2 lakh need senior sign-off')!.draft
  assert.deepEqual(conversationChips(t, files, 'quotes above 2 lakh need senior sign-off'), ['Show what changed in the draft', 'Change the sign-off threshold to 5 lakh'])
  assert.deepEqual(conversationChips(d, files, 'Explain the Variables in plain words'), ['Add a margin guardrail', 'Quotes above 2 lakh need a senior sign-off'])
  assert.deepEqual(conversationChips(d, files, 'hello there'), [], 'an unrelated message gets no generic chips back')
  for (const last of [null, 'Which files are still missing?', 'Add a margin guardrail']) assert.ok(conversationChips(d, files, last).length <= 2)
})

test('goal: dropdown defaults keep the quotation example; every What option drafts from its own profile', () => {
  assert.deepEqual(EXAMPLE, { what: 'Quoting', who: 'Sales managers at SMB manufacturers', where: 'India' })
  assert.equal(flowLine(EXAMPLE), 'Quote Automation: enquiry → cost estimate → quote → approval → delivery')
  const titles = WHAT_OPTIONS.filter(o => o !== OTHERS).map(what => expandGoal({ ...EXAMPLE, what }).title)
  assert.deepEqual(titles, ['Quote Automation Agent', 'RFQ Response Agent', 'Quality Inspection Agent', 'Asset Management Agent', 'GTM Workflow Agent', 'Lead Generation Agent'])
  assert.equal(new Set(WHAT_OPTIONS.filter(o => o !== OTHERS).map(what => expandGoal({ ...EXAMPLE, what }).uploads[0].name)).size, 6, 'each profile has its own uploads')
  const q = expandGoal({ what: 'Quality engineering', who: 'Quality engineers and QA teams', where: 'Europe' })
  assert.equal(q.subtitle, 'For quality engineers and QA teams in Europe.')
  assert.match(plain(q.sections.N), /^Notify the quality engineer of missing inputs or a nonconformance report/)
  assert.match(applyEdit(q, 'nonconformances above 50k need senior sign-off')!.reply, /routes nonconformances above 50,000/)
  for (const opts of [WHAT_OPTIONS, WHO_OPTIONS, WHERE_OPTIONS]) assert.equal(opts[opts.length - 1], OTHERS)
})
