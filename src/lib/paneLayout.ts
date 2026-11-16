export const DEFAULT_PANE_ORDER = ['nav', 'assistant', 'workspace'] as const
export type PaneId = typeof DEFAULT_PANE_ORDER[number]
export type PaneOrder = [PaneId, PaneId, PaneId]
export function paneOrder(value: unknown): PaneOrder {
  return Array.isArray(value) && value.length === 3 && new Set(value).size === 3 && value.every(p => DEFAULT_PANE_ORDER.includes(p))
    ? [...value] as PaneOrder : [...DEFAULT_PANE_ORDER]
}
export function swapPanes(order: PaneOrder, source: PaneId, target: PaneId): PaneOrder {
  const next = [...order] as PaneOrder
  const a = next.indexOf(source), b = next.indexOf(target)
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}
export const paneOrderKey = (user: string) => `bam-pane-order-v1:${user.trim().toLowerCase()}`
