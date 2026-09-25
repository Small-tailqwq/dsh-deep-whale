/**
 * Opt-in desktop icon sync for the Windows DSH desktop shell.
 *
 * Plugins run inside the desktop host's Node child, which cannot reach the
 * Electron main process, so the window icon itself is out of reach. Windows
 * resolves the running taskbar button, the Start menu entry and the desktop
 * icon through the shortcuts that launch `DeepSeek Harness.exe`, so the sync
 * points those shortcuts' IconLocation at the active skin's ICO and puts back
 * exactly what it replaced when the user turns it off or returns to the
 * official look.
 *
 * Only shortcuts whose target is the running executable are touched, the
 * previous IconLocation of each one is recorded before the first write, and a
 * restore only reverts a shortcut that still shows an icon this module wrote.
 * The ICO is copied out of the skin package first, so uninstalling a skin never
 * leaves a shortcut pointing at a missing file.
 *
 * The taskbar thumbnail and Alt+Tab read the window's own icon instead, which
 * only a live process can hold: {@link WindowIconHolder} keeps one hidden
 * PowerShell helper that sets it and puts the previous icon back on stop.
 */
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join as joinPath, relative as relativePath, resolve as resolvePath } from 'node:path'

/** Largest ICO accepted from a skin manifest; real multi-size icons stay well below it. */
const MAX_ICON_BYTES = 2 * 1024 * 1024
const POWERSHELL_TIMEOUT_MS = 20_000

export interface DesktopShell {
  /** The desktop executable, which is also the Node binary of the host child. */
  execPath: string
}

/** The Windows desktop host runs plugins in `DeepSeek Harness.exe` with ELECTRON_RUN_AS_NODE. */
export function detectDesktopShell(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  execPath: string = process.execPath,
): DesktopShell | null {
  if (platform !== 'win32' || env.ELECTRON_RUN_AS_NODE !== '1') return null
  if (!/\.exe$/i.test(execPath) || /^node\.exe$/i.test(basename(execPath))) return null
  return { execPath }
}

/** One `.lnk` whose target is the desktop executable. */
export interface ShortcutInfo {
  path: string
  target: string
  /** Raw IconLocation, `path,index`; `,0` means the target's own icon. */
  icon: string
}

export interface ShortcutChange {
  path: string
  icon: string
}

export interface ShortcutWriteResult {
  path: string
  ok: boolean
  error?: string
}

/** Operating-system seam; tests replace it with an in-memory shortcut table. */
export interface ShortcutIo {
  scan(execPath: string): Promise<ShortcutInfo[]>
  /** Write every change, then ask the shell to refresh the affected icons. */
  write(changes: ShortcutChange[]): Promise<ShortcutWriteResult[]>
}

export interface ShortcutRecord {
  /** IconLocation found before this module first wrote the shortcut. */
  original: string
  /** IconLocation this module last wrote. */
  applied: string
}

export interface DesktopIconState {
  version: 1
  enabled: boolean
  shortcuts: Record<string, ShortcutRecord>
}

export interface DesktopIconResult {
  enabled: boolean
  /** Shortcuts rewritten by this pass. */
  updated: number
  /** Shortcuts the pass could not rewrite (for example an all-users shortcut without elevation). */
  failed: number
}

const emptyState = (): DesktopIconState => ({ version: 1, enabled: false, shortcuts: {} })

const pathKey = (path: string): string => resolvePath(path).replaceAll('/', '\\').toLowerCase()

/** IconLocation path without its `,index` suffix. */
function iconFile(icon: string): string {
  const match = icon.match(/^(.*),-?\d+$/)
  return (match === null ? icon : match[1]!).trim().replace(/^"|"$/g, '')
}

