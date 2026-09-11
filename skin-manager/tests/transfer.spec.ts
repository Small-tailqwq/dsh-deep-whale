import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import {
  buildPreferencesExport,
  defaultExportFileName,
  importPreferencesFromText,
  parsePreferencesExport,
  PREFERENCES_EXPORT_SCHEMA,
  PREFERENCES_IMPORT_MAX_BYTES,
  PreferencesImportError,
  serializePreferencesExport,
  validatePreferencesExport,
} from '../src/client/transfer.ts'

const definition: SkinCustomizationDefinition = {
  protocol: 2,
  skinId: 'maid-atelier',
  title: 'Maid',
  settings: [
    { key: 'artwork', type: 'boolean', label: 'Art', defaultValue: true },
    {
      key: 'font',
      type: 'select',
      label: 'Font',
      defaultValue: 'system',
      options: [{ value: 'system', label: 'System' }, { value: 'serif', label: 'Serif' }],
    },
    {
      key: 'sfw',
      type: 'visibility-schedule',
      label: 'SFW',
      defaultValue: { enabled: false, outside: 'visible', ranges: [] },
    },
  ],
  apply() {},
}

const otherDefinition: SkinCustomizationDefinition = {
  protocol: 2,
  skinId: 'orca-link',
  title: 'Orca',
  settings: [
    { key: 'character', type: 'boolean', label: 'Character', defaultValue: true },
  ],
  apply() {},
}

describe('preferences export envelope', () => {
  it('builds a versioned envelope from a raw snapshot', () => {
    const exported = buildPreferencesExport(
      { 'maid-atelier': { artwork: false, font: 'serif' } },
      new Date('2026-09-11T10:30:00.000Z'),
    )
    expect(exported).toEqual({
      schema: 1,
      source: 'dsh-skin-manager',
      exportedAt: '2026-09-11T10:30:00.000Z',
      preferences: { 'maid-atelier': { artwork: false, font: 'serif' } },
    })
  })

  it('strips undefined blocks and clones the inner records', () => {
    const source = { 'maid-atelier': { artwork: true }, 'orca-link': undefined as unknown as Record<string, unknown> }
    const exported = buildPreferencesExport(source)
    expect(exported.preferences).toEqual({ 'maid-atelier': { artwork: true } })
    expect(exported.preferences['maid-atelier']).not.toBe(source['maid-atelier'])
  })

  it('serializes with stable key order and a trailing newline', () => {
    const text = serializePreferencesExport(buildPreferencesExport({ 'maid-atelier': { artwork: false } }))
    expect(text.endsWith('\n')).toBe(true)
    expect(text.startsWith('{\n  "schema":')).toBe(true)
    expect(text).toContain('"source": "dsh-skin-manager"')
  })

  it('round-trips through serialize → parse losslessly', () => {
    const original = buildPreferencesExport({ 'maid-atelier': { artwork: false, font: 'serif' } })
    const round = parsePreferencesExport(serializePreferencesExport(original))
    expect(round).toEqual(original)
  })

  it('produces a date-scoped download filename', () => {
    expect(defaultExportFileName(new Date('2026-09-11T10:30:00.000Z'))).toBe('dsh-skin-preferences-2026-09-11.json')
  })
})

describe('preferences import parsing', () => {
  it('rejects empty payloads', () => {
    expect(() => parsePreferencesExport('')).toThrow(PreferencesImportError)
    try {
      parsePreferencesExport('')
    } catch (error) {
      expect((error as PreferencesImportError).code).toBe('empty')
    }
  })

  it('rejects payloads exceeding the size ceiling', () => {
    const huge = '{' + '"x":'.repeat(PREFERENCES_IMPORT_MAX_BYTES) + '1}'
    expect(() => parsePreferencesExport(huge)).toThrow(PreferencesImportError)
  })

  it('rejects malformed JSON', () => {
    expect(() => parsePreferencesExport('{not json')).toThrow(PreferencesImportError)
    try {
      parsePreferencesExport('{not json')
    } catch (error) {
      expect((error as PreferencesImportError).code).toBe('invalid-json')
    }
  })

  it('rejects unsupported schema versions', () => {
    const text = JSON.stringify({ schema: 99, source: 'dsh-skin-manager', exportedAt: 'x', preferences: {} })
    expect(() => parsePreferencesExport(text)).toThrow(PreferencesImportError)
  })

  it('rejects unknown source markers', () => {
    const text = JSON.stringify({ schema: 1, source: 'something-else', exportedAt: 'x', preferences: {} })
    expect(() => parsePreferencesExport(text)).toThrow(PreferencesImportError)
  })

  it('rejects a non-object preferences block', () => {
    const text = JSON.stringify({ schema: 1, source: 'dsh-skin-manager', exportedAt: 'x', preferences: [] })
    expect(() => parsePreferencesExport(text)).toThrow(PreferencesImportError)
  })
})

describe('preferences import validation against live definitions', () => {
  it('normalizes every known setting and drops unknown keys', () => {
    const exported = buildPreferencesExport({
      'maid-atelier': { artwork: 'not-a-bool', font: 'removed-option', unknown: 'drop', sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }] } },
      'unknown-skin': { anything: true },
    })
    const { preferences, matchedSkins } = validatePreferencesExport(exported, [definition, otherDefinition])
    expect(matchedSkins).toEqual(['maid-atelier'])
    expect(preferences['maid-atelier']).toEqual({
      artwork: true,
      font: 'system',
      sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }] },
    })
    expect(preferences['unknown-skin']).toBeUndefined()
  })

  it('throws when no skins in the envelope match the live registry', () => {
    const exported = buildPreferencesExport({ 'unknown-skin': { anything: true } })
    expect(() => validatePreferencesExport(exported, [definition])).toThrow(PreferencesImportError)
    try {
      validatePreferencesExport(exported, [definition])
    } catch (error) {
      expect((error as PreferencesImportError).code).toBe('no-matching-skins')
    }
  })

  it('matches multiple skins independently', () => {
    const exported = buildPreferencesExport({
      'maid-atelier': { artwork: false },
      'orca-link': { character: false },
    })
    const { matchedSkins } = validatePreferencesExport(exported, [definition, otherDefinition])
    expect(matchedSkins).toEqual(['maid-atelier', 'orca-link'])
  })

  it('importPreferencesFromText chains parse + validate', () => {
    const text = serializePreferencesExport(buildPreferencesExport({ 'maid-atelier': { artwork: false } }))
    const result = importPreferencesFromText(text, [definition, otherDefinition])
    expect(result.matchedSkins).toEqual(['maid-atelier'])
    expect(result.preferences['maid-atelier']).toEqual({ artwork: false, font: 'system', sfw: { enabled: false, outside: 'visible', ranges: [] } })
    expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('a current-schema envelope carries schema = 1', () => {
    expect(PREFERENCES_EXPORT_SCHEMA).toBe(1)
  })
})
