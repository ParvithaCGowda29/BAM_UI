import type { Meta, StoryObj } from '@storybook/react-vite'
import { Time } from './ui'

// Time: a short local timestamp; the full date, time and timezone are in the tooltip.
const now = new Date()
const earlier = new Date(now.getTime() - 3 * 86_400_000)

const meta = {
  title: 'Components/Time',
  tags: ['autodocs'],
  component: Time,
  args: { iso: now.toISOString() },
  argTypes: { iso: { control: 'text' }, prefix: { control: 'text' } },
} satisfies Meta<typeof Time>
export default meta
type Story = StoryObj<typeof meta>

export const Today: Story = {}
export const EarlierDay: Story = { args: { iso: earlier.toISOString() } }
export const WithPrefix: Story = { args: { prefix: 'Approved ' } }
export const Missing: Story = { args: { iso: undefined } }
