// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_EVENTS,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationDefinition,
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
    const registration: SkinCustomizationRegistration = {
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
    }
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

describe('registry export / import / reset', () => {
  const definition: SkinCustomizationDefinition = {
    protocol: 2,
    skinId: 'example',
    title: 'Example',
    settings: [
      { key: 'artwork', type: 'boolean', label: 'Artwork', defaultValue: true },
      { key: 'font', type: 'select', label: 'Font', defaultValue: 'system', options: [{ value: 'system', label: 'System' }, { value: 'serif', label: 'Serif' }] },
    ],
    apply() {},
  }

  function makeRegistry(): SkinCustomizationRegistry {
    // Seed the v2 preferences key so the legacy v1 migration does not inject
    // maid-atelier/orca-link blocks with undefined values.
    const storage = new MemoryStorage()
    storage.setItem('dsh.skin-manager.preferences.v2', '{}')
    const store = new PreferencesStore(storage, window)
    const registry = new SkinCustomizationRegistry(store, window)
    window.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_EVENTS[2].register, {
      detail: { token: {}, definition } satisfies SkinCustomizationRegistration,
    }))
    return registry
  }

  function register(definition: SkinCustomizationDefinition): void {
    window.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_EVENTS[2].register, {
      detail: { token: {}, definition } satisfies SkinCustomizationRegistration,
    }))
  }

  it('exportPreferences returns the raw snapshot', () => {
    const registry = makeRegistry()
    registry.set(definition, 'artwork', false)
    expect(registry.exportPreferences()).toEqual({ example: { artwork: false } })
    registry.dispose()
  })

  it('importPreferences normalizes registered blocks and re-applies once', () => {
    const applied: Array<SkinCustomizationState | null> = []
    const live: SkinCustomizationDefinition = { ...definition, apply(state) { applied.push(state) } }
    const storage = new MemoryStorage()
    storage.setItem('dsh.skin-manager.preferences.v2', '{}')
    const registry = new SkinCustomizationRegistry(new PreferencesStore(storage, window), window)
    register(live)
    applied.length = 0
    const written = registry.importPreferences({ example: { artwork: 'bad', font: 'serif' }, 'unknown-skin': { x: 1 } })
    // Two blocks are stored: the registered skin's normalized one, and the
    // unloaded skin's verbatim one, which is normalized when it registers.
    expect(written).toBe(2)
    // One store notification drives exactly one apply pass, with the normalized
    // values — the store subscription already re-applies after a write.
    expect(applied).toHaveLength(1)
    expect(applied[0]?.values).toEqual({ artwork: true, font: 'serif' })
    expect(registry.exportPreferences()['unknown-skin']).toEqual({ x: 1 })
    registry.dispose()
  })

  it('normalizes a block stored for a skin that registers later', () => {
    // The safety argument behind keeping unknown blocks: a block stored verbatim
    // for an unloaded skin is normalized against its definition the moment that
    // skin registers, so nothing unvalidated can reach that skin's apply().
    const applied: Array<SkinCustomizationState | null> = []
    const registry = makeRegistry()
    expect(registry.importPreferences({ 'later-skin': { artwork: 'not-a-bool', font: 'removed-option' } })).toBe(1)
    expect(applied).toEqual([])
    register({
      protocol: 2,
      skinId: 'later-skin',
      title: 'Later',
      settings: [
        { key: 'artwork', type: 'boolean', label: 'Artwork', defaultValue: true },
        { key: 'font', type: 'select', label: 'Font', defaultValue: 'system', options: [{ value: 'system', label: 'System' }, { value: 'serif', label: 'Serif' }] },
      ],
      apply(state) { applied.push(state) },
    })
    expect(applied).toHaveLength(1)
    expect(applied[0]?.values).toEqual({ artwork: true, font: 'system' })
    registry.dispose()
  })

  it('removeUnregisteredSkins drops the blocks kept for unloaded skins', () => {
    const registry = makeRegistry()
    registry.importPreferences({ example: { artwork: false }, 'unknown-skin': { x: 1 } })
    expect(registry.removeUnregisteredSkins()).toBe(1)
    expect(registry.exportPreferences()).toEqual({ example: { artwork: false, font: 'system' } })
    expect(registry.removeUnregisteredSkins()).toBe(0)
    registry.dispose()
  })

  it('ignores a skin that declares the __proto__ id', () => {
    const registry = new SkinCustomizationRegistry(new PreferencesStore(new MemoryStorage(), window), window)
    register({ ...definition, skinId: '__proto__' })
    expect(registry.getSnapshot().definitions).toEqual([])
    registry.dispose()
  })

  it('resetSkin clears one skin and re-applies defaults', () => {
    const registry = makeRegistry()
    registry.set(definition, 'artwork', false)
    expect(registry.resetSkin('example')).toBe(true)
    expect(registry.exportPreferences().example).toBeUndefined()
    expect(registry.values(definition).artwork).toBe(true)
    expect(registry.resetSkin('example')).toBe(false)
    registry.dispose()
  })
})
