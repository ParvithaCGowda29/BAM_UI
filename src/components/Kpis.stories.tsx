import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kpis } from './ui'

// Kpis: stat tiles with live values; tone always pairs with the label text.
const meta = {
  title: 'Components/Kpis',
  tags: ['autodocs'],
  component: Kpis,
  args: {
    label: 'Verify results',
    items: [{ value: 6, label: 'Questions' }, { value: 5, label: 'Passed', tone: 'ok' }, { value: 1, label: 'Needs attention', tone: 'warn' }],
  },
} satisfies Meta<typeof Kpis>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AllPassed: Story = { args: { items: [{ value: 6, label: 'Questions' }, { value: 6, label: 'Passed', tone: 'ok' }, { value: 0, label: 'Needs attention' }] } }
export const WithErrors: Story = {
  args: { label: 'Check run', items: [{ value: 24, label: 'Assertions' }, { value: 21, label: 'Passed', tone: 'ok' }, { value: 3, label: 'Failed', tone: 'err' }] },
}