/** Whether an IconLocation points into the managed icon directory. */
export function isManagedIcon(icon: string, managedDir: string): boolean {
  const file = iconFile(icon)
  if (file === '' || !isAbsolute(file)) return false
  const rel = relativePath(pathKey(managedDir), pathKey(file))
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

/**
 * Decide which shortcuts to rewrite for one desired IconLocation (`null`
 * restores). Pure: the caller commits a record only after its write succeeded.
 */
export function planDesktopIcon(
  state: DesktopIconState,
  shortcuts: ShortcutInfo[],
  desired: string | null,
  managedDir: string,
): { changes: ShortcutChange[], records: Record<string, ShortcutRecord | null> } {
  const changes: ShortcutChange[] = []
  const records: Record<string, ShortcutRecord | null> = {}
  const byKey = new Map(Object.entries(state.shortcuts).map(([path, record]) => [pathKey(path), record]))
  const seen = new Set<string>()
  for (const shortcut of shortcuts) {
    const key = pathKey(shortcut.path)
    seen.add(key)
    const record = byKey.get(key)
    const ours = (record !== undefined && shortcut.icon === record.applied) || isManagedIcon(shortcut.icon, managedDir)
    // A lost record (state file removed) still restores to the executable's own icon.
    const original = ours ? record?.original ?? `${shortcut.target},0` : shortcut.icon
    if (desired === null) {
      if (ours) changes.push({ path: shortcut.path, icon: original })
      if (record !== undefined || ours) records[shortcut.path] = null
      continue
    }
    if (shortcut.icon !== desired) changes.push({ path: shortcut.path, icon: desired })
    records[shortcut.path] = { original, applied: desired }
  }
  // Shortcuts that disappeared (reinstall, user removal) have nothing to restore.
  for (const path of Object.keys(state.shortcuts)) {
    if (!seen.has(pathKey(path))) records[path] = null
  }
  return { changes, records }
}

/** Validate a skin manifest's `desktopIcon` and resolve it inside the package directory. */
export function resolveSkinDesktopIcon(skinDir: string, declared: unknown): string | null {
  if (typeof declared !== 'string' || !/\.ico$/i.test(declared) || isAbsolute(declared)) return null
  const file = resolvePath(skinDir, declared)
  const rel = relativePath(resolvePath(skinDir), file)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  try {
    const stat = statSync(file)
    return stat.isFile() && stat.size > 0 && stat.size <= MAX_ICON_BYTES ? file : null
  } catch {
    return null
  }
}

/** Keeps the shortcut state for one DSH home and serializes every pass. */
export class DesktopIconSync {
  readonly statePath: string
  readonly managedDir: string
  private readonly shell: DesktopShell
  private readonly io: ShortcutIo
  private readonly onIcon: (file: string | null) => void
  private queue: Promise<unknown> = Promise.resolve()

  /** @param onIcon - receives the managed ICO after every pass, or null when the official icon applies. */
  constructor(home: string, shell: DesktopShell, io: ShortcutIo = powershellShortcutIo, onIcon: (file: string | null) => void = () => {}) {
    this.shell = shell
    this.io = io
    this.onIcon = onIcon
    this.statePath = joinPath(home, 'skin-manager', 'desktop-icon.json')
    this.managedDir = joinPath(home, 'skin-manager', 'desktop-icons')
  }

  get enabled(): boolean {
    return this.read().enabled
  }

  /** Persist the switch, then apply (`source` set) or restore. */
  setEnabled(enabled: boolean, source: { skinId: string, file: string } | null): Promise<DesktopIconResult> {
    return this.serial(async () => {
      this.write({ ...this.read(), enabled })
      return this.pass(enabled ? source : null)
    })
  }

  /** Bring the shortcuts in line with the active skin; a no-op until the user opts in, except for leftovers. */
  reconcile(source: { skinId: string, file: string } | null): Promise<DesktopIconResult> {
    return this.serial(() => this.pass(this.read().enabled ? source : null))
  }

  private serial<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.catch(() => undefined)
    return run
  }

  private async pass(source: { skinId: string, file: string } | null): Promise<DesktopIconResult> {
    const state = this.read()
    const file = source === null ? null : this.install(source)
    this.onIcon(file)
    // Nothing recorded and nothing wanted: skip the PowerShell round trip.
    if (file === null && Object.keys(state.shortcuts).length === 0) return { enabled: state.enabled, updated: 0, failed: 0 }
    const desired = file === null ? null : `${file},0`
    const shortcuts = await this.io.scan(this.shell.execPath)
    const plan = planDesktopIcon(state, shortcuts, desired, this.managedDir)
    const results = plan.changes.length === 0 ? [] : await this.io.write(plan.changes)
    const failed = new Set(results.filter(result => !result.ok).map(result => pathKey(result.path)))
    const next: DesktopIconState = { ...state, shortcuts: { ...state.shortcuts } }
    for (const [path, record] of Object.entries(plan.records)) {
      if (failed.has(pathKey(path))) continue
      if (record === null) delete next.shortcuts[path]
      else next.shortcuts[path] = record
    }
    this.write(next)
    this.prune(desired, next)
    return { enabled: state.enabled, updated: results.length - failed.size, failed: failed.size }
  }

  /** Copy the ICO under a content-addressed name so the shortcut never points into a package. */
  private install(source: { skinId: string, file: string }): string {
    const bytes = readFileSync(source.file)
    const safeId = source.skinId.replace(/[^a-z0-9._-]/gi, '_')
    const target = joinPath(this.managedDir, `${safeId}-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.ico`)
    if (!existsSync(target)) {
      mkdirSync(this.managedDir, { recursive: true })
      const temporary = `${target}.${process.pid}.tmp`
      copyFileSync(source.file, temporary)
      renameSync(temporary, target)
    }
    return target
  }

  /** Remove managed ICOs no shortcut record still refers to. */
  private prune(desired: string | null, state: DesktopIconState): void {
    const keep = new Set(Object.values(state.shortcuts).map(record => pathKey(iconFile(record.applied))))
    if (desired !== null) keep.add(pathKey(iconFile(desired)))
    let files: string[]
    try {
      files = readdirSync(this.managedDir)
    } catch {
      return
    }
    for (const file of files) {
      const full = joinPath(this.managedDir, file)
      if (/\.ico$/i.test(file) && !keep.has(pathKey(full))) rmSync(full, { force: true })
    }
  }

  private read(): DesktopIconState {
    try {
      const raw = JSON.parse(readFileSync(this.statePath, 'utf8')) as Partial<DesktopIconState>
      const shortcuts: Record<string, ShortcutRecord> = {}
      for (const [path, record] of Object.entries(raw.shortcuts ?? {})) {
        if (typeof record?.original === 'string' && typeof record.applied === 'string') shortcuts[path] = { original: record.original, applied: record.applied }
      }
      return { version: 1, enabled: raw.enabled === true, shortcuts }
    } catch {
      return emptyState()
    }
  }

  private write(state: DesktopIconState): void {
    mkdirSync(dirname(this.statePath), { recursive: true })
    const temporary = `${this.statePath}.${process.pid}.tmp`
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    renameSync(temporary, this.statePath)
  }
}

