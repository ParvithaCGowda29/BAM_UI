import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { IsatvonField, SkillRow } from '../api/types'
import { SkillGrid } from './Step2'

// The Grid step's AG Grid (Agent › Skill rows, the seven ISATVON columns). Stories are read-only: in the app an edit
// is saved through the backend adapter, which a story does not call. A blocked edit fires onLockedEdit instead.
type Fields = Record<IsatvonField, string>
const skill = (id: string, agent: string, name: string, f: Fields, edits: Partial<Fields> = {}, errors: SkillRow['errors'] = {}): SkillRow => ({
  id, agent, name, passageId: `req-${id}`, passageExcerpt: f.instructions, status: 'PARSED',
  original: f, fields: { ...f, ...edits }, errors,
})
const ROWS: SkillRow[] = [
  skill('s1', 'Quote intake', 'Parse RFQ package', {
    instructions: 'Read the RFQ package and list every requested part with quantity and due date.', sourceData: 's3://bam-intake/rfq-2026-0147/RFQ_Package.pdf',
    automation: 'UNSTRUCTURED_TO_SOW_LLM', techStack: 'FastMCP, PostgreSQL', variables: 'currency: USD; max_parts: 200', outcome: 'PartList JSON', notifications: 'Notify estimator on completion',
  }),
  skill('s2', 'Quote intake', 'Extract drawing tolerances', {
    instructions: 'Extract tolerances from each STEP drawing.', sourceData: 's3://bam-intake/rfq-2026-0147/drawings/',
    automation: 'CAD_STEP_TOLERANCE_EXTRACTOR', techStack: 'OpenCascade, FastMCP', variables: 'units: mm', outcome: 'ToleranceTable JSON', notifications: 'Flag tolerances under 0.01 mm',
  }, { variables: 'units: mm; min_tolerance: 0.01' }),
  skill('s3', 'Quote intake', 'Classify materials', {
    instructions: 'Map each part to a material grade from the materials master.', sourceData: 'Materials master (EXAMPLE)',
    automation: 'DYNAMIC_CONTEXT_VERIFIER', techStack: 'Cognee, PostgreSQL', variables: 'master_version: v3', outcome: 'MaterialMap JSON', notifications: 'None',
  }),
  skill('s4', 'Costing', 'Estimate PCBA cost', {
    instructions: 'Cost each PCBA from the BOM and the machine hour rates.', sourceData: 'BOM.xlsx; Machine hour rates (EXAMPLE)',
    automation: 'PCBA_COSTING_ENGINE', techStack: 'Python, PostgreSQL', variables: 'margin: 0.18', outcome: 'CostBreakdown JSON', notifications: 'Notify commercial manager',
  }, {}, { variables: 'margin must be between 0 and 1 and named in the SOW' }),
  skill('s5', 'Costing', 'Route for approval', {
    instructions: 'Send the quote to the commercial manager for sign-off.', sourceData: 'CostBreakdown JSON',
    automation: 'HITL_APPROVAL', techStack: 'FastMCP, Apache Superset', variables: 'approver: commercial_manager', outcome: 'QuoteApprovalRecord JSON', notifications: 'Webhook on approval',
  }),
  skill('s6', 'Costing', 'Generate quote PDF', {
    instructions: 'Render the approved quote as a PDF.', sourceData: 'QuoteApprovalRecord JSON',
    automation: 'JSON_TO_PYTHON_JINJA2', techStack: 'Jinja2, WeasyPrint', variables: 'template: quote_v2', outcome: 'Quote PDF', notifications: 'Email the customer contact',
  }),
]

/** The grid edits its own copy of the rows, so the story keeps them in state like the Grid step does. The flex column
 * gives .grid-wrap a definite height, as the Grid pane does in the app. */
function Stateful(args: React.ComponentProps<typeof SkillGrid>) {
  const [rows, setRows] = useState(args.rows)
  return <div style={{ height: 560, display: 'flex', flexDirection: 'column' }}><SkillGrid {...args} rows={rows} setRows={setRows} /></div>
}

const meta = {
  title: 'Workbench/SkillGrid',
  tags: ['autodocs'],
  component: SkillGrid,
  render: args => <Stateful {...args} />,
  args: { rows: ROWS, setRows: fn(), editable: false, showChanges: true, onLockedEdit: fn() },
  argTypes: {
    showChanges: { control: 'boolean', description: 'Colour edited cells against the extracted value' },
    editable: { control: false, description: 'Read-only in stories: edits save through the backend adapter' },
    rows: { control: false },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SkillGrid>
export default meta
type Story = StoryObj<typeof meta>

export const WithChanges: Story = {}
export const Plain: Story = { args: { showChanges: false } }
export const SingleAgent: Story = { args: { rows: ROWS.filter(r => r.agent === 'Costing') } }
