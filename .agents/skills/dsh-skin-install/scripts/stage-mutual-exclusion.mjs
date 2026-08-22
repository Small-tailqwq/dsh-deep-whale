#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const USAGE = 'Usage: node stage-mutual-exclusion.mjs --target <skin-id|official> [--profile <name>] [--dsh-home <path>]'

function fail(message) {
  console.error(`${message}\n${USAGE}`)
  process.exit(1)
}

function option(name) {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  const value = process.argv[index + 1]
  if (value === undefined || value.startsWith('--')) fail(`missing value for ${name}`)
  return value
}

const profile = option('--profile') ?? 'web'
const target = option('--target')
const dshHome = resolve(option('--dsh-home') ?? process.env.DSH_HOME ?? join(homedir(), '.dsh'))
if (target === undefined) fail('missing required option --target')
if (!/^[a-zA-Z0-9._-]+$/.test(profile)) fail(`invalid profile: ${profile}`)

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const catalog = []
for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const manifestPath = join(repoRoot, entry.name, 'skin.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (typeof manifest.id !== 'string' || typeof manifest.package !== 'string' || typeof manifest.wiring?.id !== 'string') {
    fail(`invalid skin manifest: ${manifestPath}`)
  }
  catalog.push({
    id: manifest.id,
    name: typeof manifest.name === 'string' ? manifest.name : manifest.id,
    package: manifest.package,
    wiringId: manifest.wiring.id,
    bodyAttr: typeof manifest.bodyAttr === 'string' ? manifest.bodyAttr : '',
    order: typeof manifest.order === 'number' ? manifest.order : 0,
  })
}
catalog.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
if (catalog.length === 0) fail(`no skin.json manifests found under ${repoRoot}`)
if (target !== 'official' && !catalog.some(skin => skin.id === target)) fail(`unknown target skin: ${target}`)

const managerModule = join(repoRoot, 'skin-manager', 'lib', 'index.js')
if (!existsSync(managerModule)) fail(`missing committed manager bundle: ${managerModule}`)
const { useSkin } = await import(pathToFileURL(managerModule).href)
const patchPaths = [
  join(dshHome, 'profiles', profile, 'cordis.patch.yml'),
  join(dshHome, 'cordis.patch.yml'),
]
useSkin(target, patchPaths, catalog)

console.log(JSON.stringify({
  target,
  skins: catalog.map(skin => ({ id: skin.id, wiringId: skin.wiringId, disabled: skin.id !== target })),
  patchPaths,
}, null, 2))
