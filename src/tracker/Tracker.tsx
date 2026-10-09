import { useRef, type KeyboardEvent } from 'react'
import { goScreen, usePath } from '../lib/route'
import { Icon } from '../components/ui'
import { Toasts } from '../components/shell'
import {
  STATUS_LABEL, screenByPath, TASKS, TRACKER_ITEMS, TRACKER_STATUSES, doneCount, subtasksOf, taskStatus,
  type TrackerItem, type TrackerStatus,
} from './trackerConfig.ts'
import { setTracker, updateSubtask, useStatuses, useTrackerStore } from './useTrackerStore'
import { DONE_RULE } from './evidence.ts'
import { stageMarkers, type StageMarker } from '../lib/bamUi.ts'

// Shape differs per status, so status never relies on colour alone.
const GLYPH: Record<TrackerStatus, string> = {
  not_started: 'circle', in_progress: 'half', needs_review: 'eye', done: 'check', blocked: 'alert',
}

function StatusGlyph({ status }: { status: TrackerStatus }) {
  return <span className={`glyph s-${status}`} title={STATUS_LABEL[status]}><Icon name={GLYPH[status]} size={12} /><span className="sr-only">{STATUS_LABEL[status]}</span></span>
}

// One stage of the stepper: marker, name, status. The blue halo marks the execution-current stage (from evidence);
// the viewed stage only gets a subtle selection tint, so navigating never moves progress.
export function StageStep({ item, marker, earned, last, open, currentScreen, done, total, prev, onToggle, setRef }: {
  item: TrackerItem; marker: StageMarker; earned: boolean; last: boolean; open: boolean; currentScreen?: string
  done: number; total: number; prev: number; onToggle: () => void; setRef?: (el: HTMLButtonElement | null) => void
}) {
  const { status, current } = marker
  const pos = currentScreen ? subtasksOf(item.id).findIndex(s => s.id === currentScreen) + 1 : 0
  return (
    <li className={`bst s-${status} ${current ? 'current' : ''} ${pos ? 'viewing' : ''} ${open ? 'open' : ''}`} aria-current={current ? 'step' : undefined}>
      {!last && <span className={`bst-line ${earned ? 'earned' : ''}`} aria-hidden />}
      <button ref={setRef} id={`tracker-stage-${item.id}`} className="bst-btn" aria-expanded={open} aria-controls={`tracker-panel-${item.id}`} onClick={onToggle}
        aria-label={`Stage ${item.id}: ${item.label}. ${STATUS_LABEL[status]}${current ? ', current stage' : ''}. ${done} of ${total} screens done.${pos ? ` You are viewing screen ${currentScreen}.` : ''}${prev ? ` ${prev} from a previous run.` : ''} Shows its screens.`}>
        {current && <span className="bst-chev" aria-hidden><Icon name="down" size={12} /></span>}
        <span className="bst-mark" aria-hidden>
          {status === 'done' ? <Icon name="check" size={14} /> : status === 'blocked' ? <Icon name="alert" size={13} /> : status === 'needs_review' ? <Icon name="eye" size={13} /> : item.id}
        </span>
        <span className="bst-label" aria-hidden>{item.shortLabel}</span>
        <span className="bst-status" aria-hidden title={`${done} of ${total} screens done${prev ? `; ${prev} from a previous RAG run (not counted)` : ''}`}>
          {status === 'blocked' || status === 'needs_review' ? <Icon name={GLYPH[status]} size={11} /> : null}
          {STATUS_LABEL[status]}<span className="bst-count"> · {done}/{total}</span>
          {pos > 0 && <span className="bst-pos">at {currentScreen}</span>}
        </span>
      </button>
    </li>
  )
}

// Selecting a screen shows its details and manual status; completion only changes through these controls.
function StatusMenu({ item }: { item: TrackerItem }) {
  const current = useStatuses()[item.id] ?? 'not_started'
  const loaded = useTrackerStore(t => t.loaded)
  const prev = useTrackerStore(t => t.previous.includes(item.id))
  const pinned = useTrackerStore(t => t.basis[item.id] !== undefined && t.basis[item.id] === t.evidence[item.id])
  return (
    <div className="status-menu">
      <div className="sm-head">
        <span className="sm-title"><span className="chip-num">{item.id}</span> {item.label}</span>
      </div>
      <p className="sm-desc">{item.description}</p>
      <p className="sm-rule"><Icon name="check" size={11} />{DONE_RULE[item.id]}{prev && ' Its current work is from a previous RAG run, so it counts as not started.'}{pinned && ' Set by hand; it returns to the evidence when the work changes.'}</p>
      <fieldset className="status-options" disabled={!loaded}>
        <legend className="sm-legend">Status{!loaded && ' (loading saved progress…)'} · updates from workflow evidence</legend>
        {TRACKER_STATUSES.map(st => (
          <label key={st} className={`status-opt s-${st} ${current === st ? 'on' : ''}`}>
            <input type="radio" name={`status-${item.id}`} value={st} checked={current === st} onChange={() => void updateSubtask(item.id, st)} />
            <Icon name={GLYPH[st]} size={12} />{STATUS_LABEL[st]}
          </label>
        ))}
      </fieldset>
    </div>
  )
}

