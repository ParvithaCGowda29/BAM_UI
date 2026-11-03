import { useEffect, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RAG_ROUTES } from '../lib/route'
import { AtStage, PaneFrame } from '../storybook/backend'
import { ragPipeline } from './ragPipeline'
import { RagScreen } from './RagScreens'

// The Context stage screen, by route, inside the workspace body it fills in the app. The context run is one shared
// pipeline for the whole preview: it starts once (about 10 s), so a story shows the build while it runs and the result
// afterwards, whatever order stories are opened.
function ContextRun({ children }: { children: ReactNode }) {
  useEffect(() => { if (!ragPipeline.getState().runId) ragPipeline.start() }, [])
  return children
}
function Screen({ path }: { path: string }) {
  return <ContextRun><PaneFrame height={700}><div className="ws-body" style={{ flex: 1, minHeight: 0 }}><AtStage stage="ingested">{({ snap }) => <RagScreen path={path} snap={snap} />}</AtStage></div></PaneFrame></ContextRun>
}

const meta = {
  title: 'Context/Context screen',
  tags: ['autodocs'],
  component: Screen,
  args: { path: RAG_ROUTES.graph },
  argTypes: { path: { control: 'select', options: Object.values(RAG_ROUTES), description: 'Route of the Context screen' } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Screen>
export default meta
type Story = StoryObj<typeof meta>

export const Index: Story = { args: { path: RAG_ROUTES.graph } }
export const Schema: Story = { args: { path: RAG_ROUTES.schemas } }
export const Verify: Story = { args: { path: RAG_ROUTES.quality } }
export const Readiness: Story = { args: { path: RAG_ROUTES.review } }
