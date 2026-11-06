// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestSkinSwitch } from '../src/client/SkinManager.tsx'

const skin = { id: 'maid', name: 'Maid', package: '@test/maid', wiringId: 'ui-skin-maid', bodyAttr: 'data-maid', order: 1 }

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'dshDesktopBoot')
  document.body.removeAttribute('data-maid')
  document.documentElement.lang = ''
})

describe('desktop skin switching', () => {
  it('reports a restart when the saved switch never reaches the requested skin', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'dshDesktopBoot', { value: {}, configurable: true })
    document.documentElement.lang = 'en'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, skins: [skin] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }))

    const switching = requestSkinSwitch('maid')
    const result = expect(switching).rejects.toThrow('Restart the desktop app')
    await vi.advanceTimersByTimeAsync(12_000)
    await result
  })

  it('finishes when the requested skin mounts', async () => {
    Object.defineProperty(window, 'dshDesktopBoot', { value: {}, configurable: true })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, skins: [skin] }) })
      .mockImplementationOnce(async () => {
        document.body.setAttribute('data-maid', '')
        return { ok: true, json: async () => ({ ok: true }) }
      }))
    await expect(requestSkinSwitch('maid')).resolves.toBeUndefined()
  })
})
