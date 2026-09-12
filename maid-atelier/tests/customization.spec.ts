// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SKIN_CUSTOMIZATION_REGISTER_EVENT,
  type SkinCustomizationRegistration,
} from '../../skin-manager/src/protocol.ts'
import { installMaidCustomization, modelFamily } from '../src/client/customization.ts'
import { normalizeSkinValues } from '../../skin-manager/src/client/preferences.ts'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  for (const attribute of [...document.documentElement.attributes]) {
    if (attribute.name.startsWith('data-dsh-whale-') || attribute.name.startsWith('data-maid-composer-') || attribute.name.startsWith('data-maid-nav-')) {
      document.documentElement.removeAttribute(attribute.name)
    }
  }
})

describe('maid customization declaration', () => {
  it('exposes its own controls and applies the effective SFW visibility', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    expect(definition.settings.map(setting => setting.key)).toEqual(['artwork', 'sfwMode', 'font', 'modelExit', 'mobileModelExit', 'flashGlasses', 'mobileNav', 'composerMode'])
    const state = {
      values: normalizeSkinValues(definition, { artwork: true, sfwMode: { enabled: true, outside: 'visible', ranges: [] }, font: 'serif', modelExit: false, mobileNav: 'topbar', composerMode: 'scroll' }),
      visibility: { sfwMode: false },
    }
    document.body.innerHTML = '<div data-composer-card><button aria-haspopup="menu" title="DeepSeek-V4-Flash-Vision-Exp">DeepSeek-V4-Flash-Vision-Ex</button></div>'
    const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    definition.apply(state)
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-art')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-font')).toBe('serif')
    expect(document.documentElement.getAttribute('data-maid-composer-mode')).toBe('scroll')
    expect(document.documentElement.getAttribute('data-maid-nav-mode')).toBe('topbar')
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-model-exit')).toBe('disabled')
    width.mockReturnValue(420)
    window.dispatchEvent(new Event('resize'))
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-model-exit')).toBe('enabled')
    expect(document.documentElement.getAttribute('data-dsh-whale-model')).toBe('flash')
    definition.apply({ ...state, values: { ...state.values, mobileModelExit: false } })
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-model-exit')).toBe('disabled')
    expect(document.documentElement.hasAttribute('data-dsh-whale-model')).toBe(false)
    definition.apply(state)
    expect(document.documentElement.getAttribute('data-dsh-whale-model')).toBe('flash')
    width.mockReturnValue(1024)
    window.dispatchEvent(new Event('resize'))
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-model-exit')).toBe('disabled')
    dispose()
    width.mockReturnValue(420)
    window.dispatchEvent(new Event('resize'))
    expect(document.documentElement.hasAttribute('data-dsh-whale-maid-model-exit')).toBe(false)
    expect(document.documentElement.hasAttribute('data-dsh-whale-model')).toBe(false)
    expect(document.documentElement.hasAttribute('data-dsh-whale-maid-art')).toBe(false)
    expect(document.documentElement.hasAttribute('data-maid-composer-mode')).toBe(false)
    expect(document.documentElement.hasAttribute('data-maid-nav-mode')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('exposes the composer presentation modes as a select', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const composerMode = registration!.definition.settings.find(setting => setting.key === 'composerMode')
    expect(composerMode?.type).toBe('select')
    expect(composerMode && composerMode.type === 'select' ? composerMode.options.map(option => option.value) : []).toEqual(['persistent', 'capsule', 'scroll'])
    expect(composerMode && composerMode.type === 'select' ? composerMode.options.map(option => option.label) : []).toEqual(['始终显示', '空态胶囊（点击展开）', '上滚隐去 · 下滚渐现'])
    expect(composerMode && composerMode.type === 'select' ? composerMode.options.map(option => option.labelEn) : []).toEqual(['Always visible', 'Idle capsule (click to expand)', 'Hide on scroll up · show on scroll down'])
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('exposes the phone navigation layouts and defaults to the corner mark', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const mobileNav = definition.settings.find(setting => setting.key === 'mobileNav')
    expect(mobileNav?.type).toBe('select')
    expect(mobileNav?.defaultValue).toBe('corner')
    expect(mobileNav && mobileNav.type === 'select' ? mobileNav.options.map(option => option.value) : []).toEqual(['corner', 'topbar', 'rail'])

    // A missing value and an unknown value both mean the skin default, so a phone
    // still gets the corner mark before the manager has pushed anything.
    const blank = normalizeSkinValues(definition, {})
    definition.apply({ values: blank, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-maid-nav-mode')).toBe('corner')
    definition.apply({ values: { ...blank, mobileNav: 'nonsense' }, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-maid-nav-mode')).toBe('corner')
    definition.apply({ values: { ...blank, mobileNav: 'rail' }, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-maid-nav-mode')).toBe('rail')

    dispose()
    expect(document.documentElement.hasAttribute('data-maid-nav-mode')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('declares English copy for every localized surface', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    expect(definition.titleEn).toBe('Abyssal Maid Atelier')
    for (const setting of definition.settings) {
      expect(setting.labelEn, `${setting.key} labelEn`).toBeTypeOf('string')
      if (setting.description !== undefined) expect(setting.descriptionEn, `${setting.key} descriptionEn`).toBeTypeOf('string')
      if (setting.type === 'select') {
        for (const option of setting.options) expect(option.labelEn, `${setting.key}/${option.value} labelEn`).toBeTypeOf('string')
      }
    }
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('matches only the DeepSeek Flash and Pro display names', () => {
    // Both families carry vision now, so a `vision` substring no longer splits
    // a third family; the glasses artwork is its own switch.
    expect(modelFamily('DeepSeek Pro')).toBe('pro')
    expect(modelFamily('DeepSeek-V4-Pro')).toBe('pro')
    expect(modelFamily('deepseek v4 flash')).toBe('flash')
    expect(modelFamily('deepseek-v41-flash')).toBe('flash')
    expect(modelFamily('DeepSeek-V4.1-Flash')).toBe('flash')
    expect(modelFamily('deepseek v5 flash')).toBe('flash')
    expect(modelFamily('DeepSeek-V4.1-Pro')).toBe('pro')
    expect(modelFamily('DeepSeek-V4-Flash-Vision-Exp')).toBe('flash')
    expect(modelFamily('DeepSeek Flash')).toBe('flash')
    expect(modelFamily('DeepSeek Vision')).toBeNull()
    expect(modelFamily('DeepSeek V4F')).toBeNull()
    expect(modelFamily('DeepSeek V3')).toBeNull()
    expect(modelFamily('GPT-5 Flash')).toBeNull()
  })

  it('gates the flash glasses switch behind the model-artwork switches', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const glasses = definition.settings.find(setting => setting.key === 'flashGlasses')
    expect(glasses?.type).toBe('boolean')
    expect(glasses?.defaultValue).toBe(false)
    // Either switch is enough: the manager evaluates `anyOf`. The top-level
    // single-key mirror keeps a manager that predates `anyOf` on a complete
    // condition instead of an absent `values` (which would throw).
    expect(glasses?.visibleWhen).toEqual({
      key: 'mobileModelExit',
      values: [true],
      anyOf: [
        { key: 'modelExit', values: [true] },
        { key: 'mobileModelExit', values: [true] },
      ],
    })
    const state = {
      values: normalizeSkinValues(definition, { artwork: true, flashGlasses: true, modelExit: false }),
      visibility: { sfwMode: false },
    }
    definition.apply(state)
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-flash-glasses')).toBe('on')
    definition.apply({ ...state, values: { ...state.values, flashGlasses: false } })
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-flash-glasses')).toBe('off')
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('keeps every visibility condition readable by a manager that predates anyOf', () => {
    // A manager that only knows the single-key form reads `key` and `values`
    // directly. A condition that carries `anyOf` without them makes that read
    // throw inside the skin card, and the whole skin-manager page renders
    // empty — which is exactly what happened once. Replay that legacy read path
    // over every declared condition instead of only snapshotting the shape.
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const legacyVisible = (
      condition: { key?: string; values?: readonly unknown[] },
      values: Record<string, unknown>,
    ): boolean => {
      const value = values[condition.key as string]
      return condition.values!.some(candidate => candidate === value)
    }
    const values = normalizeSkinValues(definition, { modelExit: true, mobileModelExit: true }) as Record<string, unknown>
    let checked = 0
    for (const setting of definition.settings) {
      if (setting.visibleWhen === undefined) continue
      checked += 1
      // `key`/`values` must exist on the condition itself, not only inside
      // `anyOf`: the legacy read path never looks at the nested entries.
      expect(() => legacyVisible(setting.visibleWhen, values), `${setting.key} visibleWhen`).not.toThrow()
      expect(legacyVisible(setting.visibleWhen, values), `${setting.key} legacy result`).toBeTypeOf('boolean')
    }
    expect(checked).toBeGreaterThan(0)
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })
})
