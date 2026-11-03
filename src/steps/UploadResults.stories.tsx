import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { setUi } from '../lib/store'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadResults } from './UploadPanes'

// Upload's right pane: the objective, File / Type / Conf. table, failed rows last, source lanes and quota.
const OBJECTIVE = 'Prepare a costed quote for the Meridian RFQ: parts list, packaging spec and payment terms, ready for commercial sign-off.'
const FAILED: UploadRecord[] = [
  { id: 'f1', batchId: 'batch-1', name: 'Supplier_Quotes_2025.zip', size: 18_400_000, status: 'stored', uploadedAt: '2026-10-21T09:13:00.000Z', objectKey: 'quarantine/rfq-2026-0147/Supplier_Quotes_2025.zip',
    parts: 2, scan: 'blocked', released: false, clamavVerdict: 'threat', threat: 'Macro in an embedded document' },
  { id: 'f2', batchId: 'batch-1', name: 'Drawing_Notes.docx', size: 154_000, status: 'stored', uploadedAt: '2026-10-21T09:13:30.000Z', objectKey: 'quarantine/rfq-2026-0147/Drawing_Notes.docx',
    parts: 1, scan: 'scanning', released: false, scanError: 'The check timed out' },
]
const REFUSED = [
  { name: 'CAD_Viewer_Setup.exe', reason: 'Unsupported type (.exe)', at: '2026-10-21T09:10:00.000Z' },
  { name: 'RFQ_Package_Meridian.pdf', reason: 'Skipped - duplicate', at: '2026-10-21T09:11:00.000Z' },
]

function Results({ stage, objective, failures }: { stage: SeedStage; objective: string; failures: boolean }) {
  // The objective and the refused files live in the shared UI store; each story sets both.
  useEffect(() => { setUi({ fdeGoals: objective, rejected: failures ? REFUSED : [] }) }, [objective, failures])
  return <AtStage stage={stage}>{({ snap }) => <UploadResults snap={failures ? { ...snap, uploads: [...snap.uploads, ...FAILED] } : snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/UploadResults',
  tags: ['autodocs'],
  component: Results,
  args: { stage: 'verified', objective: OBJECTIVE, failures: false },
  argTypes: {
    ...stageArg,
    objective: { control: 'text', description: 'Intake objective captured from the conversation' },
    failures: { control: 'boolean', description: 'Add files that failed or were skipped' },
  },
} satisfies Meta<typeof Results>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { stage: 'empty', objective: '' } }
export const Checking: Story = { args: { stage: 'scanning' } }
export const Ready: Story = {}
export const WithFailures: Story = { args: { failures: true } }
