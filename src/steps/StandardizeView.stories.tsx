import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { StandardizeView, openFile } from './Standardize'

// Standardize: route by type, file problems, decision and the per-file list (click a file for its detail). The
// example uploads have no file bytes in this session, so their checks report the content as not available.
function Screen({ stage }: { stage: SeedStage }) {
  useEffect(() => { openFile(null) }, [stage])
  return <AtStage stage={stage}>{({ snap }) => <StandardizeView snap={snap} />}</AtStage>
}

const meta = {
  title: 'Ingestion/StandardizeView',
  tags: ['autodocs'],
  component: Screen,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Screen>
export default meta
type Story = StoryObj<typeof meta>

export const NoFiles: Story = { args: { stage: 'empty' } }
export const WaitingForUploads: Story = { args: { stage: 'scanning' } }
export const FilesChecked: Story = { args: { stage: 'verified' } }
