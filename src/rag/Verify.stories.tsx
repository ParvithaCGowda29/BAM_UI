import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PaneFrame } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { ContextQualityView } from './RagSeamless'

// Verify: the sample and asked context questions with their results, over the shared context run (started once).
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Verify',
  tags: ['autodocs'],
  component: ContextQualityView,
  decorators: [Story => <ContextRun><PaneFrame height={700}><Story /></PaneFrame></ContextRun>],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ContextQualityView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
