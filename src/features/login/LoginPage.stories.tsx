import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { LoginPage } from './LoginPage'

// Sign in: the public login page (no app shell). Stories never complete a sign-in, which would leave the page.
const meta = {
  title: 'Login/Sign in',
  tags: ['autodocs'],
  component: LoginPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LoginPage>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByLabelText('Work email'), 'fde.meridian')
    await userEvent.click(canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')!)
  },
}
