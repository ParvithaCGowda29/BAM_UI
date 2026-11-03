import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { TemplateFooter } from './Step3'

// Template's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <TemplateFooter snap={snap} info={stepInfo(snap, 3)} />}</AtStage>
}

const meta = {
  title: 'Workbench/Template footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'sow' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const ScopeNotApproved: Story = { args: { stage: 'sow' } }
export const Ready: Story = { args: { stage: 'gridReviewed' } }
export const NeedsReview: Story = { args: { stage: 'contract' } }
