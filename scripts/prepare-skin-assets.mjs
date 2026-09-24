import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { hashSkinAssets } from './skin-asset-inputs.mjs'

const root = resolve(process.argv[2] ?? '.')
const files = new Set()
for (const file of readdirSync(`${root}/src/client`).filter(file => file.endsWith('.ts'))) {
  const source = readFileSync(`${root}/src/client/${file}`, 'utf8')
  for (const match of source.matchAll(/skinAssetUrl\('([a-f0-9]{64}\.(?:png|webp))'\)/g)) files.add(match[1])
}
if (!files.size) throw new Error('No static skin artwork references found')
writeFileSync(`${root}/assets/runtime/manifest.json`, JSON.stringify([...files].sort(), null, 2) + '\n')
hashSkinAssets(createHash('sha256'), root)
