import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { SkinCatalogEntry } from '../src/contract.ts'
import {
  describeShortcutFailure,
  detectDesktopShell,
  DesktopIconSync,
  isManagedIcon,
  planDesktopIcon,
  resolveSkinDesktopIcon,
  sharedShortcutRoots,
  type ShortcutChange,
  type ShortcutInfo,
  type ShortcutIo,
} from '../src/desktop-icon.ts'
import { activeSkinTarget, makeSkinManagerRoute, MANAGED_END, MANAGED_START } from '../src/index.ts'

const EXE = 'C:\\Apps\\DeepSeek Harness\\DeepSeek Harness.exe'
const EXE_ICON = `${EXE},0`
const temporary: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-desktop-icon-'))
  temporary.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** In-memory shortcut table standing in for WScript.Shell. */
function fakeIo(initial: ShortcutInfo[], denied: string[] = []): ShortcutIo & { table: Map<string, ShortcutInfo>, writes: ShortcutChange[][] } {
  const table = new Map(initial.map(shortcut => [shortcut.path, { ...shortcut }]))
  const writes: ShortcutChange[][] = []
  return {
    table,
    writes,
    async scan(execPath) {
      return [...table.values()].filter(shortcut => shortcut.target === execPath).map(shortcut => ({ ...shortcut }))
    },
    async write(changes) {
      writes.push(changes)
      return changes.map((change) => {
        if (denied.includes(change.path)) return { path: change.path, ok: false, error: 'access denied' }
        table.get(change.path)!.icon = change.icon
        return { path: change.path, ok: true }
      })
    },
  }
}

function skinIcon(bytes = 'ICO-A'): string {
  const dir = tempDir()
  const file = join(dir, 'skin.ico')
  writeFileSync(file, bytes)
  return file
}

describe('desktop shell detection', () => {
  it('only accepts the Windows desktop host running as Node', () => {
    expect(detectDesktopShell('win32', { ELECTRON_RUN_AS_NODE: '1' }, EXE)).toEqual({ execPath: EXE })
    expect(detectDesktopShell('win32', {}, EXE)).toBeNull()
    expect(detectDesktopShell('darwin', { ELECTRON_RUN_AS_NODE: '1' }, '/Applications/DSH')).toBeNull()
    expect(detectDesktopShell('win32', { ELECTRON_RUN_AS_NODE: '1' }, 'C:\\nodejs\\node.exe')).toBeNull()
  })
})

describe('skin manifest desktop icon', () => {
  it('resolves only an existing package-relative .ico', () => {
    const dir = tempDir()
    mkdirSync(join(dir, 'assets', 'icons'), { recursive: true })
    writeFileSync(join(dir, 'assets', 'icons', 'a.ico'), 'ico')
    writeFileSync(join(dir, 'assets', 'icons', 'a.png'), 'png')
    expect(resolveSkinDesktopIcon(dir, 'assets/icons/a.ico')).toBe(join(dir, 'assets', 'icons', 'a.ico'))
    expect(resolveSkinDesktopIcon(dir, 'assets/icons/a.png')).toBeNull()
    expect(resolveSkinDesktopIcon(dir, 'assets/icons/missing.ico')).toBeNull()
    expect(resolveSkinDesktopIcon(dir, '../outside.ico')).toBeNull()
    expect(resolveSkinDesktopIcon(dir, join(dir, 'assets', 'icons', 'a.ico'))).toBeNull()
    expect(resolveSkinDesktopIcon(dir, 42)).toBeNull()
  })
})

