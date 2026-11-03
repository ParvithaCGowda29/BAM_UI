import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { OkfBundleCard } from './RagScreens'

// The knowledge bundle built from the released uploads and the shared context run (started once for the preview).
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}
function Bundle({ stage }: { stage: SeedStage }) {
  return <ContextRun><AtStage stage={stage}>{({ snap }) => <OkfBundleCard snap={snap} />}</AtStage></ContextRun>
}

const meta = {
  title: 'Context/Knowledge bundle',
  tags: ['autodocs'],
  component: Bundle,
  args: { stage: 'ingested' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Bundle>
export default meta
type Story = StoryObj<typeof meta>

export const NoUploads: Story = { args: { stage: 'empty' } }
export const ReleasedUploads: Story = { args: { stage: 'ingested' } }
