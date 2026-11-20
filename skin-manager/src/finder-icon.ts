import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix } from 'node:path'
import { promisify } from 'node:util'
import type { DesktopIconResult } from './desktop-icon.ts'

const exec = promisify(execFile)

/**
 * Only target the running DSH Electron application's bundle. The bundle path is
 * a macOS path whatever host evaluates it, so it is parsed with POSIX rules.
 */
export function detectFinderApp(platform = process.platform, env = process.env, execPath = process.execPath): string | null {
  if (platform !== 'darwin' || env.ELECTRON_RUN_AS_NODE !== '1' || posix.basename(execPath) !== 'DeepSeek Harness') return null
  const macos = posix.dirname(execPath)
  const contents = posix.dirname(macos)
  const app = posix.dirname(contents)
  return posix.basename(macos) === 'MacOS' && posix.basename(contents) === 'Contents' && app.endsWith('.app') ? app : null
}

const SET_ICON = `ObjC.import('AppKit')
function run([bundle, file]) {
  const image = file ? $.NSImage.alloc.initWithContentsOfFile(file) : $()
  if (file && image.isNil()) throw new Error('Invalid icon image')
  if (!$.NSWorkspace.sharedWorkspace.setIconForFileOptions(image, bundle, 0)) {
    throw new Error('Could not update Finder icon')
  }
}`

async function setIcon(bundle: string, file: string | null): Promise<void> {
  await exec('/usr/bin/osascript', ['-l', 'JavaScript', '-e', SET_ICON, '--', bundle, file ?? ''], { timeout: 30_000 })
}

const digest = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex')

function fingerprint(bundle: string): string | null {
  const icon = join(bundle, 'Icon\r')
  try {
    if (!lstatSync(icon).isFile()) return 'unknown'
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
  const resource = readFileSync(join(icon, '..namedfork', 'rsrc'))
  return resource.length > 0 ? digest(resource) : 'unknown'
}

interface FinderIconState {
  enabled: boolean
  owned: string[]
}

const queues = new Map<string, Promise<void>>()

/** Persist the preference and restore only Finder metadata we wrote ourselves. */
export class FinderIconSync {
  private readonly statePath: string

  constructor(home: string, private readonly app: string) {
    this.statePath = join(home, 'skin-manager', `finder-icon-${digest(app).slice(0, 16)}.json`)
  }

  get enabled(): boolean { return this.read().enabled }

  setEnabled(enabled: boolean, source: string | null): Promise<DesktopIconResult> {
    return this.serial(async () => {
      const state = { ...this.read(), enabled }
      this.write(state)
      return this.pass(state, source)
    })
  }

  reconcile(source: string | null): Promise<DesktopIconResult> {
    return this.serial(() => this.pass(this.read(), source))
  }

  drain(): Promise<void> { return queues.get(this.app) ?? Promise.resolve() }

  private serial(task: () => Promise<DesktopIconResult>): Promise<DesktopIconResult> {
    const run = this.drain().then(task)
    const settled = run.then(() => {}, () => {})
    queues.set(this.app, settled)
    void settled.then(() => {
      if (queues.get(this.app) === settled) queues.delete(this.app)
    })
    return run
  }

  private async pass(state: FinderIconState, source: string | null): Promise<DesktopIconResult> {
    const file = state.enabled ? source : null
    const unchanged = { enabled: state.enabled, updated: 0, failed: 0 }
    const failed = (reason: string) => ({ ...unchanged, failed: 1, errors: [reason] })
    if (file === null && state.owned.length === 0) return unchanged
    try {
      const current = fingerprint(this.app)
      if (current !== null && !state.owned.includes(current)) {
        if (state.owned.length > 0) this.write({ ...state, owned: [] })
        return file === null ? unchanged : failed('finder-custom-icon')
      }
      if (file === null) {
        if (current !== null) await setIcon(this.app, null)
        if (fingerprint(this.app) !== null) return failed('finder-write-failed')
        this.write({ ...state, owned: [] })
        return { ...unchanged, updated: Number(current !== null) }
      }

      // AppKit generates the same resource fork for the same image on a folder
      // and on an app bundle. Record it before writing so a restart can recover
      // whether the previous or the new icon reached the bundle.
      const staging = mkdtempSync(join(tmpdir(), 'dsh-finder-icon-'))
      try {
        const stagedIcon = join(staging, 'skin.ico')
        copyFileSync(file, stagedIcon)
        await setIcon(staging, stagedIcon)
        const desired = fingerprint(staging)
        if (desired === null || desired === 'unknown') return failed('finder-write-failed')
        if (fingerprint(this.app) !== current) return failed('finder-custom-icon')
        this.write({ ...state, owned: current === null || current === desired ? [desired] : [current, desired] })
        if (current === desired) return unchanged
        await setIcon(this.app, stagedIcon)
        if (fingerprint(this.app) !== desired) return failed('finder-write-failed')
        this.write({ ...state, owned: [desired] })
        return { ...unchanged, updated: 1 }
      } finally {
        rmSync(staging, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('[skin-manager] Finder icon sync failed', error)
      return failed('finder-write-failed')
    }
  }

  private read(): FinderIconState {
    try {
      const state = JSON.parse(readFileSync(this.statePath, 'utf8')) as Partial<FinderIconState>
      return {
        enabled: state.enabled === true,
        owned: Array.isArray(state.owned) ? state.owned.filter(hash => typeof hash === 'string' && /^[0-9a-f]{64}$/.test(hash)) : [],
      }
    } catch {
      return { enabled: false, owned: [] }
    }
  }

  private write(state: FinderIconState): void {
    mkdirSync(dirname(this.statePath), { recursive: true })
    const temporary = `${this.statePath}.${process.pid}.tmp`
    writeFileSync(temporary, JSON.stringify(state))
    renameSync(temporary, this.statePath)
  }
}