describe('desktop icon plan', () => {
  const managed = 'C:\\Users\\u\\.dsh\\skin-manager\\desktop-icons'
  const desired = `${managed}\\maid-atelier-0123.ico,0`
  const shortcut = (path: string, icon = EXE_ICON): ShortcutInfo => ({ path, target: EXE, icon })

  it('records the icon it replaces and restores only its own write', () => {
    const apply = planDesktopIcon({ version: 1, enabled: true, shortcuts: {} }, [shortcut('C:\\a.lnk', 'D:\\custom.ico,0')], desired, managed)
    expect(apply.changes).toEqual([{ path: 'C:\\a.lnk', icon: desired }])
    expect(apply.records['C:\\a.lnk']).toEqual({ original: 'D:\\custom.ico,0', applied: desired })

    const state = { version: 1 as const, enabled: false, shortcuts: { 'C:\\a.lnk': apply.records['C:\\a.lnk']! } }
    const restore = planDesktopIcon(state, [shortcut('C:\\a.lnk', desired)], null, managed)
    expect(restore.changes).toEqual([{ path: 'C:\\a.lnk', icon: 'D:\\custom.ico,0' }])
    expect(restore.records['C:\\a.lnk']).toBeNull()

    // Something else changed the shortcut since: leave it alone, forget the record.
    const foreign = planDesktopIcon(state, [shortcut('C:\\a.lnk', 'E:\\other.ico,0')], null, managed)
    expect(foreign.changes).toEqual([])
    expect(foreign.records['C:\\a.lnk']).toBeNull()
  })

  it('keeps the first original when switching between skins', () => {
    const state = { version: 1 as const, enabled: true, shortcuts: { 'C:\\a.lnk': { original: EXE_ICON, applied: desired } } }
    const next = `${managed}\\orca-link-4567.ico,0`
    const plan = planDesktopIcon(state, [shortcut('C:\\a.lnk', desired)], next, managed)
    expect(plan.records['C:\\a.lnk']).toEqual({ original: EXE_ICON, applied: next })
  })

  it('re-records a shortcut that a reinstall reset and forgets vanished ones', () => {
    const state = { version: 1 as const, enabled: true, shortcuts: {
      'C:\\a.lnk': { original: 'C:\\Old\\DeepSeek Harness.exe,0', applied: desired },
      'C:\\gone.lnk': { original: EXE_ICON, applied: desired },
    } }
    const plan = planDesktopIcon(state, [shortcut('C:\\a.lnk')], desired, managed)
    expect(plan.changes).toEqual([{ path: 'C:\\a.lnk', icon: desired }])
    expect(plan.records['C:\\a.lnk']).toEqual({ original: EXE_ICON, applied: desired })
    expect(plan.records['C:\\gone.lnk']).toBeNull()
  })

  it('restores a managed icon even after the state file was lost', () => {
    const plan = planDesktopIcon({ version: 1, enabled: false, shortcuts: {} }, [shortcut('C:\\a.lnk', desired)], null, managed)
    expect(plan.changes).toEqual([{ path: 'C:\\a.lnk', icon: EXE_ICON }])
  })

  it('matches managed paths case-insensitively and rejects look-alike prefixes', () => {
    expect(isManagedIcon(`${managed.toUpperCase()}\\x.ico,0`, managed)).toBe(true)
    expect(isManagedIcon(`${managed}-evil\\x.ico,0`, managed)).toBe(false)
    expect(isManagedIcon(EXE_ICON, managed)).toBe(false)
  })
})

