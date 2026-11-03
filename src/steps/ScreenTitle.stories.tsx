import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from '../components/ui'
import { ScreenTitle } from './IngestionFlow'

// ScreenTitle: the title row of every Ingestion screen. The info icon opens the details dialog when `details` is set.
const meta = {
  title: 'Ingestion/ScreenTitle',
  tags: ['autodocs'],
  component: ScreenTitle,
  args: { title: 'Review accepted files', help: 'Close Ingestion before opening Context. This is not SOW approval.' },
  argTypes: {
    title: { control: 'text' },
    help: { control: 'text' },
    details: { control: false, description: 'Opens in a dialog from the info icon' },
    children: { control: false, description: 'Actions beside the details icon' },
  },
} satisfies Meta<typeof ScreenTitle>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithDetails: Story = {
  args: {
    title: 'Quarantine', help: 'Files held out of ingestion, with the reason.',
    details: <section className="dc-sec"><h3><Icon name="shield" size={14} />Security checks</h3><p className="muted sm">Both checks must pass. Held files never reach Context.</p></section>,
  },
}
export const WithAction: Story = {
  args: {
    title: 'Scan', help: 'Dual-engine virus scan per file',
    children: <button className="btn btn-outline"><Icon name="refresh" />Retry failed</button>,
  },
}
