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
  document.documentElement.style.removeProperty('--maid-workspace-row-height')
  document.documentElement.style.removeProperty('--maid-scene-brightness-light')
  document.documentElement.removeAttribute('data-maid-plain-process')
  document.documentElement.removeAttribute('data-maid-sidebar-lace')
  for (const attribute of [...document.documentElement.attributes]) {
    if (attribute.name.startsWith('data-dsh-whale-') || attribute.name.startsWith('data-maid-composer-') || attribute.name.startsWith('data-maid-nav-')) {
      document.documentElement.removeAttribute(attribute.name)
    }
  }
})

describe('maid customization declaration', () => {
  it('keeps sidebar lace enabled by default and supports switching it off and back on', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const lace = definition.settings.find(setting => setting.key === 'sidebarLace')
    expect(lace?.type).toBe('boolean')
    expect(lace?.defaultValue).toBe(true)
    const applyValues = (input: Record<string, unknown>) => definition.apply({ values: normalizeSkinValues(definition, input), visibility: {} })
    applyValues({})
    expect(document.documentElement.getAttribute('data-maid-sidebar-lace')).toBe('on')
    applyValues({ sidebarLace: false })
    expect(document.documentElement.getAttribute('data-maid-sidebar-lace')).toBe('off')
    applyValues({ sidebarLace: true })
    expect(document.documentElement.getAttribute('data-maid-sidebar-lace')).toBe('on')
    applyValues({ sidebarLace: 'invalid' })
    expect(document.documentElement.getAttribute('data-maid-sidebar-lace')).toBe('on')
    definition.apply(null)
    expect(document.documentElement.hasAttribute('data-maid-sidebar-lace')).toBe(false)
    applyValues({ sidebarLace: false })
    dispose()
    expect(document.documentElement.hasAttribute('data-maid-sidebar-lace')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('restores the original sidebar lace attribute and respects later external changes', () => {
    const root = document.documentElement
    root.setAttribute('data-maid-sidebar-lace', 'external')
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    registration!.definition.apply({ values: { sidebarLace: false }, visibility: {} })
    dispose()
    expect(root.getAttribute('data-maid-sidebar-lace')).toBe('external')
    const disposeAgain = installMaidCustomization()
    registration!.definition.apply({ values: { sidebarLace: false }, visibility: {} })
    root.setAttribute('data-maid-sidebar-lace', 'another-writer')
    disposeAgain()
    expect(root.getAttribute('data-maid-sidebar-lace')).toBe('another-writer')
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('clamps light scene brightness to its supported band and keeps plain process rows opt-in', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const brightness = definition.settings.find(setting => setting.key === 'sceneBrightnessLight')
    expect(brightness?.type).toBe('range')
    expect(brightness && brightness.type === 'range' ? [brightness.min, brightness.defaultValue, brightness.max] : []).toEqual([60, 80, 100])
    const applyValues = (input: Record<string, unknown>) => definition.apply({ values: normalizeSkinValues(definition, input), visibility: {} })
    applyValues({})
    expect(document.documentElement.style.getPropertyValue('--maid-scene-brightness-light')).toBe('0.8')
    expect(document.documentElement.getAttribute('data-maid-plain-process')).toBe('off')
    applyValues({ sceneBrightnessLight: 72, plainProcess: true })
    expect(document.documentElement.style.getPropertyValue('--maid-scene-brightness-light')).toBe('0.72')
    expect(document.documentElement.getAttribute('data-maid-plain-process')).toBe('on')
    applyValues({ sceneBrightnessLight: -10 })
    expect(document.documentElement.style.getPropertyValue('--maid-scene-brightness-light')).toBe('0.6')
    applyValues({ sceneBrightnessLight: 110 })
    expect(document.documentElement.style.getPropertyValue('--maid-scene-brightness-light')).toBe('1')
    dispose()
    expect(document.documentElement.style.getPropertyValue('--maid-scene-brightness-light')).toBe('')
    expect(document.documentElement.hasAttribute('data-maid-plain-process')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('restores existing scene preferences and leaves another writer’s brightness intact', () => {
    const root = document.documentElement
    root.style.setProperty('--maid-scene-brightness-light', '0.9', 'important')
    root.setAttribute('data-maid-plain-process', 'external')
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    registration!.definition.apply({ values: normalizeSkinValues(registration!.definition, { sceneBrightnessLight: 60, plainProcess: true }), visibility: {} })
    dispose()
    expect(root.style.getPropertyValue('--maid-scene-brightness-light')).toBe('0.9')
    expect(root.style.getPropertyPriority('--maid-scene-brightness-light')).toBe('important')
    expect(root.getAttribute('data-maid-plain-process')).toBe('external')
    const disposeAgain = installMaidCustomization()
    registration!.definition.apply({ values: normalizeSkinValues(registration!.definition, {}), visibility: {} })
    root.style.setProperty('--maid-scene-brightness-light', '0.7', 'important')
    disposeAgain()
    expect(root.style.getPropertyValue('--maid-scene-brightness-light')).toBe('0.7')
    expect(root.style.getPropertyPriority('--maid-scene-brightness-light')).toBe('important')
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('exposes its own controls and applies the effective SFW visibility', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    expect(definition.settings.map(setting => setting.key)).toEqual(['sceneBrightnessLight', 'plainProcess', 'artwork', 'sfwMode', 'font', 'workspaceFont', 'modelExit', 'mobileModelExit', 'flashGlasses', 'mobileNav', 'composerMode', 'composerBottomOnly', 'sidebarLace', 'workspaceRowHeight'])
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
    expect(document.documentElement.getAttribute('data-maid-composer-bottom-only')).toBe('off')
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

  it('exposes the workspace typography as its own select', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const workspaceFont = definition.settings.find(setting => setting.key === 'workspaceFont')
    expect(workspaceFont?.type).toBe('select')
    expect(workspaceFont?.defaultValue).toBe('serif')
    expect(workspaceFont && workspaceFont.type === 'select' ? workspaceFont.options.map(option => option.value) : [])
      .toEqual(['serif', 'system', 'conversation'])

    const values = normalizeSkinValues(definition, { workspaceFont: 'conversation' })
    definition.apply({ values, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-workspace-font')).toBe('conversation')
    // An unknown value — a state forged by a manager written against a later
    // declaration — means the skin default rather than a second, unstyled mode.
    definition.apply({ values: { ...values, workspaceFont: 'comic' }, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-workspace-font')).toBe('serif')

    dispose()
    expect(document.documentElement.hasAttribute('data-dsh-whale-maid-workspace-font')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('exposes the workspace row height as a range and projects it as an owned length', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    const rowHeight = definition.settings.find(setting => setting.key === 'workspaceRowHeight')
    expect(rowHeight?.type).toBe('range')
    expect(rowHeight?.defaultValue).toBe(54)
    expect(rowHeight && rowHeight.type === 'range' ? [rowHeight.min, rowHeight.max, rowHeight.step, rowHeight.unit] : [])
      .toEqual([22, 54, 1, 'px'])

    // The manager clamps stored values; the skin clamps again, so a forged state
    // or one written by a manager that predates the control never lands as a
    // length the stylesheet cannot use.
    const values = normalizeSkinValues(definition, { workspaceRowHeight: 30 })
    expect(values.workspaceRowHeight).toBe(30)
    definition.apply({ values, visibility: { sfwMode: true } })
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('30px')
    definition.apply({ values: { ...values, workspaceRowHeight: 999 }, visibility: { sfwMode: true } })
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('54px')
    definition.apply({ values: { ...values, workspaceRowHeight: 12 }, visibility: { sfwMode: true } })
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('22px')
    definition.apply({ values: normalizeSkinValues(definition, {}), visibility: { sfwMode: true } })
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('54px')

    dispose()
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('')
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('restores a pre-existing row-height property instead of clearing it', () => {
    document.documentElement.style.setProperty('--maid-workspace-row-height', '18px')
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installMaidCustomization()
    const definition = registration!.definition
    definition.apply({ values: normalizeSkinValues(definition, { workspaceRowHeight: 26 }), visibility: { sfwMode: true } })
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('26px')
    dispose()
    expect(document.documentElement.style.getPropertyValue('--maid-workspace-row-height')).toBe('18px')
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
