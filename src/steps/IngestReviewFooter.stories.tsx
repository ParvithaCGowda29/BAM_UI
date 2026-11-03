import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { IngestReviewFooter } from './Ingestion'

// Review's pinned footer: Edit (back to Upload) and Approve (once parsing is done). Locked after SOW approval.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <footer className="ws-foot"><IngestReviewFooter snap={snap} /></footer>}</AtStage>
}

const meta = {
  title: 'Ingestion/IngestReviewFooter',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'ingested' },
  argTypes: stageArg,
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const WaitingForParse: Story = { args: { stage: 'ingested' } }
export const IntakeClosed: Story = { args: { stage: 'grid' } }
