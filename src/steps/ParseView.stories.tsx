import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { ParseView } from './Ingestion'

// Parse: extraction of the current run. Before Standardize hands the files on it waits; after, it shows each file parsing.
function Parse({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <ParseView snap={snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/ParseView',
  tags: ['autodocs'],
  component: Parse,
  args: { stage: 'ingested' },
  argTypes: stageArg,
} satisfies Meta<typeof Parse>
export default meta
type Story = StoryObj<typeof meta>

export const Waiting: Story = { args: { stage: 'verified' } }
export const Parsing: Story = { args: { stage: 'ingested' } }
