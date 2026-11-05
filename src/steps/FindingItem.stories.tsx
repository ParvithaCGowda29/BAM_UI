import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CodeFile } from '../api/types'
import { FindingItem } from './Step3'

// One finding from the check activities: severity, message, skill and (when known) the file and line it points to.
const files: CodeFile[] = [{ path: 'skills/estimate_pcba_cost.py', skillId: 'SK-004', content: '', generated: '' }]

const meta = {
  title: 'Workbench/FindingItem',
  tags: ['autodocs'],
  component: FindingItem,
  decorators: [Story => <ul className="findings"><Story /></ul>],
  args: {
    f: { id: 'F-12', severity: 'error', message: 'Variable "margin" is used in the code but not declared in the ISATVON contract.', skillId: 'SK-004', file: 'skills/estimate_pcba_cost.py', line: 42 },
    files,
  },
  argTypes: { f: { control: 'object', description: 'The finding' }, files: { control: false } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FindingItem>
export default meta
type Story = StoryObj<typeof meta>

export const ErrorFinding: Story = {}
export const WarningFinding: Story = { args: { f: { id: 'F-13', severity: 'warning', message: 'Outcome "CostBreakdown JSON" has no schema version.', skillId: 'SK-004', line: 12 } } }
export const Resolved: Story = { args: { f: { id: 'F-09', severity: 'error', message: 'Source data "BOM.xlsx" is not a storage URI.', skillId: 'SK-004', resolved: true } } }
export const FileFromSkill: Story = { args: { f: { id: 'F-14', severity: 'warning', message: 'Next has no recipient for failures.', skillId: 'SK-004' } } }
export const NoReference: Story = { args: { f: { id: 'F-15', severity: 'error', message: 'Dependency "pandas" is not pinned to a version.' }, files: undefined } }
