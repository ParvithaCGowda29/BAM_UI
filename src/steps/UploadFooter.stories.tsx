import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { setUi } from '../lib/store'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { UploadFooter } from './Ingestion'

// Upload's pinned footer: status and Start (enabled only when every added file is ready).
function Footer({ stage }: { stage: SeedStage }) {
  useEffect(() => { setUi({ rejected: [] }) }, [])
  return <AtStage stage={stage}>{({ snap }) => <footer className="ws-foot"><UploadFooter snap={snap} /></footer>}</AtStage>
}

const meta = {
  title: 'Ingestion/UploadFooter',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'verified' },
  argTypes: stageArg,
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NoFiles: Story = { args: { stage: 'empty' } }
export const Checking: Story = { args: { stage: 'scanning' } }
export const Ready: Story = { args: { stage: 'verified' } }
