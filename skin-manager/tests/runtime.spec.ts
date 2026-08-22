// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  exposeSkinCustomization,
  SkinAttributeProjector,
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
