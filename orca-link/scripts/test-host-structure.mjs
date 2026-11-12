import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: {
  source: { type: 'string' }, ref: { type: 'string' },
} })
if (!values.source || !values.ref) {
  throw new Error('Usage: npm run test:host-structure -- --source <official-dsh-checkout> --ref <tag-or-sha>')
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = JSON.parse(readFileSync(join(root, 'tests/fixtures/conversation-width.json'), 'utf8'))
const git = (...args) => execFileSync('git', ['-C', resolve(values.source), ...args], {
  encoding: 'utf8', maxBuffer: 1024 * 1024,
}).trim()
const commit = git('rev-parse', '--verify', '--end-of-options', `${values.ref}^{commit}`)
const paths = Object.keys(fixture.variants[0].sources)
const blobs = Object.fromEntries(paths.map(path => [path, git('rev-parse', '--verify', `${commit}:${path}`)]))
const differences = variant => paths.filter(path => variant.sources[path] !== blobs[path])
const reviewed = fixture.variants.find(variant => differences(variant).length === 0)
console.log(`DSH ${commit}: ${fixture.contract} (conversation width handles only)`)

if (!reviewed) {
  const nearest = [...fixture.variants].sort((a, b) => differences(a).length - differences(b).length)[0]
  console.error(`NEEDS_REVALIDATION: no reviewed fixture has these source blobs; nearest: ${nearest.hostCommit}`)
  for (const path of differences(nearest)) {
    console.error(`${path}\n  reviewed ${nearest.sources[path]}\n  target   ${blobs[path]}`)
  }
  console.error('Review the target DOM and source diff, then update the fixture. Tests were not run.')
  process.exitCode = 1
} else {
  console.log(`Source bindings match ${reviewed.hostCommit} (${reviewed.label}).`)
  const directory = mkdtempSync(join(tmpdir(), 'orca-host-structure-'))
  const report = join(directory, 'tests.json')
  writeFileSync(report, '')
  try {
    const result = spawnSync(process.execPath, [
      join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'tests/apply.spec.ts', '-t', 'styles both width handles',
      '--reporter=default', '--reporter=json', `--outputFile=${report}`,
    ], { cwd: root, stdio: 'inherit' })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
    if (result.status === 0) {
      const summary = JSON.parse(readFileSync(report, 'utf8'))
      if (summary.numPassedTests !== fixture.variants.length) {
        throw new Error(`Expected ${fixture.variants.length} width-handle cases, got ${summary.numPassedTests}; check the test filter and skipped cases.`)
      }
    }
  } finally {
    unlinkSync(report)
    rmdirSync(directory)
  }
}