/* ------------------------------------------------------------------ */
/* Windows shortcut IO through the in-box Windows PowerShell 5.1: the  */
/* WScript.Shell COM object reads and writes IconLocation and keeps    */
/* the shortcut's AppUserModelID, and SHChangeNotify refreshes the     */
/* icons Explorer and the taskbar already display.                     */
/* ------------------------------------------------------------------ */

const SCAN_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$exe = [IO.Path]::GetFullPath($env:DSH_SKIN_ICON_EXE)
$roots = @(
  @{ path = [Environment]::GetFolderPath('Desktop'); deep = $false },
  @{ path = [Environment]::GetFolderPath('CommonDesktopDirectory'); deep = $false },
  @{ path = [Environment]::GetFolderPath('Programs'); deep = $true },
  @{ path = [Environment]::GetFolderPath('CommonPrograms'); deep = $true },
  @{ path = (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'); deep = $false }
)
# Put back any Start menu shortcut an interrupted refresh left renamed.
foreach ($root in $roots) {
  if (-not $root.deep -or -not $root.path -or -not (Test-Path -LiteralPath $root.path)) { continue }
  foreach ($parked in @(Get-ChildItem -LiteralPath $root.path -Filter '*.lnk.dsh-refresh' -File -Recurse -ErrorAction SilentlyContinue)) {
    $restored = $parked.FullName.Substring(0, $parked.FullName.Length - '.dsh-refresh'.Length)
    try {
      if (Test-Path -LiteralPath $restored) { Remove-Item -LiteralPath $parked.FullName -Force }
      else { Move-Item -LiteralPath $parked.FullName -Destination $restored }
    } catch {}
  }
}
$shell = New-Object -ComObject WScript.Shell
$found = @()
foreach ($root in $roots) {
  if (-not $root.path -or -not (Test-Path -LiteralPath $root.path)) { continue }
  foreach ($file in @(Get-ChildItem -LiteralPath $root.path -Filter *.lnk -File -Recurse:$root.deep -ErrorAction SilentlyContinue)) {
    try {
      $link = $shell.CreateShortcut($file.FullName)
      if ($link.TargetPath -and [string]::Equals([IO.Path]::GetFullPath($link.TargetPath), $exe, [StringComparison]::OrdinalIgnoreCase)) {
        $found += [pscustomobject]@{ path = $file.FullName; target = $link.TargetPath; icon = $link.IconLocation }
      }
    } catch {}
  }
}
ConvertTo-Json -InputObject @($found) -Compress
`

const WRITE_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$changes = ConvertFrom-Json -InputObject $env:DSH_SKIN_ICON_CHANGES
$shell = New-Object -ComObject WScript.Shell
$results = @()
foreach ($change in $changes) {
  try {
    if (-not (Test-Path -LiteralPath $change.path)) { throw 'shortcut-missing' }
    $link = $shell.CreateShortcut($change.path)
    $link.IconLocation = $change.icon
    $link.Save()
    $results += [pscustomobject]@{ path = $change.path; ok = $true }
  } catch {
    $results += [pscustomobject]@{ path = $change.path; ok = $false; error = [string]$_.Exception.Message }
  }
}
# Start keeps its own app icon cache and only re-reads a shortcut it sees
# leave and return, so each rewritten Start menu shortcut is parked briefly
# under a non-.lnk name. The scan above recovers one an interruption strands.
$programs = @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('CommonPrograms')) | Where-Object { $_ } | ForEach-Object { $_.TrimEnd('\') + '\' }
$parked = @()
foreach ($result in $results) {
  if (-not $result.ok) { continue }
  foreach ($prefix in $programs) {
    if ($result.path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
      try {
        Move-Item -LiteralPath $result.path -Destination ($result.path + '.dsh-refresh')
        $parked += $result.path
      } catch {}
      break
    }
  }
}
if ($parked.Count -gt 0) {
  Start-Sleep -Seconds 3
  foreach ($path in $parked) { try { Move-Item -LiteralPath ($path + '.dsh-refresh') -Destination $path } catch {} }
}
try {
  Add-Type -Namespace DshSkin -Name Shell -MemberDefinition '[DllImport("shell32.dll", CharSet = CharSet.Unicode)] public static extern void SHChangeNotify(int eventId, uint flags, string item1, System.IntPtr item2);'
  foreach ($result in $results) { if ($result.ok) { [DshSkin.Shell]::SHChangeNotify(0x2000, 0x0005, $result.path, [IntPtr]::Zero) } }
  [DshSkin.Shell]::SHChangeNotify(0x08000000, 0, $null, [IntPtr]::Zero)
} catch {}
ConvertTo-Json -InputObject @($results) -Compress
`

function runPowerShell(script: string, env: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64'),
    ], {
      env: { ...process.env, ...env },
      timeout: POWERSHELL_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      if (error !== null) {
        reject(new Error(`desktop-icon-powershell: ${stderr.trim() || error.message}`))
        return
      }
      try {
        const text = stdout.replace(/^﻿/, '').trim()
        resolve(text === '' ? [] : JSON.parse(text))
      } catch {
        reject(new Error('desktop-icon-powershell: invalid output'))
      }
    })
  })
}

