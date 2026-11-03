// Every pinned action button uses one of four words (BuLLM action-button rule, 17 Oct 2026). Its hover/focus tooltip
// copy lives here only, keyed by screen ID and word. `disabled` replaces the gate reason on the tooltip's second line;
// `running` is the second line while the button is busy.
import { screenLabel } from '../tracker/trackerConfig.ts'

export type ActionWord = 'Start' | 'Approve' | 'Edit' | 'Retry'

const DEFAULTS: Record<ActionWord, string> = {
  Start: 'Begins this step and runs it to the end.',
  Approve: 'Accepts this result and moves on to the next step.',
  Edit: 'Lets you change this result before you approve it.',
  Retry: 'Runs this step again after the failure.',
}

type Copy = { tip?: string; disabled?: string; running?: string }
export const ACTION_TIPS: Record<string, Partial<Record<ActionWord, Copy>>> = {
  '1.1': { Start: { tip: 'Starts ingestion. Your files are checked, standardized and parsed automatically, then you land on Review.' } },
  '1.8': { Approve: { tip: 'Accepts the original file as it is. The file is not changed and is checked again.' } },
  '1.4': {
    Edit: { tip: 'Fix or remove files and change their classification before approving.' },
    Approve: { tip: 'Confirms the document set and starts the Context stage.' },
  },
  '2.5': { Start: { tip: 'Syncs the latest Admin Masters, then builds the knowledge automatically. You will be asked to check it on Verify.' } },
  '2.4': { Start: { tip: 'Generates the statement of work from this context, then opens Scope.' } },
  '2.3': {
    Start: { tip: 'Tests the context with the sample questions before you approve it.', running: 'Testing the sample questions against the context…' },
    Approve: { tip: 'Accepts the verified context and starts the Workbench stage.' },
    // The failed-answer detail's actions.
    Edit: { tip: 'Takes you to the master to fix the data behind this answer.' },
    Retry: { tip: 'Asks this question again after the fix.', running: 'Asking the question again…' },
  },
  '3.1': {
    Edit: { tip: 'Change the statement of work before you approve it.' },
    Approve: { tip: 'Approves the statement of work. Skills are built from it in the next steps.', running: 'Approving the statement of work…' },
  },
  // ponytail: "macro-skills, sub-skills" from the prompt reads Agent > Skill here (terminology rule in CLAUDE.md).
  '3.2': {
    Edit: { tip: 'Change agents, skills and their columns in the grid.' },
    Approve: { tip: 'Approves the grid. Asks you to confirm before the checks run.', running: 'Starting the checks…' },
    // The confirm popup's Start.
    Start: { tip: 'Runs the contract, dependency and translation checks. Nothing is saved yet.' },
  },
  '4.2': {
    Start: { tip: 'Runs the contract, dependency and translation checks on the reviewed grid.', running: 'Starting the checks…' },
    Edit: { tip: 'Change the generated manifest before approving.' },
    Approve: { tip: 'Accepts the manifest and opens Translate.' },
    Retry: { tip: 'Runs the Template checks again. Your earlier inputs are kept.', running: 'Running the checks again…' },
  },
  '4.3': {
    Edit: { tip: 'Change the generated code before approving.' },
    Approve: { tip: 'Accepts the generated skills and opens Validation.', running: 'Approving the generated skills…' },
  },
  '4.8': {
    Start: { tip: 'Sets up an isolated test environment for the generated skills. Nothing touches production.', running: 'Setting up the sandbox…' },
    Approve: { tip: 'Accepts the sandbox and opens Check.' },
  },
  '4.4': {
    Start: { tip: 'Runs the checks on the skills in the sandbox.', running: 'Running the checks…' },
    Approve: { tip: 'Accepts the check results and opens Certify.', disabled: 'Available once all checks pass.' },
  },
  '4.5': { Approve: { tip: 'Signs off on the results and opens Commit.', disabled: 'Available once all checks pass.', running: 'Signing off…' } },
  // ponytail: "Skill Palette" from the prompt reads Staging (no Skill Palette exists; CLAUDE.md "No hot-reload / Skill Palette").
  '4.6': { Approve: { tip: 'Saves the certified skills and makes them available on Staging. Asks you to confirm first.', disabled: 'Available once the skills are certified.', running: 'Saving the certified skills and going live…' } },
}

/** Props for GateButton / Tip: the tooltip text, the disabled-reason override and the running text. */
export function tips(screen: string, word: ActionWord) {
  const c = ACTION_TIPS[screen]?.[word]
  const tip = c?.tip ?? (word === 'Retry' ? `Runs ${screenLabel(screen)} again. Your earlier inputs are kept.` : DEFAULTS[word])
  return { tip, tipReason: c?.disabled, tipBusy: c?.running ?? `${screenLabel(screen)} is running…` }
}
