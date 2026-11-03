import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { CodeCenter } from './Step3'

// Translate (the translated skill code, editable, against the generated code), against the example backend at a workflow stage.
function Translate({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <CodeCenter snap={snap} info={stepInfo(snap, 3)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Translate',
  tags: ['autodocs'],
  component: Translate,
  args: { stage: 'gridReviewed' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Translate>
export default meta
type Story = StoryObj<typeof meta>

export const NoArtifact: Story = { args: { stage: 'gridReviewed' } }
export const NeedsReview: Story = { args: { stage: 'contract' } }
export const Approved: Story = { args: { stage: 'approved' } }
