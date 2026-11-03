import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { Center } from './Step2'

// Grid (Agent › Skill review with all seven ISATVON fields), against the example backend at a workflow stage.
function Grid({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <Center snap={snap} info={stepInfo(snap, 2)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Grid',
  tags: ['autodocs'],
  component: Grid,
  args: { stage: 'sow' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Grid>
export default meta
type Story = StoryObj<typeof meta>

export const NoSkills: Story = { args: { stage: 'sow' } }
export const NeedsReview: Story = { args: { stage: 'grid' } }
export const Reviewed: Story = { args: { stage: 'gridReviewed' } }
export const ReadOnly: Story = { args: { stage: 'contract' } }
