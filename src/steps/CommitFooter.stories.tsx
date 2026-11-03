import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { CommitFooter } from './Step4'

// Commit's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <CommitFooter snap={snap} info={stepInfo(snap, 4)} />}</AtStage>
}

const meta = {
  title: 'Validation/Commit footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'tested' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NotCertified: Story = { args: { stage: 'tested' } }
export const ReadyToCommit: Story = { args: { stage: 'reviewed' } }
export const Committed: Story = { args: { stage: 'committed' } }
export const Deployed: Story = { args: { stage: 'deployed' } }
