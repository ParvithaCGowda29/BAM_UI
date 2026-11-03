import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ragPipeline } from './ragPipeline'
import { ReviewFooter } from './RagSeamless'

// Context readiness footer: Start (SOW generation) once all four readiness checks of the shared context run are ready.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Context readiness footer',
  tags: ['autodocs'],
  component: ReviewFooter,
  decorators: [Story => <ContextRun><Story /></ContextRun>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReviewFooter>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
