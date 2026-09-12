/**
 * Preferences export/import — a portable, versioned JSON envelope that lets a
 * user back up, share, and migrate their skin configuration across browsers
 * and machines. The transfer layer is pure: it never touches localStorage or
 * the DOM directly, so every code path is testable without a browser.
 *
 * The envelope records the producing schema version, a UTC timestamp, the
 * originating store key, and a skin-keyed preferences block. Importers parse
 * the envelope defensively: blocks for registered skins are re-validated against
 * the live definitions through the same {@link normalizeSkinValues} path that
 * guards runtime reads, so unknown keys, removed settings, and malformed values
 * can never reach a live skin; blocks for skins that are not loaded are stored
 * verbatim and normalized the same way the moment their skin registers. The
 * structural budget (block count, nesting depth, skin ids, UTF-8 byte size) is
 * enforced here so nothing the store cannot write back can enter it.
 */
import type { SkinCustomizationDefinition } from '../protocol.ts'
import type { Preferences } from './preferences.ts'
import { assignBlock, normalizeSkinValues } from './preferences.ts'

/** Envelope schema version; bump when the wire format changes meaningfully. */
export const PREFERENCES_EXPORT_SCHEMA = 1
/** Stable source marker so importers can reject unrelated JSON early. */
export const PREFERENCES_EXPORT_SOURCE = 'dsh-skin-manager'
/** Maximum accepted configuration content for an import (256 KiB of UTF-8 bytes). Defends against accidents. */
export const PREFERENCES_IMPORT_MAX_BYTES = 256 * 1024
/**
 * Raw text ceiling applied before parsing. The budget above counts configuration
 * content, so formatting whitespace may pad a legal payload; this only bounds how
 * much text reaches `JSON.parse`.
 */
export const PREFERENCES_IMPORT_MAX_TEXT_BYTES = PREFERENCES_IMPORT_MAX_BYTES * 2
/** Maximum skin blocks one envelope may carry. */
export const PREFERENCES_IMPORT_MAX_SKINS = 64
/**
 * Maximum nesting accepted inside `preferences`. Real blocks are at most a few
 * levels deep (block → setting → object → array → entry); the bound keeps a
 * legal-sized envelope from storing a structure that later overflows
 * `JSON.stringify` when the store is written or exported.
 */
export const PREFERENCES_IMPORT_MAX_DEPTH = 32

export interface PreferencesExport {
  schema: typeof PREFERENCES_EXPORT_SCHEMA
  source: typeof PREFERENCES_EXPORT_SOURCE
  exportedAt: string
  preferences: Preferences
}

/** Error thrown when an import payload cannot be promoted to a live store. */
export class PreferencesImportError extends Error {
  constructor(readonly code: 'empty' | 'invalid-json' | 'invalid-envelope' | 'no-matching-skins' | 'too-large' | 'store-too-large', message: string) {
    super(message)
    this.name = 'PreferencesImportError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Whether the text exceeds `limit` UTF-8 bytes. `String#length` counts UTF-16
 * units, so multi-byte text can pass a character check and still exceed the byte
 * budget; encoding the whole payload to measure it would allocate a second copy
 * of an arbitrarily large input, so count units and stop at the first overrun.
 * Unpaired surrogates count as the three-byte replacement character they encode
 * to, which keeps the count equal to the encoded length.
 */
function exceedsBytes(text: string, limit: number): boolean {
  let bytes = 0
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      const low = text.charCodeAt(index + 1)
      if (low >= 0xdc00 && low <= 0xdfff) {
        bytes += 4
        index += 1
      } else bytes += 3
    } else bytes += 3
    if (bytes > limit) return true
  }
  return false
}

/**
 * Whether a block may be keyed by this skin id. `__proto__` is the one name that
 * needs an own-property write at every assignment site and has no legitimate skin
 * behind it, so an envelope carrying it is rejected rather than stored.
 */
function isStorableSkinId(skinId: string): boolean {
  return skinId !== '__proto__'
}

/**
 * Whether any value in the tree is nested deeper than `max`. Iterative on
 * purpose: the guard exists to reject deeply nested input, so it must not
 * recurse into it. Depth starts at the preferences root.
 */
function exceedsDepth(value: unknown, max: number): boolean {
  const stack: Array<{ node: unknown, depth: number }> = [{ node: value, depth: 0 }]
  while (stack.length > 0) {
    const { node, depth } = stack.pop()!
    if (depth > max) return true
    if (typeof node !== 'object' || node === null) continue
    for (const child of Object.values(node)) stack.push({ node: child, depth: depth + 1 })
  }
  return false
}

function isPreferences(value: unknown): value is Preferences {
  if (!isObject(value)) return false
  for (const block of Object.values(value)) {
    if (block === undefined) continue
    if (!isObject(block)) return false
  }
  return true
}

/**
 * Reject a preferences block the store could not hold or round-trip. Enforced on
 * every entrance — the parsed envelope and the projection — so no caller can
 * hand the store a structure that later breaks a write or an export.
 */
function assertStorablePreferences(preferences: Preferences): void {
  const skinIds = Object.keys(preferences)
  if (skinIds.length > PREFERENCES_IMPORT_MAX_SKINS) throw new PreferencesImportError('invalid-envelope', 'too-many-skin-blocks')
  if (skinIds.some(skinId => !isStorableSkinId(skinId))) throw new PreferencesImportError('invalid-envelope', 'unstorable-skin-id')
  if (exceedsDepth(preferences, PREFERENCES_IMPORT_MAX_DEPTH)) throw new PreferencesImportError('invalid-envelope', 'preferences-too-deep')
}

