import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineDiff } from './release'

// LineDiff: read-only line diff of two texts with + / − / ~ markers (colour is never the only cue).
const base = JSON.stringify({
  version: '1.0.2', agent: 'Quote intake',
  skills: [{ name: 'Parse RFQ package', automation: 'UNSTRUCTURED_TO_SOW_LLM' }, { name: 'Estimate PCBA cost', variables: { margin: 0.18 } }],
}, null, 2)
const current = JSON.stringify({
  version: '1.0.3', agent: 'Quote intake',
  skills: [{ name: 'Parse RFQ package', automation: 'UNSTRUCTURED_TO_SOW_LLM' }, { name: 'Estimate PCBA cost', variables: { margin: 0.2 } }, { name: 'Route for approval', automation: 'HITL_APPROVAL' }],
}, null, 2)

const meta = {
  title: 'Components/LineDiff',
  tags: ['autodocs'],
  component: LineDiff,
  args: { base, current, context: 2 },
  argTypes: { base: { control: 'text' }, current: { control: 'text' }, context: { control: { type: 'number', min: 0, max: 10 } } },
} satisfies Meta<typeof LineDiff>
export default meta
type Story = StoryObj<typeof meta>

export const ManifestChange: Story = {}
export const Identical: Story = { args: { current: base } }
export const FullContext: Story = { args: { context: 20 } }
