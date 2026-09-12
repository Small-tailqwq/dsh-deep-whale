/**
 * Preferences export/import — a portable, versioned JSON envelope that lets a
 * user back up, share, and migrate their skin configuration across browsers
 * and machines. The transfer layer is pure: it never touches localStorage or
 * the DOM directly, so every code path is testable without a browser.
 *
 * The envelope records the producing schema version, a UTC timestamp, the
 * originating store key, and a skin-keyed preferences block. Importers parse
 * the envelope defensively — every field is re-validated against the live
 * skin definitions through the same {@link normalizeSkinValues} path that
 * guards runtime reads, so unknown keys, removed settings, and malformed
 * values can never reach the persisted store.
 */
import type { SkinCustomizationDefinition } from '../protocol.ts'
import type { Preferences } from './preferences.ts'
import { normalizeSkinValues } from './preferences.ts'

/** Envelope schema version; bump when the wire format changes meaningfully. */
export const PREFERENCES_EXPORT_SCHEMA = 1
/** Stable source marker so importers can reject unrelated JSON early. */
export const PREFERENCES_EXPORT_SOURCE = 'dsh-skin-manager'
/** Maximum accepted file size for an import (256 KiB). Defends against accidents. */
export const PREFERENCES_IMPORT_MAX_BYTES = 256 * 1024

export interface PreferencesExport {
  schema: typeof PREFERENCES_EXPORT_SCHEMA
  source: typeof PREFERENCES_EXPORT_SOURCE
  exportedAt: string
  preferences: Preferences
}

/** Error thrown when an import payload cannot be promoted to a live store. */
export class PreferencesImportError extends Error {
  constructor(readonly code: 'empty' | 'invalid-json' | 'invalid-envelope' | 'no-matching-skins' | 'too-large', message: string) {
    super(message)
    this.name = 'PreferencesImportError'
  }
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

/** Build a versioned export envelope from a raw preferences snapshot. */
export function buildPreferencesExport(prefs: Preferences, now: Date = new Date()): PreferencesExport {
  const clean: Preferences = {}
  for (const [skinId, block] of Object.entries(prefs)) {
    if (block === undefined) continue
    clean[skinId] = isObject(block) ? { ...block } : {}
  }
  return {
    schema: PREFERENCES_EXPORT_SCHEMA,
    source: PREFERENCES_EXPORT_SOURCE,
    exportedAt: now.toISOString(),
    preferences: clean,
  }
}

/**
 * Pretty-print an export envelope for file download. The envelope is built
 * with a fixed key order (schema → source → exportedAt → preferences), so a
 * plain JSON.stringify preserves that order without a replacer array — a
 * replacer whitelist would recurse into nested preferences blocks and strip
 * every skin id and setting key.
 */
export function serializePreferencesExport(exported: PreferencesExport): string {
  const ordered: PreferencesExport = {
    schema: exported.schema,
    source: exported.source,
    exportedAt: exported.exportedAt,
    preferences: exported.preferences,
  }
  return `${JSON.stringify(ordered, null, 2)}\n`
}

/**
 * Parse and structurally validate a raw JSON string. Throws
 * {@link PreferencesImportError} on any structural problem; never throws for
 * a network or DOM reason.
 */
export function parsePreferencesExport(raw: string, maxBytes = PREFERENCES_IMPORT_MAX_BYTES): PreferencesExport {
  if (raw === '' || raw === null) throw new PreferencesImportError('empty', 'empty-payload')
  if (raw.length > maxBytes) throw new PreferencesImportError('too-large', 'payload-exceeds-max-size')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new PreferencesImportError('invalid-json', 'invalid-json-syntax')
  }
  if (!isObject(parsed)) throw new PreferencesImportError('invalid-envelope', 'envelope-not-object')
  if (parsed.schema !== PREFERENCES_EXPORT_SCHEMA) throw new PreferencesImportError('invalid-envelope', 'unsupported-schema')
  if (parsed.source !== PREFERENCES_EXPORT_SOURCE) throw new PreferencesImportError('invalid-envelope', 'unknown-source')
  if (typeof parsed.exportedAt !== 'string' || parsed.exportedAt === '') throw new PreferencesImportError('invalid-envelope', 'missing-exported-at')
  if (!isPreferences(parsed.preferences)) throw new PreferencesImportError('invalid-envelope', 'preferences-not-object')
  return {
    schema: PREFERENCES_EXPORT_SCHEMA,
    source: PREFERENCES_EXPORT_SOURCE,
    exportedAt: parsed.exportedAt,
    preferences: parsed.preferences,
  }
}

/**
 * Project an import envelope onto the currently-registered skin definitions.
 * Each skin block is normalized so that:
 *  - unknown setting keys are dropped,
 *  - removed settings fall back to their declared defaults,
 *  - malformed values fall back to their declared defaults,
 *  - skins not in the current registry are skipped entirely.
 *
 * Returns the normalized preferences along with a report of how many skins
 * matched, so the UI can surface "imported N skins" feedback. Throws
 * {@link PreferencesImportError} when nothing in the envelope matches.
 */
export function validatePreferencesExport(
  exported: PreferencesExport,
  definitions: Iterable<SkinCustomizationDefinition>,
): { preferences: Preferences, matchedSkins: string[] } {
  const matched: string[] = []
  const normalized: Preferences = {}
  for (const definition of definitions) {
    const block = exported.preferences[definition.skinId]
    if (block === undefined) continue
    normalized[definition.skinId] = normalizeSkinValues(definition, block)
    matched.push(definition.skinId)
  }
  if (matched.length === 0) throw new PreferencesImportError('no-matching-skins', 'no-skins-matched')
  return { preferences: normalized, matchedSkins: matched }
}

/** Convenience: parse → validate in one call. See {@link parsePreferencesExport}. */
export function importPreferencesFromText(
  raw: string,
  definitions: Iterable<SkinCustomizationDefinition>,
): { preferences: Preferences, matchedSkins: string[], exportedAt: string } {
  const exported = parsePreferencesExport(raw)
  const result = validatePreferencesExport(exported, definitions)
  return { ...result, exportedAt: exported.exportedAt }
}

/** Default download filename for an export, scoped to the export date. */
export function defaultExportFileName(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10)
  return `dsh-skin-preferences-${stamp}.json`
}
