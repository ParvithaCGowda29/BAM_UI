import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { HandoverCenter } from './Step4'

// Commit (save the certified artifact to BAM_db, then deploy it to Staging), against the example backend at a workflow stage.
function Commit({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <HandoverCenter snap={snap} info={stepInfo(snap, 4)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Commit',
  tags: ['autodocs'],
  component: Commit,
  args: { stage: 'tested' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Commit>
export default meta
type Story = StoryObj<typeof meta>

export const NotCertified: Story = { args: { stage: 'tested' } }
export const ReadyToCommit: Story = { args: { stage: 'reviewed' } }
export const Committed: Story = { args: { stage: 'committed' } }
export const Deployed: Story = { args: { stage: 'deployed' } }
