import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import { normalizeSkinValues, PreferencesStore, readPreferences } from '../src/client/preferences.ts'
import { MAX_VISIBILITY_RANGES, normalizeVisibilitySchedule, scheduleVisibility } from '../src/client/schedule.ts'

const definition: SkinCustomizationDefinition = {
  protocol: 1,
  skinId: 'example',
  title: 'Example',
  settings: [
    { key: 'art', type: 'boolean', label: 'Art', defaultValue: true },
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

describe('generic skin preferences', () => {
  it('normalizes values against the skin-owned declaration', () => {
    expect(normalizeSkinValues(definition, {
      art: false,
      font: 'removed-option',
      sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }, { start: 'bad', end: '12:00' }] },
    })).toEqual({
      art: false,
      font: 'system',
      sfw: { enabled: true, outside: 'hidden', ranges: [{ start: '22:00', end: '07:00' }] },
    })
  })

  it('migrates the old fixed schema without carrying the obsolete cycle timer', () => {
    const storage = {
      getItem(key: string) {
        return key === 'dsh-deep-whale.skin-manager.v1'
          ? JSON.stringify({ maid: { artwork: false, font: 'serif', cycle: { enabled: true } } })
          : null
      },
    }
    expect(readPreferences(storage)['maid-atelier']).toEqual({ artwork: false, font: 'serif', modelExit: undefined })
  })
})

describe('visibility schedules', () => {
  const local = (hour: number, minute: number) => new Date(2026, 7, 21, hour, minute)

  it('hides configured work ranges and shows outside them', () => {
    const schedule = normalizeVisibilitySchedule({
      enabled: true,
      outside: 'visible',
      ranges: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
    })
    expect(scheduleVisibility(schedule, local(10, 30))).toBe(false)
    expect(scheduleVisibility(schedule, local(13, 0))).toBe(true)
    expect(scheduleVisibility(schedule, local(17, 0))).toBe(true)
  })

  it('supports inverse rules and ranges crossing midnight', () => {
    const schedule = normalizeVisibilitySchedule({
      enabled: true,
      outside: 'hidden',
      ranges: [{ start: '22:00', end: '07:00' }],
    })
    expect(scheduleVisibility(schedule, local(23, 0))).toBe(true)
    expect(scheduleVisibility(schedule, local(6, 59))).toBe(true)
    expect(scheduleVisibility(schedule, local(12, 0))).toBe(false)
  })

  it('keeps the first kept ranges without scanning the rest of an oversized array', () => {
    let reads = 0
    const ranges: unknown[] = []
    for (let index = 0; index < 8000; index += 1) {
      Object.defineProperty(ranges, index, {
        get: () => {
          reads += 1
          return { start: '09:00', end: '12:00' }
        },
        enumerable: true,
        configurable: true,
      })
    }
    const schedule = normalizeVisibilitySchedule({ enabled: true, outside: 'visible', ranges })
    expect(schedule.ranges).toHaveLength(MAX_VISIBILITY_RANGES)
    // Every `values()` read normalizes this array, so the truncation has to
    // bound the work: an imported 8000-entry array must not be fully scanned.
    expect(reads).toBe(MAX_VISIBILITY_RANGES)
  })

  it('does not let invalid entries consume the range budget', () => {
    const ranges = [
      { start: 'nope', end: '00:00' },
      ...Array.from({ length: 30 }, (_, index) => ({ start: `0${(index % 9) + 1}:00`, end: '23:00' })),
    ]
    expect(normalizeVisibilitySchedule({ ranges }).ranges).toHaveLength(MAX_VISIBILITY_RANGES)
  })
})

