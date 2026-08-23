import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const root = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const packages = [
  ['skin-manager', false],
  ['maid-atelier', true],
  ['orca-link', true],
]
const dependencyRef = 'codex/test-umbrella-package'

const skinPackages = []

for (const [directory, isSkin] of packages) {
  const manifest = JSON.parse(
    await readFile(new URL(`../${directory}/package.json`, import.meta.url), 'utf8'),
  )
  const packageName = manifest.name
  const expectedSpec = `github:Small-tailqwq/dsh-deep-whale#${dependencyRef}&path:/${directory}`

  assert.equal(root.dependencies?.[packageName], expectedSpec, `${packageName} must use ${expectedSpec}`)
  assert.equal(manifest.dsh?.client?.platform, 'web', `${packageName} must declare dsh.client.platform=web`)
  assert.match(patch, new RegExp(`name: ['\"]${packageName.replaceAll('/', '\\/')}['\"]`))

  if (isSkin) {
    const skin = JSON.parse(
      await readFile(new URL(`../${directory}/skin.json`, import.meta.url), 'utf8'),
    )
    assert.equal(skin.package, packageName, `${directory}/skin.json package must match package.json name`)
    skinPackages.push(packageName)
  }
}

assert.deepEqual(root.dsh?.skinCollection?.packages, skinPackages)

// This test candidate resolves all children from the same remote branch. Keep
// the release-tag warning visible: before merge, dependencyRef must return to
// v${root.version}, and published tags must never be re-pointed.
const releaseTag = `v${root.version}`
let tagFound = false
try {
  tagFound = execFileSync('git', ['tag', '-l', releaseTag], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).trim() !== ''
} catch {
  console.warn(`warning: git unavailable, skipped ${releaseTag} existence check`)
}
if (!tagFound) {
  console.warn(`warning: git tag ${releaseTag} does not exist yet; the release flow must create and push it at the published commit`)
}

console.log(`root bundle contract ok: v${root.version}, ${packages.length} real client packages, ref ${dependencyRef}`)
