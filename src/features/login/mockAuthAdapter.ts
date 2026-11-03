// Mock sign-in, development only. Replace `signInRequest` with the real backend call; nothing else depends on it.
// Production builds fail closed: every sign-in is refused (no bypass). The password is never stored, logged or echoed.

export type SignInResult = { ok: true; email: string } | { ok: false; reason: 'invalid' | 'unavailable' }

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function signInRequest(email: string, password: string): Promise<SignInResult> {
  if (!import.meta.env.DEV) return { ok: false, reason: 'unavailable' }
  await new Promise(r => setTimeout(r, 700))
  return EMAIL_RE.test(email) && password.length >= 8 ? { ok: true, email } : { ok: false, reason: 'invalid' }
}
