import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { QualityFooter } from './RagSeamless'

// Verify's pinned footer: Start (the sample questions), then Approve once every answer passes. Start is available once
// the shared context run (started once for the preview, about 10 s) has built the graph.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}
function Footer({ stage }: { stage: SeedStage }) {
  return <ContextRun><AtStage stage={stage}>{({ snap }) => <QualityFooter snap={snap} />}</AtStage></ContextRun>
}

const meta = {
  title: 'Context/Verify footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'ingested' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { stage: 'ingested' } }
