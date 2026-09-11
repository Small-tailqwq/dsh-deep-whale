import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import { PreferencesStore } from '../src/client/preferences.ts'
import {
  applyPreset,
  DEFAULT_PRESET_ID,
  DEFAULT_PRESET_NAME_EN,
  DEFAULT_PRESET_NAME_ZH,
  defaultPreset,
  generatePresetId,
  MAX_PRESETS,
  MAX_PRESET_NAME_LENGTH,
  PresetsStore,
  readPresets,
  validatePresetName,
} from '../src/client/presets.ts'

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
  ],
  apply() {},
}

function makeStorage(seed: unknown = { presets: [] }): Storage {
  let value = seed === undefined ? undefined : JSON.stringify(seed)
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next },
    removeItem: () => { value = undefined },
  } as Storage
}

function makeWindow(): Window {
  const handlers = new Map<string, EventListener>()
  return {
    addEventListener: (type: string, listener: EventListener) => handlers.set(type, listener),
    removeEventListener: (type: string) => handlers.delete(type),
    dispatchEvent: () => true,
  } as unknown as Window
}

function makeStore(seed: unknown = { presets: [] }): PresetsStore {
  return new PresetsStore(makeStorage(seed), makeWindow())
}

describe('preset roster parsing', () => {
  it('returns an empty roster for non-object storage', () => {
    expect(readPresets(makeStorage(undefined)).presets).toEqual([])
    expect(readPresets(makeStorage(null)).presets).toEqual([])
    expect(readPresets(makeStorage('garbage')).presets).toEqual([])
  })

  it('drops malformed presets and duplicate ids', () => {
    const storage = makeStorage({
      presets: [
        { id: 'p1', name: 'Work', createdAt: '2026-01-01T00:00:00.000Z', preferences: { 'maid-atelier': { artwork: false } } },
        { id: 'p1', name: 'Dup', createdAt: '2026-01-02T00:00:00.000Z', preferences: {} },
        { id: '', name: 'No id', createdAt: 'x', preferences: {} },
        { id: 'p2', name: 'No prefs', createdAt: 'x', preferences: 'bad' },
        { id: DEFAULT_PRESET_ID, name: 'Defaults', createdAt: 'x', preferences: {} },
        { id: 'p3', name: 'Ok', createdAt: '2026-01-03T00:00:00.000Z', preferences: {} },
      ],
    })
    const { presets } = readPresets(storage)
    expect(presets.map(p => p.id)).toEqual(['p1', 'p3'])
  })

  it('caps the roster size at MAX_PRESETS', () => {
    const many = Array.from({ length: MAX_PRESETS + 5 }, (_, i) => ({
      id: `p${i}`, name: `P${i}`, createdAt: '2026-01-01T00:00:00.000Z', preferences: {},
    }))
    expect(readPresets(makeStorage({ presets: many })).presets).toHaveLength(MAX_PRESETS)
  })

  it('truncates over-long names', () => {
    const long = 'x'.repeat(MAX_PRESET_NAME_LENGTH + 10)
    const storage = makeStorage({ presets: [{ id: 'p1', name: long, createdAt: 'x', preferences: {} }] })
    expect(readPresets(storage).presets[0]!.name).toHaveLength(MAX_PRESET_NAME_LENGTH)
  })
})

describe('default preset', () => {
  it('renders the zh name in zh mode and en name in en mode', () => {
    expect(defaultPreset('zh').name).toBe(DEFAULT_PRESET_NAME_ZH)
    expect(defaultPreset('en').name).toBe(DEFAULT_PRESET_NAME_EN)
  })

  it('carries the reserved default id and empty preferences', () => {
    const d = defaultPreset('en')
    expect(d.id).toBe(DEFAULT_PRESET_ID)
    expect(d.preferences).toEqual({})
    expect(d.createdAt).toBe('')
  })
})

describe('preset name validation', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(validatePresetName('   ', [])).toEqual({ ok: false, error: 'empty' })
    expect(validatePresetName('', [])).toEqual({ ok: false, error: 'empty' })
  })

  it('rejects names exceeding the length limit', () => {
    expect(validatePresetName('x'.repeat(MAX_PRESET_NAME_LENGTH + 1), [])).toEqual({ ok: false, error: 'too-long' })
  })

  it('rejects names already used by an existing preset', () => {
    const existing = [{ id: 'p1', name: 'Work', createdAt: 'x', preferences: {} }]
    expect(validatePresetName('Work', existing)).toEqual({ ok: false, error: 'duplicate' })
    expect(validatePresetName('Home', existing).ok).toBe(true)
  })

  it('accepts a fresh, in-bounds name', () => {
    expect(validatePresetName('Focus mode', [])).toEqual({ ok: true })
  })
})

