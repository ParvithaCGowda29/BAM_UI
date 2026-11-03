import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { SkillReview } from './Review'

// Skill review (one skill: contract, generated code diff and findings, read-only), against the example backend at a workflow stage.
function Review({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <SkillReview snap={snap} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Skill review',
  tags: ['autodocs'],
  component: Review,
  args: { stage: 'grid' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Review>
export default meta
type Story = StoryObj<typeof meta>

export const Extracted: Story = { args: { stage: 'grid' } }
export const Generated: Story = { args: { stage: 'contract' } }
export const Tested: Story = { args: { stage: 'tested' } }
