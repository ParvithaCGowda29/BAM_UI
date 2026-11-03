import type { Meta, StoryObj } from '@storybook/react-vite'
import { PanesContext, Pane, StatusPill } from './ui'

// Pane: a workspace pane with kicker, title, actions, body and pinned footer. Side panes inside the 3-pane grid collapse.
const meta = {
  title: 'Components/Pane',
  tags: ['autodocs'],
  component: Pane,
  args: {
    id: 'center-title', kicker: 'SOW review and FDE approval', title: 'Scope',
    children: <p>Requirement 1 · Parse the RFQ package and list every requested part with quantity and due date.</p>,
  },
  argTypes: { title: { control: 'text' }, kicker: { control: 'text' }, actions: { control: false }, footer: { control: false }, children: { control: false } },
  decorators: [Story => <div style={{ height: 320, display: 'flex' }}><Story /></div>],
} satisfies Meta<typeof Pane>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithActionsAndFooter: Story = {
  args: {
    actions: <StatusPill status="needs_review" text="Draft v2" />,
    footer: <><span className="muted sm">Updated 11:24 AM</span><button className="btn btn-primary">Approve</button></>,
  },
}
export const CollapsibleSide: Story = {
  args: { id: 'right-title', kicker: undefined, title: 'Evidence', children: <p className="muted sm">Certification checklist and version history.</p> },
  decorators: [Story => <PanesContext.Provider value><Story /></PanesContext.Provider>],
}
