import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({ test: {
  setupFiles: [fileURLToPath(new URL('./style-audit-setup.ts', import.meta.url))],
  testTimeout: 30000,
  hookTimeout: 30000,
  maxWorkers: 2,
} })
