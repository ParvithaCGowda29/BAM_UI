import type { Meta, StoryObj } from '@storybook/react-vite'
import { StageList } from './ui'

// StageList: every backend stage with status, start time, duration and run ID.
const t = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

const meta = {
  title: 'Components/StageList',
  tags: ['autodocs'],
  component: StageList,
  args: {
    stages: [
      { key: 'context', label: 'Collect extracted context', status: 'succeeded', runId: 'sow-run-0147', startedAt: t(6), endedAt: t(5.8), detail: '3 source documents, 42 facts' },
      { key: 'draft', label: 'Draft ISATVON requirements', status: 'running', runId: 'sow-run-0147', startedAt: t(5.7) },
      { key: 'evaluate', label: 'Evaluate SOW accuracy', status: 'queued' },
    ],
  },
} satisfies Meta<typeof StageList>
export default meta
type Story = StoryObj<typeof meta>

export const Running: Story = {}
export const Failed: Story = {
  args: {
    stages: [
      { key: 'context', label: 'Collect extracted context', status: 'succeeded', runId: 'sow-run-0148', startedAt: t(4), endedAt: t(3.9) },
      { key: 'draft', label: 'Draft ISATVON requirements', status: 'failed', runId: 'sow-run-0148', startedAt: t(3.8), endedAt: t(3.2), error: 'The Context Engine returned no requirements for Requirement 4.' },
      { key: 'evaluate', label: 'Evaluate SOW accuracy', status: 'skipped' },
    ],
  },
}
export const Done: Story = {
  args: {
    stages: [
      { key: 'context', label: 'Collect extracted context', status: 'succeeded', runId: 'sow-run-0149', startedAt: t(9), endedAt: t(8.9) },
      { key: 'draft', label: 'Draft ISATVON requirements', status: 'succeeded', runId: 'sow-run-0149', startedAt: t(8.8), endedAt: t(8.1) },
      { key: 'evaluate', label: 'Evaluate SOW accuracy', status: 'succeeded', runId: 'sow-run-0149', startedAt: t(8), endedAt: t(7.9), detail: 'ISATVON completeness 100%' },
    ],
  },
}
