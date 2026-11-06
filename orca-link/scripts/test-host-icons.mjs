import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { renderHostIcons } from './render-host-icons.mjs'

const { values } = parseArgs({ options: {
  source: { type: 'string' }, ref: { type: 'string' }, write: { type: 'boolean', default: false },
} })
if (!values.source) throw new Error('Usage: npm run test:host-icons -- --source <official-dsh-checkout> [--ref <tag-or-sha>] [--write]')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = join(root, 'tests/fixtures/dsh-icons.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
const ref = values.ref ?? fixture.hostCommit
const rendered = renderHostIcons(resolve(values.source), ref)
// Expected meanings are reviewed fixture data, never inferred from the matcher.
const names = new Map(fixture.icons.map(icon => [icon.component, icon.name]))
const target = {
  ...rendered,
  loaders: fixture.loaders,
  icons: rendered.icons.map(icon => ({ ...icon, name: names.get(icon.component) ?? null })),
}
const added = target.icons.filter(icon => !names.has(icon.component)).map(icon => icon.component)
const present = new Set(target.icons.map(icon => icon.component))
const removed = fixture.icons.filter(icon => !present.has(icon.component)).map(icon => icon.component)
console.log(`DSH ${ref} @ ${target.hostCommit}: ${target.icons.length} SVG variants`)
for (const error of rendered.errors) console.error(`${error.source}: ${error.error}`)
if (added.length) console.log(`Added (review name): ${added.join(', ')}`)
if (removed.length) console.log(`Removed (review callers): ${removed.join(', ')}`)
const directory = mkdtempSync(join(tmpdir(), 'orca-host-icons-'))
const path = join(directory, 'icons.json')
writeFileSync(path, `${JSON.stringify(target, null, 2)}\n`)
try {
  if (values.write) writeFileSync(fixturePath, readFileSync(path))
  const result = spawnSync(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'tests/icons.spec.ts'], {
    cwd: root, stdio: 'inherit', env: { ...process.env, DSH_ICON_FIXTURE: path },
  })
  if (result.error) throw result.error
  process.exitCode = (result.status ?? 1) || (added.length || removed.length || rendered.errors.length ? 1 : 0)
} finally {
  unlinkSync(path)
  rmdirSync(directory)
}