describe('PresetsStore CRUD', () => {
  it('save persists a new preset and notifies subscribers', () => {
    const store = makeStore()
    let calls = 0
    store.subscribe(() => { calls += 1 })
    const preset = store.save('Work', { 'maid-atelier': { artwork: false } })
    expect(preset.name).toBe('Work')
    expect(preset.id).toMatch(/^p-/)
    expect(store.list()).toHaveLength(1)
    expect(calls).toBe(1)
  })

  it('save rejects empty names with a typed error code', () => {
    const store = makeStore()
    expect(() => store.save('  ', {})).toThrow('preset-name-empty')
  })

  it('save rejects duplicate names', () => {
    const store = makeStore()
    store.save('Work', {})
    expect(() => store.save('Work', {})).toThrow('preset-name-duplicate')
  })

  it('save enforces the roster limit', () => {
    const store = makeStore()
    for (let i = 0; i < MAX_PRESETS; i++) store.save(`P${i}`, {})
    expect(() => store.save('Overflow', {})).toThrow('preset-limit-reached')
  })

  it('rename updates the name without changing id or preferences', () => {
    const store = makeStore()
    const preset = store.save('Work', { 'maid-atelier': { artwork: false } })
    expect(store.rename(preset.id, 'Home')).toBe(true)
    const renamed = store.get(preset.id)!
    expect(renamed.name).toBe('Home')
    expect(renamed.id).toBe(preset.id)
    expect(renamed.preferences).toEqual({ 'maid-atelier': { artwork: false } })
  })

  it('rename rejects duplicate names', () => {
    const store = makeStore()
    store.save('Work', {})
    const p2 = store.save('Home', {})
    expect(() => store.rename(p2.id, 'Work')).toThrow('preset-name-duplicate')
  })

  it('rename returns false for an unknown id', () => {
    expect(makeStore().rename('missing', 'X')).toBe(false)
  })

  it('delete removes a preset and notifies', () => {
    const store = makeStore()
    let calls = 0
    store.subscribe(() => { calls += 1 })
    const preset = store.save('Work', {})
    expect(store.delete(preset.id)).toBe(true)
    expect(store.list()).toHaveLength(0)
    expect(calls).toBe(2)
    expect(store.delete(preset.id)).toBe(false)
  })

  it('generatePresetId produces unique ids across rapid calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 200; i++) ids.add(generatePresetId())
    expect(ids.size).toBe(200)
  })
})

describe('applyPreset', () => {
  function makePrefStore(seed: Record<string, Record<string, unknown>> = {}): PreferencesStore {
    // makeStorage ignores the key and returns the same string for every getItem
    // call, so seed it with the preferences object directly — PreferencesStore
    // reads it through getItem(PREFERENCES_KEY) and treats the parsed value as
    // the Preferences record.
    return new PreferencesStore(makeStorage(seed), makeWindow())
  }

  it('the Defaults preset clears every known skin block', () => {
    const store = makePrefStore({ 'maid-atelier': { artwork: false, font: 'serif' } })
    const cleared = applyPreset(defaultPreset('en'), [definition], store)
    expect(cleared).toBe(1)
    expect(store.snapshot()['maid-atelier']).toBeUndefined()
  })

  it('a saved preset is normalized through PreferencesStore.replace', () => {
    const store = makePrefStore()
    const preset = {
      id: 'p1', name: 'Work', createdAt: '2026-01-01T00:00:00.000Z',
      preferences: { 'maid-atelier': { artwork: 'bad', font: 'serif', unknown: 'drop' } },
    }
    const written = applyPreset(preset, [definition], store)
    expect(written).toBe(1)
    expect(store.snapshot()['maid-atelier']).toEqual({ artwork: true, font: 'serif' })
  })

  it('a preset with no matching skins reports zero writes', () => {
    const store = makePrefStore()
    const preset = {
      id: 'p1', name: 'Work', createdAt: '2026-01-01T00:00:00.000Z',
      preferences: { 'unknown-skin': { x: 1 } },
    }
    expect(applyPreset(preset, [definition], store)).toBe(0)
    expect(store.snapshot()).toEqual({})
  })
})
