// Upload goal capture (29 Oct 2026, "Upload step & assistant changes" wireframes): the middle pane names the agent in
// one sentence with three editable blanks; Expand goal writes the ISATVON draft into the right pane (Output, editable,
// with the formatting toolbar) and lists the supporting files its Source data needs. Approve hands the right pane back
// to Uploaded files. The assistant's draft edits land in the same store, so the visible draft always matches.
import './goal.css'
import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Snapshot } from '../api/types'
import { setUi } from '../lib/store'
import { OTHERS, WHAT_OPTIONS, WHERE_OPTIONS, WHO_OPTIONS, draftHtml, expandGoal, flowLine, missingUploads, readHtml, sentence, setGoal, useGoal, type Goal } from '../lib/goal.ts'
import { Icon, Tip } from '../components/ui'
import { Toolbar } from './Step1'
import bull from '../assets/login/bull-head-transparent.png'

const FIELDS = [
  { key: 'what', label: 'What', hint: 'Work as deliverables' },
  { key: 'who', label: 'Who', hint: 'User role + business type' },
  { key: 'where', label: 'Where', hint: 'Market or geography' },
] as const

type Field = keyof Goal
const OPTIONS: Record<Field, string[]> = { what: WHAT_OPTIONS, who: WHO_OPTIONS, where: WHERE_OPTIONS }
const isCustom = (f: Field, v: string) => !OPTIONS[f].includes(v) || v === OTHERS

/** One goal field (goal dropdowns, 29 Oct 2026): a blue dropdown inline in the sentence. The menu anchors under the
 *  field, left-aligned, over whatever is below; arrows / Home / End move, Enter or Space picks, Escape or Tab closes
 *  (focus back on the field). "Others" (last, divided, muted) swaps the field for a text input whose value is the field's. */
function GoalSelect({ field, value, custom, open, hl, onOpen, onClose, onPick }: { field: Field; value: string; custom: boolean; open: boolean; hl: boolean
  onOpen: () => void; onClose: () => void; onPick: (v: string) => void }) {
  const label = FIELDS.find(f => f.key === field)!.label
  const wrap = useRef<HTMLSpanElement>(null), trigger = useRef<HTMLButtonElement>(null), input = useRef<HTMLInputElement>(null)
  const opts = OPTIONS[field]
  const selected = custom ? OTHERS : value
  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
  const close = (focus = true) => { onClose(); if (focus) (custom ? input.current : trigger.current)?.focus() }
  useEffect(() => {
    if (!open) return
    (items().find(o => o.getAttribute('aria-selected') === 'true') ?? items()[0])?.focus()
    const out = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) onClose() }
    document.addEventListener('pointerdown', out)
    return () => document.removeEventListener('pointerdown', out)
  }, [open])
  // Choosing Others puts the caret in the new input.
  const wasCustom = useRef(custom)
  useEffect(() => { if (custom && !wasCustom.current) input.current?.focus(); wasCustom.current = custom }, [custom])
  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items(), i = list.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus() }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const v = list[i]?.dataset.value; if (v !== undefined) { onPick(v); close(v !== OTHERS) } }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Tab') onClose()
  }
  const openKeys = (e: React.KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); onOpen() } }
  const chevron = <Icon name="tb-chevron-down" size={14} />
  return <span ref={wrap} className="goal-field">
    {custom
      ? <span className={`goal-blank goal-custom${hl ? ' goal-hl' : ''}`}>
          {/* Width hugs the text: the hidden copy (value, else the placeholder) sizes the grid cell the input fills. */}
          <span className="goal-sizer"><span className="goal-mirror" aria-hidden>{value || `Type your own ${label.toLowerCase()}`}</span>
          <input ref={input} id={`goal-${field}`} className="goal-input" value={value} placeholder={`Type your own ${label.toLowerCase()}`} aria-label={`${label} (your own)`}
            size={1} onChange={e => { const v = e.target.value; setGoal(s => ({ goal: { ...s.goal, [field]: v } })) }} onKeyDown={openKeys} /></span>
          <button ref={trigger} type="button" className="goal-chev" aria-label={`Choose ${label}`} aria-haspopup="listbox" aria-expanded={open}
            aria-controls={`goal-menu-${field}`} onClick={() => (open ? onClose() : onOpen())}>{chevron}</button>
        </span>
      : <button ref={trigger} id={`goal-${field}`} type="button" className={`goal-blank goal-select${hl ? ' goal-hl' : ''}`} aria-label={`${label}: ${value}`} aria-haspopup="listbox"
          aria-expanded={open} aria-controls={`goal-menu-${field}`} onClick={() => (open ? onClose() : onOpen())} onKeyDown={openKeys}>{value}{chevron}</button>}
    {open && <ul id={`goal-menu-${field}`} className="goal-menu" role="listbox" aria-label={label} onKeyDown={onMenuKey}>
      {opts.map(o => <li key={o} role="option" tabIndex={-1} data-value={o} aria-selected={o === selected} className={o === OTHERS ? 'goal-other' : undefined}
        onClick={() => { onPick(o); close(o !== OTHERS) }}>{o}{o === selected && <Icon name="tb-check" size={14} />}</li>)}
    </ul>}
  </span>
}

