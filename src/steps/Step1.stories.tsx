import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { Center } from './Step1'

// Scope (SOW review and FDE approval) against the example backend at a workflow stage.
function Scope({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <Center snap={snap} info={stepInfo(snap, 1)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Scope',
  tags: ['autodocs'],
  component: Scope,
  args: { stage: 'sow' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Scope>
export default meta
type Story = StoryObj<typeof meta>

export const NoUploads: Story = { args: { stage: 'empty' } }
export const ReadyToGenerate: Story = { args: { stage: 'ingested' } }
export const Draft: Story = { args: { stage: 'sow' } }
export const Approved: Story = { args: { stage: 'grid' } }
