import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorState, Icon } from './ui'

// ErrorState: the designed error state, announced as an alert.
const meta = {
  title: 'Components/ErrorState',
  tags: ['autodocs'],
  component: ErrorState,
  args: { title: 'Requirement extraction failed', children: 'The approved SOW has no Requirement blocks to extract.' },
  argTypes: { children: { control: 'text' }, action: { control: false } },
} satisfies Meta<typeof ErrorState>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithRetry: Story = { args: { title: 'SOW generation failed', children: 'The Context Engine did not answer in time.', action: <button className="btn btn-primary"><Icon name="refresh" />Retry SOW generation</button> } }
