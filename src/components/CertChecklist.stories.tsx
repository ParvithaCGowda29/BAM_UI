import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { CertChecklist } from './release'

// CertChecklist: certification evidence for the current manifest, against the example backend at a workflow stage.
function Checklist({ stage, compact }: { stage: SeedStage; compact?: boolean }) {
  return <AtStage stage={stage}>{({ snap }) => <CertChecklist snap={snap} compact={compact} />}</AtStage>
}

const meta = {
  title: 'Components/CertChecklist',
  tags: ['autodocs'],
  component: Checklist,
  args: { stage: 'contract' },
  argTypes: { ...stageArg, compact: { control: 'boolean' } },
} satisfies Meta<typeof Checklist>
export default meta
type Story = StoryObj<typeof meta>

export const NoManifest: Story = { args: { stage: 'sow' } }
export const DraftManifest: Story = {}
export const ChecksReviewed: Story = { args: { stage: 'reviewed' } }
export const Certified: Story = { args: { stage: 'deployed' } }
export const Compact: Story = { args: { stage: 'tested', compact: true } }
