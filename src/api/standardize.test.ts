import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classify, decide, sniff } from './standardize.ts'

const bytes = (s: string | number[]) => typeof s === 'string' ? new TextEncoder().encode(s) : new Uint8Array(s)
const zip = (flag = 0, first = '[Content_Types].xml') => new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0, flag, 0, ...bytes('........................'), ...bytes(first)])

test('routing uses the accepted types, never the reference list alone', () => {
  assert.equal(classify('rfq.pdf'), 'direct')
  assert.equal(classify('parts.xlsx'), 'direct')
  assert.equal(classify('drawing.dwg'), 'unsupported') // listed for a PDF copy, but not accepted by this build
})

test('signature checks find real problems', () => {
  assert.deepEqual(sniff('rfq.pdf', 10, bytes('%PDF-1.7 ...')), [])
  assert.deepEqual(sniff('rfq.pdf', 10, bytes('%PDF-1.7'), bytes('trailer << /Encrypt 5 0 R >>')), ['password'])
  assert.deepEqual(sniff('rfq.pdf', 10, zip()), ['wrong-extension']) // a ZIP named .pdf
  assert.deepEqual(sniff('rfq.pdf', 10, bytes('garbage')), ['corrupted'])
  assert.deepEqual(sniff('parts.xlsx', 10, zip()), [])
  assert.deepEqual(sniff('parts.xlsx', 10, bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])), ['password'])
  assert.deepEqual(sniff('vendor.zip', 10, zip(1, 'a.txt')), ['password'])
  assert.deepEqual(sniff('notes.txt', 10, bytes([0x61, 0, 0x62])), ['wrong-extension'])
  assert.deepEqual(sniff('empty.txt', 0, bytes('')), ['corrupted'])
})

test('decision: Yes ready, No Local AI fix, Doubtful manual review until accepted', () => {
  assert.equal(decide('direct', undefined).state, 'checking')
  assert.equal(decide('direct', []).state, 'ready')
  assert.equal(decide('direct', ['password']).state, 'fix')
  assert.equal(decide('direct', ['wrong-extension']).state, 'manual')
  const ok = decide('direct', ['wrong-extension'], { reviewed: true })
  assert.equal(ok.state, 'ready'); assert.equal(ok.reviewed, true)
  assert.equal(decide('direct', ['corrupted', 'wrong-extension'], { reviewed: true }).state, 'fix') // review never clears a known problem
  assert.equal(classify('drawing.png'), 'pdf-copy') // accepted, and routed to a PDF analysis copy first
  assert.equal(decide('pdf-copy', []).state, 'manual') // no conversion service: a person reviews, never silently ready
  assert.equal(decide('pdf-copy', [], { reviewed: true }).state, 'ready')
  assert.deepEqual(sniff('drawing.png', 10, bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), [])
  assert.deepEqual(sniff('drawing.png', 10, bytes('%PDF-1.4')), ['wrong-extension'])
  assert.equal(decide('direct', [], { unreadable: true }).state, 'failed')
})
