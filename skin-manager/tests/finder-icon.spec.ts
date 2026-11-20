import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { detectFinderApp, FinderIconSync } from '../src/finder-icon.ts'

it('offers Finder sync only from the macOS DSH desktop host', () => {
  const app = '/Applications/Renamed DSH.app'
  const execPath = join(app, 'Contents', 'MacOS', 'DeepSeek Harness')
  const electron = { ELECTRON_RUN_AS_NODE: '1' }
  expect(detectFinderApp('darwin', electron, execPath)).toBe(app)
  expect(detectFinderApp('darwin', {}, execPath)).toBeNull()
  expect(detectFinderApp('darwin', electron, '/usr/local/bin/node')).toBeNull()
  expect(detectFinderApp('linux', electron, execPath)).toBeNull()
})

describe.skipIf(process.platform !== 'darwin')('macOS Finder icons', () => {
  const maid = fileURLToPath(new URL('../../maid-atelier/assets/icons/delighted.ico', import.meta.url))
  const orca = fileURLToPath(new URL('../../orca-link/assets/icons/orca-link.ico', import.meta.url))
  let temp = ''

  function fixture() {
    temp = mkdtempSync(join(tmpdir(), 'dsh-finder-icon-test-'))
    const app = join(temp, 'Test.app')
    mkdirSync(join(app, 'Contents'), { recursive: true })
    const fork = join(app, 'Icon\r', '..namedfork', 'rsrc')
    return { app, fork, sync: new FinderIconSync(temp, app) }
  }

  afterEach(() => rmSync(temp, { force: true, recursive: true }))

  it('follows both skins after opt-in and clears the icon on Official or disable', async () => {
    const { sync, app, fork } = fixture()
    expect(await sync.reconcile(maid)).toMatchObject({ enabled: false, updated: 0 })
    expect(() => readFileSync(fork)).toThrow()

    expect(await sync.setEnabled(true, maid)).toEqual({ enabled: true, updated: 1, failed: 0 })
    const maidIcon = readFileSync(fork)
    const reloaded = new FinderIconSync(temp, app)
    expect(reloaded.enabled).toBe(true)
    expect(await reloaded.reconcile(maid)).toMatchObject({ updated: 0, failed: 0 })
    expect(await reloaded.reconcile(orca)).toMatchObject({ updated: 1, failed: 0 })
    expect(readFileSync(fork).equals(maidIcon)).toBe(false)

    expect(await reloaded.reconcile(null)).toEqual({ enabled: true, updated: 1, failed: 0 })
    expect(() => readFileSync(fork)).toThrow()
    await reloaded.reconcile(maid)
    expect(await reloaded.setEnabled(false, maid)).toEqual({ enabled: false, updated: 1, failed: 0 })
    expect(() => readFileSync(fork)).toThrow()
  }, 15_000)

  it('preserves an icon the user changes in Finder after opting in', async () => {
    const { app, sync, fork } = fixture()
    await sync.setEnabled(true, maid)
    execFileSync('/usr/bin/osascript', ['-l', 'JavaScript', '-e',
      "ObjC.import('AppKit'); function run([app, file]) { return $.NSWorkspace.sharedWorkspace.setIconForFileOptions($.NSImage.alloc.initWithContentsOfFile(file), app, 0) }",
      '--', app, orca])
    const manualIcon = readFileSync(fork)
    expect(await sync.reconcile(maid)).toMatchObject({ failed: 1, errors: ['finder-custom-icon'] })
    expect(await sync.setEnabled(false, maid)).toMatchObject({ updated: 0, failed: 0 })
    expect(readFileSync(fork).equals(manualIcon)).toBe(true)
  }, 15_000)
})
