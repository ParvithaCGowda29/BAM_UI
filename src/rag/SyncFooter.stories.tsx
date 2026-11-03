import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ragPipeline } from './ragPipeline'
import { SyncFooter } from './RagSeamless'

// Sync's pinned footer: Start is gated on the context extraction of the shared context run (started once, about 10 s).
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Sync footer',
  tags: ['autodocs'],
  component: SyncFooter,
  decorators: [Story => <ContextRun><Story /></ContextRun>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SyncFooter>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
