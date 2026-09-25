import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // A platform module the shell provides at runtime (see
      // src/client/primitives.d.ts); tests render against a markup double.
      '@deepseek-ai/dsh-client-ui-primitives': fileURLToPath(new URL('./tests/fixtures/primitives.tsx', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.spec.{ts,tsx}'],
    pool: 'forks',
  },
})
