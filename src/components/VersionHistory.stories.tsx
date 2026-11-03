import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { VersionHistory } from './release'

// VersionHistory: draft, certified, frozen and deployed manifest versions, newest first.
function History({ stage, limit }: { stage: SeedStage; limit?: number }) {
  return <AtStage stage={stage}>{({ snap }) => <VersionHistory snap={snap} limit={limit} />}</AtStage>
}

const meta = {
  title: 'Components/VersionHistory',
  tags: ['autodocs'],
  component: History,
  args: { stage: 'deployed' },
  argTypes: { ...stageArg, limit: { control: { type: 'number', min: 1, max: 10 } } },
} satisfies Meta<typeof History>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { stage: 'sow' } }
export const FirstDraft: Story = { args: { stage: 'contract' } }
export const Deployed: Story = {}
export const Limited: Story = { args: { limit: 2 } }
