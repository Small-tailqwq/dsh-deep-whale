// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_EVENTS,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationRegistration,
  type SkinCustomizationState,
} from '../src/protocol.ts'
import { PreferencesStore } from '../src/client/preferences.ts'
import { SkinCustomizationRegistry } from '../src/client/runtime.ts'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

describe('customization registry', () => {
  it('handles skin-before-manager load order and resolves scheduled visibility', () => {
    const applied: Array<SkinCustomizationState | null> = []
    const disconnect = exposeSkinCustomization({
      protocol: 1,
      skinId: 'deepcel',
      title: 'Deepcel',
      settings: [{
        key: 'sfw',
        type: 'visibility-schedule',
        label: 'SFW',
        defaultValue: { enabled: true, outside: 'visible', ranges: [{ start: '09:00', end: '12:00' }] },
      }],
      apply: state => applied.push(state),
    })
    const store = new PreferencesStore(new MemoryStorage(), window)
    const registry = new SkinCustomizationRegistry(store, window, () => new Date(2026, 7, 21, 10, 0))
    expect(registry.getSnapshot().definitions.map(item => item.skinId)).toEqual(['deepcel'])
    expect(applied.at(-1)?.visibility.sfw).toBe(false)
    disconnect()
    expect(registry.getSnapshot().definitions).toEqual([])
    expect(applied.at(-1)).toBeNull()
    registry.dispose()
  })

  it('keeps v2 declarations invisible to a v1 manager while the current manager discovers them', () => {
    let legacyRegistrations = 0
    const legacyListener = (): void => { legacyRegistrations += 1 }
    window.addEventListener(SKIN_CUSTOMIZATION_EVENTS[1].register, legacyListener)
    const disconnect = exposeSkinCustomization({
      protocol: SKIN_CUSTOMIZATION_PROTOCOL,
      skinId: 'next-skin',
      title: 'Next skin',
      settings: [{ key: 'accent', type: 'color', label: 'Accent', defaultValue: '#123456' }],
      apply() {},
    })
    const registry = new SkinCustomizationRegistry(new PreferencesStore(new MemoryStorage(), window), window)
    expect(legacyRegistrations).toBe(0)
    expect(registry.getSnapshot().definitions.map(item => item.skinId)).toEqual(['next-skin'])
    disconnect()
    registry.dispose()
    window.removeEventListener(SKIN_CUSTOMIZATION_EVENTS[1].register, legacyListener)
  })

  it('accepts the complete published v1 schema and applies its values', () => {
    const applied: Array<SkinCustomizationState | null> = []
    const registry = new SkinCustomizationRegistry(new PreferencesStore(new MemoryStorage(), window), window)
    const registration = {
      token: {},
      definition: {
        protocol: 1,
        skinId: 'legacy-skin',
        title: 'Legacy skin',
        settings: [
          { key: 'enabled', type: 'boolean', label: 'Enabled', defaultValue: true },
          { key: 'accent', type: 'color', label: 'Accent', defaultValue: '#123456', visibleWhen: { key: 'enabled', values: [true] } },
          { key: 'parts', type: 'checkbox-group', label: 'Parts', defaultValue: ['left'], options: [{ value: 'left', label: 'Left' }], legacyValue: { key: 'oldParts', map: { both: ['left'] } } },
        ],
        apply(state: SkinCustomizationState | null) { applied.push(state) },
      },
    } as unknown as SkinCustomizationRegistration
    window.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_EVENTS[1].register, { detail: registration }))
    expect(registry.getSnapshot().definitions).toEqual([registration.definition])
    expect(applied.at(-1)?.values).toEqual({ enabled: true, accent: '#123456', parts: ['left'] })
    registry.set(registration.definition, 'accent', '#abcdef')
    expect(applied.at(-1)?.values.accent).toBe('#abcdef')
    window.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_EVENTS[1].unregister, { detail: registration }))
    expect(registry.getSnapshot().definitions).toEqual([])
    expect(applied.at(-1)).toBeNull()
    registry.dispose()
  })

  it('restores an owned attribute but preserves a later owner', () => {
    document.documentElement.setAttribute('data-example', 'before')
    const projector = new SkinAttributeProjector(document.documentElement)
    projector.set('data-example', 'skin')
    projector.release()
    expect(document.documentElement.getAttribute('data-example')).toBe('before')
    projector.set('data-example', 'skin')
    document.documentElement.setAttribute('data-example', 'later-owner')
    projector.release()
    expect(document.documentElement.getAttribute('data-example')).toBe('later-owner')
    document.documentElement.removeAttribute('data-example')
  })
})
