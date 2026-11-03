import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { setUi } from '../lib/store'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { Intake } from './Intake'

// Intake: Upload (the FDE's results view) and Scan (internal diagnostics) over one uploader and batch.
const HELD: UploadRecord[] = [
  { id: 'h1', batchId: 'batch-1', name: 'Supplier_Quotes_2025.zip', size: 18_400_000, status: 'stored', uploadedAt: '2026-10-21T09:13:00.000Z', objectKey: 'quarantine/rfq-2026-0147/Supplier_Quotes_2025.zip',
    parts: 2, scan: 'blocked', released: false, clamavVerdict: 'threat', repelVerdict: 'clean', threat: 'Macro in an embedded document' },
  { id: 'h2', batchId: 'batch-1', name: 'Drawing_Notes.docx', size: 154_000, status: 'stored', uploadedAt: '2026-10-21T09:13:30.000Z', objectKey: 'quarantine/rfq-2026-0147/Drawing_Notes.docx',
    parts: 1, scan: 'scanning', released: false, scanError: 'The check timed out' },
]

function Screen({ stage, view, held }: { stage: SeedStage; view: 'upload' | 'scan'; held: boolean }) {
  useEffect(() => { setUi({ rejected: [], fdeGoals: '' }) }, [])
  return <AtStage stage={stage}>{({ snap }) => {
    const s = held ? { ...snap, uploads: [...snap.uploads, ...HELD] } : snap
    return <Intake snap={s} info={stepInfo(s, 1)} view={view} />
  }}</AtStage>
}

const meta = {
  title: 'Ingestion/Intake',
  tags: ['autodocs'],
  component: Screen,
  args: { stage: 'verified', view: 'upload', held: false },
  argTypes: {
    ...stageArg,
    view: { control: 'inline-radio', options: ['upload', 'scan'] },
    held: { control: 'boolean', description: 'Add a held file and a failed check' },
  },
} satisfies Meta<typeof Screen>
export default meta
type Story = StoryObj<typeof meta>

export const UploadEmpty: Story = { args: { stage: 'empty' } }
export const UploadReady: Story = {}
export const ScanNothingYet: Story = { args: { stage: 'empty', view: 'scan' } }
export const ScanInProgress: Story = { args: { stage: 'scanning', view: 'scan' } }
export const ScanAllClean: Story = { args: { stage: 'verified', view: 'scan' } }
export const ScanHeldAndRetry: Story = { args: { stage: 'verified', view: 'scan', held: true } }
