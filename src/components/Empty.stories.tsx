import type { Meta, StoryObj } from '@storybook/react-vite'
import { Empty, Icon } from './ui'

// Empty: the designed empty state (icon, title, body, optional action).
const meta = {
  title: 'Components/Empty',
  tags: ['autodocs'],
  component: Empty,
  args: { icon: 'upload', title: 'No SOW yet', children: 'Upload documents in Ingestion. The SOW is generated here from the extracted context.' },
  argTypes: { icon: { control: 'text' }, children: { control: 'text' }, action: { control: false } },
} satisfies Meta<typeof Empty>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithAction: Story = { args: { action: <button className="btn btn-primary"><Icon name="upload" />Go to Upload</button> } }
export const TitleOnly: Story = { args: { icon: 'file', title: 'No manifest versions yet', children: undefined } }
