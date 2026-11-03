import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PaneFrame } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { SchemasView } from './RagSeamless'

// Schema: drafts proposed from the context graph, one open at a time. While the shared context run (started once for
// the preview, about 10 s) is still building, the screen shows that it is waiting for the proposals.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Schema',
  tags: ['autodocs'],
  component: SchemasView,
  decorators: [Story => <ContextRun><PaneFrame height={700}><Story /></PaneFrame></ContextRun>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SchemasView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
