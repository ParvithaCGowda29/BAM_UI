import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, type SeedStage } from '../storybook/backend'
import { AssistantPane } from './AssistantPane'

// AssistantPane: the Enterprise Assistant (live screen note, thread and composer with Dictate). Replies come from live
// state only; no language model is connected.
function Assistant({ stage, screenId, locked }: { stage: SeedStage; screenId?: string; locked?: string }) {
  return <PaneFrame height={720}><div style={{ width: 420, height: '100%', display: 'flex' }}>
    <AtStage stage={stage}>{({ snap }) => <AssistantPane snap={snap} screenId={screenId} locked={locked} />}</AtStage>
  </div></PaneFrame>
}

const meta = {
  title: 'Shell/AssistantPane',
  tags: ['autodocs'],
  component: Assistant,
  args: { stage: 'sow', screenId: '3.1' },
  argTypes: {
    ...stageArg,
    screenId: { control: 'select', options: ['1.1', '1.8', '2.5', '3.1', '3.2', '4.2', '4.8', '4.6'], description: 'Screen the assistant is on' },
    locked: { control: 'text', description: 'Why the screen is locked' },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Assistant>
export default meta
type Story = StoryObj<typeof meta>

export const OnScope: Story = {}
export const OnUpload: Story = { args: { stage: 'empty', screenId: '1.1' } }
export const OnLockedScreen: Story = { args: { stage: 'sow', screenId: '4.8', locked: 'Approve the Template first' } }
export const OnCommit: Story = { args: { stage: 'reviewed', screenId: '4.6' } }
