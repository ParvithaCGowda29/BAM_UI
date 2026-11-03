import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { GateButton } from '../components/ui'
import { Foot } from './Standardize'

// Foot: the pinned footer layout of the Ingestion steps (bold status, one line, then the step's buttons).
const meta = {
  title: 'Ingestion/Foot',
  tags: ['autodocs'],
  component: Foot,
  args: { title: '3 files ready', line: 'Held files stay out of Context and are listed on Review', children: null },
  argTypes: { title: { control: 'text' }, line: { control: 'text' }, children: { control: false, description: 'The step buttons' } },
  decorators: [Story => <footer className="ws-foot"><Story /></footer>],
} satisfies Meta<typeof Foot>
export default meta
type Story = StoryObj<typeof meta>

export const StatusOnly: Story = {}
export const TitleOnly: Story = { args: { title: 'Checking files', line: undefined } }
export const WithAction: Story = {
  args: {
    title: 'Packaging_Spec.docx: Manual review', line: 'Accept the original as it is, or replace it in Upload',
    children: <GateButton icon="check" onClick={fn()}>Approve</GateButton>,
  },
}
export const WithBlockedAction: Story = {
  args: {
    title: 'Extraction failed', line: 'Extracted text and tables are linked to the source files',
    children: <GateButton icon="refresh" reason="Retry is unavailable while the run is starting" onClick={fn()}>Retry</GateButton>,
  },
}
