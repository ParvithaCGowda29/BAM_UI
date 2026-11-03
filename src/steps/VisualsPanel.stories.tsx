import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisualsPanel } from './Visuals'

// Scope › Visuals: images kept in this browser tab only. Add image to try the editor (PNG, JPEG or WebP).
const meta = {
  title: 'Ingestion/VisualsPanel',
  tags: ['autodocs'],
  component: VisualsPanel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VisualsPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
