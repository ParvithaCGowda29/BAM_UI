import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ReviewEditor } from './Step3'

// The code / manifest editor used in Translate and Template: an inline diff against the generated version, or plain.
const generated = `"""Estimate PCBA cost (Agent: Costing)."""
VARIABLES = {
    "margin": 0.18,
    "currency": "USD",
}


def run(bom, rates):
    total = sum(line["qty"] * line["unit_cost"] for line in bom)
    hours = sum(rates[step] for step in ("smt", "tht", "test"))
    return {"material": total, "labour_hours": hours, "price": total * (1 + VARIABLES["margin"])}
`
const edited = generated.replace('"margin": 0.18', '"margin": 0.22').replace('"currency": "USD",', '"currency": "USD",\n    "round_to": 2,')
const manifest = JSON.stringify({ version: 'v1.3.0', agent: 'Costing', skills: [{ name: 'Estimate PCBA cost', file: 'skills/estimate_pcba_cost.py' }, { name: 'Route for approval', file: 'skills/route_for_approval.py' }] }, null, 2)

const meta = {
  title: 'Workbench/ReviewEditor',
  tags: ['autodocs'],
  component: ReviewEditor,
  decorators: [Story => <div style={{ height: 360 }}><Story /></div>],
  args: {
    path: 'skills/estimate_pcba_cost.py', language: 'python', original: generated, value: edited, editable: true,
    lockedReason: 'Approved: reopen Translate to edit', showChanges: true, onChange: fn(), onSave: fn(),
  },
  argTypes: {
    language: { control: 'inline-radio', options: ['python', 'json'] },
    showChanges: { control: 'boolean', description: 'Inline diff against the generated version' },
    editable: { control: 'boolean' },
    original: { control: 'text' }, value: { control: 'text' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ReviewEditor>
export default meta
type Story = StoryObj<typeof meta>

export const WithChanges: Story = {}
export const Plain: Story = { args: { showChanges: false } }
export const ReadOnly: Story = { args: { editable: false, showChanges: false, value: generated } }
export const Manifest: Story = { args: { path: 'manifest.json', language: 'json', original: manifest, value: manifest.replace('v1.3.0', 'v1.3.1') } }
