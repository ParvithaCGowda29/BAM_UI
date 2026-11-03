// Storybook only: renders a screen against the app's mock backend driven to a workflow stage (storybook/seed.ts),
// inside a local Refine provider (it brings its own TanStack QueryClient) so useSnapshot / useSkills / useCode /
// useAction work without the app shell. Stories pick the stage through a `stage` arg.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Refine, type DataProvider } from '@refinedev/core'
import type { BamApi } from '../api/adapter'
import type { Snapshot, StepId, StepInfo } from '../api/types'
import { Skeleton } from '../components/ui'
import { STAGES, seeded, type SeedStage } from './seed.ts'

export { STAGES, type SeedStage }
export interface Backend { api: BamApi; snap: Snapshot }

const loaded = new Map<SeedStage, Promise<Backend>>()
function load(stage: SeedStage) {
  let p = loaded.get(stage)
  if (!p) { p = seeded(stage).then(async api => ({ api, snap: await api.getSnapshot() })); loaded.set(stage, p) }
  return p
}

function providerFor(api: BamApi): DataProvider {
  const reads: Record<string, () => Promise<unknown>> = {
    snapshot: () => api.getSnapshot(),
    skills: async () => ({ rows: await api.getSkills() }),
    code: async () => ({ files: await api.getCode() }),
  }
  const no = () => Promise.reject(new Error('Not used in stories'))
  return {
    getApiUrl: () => 'mock://storybook', getList: no, getOne: no, create: no, update: no, deleteOne: no,
    custom: async ({ url }) => ({ data: (await reads[url]()) as never }),
  }
}

function WithRefine({ b, children }: { b: Backend; children: (b: Backend) => ReactNode }) {
  const dataProvider = useMemo(() => providerFor(b.api), [b.api])
  return (
    <Refine dataProvider={dataProvider} options={{ disableTelemetry: true, reactQuery: { clientConfig: { defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } } } }}>
      {children(b)}
    </Refine>
  )
}

/** Renders `children` with the backend at `stage`; a loading skeleton shows while the stage is seeded. Loaded in an
 *  effect, not with Suspense: a re-suspending boundary would hide and reconnect the screen, and the SOW editor cannot
 *  survive a reconnect (its effects run before the new editor view is mounted). */
export function AtStage({ stage, children }: { stage: SeedStage; children: (b: Backend) => ReactNode }) {
  const [b, setB] = useState<{ stage: SeedStage; b: Backend }>()
  useEffect(() => { let live = true; void load(stage).then(x => { if (live) setB({ stage, b: x }) }); return () => { live = false } }, [stage])
  return b?.stage === stage ? <WithRefine key={stage} b={b.b}>{children}</WithRefine> : <Skeleton rows={6} label="Loading the example workflow" />
}

/** The backend step info a gated screen receives as `info`. */
export const stepInfo = (snap: Snapshot, step: StepId): StepInfo => snap.steps[step - 1]

/** A fixed-height column like the workspace pane, for screens that fill their container. */
export function PaneFrame({ height = 640, children }: { height?: number; children: ReactNode }) {
  return <div style={{ height, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
}

/** The `stage` control every screen story shares. */
export const stageArg = { stage: { control: 'select' as const, options: [...STAGES], description: 'Workflow stage of the example backend' } }
