import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { FileMark } from './IngestionFlow'

// FileMark: one upload's readiness as an icon (text for assistive tech and the tooltip). Never shows check internals.
const up = (o: Partial<UploadRecord> = {}): UploadRecord => ({
  id: 'u1', batchId: 'batch-1', name: 'RFQ_Package_Meridian.pdf', size: 2_480_000, status: 'stored', uploadedAt: '2026-10-21T09:12:00.000Z',
  objectKey: 'intake/rfq-2026-0147/RFQ_Package_Meridian.pdf', parts: 1, scan: 'verified', released: true, clamavVerdict: 'clean', repelVerdict: 'clean', ...o,
})

const meta = {
  title: 'Ingestion/FileMark',
  tags: ['autodocs'],
  component: FileMark,
  args: { u: up() },
  argTypes: { u: { control: false, description: 'The stored upload record' } },
} satisfies Meta<typeof FileMark>
export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {}
export const Checking: Story = { args: { u: up({ scan: 'scanning', released: false, clamavVerdict: 'pending', repelVerdict: 'pending' }) } }
export const CannotBeUsed: Story = { args: { u: up({ scan: 'blocked', released: false, clamavVerdict: 'threat', threat: 'Macro in an embedded document' }) } }
export const CheckDidNotFinish: Story = { args: { u: up({ scan: 'scanning', released: false, scanError: 'The check timed out' }) } }
export const UploadFailed: Story = { args: { u: up({ status: 'failed', error: 'Connection lost during upload', released: false }) } }
