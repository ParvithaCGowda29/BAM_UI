import type { Meta, StoryObj } from '@storybook/react-vite'
import { Section, StatusPill } from './ui'

// Section: a titled block with an optional aside in its header.
const meta = {
  title: 'Components/Section',
  tags: ['autodocs'],
  component: Section,
  args: { title: 'Source documents', children: <ul className="sm"><li>RFQ_Package_Meridian.pdf</li><li>BOM_rev_C.xlsx</li><li>Terms_and_Conditions.pdf</li></ul> },
  argTypes: { children: { control: false }, aside: { control: false } },
} satisfies Meta<typeof Section>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithAside: Story = { args: { aside: <StatusPill status="done" text="3 ready" /> } }
