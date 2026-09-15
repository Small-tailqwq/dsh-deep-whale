// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installSessionArtwork } from '../src/client/session-artwork.ts'

const BASE = 'data:image/webp;base64,BASE'
const THINKING = 'data:image/webp;base64,THINKING'
const DONE = 'data:image/webp;base64,DONE'
const FAILED = 'data:image/webp;base64,FAILED'

/** The stage node this module borrows, exactly as `createCharacterStage` builds it. */
function stage(): HTMLImageElement {
  document.body.innerHTML = `<img data-maid-character="right" alt="" src="${BASE}">`
  return document.querySelector<HTMLImageElement>('img')!
}

/** Let the observer callback and the coalescing timer both run. */
async function settle(ms = 300): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

function running(): void {
  document.body.insertAdjacentHTML('beforeend', '<div data-state="running"></div>')
}

function failed(): void {
  document.body.insertAdjacentHTML('beforeend', '<div data-state="error"></div>')
}

afterEach(() => {
  delete window.__dshMaidAtelierArtwork
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('session artwork', () => {
  it('observes nothing when no portraits are supplied', async () => {
    vi.useFakeTimers()
    const image = stage()
    const dispose = installSessionArtwork()
    running()
    await settle()
    expect(image.getAttribute('src')).toBe(BASE)
    dispose()
    // Still untouched after disposal, and the node was never repainted.
    expect(image.getAttribute('src')).toBe(BASE)
  })

  it('swaps to thinking while a row is running, then to done and back', async () => {
    vi.useFakeTimers()
    window.__dshMaidAtelierArtwork = { thinking: THINKING, done: DONE, failed: FAILED }
    const image = stage()
    const dispose = installSessionArtwork()

    running()
    await settle()
    expect(image.getAttribute('src')).toBe(THINKING)

    document.querySelector('[data-state="running"]')!.remove()
    await settle()
    expect(image.getAttribute('src')).toBe(DONE)

    // The held portrait gives way to the base one on its own.
    await settle(4300)
    expect(image.getAttribute('src')).toBe(BASE)
    dispose()
  })

  it('treats only failures added during the current turn as this turn failing', async () => {
    vi.useFakeTimers()
    window.__dshMaidAtelierArtwork = { thinking: THINKING, done: DONE, failed: FAILED }
    const image = stage()
    const dispose = installSessionArtwork()

    // A failure that predates the turn must not colour it.
    failed()
    await settle()
    expect(image.getAttribute('src')).toBe(BASE)

    running()
    await settle()
    expect(image.getAttribute('src')).toBe(THINKING)

    failed()
    await settle()
    expect(image.getAttribute('src')).toBe(FAILED)

    document.querySelector('[data-state="running"]')!.remove()
    await settle()
    expect(image.getAttribute('src')).toBe(FAILED)
    dispose()
  })

  it('restores the portrait it replaced when disposed', async () => {
    vi.useFakeTimers()
    window.__dshMaidAtelierArtwork = { thinking: THINKING }
    const image = stage()
    const dispose = installSessionArtwork()

    running()
    await settle()
    expect(image.getAttribute('src')).toBe(THINKING)

    dispose()
    expect(image.getAttribute('src')).toBe(BASE)

    // A second disposal must not throw or write again.
    dispose()
    expect(image.getAttribute('src')).toBe(BASE)
  })
})
