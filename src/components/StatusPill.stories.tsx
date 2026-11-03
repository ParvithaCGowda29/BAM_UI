import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusPill } from './ui'

// StatusPill: status is always icon plus text, never colour alone.
const STATUSES = ['unknown', 'queued', 'running', 'succeeded', 'failed', 'skipped', 'locked', 'active', 'needs_review', 'done', 'pass', 'fail', 'stale', 'pending', 'unavailable'] as const

const meta = {
  title: 'Components/StatusPill',
  tags: ['autodocs'],
  component: StatusPill,
  args: { status: 'succeeded' },
  argTypes: {
    status: { control: 'select', options: STATUSES },
    text: { control: 'text', description: 'Overrides the default label' },
  },
} satisfies Meta<typeof StatusPill>
export default meta
type Story = StoryObj<typeof meta>

export const Succeeded: Story = {}
export const Running: Story = { args: { status: 'running' } }
export const Failed: Story = { args: { status: 'failed' } }
export const NeedsReview: Story = { args: { status: 'needs_review' } }
export const Locked: Story = { args: { status: 'locked' } }
export const Stale: Story = { args: { status: 'stale' } }
export const CustomText: Story = { args: { status: 'done', text: 'Approved v3' } }
export const AllStatuses: Story = {
  render: () => <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>{STATUSES.map(s => <StatusPill key={s} status={s} />)}</div>,
}
