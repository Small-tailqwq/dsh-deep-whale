import {
  SKIN_CUSTOMIZATION_READY_EVENT,
  SKIN_CUSTOMIZATION_REGISTER_EVENT,
  SKIN_CUSTOMIZATION_UNREGISTER_EVENT,
  type SkinCustomizationDefinition,
  type SkinCustomizationRegistration,
  type SkinSettingValue,
  type VisibilitySchedule,
} from '../protocol.ts'
import { PreferencesStore } from './preferences.ts'
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
    target.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, this.onRegister)
    target.addEventListener(SKIN_CUSTOMIZATION_UNREGISTER_EVENT, this.onUnregister)
    target.dispatchEvent(new Event(SKIN_CUSTOMIZATION_READY_EVENT))
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

  dispose(): void {
    this.target.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, this.onRegister)
    this.target.removeEventListener(SKIN_CUSTOMIZATION_UNREGISTER_EVENT, this.onUnregister)
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
    if (!detail || !this.valid(detail.definition)) return
    this.definitions.set(detail.token, detail.definition)
    this.rebuildSnapshot()
    this.applyAll()
  }

  private readonly onUnregister = (event: Event): void => {
    const detail = event instanceof CustomEvent
      ? event.detail as SkinCustomizationRegistration | undefined
      : undefined
    if (!detail || this.definitions.get(detail.token) !== detail.definition) return
    detail.definition.apply(null)
    this.definitions.delete(detail.token)
    this.rebuildSnapshot()
    this.scheduleClock()
  }

  private valid(definition: SkinCustomizationDefinition): boolean {
    if (definition?.protocol !== 1 || typeof definition.skinId !== 'string' || typeof definition.apply !== 'function') return false
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
