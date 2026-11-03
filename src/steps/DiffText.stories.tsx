import type { Meta, StoryObj } from '@storybook/react-vite'
import { DiffText } from './Step2'

// Word-level change colours used in the Grid's cell editor and row editor: added, removed and modified words.
const meta = {
  title: 'Workbench/DiffText',
  tags: ['autodocs'],
  component: DiffText,
  args: {
    segs: [
      { kind: 'same', text: 'units: ' }, { kind: 'removed', text: 'inch' }, { kind: 'added', text: 'mm' },
      { kind: 'same', text: '; ' }, { kind: 'added', text: 'min_tolerance: 0.01' },
    ],
  },
  argTypes: { segs: { control: 'object', description: 'Diff segments: same, added, removed or modified text' } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DiffText>
export default meta
type Story = StoryObj<typeof meta>

export const Mixed: Story = {}
export const Unchanged: Story = { args: { segs: [{ kind: 'same', text: 'Notify the commercial manager when the quote is approved.' }] } }
export const Added: Story = { args: { segs: [{ kind: 'same', text: 'approver: commercial_manager' }, { kind: 'added', text: '; escalate_after_hours: 24' }] } }
export const Removed: Story = { args: { segs: [{ kind: 'same', text: 'Read the RFQ package' }, { kind: 'removed', text: ' and every email attachment' }, { kind: 'same', text: '.' }] } }
export const Modified: Story = { args: { segs: [{ kind: 'same', text: 'margin: ' }, { kind: 'modified', text: '0.22' }] } }
