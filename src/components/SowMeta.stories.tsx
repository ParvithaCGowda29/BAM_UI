import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Sow } from '../api/types'
import { SowMeta } from './sow'

// SowMeta: SOW system metadata (ID, client, status, approval); never editable document text.
const at = new Date().toISOString()
const draft: Sow = {
  version: 2, generatedVersion: 1, html: '', generatedHtml: '', updatedAt: at, status: 'draft',
  meta: { sowId: 'SOW-2026-0147', client: 'Meridian Industrial', lengthMode: 'Standard', sources: 3 },
}

const meta = {
  title: 'Components/SowMeta',
  tags: ['autodocs'],
  component: SowMeta,
  args: { sow: draft },
  argTypes: { sow: { control: 'object' }, compact: { control: 'boolean' } },
} satisfies Meta<typeof SowMeta>
export default meta
type Story = StoryObj<typeof meta>

export const Draft: Story = {}
export const Approved: Story = { args: { sow: { ...draft, version: 3, status: 'approved', approval: { version: 3, at, by: 'fde@digibull.ai' } } } }
export const Regenerating: Story = { args: { sow: { ...draft, status: 'regenerating' } } }
export const Compact: Story = { args: { compact: true } }
