import { mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import base from '../vitest.config.ts'

export default mergeConfig(base, { test: {
  setupFiles: [fileURLToPath(new URL('./style-audit-setup.ts', import.meta.url))],
  testTimeout: 30000,
  hookTimeout: 30000,
  maxWorkers: 2,
} })
