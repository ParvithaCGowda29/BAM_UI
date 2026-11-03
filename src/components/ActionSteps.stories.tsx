import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ActionSteps, type ActionState, type ActionStep } from './ui'

// ActionSteps: a footer of gated decisions in order, each with its state, button and reason.
const TEXT: Record<ActionState, string> = { ready: 'Ready', locked: 'Locked', running: 'Running', done: 'Done', failed: 'Failed' }
const BASE: Omit<ActionStep, 'state' | 'stateText' | 'caption' | 'onClick'>[] = [
  { key: 'test', label: 'Test', icon: 'play', hint: 'Runs the sandbox and the check run for this manifest.' },
  { key: 'review', label: 'Review', icon: 'eye', action: 'review' },
  { key: 'commit', label: 'Commit to BAM_db', icon: 'db', action: 'commit' },
  { key: 'deploy', label: 'Deploy to Staging', icon: 'rocket', action: 'deploy' },
]
const steps = (states: ActionState[]): ActionStep[] => BASE.map((s, i) => ({
  ...s, state: states[i], stateText: TEXT[states[i]], caption: `0${i + 1} / ${s.label}`, onClick: fn(),
  reason: states[i] === 'locked' ? (i === 1 ? 'Run the tests first' : 'Review the check results first') : undefined,
}))

const meta = {
  title: 'Components/ActionSteps',
  tags: ['autodocs'],
  component: ActionSteps,
  args: { label: 'Release steps', steps: steps(['ready', 'locked', 'locked', 'locked']) },
  argTypes: { steps: { control: 'object' } },
} satisfies Meta<typeof ActionSteps>
export default meta
type Story = StoryObj<typeof meta>

export const FirstStepReady: Story = {}
export const Running: Story = { args: { steps: steps(['running', 'locked', 'locked', 'locked']) } }
export const ReadyToCommit: Story = { args: { steps: steps(['done', 'done', 'ready', 'locked']) } }
export const TestFailed: Story = { args: { steps: steps(['failed', 'locked', 'locked', 'locked']) } }
export const AllDone: Story = { args: { steps: steps(['done', 'done', 'done', 'done']) } }
