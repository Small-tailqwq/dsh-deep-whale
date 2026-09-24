import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

/** Extend the original fingerprint without changing skins that have no static artwork. */
export function hashSkinAssets(hash, skinRoot) {
  const manifest = 'assets/runtime/manifest.json'
  if (!existsSync(join(skinRoot, manifest))) return
  const text = readFileSync(join(skinRoot, manifest), 'utf8').replaceAll('\r\n', '\n')
  const files = JSON.parse(text)
  if (!Array.isArray(files) || files.some(file => typeof file !== 'string' || !/^[a-f0-9]{64}\.(webp|png)$/.test(file))) {
    throw new Error('Invalid skin artwork manifest')
  }
  hash.update(`${manifest}\0${Buffer.byteLength(text)}\0`).update(text)
  for (const file of [...new Set(files)].sort()) {
    const input = `assets/runtime/${file}`
    const bytes = readFileSync(join(skinRoot, input))
    if (createHash('sha256').update(bytes).digest('hex') !== file.split('.')[0]) throw new Error(`Artwork content hash mismatch: ${file}`)
    hash.update(`${input}\0${bytes.length}\0`).update(bytes)
  }
}
