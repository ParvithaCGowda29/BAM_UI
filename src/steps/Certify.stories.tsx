import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, PaneFrame, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { CertificationCenter } from './Step4'

// Certify (record approval of the checked artifact), against the example backend at a workflow stage.
function Certify({ stage }: { stage: SeedStage }) {
  return <PaneFrame height={700}><AtStage stage={stage}>{({ snap }) => <CertificationCenter snap={snap} info={stepInfo(snap, 4)} />}</AtStage></PaneFrame>
}

const meta = {
  title: 'Validation/Certify',
  tags: ['autodocs'],
  component: Certify,
  args: { stage: 'approved' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Certify>
export default meta
type Story = StoryObj<typeof meta>

export const NoRun: Story = { args: { stage: 'approved' } }
export const ReadyToCertify: Story = { args: { stage: 'tested' } }
export const Certified: Story = { args: { stage: 'reviewed' } }
