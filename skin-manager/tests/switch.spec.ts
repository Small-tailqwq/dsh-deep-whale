import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SkinCatalogEntry } from '../src/contract.ts'
import {
  discoverInstalledSkins,
  MANAGED_END,
  MANAGED_START,
  renderManagedBlock,
  resolvePatchTargets,
  stripManagedBlock,
  switchPatch,
  useSkin,
} from '../src/index.ts'

const catalog: SkinCatalogEntry[] = [
  { id: 'maid-atelier', name: 'Maid', package: '@test/maid', wiringId: 'ui-skin-maid', bodyAttr: 'data-maid', order: 5 },
  { id: 'deepcel', name: 'Deepcel', package: '@test/deepcel', wiringId: 'ui-skin-deepcel', bodyAttr: 'data-deepcel', order: 10 },
]

describe('generic skin switch patch', () => {
  it('keeps user YAML and switches an arbitrary discovered third-party skin', () => {
    const original = [
      '- insert:',
      '    - id: user-plugin',
      '',
      MANAGED_START,
      '- id: old-skin',
      '  disabled: true',
      MANAGED_END,
      '',
      '# tail owned by user',
    ].join('\n')
    const next = switchPatch(original, 'deepcel', catalog)
    expect(next).toContain('user-plugin')
    expect(next).toContain('# tail owned by user')
    expect(next.split(MANAGED_START)).toHaveLength(2)
    expect(next).toContain('- id: ui-skin-maid\n  disabled: true')
    expect(next).toContain('- id: ui-skin-deepcel\n  disabled: false')
  })

  it('official disables every discovered skin', () => {
    const managed = renderManagedBlock('official', catalog)
    expect(managed.match(/disabled: true/g)).toHaveLength(2)
  })

  it('replaces an empty YAML sequence with valid patch rows', () => {
    const next = switchPatch('[]\n', 'maid-atelier', catalog)
    expect(next).not.toMatch(/^\[\]/)
    expect(next).toContain('- id: ui-skin-maid\n  disabled: false')
  })

  it('rejects an incomplete ownership block', () => {
    expect(() => stripManagedBlock(`${MANAGED_START}\n- broken`)).toThrow('managed-section-is-incomplete')
  })

  it('targets the profile and higher-priority home patch together', () => {
    expect(resolvePatchTargets({ DSH_HOME: 'C:/dsh-home', DSH_SKIN_PROFILE: 'demo' }, 'C:/workspace'))
      .toEqual([
        expect.stringMatching(/dsh-home[\\/]profiles[\\/]demo[\\/]cordis\.patch\.yml$/),
        expect.stringMatching(/dsh-home[\\/]cordis\.patch\.yml$/),
      ])
  })

  it('discovers any installed package with a valid skin manifest', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-catalog-'))
    const patch = join(directory, 'cordis.patch.yml')
    const skinJson = join(directory, 'node_modules', '@test', 'deepcel', 'skin.json')
    try {
      mkdirSync(dirname(skinJson), { recursive: true })
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ dependencies: { '@test/deepcel': 'link:test' } }))
      writeFileSync(skinJson, JSON.stringify({
        id: 'deepcel', name: 'Deepcel', package: '@test/deepcel', bodyAttr: 'data-deepcel',
        wiring: { id: 'ui-skin-deepcel' }, order: 7,
      }))
      expect(discoverInstalledSkins(patch)).toEqual([
        { id: 'deepcel', name: 'Deepcel', package: '@test/deepcel', wiringId: 'ui-skin-deepcel', bodyAttr: 'data-deepcel', order: 7 },
      ])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('atomically updates both live layers while preserving their YAML', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-manager-'))
    const profile = join(directory, 'profile.yml')
    const home = join(directory, 'home.yml')
    try {
      writeFileSync(profile, '- id: user-profile\n  disabled: false\n')
      writeFileSync(home, '- id: user-home\n  disabled: false\n')
      useSkin('official', [profile, home], catalog)
      expect(readFileSync(profile, 'utf8')).toContain('user-profile')
      expect(readFileSync(home, 'utf8')).toContain('user-home')
      expect(readFileSync(profile, 'utf8')).toContain('ui-skin-maid\n  disabled: true')
      expect(readFileSync(home, 'utf8')).toContain('ui-skin-deepcel\n  disabled: true')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
