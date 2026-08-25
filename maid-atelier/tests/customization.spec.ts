// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  SKIN_CUSTOMIZATION_REGISTER_EVENT,
  type SkinCustomizationRegistration,
} from '../../skin-manager/src/protocol.ts'
import { installMaidCustomization, modelFamily } from '../src/client/customization.ts'

afterEach(() => {
  for (const attribute of [...document.documentElement.attributes]) {
    if (attribute.name.startsWith('data-dsh-whale-') || attribute.name.startsWith('data-maid-composer-')) {
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
    expect(definition.settings.map(setting => setting.key)).toEqual(['artwork', 'sfwMode', 'font', 'modelExit', 'composerMode'])
    definition.apply({
      values: { artwork: true, sfwMode: { enabled: true, outside: 'visible', ranges: [] }, font: 'serif', modelExit: false, composerMode: 'scroll' },
      visibility: { sfwMode: false },
    })
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-art')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-dsh-whale-maid-font')).toBe('serif')
    expect(document.documentElement.getAttribute('data-maid-composer-mode')).toBe('scroll')
    dispose()
    expect(document.documentElement.hasAttribute('data-dsh-whale-maid-art')).toBe(false)
    expect(document.documentElement.hasAttribute('data-maid-composer-mode')).toBe(false)
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

  it('matches only the requested V4 display-name families', () => {
    expect(modelFamily('DeepSeek-V4-Pro')).toBe('pro')
    expect(modelFamily('deepseek v4 flash')).toBe('flash')
    expect(modelFamily('DeepSeek-V4-Flash-Vision-Exp')).toBe('flash-vision')
    expect(modelFamily('DeepSeek V4F Vision Experimental')).toBe('flash-vision')
    expect(modelFamily('DeepSeek Vision')).toBeNull()
    expect(modelFamily('DeepSeek V3')).toBeNull()
  })
})
