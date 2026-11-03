import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoTag } from './release'

// DemoTag: marks evidence produced by the mock backend in this build ("simulated").
const meta = {
  title: 'Components/DemoTag',
  tags: ['autodocs'],
  component: DemoTag,
  args: {},
} satisfies Meta<typeof DemoTag>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
