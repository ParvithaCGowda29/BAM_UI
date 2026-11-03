import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TASKS } from './trackerConfig'
import { StageStep } from './Tracker'

// StageStep: one stage row of the workflow progress panel (marker, status, done/total, where you are).
const [ingestion, context, workbench, validation] = TASKS

const meta = {
  title: 'Tracker/StageStep',
  tags: ['autodocs'],
  component: StageStep,
  args: {
    item: workbench, marker: { status: 'in_progress', current: true }, earned: false, last: false, open: false,
    done: 1, total: 4, prev: 0, onToggle: fn(),
  },
  argTypes: {
    item: { control: false },
    marker: { control: 'object' },
    currentScreen: { control: 'select', options: [undefined, '3.1', '3.2', '4.2', '4.3'] },
    children: { control: false }, setRef: { control: false },
  },
  decorators: [Story => <div className="wf" style={{ width: 360 }}><ol className="wf-stages"><Story /></ol></div>],
} satisfies Meta<typeof StageStep>
export default meta
type Story = StoryObj<typeof meta>

export const Current: Story = {}
export const Viewing: Story = { args: { currentScreen: '3.2' } }
export const Done: Story = { args: { item: ingestion, marker: { status: 'done', current: false }, earned: true, done: 4, total: 4 } }
export const NeedsReview: Story = { args: { item: context, marker: { status: 'needs_review', current: true }, done: 3, total: 4 } }
export const Blocked: Story = { args: { item: validation, marker: { status: 'blocked', current: false }, done: 0, total: 4, last: true } }
export const NotStarted: Story = { args: { item: validation, marker: { status: 'not_started', current: false }, done: 0, total: 4, last: true } }
export const FromPreviousRun: Story = { args: { prev: 2, done: 0 } }
