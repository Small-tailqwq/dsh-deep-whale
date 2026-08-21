/** Generic DSH skin-manager host half. */
import type { Context } from '@deepseek-ai/cordis'
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { basename, dirname, join as joinPath, resolve as resolvePath } from 'node:path'
import { SKIN_MANAGER_ROUTE, type SkinCatalogEntry, type SkinTarget } from './contract.ts'

export { SKIN_MANAGER_ROUTE, type SkinCatalogEntry, type SkinTarget } from './contract.ts'
export * from './protocol.ts'

export const name = 'ui-skin-deep-whale-manager'
export const inject = ['webServer']

export const MANAGED_START = '# --- dsh-skin managed (auto-generated; do not edit) ---'
export const MANAGED_END = '# --- end dsh-skin managed ---'

interface WebRoute {
  kind: 'exact'
  path: string
  handler(req: IncomingMessage, res: ServerResponse): void | Promise<void>
}

type HostContext = Context & {
  webServer: { register(route: WebRoute): () => void }
}

interface SkinManifest {
  id?: unknown
  name?: unknown
  nameEn?: unknown
  tagline?: unknown
  package?: unknown
  bodyAttr?: unknown
  order?: unknown
  wiring?: { id?: unknown }
}

/** Resolve the profile patch without inspecting credentials or unrelated files. */
export function resolveProfilePatch(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  const configuredHome = env.DSH_HOME?.trim()
  const harnessHome = configuredHome !== undefined && configuredHome !== ''
    ? resolvePath(configuredHome)
    : joinPath(homedir(), '.dsh')
  const explicitProfile = env.DSH_SKIN_PROFILE?.trim() || env.DSH_PROFILE?.trim()
  const profilesDir = joinPath(harnessHome, 'profiles')
  const inferredProfile = dirname(resolvePath(cwd)) === resolvePath(profilesDir)
    ? basename(resolvePath(cwd))
    : undefined
  const profile = explicitProfile || inferredProfile || 'web'
  if (!/^[a-zA-Z0-9._-]+$/.test(profile)) throw new Error('invalid-profile-name')
  return joinPath(profilesDir, profile, 'cordis.patch.yml')
}

/** Both live user layers must agree because the home layer has higher priority. */
export function resolvePatchTargets(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string[] {
  const profilePatch = resolveProfilePatch(env, cwd)
  return [profilePatch, joinPath(dirname(dirname(dirname(profilePatch))), 'cordis.patch.yml')]
}

function packageNames(manifestPath: string): string[] {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      dependencies?: Record<string, unknown>
      dsh?: { profile?: { bundles?: unknown[] } }
    }
    const names = new Set(Object.keys(manifest.dependencies ?? {}))
    for (const value of manifest.dsh?.profile?.bundles ?? []) {
      if (typeof value === 'string') names.add(value)
    }
    return [...names]
  } catch {
    return []
  }
}

function skinManifestPath(profileManifest: string, packageName: string): string | null {
  const require = createRequire(profileManifest)
  try {
    return require.resolve(`${packageName}/skin.json`)
  } catch {
    try {
      const packageJson = require.resolve(`${packageName}/package.json`)
      const candidate = joinPath(dirname(packageJson), 'skin.json')
      return existsSync(candidate) ? candidate : null
    } catch {
      const candidate = joinPath(dirname(profileManifest), 'node_modules', ...packageName.split('/'), 'skin.json')
      return existsSync(candidate) ? candidate : null
    }
  }
}

function catalogEntry(manifest: SkinManifest, installedPackage: string): SkinCatalogEntry | null {
  const id = manifest.id
  const name = manifest.name
  const packageName = manifest.package
  const wiringId = manifest.wiring?.id
  const bodyAttr = manifest.bodyAttr
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(id)) return null
  if (typeof name !== 'string' || name.trim() === '') return null
  if (packageName !== installedPackage) return null
  if (typeof wiringId !== 'string' || !/^[a-zA-Z0-9@/_.:-]+$/.test(wiringId)) return null
  if (typeof bodyAttr !== 'string' || !/^data-[a-z0-9_.:-]+$/.test(bodyAttr)) return null
  return {
    id,
    name,
    ...(typeof manifest.nameEn === 'string' ? { nameEn: manifest.nameEn } : {}),
    ...(typeof manifest.tagline === 'string' ? { tagline: manifest.tagline } : {}),
    package: packageName,
    wiringId,
    bodyAttr,
    order: typeof manifest.order === 'number' && Number.isFinite(manifest.order) ? manifest.order : 100,
  }
}

/** Discover every installed package that exposes a valid skin.json manifest. */
export function discoverInstalledSkins(profilePatch = resolveProfilePatch()): SkinCatalogEntry[] {
  const profileManifest = joinPath(dirname(profilePatch), 'package.json')
  const found: SkinCatalogEntry[] = []
  const ids = new Set<string>()
  const wiringIds = new Set<string>()
  for (const packageName of packageNames(profileManifest)) {
    const path = skinManifestPath(profileManifest, packageName)
    if (path === null) continue
    try {
      const entry = catalogEntry(JSON.parse(readFileSync(path, 'utf8')) as SkinManifest, packageName)
      if (entry === null || ids.has(entry.id) || wiringIds.has(entry.wiringId)) continue
      ids.add(entry.id)
      wiringIds.add(entry.wiringId)
      found.push(entry)
    } catch {
      // One malformed third-party manifest must not hide other installed skins.
    }
  }
  return found.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
}

