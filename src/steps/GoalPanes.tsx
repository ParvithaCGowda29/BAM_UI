// Goal screen (4 Nov 2026, approved assistant redesign): one large typeable input with a cycling example as ghost text,
// no dropdown sentence and no What / Who / Where cards. Sending the goal expands it into an ISATVON draft in the chat
// (rows edit in place); that opens the files pane, and adding files opens the outputs pane. No approval step.
// Caret fix (5 Nov 2026, screenshot): the fixed phrase "Build an AI agent that automates " is real text the box starts
// with and the caret starts right after it; typing replaces the cycling example tail.
// ponytail: the expansion is the rule-based mock in lib/goal.ts (no model/RAG is connected); swap expandGoal for the backend call.
import './goal.css'
import { useEffect, useRef, useState } from 'react'
import { setUi } from '../lib/store'
import { KEYS, SECTION, expandGoal, parseGoal, plain, setGoal, useGoal } from '../lib/goal.ts'
import { Icon } from '../components/ui'
import bull from '../assets/login/bull-head-transparent.png'

export const GOAL_PREFIX = 'Build an AI agent that automates '
const EXAMPLES = ['Quoting for Sales managers at SMB manufacturers in India', 'RFQ responses for Procurement and sourcing teams in Europe', 'Quality engineering for Plant and maintenance managers in Southeast Asia']
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The cycling example: types out, holds, deletes, moves to the next. Ghost text only: it is never the input's value. */
function useMarquee(active: boolean): string {
  const [text, setText] = useState(EXAMPLES[0])
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (!active || reduce) return
    let i = 0, n = 0, dir: 1 | -1 = 1, t: ReturnType<typeof setTimeout>
    const tick = () => {
      const full = EXAMPLES[i]
      n += dir
      setText(full.slice(0, n))
      if (dir === 1 && n >= full.length) { dir = -1; t = setTimeout(tick, 1800); return }
      if (dir === -1 && n <= 0) { dir = 1; i = (i + 1) % EXAMPLES.length; t = setTimeout(tick, 350); return }
      t = setTimeout(tick, dir === 1 ? 38 : 18)
    }
    setText(''); t = setTimeout(tick, 300)
    return () => clearTimeout(t)
  }, [active, reduce])
  return text
}

/** Sends a typed goal: shown as the first chat message and expanded into the ISATVON draft. */
export function sendGoal(raw: string) {
  const text = raw.trim()
  if (!text) return
  const goal = parseGoal(text)
  setGoal({ goal, text, draft: expandGoal(goal), approved: true })
  setUi({ fdeGoals: /^build an ai agent/i.test(text) ? text : GOAL_PREFIX + (/^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text) })
}

/** Middle pane on Upload while the thread is empty and no goal is expanded yet. */
export function GoalCapture() {
  const PLEN = GOAL_PREFIX.length
  // The box starts with the fixed phrase as real text; the caret starts right after it (5 Nov 2026) and never goes inside it.
  const [value, setValue] = useState(GOAL_PREFIX)
  const [focus, setFocus] = useState(false)
  const ta = useRef<HTMLTextAreaElement>(null)
  // The examples cycle after the fixed phrase until the person types; they stop then and never write into the box.
  const example = useMarquee(value === GOAL_PREFIX)
  useEffect(() => { const e = ta.current; if (e) { e.focus(); e.setSelectionRange(PLEN, PLEN) } }, []) // focus when the goal pane first appears
  useEffect(() => { const e = ta.current; if (e) { e.style.height = 'auto'; e.style.height = `${Math.min(e.scrollHeight, 160)}px` } }, [value])
  const typed = value.slice(PLEN)
  const empty = !typed.trim()
  const send = () => { if (!empty) sendGoal(value) }
  return <div className="goal">
    <h3 className="goal-head">Name the agent and let the <img src={bull} alt="BuLLM" className="goal-bull" /> build it</h3>
    <p className="goal-lede">Type the goal. BuLL does the rest.</p>
    <div className="goal-box">
      {value === GOAL_PREFIX && <div className="goal-ghost" aria-hidden><span className="goal-ghost-pre">{GOAL_PREFIX}</span><span className="goal-ghost-tail">{example}</span></div>}
      <textarea ref={ta} className="goal-input" rows={1} value={value} aria-label="Agent goal"
        onChange={e => {
          if (e.target.value.startsWith(GOAL_PREFIX)) { setValue(e.target.value); return }
          // An edit landed inside the fixed phrase (drop, spell-check, autofill): restore it and put the caret after it.
          requestAnimationFrame(() => ta.current?.setSelectionRange(PLEN, PLEN))
        }}
        onSelect={e => { const t = e.currentTarget; if (t.selectionStart < PLEN || t.selectionEnd < PLEN) t.setSelectionRange(Math.max(t.selectionStart, PLEN), Math.max(t.selectionEnd, PLEN)) }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onKeyDown={e => {
          const t = e.currentTarget
          if (e.key === 'Backspace' && t.selectionStart <= PLEN && t.selectionEnd <= PLEN) { e.preventDefault(); return }
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
        }} />
      <button type="button" className="goal-send" aria-label="Send goal" aria-disabled={empty || undefined} disabled={empty} onClick={send}><Icon name="tb-arrow-right" size={18} /></button>
    </div>
    <p className="goal-hint">Example goals cycle here - start typing to replace them.</p>
    <p className="goal-flow">Quote Automation: enquiry → cost estimate → quote → approval → delivery</p>
  </div>
}

/** The goal and its ISATVON draft as the first chat messages. Rows edit in place; nothing here needs approving. */
export function GoalExpansion() {
  const draft = useGoal(s => s.draft), text = useGoal(s => s.text) || ''
  if (!draft) return null
  const save = (k: typeof KEYS[number], v: string) => setGoal(s => s.draft && plain(s.draft.sections[k]) !== v.trim() ? { draft: { ...s.draft, sections: { ...s.draft.sections, [k]: esc(v.trim()) } } } : {})
  return <>
    <div className="as-urow"><div className="as-uline"><div className="as-msg as-user"><p>{text || draft.goal.what}</p></div></div></div>
    <div className="as-arow"><span className="as-avatar" aria-hidden><img src={bull} alt="" /></span><div className="as-abody"><div className="as-msg as-bot goal-draft" key={draft.rev}>
      <p className="goal-draft-title"><strong>{draft.title}</strong><span>{draft.subtitle}</span></p>
      <dl className="goal-rows">{KEYS.map(k => <div key={k} className="goal-row"><dt><code>{k}</code>{SECTION[k]}</dt>
        <dd contentEditable suppressContentEditableWarning spellCheck role="textbox" aria-label={`${SECTION[k]} (editable)`}
          onBlur={e => save(k, e.currentTarget.innerText)}>{plain(draft.sections[k])}</dd></div>)}</dl>
      <p>Add your files on the left and I'll take it from there.</p>
    </div></div></div>
  </>
}
