import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutoChip } from './ui'

// AutoChip: marks a step that runs on its own; "Automated" shows on hover or focus.
const meta = {
  title: 'Components/AutoChip',
  tags: ['autodocs'],
  component: AutoChip,
  args: {},
  argTypes: { className: { control: 'text' } },
  decorators: [Story => <div style={{ padding: '48px 0 0 120px' }}><Story /></div>],
} satisfies Meta<typeof AutoChip>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
