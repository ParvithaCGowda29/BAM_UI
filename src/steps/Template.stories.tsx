import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { TemplateCenter } from './Step3'

// Template (check activities and manifest.json), against the example backend at a workflow stage.
function Template({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <TemplateCenter snap={snap} info={stepInfo(snap, 3)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Template',
  tags: ['autodocs'],
  component: Template,
  args: { stage: 'gridReviewed' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Template>
export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = { args: { stage: 'gridReviewed' } }
export const NeedsReview: Story = { args: { stage: 'contract' } }
