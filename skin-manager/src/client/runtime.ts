import {
  LEGACY_SKIN_CUSTOMIZATION_PROTOCOL,
  SKIN_CUSTOMIZATION_EVENTS,
  SKIN_CUSTOMIZATION_PROTOCOL,
  type SkinCustomizationDefinition,
  type SkinCustomizationProtocol,
  type SkinCustomizationRegistration,
  type SkinSettingValue,
  type VisibilitySchedule,
} from '../protocol.ts'
import { PreferencesStore, type Preferences } from './preferences.ts'
import { DEFAULT_PRESET_ID } from './presets.ts'
import { millisecondsToNextMinute, scheduleVisibility } from './schedule.ts'

export interface RegistrySnapshot {
  definitions: SkinCustomizationDefinition[]
  revision: number
}

/** Owns discovery, persistence fan-out, and clock updates behind one registry interface. */
export class SkinCustomizationRegistry {
  private readonly definitions = new Map<object, SkinCustomizationDefinition>()
  private readonly listeners = new Set<() => void>()
  private snapshot: RegistrySnapshot = { definitions: [], revision: 0 }
  private timer: number | undefined
  private readonly unsubscribeStore: () => void

  constructor(
    private readonly store = new PreferencesStore(),
    private readonly target: Window = window,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.unsubscribeStore = store.subscribe(() => {
      this.applyAll()
      this.emit()
    })
    for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
      target.addEventListener(events.register, this.onRegister)
      target.addEventListener(events.unregister, this.onUnregister)
      target.dispatchEvent(new Event(events.ready))
    }
  }

  readonly getSnapshot = (): RegistrySnapshot => this.snapshot

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  values(definition: SkinCustomizationDefinition) {
    return this.store.values(definition)
  }

  set(definition: SkinCustomizationDefinition, key: string, value: SkinSettingValue): void {
    this.store.set(definition, key, value)
  }

  /** Raw preferences snapshot for export; never mutates store state. */
  exportPreferences(): Preferences {
    return this.store.snapshot()
  }

  /**
   * Replace every skin's preferences in one atomic write. Each block is
   * normalized against its live definition so unknown keys and malformed
   * values never reach the persisted store. Returns the number of skins
   * actually written. Subscribers are notified once per call.
   */
  importPreferences(incoming: Preferences): number {
    const written = this.store.replace(this.snapshot.definitions, incoming)
    if (written > 0) this.applyAll()
    return written
  }

  /** Remove every setting under one skin id; used by per-skin reset flows. */
  resetSkin(skinId: string): boolean {
    const cleared = this.store.clearSkin(skinId)
    if (cleared) this.applyAll()
    return cleared
  }

  /**
   * Apply a named preset. The built-in Defaults preset clears every known
   * skin's stored block so each setting reverts to its declared default;
   * any other preset is projected through the store's replace path, which
   * normalizes every value against the live skin definitions. Returns the
   * number of skin blocks actually written.
   */
  applyPreset(preset: { id: string, preferences: Preferences }): number {
    if (preset.id === DEFAULT_PRESET_ID) {
      let cleared = 0
      for (const definition of this.snapshot.definitions) {
        if (this.store.clearSkin(definition.skinId)) cleared += 1
      }
      if (cleared > 0) this.applyAll()
      return cleared
    }
    return this.importPreferences(preset.preferences)
  }

  dispose(): void {
    for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
      this.target.removeEventListener(events.register, this.onRegister)
      this.target.removeEventListener(events.unregister, this.onUnregister)
    }
    this.unsubscribeStore()
    this.store.dispose()
    if (this.timer !== undefined) this.target.clearTimeout(this.timer)
    for (const definition of this.definitions.values()) definition.apply(null)
    this.definitions.clear()
  }

  private readonly onRegister = (event: Event): void => {
    const detail = event instanceof CustomEvent
      ? event.detail as SkinCustomizationRegistration | undefined
      : undefined
    const protocol = this.eventProtocol(event.type, 'register')
    if (!detail || protocol === undefined || !this.valid(detail.definition, protocol)) return
    this.definitions.set(detail.token, detail.definition)
    this.rebuildSnapshot()
    this.applyAll()
  }

  private readonly onUnregister = (event: Event): void => {
    const detail = event instanceof CustomEvent
      ? event.detail as SkinCustomizationRegistration | undefined
      : undefined
    const protocol = this.eventProtocol(event.type, 'unregister')
    if (!detail || protocol !== detail.definition.protocol || this.definitions.get(detail.token) !== detail.definition) return
    detail.definition.apply(null)
    this.definitions.delete(detail.token)
    this.rebuildSnapshot()
    this.scheduleClock()
  }

  private eventProtocol(type: string, phase: 'register' | 'unregister'): SkinCustomizationProtocol | undefined {
    if (type === SKIN_CUSTOMIZATION_EVENTS[LEGACY_SKIN_CUSTOMIZATION_PROTOCOL][phase]) return LEGACY_SKIN_CUSTOMIZATION_PROTOCOL
    if (type === SKIN_CUSTOMIZATION_EVENTS[SKIN_CUSTOMIZATION_PROTOCOL][phase]) return SKIN_CUSTOMIZATION_PROTOCOL
    return undefined
  }

  private valid(definition: SkinCustomizationDefinition, protocol: SkinCustomizationProtocol): boolean {
    if (definition?.protocol !== protocol || typeof definition.skinId !== 'string' || typeof definition.apply !== 'function' || !Array.isArray(definition.settings)) return false
    const settingTypes = new Set(['boolean', 'select', 'range', 'color', 'checkbox-group', 'visibility-schedule'])
    if (!definition.settings.every(setting => setting !== null && typeof setting === 'object' && settingTypes.has(setting.type))) return false
    const keys = definition.settings.map(setting => setting.key)
    return keys.length === new Set(keys).size && keys.every(key => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key))
  }

  private rebuildSnapshot(): void {
    this.snapshot = {
      definitions: [...new Set(this.definitions.values())],
      revision: this.snapshot.revision + 1,
    }
    this.listeners.forEach(listener => listener())
  }

  private emit(): void {
    this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1 }
    this.listeners.forEach(listener => listener())
  }

  private applyAll(): void {
    const now = this.now()
    for (const definition of new Set(this.definitions.values())) {
      const values = this.store.values(definition)
      const visibility = Object.fromEntries(definition.settings
        .filter(setting => setting.type === 'visibility-schedule')
        .map(setting => [setting.key, scheduleVisibility(values[setting.key] as VisibilitySchedule, now)]))
      try {
        definition.apply({ values, visibility })
      } catch (error) {
        console.error(`[skin-manager] ${definition.skinId} customization failed`, error)
      }
    }
    this.scheduleClock()
  }

  private scheduleClock(): void {
    if (this.timer !== undefined) this.target.clearTimeout(this.timer)
    const hasEnabledSchedule = [...new Set(this.definitions.values())].some((definition) => {
      const values = this.store.values(definition)
      return definition.settings.some(setting => (
        setting.type === 'visibility-schedule'
        && (values[setting.key] as VisibilitySchedule).enabled
      ))
    })
    this.timer = hasEnabledSchedule
      ? this.target.setTimeout(() => this.applyAll(), millisecondsToNextMinute(this.now()))
      : undefined
  }
}
