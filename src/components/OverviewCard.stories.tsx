import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { OverviewCard } from './ui'

// OverviewCard: one compact summary card with live counts and an optional link row.
const meta = {
  title: 'Components/OverviewCard',
  tags: ['autodocs'],
  component: OverviewCard,
  args: { icon: 'upload', title: 'Uploads', line: '3 files · 3.6 MB · all ready' },
  argTypes: { tone: { control: 'inline-radio', options: [undefined, 'ok', 'warn', 'err'] }, line: { control: 'text' }, link: { control: false } },
} satisfies Meta<typeof OverviewCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Ok: Story = { args: { icon: 'shield', title: 'Readiness', line: 'Every file is ready to ingest', tone: 'ok' } }
export const Warning: Story = {
  args: { icon: 'alert', title: 'Held for review', line: '1 file needs a person to accept it', tone: 'warn', link: { label: 'Drawing_Rev_B.png', action: 'Open Standardize', onClick: fn() } },
}
export const ErrorTone: Story = { args: { icon: 'x', title: 'Upload failed', line: 'Terms_and_Conditions.pdf did not finish uploading', tone: 'err' } }
