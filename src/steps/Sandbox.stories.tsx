import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { SandboxCenter } from './Step4'

// Sandbox (the isolated validation environment), against the example backend at a workflow stage.
function Sandbox({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <SandboxCenter snap={snap} info={stepInfo(snap, 4)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Sandbox',
  tags: ['autodocs'],
  component: Sandbox,
  args: { stage: 'contract' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Sandbox>
export default meta
type Story = StoryObj<typeof meta>

export const Locked: Story = { args: { stage: 'contract' } }
export const NotStarted: Story = { args: { stage: 'approved' } }
export const Finished: Story = { args: { stage: 'tested' } }
