import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { Connectors } from './Ingestion'

// Connectors (optional): Google Drive, SharePoint and S3, each with Connect disabled (no connector service yet).
function Screen({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <Connectors snap={snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/Connectors',
  tags: ['autodocs'],
  component: Screen,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Screen>
export default meta
type Story = StoryObj<typeof meta>

export const NotConnected: Story = {}