describe('desktop icon sync', () => {
  const shortcuts = (): ShortcutInfo[] => [
    { path: 'C:\\Desktop\\DeepSeek Harness.lnk', target: EXE, icon: EXE_ICON },
    { path: 'C:\\Start\\DeepSeek Harness.lnk', target: EXE, icon: EXE_ICON },
    { path: 'C:\\Desktop\\Other.lnk', target: 'C:\\Other.exe', icon: 'C:\\Other.exe,0' },
  ]

  it('stays idle until the user opts in', async () => {
    const io = fakeIo(shortcuts())
    const sync = new DesktopIconSync(tempDir(), { execPath: EXE }, io)
    expect(await sync.reconcile({ skinId: 'maid-atelier', file: skinIcon() })).toEqual({ enabled: false, updated: 0, failed: 0 })
    expect(io.writes).toEqual([])
    expect(sync.enabled).toBe(false)
  })

  it('keeps scanning after an interrupted write until parked shortcuts are recovered', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts())
    let scans = 0
    const scan = io.scan.bind(io)
    io.scan = async (execPath) => { scans += 1; return scan(execPath) }
    // The write dies mid-refresh (timeout, host quit): nothing is recorded.
    io.write = async () => { throw new Error('desktop-icon-powershell: timed out') }
    const sync = new DesktopIconSync(home, { execPath: EXE }, io)
    await expect(sync.setEnabled(true, { skinId: 'maid-atelier', file: skinIcon() })).rejects.toThrow('timed out')
    expect(existsSync(sync.parkMarkerPath)).toBe(true)

    // Switched off with no records left, a pass still scans (the scan puts
    // parked shortcuts back) and then clears the marker.
    const before = scans
    await sync.setEnabled(false, null)
    expect(scans).toBe(before + 1)
    expect(existsSync(sync.parkMarkerPath)).toBe(false)
    await sync.reconcile(null)
    expect(scans).toBe(before + 1)
  })

  it('applies a copied icon, follows a switch and restores the originals', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts())
    const windowIcons: Array<string | null> = []
    const sync = new DesktopIconSync(home, { execPath: EXE }, io, file => windowIcons.push(file))
    const first = await sync.setEnabled(true, { skinId: 'maid-atelier', file: skinIcon('MAID') })
    expect(first).toEqual({ enabled: true, updated: 2, failed: 0 })
    const applied = io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon
    expect(applied.startsWith(join(home, 'skin-manager', 'desktop-icons'))).toBe(true)
    expect(readFileSync(applied.replace(/,0$/, ''), 'utf8')).toBe('MAID')
    expect(io.table.get('C:\\Desktop\\Other.lnk')!.icon).toBe('C:\\Other.exe,0')

    await sync.reconcile({ skinId: 'orca-link', file: skinIcon('ORCA') })
    const switched = io.table.get('C:\\Start\\DeepSeek Harness.lnk')!.icon
    expect(readFileSync(switched.replace(/,0$/, ''), 'utf8')).toBe('ORCA')
    // The previous skin's copy is pruned once nothing refers to it.
    expect(readdirSync(join(home, 'skin-manager', 'desktop-icons'))).toHaveLength(1)

    // Official look: restore while the switch stays on.
    await sync.reconcile(null)
    expect(io.table.get('C:\\Start\\DeepSeek Harness.lnk')!.icon).toBe(EXE_ICON)
    expect(sync.enabled).toBe(true)

    await sync.reconcile({ skinId: 'orca-link', file: skinIcon('ORCA') })
    const off = await sync.setEnabled(false, { skinId: 'orca-link', file: skinIcon('ORCA') })
    expect(off).toEqual({ enabled: false, updated: 2, failed: 0 })
    expect([...io.table.values()].map(shortcut => shortcut.icon)).toEqual([EXE_ICON, EXE_ICON, 'C:\\Other.exe,0'])
    // The window icon follows every pass and ends on the official icon.
    expect(windowIcons.map(file => file?.replace(/^.*[\\/]|-[0-9a-f]+\.ico$/g, '') ?? null)).toEqual(['maid-atelier', 'orca-link', null, 'orca-link', null])
    expect(existsSync(join(home, 'skin-manager', 'desktop-icons')) && readdirSync(join(home, 'skin-manager', 'desktop-icons'))).toEqual([])
  })

  it('keeps no record for a shortcut it could not write', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts(), ['C:\\Start\\DeepSeek Harness.lnk'])
    const sync = new DesktopIconSync(home, { execPath: EXE }, io)
    expect(await sync.setEnabled(true, { skinId: 'maid-atelier', file: skinIcon() })).toEqual({ enabled: true, updated: 1, failed: 1, errors: ['access denied'] })
    const state = JSON.parse(readFileSync(sync.statePath, 'utf8')) as { shortcuts: Record<string, unknown> }
    expect(Object.keys(state.shortcuts)).toEqual(['C:\\Desktop\\DeepSeek Harness.lnk'])
  })

  it('serializes activations sharing a home before installing or pruning icons', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts())
    const entered = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    const scan = io.scan.bind(io)
    let scans = 0
    io.scan = async (execPath) => {
      const snapshot = await scan(execPath)
      if (++scans === 1) {
        entered.resolve()
        await release.promise
      }
      return snapshot
    }
    const first = new DesktopIconSync(home, { execPath: EXE }, io)
    const next = new DesktopIconSync(home, { execPath: EXE }, io)
    const a = first.setEnabled(true, { skinId: 'maid-atelier', file: skinIcon('MAID') })
    await entered.promise
    const b = next.setEnabled(true, { skinId: 'orca-link', file: skinIcon('ORCA') })
    try {
      await Promise.resolve()
      await Promise.resolve()
      expect(scans).toBe(1)
    } finally {
      release.resolve()
      await Promise.all([a, b])
    }
    const applied = io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon
    expect(readFileSync(applied.replace(/,0$/, ''), 'utf8')).toBe('ORCA')
    expect(readdirSync(next.managedDir)).toHaveLength(1)
    await next.setEnabled(false, null)
    expect(io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon).toBe(EXE_ICON)
  })

  it('drains pending writes and queued restores before unloading', async () => {
    const io = fakeIo(shortcuts())
    const entered = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    const write = io.write.bind(io)
    io.write = async changes => {
      entered.resolve()
      await release.promise
      return write(changes)
    }
    const sync = new DesktopIconSync(tempDir(), { execPath: EXE }, io)
    const applying = sync.setEnabled(true, { skinId: 'maid-atelier', file: skinIcon() })
    await entered.promise
    const restoring = sync.reconcile(null)
    let drained = false
    const unloading = sync.drain().then(() => { drained = true })
    try {
      await Promise.resolve()
      expect(drained).toBe(false)
    } finally {
      release.resolve()
      await Promise.all([applying, restoring, unloading])
    }
    expect(io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon).toBe(EXE_ICON)
    expect(readdirSync(sync.managedDir)).toEqual([])
    expect(drained).toBe(true)
  })

  // #200: a security suite's shortcut protection blocks powershell.exe, and
  // WScript.Shell names each shortcut in the same error.
  it('reports one save-blocked reason for every blocked shortcut', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts())
    io.write = async changes => changes.map(change => ({ path: change.path, ok: false, error: `Unable to save shortcut "${change.path}".` }))
    const sync = new DesktopIconSync(home, { execPath: EXE }, io)
    expect(await sync.setEnabled(true, { skinId: 'orca-link', file: skinIcon('ORCA') })).toEqual({ enabled: true, updated: 0, failed: 2, errors: ['save-blocked'] })
  })

  // #200: the write saved both shortcuts but reported failure, so no record
  // reached the state file and turning the switch off used to skip the scan.
  it('restores shortcuts whose write reported failure after saving', async () => {
    const home = tempDir()
    const io = fakeIo(shortcuts())
    const write = io.write.bind(io)
    io.write = async (changes) => (await write(changes)).map(result => ({ ...result, ok: false, error: 'invalid-output' }))
    const sync = new DesktopIconSync(home, { execPath: EXE }, io)
    expect(await sync.setEnabled(true, { skinId: 'orca-link', file: skinIcon('ORCA') })).toEqual({ enabled: true, updated: 0, failed: 2, errors: ['invalid-output'] })
    expect((JSON.parse(readFileSync(sync.statePath, 'utf8')) as { shortcuts: object }).shortcuts).toEqual({})
    expect(io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon).not.toBe(EXE_ICON)

    io.write = write
    expect(await sync.setEnabled(false, null)).toEqual({ enabled: false, updated: 2, failed: 0 })
    expect([...io.table.values()].map(shortcut => shortcut.icon)).toEqual([EXE_ICON, EXE_ICON, 'C:\\Other.exe,0'])
    expect(readdirSync(sync.managedDir)).toEqual([])
  })

  it('heals a disabled state with no records on startup while a managed icon remains', async () => {
    const home = tempDir()
    const sync = new DesktopIconSync(home, { execPath: EXE }, fakeIo([]))
    mkdirSync(sync.managedDir, { recursive: true })
    const stale = join(sync.managedDir, 'orca-link-0123456789abcdef.ico')
    writeFileSync(stale, 'ORCA')
    writeFileSync(sync.statePath, JSON.stringify({ version: 1, enabled: false, shortcuts: {} }))
    const io = fakeIo(shortcuts().map((shortcut, index) => index === 0 ? { ...shortcut, icon: `${stale},0` } : shortcut))
    const healed = new DesktopIconSync(home, { execPath: EXE }, io)
    expect(await healed.reconcile({ skinId: 'orca-link', file: skinIcon('ORCA') })).toEqual({ enabled: false, updated: 1, failed: 0 })
    expect(io.table.get('C:\\Desktop\\DeepSeek Harness.lnk')!.icon).toBe(EXE_ICON)
    expect(existsSync(stale)).toBe(false)
    // Fully restored: later startups skip PowerShell again.
    await healed.reconcile(null)
    expect(io.writes).toHaveLength(1)
  })
})

