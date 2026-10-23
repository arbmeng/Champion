import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Champion/',
  esbuild: { jsx: 'automatic' },
  build: { chunkSizeWarningLimit: 700 },
})
