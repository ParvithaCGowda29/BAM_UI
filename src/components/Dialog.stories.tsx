import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Dialog } from './ui'

// Dialog: native modal <dialog>; focus returns to the trigger when it closes.
const meta = {
  title: 'Components/Dialog',
  tags: ['autodocs'],
  component: Dialog,
  args: {
    open: true, title: 'SOW passage', onClose: fn(),
    children: <p>Requirement 4 · Cost each PCBA from the BOM and the machine hour rates, then route the quote for approval.</p>,
    footer: <button className="btn btn-secondary">Close</button>,
  },
  argTypes: { open: { control: 'boolean' }, children: { control: false }, footer: { control: false } },
} satisfies Meta<typeof Dialog>
export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Wide: Story = { args: { className: 'dialog wide', title: 'Upload details' } }
