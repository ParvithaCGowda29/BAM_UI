import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tip } from './ui'

// Tip: hover (300 ms) or keyboard focus shows what a control does; `note` is the second line (why it is disabled).
const meta = {
  title: 'Components/Tip',
  tags: ['autodocs'],
  component: Tip,
  args: { text: 'Starts the sandbox run for this manifest.', children: <button className="btn btn-primary">Start</button> },
  argTypes: { text: { control: 'text' }, note: { control: 'text' }, children: { control: false } },
  decorators: [Story => <div style={{ padding: '72px 0 0 240px' }}><Story /></div>],
} satisfies Meta<typeof Tip>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithNote: Story = {
  args: { text: 'Approves the manifest for this hash.', note: 'Approve the Template first', children: <button className="btn btn-primary" aria-disabled>Approve</button> },
}