export const powershellShortcutIo: ShortcutIo = {
  async scan(execPath) {
    const rows = await runPowerShell(SCAN_SCRIPT, { DSH_SKIN_ICON_EXE: execPath })
    if (!Array.isArray(rows)) return []
    return rows.filter((row): row is ShortcutInfo => typeof row?.path === 'string' && typeof row.target === 'string' && typeof row.icon === 'string')
  },
  async write(changes) {
    const rows = await runPowerShell(WRITE_SCRIPT, { DSH_SKIN_ICON_CHANGES: JSON.stringify(changes) })
    if (!Array.isArray(rows)) return changes.map(change => ({ path: change.path, ok: false, error: 'invalid-output' }))
    return rows.map(row => ({
      path: String(row?.path),
      ok: row?.ok === true,
      ...(typeof row?.error === 'string' ? { error: row.error } : {}),
    }))
  },
}

/* ------------------------------------------------------------------ */
/* Window icon: WM_SETICON from a helper that stays alive, because an  */
/* HICON dies with the process that loaded it. The helper watches the  */
/* desktop main process for new top-level windows, restores the icons  */
/* it replaced on "stop" or when its stdin closes (host exit), and     */
/* exits on its own once the desktop process is gone.                  */
/* ------------------------------------------------------------------ */

