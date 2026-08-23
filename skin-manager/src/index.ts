/** Generic DSH skin-manager host half. */
import type { Context } from '@deepseek-ai/cordis'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { basename, dirname, join as joinPath, relative as relativePath, resolve as resolvePath } from 'node:path'
import { promisify } from 'node:util'
import { SKIN_MANAGER_ROUTE, type SkinCatalogEntry, type SkinTarget, type SkinUpdateState, type SkinVersionCommit, type SkinVersionInfo, type SkinVersionSource } from './contract.ts'

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
  dshCompatibility?: unknown
  order?: unknown
  wiring?: { id?: unknown }
}

interface PackageManifest {
  dependencies?: Record<string, unknown>
  dsh?: {
    profile?: { bundles?: unknown[] }
    skinCollection?: { packages?: unknown }
  }
}

interface InstalledPackage {
  name: string
  manifestPath: string
}

const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i

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
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
    const names = new Set(Object.keys(manifest.dependencies ?? {}))
    for (const value of manifest.dsh?.profile?.bundles ?? []) {
      if (typeof value === 'string') names.add(value)
    }
    return [...names]
  } catch {
    return []
  }
}

function packageManifestPath(ownerManifest: string, packageName: string): string | null {
  const require = createRequire(ownerManifest)
  try {
    return require.resolve(`${packageName}/package.json`)
  } catch {
    const candidate = joinPath(dirname(ownerManifest), 'node_modules', ...packageName.split('/'), 'package.json')
    return existsSync(candidate) ? candidate : null
  }
}

/** Resolve direct profile packages plus skin dependencies explicitly owned by a collection. */
function installedPackages(profileManifest: string): InstalledPackage[] {
  const queue = packageNames(profileManifest).map(name => ({ name, ownerManifest: profileManifest }))
  const found: InstalledPackage[] = []
  const visited = new Set<string>()
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!
    if (visited.has(current.name)) continue
    const manifestPath = packageManifestPath(current.ownerManifest, current.name)
    if (manifestPath === null) continue
    visited.add(current.name)
    found.push({ name: current.name, manifestPath })
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
      const dependencies = new Set(Object.keys(manifest.dependencies ?? {}))
      const packages = manifest.dsh?.skinCollection?.packages
      if (!Array.isArray(packages)) continue
      for (const name of packages) {
        if (typeof name !== 'string' || !PACKAGE_NAME.test(name) || !dependencies.has(name)) continue
        queue.push({ name, ownerManifest: manifestPath })
      }
    } catch {
      // One malformed collection must not hide direct packages or other collections.
    }
  }
  return found
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
    ...(typeof manifest.dshCompatibility === 'string' && /^\d+\.\d+\.\d+rc\d+$/.test(manifest.dshCompatibility)
      ? { dshCompatibility: manifest.dshCompatibility }
      : {}),
    order: typeof manifest.order === 'number' && Number.isFinite(manifest.order) ? manifest.order : 100,
  }
}

