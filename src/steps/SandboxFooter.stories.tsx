import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { SandboxFooter } from './Step4'

// Sandbox's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <SandboxFooter snap={snap} info={stepInfo(snap, 4)} />}</AtStage>
}

const meta = {
  title: 'Validation/Sandbox footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'contract' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NotApproved: Story = { args: { stage: 'contract' } }
export const Ready: Story = { args: { stage: 'approved' } }
export const Finished: Story = { args: { stage: 'tested' } }
