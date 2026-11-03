import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { AtStage } from '../storybook/backend'
import { ScanTable } from './IngestionFlow'

// ScanTable: the uploaded-files table. `fde` shows the FDE's readiness view; without it, the internal per-file scan
// table (diagnostics). Row actions run through the example backend, so they are shown but have no effect here.
const up = (id: string, name: string, size: number, o: Partial<UploadRecord> = {}): UploadRecord => ({
  id, batchId: 'batch-1', name, size, status: 'stored', uploadedAt: '2026-10-21T09:12:00.000Z', objectKey: `quarantine/rfq-2026-0147/${name}`,
  parts: Math.max(1, Math.ceil(size / 10_485_760)), scan: 'verified', released: true, clamavVerdict: 'clean', repelVerdict: 'clean', ...o,
})
const MIXED = [
  up('u1', 'RFQ_Package_Meridian.pdf', 2_480_000),
  up('u2', 'BOM_RevC.xlsx', 386_000),
  up('u3', 'Terms_and_Conditions.pdf', 912_000, { scan: 'scanning', released: false, clamavVerdict: 'pending', repelVerdict: 'pending' }),
  up('u4', 'Supplier_Quotes_2025.zip', 18_400_000, { scan: 'blocked', released: false, clamavVerdict: 'threat', threat: 'Macro in an embedded document' }),
  up('u5', 'Drawing_Notes.docx', 154_000, { scan: 'scanning', released: false, scanError: 'The check timed out' }),
]
const CLEAN = MIXED.slice(0, 2)

function Table(props: React.ComponentProps<typeof ScanTable>) {
  return <AtStage stage="empty">{() => <ScanTable {...props} />}</AtStage>
}

const meta = {
  title: 'Ingestion/ScanTable',
  tags: ['autodocs'],
  component: Table,
  args: { uploads: MIXED, editable: true, fde: true },
  argTypes: {
    uploads: { control: false },
    editable: { control: 'boolean', description: 'Off once the SOW is approved: no row actions' },
    fde: { control: false, description: 'FDE readiness view instead of the internal scan table (one per story)' },
  },
} satisfies Meta<typeof Table>
export default meta
type Story = StoryObj<typeof meta>

export const FdeView: Story = {}
export const FdeAllReady: Story = { args: { uploads: CLEAN } }
export const FdeReadOnly: Story = { args: { editable: false } }
export const ScanDiagnostics: Story = { args: { fde: false } }
export const ScanDiagnosticsReadOnly: Story = { args: { fde: false, editable: false } }
