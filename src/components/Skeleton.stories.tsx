import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './ui'

// Skeleton: the loading state, announced to screen readers by its label.
const meta = {
  title: 'Components/Skeleton',
  tags: ['autodocs'],
  component: Skeleton,
  args: { rows: 4, label: 'Loading skills' },
  argTypes: { rows: { control: { type: 'number', min: 1, max: 12 } }, label: { control: 'text' } },
} satisfies Meta<typeof Skeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Long: Story = { args: { rows: 9, label: 'Generating SOW' } }