/** Middle pane on Upload while the thread is empty. */
export function GoalCapture({ snap }: { snap: Snapshot }) {
  const goal = useGoal(s => s.goal), draft = useGoal(s => s.draft)
  const names = snap.uploads.map(u => u.name)
  const empty = !goal.what.trim() || !goal.who.trim() || !goal.where.trim()
  const expand = () => { setGoal({ draft: expandGoal(goal), approved: false }); setUi({ fdeGoals: sentence(goal) }) }
  const [open, setOpen] = useState<Field | null>(null) // one menu at a time
  const [custom, setCustom] = useState(() => ({ what: isCustom('what', goal.what), who: isCustom('who', goal.who), where: isCustom('where', goal.where) }))
  const pick = (f: Field) => (v: string) => {
    setCustom(c => ({ ...c, [f]: v === OTHERS }))
    // Others starts empty: the FDE types the value (Expand goal waits for it).
    setGoal(s => ({ goal: { ...s.goal, [f]: v === OTHERS ? (custom[f] ? s.goal[f] : '') : v } }))
  }
  // The helper cards highlight their field (goal-cards fix, 29 Oct 2026): one at a time, never opens its menu; it moves
  // to a field the person opens and clears when focus leaves the goal card.
  const [hl, setHl] = useState<Field | null>(null)
  const sel = (f: Field) => <GoalSelect field={f} value={goal[f]} custom={custom[f]} open={open === f} hl={hl === f} onOpen={() => { setOpen(f); setHl(f) }} onClose={() => setOpen(o => (o === f ? null : o))} onPick={pick(f)} />
  return <div className="goal">
    <h3 className="goal-head">Name the Agent.<br />Let the <img src={bull} alt="BuLLM" className="goal-bull" /> build it.</h3>
    <p className="goal-lede">Set the goal. BuLLM expands it into an ISATVON draft and the workflow behind it.</p>
    <section className="goal-card" aria-label="Agent goal" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHl(null) }}>
      <p className="goal-hint">Pick from the blue dropdowns, or choose Others to type your own.</p>
      <p className="goal-sentence">Build an AI agent that automates {sel('what')} for {sel('who')} in {sel('where')}</p>
      <div className="goal-chips">{FIELDS.map(f =>
        <button key={f.key} type="button" className="goal-chip" aria-pressed={hl === f.key} aria-controls={`goal-${f.key}`} onClick={() => setHl(f.key)}>
          <strong>{f.label}</strong><span>{f.hint}</span></button>)}</div>
      <p className="goal-flow">{flowLine(goal)}</p>
      <div className="goal-go"><Tip text="Write the ISATVON draft in the right pane" note={empty ? 'Fill in all three fields first' : undefined}>
        <button className="btn btn-primary" aria-disabled={empty || undefined} onClick={() => { if (!empty) expand() }}>Expand goal<Icon name="tb-arrow-right" size={16} /></button></Tip></div>
    </section>
    {draft && <section className="goal-card goal-req" aria-labelledby="goal-req-title">
      <h4 id="goal-req-title">Required uploads <span>From Source data · upload in the next step</span></h4>
      <ul>{draft.uploads.map(u => { const has = !missingUploads({ ...draft, uploads: [u] }, names).length
        return <li key={u.name}><Icon name="tb-file-text" size={16} /><span><strong>{u.name}</strong><small>{u.hint}</small></span>
          <em className={has ? 'added' : u.required ? 'req' : ''}>{has ? 'Added' : u.required ? 'Required' : 'Optional'}</em></li> })}</ul>
    </section>}
  </div>
}

/** Right pane while the draft is out for review: the ISATVON draft in the editor with its formatting toolbar. */
export function GoalOutput({ snap }: { snap: Snapshot }) {
  const draft = useGoal(s => s.draft)!
  const rev = draft.rev
  const editor = useEditor({ extensions: [StarterKit], content: draftHtml(draft),
    onUpdate: ({ editor: e }) => setGoal(s => s.draft ? { draft: readHtml(s.draft, e.getHTML()) } : {}) })
  // An assistant edit or a new expansion changes rev: the editor shows the new draft (typed edits never do).
  useEffect(() => { if (editor) editor.commands.setContent(draftHtml(draft), { emitUpdate: false }) }, [editor, rev])
  const req = missingUploads(draft, snap.uploads.map(u => u.name)).filter(u => u.required).length
  return <main className="up-right goal-out" aria-labelledby="center-title">
    <h2 id="center-title" className="sr-only" tabIndex={-1}>ISATVON draft</h2>
    <span className="goal-pill">Draft for review</span>
    {editor && <Toolbar editor={editor} label="Draft formatting" />}
    <div className="goal-doc" style={{ '--req': req ? `"${req} file${req === 1 ? '' : 's'} required"` : 'none' } as React.CSSProperties}><EditorContent editor={editor} /></div>
  </main>
}

export function GoalFooter() {
  return <div className="ws-foot-in">
    <div className="ws-foot-text muted sm">Review and edit this example.<br />Approve, then upload supporting files.</div>
    <Tip text="Approve the draft and move on to uploading the supporting files">
      <button className="btn btn-primary" onClick={() => setGoal({ approved: true })}>Approve</button></Tip>
  </div>
}