const WINDOW_ICON_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace DshSkin -Name Window -MemberDefinition @'
public delegate bool EnumProc(System.IntPtr hwnd, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr hwnd, out uint pid);
[DllImport("user32.dll")] public static extern System.IntPtr GetWindow(System.IntPtr hwnd, uint cmd);
[DllImport("user32.dll")] public static extern bool IsWindow(System.IntPtr hwnd);
[DllImport("user32.dll")] public static extern System.IntPtr SendMessage(System.IntPtr hwnd, uint msg, System.IntPtr wParam, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
'@
[void][DshSkin.Window]::SetProcessDPIAware()
$target = [int]$env:DSH_SKIN_ICON_PID
$big = New-Object System.Drawing.Icon($env:DSH_SKIN_ICON_FILE, [DshSkin.Window]::GetSystemMetrics(11), [DshSkin.Window]::GetSystemMetrics(12))
$small = New-Object System.Drawing.Icon($env:DSH_SKIN_ICON_FILE, [DshSkin.Window]::GetSystemMetrics(49), [DshSkin.Window]::GetSystemMetrics(50))
$replaced = @{}
# Console.In.ReadLineAsync is synchronous on Windows PowerShell 5.1; the raw
# stream's ReadAsync completes on the thread pool with a line or at EOF.
$command = [Console]::OpenStandardInput().ReadAsync((New-Object byte[] 16), 0, 16)
function Set-OwnedIcons {
  $windows = New-Object System.Collections.Generic.List[System.IntPtr]
  $callback = [DshSkin.Window+EnumProc]{
    param($hwnd, $lParam)
    $owner = [uint32]0
    [void][DshSkin.Window]::GetWindowThreadProcessId($hwnd, [ref]$owner)
    if ($owner -eq $target -and [DshSkin.Window]::GetWindow($hwnd, 4) -eq [IntPtr]::Zero) { $windows.Add($hwnd) }
    return $true
  }
  [void][DshSkin.Window]::EnumWindows($callback, [IntPtr]::Zero)
  foreach ($hwnd in $windows) {
    if ($replaced.ContainsKey($hwnd)) { continue }
    $previousSmall = [DshSkin.Window]::SendMessage($hwnd, 0x80, [IntPtr]0, $small.Handle)
    $previousBig = [DshSkin.Window]::SendMessage($hwnd, 0x80, [IntPtr]1, $big.Handle)
    $replaced[$hwnd] = @($previousSmall, $previousBig)
  }
}
try {
  while ($true) {
    if ($null -eq (Get-Process -Id $target -ErrorAction SilentlyContinue)) { exit 0 }
    Set-OwnedIcons
    if ($command.Wait(2000)) { break }
  }
} finally {
  foreach ($entry in $replaced.GetEnumerator()) {
    if ([DshSkin.Window]::IsWindow($entry.Key)) {
      [void][DshSkin.Window]::SendMessage($entry.Key, 0x80, [IntPtr]0, $entry.Value[0])
      [void][DshSkin.Window]::SendMessage($entry.Key, 0x80, [IntPtr]1, $entry.Value[1])
    }
  }
}
`

/** Owns at most one window-icon helper; `set` is idempotent per file. */
export class WindowIconHolder {
  private child: ChildProcess | undefined
  private file: string | null = null
  private readonly targetPid: number

  /** @param targetPid - the desktop main process, the parent of the host child. */
  constructor(targetPid: number = process.ppid) {
    this.targetPid = targetPid
  }

  set(file: string | null): void {
    if (file === this.file && (file === null || this.child !== undefined)) return
    this.stop()
    this.file = file
    if (file === null) return
    const child = spawn('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-EncodedCommand', Buffer.from(WINDOW_ICON_SCRIPT, 'utf16le').toString('base64'),
    ], {
      env: { ...process.env, DSH_SKIN_ICON_FILE: file, DSH_SKIN_ICON_PID: String(this.targetPid) },
      stdio: ['pipe', 'ignore', 'pipe'],
      // Not detached: Windows PowerShell exits at once without a console. The
      // helper therefore dies with the host; a normal quit closes the windows
      // too, and a restarted host sets the icon again.
      windowsHide: true,
    })
    let stderr = ''
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-4096)
    })
    child.on('error', (error) => {
      console.error('[skin-manager] window icon helper failed to start', error)
    })
    child.on('exit', (code) => {
      if (this.child === child) this.child = undefined
      if (code !== 0 && code !== null) console.error(`[skin-manager] window icon helper exited with ${code}`, stderr.trim())
    })
    this.child = child
  }

  /** Ask the helper to restore the previous icons and exit; kill it if it lingers. */
  stop(): void {
    const child = this.child
    this.child = undefined
    this.file = null
    if (child === undefined) return
    try {
      child.stdin?.end('stop\n')
    } catch {
      // A helper that already exited has nothing left to restore.
    }
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill()
    }, 5_000).unref()
  }
}
