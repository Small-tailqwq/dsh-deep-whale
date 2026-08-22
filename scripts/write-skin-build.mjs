import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

const [skinRootArg, repository] = process.argv.slice(2)

if (!skinRootArg || !repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  console.error('usage: node scripts/write-skin-build.mjs <skin-root> <owner/repo>')
  process.exitCode = 2
} else {
  const skinRoot = resolve(skinRootArg)
  const manifestPath = resolve(skinRoot, 'skin.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (typeof manifest.dshCompatibility !== 'string' || !/^\d+\.\d+\.\d+rc\d+$/.test(manifest.dshCompatibility)) {
    throw new Error('skin.json.dshCompatibility must use x.y.zrcN form (for example 0.1.1rc2)')
  }
  const relPath = typeof manifest.id === 'string' && manifest.id !== '' ? manifest.id : basename(skinRoot)
  let sourceCommit
  try {
    const candidate = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: skinRoot,
      encoding: 'utf8',
      timeout: 5000,
    }).trim()
    if (/^[0-9a-f]{40}$/.test(candidate)) sourceCommit = candidate
  } catch {
    // A source archive can still produce a valid fingerprint; without a Git
    // ancestry anchor the manager conservatively reports differing builds as
    // incomparable instead of guessing an update direction.
  }
  const inputs = ['lib/client.js', 'lib/index.js', 'cordis.patch.yml', 'skin.json']
  const hash = createHash('sha256')

  for (const input of inputs) {
    const file = resolve(skinRoot, input)
    if (!existsSync(file)) throw new Error(`skin build fingerprint input is missing: ${input}`)
    const normalized = readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
    hash.update(`${input}\0${Buffer.byteLength(normalized)}\0`)
    hash.update(normalized)
  }

  const output = `${JSON.stringify({
    schema: 1,
    fingerprint: hash.digest('hex'),
    ...(sourceCommit === undefined ? {} : { sourceCommit }),
    repository,
    path: relPath,
  }, null, 2)}\n`
  const target = resolve(skinRoot, 'skin.build.json')
  const temporary = `${target}.tmp`
  writeFileSync(temporary, output)
  renameSync(temporary, target)
}
