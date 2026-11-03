import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { TestCenter } from './Step4'

// Check (validation results and evidence for the current artifact), against the example backend at a workflow stage.
function Check({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <TestCenter snap={snap} info={stepInfo(snap, 4)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Check',
  tags: ['autodocs'],
  component: Check,
  args: { stage: 'approved' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Check>
export default meta
type Story = StoryObj<typeof meta>

export const NoRun: Story = { args: { stage: 'approved' } }
export const Passed: Story = { args: { stage: 'tested' } }
export const Certified: Story = { args: { stage: 'reviewed' } }
