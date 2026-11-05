import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReadonlySow } from './sow'

// ReadonlySow: the approved SOW rendered read-only; `highlight` marks and scrolls to one requirement passage.
const req = (n: number, title: string, lines: [string, string][]) =>
  `<h2 data-passage="req-${n}">Requirement ${n}</h2><p><strong>${title}</strong></p><ul>${lines.map(([k, v]) => `<li><p><strong>${k}:</strong> ${v}</p></li>`).join('')}</ul>`

const SOW_HTML = [
  '<p>This Statement of Work covers the RFQ-2026-0147 quote automation for Meridian Industrial.</p>',
  req(1, 'Parse the RFQ package', [
    ['I — Instructions', 'Read the RFQ package and list every requested part with quantity and due date.'],
    ['S — Source data', 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf'],
    ['A — Automation', 'UNSTRUCTURED_TO_SOW_LLM'],
    ['T — Tech stack', 'Context Engine, PostgreSQL'],
    ['V — Variables', 'currency: USD; max_parts: 200'],
    ['O — Outcome', 'PartList JSON: part_no, qty, due_date'],
    ['N — Next', 'Notify the estimator when the part list is ready'],
  ]),
  req(2, 'Cost each PCBA', [
    ['I — Instructions', 'Cost each PCBA from the BOM and the machine hour rates.'],
    ['S — Source data', 'BOM_rev_C.xlsx; Machine hour rates master'],
    ['A — Automation', 'PCBA_COSTING_ENGINE'],
    ['T — Tech stack', 'Python, PostgreSQL'],
    ['V — Variables', 'margin: 0.18'],
    ['O — Outcome', 'CostBreakdown JSON'],
    ['N — Next', 'Route to the commercial manager for approval'],
  ]),
  '<h2>Approval</h2><p>Any material change to scope requires a change order and re-approval before implementation proceeds.</p>',
].join('')

const meta = {
  title: 'Components/ReadonlySow',
  tags: ['autodocs'],
  component: ReadonlySow,
  args: { html: SOW_HTML },
  argTypes: { html: { control: 'text' }, highlight: { control: 'select', options: [undefined, 'req-1', 'req-2'] } },
} satisfies Meta<typeof ReadonlySow>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const HighlightedRequirement: Story = { args: { highlight: 'req-2' } }
