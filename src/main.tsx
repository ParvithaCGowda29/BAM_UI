import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './v3.css'
import './ingestion.css'
import './declutter.css'
import './rag-seamless.css'
import App from './App'

const root = createRoot(document.getElementById('root')!)
// Dev-only component preview (sample data): /?preview=bam. Dropped from production builds.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === 'bam')
  void import('./dev/BamPreview').then(m => root.render(<StrictMode><m.BamPreview /></StrictMode>))
else root.render(<StrictMode><App /></StrictMode>)
