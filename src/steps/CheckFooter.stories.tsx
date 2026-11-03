import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { CheckFooter } from './Step4'

// Check's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <CheckFooter snap={snap} info={stepInfo(snap, 4)} />}</AtStage>
}

const meta = {
  title: 'Validation/Check footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'approved' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const WaitingForSandbox: Story = { args: { stage: 'approved' } }
