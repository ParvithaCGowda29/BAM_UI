import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { StandardizeFooter, openFile } from './Standardize'

// Standardize's pinned footer: status only (Standardize hands the ready files on by itself).
function Footer({ stage }: { stage: SeedStage }) {
  useEffect(() => { openFile(null) }, [stage])
  return <AtStage stage={stage}>{({ snap }) => <footer className="ws-foot"><StandardizeFooter snap={snap} /></footer>}</AtStage>
}

const meta = {
  title: 'Ingestion/StandardizeFooter',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NoReadyFiles: Story = { args: { stage: 'scanning' } }
export const NeedsAttention: Story = { args: { stage: 'verified' } }
