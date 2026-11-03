import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { SecurityDetails } from './IngestionFlow'

// SecurityDetails: the security summary and dataset provenance shown behind an Ingestion screen's details icon.
function Details({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <div className="dc-details"><SecurityDetails snap={snap} /></div>}</AtStage>
}

const meta = {
  title: 'Ingestion/SecurityDetails',
  tags: ['autodocs'],
  component: Details,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Details>
export default meta
type Story = StoryObj<typeof meta>

export const NoUploads: Story = { args: { stage: 'empty' } }
export const WithUploads: Story = { args: { stage: 'verified' } }
