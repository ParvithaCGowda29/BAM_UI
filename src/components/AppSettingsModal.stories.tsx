import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { closeSettings, openSettings } from '../lib/store'
import { AppSettingsModal } from './AppSettingsModal'

// AppSettingsModal: the settings dialog (decision engine, API key, security telemetry). It opens from the app store,
// so the story opens it on mount and closes it when the story unmounts.
const meta = {
  title: 'Components/AppSettingsModal',
  tags: ['autodocs'],
  component: AppSettingsModal,
  args: {},
  decorators: [Story => {
    useEffect(() => { openSettings(); return closeSettings }, [])
    return <Story />
  }],
} satisfies Meta<typeof AppSettingsModal>
export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
