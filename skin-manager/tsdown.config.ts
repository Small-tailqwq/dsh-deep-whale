import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { clientBundle } from '../orca-link/build/tsdown.client.ts'

const managerRoot = fileURLToPath(new URL('.', import.meta.url))
const entryPath = (entry: unknown): string => resolve(managerRoot, String(entry)).replaceAll('\\', '/')
const bundle = clientBundle(
  '@dsh-external/dsh-client-ui-skin-deep-whale-manager',
  ['src/index.ts', 'src/protocol.ts'],
  { portableCssModuleIds: true },
)

// The shared standalone preset is imported from orca-link, so Rolldown would
// otherwise anchor its relative entries at that preset's directory.
export default ({ env }: { env?: Record<string, unknown> }) => bundle({ env }).map(config => ({
  ...config,
  entry: Array.isArray(config.entry)
    ? config.entry.map(entryPath)
    : typeof config.entry === 'object' && config.entry !== null
      ? Object.fromEntries(Object.entries(config.entry).map(([key, entry]) => [key, entryPath(entry)]))
      : config.entry,
}))
