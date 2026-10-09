// Laya SOW judge service: POST /judge { requirements, facts } -> JudgeResult. GET /health.
// npm start (Node >= 22). First start downloads the Laya ONNX bundle (~1.7 GB) to ~/.cache/receptron-laya (LAYA_CACHE).
// The workbench reaches it through the Vite proxy at /laya (LAYA_URL, default http://localhost:8787).
import { createServer } from 'node:http'
import { Laya } from '@receptron/laya'
import { judgeSow, type JudgeRequest, type SystemOne } from './judge.ts'

const PORT = Number(process.env.PORT ?? 8787)
let laya: Awaited<ReturnType<typeof Laya.load>> | undefined
let loadError: string | undefined
let progress = ''
console.log('Loading Laya (first run downloads ~1.7 GB)...')
Laya.load({ onProgress: ({ file, received, total }) => { progress = total ? `${file} ${Math.round((received / total) * 100)}%` : `${file} ${(received / 1048576).toFixed(0)} MB` } })
  .then(l => { laya = l; console.log('Laya ready.') }, e => { loadError = (e as Error).message; console.error('Laya failed to load:', loadError) })

const send = (res: import('node:http').ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, laya ? 200 : 503, { ready: !!laya, error: loadError, progress })
  if (req.method !== 'POST' || req.url !== '/judge') return send(res, 404, { error: 'POST /judge or GET /health' })
  if (!laya) return send(res, 503, { error: loadError ?? `Laya is still loading (${progress || 'starting'})` })
  let raw = ''
  req.on('data', c => { raw += c; if (raw.length > 2e6) req.destroy() })
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw) as JudgeRequest
      const t0 = Date.now()
      const result = await judgeSow(body, laya!.systemOne.bind(laya) as unknown as SystemOne)
      send(res, 200, { ...result, ms: Date.now() - t0 })
    } catch (e) { send(res, 400, { error: (e as Error).message }) }
  })
}).listen(PORT, () => console.log(`Laya judge on http://localhost:${PORT}`))
