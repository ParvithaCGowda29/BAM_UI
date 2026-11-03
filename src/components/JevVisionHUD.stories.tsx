import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { JevVisionHUD } from './JevVisionHUD'

// JevVisionHUD: the context-sufficiency panel. When the judge service is not running, its scores are simulated and
// labelled so (never placeholder numbers).
const meta = {
  title: 'Components/JevVisionHUD',
  tags: ['autodocs'],
  component: JevVisionHUD,
  args: {
    mode: 'rag',
    sources: ['RFQ_Package_Meridian.pdf', 'BOM_rev_C.xlsx', 'Terms_and_Conditions.pdf'],
    facts: ['RFQ-2026-0147 requests 42 PCBA line items', 'Delivery within 4 weeks ARO', 'Payment terms Net 45'],
    entities: ['RFQ-2026-0147', 'Meridian Industrial', 'PCBA-7731', 'ASTM-D3951'],
    schemas: ['QuoteLine', 'CostBreakdown'],
    onReevaluated: fn(),
  },
  argTypes: { mode: { control: 'inline-radio', options: ['intake', 'rag', 'sow'] }, compact: { control: 'boolean' } },
} satisfies Meta<typeof JevVisionHUD>
export default meta
type Story = StoryObj<typeof meta>

export const Context: Story = {}
export const Intake: Story = { args: { mode: 'intake', compact: true, facts: [], entities: [], schemas: [] } }
export const Sow: Story = { args: { mode: 'sow' } }
