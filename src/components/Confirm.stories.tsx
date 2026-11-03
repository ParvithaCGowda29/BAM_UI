import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Confirm } from './ui'

// Confirm: a dialog that lists explicit consequences before an irreversible-feeling action.
const meta = {
  title: 'Components/Confirm',
  tags: ['autodocs'],
  component: Confirm,
  args: {
    open: true, title: 'Generate contract and run checks?', confirmLabel: 'Start', onConfirm: fn(), onClose: fn(),
    consequences: ['The grid is marked reviewed for this version', 'The ISATVON contract is generated for 6 skills', 'Template opens and runs checks A–D'],
  },
  argTypes: { open: { control: 'boolean' }, consequences: { control: 'object' }, children: { control: false } },
} satisfies Meta<typeof Confirm>
export default meta
type Story = StoryObj<typeof meta>

export const GenerateContract: Story = {}
export const GoLive: Story = {
  args: { title: 'Go live?', confirmLabel: 'Approve', consequences: ['Commit manifest v1.0.3 to BAM_db (frozen)', 'Deploy to Staging once the save is confirmed', 'Staging is not production'] },
}
