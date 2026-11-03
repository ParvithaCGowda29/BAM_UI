import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { StagingCenter } from './Step4'

// Staging complete (what is live on Staging), against the example backend at a workflow stage.
function StagingComplete({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <StagingCenter snap={snap} info={stepInfo(snap, 4)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Staging complete',
  tags: ['autodocs'],
  component: StagingComplete,
  args: { stage: 'committed' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StagingComplete>
export default meta
type Story = StoryObj<typeof meta>

export const NotDeployed: Story = { args: { stage: 'committed' } }
export const Deployed: Story = { args: { stage: 'deployed' } }
