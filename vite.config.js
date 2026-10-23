import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Emits sw.js with the full list of built files so the app shell is precached and works offline.
function serviceWorker() {
  return {
    name: 'champion-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
      const extra = ['./', 'manifest.webmanifest', 'content.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-180.png', 'icons/icon.svg']
      const precache = [...new Set([...files.filter((f) => !f.endsWith('.map')), ...extra])]
      const version = createHash('sha1').update(files.join('|') + files.map((f) => bundle[f].code?.length ?? bundle[f].source?.length ?? 0).join(',')).digest('hex').slice(0, 10)
      const source = readFileSync(new URL('./src/sw.template.js', import.meta.url), 'utf8').replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  base: '/Champion/',
  esbuild: { jsx: 'automatic' },
  plugins: [serviceWorker()],
  build: { chunkSizeWarningLimit: 700 },
})
