import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { CogneePreflightCockpit } from './CogneePreflightCockpit'

// The context cockpit: master questionnaire, context questions, client masters and extraction coverage, one tab each.
const meta = {
  title: 'Context/Context cockpit',
  tags: ['autodocs'],
  component: CogneePreflightCockpit,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CogneePreflightCockpit>
export default meta
type Story = StoryObj<typeof meta>

const openTab = (index: number): Story['play'] => async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getAllByRole('tab')[index])
}

export const Questionnaire: Story = {}
export const ContextQuestions: Story = { play: openTab(1) }
export const ClientMasters: Story = { play: openTab(2) }
export const ExtractionCoverage: Story = { play: openTab(3) }
