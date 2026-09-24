/**
 * Mirror of DSH 0.1.7's plugin admission for installed skins.
 *
 * The host denies a row whose `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` peer
 * ranges exclude the running version, unless the profile's
 * `compatibility.json` holds an exact `package@version → [runtime]` grant. The
 * denial lives only in the composed tree: the patch still says "enabled", so
 * without this mirror the manager would show a skin it cannot start as
 * switchable and a click would silently do nothing. Grants are never written
 * here; they go through the host's own `pluginManager.setVersionExemption`.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import satisfies from 'semver/functions/satisfies.js'
import valid from 'semver/functions/valid.js'
import type { SkinCompatibility } from './contract.ts'

/** The host's own profile-local grant file. */
export const PROFILE_COMPATIBILITY_FILENAME = 'compatibility.json'

let cachedRuntime: { entry: string | undefined, version: string | undefined } | undefined

/**
 * The running DSH version, read from the launcher's own `dsh-app-boot`
 * manifest, which is what the host compares against. Resolved from the
 * process entry, so it holds for npm and linked installations; hosts laid out
 * differently (for example a packaged desktop runtime) yield undefined, and
 * callers then make no compatibility claim.
 */
export function readDshRuntimeVersion(entry: string | undefined = process.argv[1]): string | undefined {
  if (cachedRuntime !== undefined && cachedRuntime.entry === entry) return cachedRuntime.version
  let version: string | undefined
  try {
    if (entry !== undefined && entry !== '') {
      const manifest = createRequire(entry).resolve('@deepseek-ai/dsh-app-boot/package.json')
      const value = (JSON.parse(readFileSync(manifest, 'utf8')) as { version?: unknown }).version
      if (typeof value === 'string' && valid(value) !== null) version = value
    }
  } catch {
    // Unknown layout: no claim rather than a guess.
  }
  cachedRuntime = { entry, version }
  return version
}

/** Accepted exact grants of one profile; an unreadable file grants nothing, as in the host. */
export function readProfileExemptions(profileDir: string): Record<string, string[]> {
  try {
    const value = JSON.parse(readFileSync(join(profileDir, PROFILE_COMPATIBILITY_FILENAME), 'utf8')) as unknown
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return {}
    const out: Record<string, string[]> = {}
    for (const [key, versions] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(versions) && versions.every(version => typeof version === 'string')) out[key] = versions as string[]
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Judge one skin package the way the host does.
 * @param manifest - the skin's parsed package.json.
 * @param runtimeVersion - the running DSH version.
 * @param exemptions - the profile's exact grants.
 * @returns the unsatisfied dsh peers, or undefined when the host admits the package unconditionally.
 */
export function evaluateSkinCompatibility(
  manifest: unknown,
  runtimeVersion: string,
  exemptions: Readonly<Record<string, readonly string[]>>,
): SkinCompatibility | undefined {
  if (manifest === null || typeof manifest !== 'object') return undefined
  const { name, version, peerDependencies } = manifest as { name?: unknown, version?: unknown, peerDependencies?: unknown }
  if (peerDependencies === null || typeof peerDependencies !== 'object' || Array.isArray(peerDependencies)) return undefined
  const peers: Record<string, string> = {}
  for (const [peer, range] of Object.entries(peerDependencies as Record<string, unknown>)) {
    if (peer !== '@deepseek-ai/dsh' && !peer.startsWith('@deepseek-ai/dsh-')) continue
    if (typeof range !== 'string') {
      peers[peer] = String(range)
      continue
    }
    const requirement = ['workspace:^', 'workspace:~', 'workspace:*'].includes(range) ? runtimeVersion : range
    if (requirement.trim() === '' || !satisfies(runtimeVersion, requirement, { includePrerelease: true })) peers[peer] = range
  }
  if (Object.keys(peers).length === 0 || typeof name !== 'string' || typeof version !== 'string') return undefined
  const key = `${name}@${version}`
  return {
    package: key,
    runtimeVersion,
    peers,
    exempted: exemptions[key]?.includes(runtimeVersion) === true,
  }
}
