import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy } from './ui'

// Copy: a long value shown ellipsized, the full value in a tooltip and a copy button.
const meta = {
  title: 'Components/Copy',
  tags: ['autodocs'],
  component: Copy,
  args: { value: 's3://bam-intake/rfq-2026-0147/RFQ_Package_Meridian.pdf', label: 'object path' },
  argTypes: { value: { control: 'text' }, display: { control: 'text' }, label: { control: 'text' } },
} satisfies Meta<typeof Copy>
export default meta
type Story = StoryObj<typeof meta>

export const ObjectPath: Story = {}
export const ManifestHash: Story = { args: { value: '9f2c41ab7d0e5c3318b6f0a2d4e97c15a3b8e6f1', display: '9f2c41ab7d0e…', label: 'manifest hash' } }
export const RunId: Story = { args: { value: 'run-2026-10-21-a', label: 'run ID' } }