/** Discover every installed package that exposes a valid skin.json manifest. */
export function discoverInstalledSkins(profilePatch = resolveProfilePatch()): SkinCatalogEntry[] {
  const profileManifest = joinPath(dirname(profilePatch), 'package.json')
  const found: SkinCatalogEntry[] = []
  const ids = new Set<string>()
  const wiringIds = new Set<string>()
  for (const installedPackage of installedPackages(profileManifest)) {
    const path = joinPath(dirname(installedPackage.manifestPath), 'skin.json')
    if (!existsSync(path)) continue
    try {
      const entry = catalogEntry(JSON.parse(readFileSync(path, 'utf8')) as SkinManifest, installedPackage.name)
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

/** Same validation walk as {@link discoverInstalledSkins}, mapped to package directories. */
export function discoverSkinDirectories(profilePatch = resolveProfilePatch()): Map<string, string> {
  const profileManifest = joinPath(dirname(profilePatch), 'package.json')
  const dirs = new Map<string, string>()
  const wiringIds = new Set<string>()
  for (const installedPackage of installedPackages(profileManifest)) {
    const path = joinPath(dirname(installedPackage.manifestPath), 'skin.json')
    if (!existsSync(path)) continue
    try {
      const entry = catalogEntry(JSON.parse(readFileSync(path, 'utf8')) as SkinManifest, installedPackage.name)
      if (entry === null || dirs.has(entry.id) || wiringIds.has(entry.wiringId)) continue
      wiringIds.add(entry.wiringId)
      dirs.set(entry.id, dirname(path))
    } catch {
      // One malformed third-party manifest must not hide other installed skins.
    }
  }
  return dirs
}

/* ------------------------------------------------------------------ */
/* Version rows: local commit identity plus a read-only GitHub          */
/* comparison. The manager never fetches, pulls, or checks out: the    */
/* git commands are read-only probes (rev-parse/log/status) and the    */
/* remote side is GitHub GET requests only.                             */
/* ------------------------------------------------------------------ */

const execFileAsync = promisify(execFile)
const GIT_OP_TIMEOUT_MS = 5_000
const GITHUB_OP_TIMEOUT_MS = 8_000
const BRANCH_CACHE_TTL_MS = 24 * 60 * 60 * 1_000
const VERSION_CACHE_TTL_MS = 30_000

/** Parse `owner/repo` out of a GitHub remote URL (https, ssh, git@, git://). */
export function parseGitHubRemote(remoteUrl: string): { owner: string, repo: string } | null {
  const match = /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?\/?$/.exec(remoteUrl.trim())
  if (match === null) return null
  const owner = match[1]!
  const repo = match[2]!
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null
  return { owner, repo }
}

/** The skin directory as a slash-separated path relative to its git repository root. */
export function repositoryRelativePath(dir: string, repoRoot: string): string {
  const resolvedDir = resolvePath(dir)
  const resolvedRoot = resolvePath(repoRoot)
  if (resolvedDir === resolvedRoot) return ''
  return relativePath(resolvedRoot, resolvedDir).replaceAll('\\', '/').replace(/^\.\//, '')
}

async function runGit(cwd: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      timeout: GIT_OP_TIMEOUT_MS,
      windowsHide: true,
      encoding: 'utf8',
    })
    return stdout.trim()
  } catch {
    return null
  }
}

interface SkinBuildMetaRaw {
  schema?: unknown
  fingerprint?: unknown
  sourceCommit?: unknown
  repository?: unknown
  path?: unknown
}

/**
 * Deterministic build metadata written next to the shipped bundle. Its SHA-256
 * fingerprint covers runtime/distribution inputs but never this file itself,
 * avoiding the self-reference of embedding the containing git commit.
 */
export interface SkinBuildMeta {
  fingerprint: string
  /** Git HEAD before this build was produced; an ancestry anchor, not the containing commit. */
  sourceCommit: string | null
  repository: string
  path: string
}

function parseSkinBuildMeta(raw: unknown): SkinBuildMeta | null {
  if (typeof raw !== 'object' || raw === null) return null
  const meta = raw as SkinBuildMetaRaw
  const fingerprint = typeof meta.fingerprint === 'string' && /^[0-9a-f]{64}$/.test(meta.fingerprint) ? meta.fingerprint : null
  const sourceCommit = typeof meta.sourceCommit === 'string' && /^[0-9a-f]{40}$/.test(meta.sourceCommit)
    ? meta.sourceCommit
    : null
  const repository = typeof meta.repository === 'string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(meta.repository)
    ? meta.repository
    : null
  const path = typeof meta.path === 'string'
    && /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/.test(meta.path)
      ? meta.path.replaceAll('\\', '/').replace(/^\.\//, '')
    : null
  if (meta.schema !== 1 || fingerprint === null || repository === null || path === null || path === '') return null
  return { fingerprint, sourceCommit, repository, path }
}

export function readSkinBuildMeta(dir: string): SkinBuildMeta | null {
  const file = joinPath(dir, 'skin.build.json')
  if (!existsSync(file)) return null
  try {
    return parseSkinBuildMeta(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    return null
  }
}

const SKIN_FINGERPRINT_INPUTS = ['lib/client.js', 'lib/index.js', 'cordis.patch.yml', 'skin.json'] as const

/** Recalculate the same cross-platform fingerprint emitted after a skin build. */
export function computeSkinFingerprint(dir: string): string | null {
  try {
    const hash = createHash('sha256')
    for (const input of SKIN_FINGERPRINT_INPUTS) {
      const normalized = readFileSync(joinPath(dir, input), 'utf8').replaceAll('\r\n', '\n')
      hash.update(`${input}\0${Buffer.byteLength(normalized)}\0`)
      hash.update(normalized)
    }
    return hash.digest('hex')
  } catch {
    return null
  }
}

interface InstalledIdentity {
  source: SkinVersionSource
  local: SkinVersionCommit | null
  /** GitHub repo when known: git origin URL for git installs, metadata otherwise. */
  repository: string | null
  /** Skin directory relative to the repository root ('' = repository root). */
  relPath: string | null
  /** Local side of the comparison: the directory head at the installed version. */
  baseRef: string | null
  baseDate: string | null
  fingerprint: string | null
  buildDirty: boolean
  /** Uncommitted changes exist inside this skin directory. */
  dirty: boolean
}

/**
 * Local-only identity of the installed skin: git HEAD when the installed
 * directory lives in a git repository (development / link / clone installs),
 * build-time metadata otherwise (marketplace / archive installs). The remote
 * half never touches this function.
 */
export async function inspectInstalledVersion(
  dir: string,
  git: (cwd: string, args: string[]) => Promise<string | null> = runGit,
): Promise<InstalledIdentity> {
  const meta = readSkinBuildMeta(dir)
  const actualFingerprint = meta === null ? null : computeSkinFingerprint(dir)
  const buildDirty = meta !== null && actualFingerprint !== meta.fingerprint
  const hash = await git(dir, ['rev-parse', 'HEAD'])
  if (hash !== null) {
    const repoRoot = await git(dir, ['rev-parse', '--show-toplevel'])
    const relPath = repoRoot === null ? '' : repositoryRelativePath(dir, repoRoot)
    // Path-scoped queries must run from the repository root: git resolves
    // `-- <path>` against the current working directory, and this skin
    // directory is not necessarily the repository root.
    const base = repoRoot ?? dir
    const [short, date, baseRef, baseDate] = await Promise.all([
      git(dir, ['rev-parse', '--short', 'HEAD']),
      git(dir, ['log', '-1', '--format=%cI']),
      git(base, ['log', '-1', '--format=%H', ...(relPath === '' ? [] : ['--', relPath])]),
      git(base, ['log', '-1', '--format=%cI', ...(relPath === '' ? [] : ['--', relPath])]),
    ])
    const dirtyOut = await git(base, ['status', '--porcelain', ...(relPath === '' ? [] : ['--', relPath])])
    return {
      source: 'git',
      local: { hash, short: short ?? hash.slice(0, 7), date },
      repository: meta?.repository ?? null,
      relPath: meta?.path ?? relPath,
      baseRef: baseRef ?? hash,
      baseDate: relPath !== '' && baseDate !== null ? baseDate : date,
      fingerprint: actualFingerprint,
      buildDirty,
      dirty: buildDirty || (dirtyOut !== null && dirtyOut.trim() !== ''),
    }
  }
  if (meta !== null) {
    return {
      source: 'build',
      local: { hash: meta.fingerprint, short: meta.fingerprint.slice(0, 12), date: null },
      repository: meta.repository,
      relPath: meta.path,
      baseRef: meta.sourceCommit,
      baseDate: null,
      fingerprint: actualFingerprint,
      buildDirty,
      dirty: buildDirty,
    }
  }
  return {
    source: 'none', local: null, repository: null, relPath: null,
    baseRef: null, baseDate: null, fingerprint: null, buildDirty: false, dirty: false,
  }
}

class GitHubHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function githubJson(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`https://api.github.com${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GITHUB_OP_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-skin-manager' },
    })
    if (response.status === 404) throw new GitHubHttpError(404, 'not-found')
    if (response.status === 422) throw new GitHubHttpError(422, 'unprocessable')
    if (!response.ok) throw new GitHubHttpError(response.status, `http-${response.status}`)
    return await response.json()
  } catch (error) {
    if (error instanceof GitHubHttpError) throw error
    throw new GitHubHttpError(0, 'network-error')
  } finally {
    clearTimeout(timer)
  }
}

function commitIdentity(raw: unknown): SkinVersionCommit | null {
  if (typeof raw !== 'object' || raw === null) return null
  const payload = raw as { sha?: unknown, commit?: { author?: { date?: unknown }, message?: unknown } }
  if (typeof payload.sha !== 'string' || payload.sha === '') return null
  const date = typeof payload.commit?.author?.date === 'string' ? payload.commit.author.date : null
  const message = typeof payload.commit?.message === 'string' ? payload.commit.message.split('\n')[0]!.trim() : ''
  return { hash: payload.sha, short: payload.sha.slice(0, 7), date, ...(message === '' ? {} : { message }) }
}

/** Latest commit touching `relPath` ('' = whole repository) under `ref`. */
async function directoryCommit(ownerRepo: string, ref: string, relPath: string): Promise<SkinVersionCommit | null> {
  const params: Record<string, string> = { sha: ref, per_page: '1' }
  if (relPath !== '') params.path = relPath
  const body = await githubJson(`/repos/${ownerRepo}/commits`, params)
  if (!Array.isArray(body) || body.length === 0) return null
  return commitIdentity(body[0])
}

/** Read the deterministic build manifest at one repository ref. */
async function repositoryBuildMeta(ownerRepo: string, ref: string, relPath: string): Promise<SkinBuildMeta | null> {
  const manifestPath = relPath === '' ? 'skin.build.json' : `${relPath}/skin.build.json`
  const body = await githubJson(`/repos/${ownerRepo}/contents/${manifestPath}`, { ref })
  if (typeof body !== 'object' || body === null) return null
  const payload = body as { encoding?: unknown, content?: unknown }
  if (payload.encoding !== 'base64' || typeof payload.content !== 'string') return null
  try {
    const decoded = Buffer.from(payload.content.replaceAll('\n', ''), 'base64').toString('utf8')
    return parseSkinBuildMeta(JSON.parse(decoded))
  } catch {
    return null
  }
}

/** GitHub compare status (`identical|ahead|behind|diverged`) between two refs. */
async function compareCommits(ownerRepo: string, base: string, head: string): Promise<string | null> {
  const body = await githubJson(`/repos/${ownerRepo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`, {})
  const status = typeof (body as { status?: unknown } | null)?.status === 'string'
    ? (body as { status: string }).status
    : null
  return status
}

/**
 * A hash difference alone proves nothing: remote-side commits may be anything
 * between a true update and a local lead. The state comes from the compare
 * status (ancestry) combined with whether the directory moves at all.
 * @param status - compare status between the installed side and the remote branch.
 * @param dirSame - true when the skin directory head is identical on both sides.
 */
export function classifyUpdate(status: string | null, dirSame: boolean): SkinUpdateState {
  if (dirSame) return 'up-to-date'
  switch (status) {
    // GitHub describes HEAD relative to BASE. We compare
    // installed(BASE)...remote(HEAD), so "ahead" means a remote update.
    case 'ahead': return 'update-available'
    case 'behind': return 'local-ahead'
    case 'diverged': return 'diverged'
    // Equal ancestry anchors with differing fingerprints can arise from local
    // or otherwise unpublished builds; equality cannot establish direction.
    case 'identical': return 'unknown'
    default: return 'unknown'
  }
}

/** Dependencies injectable for tests; defaults are the real git/GitHub calls. */
export interface SkinVersionDeps {
  git(cwd: string, args: string[]): Promise<string | null>
  githubJson(path: string, params: Record<string, string>): Promise<unknown>
  directoryCommit(ownerRepo: string, ref: string, relPath: string): Promise<SkinVersionCommit | null>
  buildMeta(ownerRepo: string, ref: string, relPath: string): Promise<SkinBuildMeta | null>
  compareCommit(ownerRepo: string, base: string, head: string): Promise<string | null>
  defaultBranch(ownerRepo: string): Promise<string>
}

const defaultDeps: SkinVersionDeps = {
  git: runGit,
  githubJson,
  directoryCommit,
  buildMeta: repositoryBuildMeta,
  compareCommit: compareCommits,
  defaultBranch: async (ownerRepo) => {
    const repository = await githubJson(`/repos/${ownerRepo}`, {}) as { default_branch?: unknown }
    return typeof repository.default_branch === 'string' && repository.default_branch !== ''
      ? repository.default_branch
      : 'main'
  },
}

/**
 * Read-only version row for one installed skin package: installed identity
 * (git head or deterministic build fingerprint) plus the canonical build
 * manifest on GitHub. Only shipped runtime inputs change the fingerprint;
 * docs/tests/source-only commits therefore never become user-facing updates.
 */
export async function inspectSkinVersion(
  id: string,
  dir: string,
  deps: SkinVersionDeps = defaultDeps,
): Promise<SkinVersionInfo> {
  const installed = await inspectInstalledVersion(dir, deps.git)
  if (installed.source === 'none' || installed.local === null) {
    return {
      id,
      source: 'none',
      local: null,
      remote: null,
      dirty: false,
      note: '安装目录既不是 Git 仓库，也没有构建指纹（skin.build.json）',
    }
  }
  let repository = installed.repository
  if (repository === null) {
    const repoRoot = await deps.git(dir, ['rev-parse', '--show-toplevel'])
    const remoteUrl = repoRoot === null ? null : await deps.git(repoRoot, ['remote', 'get-url', 'origin'])
    const parsed = remoteUrl === null ? null : parseGitHubRemote(remoteUrl)
    repository = parsed === null ? null : `${parsed.owner}/${parsed.repo}`
  }
  if (repository === null) {
    return {
      id,
      source: installed.source,
      local: installed.local,
      remote: null,
      dirty: installed.dirty,
      note: installed.source === 'git' ? '未声明官方 GitHub 更新源，无法对比更新' : '构建指纹缺少 GitHub 仓库信息',
    }
  }
  const repo = repository
  const relPath = installed.relPath ?? ''
  const localView: SkinVersionCommit = installed.source === 'build'
    ? installed.local
    : {
        hash: installed.baseRef!,
        short: installed.baseRef!.slice(0, 7),
        date: installed.baseDate,
      }
  let branch = 'main'
  try {
    branch = await deps.defaultBranch(repo)
  } catch {
    // Keep 'main'; the compare call below reports the real failure.
  }
  const remoteMeta = await (async (): Promise<SkinBuildMeta | null> => {
    try {
      return await deps.buildMeta(repo, branch, relPath)
    } catch {
      return null
    }
  })()
  const latestCommit = await (async (): Promise<SkinVersionCommit | null> => {
    try {
      const trackedPath = installed.fingerprint === null
        ? relPath
        : (relPath === '' ? 'skin.build.json' : `${relPath}/skin.build.json`)
      return await deps.directoryCommit(repo, branch, trackedPath)
    } catch {
      return null
    }
  })()
  const latest = latestCommit ?? (remoteMeta === null ? null : {
    hash: remoteMeta.fingerprint,
    short: remoteMeta.fingerprint.slice(0, 12),
    date: null,
  })
  let state: SkinUpdateState = 'unknown'
  let note: string | undefined
  const buildSame = installed.fingerprint !== null && remoteMeta !== null
    ? installed.fingerprint === remoteMeta.fingerprint
    : (installed.baseRef !== null && latest !== null && installed.baseRef === latest.hash)
  if (installed.buildDirty) {
    note = '已安装运行文件与构建指纹不一致（本地有修改），不判定为远端更新'
  } else if (remoteMeta === null && installed.fingerprint !== null) {
    note = '远端缺少有效构建指纹，无法判断更新'
  } else if (buildSame) {
    state = 'up-to-date'
  } else if (installed.baseRef === null) {
    note = '构建指纹不同，但已安装包缺少可比较的源码提交，无法判断先后'
  } else {
    try {
      const remoteRef = remoteMeta?.sourceCommit ?? branch
      const status = await deps.compareCommit(repo, installed.baseRef, remoteRef)
      state = classifyUpdate(status, false)
      if (state === 'unknown' && status !== 'identical') {
        note = '远端提交无法证明是已安装版本的后继（远端状态 unknown），不判定为更新'
      } else if (state === 'unknown') {
        note = '构建指纹不同，但源码提交相同，无法判断先后'
      }
    } catch (error) {
      const status = typeof error === 'object' && error !== null ? (error as { status?: unknown }).status : undefined
      if (status === 404 || status === 422) {
        state = buildSame ? 'up-to-date' : 'unknown'
        if (!buildSame) note = '已安装提交不在远端历史中（本地有未推送或分叉提交），无法判断更新'
      } else {
        note = '远端查询失败（网络不可用或请求受限），稍后再试'
      }
    }
  }
  return {
    id,
    source: installed.source,
    local: installed.local,
    remote: { repo, branch, latest, localView, state },
    dirty: installed.dirty,
    ...(note !== undefined ? { note } : {}),
  }
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
  const lines = stripped.split(/\r?\n/)
  const yamlLines = lines.filter(line => line.trim() !== '' && !line.trimStart().startsWith('#'))
  const unmanaged = yamlLines.length === 1 && yamlLines[0]!.trim() === '[]'
    ? lines.filter(line => line.trim() !== '[]').join('\n').replace(/\s+$/, '')
    : stripped
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

/** Read the last explicit disabled value for each installed skin in one patch layer. */
export function readSkinStates(source: string, catalog: SkinCatalogEntry[]): Map<string, boolean> {
  const known = new Set(catalog.map(skin => skin.wiringId))
  const states = new Map<string, boolean>()
  let currentId: string | undefined
  let currentIndent = -1
  let propertyIndent: number | undefined
  for (const line of source.split(/\r?\n/)) {
    const entry = line.match(/^(\s*)-\s+id:\s*(['"]?)([^'"#\s]+)\2\s*(?:#.*)?$/)
    if (entry !== null) {
      /* Only top-level `- id:` rows are loader patch records: a nested `- id:`
         inside another plugin's config is that plugin's data, not a skin state. */
      if (entry[1]!.length !== 0) continue
      currentId = known.has(entry[3]!) ? entry[3] : undefined
      currentIndent = entry[1]!.length
      propertyIndent = undefined
      continue
    }
    if (currentId === undefined) continue
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const indent = line.length - line.trimStart().length
    if (indent <= currentIndent) {
      currentId = undefined
      continue
    }
    propertyIndent = propertyIndent === undefined ? indent : Math.min(propertyIndent, indent)
    const disabled = line.match(/^\s*disabled:\s*(true|false)\s*(?:#.*)?$/)
    if (disabled !== null && indent === propertyIndent) states.set(currentId, disabled[1] === 'true')
  }
  return states
}

/** Return installed skins that are effectively enabled after profile then home overrides. */
export function enabledSkins(sources: string[], catalog: SkinCatalogEntry[]): SkinCatalogEntry[] {
  const states = new Map<string, boolean>()
  for (const source of sources) {
    for (const [id, disabled] of readSkinStates(source, catalog)) states.set(id, disabled)
  }
  return catalog.filter(skin => states.get(skin.wiringId) !== true)
}

/** Fail safe when a direct marketplace install would otherwise activate multiple skins. */
export function ensureSafeInitialState(
  patchPaths = resolvePatchTargets(),
  catalog = discoverInstalledSkins(patchPaths[0]),
): boolean {
  if (catalog.length < 2) return false
  const sources = patchPaths.map(path => existsSync(path) ? readFileSync(path, 'utf8') : '')
  if (enabledSkins(sources, catalog).length < 2) return false
  useSkin('official', patchPaths, catalog)
  return true
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
  dirProvider: () => Map<string, string> = () => new Map(),
): WebRoute {
  const versionCache = new Map<string, { at: number, value: SkinVersionInfo }>()
  const branchCache = new Map<string, { at: number, value: string }>()
  const deps: SkinVersionDeps = {
    ...defaultDeps,
    defaultBranch: async (ownerRepo) => {
      const hit = branchCache.get(ownerRepo)
      if (hit !== undefined && Date.now() - hit.at < BRANCH_CACHE_TTL_MS) return hit.value
      const value = await defaultDeps.defaultBranch(ownerRepo)
      branchCache.set(ownerRepo, { at: Date.now(), value })
      return value
    },
  }
  const cachedCheck = async (id: string, dir: string): Promise<SkinVersionInfo> => {
    const now = Date.now()
    const hit = versionCache.get(id)
    if (hit !== undefined && now - hit.at < VERSION_CACHE_TTL_MS) return hit.value
    const value = await inspectSkinVersion(id, dir, deps)
    versionCache.set(id, { at: now, value })
    return value
  }
  const rows = (dirs: Map<string, string>, check: (id: string, dir: string) => Promise<SkinVersionInfo>): Promise<SkinVersionInfo[]> =>
    Promise.all([...dirs].map(async ([id, dir]) => {
      try {
        return await check(id, dir)
      } catch (error) {
        return {
          id,
          source: 'none',
          local: null,
          remote: null,
          dirty: false,
          note: error instanceof Error ? error.message : String(error),
        } satisfies SkinVersionInfo
      }
    }))
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
        // The catalog must never wait for optional diagnostics: git probes and
        // GitHub calls have their own endpoints and load after render.
        if (req.method === 'GET') {
          json(res, 200, { ok: true, skins: catalog })
          return
        }
        if (req.method !== 'POST') {
          json(res, 405, { ok: false, error: 'method-not-allowed' })
          return
        }
        const body = await readBody(req)
        const action = typeof body === 'object' && body !== null
          ? (body as { action?: unknown }).action
          : undefined
        if (action === 'local-versions') {
          const versions = await rows(dirProvider(), (id, dir) => inspectInstalledVersion(dir).then(installed => ({
            id,
            source: installed.source,
            local: installed.local,
            remote: null,
            dirty: installed.dirty,
            ...(installed.source === 'none' ? { note: '安装目录既不是 Git 仓库，也没有构建指纹（skin.build.json）' } : {}),
          }) as SkinVersionInfo))
          json(res, 200, { ok: true, versions })
          return
        }
        if (action === 'versions') {
          const versions = await rows(dirProvider(), cachedCheck)
          json(res, 200, { ok: true, versions })
          return
        }
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
  ctx.effect(() => {
    try {
      ensureSafeInitialState()
    } catch (error) {
      console.error('[skin-manager] failed to enforce startup mutual exclusion', error)
    }
    return ctx.webServer.register(makeSkinManagerRoute(undefined, undefined, () => discoverSkinDirectories()))
  }, 'ui-skin-manager: startup guard and catalog/activation route')
}
