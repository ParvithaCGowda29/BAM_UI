import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { ActivitiesCenter } from './Step3'

// Validation activities (checks A–D with attempt history and findings), against the example backend at a workflow stage.
function Activities({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <ActivitiesCenter snap={snap} info={stepInfo(snap, 3)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Validation activities',
  tags: ['autodocs'],
  component: Activities,
  args: { stage: 'gridReviewed' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Activities>
export default meta
type Story = StoryObj<typeof meta>

export const NoRun: Story = { args: { stage: 'gridReviewed' } }
export const Finished: Story = { args: { stage: 'contract' } }
export const Approved: Story = { args: { stage: 'approved' } }
