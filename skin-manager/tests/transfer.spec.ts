import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import {
  assertPreferencesImportable,
  buildPreferencesExport,
  defaultExportFileName,
  importPreferencesFromText,
  parsePreferencesExport,
  PREFERENCES_EXPORT_SCHEMA,
  PREFERENCES_IMPORT_MAX_BYTES,
  PREFERENCES_IMPORT_MAX_SKINS,
  PREFERENCES_IMPORT_MAX_TEXT_BYTES,
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

/** Run an import that must be rejected and return the typed failure. */
function importFailure(run: () => unknown): PreferencesImportError {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(PreferencesImportError)
    return error as PreferencesImportError
  }
  throw new Error('expected the import to be rejected')
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

  it('measures the size ceiling in UTF-8 bytes of content, not UTF-16 units', () => {
    const text = serializePreferencesExport(buildPreferencesExport({ example: { note: '中'.repeat(40) } }))
    const content = JSON.stringify(JSON.parse(text))
    // Every code unit fits inside the budget while the content's bytes do not.
    expect(content.length).toBeLessThan(new TextEncoder().encode(content).length)
    expect(importFailure(() => parsePreferencesExport(text, content.length)).code).toBe('too-large')
    expect(parsePreferencesExport(text, new TextEncoder().encode(content).length).exportedAt).not.toBe('')
  })

  it('accepts a payload exactly at the content ceiling and rejects one byte more', () => {
    const text = serializePreferencesExport(buildPreferencesExport({ example: { note: '中'.repeat(10) } }))
    const exact = new TextEncoder().encode(JSON.stringify(JSON.parse(text))).length
    expect(parsePreferencesExport(text, exact).exportedAt).not.toBe('')
    expect(importFailure(() => parsePreferencesExport(text, exact - 1)).code).toBe('too-large')
  })

  it('measures the ceiling on configuration content instead of its formatting', () => {
    // Twenty thousand tiny entries fit the budget as compact content while the
    // pretty-printed form of the same envelope does not — the export this manager
    // used to produce from its own store and then refuse to import.
    const entries = Array.from({ length: 20_000 }, (_, index) => `"k${index}":0`).join(',')
    const compact = `{"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{"junk-skin":{${entries}}}}`
    const padded = JSON.stringify(JSON.parse(compact), null, 2)
    expect(compact.length).toBeLessThan(PREFERENCES_IMPORT_MAX_BYTES)
    expect(padded.length).toBeGreaterThan(PREFERENCES_IMPORT_MAX_BYTES)
    expect(padded.length).toBeLessThan(PREFERENCES_IMPORT_MAX_TEXT_BYTES)
    expect(parsePreferencesExport(compact).preferences['junk-skin']).toBeTruthy()
    expect(parsePreferencesExport(padded).preferences['junk-skin']).toBeTruthy()
    // Content over the budget is still rejected, in either formatting.
    const over = `{"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{"junk-skin":{"pad":"${'x'.repeat(PREFERENCES_IMPORT_MAX_BYTES)}"}}}`
    expect(importFailure(() => parsePreferencesExport(over)).code).toBe('too-large')
  })

  it('rejects text padded past the pre-parse ceiling', () => {
    // Whitespace may pad a legal envelope; the raw ceiling bounds what reaches
    // `JSON.parse`, and the content budget still applies to the parsed value.
    const padding = ' '.repeat(PREFERENCES_IMPORT_MAX_TEXT_BYTES)
    const text = `{${padding}"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{}}`
    expect(importFailure(() => parsePreferencesExport(text)).code).toBe('too-large')
  })

  it('round-trips a near-budget envelope through the export the manager produces', () => {
    const entries = Array.from({ length: 20_000 }, (_, index) => `"k${index}":0`).join(',')
    const text = `{"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{"junk-skin":{${entries}}}}`
    const exported = parsePreferencesExport(text)
    const round = serializePreferencesExport(buildPreferencesExport(exported.preferences))
    // The padded form may exceed the byte budget; the content it carries does not.
    expect(round.length).toBeGreaterThan(PREFERENCES_IMPORT_MAX_BYTES)
    expect(parsePreferencesExport(round).preferences['junk-skin']).toBeTruthy()
  })

  it('falls back to the compact form when padding would exceed the pre-parse ceiling', () => {
    const nest = (depth: number): unknown => depth === 0 ? 0 : { n: nest(depth - 1) }
    const block: Record<string, unknown> = {}
    for (let index = 0; index < 1000; index += 1) block[`k${index}`] = nest(20)
    const text = serializePreferencesExport(buildPreferencesExport({ 'junk-skin': block }))
    expect(text.length).toBeLessThanOrEqual(PREFERENCES_IMPORT_MAX_TEXT_BYTES)
    expect(text).not.toContain('\n  ')
    expect(parsePreferencesExport(text).preferences['junk-skin']).toBeTruthy()
  })

  it('rejects a preference set whose content cannot be exported back', () => {
    const over = { 'junk-skin': { pad: 'x'.repeat(PREFERENCES_IMPORT_MAX_BYTES) } }
    expect(importFailure(() => assertPreferencesImportable(over)).code).toBe('store-too-large')
    expect(assertPreferencesImportable({ 'junk-skin': { pad: 'x' } })).toBeUndefined()
  })

  it('rejects a legal-sized payload nested too deeply to be written back', () => {
    // The reported shape: ~48 KiB and 4800 levels deep inside one block. It
    // parses, so the old projection stored it verbatim and the next store write
    // threw `RangeError` from `JSON.stringify` after memory had already changed.
    const depth = 4800
    const text = '{"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{"junk-skin":{"nested":'
      + '{"nested":'.repeat(depth) + '"leaf"' + '}'.repeat(depth) + '}}}'
    expect(text.length).toBeLessThan(PREFERENCES_IMPORT_MAX_BYTES)
    expect(importFailure(() => parsePreferencesExport(text)).code).toBe('invalid-envelope')
  })

  it('rejects a block keyed __proto__ instead of reporting it as deferred', () => {
    const text = '{"schema":1,"source":"dsh-skin-manager","exportedAt":"x","preferences":{"__proto__":{"artwork":false}}}'
    // The key could only replace the projection's prototype, so the store wrote
    // nothing while the UI still said the block was stored for later.
    expect(importFailure(() => importPreferencesFromText(text, [definition])).code).toBe('invalid-envelope')
    expect(Object.prototype).not.toHaveProperty('artwork')
  })

  it('rejects an envelope carrying more skin blocks than the store budget', () => {
    const preferences: Record<string, Record<string, unknown>> = {}
    for (let index = 0; index <= PREFERENCES_IMPORT_MAX_SKINS; index += 1) preferences[`skin-${index}`] = { x: 1 }
    expect(importFailure(() => parsePreferencesExport(serializePreferencesExport(buildPreferencesExport(preferences)))).code)
      .toBe('invalid-envelope')
    const allowed = Object.fromEntries(Object.entries(preferences).slice(0, PREFERENCES_IMPORT_MAX_SKINS))
    expect(parsePreferencesExport(serializePreferencesExport(buildPreferencesExport(allowed))).preferences)
      .toEqual(allowed)
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
  it('normalizes registered skins, drops unknown keys and defers skins that are not loaded', () => {
    const exported = buildPreferencesExport({
      'maid-atelier': { artwork: 'not-a-bool', font: 'removed-option', unknown: 'drop', sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }] } },
      'unknown-skin': { anything: true },
    })
    const { preferences, matchedSkins, deferredSkins } = validatePreferencesExport(exported, [definition, otherDefinition])
    expect(matchedSkins).toEqual(['maid-atelier'])
    expect(deferredSkins).toEqual(['unknown-skin'])
    expect(preferences['maid-atelier']).toEqual({
      artwork: true,
      font: 'system',
      sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }] },
    })
    // A skin the registry does not hold keeps its block verbatim: mutual
    // exclusion leaves the inactive skin unloaded, and the read path normalizes
    // the block against its definition once that skin registers.
    expect(preferences['unknown-skin']).toEqual({ anything: true })
  })

  it('defers every block when no skin in the envelope is loaded', () => {
    const exported = buildPreferencesExport({ 'unknown-skin': { anything: true } })
    const { preferences, matchedSkins, deferredSkins } = validatePreferencesExport(exported, [definition])
    expect(matchedSkins).toEqual([])
    expect(deferredSkins).toEqual(['unknown-skin'])
    expect(preferences['unknown-skin']).toEqual({ anything: true })
  })

  it('throws when the envelope carries no skin block at all', () => {
    const exported = buildPreferencesExport({})
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
    expect(result.deferredSkins).toEqual([])
    expect(result.preferences['maid-atelier']).toEqual({ artwork: false, font: 'system', sfw: { enabled: false, outside: 'visible', ranges: [] } })
    expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('a current-schema envelope carries schema = 1', () => {
    expect(PREFERENCES_EXPORT_SCHEMA).toBe(1)
  })
})
