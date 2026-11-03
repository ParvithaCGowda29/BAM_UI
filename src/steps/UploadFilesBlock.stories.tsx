import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadFilesBlock } from './UploadPanes'

// Upload's left-pane entry point: + Add files (Choose folder · Bulk upload · Upload zip) and the accepted types.
function Block({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <div style={{ maxWidth: 320 }}><UploadFilesBlock snap={snap} /></div>}</AtStage>
}

const meta = {
  title: 'Ingestion/UploadFilesBlock',
  tags: ['autodocs'],
  component: Block,
  args: { stage: 'empty' },
  argTypes: stageArg,
} satisfies Meta<typeof Block>
export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const ClosedAfterSowApproval: Story = { args: { stage: 'grid' } }
