// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  SKIN_CUSTOMIZATION_REGISTER_EVENT,
  type SkinCustomizationRegistration,
} from '../../skin-manager/src/protocol.ts'
import { installOrcaCustomization } from '../src/client/customization.ts'

afterEach(() => {
  for (const attribute of [...document.documentElement.attributes]) {
    if (attribute.name.startsWith('data-dsh-whale-')) document.documentElement.removeAttribute(attribute.name)
  }
})

describe('ORCA LINK customization declaration', () => {
  it('owns all declared switches and restores them on disposal', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installOrcaCustomization()
    const definition = registration!.definition
    expect(definition.settings.map(setting => setting.key)).toEqual(['character', 'background', 'pricingLight', 'sfwMode'])
    definition.apply({
      values: { character: false, background: true, pricingLight: false, sfwMode: { enabled: true, outside: 'visible', ranges: [] } },
      visibility: { sfwMode: false },
    })
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-character')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-background')).toBe('visible')
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-pricing')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-art')).toBe('hidden')
    dispose()
    expect(document.documentElement.hasAttribute('data-dsh-whale-orca-art')).toBe(false)
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('retires the corner character with the scene art during the SFW window', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installOrcaCustomization()
    const definition = registration!.definition
    const values = { character: true, background: true, pricingLight: true, sfwMode: { enabled: true, outside: 'visible', ranges: [] } }

    // SFW hidden window: the character switch is on, but the schedule wins.
    definition.apply({ values, visibility: { sfwMode: false } })
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-art')).toBe('hidden')
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-character')).toBe('hidden')

    // SFW visible window: the switch's own verdict is restored.
    definition.apply({ values, visibility: { sfwMode: true } })
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-art')).toBe('visible')
    expect(document.documentElement.getAttribute('data-dsh-whale-orca-character')).toBe('visible')
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })

  it('declares English copy for the manager surface', () => {
    let registration: SkinCustomizationRegistration | undefined
    const receive = (event: Event) => { registration = (event as CustomEvent<SkinCustomizationRegistration>).detail }
    window.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
    const dispose = installOrcaCustomization()
    const definition = registration!.definition
    // The title is already language-neutral; every label and description
    // carries an explicit En variant for the manager's fallback path.
    expect(definition.title).toBe('ORCA LINK')
    for (const setting of definition.settings) {
      expect(setting.labelEn, `${setting.key} labelEn`).toBeTypeOf('string')
      if (setting.description !== undefined) expect(setting.descriptionEn, `${setting.key} descriptionEn`).toBeTypeOf('string')
    }
    dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, receive)
  })
})
