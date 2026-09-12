// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidMobileViewport } from '../src/client/mobile-viewport.ts'

interface VisualState {
  height: number
  offsetTop: number
  scale: number
}

interface VisualHandle {
  /** Registered listener types; the installer binds resize and scroll. */
  registrations: string[]
  set: (next: Partial<VisualState>) => void
}

/**
 * jsdom ships no VisualViewport. Model the surface the installer reads —
 * `height`, `offsetTop`, `scale` — plus the listeners it binds, so a test can
 * drive a keyboard opening the way a browser reports it.
 */
function installVisualViewport(initial: VisualState): VisualHandle {
  const state = { ...initial }
  const listeners = new Map<string, Set<() => void>>()
  const viewport = {
    get height() { return state.height },
    get offsetTop() { return state.offsetTop },
    get scale() { return state.scale },
    addEventListener(type: string, listener: () => void) {
      if (type !== 'resize' && type !== 'scroll') return
      const bucket = listeners.get(type) ?? new Set<() => void>()
      bucket.add(listener)
      listeners.set(type, bucket)
    },
    removeEventListener(type: string, listener: () => void) {
      listeners.get(type)?.delete(listener)
    },
  }
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  return {
    get registrations() {
      return [...listeners].flatMap(([type, bucket]) => [...bucket].map(() => type))
    },
    set(next) {
      Object.assign(state, next)
      for (const bucket of listeners.values()) {
        for (const listener of bucket) listener()
      }
    },
  }
}

/** jsdom reports 1024x768 for every window. */
function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

function box(top: number, height: number, left = 20, width = 350): DOMRect {
  return {
    x: left,
    y: top,
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect
}

/** The composer's card, positioned where a phone would put it. */
function mountComposerCard(top: number, height = 132): HTMLElement {
  const card = document.createElement('div')
  card.setAttribute('data-composer-card', '')
  card.getBoundingClientRect = () => box(top, height, 16, 358)
  document.body.append(card)
  return card
}

function varOf(name: string): string {
  return document.documentElement.style.getPropertyValue(name)
}

/** Let a queued animation frame and the settle timers run. */
function flush(ms = 60): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

function viewportMeta(): HTMLMetaElement {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', 'width=device-width, initial-scale=1')
  document.head.append(meta)
  return meta
}

let disposers: Array<() => void> = []

/** Install and register the disposer, so a failed assertion cannot leak listeners. */
function install(): () => void {
  const dispose = installMaidMobileViewport(document.body)
  disposers.push(dispose)
  return dispose
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  disposers = []
  setViewport(390, 844)
})

afterEach(() => {
  for (const dispose of disposers) dispose()
  disposers = []
  document.documentElement.removeAttribute('data-maid-keyboard')
  document.documentElement.removeAttribute('style')
})

describe('Maid Atelier phone viewport', () => {
  it('measures the shell without pinning it while no keyboard is up', async () => {
    installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    mountComposerCard(438)
    install()
    await flush()

    expect(document.documentElement.hasAttribute('data-maid-keyboard')).toBe(false)
    expect(varOf('--maid-vv-height')).toBe('844px')
    expect(varOf('--maid-vv-top')).toBe('0px')
  })

  it('pins the shell once the keyboard takes a real slice of the viewport', async () => {
    const visual = installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    mountComposerCard(438)
    install()
    await flush()

    visual.set({ height: 404 })
    await flush()

    expect(document.documentElement.getAttribute('data-maid-keyboard')).toBe('open')
    expect(varOf('--maid-vv-height')).toBe('404px')

    visual.set({ height: 844 })
    await flush()

    expect(document.documentElement.hasAttribute('data-maid-keyboard')).toBe(false)
  })

  it('publishes the visual viewport offset the shell pins itself to', async () => {
    const visual = installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    mountComposerCard(438)
    install()
    await flush()

    visual.set({ height: 404, offsetTop: 24 })
    await flush()

    expect(varOf('--maid-vv-top')).toBe('24px')
  })

  it('pins the shell on a touch pointer even when the shell is wider than the phone breakpoint', async () => {
    // Landscape phones are wider than 700px; the shell must still follow the
    // keyboard because the pointer, not the width, makes it a phone.
    window.matchMedia = ((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    setViewport(844, 390)
    installVisualViewport({ height: 180, offsetTop: 0, scale: 1 })
    mountComposerCard(200)
    install()
    await flush()

    expect(document.documentElement.getAttribute('data-maid-keyboard')).toBe('open')
    expect(varOf('--maid-vv-height')).toBe('180px')
  })

  it('keeps the shell alone while the viewport is only pinch-zoomed', async () => {
    installVisualViewport({ height: 400, offsetTop: 0, scale: 1.8 })
    mountComposerCard(438)
    install()
    await flush()

    expect(document.documentElement.hasAttribute('data-maid-keyboard')).toBe(false)
  })

  it('brings a composer that the keyboard left below the fold back into the band', async () => {
    const visual = installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    const card = mountComposerCard(438, 140)
    const scrollIntoView = vi.fn()
    card.scrollIntoView = scrollIntoView
    install()
    await flush()

    visual.set({ height: 422 })
    await flush()

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('does not move a composer that already fits inside the band', async () => {
    const visual = installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    const card = mountComposerCard(438, 140)
    const scrollIntoView = vi.fn()
    card.scrollIntoView = scrollIntoView
    install()
    await flush()

    // The shell pin is what moves the card up; jsdom does not lay out, so model
    // the pinned position the browser would produce before the keyboard opens.
    card.getBoundingClientRect = () => box(227, 140, 16, 358)
    visual.set({ height: 422 })
    await flush()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('appends the resize hint once and gives the host tag back on dispose', async () => {
    const meta = viewportMeta()
    installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    mountComposerCard(438)
    const dispose = install()
    await flush()

    const hinted = meta.getAttribute('content') ?? ''
    expect(hinted).toContain('interactive-widget=resizes-content')
    expect(hinted.match(/interactive-widget/g)).toHaveLength(1)

    dispose()
    expect(meta.getAttribute('content')).toBe('width=device-width, initial-scale=1')
  })

  it('gives back every variable, attribute and listener on dispose', async () => {
    const visual = installVisualViewport({ height: 404, offsetTop: 12, scale: 1 })
    mountComposerCard(300)
    const dispose = install()
    await flush()

    // VisualViewport resize and scroll; no document scroll listener exists,
    // because nothing here depends on the transcript's scroll position.
    expect(visual.registrations).toEqual(['resize', 'scroll'])
    expect(varOf('--maid-vv-height')).toBe('404px')

    dispose()

    expect(visual.registrations).toEqual([])
    expect(varOf('--maid-vv-height')).toBe('')
    expect(varOf('--maid-vv-top')).toBe('')
    expect(document.documentElement.hasAttribute('data-maid-keyboard')).toBe(false)
  })

  it('stops updating once disposed', async () => {
    const visual = installVisualViewport({ height: 844, offsetTop: 0, scale: 1 })
    mountComposerCard(438)
    const dispose = install()
    await flush()
    dispose()

    visual.set({ height: 404 })
    await flush()

    expect(document.documentElement.hasAttribute('data-maid-keyboard')).toBe(false)
    expect(varOf('--maid-vv-height')).toBe('')
  })
})
