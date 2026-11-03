import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from './ui'

// Icon: the shared registry. 16px hand-drawn icons (16-unit grid) and Tabler outline icons under the `tb-` prefix.
const NAMES = ['check', 'x', 'shield', 'lock', 'alert', 'clock', 'upload', 'file', 'refresh', 'edit', 'db', 'copy', 'sparkle', 'rocket', 'doccheck', 'save', 'eye',
  'tb-inbox', 'tb-git-branch', 'tb-briefcase', 'tb-shield-check', 'tb-target', 'tb-table', 'tb-template', 'tb-code', 'tb-box', 'tb-list-check', 'tb-certificate', 'tb-database-import', 'tb-robot']

const meta = {
  title: 'Components/Icon',
  tags: ['autodocs'],
  component: Icon,
  args: { name: 'check', size: 16 },
  argTypes: {
    name: { control: 'select', options: NAMES },
    size: { control: { type: 'number', min: 10, max: 48 } },
    spin: { control: 'boolean' },
    stroke: { control: { type: 'number', min: 1, max: 3, step: 0.25 } },
    label: { control: 'text', description: 'Accessible name; without it the icon is hidden from screen readers' },
  },
} satisfies Meta<typeof Icon>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Tabler: Story = { args: { name: 'tb-briefcase', size: 24 } }
export const Spinning: Story = { args: { name: 'spinner', spin: true } }
export const Labelled: Story = { args: { name: 'lock', label: 'Locked' } }
export const Registry: Story = {
  render: args => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {NAMES.map(n => <span key={n} className="row sm" style={{ gap: 8 }}><Icon {...args} name={n} />{n}</span>)}
    </div>
  ),
}
