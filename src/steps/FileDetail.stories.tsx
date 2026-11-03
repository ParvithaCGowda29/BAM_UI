import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { FileDetail } from './Ingestion'

// FileDetail: stored files with one file's metadata and its (unavailable) parsed preview. Internal diagnostics screen.
const FAILED: UploadRecord = {
  id: 'u9', batchId: 'batch-1', name: 'Site_Survey_Photos.zip', size: 48_200_000, status: 'failed', error: 'Connection lost during upload (part 3 of 5)',
  uploadedAt: '2026-10-21T09:14:00.000Z', objectKey: 'quarantine/rfq-2026-0147/Site_Survey_Photos.zip', parts: 5, scan: 'scanning', released: false,
}

function Detail({ stage, failedUpload }: { stage: SeedStage; failedUpload: boolean }) {
  return <AtStage stage={stage}>{({ snap }) => <FileDetail snap={failedUpload ? { ...snap, uploads: [FAILED, ...snap.uploads] } : snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/FileDetail',
  tags: ['autodocs'],
  component: Detail,
  args: { stage: 'verified', failedUpload: false },
  argTypes: { ...stageArg, failedUpload: { control: 'boolean', description: 'Add a failed upload as the first (selected) file' } },
} satisfies Meta<typeof Detail>
export default meta
type Story = StoryObj<typeof meta>

export const NoFiles: Story = { args: { stage: 'empty' } }
export const StoredFile: Story = {}
export const FailedUpload: Story = { args: { failedUpload: true } }
