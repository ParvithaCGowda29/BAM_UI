import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Always serve on 5174; fail loudly instead of drifting to another port.
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
})
