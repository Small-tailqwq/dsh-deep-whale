import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const packages = [
  ['skin-manager', false],
  ['maid-atelier', true],
  ['orca-link', true],
]

const skinPackages = []

for (const [directory, isSkin] of packages) {
  const manifest = JSON.parse(
    await readFile(new URL(`../${directory}/package.json`, import.meta.url), 'utf8'),
  )
  const packageName = manifest.name
  const expectedSpec = `github:Small-tailqwq/dsh-deep-whale#v${root.version}&path:/${directory}`

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
console.log(`root bundle contract ok: v${root.version}, ${packages.length} real client packages`)
