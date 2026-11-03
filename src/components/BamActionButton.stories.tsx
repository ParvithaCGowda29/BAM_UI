import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BamActionButton } from './ui'

// BamActionButton: the glass main-action button (FDE blue / Staging orange) with idle, loading and success labels.
const meta = {
  title: 'Components/BamActionButton',
  tags: ['autodocs'],
  component: BamActionButton,
  args: { action: 'approve', children: 'Approve', onClick: fn() },
  argTypes: {
    action: { control: 'select', options: ['ingest', 'generate', 'validate', 'deploy', 'approve', 'save', 'review', 'commit'] },
    status: { control: 'inline-radio', options: [undefined, 'idle', 'loading', 'success'], description: 'Controlled display state' },
    blocked: { control: 'boolean' },
    busy: { control: 'boolean' },
    successKey: { control: false },
  },
} satisfies Meta<typeof BamActionButton>
export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}
export const Loading: Story = { args: { status: 'loading' } }
export const Success: Story = { args: { status: 'success' } }
export const Blocked: Story = { args: { blocked: true } }
export const Ingest: Story = { args: { action: 'ingest', children: 'Start ingestion' } }
export const Commit: Story = { args: { action: 'commit', children: 'Commit to BAM_db' } }
export const Deploy: Story = { args: { action: 'deploy', children: 'Deploy to Staging' } }
