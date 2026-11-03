import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { ParseFooter } from './Ingestion'

// Parse's pinned footer: status only (Parse is automated); Retry appears when extraction fails.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <footer className="ws-foot"><ParseFooter snap={snap} /></footer>}</AtStage>
}

const meta = {
  title: 'Ingestion/ParseFooter',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'ingested' },
  argTypes: stageArg,
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const Waiting: Story = { args: { stage: 'verified' } }
export const Parsing: Story = { args: { stage: 'ingested' } }
