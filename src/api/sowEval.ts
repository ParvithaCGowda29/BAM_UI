// SOW accuracy evaluation. Rule checks are deterministic and real (computed from the SOW text with the same
// field validator the backend uses for the ISATVON contract). Judge metrics come from Laya (convaiinnovations/laya,
// a Jev-compatible System-1 model run by server/laya-judge): calibrated P(supported), P(covered) and a clarity level.
// When the service is not running, the judge is simulated from the rule results and labelled as such.
import { ISATVON, type IsatvonField, type SowEvaluation, type SowFinding, type SowMetric } from './types.ts'
import { parseRequirements } from './sowFormat.ts'

export const SOW_JUDGE = 'Laya (Jev-compatible System-1 judge)'
export const SIMULATED_JUDGE = 'Simulated judge'

export interface LayaJudgeResult { model: string; metrics: { key: string; score: number; detail: string }[]; findings: { requirement: number; text: string }[]; inputTokens: number; ms?: number }
/** Calls the Laya judge service (server/laya-judge) through the dev proxy. Throws with a readable reason when it is unavailable. */
export async function layaJudge(html: string, facts: string[], url = '/laya/judge'): Promise<LayaJudgeResult> {
  const requirements = parseRequirements(html).map(r => ({ n: r.n, fields: r.fields }))
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requirements, facts }) })
  const body = await res.json().catch(() => ({})) as LayaJudgeResult & { error?: string }
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body
}
export const JUDGE_CRITERIA = [
  { key: 'faithfulness', label: 'Faithful to the RAG context', rubric: 'Every requirement is supported by the retrieved discovery context; nothing is invented.' },
  { key: 'coverage', label: 'Covers the discovery requirements', rubric: 'Each need found in the source documents appears as a requirement.' },
  { key: 'clarity', label: 'Clear and actionable', rubric: 'An engineer can build each requirement without asking follow-up questions.' },
] as const

const PLACEHOLDER = /\b(TBD|TODO|TBC|lorem|xxx|to be (decided|confirmed)|n\/a)\b|\?\?/i
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)

/** Deterministic checks on the SOW HTML. `validate` is the backend's ISATVON field validator. */
export function ruleChecks(html: string, validate: (f: IsatvonField, v: string) => string | undefined): { metrics: SowMetric[]; findings: SowFinding[] } {
  const reqs = parseRequirements(html)
  const findings: SowFinding[] = []
  let filled = 0, valid = 0, specific = 0
  for (const r of reqs) for (const c of ISATVON) {
    const v = r.fields[c.key].trim()
    const at = { requirement: r.n, passageId: r.passageId, field: `${c.letter} ${c.label}` }
    if (!v) { findings.push({ ...at, text: 'Missing' }); continue }
    filled++
    const err = validate(c.key, v)
    if (err) findings.push({ ...at, text: err }); else valid++
    if (PLACEHOLDER.test(v)) findings.push({ ...at, text: `Unresolved placeholder: "${v.match(PLACEHOLDER)![0]}"` }); else specific++
  }
  const total = reqs.length * ISATVON.length
  const approval = /<h2[^>]*>\s*Approval/i.test(html)
  const metrics: SowMetric[] = [
    { key: 'completeness', label: 'ISATVON completeness', method: 'rule', score: pct(filled, total), detail: `${filled} of ${total} fields filled across ${reqs.length} requirements` },
    { key: 'validity', label: 'Contract validity', method: 'rule', score: pct(valid, filled), detail: `${valid} of ${filled} filled fields pass the ISATVON contract validator` },
    { key: 'specificity', label: 'No open placeholders', method: 'rule', score: pct(specific, filled), detail: `${filled - specific} field${filled - specific === 1 ? '' : 's'} with TBD/TODO-style placeholders` },
    { key: 'structure', label: 'SOW format', method: 'rule', score: reqs.length && approval ? 100 : reqs.length ? 50 : 0,
      detail: !reqs.length ? 'No "Requirement N" blocks found' : approval ? `${reqs.length} requirement blocks and an Approval clause` : 'Approval clause is missing' },
  ]
  return { metrics, findings }
}

/** Overall accuracy: rule checks and judge criteria weigh equally. */
export function overall(metrics: SowMetric[]): number {
  const avg = (m: SowMetric[]) => (m.length ? m.reduce((n, x) => n + x.score, 0) / m.length : undefined)
  const parts = [avg(metrics.filter(m => m.method === 'rule')), avg(metrics.filter(m => m.method === 'judge'))].filter((x): x is number => x !== undefined)
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0
}

export type { SowEvaluation }
