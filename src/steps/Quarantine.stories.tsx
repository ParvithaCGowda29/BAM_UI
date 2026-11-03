import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { Quarantine } from './Ingestion'

// Quarantine: files held out of ingestion with the reason (internal diagnostics). Rescan only for a check that failed.
const up = (id: string, name: string, size: number, o: Partial<UploadRecord>): UploadRecord => ({
  id, batchId: 'batch-1', name, size, status: 'stored', uploadedAt: '2026-10-21T09:12:00.000Z', objectKey: `quarantine/rfq-2026-0147/${name}`,
  parts: 1, scan: 'verified', released: false, ...o,
})
const HELD = [
  up('q1', 'Supplier_Quotes_2025.zip', 18_400_000, { scan: 'blocked', clamavVerdict: 'threat', repelVerdict: 'clean', threat: 'Macro in an embedded document' }),
  up('q2', 'Vendor_Onboarding.docx', 312_000, { scan: 'blocked', clamavVerdict: 'clean', repelVerdict: 'threat', threat: 'Hidden instructions aimed at the assistant' }),
  up('q3', 'Drawing_Notes.docx', 154_000, { scan: 'scanning', scanError: 'The check timed out' }),
]

function Screen({ stage, held }: { stage: SeedStage; held: boolean }) {
  return <AtStage stage={stage}>{({ snap }) => <Quarantine snap={held ? { ...snap, uploads: [...snap.uploads, ...HELD] } : snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/Quarantine',
  tags: ['autodocs'],
  component: Screen,
  args: { stage: 'verified', held: true },
  argTypes: { ...stageArg, held: { control: 'boolean', description: 'Add held files and a failed check' } },
} satisfies Meta<typeof Screen>
export default meta
type Story = StoryObj<typeof meta>

export const NothingHeld: Story = { args: { held: false } }
export const HeldFiles: Story = {}
export const HeldReadOnly: Story = { args: { stage: 'grid' } }
