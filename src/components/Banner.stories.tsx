import type { Meta, StoryObj } from '@storybook/react-vite'
import { Banner } from './ui'

// Banner: an inline message in four tones; errors are alerts, the rest are status.
const meta = {
  title: 'Components/Banner',
  tags: ['autodocs'],
  component: Banner,
  args: { tone: 'info', icon: 'spinner', children: 'Generating the SOW from the extracted context. It appears here when generation finishes.' },
  argTypes: { tone: { control: 'inline-radio', options: ['info', 'warn', 'err', 'ok'] }, icon: { control: 'text' }, children: { control: 'text' }, action: { control: false } },
} satisfies Meta<typeof Banner>
export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}
export const Ok: Story = { args: { tone: 'ok', icon: 'check', children: 'Approved v3 at 11:24 AM by fde@digibull.ai. Approval is tied to this version.' } }
export const Warning: Story = { args: { tone: 'warn', icon: 'alert', children: 'Approval of v3 is still valid. Any edit creates a new version and invalidates it.' } }
export const ErrorTone: Story = { args: { tone: 'err', icon: 'alert', children: 'notes.txt: not a supported image. Use PNG, JPEG or WebP.' } }
export const WithAction: Story = { args: { tone: 'warn', icon: 'alert', children: 'This grid is read-only.', action: <button className="btn btn-secondary">Reopen Grid to edit</button> } }
