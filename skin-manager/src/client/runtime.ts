import {
  LEGACY_SKIN_CUSTOMIZATION_PROTOCOL,
  SKIN_CUSTOMIZATION_EVENTS,
  SKIN_CUSTOMIZATION_PROTOCOL,
  type SkinCustomizationDefinition,
  type SkinCustomizationProtocol,
  type SkinCustomizationRegistration,
  type SkinSetting,
  type SkinSettingCondition,
  type SkinSettingValue,
  type VisibilitySchedule,
} from '../protocol.ts'
import { PreferencesStore, mergePreferences, type Preferences } from './preferences.ts'
import { millisecondsToNextMinute, scheduleVisibility } from './schedule.ts'
import { assertPreferencesImportable } from './transfer.ts'

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
   * actually written. The store notifies its subscribers (including this
   * registry's re-apply pass) exactly once, so nothing applies twice.
   *
   * The import is rejected while the store is untouched when the merged result
   * could no longer be exported into a file this manager accepts: kept blocks for
   * unloaded skins accumulate, and an unrestorable backup is worse than a failed
   * import the user can retry after clearing them.
   */
  importPreferences(incoming: Preferences): number {
    assertPreferencesImportable(mergePreferences(this.store.snapshot(), incoming))
    return this.store.replace(this.snapshot.definitions, incoming)
  }

  /** Remove every setting under one skin id; used by per-skin reset flows. */
  resetSkin(skinId: string): boolean {
    return this.store.clearSkin(skinId)
  }

  /**
   * Drop stored blocks for skins the registry does not hold — data an import
   * kept for skins that are not loaded. Returns how many blocks were removed.
   */
  removeUnregisteredSkins(): number {
    return this.store.removeUnregistered(this.snapshot.definitions.map(definition => definition.skinId)).length
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
    // The skin id becomes an object key in the preferences store; `__proto__`
    // cannot be stored as one and would resolve to the prototype instead.
    if (definition.skinId === '__proto__') return false
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

/** Whether one single-key condition holds for the current values. */
export function conditionMatches(condition: SkinSettingCondition, values: Record<string, SkinSettingValue>): boolean {
  const value = values[condition.key]
  return condition.values.some(candidate => candidate === value)
}

/**
 * Whether a setting should render. `anyOf` is the family-of-switches form: the
 * control shows while any listed condition holds, and the top-level single-key
 * mirror keeps the declaration readable for a manager that predates `anyOf`.
 */
export function settingVisible(setting: SkinSetting, values: Record<string, SkinSettingValue>): boolean {
  const condition = setting.visibleWhen
  if (condition === undefined) return true
  if ('anyOf' in condition) return condition.anyOf.some(entry => conditionMatches(entry, values))
  return conditionMatches(condition, values)
}
