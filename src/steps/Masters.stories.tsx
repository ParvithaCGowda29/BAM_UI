import type { Meta, StoryObj } from '@storybook/react-vite'
import { MastersPage } from './Global'

// Admin › Masters: the EXAMPLE masters, their README export and the frozen Filetype master.
const meta = {
  title: 'Global/Masters',
  tags: ['autodocs'],
  component: MastersPage,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MastersPage>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