/**
 * Reject a preference set the importer could not restore. The budget counts
 * configuration content — the same measure `parsePreferencesExport` applies — so a
 * set that passes here always exports to a file that passes. Imports keep blocks
 * for unloaded skins, so without this the store can accumulate past the budget and
 * answer with a backup nothing in the manager accepts.
 */
export function assertPreferencesImportable(preferences: Preferences): void {
  if (!exceedsBytes(JSON.stringify(buildPreferencesExport(preferences)), PREFERENCES_IMPORT_MAX_BYTES)) return
  throw new PreferencesImportError('store-too-large', 'stored-preferences-exceed-import-budget')
}

/** Build a versioned export envelope from a raw preferences snapshot. */
export function buildPreferencesExport(prefs: Preferences, now: Date = new Date()): PreferencesExport {
  const clean: Preferences = {}
  for (const [skinId, block] of Object.entries(prefs)) {
    if (block === undefined) continue
    assignBlock(clean, skinId, isObject(block) ? { ...block } : {})
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
 *
 * Deep nesting can pad a legal payload past the text ceiling the importer applies
 * before parsing, which would make the manager reject its own backup; the compact
 * form is used when that happens, and its size is what the content budget bounds.
 */
export function serializePreferencesExport(exported: PreferencesExport): string {
  const ordered: PreferencesExport = {
    schema: exported.schema,
    source: exported.source,
    exportedAt: exported.exportedAt,
    preferences: exported.preferences,
  }
  const padded = `${JSON.stringify(ordered, null, 2)}\n`
  return exceedsBytes(padded, PREFERENCES_IMPORT_MAX_TEXT_BYTES) ? `${JSON.stringify(ordered)}\n` : padded
}

/**
 * Parse and structurally validate a raw JSON string. Throws
 * {@link PreferencesImportError} on any structural problem; never throws for
 * a network or DOM reason.
 */
export function parsePreferencesExport(raw: string, maxBytes = PREFERENCES_IMPORT_MAX_BYTES): PreferencesExport {
  if (raw === '' || raw === null) throw new PreferencesImportError('empty', 'empty-payload')
  if (exceedsBytes(raw, maxBytes * 2)) throw new PreferencesImportError('too-large', 'payload-exceeds-max-size')
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
  // Structural guards first: they bound nesting, so measuring the content below
  // cannot overflow the stack on the payload they just rejected.
  assertStorablePreferences(parsed.preferences)
  // The budget counts configuration content, not the text that carried it: the
  // exporter may pretty-print or compact the same data, and both have to pass.
  if (exceedsBytes(JSON.stringify(parsed), maxBytes)) throw new PreferencesImportError('too-large', 'payload-exceeds-max-size')
  return {
    schema: PREFERENCES_EXPORT_SCHEMA,
    source: PREFERENCES_EXPORT_SOURCE,
    exportedAt: parsed.exportedAt,
    preferences: parsed.preferences,
  }
}

/**
 * Project an import envelope onto the currently-registered skin definitions.
 * Each registered skin block is normalized so that:
 *  - unknown setting keys are dropped,
 *  - removed settings fall back to their declared defaults,
 *  - malformed values fall back to their declared defaults.
 *
 * Skins the registry does not hold — mutual exclusion usually leaves the
 * inactive skins unloaded on a fresh browser, so a backup taken with both
 * installed arrives while only one is registered — keep their block verbatim in
 * `deferredSkins`. Nothing can reach a live skin unvalidated: every read
 * normalizes a block against its definition through
 * {@link normalizeSkinValues}, so a deferred block is normalized the moment its
 * skin registers. Dropping it here instead silently lost half of such a backup.
 *
 * Returns the projected preferences plus which skins matched and which are
 * deferred, so the UI can say what actually took effect. Throws
 * {@link PreferencesImportError} when the envelope carries no skin block at all
 * or when a block could not be stored (see {@link assertStorablePreferences}).
 */
export function validatePreferencesExport(
  exported: PreferencesExport,
  definitions: Iterable<SkinCustomizationDefinition>,
): { preferences: Preferences, matchedSkins: string[], deferredSkins: string[] } {
  assertStorablePreferences(exported.preferences)
  const matched: string[] = []
  const deferred: string[] = []
  const normalized: Preferences = {}
  const registered = new Set<string>()
  for (const definition of definitions) {
    registered.add(definition.skinId)
    const block = exported.preferences[definition.skinId]
    if (block === undefined) continue
    assignBlock(normalized, definition.skinId, normalizeSkinValues(definition, block))
    matched.push(definition.skinId)
  }
  for (const [skinId, block] of Object.entries(exported.preferences)) {
    if (registered.has(skinId)) continue
    assignBlock(normalized, skinId, block)
    deferred.push(skinId)
  }
  if (matched.length === 0 && deferred.length === 0) {
    throw new PreferencesImportError('no-matching-skins', 'no-skins-matched')
  }
  return { preferences: normalized, matchedSkins: matched, deferredSkins: deferred }
}

/** Convenience: parse → validate in one call. See {@link parsePreferencesExport}. */
export function importPreferencesFromText(
  raw: string,
  definitions: Iterable<SkinCustomizationDefinition>,
): { preferences: Preferences, matchedSkins: string[], deferredSkins: string[], exportedAt: string } {
  const exported = parsePreferencesExport(raw)
  const result = validatePreferencesExport(exported, definitions)
  return { ...result, exportedAt: exported.exportedAt }
}

/** Default download filename for an export, scoped to the export date. */
export function defaultExportFileName(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10)
  return `dsh-skin-preferences-${stamp}.json`
}
