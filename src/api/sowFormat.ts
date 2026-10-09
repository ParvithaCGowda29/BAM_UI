// The ISATVON SOW format (see the approved SOW sample): flat "Requirement N" blocks, each tagged with all
// seven ISATVON fields. The SOW has NO agent/skill grouping; that is applied after approval by a separate
// step (`clusterRequirement`). Status and approval lines are system metadata, not document text.
import { ISATVON, type IsatvonField } from './types.ts'

export type RequirementFields = Record<IsatvonField, string>

/** SOW-format labels, in ISATVON order. */
export const SOW_LABELS: Record<IsatvonField, string> = {
  instructions: 'I — Instructions', sourceData: 'S — Source Data', automation: 'A — Automation', techStack: 'T — Tech Stack',
  variables: 'V — Variables', outcome: 'O — Outcome', notifications: 'N — Notify on next',
}
/** Fields rendered as code in the SOW, like the sample. */
const CODE_FIELDS: IsatvonField[] = ['sourceData', 'automation', 'variables']

/** Illustrative LLM output for the RFQ workflow, in requirement order (no grouping). */
export const RFQ_REQUIREMENTS: RequirementFields[] = [
  { instructions: 'Watch the RFQ inbox, accept the package, store each attachment in object storage and register it with the workflow run.',
    sourceData: 's3://client-bucket/rfq/inbox/', automation: 'UNSTRUCTURED_TO_SOW_LLM', techStack: 'FastMCP, PostgreSQL',
    variables: 'max_attachments: 25; accepted_types: pdf,xlsx,csv', outcome: 'RfqPackage JSON: package_id, attachments[], received_at',
    notifications: 'Post to #rfq-intake on receipt' },
  { instructions: 'Classify each attachment as drawing, BOM, specification or commercial terms using the OKF document classes.',
    sourceData: 's3://client-bucket/rfq/inbox/', automation: 'UNSTRUCTURED_TO_SOW_LLM', techStack: 'Cognee, Pydantic',
    variables: 'classes: drawing,bom,spec,terms; min_confidence: 0.8', outcome: 'ClassifiedDocument[] JSON with class and confidence',
    notifications: 'Alert on unclassified attachment' },
  { instructions: 'Validate every BOM line: part_no, qty and material are mandatory; flag lines that fail and keep the reason.',
    sourceData: 's3://client-bucket/rfq/bom_file.xlsx', automation: 'EXCEL_TO_JSON_AST', techStack: 'OpenPyXL, DuckDB, Pydantic',
    variables: 'header_row: 1; required_columns: part_no,qty,material; target_cell: BOM!A2', outcome: 'BOM matrix JSON with per-line validation result',
    notifications: 'Webhook on validation complete' },
  { instructions: 'Route flagged BOM lines to the quality lead; block quotation until every blocking exception is resolved.',
    sourceData: 'db://bam/bom_exceptions', automation: 'HITL_APPROVAL', techStack: 'FastMCP, DBHub',
    variables: 'blocking_severity: high; sla_hours: 24', outcome: 'ExceptionDecision[] JSON: line_id, decision, reviewer',
    notifications: 'HITL sign-off by quality lead; webhook on routing' },
  { instructions: 'Calculate landed cost by adding base price, 4% freight, and local tariffs for each BOM line, then aggregate.',
    sourceData: 'db://erp/pricing.price_list', automation: 'JSON_TO_PYTHON_JINJA2', techStack: 'DuckDB, Pydantic',
    variables: 'freight_rate: 0.04; tariff_table: db://erp/tariffs; total_formula: =SUM(Quote!B2:B11)', outcome: 'Aggregated pricing comparison table (JSON)',
    notifications: 'Post to #rfq-quotes on completion or error' },
  { instructions: 'Present the aggregated quote to the commercial manager and record the approval decision with timestamp.',
    sourceData: 'db://bam/quotes', automation: 'HITL_APPROVAL', techStack: 'PostgreSQL, Apache Superset',
    variables: 'approver_role: commercial_manager', outcome: 'QuoteApproval JSON: quote_id, decision, approved_at',
    notifications: 'HITL sign-off by commercial manager; callback on approval' },
]

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const unesc = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' })[e]!)
const text = (html: string) => unesc(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

export const reqPassage = (n: number) => `req-${n}`

export function renderSowHtml(reqs: RequirementFields[], notes: string[] = []) {
  const field = (k: IsatvonField, v: string) => {
    const body = CODE_FIELDS.includes(k) ? `<code>${esc(v)}</code>` : esc(k === 'notifications' ? `PARSED · ${v}` : v)
    return `<li><p><strong>${SOW_LABELS[k]}:</strong> ${body}</p></li>`
  }
  return [
    '<h1>Statement of Work — RFQ automation</h1>',
    '<blockquote><p><strong>Note on this document:</strong> this SOW contains individually ISATVON-tagged requirements only, in the order they occur. ' +
      'It has no agent or skill grouping; that is applied after approval by a separate step.</p></blockquote>',
    ...reqs.flatMap((r, i) => [
      `<h2 data-passage="${reqPassage(i + 1)}">Requirement ${i + 1}</h2>`,
      `<ul>${ISATVON.map(c => field(c.key, r[c.key])).join('')}</ul>`,
    ]),
    '<h2>Approval</h2>',
    '<p>This Statement of Work is reviewed and approved by the client stakeholder following FDE review and editing in the TipTap editor. ' +
      'Any material change to scope requires a change order and re-approval before implementation proceeds.</p>',
    ...(notes.length ? ['<h2>Revision notes</h2>', ...notes.map(n => `<p>Addressed review request: ${esc(n)}</p>`)] : []),
  ].join('')
}

export interface ParsedRequirement { n: number; passageId: string; fields: RequirementFields }

/** Read the ISATVON blocks back out of (possibly human-edited) SOW HTML. Missing fields come back empty. */
export function parseRequirements(html: string): ParsedRequirement[] {
  const heads = [...html.matchAll(/<h2[^>]*>\s*Requirement\s+(\d+)\s*<\/h2>/gi)]
  return heads.map(h => {
    // A requirement runs until the next <h2> (the next requirement, Approval, or Revision notes).
    const start = h.index! + h[0].length
    const rel = html.slice(start).search(/<h2[\s>]/i)
    const chunk = html.slice(start, rel < 0 ? html.length : start + rel)
    const fields = Object.fromEntries(ISATVON.map(c => [c.key, ''])) as RequirementFields
    for (const m of chunk.matchAll(/<strong>\s*([ISATVON])\s*[—–-][^<:]*:?\s*<\/strong>([\s\S]*?)<\/p>/g)) {
      const key = ISATVON.find(c => c.letter === m[1])!.key
      let v = text(m[2]).replace(/^:\s*/, '')
      if (key === 'automation') v = v.match(/[A-Z][A-Z0-9_]{2,}/)?.[0] ?? v
      if (key === 'notifications') v = v.replace(/^PARSED\s*[·—–-]\s*/, '')
      fields[key] = v
    }
    return { n: Number(h[1]), passageId: reqPassage(Number(h[1])), fields }
  })
}

// Post-approval clustering (stand-in for the separate LLM call): requirement → agent and a short skill name.
const CLUSTERS: [agent: string, name: string][] = [
  ['Intake Agent', 'Receive RFQ package'], ['Intake Agent', 'Classify documents'], ['Quality Agent', 'Validate BOM'],
  ['Quality Agent', 'Review exceptions'], ['Quote Agent', 'Calculate landed cost'], ['Quote Agent', 'Approve quote output'],
]
export function clusterRequirement(n: number, fields: RequirementFields): { agent: string; name: string } {
  const known = CLUSTERS[n - 1]
  if (known) return { agent: known[0], name: known[1] }
  const words = fields.instructions.split(/\s+/).slice(0, 3).join(' ').replace(/[^\w\s-]/g, '')
  return { agent: 'General Agent', name: words || `Requirement ${n}` }
}
