import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOW_CONFIDENCE, detectKind, laneOf } from './fileKind.ts'

test('lanes by extension', () => {
  assert.deepEqual(['a.pdf', 'b.xlsx', 'c.png', 'd.zip'].map(laneOf), ['Documents', 'Sheets', 'Images', 'Other'])
})

test('type and confidence: keyword + matching lane high, keyword alone lower, a plain document or sheet still above the review line', () => {
  assert.deepEqual(detectKind('RFQ_Meridian.pdf'), { type: 'RFQ', confidence: 92, lane: 'Documents' })
  assert.equal(detectKind('BOM_v3.xlsx').type, 'BOM')
  assert.equal(detectKind('Quote_2025.docx').type, 'Quote')
  assert.equal(detectKind('BOM_notes.pdf').confidence, 76) // BOM expected as a sheet
  const plain = detectKind('scan0042.pdf')
  assert.equal(plain.type, 'Document'); assert.ok(plain.confidence >= LOW_CONFIDENCE)
})

test('needs review: only guesses fall below LOW_CONFIDENCE (70)', () => {
  assert.equal(LOW_CONFIDENCE, 70)
  const flagged = ['Supplier_catalog.pdf', 'Costing.xlsx', 'IMG_0045.png', 'archive.zip', 'RFQ_Meridian.pdf', 'BOM_notes.pdf']
    .filter(n => detectKind(n).confidence < LOW_CONFIDENCE)
  assert.deepEqual(flagged, ['IMG_0045.png', 'archive.zip'])
})
