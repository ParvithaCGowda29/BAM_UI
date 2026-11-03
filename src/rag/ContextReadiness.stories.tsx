import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { RagReviewView } from './RagSeamless'

// Context readiness: the four readiness checks, the knowledge bundle and the run's provenance. The checks follow the
// shared context run (started once for the preview, about 10 s): Pending while it builds, Ready afterwards.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}
function Readiness({ stage }: { stage: SeedStage }) {
  return <ContextRun><PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <RagReviewView snap={snap} />}</AtStage></PaneFrame></ContextRun>
}

const meta = {
  title: 'Context/Context readiness',
  tags: ['autodocs'],
  component: Readiness,
  args: { stage: 'ingested' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Readiness>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { stage: 'ingested' } }