describe('PreferencesStore snapshot / replace / clearSkin', () => {
  function makeStorage(seed: unknown = {}): { storage: Storage, read: () => string | null } {
    let value = JSON.stringify(seed) as string | null
    const storage = {
      getItem: () => value,
      setItem: (_key: string, next: string) => { value = next },
      removeItem: () => { value = null },
    } as unknown as Storage
    return { storage, read: () => value }
  }

  function makeTarget(): Window {
    const handlers = new Map<string, EventListener>()
    return {
      addEventListener: (type: string, listener: EventListener) => handlers.set(type, listener),
      removeEventListener: (type: string) => handlers.delete(type),
      dispatchEvent: () => true,
    } as unknown as Window
  }

  function makeStore(seed: Record<string, Record<string, unknown>> = {}): PreferencesStore {
    return new PreferencesStore(makeStorage(seed).storage, makeTarget())
  }

  it('snapshot returns the raw preferences without mutating the store', () => {
    const store = makeStore({ 'example': { art: false } })
    expect(store.snapshot()).toEqual({ example: { art: false } })
  })

  it('replace normalizes registered skins and stores blocks for skins that are not loaded', () => {
    const store = makeStore({ example: { art: true } })
    const written = store.replace([definition], { example: { art: 'bad', font: 'removed' }, 'unknown-skin': { x: 1 } })
    expect(written).toBe(2)
    expect(store.snapshot().example).toEqual({ art: true, font: 'system', sfw: { enabled: false, outside: 'visible', ranges: [] } })
    // Stored verbatim: `values()` normalizes the block against its definition
    // once that skin registers, so an unloaded skin's configuration survives.
    expect(store.snapshot()['unknown-skin']).toEqual({ x: 1 })
  })

  it('replace reports zero and skips the write when the envelope has no block', () => {
    const store = makeStore({ example: { art: true } })
    const written = store.replace([definition], {})
    expect(written).toBe(0)
    expect(store.snapshot()).toEqual({ example: { art: true } })
  })

  it('replace notifies subscribers so the registry re-applies', () => {
    const store = makeStore({ example: { art: true } })
    let calls = 0
    store.subscribe(() => { calls += 1 })
    store.replace([definition], { example: { art: false } })
    expect(calls).toBe(1)
  })

  it('clearSkin removes a skin block and notifies; reports false when nothing changed', () => {
    const store = makeStore({ example: { art: true } })
    let calls = 0
    store.subscribe(() => { calls += 1 })
    expect(store.clearSkin('example')).toBe(true)
    expect(store.snapshot().example).toBeUndefined()
    expect(calls).toBe(1)
    expect(store.clearSkin('example')).toBe(false)
    expect(calls).toBe(1)
  })

  it('leaves memory, storage and subscribers untouched when the payload cannot be serialized', () => {
    const { storage, read } = makeStorage({ example: { art: true } })
    const store = new PreferencesStore(storage, makeTarget())
    let calls = 0
    store.subscribe(() => { calls += 1 })
    // A structure the store cannot write back — here a cyclic block, the same
    // class of failure a deeply nested imported block triggers — must not leave
    // the in-memory store ahead of storage with every later write poisoned.
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => store.replace([definition], { cyclic })).toThrow(TypeError)
    expect(store.snapshot()).toEqual({ example: { art: true } })
    expect(JSON.parse(read()!)).toEqual({ example: { art: true } })
    expect(calls).toBe(0)
    store.set(definition, 'art', false)
    expect(JSON.parse(read()!).example.art).toBe(false)
    expect(calls).toBe(1)
  })

  it('rolls memory back when storage rejects the write instead of splitting the two', () => {
    const { storage, read } = makeStorage({ example: { art: true } })
    const store = new PreferencesStore(storage, makeTarget())
    let calls = 0
    store.subscribe(() => { calls += 1 })
    storage.setItem = () => { throw new Error('quota exceeded') }
    expect(() => store.replace([definition], { example: { art: false } })).toThrow('quota exceeded')
    expect(store.snapshot()).toEqual({ example: { art: true } })
    expect(JSON.parse(read()!)).toEqual({ example: { art: true } })
    expect(calls).toBe(0)
  })

  it('removeUnregistered drops only blocks for skins the registry does not hold', () => {
    const store = makeStore({ example: { art: true }, 'unknown-skin': { x: 1 } })
    let calls = 0
    store.subscribe(() => { calls += 1 })
    expect(store.removeUnregistered(['example'])).toEqual(['unknown-skin'])
    expect(store.snapshot()).toEqual({ example: { art: true } })
    expect(calls).toBe(1)
    expect(store.removeUnregistered(['example'])).toEqual([])
    expect(calls).toBe(1)
  })
})
