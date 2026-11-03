import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PaneFrame } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { SyncView } from './RagSeamless'

// Sync: Admin Masters, then the context extraction of the current run. The context run is one shared pipeline for the
// whole preview: it starts once (about 10 s), so the story shows the run in progress first and finished afterwards.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Sync',
  tags: ['autodocs'],
  component: SyncView,
  decorators: [Story => <ContextRun><PaneFrame height={700}><Story /></PaneFrame></ContextRun>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SyncView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
