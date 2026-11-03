import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { TranslateFooter } from './Step3'

// Translate's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <TranslateFooter snap={snap} info={stepInfo(snap, 3)} />}</AtStage>
}

const meta = {
  title: 'Workbench/Translate footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'gridReviewed' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NoArtifact: Story = { args: { stage: 'gridReviewed' } }
export const WaitingForTemplate: Story = { args: { stage: 'contract' } }
export const Approved: Story = { args: { stage: 'approved' } }
