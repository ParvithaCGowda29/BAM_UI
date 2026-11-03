import type { Meta, StoryObj } from '@storybook/react-vite'
import { TemplateReady } from './Step3'

// Template before any run: the four check activities that will write manifest.json.
const meta = {
  title: 'Workbench/TemplateReady',
  tags: ['autodocs'],
  component: TemplateReady,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TemplateReady>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
