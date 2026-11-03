import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, stepInfo, type SeedStage } from '../storybook/backend'
import { CertifyFooter } from './Step4'

// Certify's pinned footer action, against the example backend at a workflow stage.
function Footer({ stage }: { stage: SeedStage }) {
  return <AtStage stage={stage}>{({ snap }) => <CertifyFooter snap={snap} info={stepInfo(snap, 4)} />}</AtStage>
}

const meta = {
  title: 'Validation/Certify footer',
  tags: ['autodocs'],
  component: Footer,
  args: { stage: 'approved' },
  argTypes: stageArg,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>

export const NoRun: Story = { args: { stage: 'approved' } }
export const ReadyToCertify: Story = { args: { stage: 'tested' } }
export const Certified: Story = { args: { stage: 'reviewed' } }
