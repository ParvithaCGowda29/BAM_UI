import type { Meta, StoryObj } from '@storybook/react-vite'
import { TopBar } from './shell'

// TopBar: wordmark, breadcrumb, backend sync status, FDE/Staging switch, theme, settings and the profile menu.
const meta = {
  title: 'Shell/TopBar',
  tags: ['autodocs'],
  component: TopBar,
  args: { syncedAt: Date.now(), offline: false },
  argTypes: { syncedAt: { control: 'date' }, offline: { control: 'boolean' }, snap: { control: false } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopBar>
export default meta
type Story = StoryObj<typeof meta>

export const Synced: Story = {}
export const BackendUnreachable: Story = { args: { offline: true, syncedAt: Date.now() - 4 * 60_000 } }
export const NotYetSynced: Story = { args: { syncedAt: 0 } }
