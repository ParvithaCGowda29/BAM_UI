import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtStage, stageArg, type SeedStage } from '../storybook/backend'
import { ManifestCompare } from './release'

// ManifestCompare: the draft manifest against the latest certified version (read-only).
function Compare({ stage, link }: { stage: SeedStage; link?: boolean }) {
  return <AtStage stage={stage}>{({ snap }) => <ManifestCompare snap={snap} link={link} />}</AtStage>
}

const meta = {
  title: 'Components/ManifestCompare',
  tags: ['autodocs'],
  component: Compare,
  args: { stage: 'contract', link: true },
  argTypes: { ...stageArg, link: { control: 'boolean', description: 'Show the "Open Manifest JSON" link' } },
} satisfies Meta<typeof Compare>
export default meta
type Story = StoryObj<typeof meta>

export const NoManifest: Story = { args: { stage: 'sow' } }
export const FirstBuild: Story = {}
export const SameAsCertified: Story = { args: { stage: 'deployed' } }
export const WithoutLink: Story = { args: { link: false } }
