# BAM UI (BuLLM BAM Workbench)

The front end for BuLLM's BAM pipeline: from discovery document to deployed skill, in one pipeline. A Forward Deployed Engineer (FDE) signs in, names the agent's goal, and the app walks the build through four tracked stages with human approval gates at every step that matters.

## What it does

The workbench is a guided, four-stage flow. Each stage is a set of screens; the tracker records what is done, in progress, or not started, and nothing moves forward without its gate.

1. **Ingestion** - Upload the source documents, standardize and classify each file (the original is always kept), parse text, tables and structure, then review and confirm what goes to Context. Virus scan and quarantine run as internal gates in the background.
2. **Context** - Sync Admin Masters, index the context graph, review the generated schemas, verify the context by asking questions, and confirm graph, schema and retrieval readiness with provenance.
3. **Workbench** - Review and approve the Scope (SOW), the Agent > Skill grid with all seven ISATVON fields, the manifest template linked to the approved Scope and Grid, and the translated skill code with its translation check.
4. **Validation** - Create and run the isolated sandbox, check the results and evidence, certify the checked artifact, then commit it to BAM_db and deploy to Staging.

Outside the pipeline, **Admin > Masters** holds the master data grids (agents, assistants and the other masters) that feed Context sync.

Engine orchestration is selectable from the login screen: Google Gemini 2.5 Flash in the cloud (via OpenRouter), a local Laya ONNX runtime for offline or edge use, or the deterministic calibrated rule engine.

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

## Optional backends

The app runs end to end on built-in mocks. Two real backends can be attached through the Vite dev proxy:

**Laya judge** (local SOW accuracy judge, used by the Scope screen):

```bash
cd server/laya-judge
npm install
npm start
```

Listens on port 8787; the dev server proxies `/laya` to it. Point elsewhere with `LAYA_URL`. For the cloud System-1 judge, set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`, default `google/gemini-2.5-flash`). An OpenRouter key can also be entered in the app's engine settings, where it is stored in the browser only.

**Cognee** (real RAG backend): run a Cognee server and start the dev server with `VITE_RAG_BACKEND=cognee`; the proxy targets `COGNEE_URL` (default `http://localhost:8000`).

Other environment variables: `VITE_COGNEE_URL` overrides the client-side Cognee base, and `VITE_APP_TIMEZONE` pins the display timezone (default: the viewer's).
