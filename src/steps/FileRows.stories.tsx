import type { Meta, StoryObj } from '@storybook/react-vite'
import type { UploadRecord } from '../api/types'
import { FileRows } from './IngestionFlow'

// FileRows: the compact file list (first 5 rows, then "N more files"), each with its readiness mark.
const up = (id: string, name: string, size: number, o: Partial<UploadRecord> = {}): UploadRecord => ({
  id, batchId: 'batch-1', name, size, status: 'stored', uploadedAt: '2026-10-21T09:12:00.000Z', objectKey: `intake/rfq-2026-0147/${name}`,
  parts: 1, scan: 'verified', released: true, clamavVerdict: 'clean', repelVerdict: 'clean', ...o,
})
const FILES = [
  up('u1', 'RFQ_Package_Meridian.pdf', 2_480_000),
  up('u2', 'BOM_RevC.xlsx', 386_000),
  up('u3', 'Terms_and_Conditions.pdf', 912_000, { scan: 'scanning', released: false, clamavVerdict: 'pending', repelVerdict: 'pending' }),
  up('u4', 'Supplier_Quotes_2025.zip', 18_400_000, { scan: 'blocked', released: false, clamavVerdict: 'threat', threat: 'Macro in an embedded document' }),
  up('u5', 'Packaging_Spec_ASTM_D3951.docx', 154_000),
  up('u6', 'Kickoff_Deck.pptx', 6_200_000),
  up('u7', 'Commercial_Notes.txt', 8_400),
  up('u8', 'Cost_Assumptions.xlsx', 211_000),
]

const meta = {
  title: 'Ingestion/FileRows',
  tags: ['autodocs'],
  component: FileRows,
  args: { files: FILES.slice(0, 4) },
  argTypes: { files: { control: false }, render: { control: false, description: 'Custom trailing cell; defaults to the readiness mark' } },
} satisfies Meta<typeof FileRows>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MoreThanFive: Story = { args: { files: FILES } }
export const CustomTrailingCell: Story = { args: { files: FILES.slice(0, 3), render: u => <span className="muted xs">{u.parts} part{u.parts === 1 ? '' : 's'}</span> } }