describe('desktop icon route', () => {
  const catalog: SkinCatalogEntry[] = [
    { id: 'maid-atelier', name: 'Maid', package: '@test/maid', wiringId: 'ui-skin-maid', bodyAttr: 'data-maid', order: 5 },
    { id: 'orca-link', name: 'Orca', package: '@test/orca', wiringId: 'ui-skin-orca', bodyAttr: 'data-orca', order: 10 },
  ]

  it('resolves the single effectively enabled skin', () => {
    const patch = (maid: boolean, orca: boolean): string => [MANAGED_START, '- id: ui-skin-maid', `  disabled: ${!maid}`, '- id: ui-skin-orca', `  disabled: ${!orca}`, MANAGED_END].join('\n')
    expect(activeSkinTarget([patch(true, false)], catalog)).toBe('maid-atelier')
    expect(activeSkinTarget([patch(false, false)], catalog)).toBe('official')
    expect(activeSkinTarget([patch(true, true)], catalog)).toBe('official')
    const blocked = catalog.map(skin => skin.id === 'maid-atelier'
      ? { ...skin, compatibility: { package: '@test/maid@1.0.0', runtimeVersion: '0.1.8', peers: {}, exempted: false } }
      : skin)
    expect(activeSkinTarget([patch(true, false)], blocked)).toBe('official')
  })

  async function call(route: ReturnType<typeof makeSkinManagerRoute>, method: string, body?: unknown): Promise<{ status: number, body: Record<string, unknown> }> {
    const { EventEmitter } = await import('node:events')
    const req = Object.assign(new EventEmitter(), { method, headers: {} as Record<string, string>, destroy() {} })
    return new Promise((resolve) => {
      let status = 0
      const res = {
        writeHead(code: number) { status = code },
        end(text: string) { resolve({ status, body: JSON.parse(text) as Record<string, unknown> }) },
      }
      void route.handler(req as never, res as never)
      queueMicrotask(() => {
        if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)))
        req.emit('end')
      })
    })
  }

  it('reports status only when the control exists and forwards toggles and switches', async () => {
    const plain = makeSkinManagerRoute(() => catalog, () => {})
    expect((await call(plain, 'GET')).body.desktopIcon).toBeUndefined()
    expect((await call(plain, 'POST', { action: 'desktop-icon', enabled: true })).status).toBe(400)

    const followed: string[] = []
    let enabled = false
    const route = makeSkinManagerRoute(() => catalog, () => {}, () => new Map(), undefined, {
      enabled: () => enabled,
      setEnabled: async (next) => {
        enabled = next
        return { enabled: next, updated: 2, failed: 0 }
      },
      follow: (target) => { followed.push(target) },
    })
    expect((await call(route, 'GET')).body.desktopIcon).toEqual({ enabled: false })
    expect((await call(route, 'POST', { action: 'desktop-icon', enabled: 'yes' })).status).toBe(400)
    expect((await call(route, 'POST', { action: 'desktop-icon', enabled: true })).body).toEqual({ ok: true, desktopIcon: { enabled: true, updated: 2, failed: 0 } })
    expect((await call(route, 'POST', { target: 'orca-link' })).body).toEqual({ ok: true, target: 'orca-link' })
    expect(followed).toEqual(['orca-link'])
  })
})

