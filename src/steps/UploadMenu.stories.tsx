import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadMenu } from './UploadPanes'

// The "⋯" menu in the Uploaded files header: Reset (with a confirmation), locked once the files are handed on.
function Menu({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <div className="row" style={{ justifyContent: 'flex-end', minHeight: 160 }}><UploadMenu snap={snap} /></div>}</AtStage>
}

const meta = {
  title: 'Ingestion/UploadMenu',
  tags: ['autodocs'],
  component: Menu,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Menu>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const LockedAfterHandOff: Story = { args: { stage: 'ingested' } }