/** Remove exactly one manager-owned block while preserving all user YAML. */
export function stripManagedBlock(source: string): string {
  const start = source.indexOf(MANAGED_START)
  if (start < 0) return source
  const end = source.indexOf(MANAGED_END, start)
  if (end < 0) throw new Error('managed-section-is-incomplete')
  const before = source.slice(0, start).replace(/[ \t]+$/gm, '').replace(/\s+$/, '')
  const after = source.slice(end + MANAGED_END.length).replace(/^\s+/, '')
  return [before, after].filter(Boolean).join('\n\n')
}

/** Render mutual exclusion for all discovered skins; official disables all. */
export function renderManagedBlock(target: SkinTarget, catalog: SkinCatalogEntry[]): string {
  const lines = [MANAGED_START]
  for (const skin of catalog) {
    lines.push(`- id: ${skin.wiringId}`, `  disabled: ${skin.id === target ? 'false' : 'true'}`)
  }
  lines.push(MANAGED_END)
  return lines.join('\n')
}

/** Compose a new patch without touching content outside the managed block. */
export function switchPatch(source: string, target: SkinTarget, catalog: SkinCatalogEntry[]): string {
  const stripped = stripManagedBlock(source).replace(/\s+$/, '')
  const unmanaged = stripped.trim() === '[]' ? '' : stripped
  return `${unmanaged === '' ? '' : `${unmanaged}\n\n`}${renderManagedBlock(target, catalog)}\n`
}

/** Atomically replace a single profile patch, leaving the original intact on failure. */
function atomicWrite(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = joinPath(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  let fd: number | undefined
  try {
    fd = openSync(temporary, 'wx', 0o600)
    writeFileSync(fd, text, 'utf8')
    fsyncSync(fd)
    closeSync(fd)
    fd = undefined
    renameSync(temporary, path)
  } finally {
    if (fd !== undefined) closeSync(fd)
    if (existsSync(temporary)) rmSync(temporary, { force: true })
  }
}

/** Persist one discovered target in both live layers. */
export function useSkin(
  target: SkinTarget,
  patchPaths = resolvePatchTargets(),
  catalog = discoverInstalledSkins(patchPaths[0]),
): void {
  if (target !== 'official' && !catalog.some(skin => skin.id === target)) {
    throw new Error(`skin-not-installed: ${target}`)
  }
  const originals = patchPaths.map(path => ({
    path,
    existed: existsSync(path),
    source: existsSync(path) ? readFileSync(path, 'utf8') : '',
  }))
  const next = originals.map(original => switchPatch(original.source, target, catalog))
  const written: typeof originals = []
  try {
    originals.forEach((original, index) => {
      atomicWrite(original.path, next[index]!)
      written.push(original)
    })
  } catch (error) {
    for (const original of written.reverse()) {
      if (original.existed) atomicWrite(original.path, original.source)
      else rmSync(original.path, { force: true })
    }
    throw error
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function sameOrigin(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (typeof origin !== 'string' || origin === '' || origin === 'null') return true
  const host = req.headers.host
  if (typeof host !== 'string' || host === '') return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 16_384) {
        reject(new Error('body-too-large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid-json'))
      }
    })
    req.on('error', reject)
  })
}

/** Create the local catalog/activation route; POST targets are catalog-validated. */
export function makeSkinManagerRoute(
  catalogProvider: () => SkinCatalogEntry[] = () => discoverInstalledSkins(),
  applyTarget: (target: SkinTarget, catalog: SkinCatalogEntry[]) => void = (target, catalog) => useSkin(target, resolvePatchTargets(), catalog),
): WebRoute {
  return {
    kind: 'exact',
    path: SKIN_MANAGER_ROUTE,
    async handler(req, res): Promise<void> {
      if (!sameOrigin(req)) {
        json(res, 403, { ok: false, error: 'cross-site-request-rejected' })
        return
      }
      try {
        const catalog = catalogProvider()
        if (req.method === 'GET') {
          json(res, 200, { ok: true, skins: catalog })
          return
        }
        if (req.method !== 'POST') {
          json(res, 405, { ok: false, error: 'method-not-allowed' })
          return
        }
        const body = await readBody(req)
        const target = typeof body === 'object' && body !== null
          ? (body as { target?: unknown }).target
          : undefined
        if (target !== 'official' && !catalog.some(skin => skin.id === target)) {
          throw new Error('invalid-skin-target')
        }
        applyTarget(target as SkinTarget, catalog)
        json(res, 200, { ok: true, target })
      } catch (error) {
        json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    },
  }
}

/** Register the switching route with lifecycle-owned cleanup. */
export function apply(ctx: HostContext): void {
  ctx.effect(() => ctx.webServer.register(makeSkinManagerRoute()), 'ui-skin-manager: catalog and activation route')
}
