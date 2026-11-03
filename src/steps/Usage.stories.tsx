import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { UsagePage } from './Global'

// Usage & improvement: stage completion for this workflow and improvement notes (read-only).
function Usage({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <UsagePage snap={snap} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Global/Usage & improvement',
  tags: ['autodocs'],
  component: Usage,
  args: { stage: 'sow' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Usage>
export default meta
type Story = StoryObj<typeof meta>

export const NewWorkflow: Story = { args: { stage: 'empty' } }
export const SowInReview: Story = { args: { stage: 'sow' } }
export const Deployed: Story = { args: { stage: 'deployed' } }
