import { describe, expect, it } from 'vitest'
import type { SkinSetting } from '../src/protocol.ts'
import { settingVisible } from '../src/client/runtime.ts'

const flashGlasses: SkinSetting = {
  key: 'flashGlasses',
  type: 'boolean',
  label: 'flash glasses artwork',
  defaultValue: false,
  visibleWhen: {
    key: 'mobileModelExit',
    values: [true],
    anyOf: [
      { key: 'modelExit', values: [true] },
      { key: 'mobileModelExit', values: [true] },
    ],
  },
}

describe('setting visibility', () => {
  it('shows an anyOf control while any listed condition holds', () => {
    // Desktop model artwork on, mobile switch off: the control must still render.
    expect(settingVisible(flashGlasses, { modelExit: true, mobileModelExit: false })).toBe(true)
    expect(settingVisible(flashGlasses, { modelExit: false, mobileModelExit: true })).toBe(true)
    expect(settingVisible(flashGlasses, { modelExit: true, mobileModelExit: true })).toBe(true)
  })

  it('hides an anyOf control while no listed condition holds', () => {
    expect(settingVisible(flashGlasses, { modelExit: false, mobileModelExit: false })).toBe(false)
    expect(settingVisible(flashGlasses, {})).toBe(false)
  })

  it('keeps the top-level single-key mirror on the condition itself', () => {
    // A manager that predates `anyOf` reads `key`/`values` directly and never
    // looks at the nested entries, so the mirror has to sit on the condition.
    expect(flashGlasses.visibleWhen).toEqual({
      key: 'mobileModelExit',
      values: [true],
      anyOf: [
        { key: 'modelExit', values: [true] },
        { key: 'mobileModelExit', values: [true] },
      ],
    })
  })

  it('reads a plain single-key condition', () => {
    const dependent: SkinSetting = {
      key: 'accent',
      type: 'color',
      label: 'Accent',
      defaultValue: '#123456',
      visibleWhen: { key: 'enabled', values: [true] },
    }
    expect(settingVisible(dependent, { enabled: true })).toBe(true)
    expect(settingVisible(dependent, { enabled: false })).toBe(false)
  })

  it('treats a setting without visibleWhen as always visible', () => {
    const plain: SkinSetting = { key: 'artwork', type: 'boolean', label: 'Artwork', defaultValue: true }
    expect(settingVisible(plain, {})).toBe(true)
  })
})
