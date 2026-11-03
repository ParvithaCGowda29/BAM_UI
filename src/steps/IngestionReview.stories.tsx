import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { setUi } from '../lib/store'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { IngestionReview } from './Ingestion'

// Review: the accepted files that go to Context, the hand-off summary, and files refused at selection.
const REFUSED = [
  { name: 'CAD_Viewer_Setup.exe', reason: 'Unsupported type (.exe)', at: '2026-10-21T09:10:00.000Z' },
  { name: 'Empty_Notes.txt', reason: 'Empty file', at: '2026-10-21T09:10:00.000Z' },
  { name: 'RFQ_Package_Meridian.pdf', reason: 'Skipped - duplicate', at: '2026-10-21T09:11:00.000Z' },
]

function Review({ stage, refused }: { stage: SeedStage; refused: boolean }) {
  // The refused-at-selection list lives in the shared UI store; each story sets it.
  useEffect(() => { setUi({ rejected: refused ? REFUSED : [] }) }, [refused])
  return <AtStage stage={stage}>{({ snap }) => <IngestionReview snap={snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/IngestionReview',
  tags: ['autodocs'],
  component: Review,
  args: { stage: 'ingested', refused: false },
  argTypes: { ...stageArg, refused: { control: 'boolean', description: 'Files refused at selection' } },
} satisfies Meta<typeof Review>
export default meta
type Story = StoryObj<typeof meta>

export const NothingHandedOn: Story = { args: { stage: 'verified' } }
export const WaitingForParse: Story = { args: { stage: 'ingested' } }
export const WithRefusedFiles: Story = { args: { stage: 'ingested', refused: true } }
