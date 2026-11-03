import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Snapshot, UploadRecord } from '../api/types'
import { setUi } from '../lib/store'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadMessages, uploadSummary, useUploadRows } from './UploadPanes'

// The assistant's Upload messages, written from the live upload state (Empty, uploads finishing, uploaded). The finished
// summary is a thread message in the app (posted once per change), shown here as that bubble.
const FAILED: UploadRecord = {
  id: 'f1', batchId: 'batch-1', name: 'Supplier_Quotes_2025.zip', size: 18_400_000, status: 'stored', uploadedAt: '2026-10-21T09:13:00.000Z',
  objectKey: 'quarantine/rfq-2026-0147/Supplier_Quotes_2025.zip', parts: 2, scan: 'blocked', released: false, clamavVerdict: 'threat', threat: 'Macro in an embedded document',
}

function Messages({ stage, objective, failures }: { stage: SeedStage; objective: string; failures: boolean }) {
  useEffect(() => { setUi({ fdeGoals: objective, rejected: [] }) }, [objective])
  return <AtStage stage={stage}>{({ snap }) => <Thread snap={failures ? { ...snap, uploads: [...snap.uploads, FAILED] } : snap} />}</AtStage>
}
function Thread({ snap }: { snap: Snapshot }) {
  const s = uploadSummary(useUploadRows(snap), 0, !snap.ingestion), summary = s && [s.text, s.live].filter(Boolean).join(' ')
  return <div className="as-thread">{summary && <div className="as-msg as-bot">{summary}</div>}<UploadMessages snap={snap} /></div>
}

const meta = {
  title: 'Ingestion/UploadMessages',
  tags: ['autodocs'],
  component: Messages,
  args: { stage: 'verified', objective: '', failures: false },
  argTypes: {
    ...stageArg,
    objective: { control: 'text', description: 'Intake objective; while empty, the assistant asks for it' },
    failures: { control: 'boolean', description: 'Add a file that could not be added' },
  },
} satisfies Meta<typeof Messages>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { stage: 'empty' } }
export const UploadsFinishing: Story = { args: { stage: 'scanning' } }
export const UploadsFinishingWithObjective: Story = { args: { stage: 'scanning', objective: 'Prepare a costed quote for the Meridian RFQ.' } }
export const Uploaded: Story = {}
export const UploadedWithFailure: Story = { args: { failures: true } }
