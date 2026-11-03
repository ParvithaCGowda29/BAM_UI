import type { Meta, StoryObj } from '@storybook/react-vite'
import { TrackerMenu } from './Tracker'

// TrackerMenu: the workflow progress icon; hover or focus opens the stage panel, a click pins it. Progress comes from
// the tracker store, which the app fills from workflow evidence (empty here, so every stage is "Not started").
const meta = {
  title: 'Tracker/TrackerMenu',
  tags: ['autodocs'],
  component: TrackerMenu,
  args: {},
  decorators: [Story => <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 520 }}><Story /></div>],
} satisfies Meta<typeof TrackerMenu>
export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Pinned: Story = {
  play: async ({ canvasElement }) => { canvasElement.querySelector<HTMLButtonElement>('.wf-icon')?.click() },
}
