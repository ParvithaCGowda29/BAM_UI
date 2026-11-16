# BAM UI (BuLLM BAM Workbench)

The front end for BuLLM's BAM pipeline: from discovery document to deployed skill, in one pipeline. A Forward Deployed Engineer (FDE) signs in, names the agent's goal, and the app walks the build through four tracked stages with human approval gates at every step that matters.

## What it does

The workbench is a guided, four-stage flow. Each stage is a set of screens; the tracker records what is done, in progress, or not started, and nothing moves forward without its gate.

1. **Ingestion** - Upload the source documents, standardize and classify each file (the original is always kept), parse text, tables and structure, then review and confirm what goes to Context. Virus scan and quarantine run as internal gates in the background.
2. **Context** - Sync Admin Masters, index the context graph, review the generated schemas, verify the context by asking questions, and confirm graph, schema and retrieval readiness with provenance.
3. **Workbench** - Review and approve the Scope (SOW), the Agent > Skill grid with all seven ISATVON fields, the manifest template linked to the approved Scope and Grid, and the translated skill code with its translation check.
4. **Validation** - Create and run the isolated sandbox, check the results and evidence, certify the checked artifact, then commit it to BAM_db and deploy to Staging.

Outside the pipeline, **Admin > Masters** holds the master data grids (agents, assistants and the other masters) that feed Context sync.

Engine orchestration is selectable from the login screen and in engine settings; evaluation runs on the calibrated System-1 engine in the browser.

## Tech stack

React 19, TypeScript, Vite 8, Refine core, TanStack Query, AG Grid, xyflow (workflow graphs), Uppy (uploads), TipTap (rich text), Monaco (code), assistant-ui (chat), Storybook 10.

## Prerequisites

- Node.js 22 or later (tests and the mock check use `node --experimental-strip-types`)
- npm 10 or later

## Getting started

```bash
git clone https://github.com/ParvithaCGowda29/BAM_UI.git
cd BAM_UI
npm install
npm run dev
```

The dev server runs on http://localhost:5174 (strict port; stop whatever else uses 5174). Sign in with any work email and a password of 8 or more characters: sign-in is a development mock. Production builds fail closed and refuse every sign-in.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5174 |
| `npm run build` | Type-check (`tsc --noEmit`) and build for production into `dist/` |
| `npm run preview` | Serve the production build locally on port 5174 |
| `npm test` | Run the unit tests (tracker, evidence, RAG pipeline, SOW diff, scan gate, standardize, goal, judge) |
| `npm run check` | Validate the mock API adapter |
| `npm run storybook` | Start Storybook on port 6006 |
| `npm run build-storybook` | Build the static Storybook |

## Backends

None. The app is front-end only and runs end to end on built-in mocks: ingestion, the context pipeline, SOW generation and evaluation, and validation all execute in the browser with calibrated local engines. An OpenRouter key entered in engine settings is stored in the browser only.

One environment variable: `VITE_APP_TIMEZONE` pins the display timezone (default: the viewer's).