function TrackerSubtaskRow({ stage, currentScreen, onClose }: { stage: TrackerItem; currentScreen?: string; onClose: () => void }) {
  const statuses = useStatuses()
  const selected = useTrackerStore(t => t.selected)
  const previous = useTrackerStore(t => t.previous)
  const picked = TRACKER_ITEMS.find(i => i.id === selected && i.parentId === stage.id)
  return (
    <section id={`tracker-panel-${stage.id}`} className="tracker-panel" aria-labelledby={`tracker-stage-${stage.id}`}>
      <div className="tracker-panel-head">
        <span className="tp-title">{stage.id} {stage.label}<span className="muted"> · {stage.description}</span></span>
        <span className="tp-manual"><Icon name="bolt" size={11} />Follows workflow evidence; you can also set a status by hand</span>
        <button className="btn btn-ghost sm tp-close" onClick={onClose}><Icon name="x" size={12} />Close</button>
      </div>
      <div className="tracker-chips">
        {subtasksOf(stage.id).map(s => {
          const st = statuses[s.id] ?? 'not_started'
          const prev = previous.includes(s.id)
          return (
            <button key={s.id} data-screen={s.id} className={`chip s-${st} ${prev ? 'prev' : ''} ${selected === s.id ? 'on' : ''} ${currentScreen === s.id ? 'current' : ''}`}
              aria-pressed={selected === s.id} aria-current={currentScreen === s.id ? 'page' : undefined}
              title={`${STATUS_LABEL[st]}${prev ? ' (from previous run)' : ''}. ${DONE_RULE[s.id]}`}
              aria-label={`${s.id} ${s.label}. ${prev ? 'From previous run' : STATUS_LABEL[st]}. ${DONE_RULE[s.id]}`}
              onClick={() => { setTracker({ selected: selected === s.id ? null : s.id }); goScreen(s.id) }}>
              <span className="chip-num" aria-hidden>{s.id}</span>
              <span className="chip-label" aria-hidden>{s.label}</span>
              {prev ? <span className="chip-prev">from previous run</span> : <StatusGlyph status={st} />}
            </button>
          )
        })}
      </div>
      {picked && <StatusMenu item={picked} />}
    </section>
  )
}

export function TrackerStrip() {
  const openTask = useTrackerStore(t => t.openTask)
  const selected = useTrackerStore(t => t.selected)
  const storageError = useTrackerStore(t => t.storageError)
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const openStage = TASKS.find(t => t.id === openTask)
  const currentScreen = screenByPath(usePath())?.id
  const currentStage = currentScreen?.split('.')[0]
  const statuses = useStatuses()
  const previous = useTrackerStore(t => t.previous)
  const { markers, earned, current } = stageMarkers(TASKS.map(t => taskStatus(t.id, statuses)))
  // Announce real workflow changes (current stage / its status) politely, not every poll.
  const announce = current < 0 ? (markers.every(m => m.status === 'done') ? 'All four stages done' : '') : `Current stage: ${TASKS[current].label}, ${STATUS_LABEL[markers[current].status]}`

  // Opening a stage also opens its first built screen; closing it leaves you where you are.
  const toggle = (id: string) => {
    const opening = openTask !== id
    setTracker({ openTask: opening ? id : null, selected: null })
    if (opening && currentStage !== id) {
      const first = subtasksOf(id)[0]
      if (first) goScreen(first.id)
    }
  }
  const close = () => {
    const id = openTask
    setTracker({ openTask: null, selected: null })
    if (id) triggers.current[id]?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !openTask) return
    if (selected) {
      // The detail (and any focused control in it) disappears; keep focus on the screen chip.
      document.querySelector<HTMLElement>(`.chip[data-screen="${selected}"]`)?.focus()
      setTracker({ selected: null })
    } else close()
  }

  return (
    <div className="tracker" onKeyDown={onKey}>
      <div className="tracker-line">
        <nav className="tracker-strip" aria-label="BAM stages">
          <ol className="bam-stepper">
            {TASKS.map((t, i) => (
              <StageStep key={t.id} item={t} marker={markers[i]} earned={earned[i] ?? false} last={i === TASKS.length - 1} open={openTask === t.id}
                currentScreen={currentStage === t.id ? currentScreen : undefined}
                done={doneCount(subtasksOf(t.id), statuses)} total={subtasksOf(t.id).length} prev={subtasksOf(t.id).filter(s => previous.includes(s.id)).length}
                onToggle={() => toggle(t.id)} setRef={el => { triggers.current[t.id] = el }} />
            ))}
          </ol>
          <span className="sr-only" aria-live="polite">{announce}</span>
        </nav>
        <Toasts />
      </div>
      {storageError && (
        <div className="tracker-error" role="alert"><Icon name="alert" size={12} />{storageError} Progress is kept on this device only, not shared or synced.</div>
      )}
      {openStage && <TrackerSubtaskRow stage={openStage} currentScreen={currentScreen} onClose={close} />}
    </div>
  )
}
