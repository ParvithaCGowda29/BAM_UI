import { useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from 'react'
import { useSession } from '../features/login/session'
import { paneOrder, paneOrderKey, swapPanes, type PaneId, type PaneOrder } from '../lib/paneLayout'

export const paneHeaderProps = {
  tabIndex: 0,
  title: 'Drag this header to swap panes. Or press Alt + Left/Right.',
  'data-pane-handle': '',
} as const
const paneAt = (el: Element | null) => el?.closest<HTMLElement>('[data-layout-pane]')?.dataset.layoutPane as PaneId | undefined
const canArrange = () => matchMedia('(min-width: 861px)').matches && !['1', '2'].includes(document.documentElement.dataset.uploadStage ?? '')
const readOrder = (key: string): PaneOrder => {
  try { return paneOrder(JSON.parse(localStorage.getItem(key) ?? 'null')) } catch { return paneOrder(null) }
}

/** CSS ordering keeps the actual pane nodes mounted, including chat, editors, drafts and scroll positions. */
export function PaneLayout({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const user = useSession() ?? ''
  const key = paneOrderKey(user)
  const [saved, setSaved] = useState(() => ({ key, order: readOrder(key) }))
  const order = saved.key === key ? saved.order : readOrder(key)
  const gesture = useRef<{ source: PaneId; x: number; y: number; moving: boolean } | null>(null)
  const [drag, setDrag] = useState<{ source: PaneId; target?: PaneId } | null>(null)
  const swap = (source: PaneId, target: PaneId) => {
    const next = swapPanes(order, source, target)
    setSaved({ key, order: next })
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Layout still works with storage blocked. */ }
  }
  const finish = (e: PointerEvent<HTMLDivElement>, cancel = false) => {
    const g = gesture.current
    gesture.current = null
    setDrag(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    const target = paneAt(document.elementFromPoint(e.clientX, e.clientY))
    if (!cancel && g?.moving && target && target !== g.source && canArrange()) swap(g.source, target)
  }
  const widths = { nav: 'var(--nav)', assistant: 'var(--assist)', workspace: 'minmax(0, 1fr)' }
  const style = { ...props.style, '--pane-columns': order.map(p => widths[p]).join(' '), '--order-nav': order.indexOf('nav'), '--order-assistant': order.indexOf('assistant'), '--order-workspace': order.indexOf('workspace') } as CSSProperties
  return <div {...props} style={style} data-pane-order={order.join(',')} data-pane-drag={drag?.source} data-pane-target={drag?.target}
    onPointerDownCapture={e => {
      const el = e.target as HTMLElement
      if (!canArrange() || e.button !== 0 || el.closest('button, a, input, textarea, select, [contenteditable="true"]') || !el.closest('[data-pane-handle]')) return
      const source = paneAt(el)
      if (!source) return
      gesture.current = { source, x: e.clientX, y: e.clientY, moving: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    }}
    onPointerMove={e => {
      const g = gesture.current
      if (!g) return
      if (!g.moving && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return
      g.moving = true
      e.preventDefault()
      setDrag({ source: g.source, target: paneAt(document.elementFromPoint(e.clientX, e.clientY)) })
    }}
    onPointerUp={e => finish(e)} onPointerCancel={e => finish(e, true)} onLostPointerCapture={() => { gesture.current = null; setDrag(null) }}
    onKeyDown={e => {
      if (e.key === 'Escape') { gesture.current = null; setDrag(null); return }
      if (!canArrange() || !e.altKey || !['ArrowLeft', 'ArrowRight'].includes(e.key) || !(e.target as HTMLElement).matches('[data-pane-handle]')) return
      const source = paneAt(e.target as HTMLElement)
      if (!source) return
      const target = order[order.indexOf(source) + (e.key === 'ArrowLeft' ? -1 : 1)]
      if (target) { e.preventDefault(); swap(source, target) }
    }}>
    {children}
  </div>
}
