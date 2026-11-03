import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from '../components/ui'
import { ragPipeline } from './ragPipeline'
import { PipelineCard } from './RagScreens'

// The build pipeline card: the steps of the shared context run (started once for the preview, about 10 s).
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const scanDone = (
  <li className="pipe-step ps-d">
    <span className="pipe-icon"><Icon name="check" size={13} /><span className="sr-only">Done</span></span>
    <span className="pipe-label">Virus scan</span>
    <span className="pipe-detail">3 clean (Dual engines)</span>
  </li>
)

const meta = {
  title: 'Context/Build pipeline',
  tags: ['autodocs'],
  component: PipelineCard,
  decorators: [Story => <ContextRun><Story /></ContextRun>],
  args: { title: 'Build pipeline' },
  argTypes: {
    title: { control: 'text' },
    lead: { control: false, description: 'A gate row shown before the context steps' },
    controls: { control: false, description: 'Replaces the re-run controls' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PipelineCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithScanGate: Story = { args: { title: 'Hand-off to Context', lead: scanDone } }
export const CustomControls: Story = { args: { controls: <p className="muted xs">Re-runs start from Upload.</p> } }
