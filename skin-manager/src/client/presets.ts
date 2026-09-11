/**
 * Named presets — save the full skin-manager preferences snapshot under a
 * user-chosen name, and re-apply it later in one click. Presets live in their
 * own localStorage slot, separate from the active preferences, so saving one
 * never disturbs the current configuration.
 *
 * A built-in virtual "Defaults" preset is always present at the top of the
 * list; applying it clears every skin's stored preferences so each setting
 * falls back to its declared default. It is never persisted and cannot be
 * renamed or deleted.
 *
 * The store is intentionally narrow: it owns only the preset roster. Applying
 * a preset delegates to {@link PreferencesStore.replace}, which normalizes
 * every value against the live skin definitions — a preset saved under an
 * older skin version stays safe to apply after an upgrade.
 */
import type { SkinCustomizationDefinition } from '../protocol.ts'
import { PreferencesStore, type Preferences } from './preferences.ts'

export const PRESETS_KEY = 'dsh.skin-manager.presets.v1'
export const DEFAULT_PRESET_ID = '__defaults__'
export const DEFAULT_PRESET_NAME_ZH = '默认配置'
export const DEFAULT_PRESET_NAME_EN = 'Defaults'
export const MAX_PRESETS = 24
export const MAX_PRESET_NAME_LENGTH = 32

export interface SkinPreset {
  id: string
  name: string
  createdAt: string
  preferences: Preferences
}

export interface PresetSnapshot {
  presets: SkinPreset[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPreferences(value: unknown): value is Preferences {
  if (!isObject(value)) return false
  for (const block of Object.values(value)) {
    if (block === undefined) continue
    if (!isObject(block)) return false
  }
  return true
}

function isPreset(value: unknown): value is SkinPreset {
  if (!isObject(value)) return false
  if (typeof value.id !== 'string' || value.id === '') return false
  if (typeof value.name !== 'string' || value.name === '') return false
  if (typeof value.createdAt !== 'string' || value.createdAt === '') return false
  if (!isPreferences(value.preferences)) return false
  return true
}

function readJson(storage: Pick<Storage, 'getItem'>, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** Parse the persisted preset roster defensively; bad rows are dropped. */
export function parsePresetSnapshot(value: unknown): PresetSnapshot {
  if (!isObject(value)) return { presets: [] }
  const list = value.presets
  if (!Array.isArray(list)) return { presets: [] }
  const presets: SkinPreset[] = []
  const ids = new Set<string>()
  for (const entry of list) {
    if (!isPreset(entry)) continue
    if (entry.id === DEFAULT_PRESET_ID) continue
    if (ids.has(entry.id)) continue
    ids.add(entry.id)
    presets.push({
      id: entry.id,
      name: entry.name.slice(0, MAX_PRESET_NAME_LENGTH),
      createdAt: entry.createdAt,
      preferences: entry.preferences,
    })
  }
  return { presets: presets.slice(0, MAX_PRESETS) }
}

export function readPresets(storage: Pick<Storage, 'getItem'> = localStorage): PresetSnapshot {
  return parsePresetSnapshot(readJson(storage, PRESETS_KEY))
}

/** Generate a short, sortable, collision-resistant id without crypto deps. */
export function generatePresetId(now: Date = new Date()): string {
  return `p-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** The virtual Defaults preset, always rendered first in the roster. */
export function defaultPreset(lang: 'zh' | 'en' = 'zh'): SkinPreset {
  return {
    id: DEFAULT_PRESET_ID,
    name: lang === 'zh' ? DEFAULT_PRESET_NAME_ZH : DEFAULT_PRESET_NAME_EN,
    createdAt: '',
    preferences: {},
  }
}

export interface PresetNameValidation {
  ok: boolean
  error?: 'empty' | 'too-long' | 'duplicate'
}

/** Validate a candidate preset name against the existing roster. */
export function validatePresetName(name: string, existing: SkinPreset[]): PresetNameValidation {
  const trimmed = name.trim()
  if (trimmed === '') return { ok: false, error: 'empty' }
  if (trimmed.length > MAX_PRESET_NAME_LENGTH) return { ok: false, error: 'too-long' }
  if (existing.some(preset => preset.name === trimmed)) return { ok: false, error: 'duplicate' }
  return { ok: true }
}

/**
 * Presets store: CRUD over named preference snapshots. Notifications fire on
 * every mutating operation so React subscribers can re-render through the
 * same useSyncExternalStore pattern the preferences store uses.
 */
export class PresetsStore {
  private snapshot: PresetSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== PRESETS_KEY) return
    this.snapshot = readPresets(this.storage)
    this.listeners.forEach(listener => listener())
  }

  readonly dispose: () => void

  constructor(private readonly storage: Storage = localStorage, target: Window = window) {
    this.snapshot = readPresets(storage)
    target.addEventListener('storage', this.onStorage)
    this.dispose = () => target.removeEventListener('storage', this.onStorage)
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Current preset roster, oldest first; the Defaults preset is NOT included. */
  list(): SkinPreset[] {
    return this.snapshot.presets
  }

  private persist(next: PresetSnapshot): void {
    this.snapshot = next
    this.storage.setItem(PRESETS_KEY, JSON.stringify(next))
    this.listeners.forEach(listener => listener())
  }

  /** Save the given preferences under a new name; returns the new preset or throws. */
  save(name: string, preferences: Preferences, now: Date = new Date()): SkinPreset {
    const trimmed = name.trim()
    const validation = validatePresetName(trimmed, this.snapshot.presets)
    if (!validation.ok) throw new Error(`preset-name-${validation.error}`)
    if (this.snapshot.presets.length >= MAX_PRESETS) throw new Error('preset-limit-reached')
    const preset: SkinPreset = {
      id: generatePresetId(now),
      name: trimmed,
      createdAt: now.toISOString(),
      preferences,
    }
    this.persist({ presets: [...this.snapshot.presets, preset] })
    return preset
  }

  /** Rename an existing preset; id and preferences are preserved. */
  rename(id: string, name: string): boolean {
    const trimmed = name.trim()
    const preset = this.snapshot.presets.find(item => item.id === id)
    if (preset === undefined) return false
    const validation = validatePresetName(trimmed, this.snapshot.presets.filter(item => item.id !== id))
    if (!validation.ok) throw new Error(`preset-name-${validation.error}`)
    this.persist({
      presets: this.snapshot.presets.map(item => item.id === id ? { ...item, name: trimmed } : item),
    })
    return true
  }

  /** Remove a preset by id; returns false if the id was not found. */
  delete(id: string): boolean {
    if (!this.snapshot.presets.some(item => item.id === id)) return false
    this.persist({ presets: this.snapshot.presets.filter(item => item.id !== id) })
    return true
  }

  /** Fetch one preset by id (excluding the virtual Defaults preset). */
  get(id: string): SkinPreset | undefined {
    return this.snapshot.presets.find(item => item.id === id)
  }
}

/**
 * Apply one preset to the preferences store. The Defaults preset clears every
 * known skin's stored block so each setting reverts to its declared default;
 * any other preset is projected through {@link PreferencesStore.replace},
 * which normalizes every value against the live skin definitions.
 *
 * Returns the number of skin blocks actually written.
 */
export function applyPreset(
  preset: SkinPreset,
  definitions: Iterable<SkinCustomizationDefinition>,
  store: PreferencesStore,
): number {
  if (preset.id === DEFAULT_PRESET_ID) {
    let cleared = 0
    for (const definition of definitions) {
      if (store.clearSkin(definition.skinId)) cleared += 1
    }
    return cleared
  }
  return store.replace(definitions, preset.preferences)
}
