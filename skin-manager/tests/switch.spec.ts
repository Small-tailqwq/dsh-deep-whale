import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SkinCatalogEntry } from '../src/contract.ts'
import {
  discoverInstalledSkins,
  enabledSkins,
  ensureSafeInitialState,
  MANAGED_END,
  MANAGED_START,
  renderManagedBlock,
  readSkinStates,
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

  it('keeps host settings rows that DSH appended inside the managed block', () => {
    /* DSH 0.1.7+ appends settings to the end of the profile patch, i.e. into this block. */
    const original = [
      '- id: user-plugin',
      '  disabled: false',
      '',
      MANAGED_START,
      '- id: ui-skin-maid',
      '  disabled: false',
      '- id: ui-skin-deepcel',
      '  disabled: true',
      '- id: ui-skin-retired',
      '  disabled: true',
      '- id: ui-theme',
      '  config:',
      '    preference: light',
      '',
      '    note: kept across blank lines',
      '# welcome notice state',
      '- id: ui-settings-general',
      '  config:',
      '    welcomeAccepted: true',
      '- config:',
      '    model: deepseek-chat',
      '  id: agent-default-model',
      MANAGED_END,
      '',
    ].join('\n')
    const once = switchPatch(original, 'deepcel', catalog)
    const twice = switchPatch(once, 'maid-atelier', catalog)
    for (const next of [once, twice]) {
      const [outside, managed] = next.split(MANAGED_START)
      expect(outside).toContain('- id: user-plugin')
      expect(outside).toContain('- id: ui-theme\n  config:\n    preference: light\n\n    note: kept across blank lines')
      expect(outside).toContain('# welcome notice state\n- id: ui-settings-general\n  config:\n    welcomeAccepted: true')
      expect(outside).toContain('- config:\n    model: deepseek-chat\n  id: agent-default-model')
      expect(outside).not.toContain('ui-skin-')
      expect(managed).not.toMatch(/ui-theme|ui-settings-general|agent-default-model/)
      expect(next.split(MANAGED_START)).toHaveLength(2)
      expect(next.match(/- id: ui-theme/g)).toHaveLength(1)
    }
    expect(twice).toContain('- id: ui-skin-maid\n  disabled: false')
    expect(twice).toContain('- id: ui-skin-deepcel\n  disabled: true')
    expect(twice).not.toContain('ui-skin-retired')
  })

  it('drops the empty sequence when hoisted rows follow it', () => {
    const source = `[]\n\n${MANAGED_START}\n- id: ui-theme\n  config:\n    preference: dark\n${MANAGED_END}\n`
    const next = switchPatch(source, 'maid-atelier', catalog)
    expect(next).not.toMatch(/^\[\]/m)
    expect(next).toContain('- id: ui-theme\n  config:\n    preference: dark')
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

  it('preserves default-template comments while replacing its empty sequence', () => {
    const source = '# User patch entries go below.\n# Keep this comment.\n[]\n'
    const next = switchPatch(source, 'maid-atelier', catalog)
    expect(next).toContain('# Keep this comment.')
    expect(next).not.toMatch(/^\s*\[\]\s*$/m)
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
        wiring: { id: 'ui-skin-deepcel' }, dshCompatibility: '0.1.1rc2', order: 7,
        tagline: '一款模仿 excel 的 dsh 皮肤', taglineEn: 'A spreadsheet-style DSH skin',
      }))
      expect(discoverInstalledSkins(patch)).toEqual([
        {
          id: 'deepcel', name: 'Deepcel', package: '@test/deepcel', wiringId: 'ui-skin-deepcel',
          bodyAttr: 'data-deepcel', dshCompatibility: '0.1.1rc2', order: 7,
          tagline: '一款模仿 excel 的 dsh 皮肤', taglineEn: 'A spreadsheet-style DSH skin',
        },
      ])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('keeps a skin installed under a legacy alias dependency key visible', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-alias-'))
    const patch = join(directory, 'cordis.patch.yml')
    const packageDir = join(directory, 'node_modules', '@test', 'legacy-alias')
    try {
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ dependencies: { '@test/legacy-alias': 'link:real-name' } }))
      writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: '@test/real-name', version: '0.0.0' }))
      writeFileSync(join(packageDir, 'skin.json'), JSON.stringify({
        id: 'aliased', name: 'Aliased', package: '@test/real-name', bodyAttr: 'data-aliased',
        wiring: { id: 'ui-skin-aliased' },
      }))
      expect(discoverInstalledSkins(patch).map(skin => skin.package)).toEqual(['@test/real-name'])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('drops a skin manifest that does not name its own package', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-identity-'))
    const patch = join(directory, 'cordis.patch.yml')
    const packageDir = join(directory, 'node_modules', '@test', 'impostor')
    try {
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ dependencies: { '@test/impostor': 'link:other' } }))
      writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: '@test/real-name', version: '0.0.0' }))
      writeFileSync(join(packageDir, 'skin.json'), JSON.stringify({
        id: 'impostor', name: 'Impostor', package: '@test/other', bodyAttr: 'data-impostor',
        wiring: { id: 'ui-skin-impostor' },
      }))
      expect(discoverInstalledSkins(patch)).toEqual([])
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

  it('merges explicit states with the home layer taking precedence', () => {
    const profile = '- id: ui-skin-maid\n  disabled: false\n- id: ui-skin-deepcel\n  disabled: true\n'
    const home = '- id: ui-skin-maid\n  disabled: true\n- id: ui-skin-deepcel\n  disabled: false\n'
    expect(readSkinStates(profile, catalog)).toEqual(new Map([
      ['ui-skin-maid', false],
      ['ui-skin-deepcel', true],
    ]))
    expect(enabledSkins([profile, home], catalog).map(skin => skin.id)).toEqual(['deepcel'])
  })

  it('only treats a direct disabled property as the skin state', () => {
    const source = [
      '- id: ui-skin-maid',
      '  config:',
      '    disabled: false',
      '  disabled: true',
    ].join('\n')
    expect(readSkinStates(source, catalog).get('ui-skin-maid')).toBe(true)
  })

  it('ignores skin ids nested inside another plugin config', () => {
    const source = [
      '- id: ui-skin-maid',
      '  disabled: false',
      '- id: skin-hub',
      '  config:',
      '    skins:',
      '      - id: ui-skin-deepcel',
      '        disabled: true',
    ].join('\n')
    expect(readSkinStates(source, catalog).get('ui-skin-deepcel')).toBeUndefined()
    expect(enabledSkins([source, ''], catalog).map(skin => skin.id)).toEqual(['maid-atelier', 'deepcel'])
  })

  it('fails safe to official when two installed skins have no exclusion state', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-startup-'))
    const profile = join(directory, 'profile.yml')
    const home = join(directory, 'home.yml')
    try {
      writeFileSync(profile, '# default profile patch\n[]\n')
      writeFileSync(home, '- id: user-home\n  disabled: false\n')
      expect(ensureSafeInitialState([profile, home], catalog)).toBe(true)
      for (const path of [profile, home]) {
        const source = readFileSync(path, 'utf8')
        expect(source).toContain('ui-skin-maid\n  disabled: true')
        expect(source).toContain('ui-skin-deepcel\n  disabled: true')
      }
      expect(readFileSync(profile, 'utf8')).toContain('# default profile patch')
      expect(readFileSync(home, 'utf8')).toContain('user-home')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('leaves an existing single-skin selection untouched', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-startup-safe-'))
    const profile = join(directory, 'profile.yml')
    const home = join(directory, 'home.yml')
    const safe = '- id: ui-skin-maid\n  disabled: false\n- id: ui-skin-deepcel\n  disabled: true\n'
    try {
      writeFileSync(profile, safe)
      writeFileSync(home, safe)
      expect(ensureSafeInitialState([profile, home], catalog)).toBe(false)
      expect(readFileSync(profile, 'utf8')).toBe(safe)
      expect(readFileSync(home, 'utf8')).toBe(safe)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
