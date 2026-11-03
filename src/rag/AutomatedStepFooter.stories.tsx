import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ragPipeline } from './ragPipeline'
import { AutoContextFooter } from './RagSeamless'

// Index and Schema run by themselves: their footer is status only, with Retry while a context step has failed.
// It follows the shared context run (started once for the preview, about 10 s).
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}

const meta = {
  title: 'Context/Automated step footer',
  tags: ['autodocs'],
  component: AutoContextFooter,
  decorators: [Story => <ContextRun><Story /></ContextRun>],
  args: { screen: '2.1' },
  argTypes: { screen: { control: 'inline-radio', options: ['2.1', '2.2'], description: '2.1 = Index, 2.2 = Schema' } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AutoContextFooter>
export default meta
type Story = StoryObj<typeof meta>

export const Index: Story = { args: { screen: '2.1' } }
export const Schema: Story = { args: { screen: '2.2' } }
