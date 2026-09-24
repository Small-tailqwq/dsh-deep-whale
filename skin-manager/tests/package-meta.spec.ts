/**
 * DSH 0.1.7's Plugins page reads each package's display metadata without
 * running it: `locale/<lang>.json#meta.{title,description}` through the
 * package's `./locale/*.json` export, and `package.json#icon` as a relative
 * SVG/PNG/JPEG/WebP of at most 256 KiB inside the package. These specs pin
 * that contract for all three packages this repository ships.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repo = resolve(__dirname, '../..')
const packages = ['skin-manager', 'maid-atelier', 'orca-link'] as const

function read(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, any>
}

describe.each(packages)('%s plugin metadata', (dir) => {
  const root = join(repo, dir)
  const manifest = read(join(root, 'package.json'))

  it('exports and ships its locale dictionaries', () => {
    expect(manifest.exports['./locale/*.json']).toBe('./locale/*.json')
    expect(manifest.files).toContain('locale/*.json')
  })

  it.each(['en', 'zh'])('has a short %s title and a description', (lang) => {
    const meta = read(join(root, 'locale', `${lang}.json`)).meta
    expect(typeof meta.title).toBe('string')
    expect(meta.title.trim()).not.toBe('')
    // The card title sits beside an icon and a switch; keep it a name, not a sentence.
    expect([...meta.title].length).toBeLessThanOrEqual(lang === 'zh' ? 8 : 16)
    expect(typeof meta.description).toBe('string')
    expect(meta.description.trim()).not.toBe('')
  })

  it('declares the DSH range the host admits it on, without asking pnpm to install DSH', () => {
    // Skins stop at the next minor so an unadapted skin falls back to the
    // official UI; the manager stays usable so it can offer the manual override.
    const range = dir === 'skin-manager' ? '>=0.1.7-rc.1' : '>=0.1.7-rc.1 <0.1.8-0'
    expect(manifest.peerDependencies['@deepseek-ai/dsh']).toBe(range)
    expect(manifest.peerDependenciesMeta['@deepseek-ai/dsh']).toEqual({ optional: true })
  })

  it('declares a shipped icon the host accepts', () => {
    const icon = manifest.icon as string
    expect(icon).toMatch(/^[^/\\:][^:]*$/)
    expect(['.svg', '.png', '.jpg', '.jpeg', '.webp']).toContain(extname(icon).toLowerCase())
    const file = join(root, icon)
    expect(existsSync(file)).toBe(true)
    expect(statSync(file).size).toBeLessThanOrEqual(256 * 1024)
    expect(manifest.files).toContain(icon)
  })
})
