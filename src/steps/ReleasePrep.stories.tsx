import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { ReleasePrep } from './Review'

// Release prep (manifest version, release prerequisites and version history), against the example backend at a workflow stage.
function Release({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={760}><AtStage stage={stage}>{({ snap }) => <ReleasePrep snap={snap} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Workbench/Release prep',
  tags: ['autodocs'],
  component: Release,
  args: { stage: 'contract' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Release>
export default meta
type Story = StoryObj<typeof meta>

export const Draft: Story = { args: { stage: 'contract' } }
export const Committed: Story = { args: { stage: 'committed' } }
export const Deployed: Story = { args: { stage: 'deployed' } }
