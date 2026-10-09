// SOW judge on Laya (https://huggingface.co/convaiinnovations/laya, run via @receptron/laya).
// Laya is a System-1 decision model: it answers typed questions about a state with calibrated probabilities
// (`noul` = P(true), `score` = expected level on a rubric). We ask it, per SOW requirement and per discovery fact:
//   faithfulness  noul   Is the requirement supported by the discovery context (nothing invented)?
//   clarity       score  How build-ready is the requirement? (vague .. build-ready)
//   coverage      noul   Is this discovery fact addressed by the SOW?
// Scores are means scaled to 0-100. Pure: `systemOne` is injected, so it is testable without the 1.7 GB model.

export interface Requirement { n: number; fields: Record<string, string> }
export interface JudgeRequest { requirements: Requirement[]; facts: string[] }
export interface JudgeMetric { key: 'faithfulness' | 'coverage' | 'clarity'; score: number; detail: string }
export interface JudgeResult { model: string; metrics: JudgeMetric[]; findings: { requirement: number; text: string }[]; inputTokens: number }

type Q = { type: 'noul'; instructions: string } | { type: 'score'; instructions: string; criteria: string[] }
type A = { noul?: number; score?: number }
export type SystemOne = (state: object, questions: Record<string, Q>) => Promise<{ model: string; answers: Record<string, A>; usage: { input_tokens: number } }>

const CLARITY = ['vague', 'partly clear', 'clear', 'build-ready']
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export async function judgeSow(req: JudgeRequest, systemOne: SystemOne): Promise<JudgeResult> {
  if (!req.requirements.length) throw new Error('No requirements to judge')
  const context = req.facts.slice(0, 20)
  let model = 'laya', tokens = 0
  const faithful: number[] = [], clarity: number[] = [], findings: JudgeResult['findings'] = []
  for (const r of req.requirements) {
    const res = await systemOne({ requirement: r.n, ...r.fields, discovery_context: context }, {
      faithful: { type: 'noul', instructions: 'Is every statement in this requirement supported by the discovery context, with nothing invented?' },
      clarity: { type: 'score', instructions: 'How actionable is this requirement for an engineer building it?', criteria: CLARITY },
    })
    model = res.model; tokens += res.usage.input_tokens
    const p = res.answers.faithful.noul ?? 0, c = (res.answers.clarity.score ?? 0) / (CLARITY.length - 1)
    faithful.push(p); clarity.push(c)
    if (p < 0.5) findings.push({ requirement: r.n, text: `Laya: may not be supported by the discovery context (P=${p.toFixed(2)})` })
    if (c < 0.5) findings.push({ requirement: r.n, text: `Laya: not build-ready (expected level ${(res.answers.clarity.score ?? 0).toFixed(2)} of ${CLARITY.length - 1})` })
  }
  const summary = req.requirements.map(r => `Requirement ${r.n}: ${r.fields.instructions ?? ''}`).join('\n')
  // One call per fact: measured faster on CPU than one batched call (34 s vs 61-75 s for the RFQ SOW; padding).
  const covered: number[] = []
  for (const fact of context) {
    const res = await systemOne({ discovery_fact: fact, sow_requirements: summary }, {
      covered: { type: 'noul', instructions: 'Do the SOW requirements address this discovery fact?' },
    })
    tokens += res.usage.input_tokens
    covered.push(res.answers.covered.noul ?? 0)
  }
  const pct = (x: number) => Math.round(x * 100)
  return {
    model, inputTokens: tokens, findings,
    metrics: [
      { key: 'faithfulness', score: pct(mean(faithful)), detail: `Mean P(supported) over ${faithful.length} requirements (Laya noul)` },
      { key: 'coverage', score: context.length ? pct(mean(covered)) : 0, detail: context.length ? `Mean P(addressed) over ${context.length} discovery facts (Laya noul)` : 'No discovery facts to check' },
      { key: 'clarity', score: pct(mean(clarity)), detail: `Mean expected level on "${CLARITY.join(' / ')}" (Laya score)` },
    ],
  }
}
