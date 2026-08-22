import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition } from '../src/protocol.ts'
import { normalizeSkinValues, readPreferences } from '../src/client/preferences.ts'
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
