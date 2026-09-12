import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import { normalizeSkinValues, PreferencesStore, readPreferences } from '../src/client/preferences.ts'
import { normalizeVisibilitySchedule, scheduleVisibility } from '../src/client/schedule.ts'

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
})

describe('PreferencesStore snapshot / replace / clearSkin', () => {
  function makeStore(seed: Record<string, Record<string, unknown>> = {}): PreferencesStore {
    const storage = (() => {
      let value = JSON.stringify(seed)
      return {
        getItem: () => value,
        setItem: (_key: string, next: string) => { value = next },
        removeItem: () => { value = '' },
      } as Storage
    })()
    const target = (() => {
      const handlers = new Map<string, EventListener>()
      return {
        addEventListener: (type: string, listener: EventListener) => handlers.set(type, listener),
        removeEventListener: (type: string) => handlers.delete(type),
        dispatchEvent: () => true,
      } as unknown as Window
    })()
    return new PreferencesStore(storage, target)
  }

  it('snapshot returns the raw preferences without mutating the store', () => {
    const store = makeStore({ 'example': { art: false } })
    expect(store.snapshot()).toEqual({ example: { art: false } })
  })

  it('replace normalizes every known skin and skips unknown ones', () => {
    const store = makeStore({ example: { art: true } })
    const written = store.replace([definition], { example: { art: 'bad', font: 'removed' }, 'unknown-skin': { x: 1 } })
    expect(written).toBe(1)
    expect(store.snapshot().example).toEqual({ art: true, font: 'system', sfw: { enabled: false, outside: 'visible', ranges: [] } })
  })

  it('replace reports zero and skips the write when no skin matches', () => {
    const store = makeStore({ example: { art: true } })
    const written = store.replace([definition], { 'unknown-skin': { x: 1 } })
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
})
