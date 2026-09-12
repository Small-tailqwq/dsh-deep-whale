import type { SkinCustomizationDefinition, SkinSetting, SkinSettingValue, SkinValues } from '../protocol.ts'
import { normalizeVisibilitySchedule } from './schedule.ts'

export const PREFERENCES_KEY = 'dsh.skin-manager.preferences.v2'
const LEGACY_PREFERENCES_KEY = 'dsh-deep-whale.skin-manager.v1'
export type Preferences = Record<string, Record<string, unknown>>

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

/**
 * Store one skin block as an own data property. Plain assignment would invoke
 * the `__proto__` accessor inherited from `Object.prototype`, which rewrites the
 * target's prototype and stores no block at all.
 */
export function assignBlock(target: Preferences, skinId: string, block: Record<string, unknown>): void {
  Object.defineProperty(target, skinId, { value: block, writable: true, enumerable: true, configurable: true })
}

/**
 * Preferences as {@link PreferencesStore.replace} leaves them: incoming blocks win
 * and blocks the import does not mention stay. Callers use this to inspect the
 * result of an import before it is committed.
 */
export function mergePreferences(current: Preferences, incoming: Preferences): Preferences {
  const merged: Preferences = { ...current }
  for (const [skinId, block] of Object.entries(incoming)) {
    if (block === undefined) continue
    assignBlock(merged, skinId, block)
  }
  return merged
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
    this.commit({
      ...this.value,
      [definition.skinId]: { ...this.value[definition.skinId], [key]: value },
    })
  }

  /**
   * Swap in `next` only after it has been serialized. Serializing first keeps
   * memory, storage and subscribers on the same value: a payload that overflows
   * `JSON.stringify` (a deeply nested imported block) or a storage write that
   * throws (quota exceeded) must not leave the in-memory store ahead of the
   * persisted one and silent for every later write.
   */
  private commit(next: Preferences): void {
    const serialized = JSON.stringify(next)
    const previous = this.value
    this.value = next
    try {
      this.storage.setItem(PREFERENCES_KEY, serialized)
    } catch (error) {
      this.value = previous
      throw error
    }
    this.listeners.forEach(listener => listener())
  }

  /** Full raw preferences snapshot for export; never mutates store state. */
  snapshot(): Preferences {
    return this.value
  }

  /**
   * Replace every skin's preferences in one atomic write. A block whose skin is
   * registered right now is normalized against its live definition, so unknown
   * keys, removed settings and malformed values never reach the persisted store.
   * A block whose skin is not registered — the inactive half of a mutually
   * exclusive pair on a fresh browser — is stored verbatim and normalized when
   * {@link values} next reads it against that skin's definition. Returns the
   * number of skin blocks stored.
   */
  replace(definitions: Iterable<SkinCustomizationDefinition>, incoming: Preferences): number {
    const next: Preferences = { ...this.value }
    const registered = new Set<string>()
    let written = 0
    for (const definition of definitions) {
      registered.add(definition.skinId)
      const block = incoming[definition.skinId]
      if (block === undefined) continue
      assignBlock(next, definition.skinId, normalizeSkinValues(definition, block))
      written += 1
    }
    for (const [skinId, block] of Object.entries(incoming)) {
      if (registered.has(skinId)) continue
      assignBlock(next, skinId, block)
      written += 1
    }
    if (written === 0) return 0
    this.commit(next)
    return written
  }

  /**
   * Drop every stored block whose skin the registry does not hold, returning the
   * removed ids. Imports keep blocks for skins that are not loaded yet, so this
   * is the one explicit way to discard that kept data.
   */
  removeUnregistered(registered: Iterable<string>): string[] {
    const known = new Set(registered)
    const removed = Object.keys(this.value).filter(skinId => !known.has(skinId))
    if (removed.length === 0) return []
    const next: Preferences = {}
    for (const [skinId, block] of Object.entries(this.value)) {
      if (known.has(skinId)) assignBlock(next, skinId, block)
    }
    this.commit(next)
    return removed
  }

  /** Remove every setting under one skin id; used by per-skin reset flows. */
  clearSkin(skinId: string): boolean {
    if (!Object.hasOwn(this.value, skinId)) return false
    const next = { ...this.value }
    delete next[skinId]
    this.commit(next)
    return true
  }
}
