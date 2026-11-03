import { useSyncExternalStore } from 'react'

// Signed-in session: only the user's email, in sessionStorage (localStorage when "Keep me signed in" is ticked).
// Never a password or token. Production builds have no auth backend yet, so no session is ever read (fails closed).
// Pipeline's own session only (22 Oct 2026, per user): it is not shared with the Masters frontend (:5173) and nothing
// here reads or writes Masters' session state. Swap this module for the real auth provider.
const KEY = 'bullm_pipeline_session'
/** Masters (:5173). Switching signs out here first; Masters asks for its own sign-in. */
export const MASTERS_URL = 'http://localhost:5173'
const fromMasters = () => location.pathname === '/login' && new URLSearchParams(location.search).get('from') === 'masters'
const subs = new Set<() => void>()

function read(): string | null {
  if (!import.meta.env.DEV) return null
  try { return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) } catch { return null }
}
let email = read()
// Arriving from a Masters switch: always a full sign-in here, whatever was stored before.
if (fromMasters()) clear()

export const useSession = () =>
  useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb) } }, () => email)

export function startSession(user: string, keep: boolean) {
  try { (keep ? localStorage : sessionStorage).setItem(KEY, user) } catch { /* storage blocked: session lasts this page only */ }
  email = user
  subs.forEach(f => f())
}

function clear() {
  try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY) } catch { /* storage blocked */ }
  email = null
}

/** Profile menu Sign out; the App gate then shows /login (no banner). */
export function signOut() {
  clear()
  subs.forEach(f => f())
}

/** Profile menu Switch to Masters: the same cleanup as Sign out, then Masters with the switch hand-off flag. */
export function switchToMasters() {
  clear()
  location.assign(`${MASTERS_URL}/?from=pipeline`)
}

/** Login banner: true once when the page was opened by a Masters switch; the flag is stripped so a refresh drops it. */
export function consumeFromMasters(): boolean {
  if (!fromMasters()) return false
  const url = new URL(location.href)
  url.searchParams.delete('from')
  history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  return true
}

/** Same-origin relative path only: one leading "/", never "//" or "/\" (protocol-relative) or a scheme. Else home. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !/^\/(?![/\\])/.test(next) || /[\u0000-\u001f]/.test(next)) return '/'
  return next.startsWith('/login') ? '/' : next
}
