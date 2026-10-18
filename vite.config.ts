import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Relative base: the built page refers to its files as ./assets/…, so it works wherever it is
// served from (e.g. a folder of a shared site behind a reverse proxy), not only from the root.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})