// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SkinSwitchState } from '../src/contract.ts'
import { switchDesktopSkin } from '../src/client/desktop-switch.ts'

const catalog = [
  { id: 'maid', name: 'Maid', package: '@test/maid', wiringId: 'maid', bodyAttr: 'data-maid', order: 5 },
  { id: 'link', name: 'Link', package: '@test/link', wiringId: 'link', bodyAttr: 'data-link', order: 10 },
]
const mounted = (target: string): void => {
  for (const skin of catalog) document.body.toggleAttribute(skin.bodyAttr, skin.id === target)
}
const state = (target: string): SkinSwitchState => {
  const ids = target === 'official' ? [] : [target]
  return { configured: ids, active: ids, stale: [] }
}
afterEach(() => {
  vi.useRealTimers()
  for (const skin of catalog) document.body.removeAttribute(skin.bodyAttr)
  document.documentElement.lang = ''
})

describe('desktop switch confirmation and recovery', () => {
  it('keeps normal switches to a single request', async () => {
    let runtime = state('link')
    const request = vi.fn(async (target: string) => { mounted(target); runtime = state(target) })
    await switchDesktopSkin(catalog, 'maid', request, async () => runtime)
    expect(request.mock.calls.map(call => call[0])).toEqual(['maid'])
  })

  it('waits for the Host half when the browser bundle hot-updates first', async () => {
    vi.useFakeTimers()
    mounted('maid')
    const read = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined).mockResolvedValue(state('maid'))
    const request = vi.fn(async () => {})
    const switching = switchDesktopSkin(catalog, 'maid', request, read)
    await vi.advanceTimersByTimeAsync(400)
    await switching
    expect(read).toHaveBeenCalledTimes(3)
    expect(request).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['maid', 'official'])('repairs a disposed LINK retained by the Host when switching to %s', async target => {
    let runtime = state('link')
    let requests = 0
    const request = vi.fn(async (next: string) => {
      mounted(next)
      runtime = ++requests === 1
        ? { configured: state(next).configured, active: ['link', ...state(next).active], stale: ['link'] }
        : state(next)
    })
    // The page can momentarily look correct while the Host still retains LINK.
    await switchDesktopSkin(catalog, target, request, async () => runtime)
    expect(request.mock.calls.map(call => call[0])).toEqual([target, 'link', target])
    expect(runtime).toEqual(state(target))
    expect(document.body.hasAttribute('data-link')).toBe(false)
  })

  it('ends recovery after one attempt when the Host keeps retaining the old skin', async () => {
    document.documentElement.lang = 'en'
    let runtime = state('link')
    const request = vi.fn(async (next: string) => {
      mounted(next)
      runtime = next === 'link' ? state(next) : { configured: ['maid'], active: ['maid', 'link'], stale: ['link'] }
    })
    await expect(switchDesktopSkin(catalog, 'maid', request, async () => runtime)).rejects.toThrow('Multiple skins')
    expect(request.mock.calls.map(call => call[0])).toEqual(['maid', 'link', 'maid'])
  })

  it('restores the requested selection when reactivation fails', async () => {
    let runtime: SkinSwitchState = { configured: ['maid'], active: ['maid', 'link'], stale: ['link'] }
    const request = vi.fn(async (next: string) => {
      if (next === 'link') throw new Error('reactivation failed')
      runtime = { ...runtime, configured: ['maid'] }
    })
    await expect(switchDesktopSkin(catalog, 'maid', request, async () => runtime)).rejects.toThrow('reactivation failed')
    expect(request.mock.calls.map(call => call[0])).toEqual(['maid', 'link', 'maid'])
    expect(runtime.configured).toEqual(['maid'])
  })

  it('preserves a selection made by another operation during recovery', async () => {
    document.documentElement.lang = 'en'
    let runtime: SkinSwitchState = { configured: ['maid'], active: ['maid', 'link'], stale: ['link'] }
    const request = vi.fn(async (next: string) => {
      if (next === 'link') runtime = state('official')
    })
    await expect(switchDesktopSkin(catalog, 'maid', request, async () => runtime)).rejects.toThrow('Another operation')
    expect(request.mock.calls.map(call => call[0])).toEqual(['maid', 'link'])
  })

  it('waits for the page after the Host graph reaches the target and cancels without leaving timers', async () => {
    vi.useFakeTimers()
    const cancel = new AbortController()
    mounted('link')
    const request = vi.fn(async () => {})
    const switching = switchDesktopSkin(catalog, 'maid', request, async () => state('maid'), document, cancel.signal)
    const rejected = expect(switching).rejects.toThrow('cancelled')
    await vi.advanceTimersByTimeAsync(200)
    cancel.abort(new Error('cancelled'))
    await rejected
    expect(vi.getTimerCount()).toBe(0)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not automatically grant version compatibility to a recovery skin', async () => {
    document.documentElement.lang = 'en'
    const blocked = catalog.map(skin => skin.id === 'link' ? { ...skin, compatibility: { package: '@test/link@1', runtimeVersion: '0.2.2', peers: {}, exempted: false } } : skin)
    const request = vi.fn(async () => {})
    await expect(switchDesktopSkin(blocked, 'maid', request, async () => ({ configured: ['maid'], active: ['maid', 'link'], stale: ['link'] }))).rejects.toThrow('Multiple skins')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('restores the requested selection if the manager unloads during recovery', async () => {
    vi.useFakeTimers()
    const cancel = new AbortController()
    let runtime: SkinSwitchState = { configured: ['maid'], active: ['maid', 'link'], stale: ['link'] }
    const request = vi.fn(async (next: string) => {
      if (next === 'link') runtime = { configured: ['link'], active: [], stale: [] }
      else runtime = { ...runtime, configured: ['maid'] }
    })
    const switching = switchDesktopSkin(catalog, 'maid', request, async () => runtime, document, cancel.signal)
    const rejected = expect(switching).rejects.toThrow('unloaded')
    await vi.advanceTimersByTimeAsync(200)
    cancel.abort(new Error('unloaded'))
    await rejected
    expect(request.mock.calls.map(call => call[0])).toEqual(['maid', 'link', 'maid'])
    expect(runtime.configured).toEqual(['maid'])
    expect(vi.getTimerCount()).toBe(0)
  })
})
