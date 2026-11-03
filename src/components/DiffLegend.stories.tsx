import type { Meta, StoryObj } from '@storybook/react-vite'
import { DiffLegend } from './sow'

// DiffLegend: the change-colour key, the comparison baseline and an optional change count.
const meta = {
  title: 'Components/DiffLegend',
  tags: ['autodocs'],
  component: DiffLegend,
  args: { from: 'v2', to: 'v3' },
  argTypes: { from: { control: 'text' }, to: { control: 'text' }, counts: { control: 'object' } },
} satisfies Meta<typeof DiffLegend>
export default meta
type Story = StoryObj<typeof meta>

export const KeyOnly: Story = {}
export const WithChanges: Story = { args: { counts: { added: 2, removed: 1, modified: 3 } } }
export const NoChanges: Story = { args: { from: 'v3', to: 'unsaved edits', counts: { added: 0, removed: 0, modified: 0 } } }
