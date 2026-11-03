// Storybook only: the app's own mock backend (fast clock), driven to a workflow stage so screen stories render real
// snapshots. Every stage gets its own backend instance; nothing here touches the app's `api` singleton.
import { createMockApi } from '../api/mock.ts'
import type { BamApi } from '../api/adapter.ts'

export const STAGES = ['empty', 'scanning', 'verified', 'ingested', 'sow', 'grid', 'gridReviewed', 'contract', 'approved', 'tested', 'reviewed', 'committed', 'deployed'] as const
export type SeedStage = typeof STAGES[number]

const FILES = [
  { name: 'RFQ_Package_Meridian.pdf', size: 2_480_000 },
  { name: 'BOM_rev_C.xlsx', size: 386_000 },
  { name: 'Terms_and_Conditions.pdf', size: 912_000 },
]

async function until(cond: () => Promise<boolean>) {
  for (let i = 0; i < 2000; i++) { if (await cond()) return; await new Promise(r => setTimeout(r, 10)) }
  throw new Error('seed: timed out')
}

async function drive(api: BamApi, to: SeedStage) {
  const at = STAGES.indexOf(to)
  const reached = (s: SeedStage) => at >= STAGES.indexOf(s)
  const snap = () => api.getSnapshot()
  if (!reached('scanning')) return
  for (const f of FILES) await api.uploadFile(f, () => {})
  if (!reached('verified')) return
  await until(async () => (await snap()).uploads.every(u => u.scan === 'verified'))
  if (!reached('ingested')) return
  await api.startIngestionRun()
  if (!reached('sow')) return
  await api.startSowGeneration('run-2026-10-21-a')
  await until(async () => !!(await snap()).sow)
  if (!reached('grid')) return
  await api.approveSow((await snap()).sow!.version)
  await until(async () => (await api.getSkills()).length > 0 && (await snap()).activeStep === 2)
  if (!reached('gridReviewed')) return
  await api.markGridReviewed()
  if (!reached('contract')) return
  await api.generateContract()
  await until(async () => (await snap()).workflow?.status !== 'running')
  if (!reached('approved')) return
  await api.approveManifest()
  if (!reached('tested')) return
  await api.runTests()
  await until(async () => (await snap()).tests?.promptfoo.status === 'succeeded')
  if (!reached('reviewed')) return
  await api.markTestsReviewed()
  if (!reached('committed')) return
  await api.commitToPostgres()
  await until(async () => !!(await snap()).persist.committed)
  if (!reached('deployed')) return
  await api.deployToStaging()
  await until(async () => !!(await snap()).persist.deployed)
}

const cache = new Map<SeedStage, Promise<BamApi>>()
/** A mock backend at `stage` (created once per stage and reused). */
export function seeded(stage: SeedStage): Promise<BamApi> {
  let p = cache.get(stage)
  if (!p) {
    const api = createMockApi({ speed: 0.01 })
    p = drive(api, stage).then(() => api)
    cache.set(stage, p)
  }
  return p
}
