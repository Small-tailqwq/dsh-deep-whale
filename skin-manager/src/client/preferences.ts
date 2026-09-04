import type { SkinCustomizationDefinition, SkinSetting, SkinSettingValue, SkinValues } from '../protocol.ts'
import { normalizeVisibilitySchedule } from './schedule.ts'

export const PREFERENCES_KEY = 'dsh.skin-manager.preferences.v2'
const LEGACY_PREFERENCES_KEY = 'dsh-deep-whale.skin-manager.v1'
export type Preferences = Record<string, Record<string, unknown>>

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function readJson(storage: Pick<Storage, 'getItem'>, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function migrateLegacy(value: unknown): Preferences {
  const root = object(value)
  const maid = object(root.maid)
  const orca = object(root.orca)
  return {
    'maid-atelier': {
      artwork: maid.artwork,
      font: maid.font,
      modelExit: maid.modelExit,
    },
    'orca-link': {
      character: orca.character,
      background: orca.background,
      pricingLight: orca.pricingLight,
    },
  }
}

export function readPreferences(storage: Pick<Storage, 'getItem'> = localStorage): Preferences {
  const current = readJson(storage, PREFERENCES_KEY)
  if (typeof current === 'object' && current !== null) return object(current) as Preferences
  return migrateLegacy(readJson(storage, LEGACY_PREFERENCES_KEY))
}

function normalizeSetting(setting: SkinSetting, value: unknown): SkinSettingValue {
  if (setting.type === 'boolean') return typeof value === 'boolean' ? value : setting.defaultValue
  if (setting.type === 'select') {
    return typeof value === 'string' && setting.options.some(option => option.value === value)
      ? value
      : setting.defaultValue
  }
  if (setting.type === 'range') {
    const numeric = typeof value === 'number' && Number.isFinite(value) ? value : setting.defaultValue
    const min = setting.min
    const max = setting.max
    return Math.min(max, Math.max(min, numeric))
  }
  if (setting.type === 'color') {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
      ? value.toLowerCase()
      : setting.defaultValue
  }
  if (setting.type === 'checkbox-group') {
    const selected = new Set(Array.isArray(value) ? value : setting.defaultValue)
    return setting.options
      .map(option => option.value)
      .filter(option => selected.has(option))
  }
  return normalizeVisibilitySchedule(value, setting.defaultValue)
}

function settingSourceValue(setting: SkinSetting, source: Record<string, unknown>): unknown {
  if (Object.hasOwn(source, setting.key)) return source[setting.key]
  const legacy = setting.legacyValue
  if (legacy === undefined) return undefined
  const legacyValue = source[legacy.key]
  if (typeof legacyValue !== 'boolean' && typeof legacyValue !== 'string' && typeof legacyValue !== 'number') {
    return undefined
  }
  const key = String(legacyValue)
  return Object.hasOwn(legacy.map, key) ? legacy.map[key] : undefined
}

export function normalizeSkinValues(
  definition: SkinCustomizationDefinition,
  value: unknown,
): SkinValues {
  const source = object(value)
  return Object.fromEntries(definition.settings.map(setting => [
    setting.key,
    normalizeSetting(setting, settingSourceValue(setting, source)),
  ]))
}

export class PreferencesStore {
  private value: Preferences
  private readonly listeners = new Set<() => void>()
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== PREFERENCES_KEY) return
    this.value = readPreferences(this.storage)
    this.listeners.forEach(listener => listener())
  }

  readonly dispose: () => void

  constructor(private readonly storage: Storage = localStorage, target: Window = window) {
    this.value = readPreferences(storage)
    target.addEventListener('storage', this.onStorage)
    this.dispose = () => target.removeEventListener('storage', this.onStorage)
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  values(definition: SkinCustomizationDefinition): SkinValues {
    return normalizeSkinValues(definition, this.value[definition.skinId])
  }

  set(definition: SkinCustomizationDefinition, key: string, value: SkinSettingValue): void {
    if (!definition.settings.some(setting => setting.key === key)) return
    this.value = {
      ...this.value,
      [definition.skinId]: { ...this.value[definition.skinId], [key]: value },
    }
    this.storage.setItem(PREFERENCES_KEY, JSON.stringify(this.value))
    this.listeners.forEach(listener => listener())
  }
}
