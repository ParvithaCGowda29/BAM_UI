import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadDropZone } from './UploadPanes'

// The middle pane's drop zone ("Release to add files" while files are dragged over the window). Click opens the picker.
function Zone({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <div className="up-mid"><UploadDropZone snap={snap} /></div>}</AtStage>
}

const meta = {
  title: 'Ingestion/UploadDropZone',
  tags: ['autodocs'],
  component: Zone,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Zone>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ClosedAfterSowApproval: Story = { args: { stage: 'grid' } }