describe('shortcut failure reasons', () => {
  const roots = sharedShortcutRoots({ PUBLIC: 'C:\\Users\\Public', ProgramData: 'C:\\ProgramData' })
  const own = 'C:\\Users\\me\\Desktop\\DeepSeek Harness.lnk'

  it('lists the all-users desktop and Start menu', () => {
    expect(roots).toEqual(['C:\\Users\\Public\\Desktop', 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu'])
  })

  it('blames elevation only for all-users shortcuts', () => {
    const shared = 'C:\\Users\\Public\\Desktop\\DeepSeek Harness.lnk'
    expect(describeShortcutFailure(shared, `Unable to save shortcut "${shared}".`, roots)).toBe('shared-denied')
    expect(describeShortcutFailure('c:\\programdata\\Microsoft\\Windows\\Start Menu\\Programs\\DeepSeek Harness.lnk', 'Access is denied.', roots)).toBe('shared-denied')
    expect(describeShortcutFailure('C:\\Users\\PublicX\\Desktop\\DeepSeek Harness.lnk', 'boom', roots)).toBe('boom')
  })

  it('reads a per-user save failure as a security suite block', () => {
    expect(describeShortcutFailure(own, `Unable to save shortcut "${own}".`, roots)).toBe('save-blocked')
    expect(describeShortcutFailure(own, `无法保存快捷方式“${own}”。`, roots)).toBe('save-blocked')
  })

  it('strips shortcut paths from other messages so they deduplicate', () => {
    const a = describeShortcutFailure('C:\\a.lnk', `Cannot find path 'C:\\a.lnk' because it does not exist.`, roots)
    const b = describeShortcutFailure('C:\\b.lnk', `Cannot find path 'C:\\b.lnk' because it does not exist.`, roots)
    expect(a).toBe('Cannot find path because it does not exist.')
    expect(b).toBe(a)
    expect(describeShortcutFailure(own, undefined, roots)).toBe('unknown')
  })
})
