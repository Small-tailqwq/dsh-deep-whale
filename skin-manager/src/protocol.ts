/**
 * Stable browser seam between the built-in manager and independently bundled
 * skins. A skin declares controls and owns every side effect produced by apply().
 */
export const SKIN_CUSTOMIZATION_PROTOCOL = 1 as const
export const SKIN_CUSTOMIZATION_REGISTER_EVENT = 'dsh:skin-customization-register-v1'
export const SKIN_CUSTOMIZATION_UNREGISTER_EVENT = 'dsh:skin-customization-unregister-v1'
export const SKIN_CUSTOMIZATION_READY_EVENT = 'dsh:skin-customization-ready-v1'

export interface TimeRange {
  start: string
  end: string
}

export interface VisibilitySchedule {
  enabled: boolean
  /** Visibility outside the configured ranges; ranges always use the inverse. */
  outside: 'visible' | 'hidden'
  ranges: TimeRange[]
}

interface SettingBase<T> {
  key: string
  label: string
  description?: string
  defaultValue: T
}

export interface BooleanSetting extends SettingBase<boolean> {
  type: 'boolean'
}

export interface SelectSetting extends SettingBase<string> {
  type: 'select'
  options: Array<{ value: string, label: string }>
}

export interface VisibilityScheduleSetting extends SettingBase<VisibilitySchedule> {
  type: 'visibility-schedule'
}

export type SkinSetting = BooleanSetting | SelectSetting | VisibilityScheduleSetting
export type SkinSettingValue = boolean | string | VisibilitySchedule
export type SkinValues = Record<string, SkinSettingValue>

export interface SkinCustomizationState {
  values: SkinValues
  /** Effective visibility for every visibility-schedule setting. */
  visibility: Record<string, boolean>
}

export interface SkinCustomizationDefinition {
  protocol: typeof SKIN_CUSTOMIZATION_PROTOCOL
  skinId: string
  title: string
  settings: SkinSetting[]
  /** null means release all customization-owned state. Must be idempotent. */
  apply(state: SkinCustomizationState | null): void
}

export interface SkinCustomizationRegistration {
  token: object
  definition: SkinCustomizationDefinition
}

/**
 * Expose one skin definition without a runtime dependency on the manager.
 * The ready handshake makes load order and manager hot reload irrelevant.
 */
export function exposeSkinCustomization(
  definition: SkinCustomizationDefinition,
  target: Window = window,
): () => void {
  const token = {}
  const register = (): void => target.dispatchEvent(new CustomEvent<SkinCustomizationRegistration>(
    SKIN_CUSTOMIZATION_REGISTER_EVENT,
    { detail: { token, definition } },
  ))
  target.addEventListener(SKIN_CUSTOMIZATION_READY_EVENT, register)
  register()
  return () => {
    target.removeEventListener(SKIN_CUSTOMIZATION_READY_EVENT, register)
    target.dispatchEvent(new CustomEvent<SkinCustomizationRegistration>(
      SKIN_CUSTOMIZATION_UNREGISTER_EVENT,
      { detail: { token, definition } },
    ))
    definition.apply(null)
  }
}

/** Attribute projection helper for skins; it restores only values it still owns. */
export class SkinAttributeProjector {
  private readonly originals = new Map<string, string | null>()
  private readonly owned = new Map<string, string | null>()

  constructor(private readonly root: HTMLElement = document.documentElement) {}

  set(attribute: string, value: string): void {
    if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute))
    this.root.setAttribute(attribute, value)
    this.owned.set(attribute, value)
  }

  unset(attribute: string): void {
    if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute))
    this.root.removeAttribute(attribute)
    this.owned.set(attribute, null)
  }

  release(attribute?: string): void {
    const attributes = attribute === undefined ? [...this.originals.keys()] : [attribute]
    for (const name of attributes) {
      if (!this.originals.has(name)) continue
      const original = this.originals.get(name) ?? null
      if (this.root.getAttribute(name) === this.owned.get(name)) {
        if (original === null) this.root.removeAttribute(name)
        else this.root.setAttribute(name, original)
      }
      this.originals.delete(name)
      this.owned.delete(name)
    }
  }
}
