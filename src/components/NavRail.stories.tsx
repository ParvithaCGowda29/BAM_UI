import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { setUi } from '../lib/store'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { NavRail } from './shell'

// NavRail: the NAVIGATE pane (step search, the four stages and their steps, locks from the backend gates).
function Nav({ stage, collapsed }: { stage: SeedStage; collapsed?: boolean }) {
  useEffect(() => { setUi(s => ({ shell: { ...s.shell, nav: !!collapsed } })); return () => setUi(s => ({ shell: { ...s.shell, nav: false } })) }, [collapsed])
  return <PaneFrame height={720}><div style={{ width: collapsed ? 56 : 340, height: '100%', display: 'flex' }}>
    <AtStage stage={stage}>{({ snap }) => <NavRail snap={snap} />}</AtStage>
  </div></PaneFrame>
}

const meta = {
  title: 'Shell/NavRail',
  tags: ['autodocs'],
  component: Nav,
  args: { stage: 'empty', collapsed: false },
  argTypes: { ...stageArg, collapsed: { control: 'boolean', description: 'Collapsed to the 56px rail' } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Nav>
export default meta
type Story = StoryObj<typeof meta>

export const NewWorkflow: Story = {}
export const ScopeApproved: Story = { args: { stage: 'grid' } }
export const ReadyToCertify: Story = { args: { stage: 'tested' } }
export const Collapsed: Story = { args: { collapsed: true } }
