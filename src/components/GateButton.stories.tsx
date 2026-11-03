import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { GateButton } from './ui'

// GateButton: every gated action in the app. A disabled gate always shows its reason; `action` renders the glass
// BamActionButton (FDE blue / Staging orange) with its loading and success labels.
const meta = {
  title: 'Components/GateButton',
  tags: ['autodocs'],
  component: GateButton,
  args: { children: 'Start', onClick: fn(), variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
    action: { control: 'select', options: [undefined, 'ingest', 'generate', 'validate', 'deploy', 'approve', 'save', 'review', 'commit'] },
    icon: { control: 'text' },
    reason: { control: 'text', description: 'Disabled reason, shown under the button' },
    busy: { control: 'boolean' },
    tip: { control: 'text', description: 'Hover / focus tooltip' },
  },
} satisfies Meta<typeof GateButton>
export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', icon: 'edit', children: 'Edit' } }
export const Danger: Story = { args: { variant: 'danger', icon: 'x', children: 'Remove' } }
export const WithTooltip: Story = { args: { tip: 'Starts the sandbox run for this manifest.' } }
export const Disabled: Story = { args: { reason: 'Approve the SOW first' } }
export const Busy: Story = { args: { busy: true, children: 'Running' } }
export const Action: Story = { args: { action: 'approve', children: 'Approve' } }
export const ActionDisabled: Story = { args: { action: 'approve', children: 'Approve', reason: 'Saving your edits first' } }
export const ActionBusy: Story = { args: { action: 'deploy', children: 'Deploy to Staging', busy: true } }
