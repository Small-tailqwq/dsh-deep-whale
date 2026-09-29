// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installOrcaSceneFit } from '../src/client/scene-fit.ts'

const CLIP_PROPERTY = '--orca-scene-clip-right'
const CLIPPED_ATTRIBUTE = 'data-orca-scene-clipped'

let frames: FrameRequestCallback[]
let relocations: Array<() => void>
let observed: Set<Element>

/** jsdom reports 1024 for every viewport; the controller reads it per measure. */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

/** The column is measured, so hand it the frame box a panel would leave. */
function setColumnBox(column: HTMLElement, right: number): void {
  vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
    right,
    left: 0,
    width: right,
    top: 0,
    bottom: 900,
    height: 900,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

function mount(innerWidth: number, columnRight: number): { column: HTMLElement, dispose: () => void } {
  document.body.innerHTML = '<div class="fixture_centerCol"></div>'
  const column = document.querySelector<HTMLElement>('.fixture_centerCol')!
  setViewportWidth(innerWidth)
  setColumnBox(column, columnRight)
  return { column, dispose: installOrcaSceneFit(document.body) }
}

/** Run the pending animation frame, i.e. one measurement. */
function flush(): void {
  const pending = frames
  frames = []
  for (const callback of pending) callback(0)
}

const clip = (): string => document.body.style.getPropertyValue(CLIP_PROPERTY)
const clipped = (): boolean => document.body.hasAttribute(CLIPPED_ATTRIBUTE)

beforeEach(() => {
  frames = []
  relocations = []
  observed = new Set()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('setInterval', (callback: () => void) => {
    relocations.push(callback)
    return relocations.length
  })
  vi.stubGlobal('clearInterval', () => {})
  vi.stubGlobal('ResizeObserver', class {
    observe(target: Element): void { observed.add(target) }
    unobserve(target: Element): void { observed.delete(target) }
    disconnect(): void { observed.clear() }
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.body.removeAttribute(CLIPPED_ATTRIBUTE)
  document.body.style.removeProperty(CLIP_PROPERTY)
})

describe('ORCA LINK scene fit', () => {
  it('frames the scene on the conversation column instead of the window', () => {
    const { column, dispose } = mount(1600, 1200)
    try {
      expect(observed.has(column)).toBe(true)
      flush()
      expect(clip()).toBe('400px')
      expect(clipped()).toBe(true)
    } finally {
      dispose()
    }
  })

  it('leaves the scene window-wide while nothing reserves the right edge', () => {
    const { dispose } = mount(1600, 1600)
    try {
      flush()
      expect(clip()).toBe('0px')
      expect(clipped()).toBe(false)
    } finally {
      dispose()
    }
  })

  it('does not treat the column scrollbar gutter as a panel', () => {
    const { dispose } = mount(1600, 1592)
    try {
      flush()
      expect(clip()).toBe('8px')
      expect(clipped()).toBe(false)
    } finally {
      dispose()
    }
  })

  it('holds the marker while a panel is dragged shut', () => {
    const { column, dispose } = mount(1600, 1200)
    try {
      flush()
      expect(clipped()).toBe(true)

      // A reserve on its way down keeps the right-side crop until it is gone.
      setColumnBox(column, 1588)
      window.dispatchEvent(new Event('resize'))
      flush()
      expect(clip()).toBe('12px')
      expect(clipped()).toBe(true)

      setColumnBox(column, 1596)
      window.dispatchEvent(new Event('resize'))
      flush()
      expect(clip()).toBe('4px')
      expect(clipped()).toBe(false)
    } finally {
      dispose()
    }
  })

  it('follows a replaced conversation column', () => {
    const { dispose } = mount(1600, 1600)
    try {
      flush()
      expect(clipped()).toBe(false)

      // The host swaps the column on navigation; the retry has to re-locate it.
      document.body.innerHTML = '<div class="fixture_centerCol"></div>'
      const replacement = document.querySelector<HTMLElement>('.fixture_centerCol')!
      setColumnBox(replacement, 1100)
      for (const relocate of relocations) relocate()
      flush()

      expect(observed.has(replacement)).toBe(true)
      expect(clip()).toBe('500px')
      expect(clipped()).toBe(true)
    } finally {
      dispose()
    }
  })

  it('measures nothing while the column is absent', () => {
    document.body.innerHTML = '<div></div>'
    setViewportWidth(1600)
    const dispose = installOrcaSceneFit(document.body)
    try {
      flush()
      expect(clip()).toBe('0px')
      expect(clipped()).toBe(false)
    } finally {
      dispose()
    }
  })

  it('restores the value it found and drops the marker on dispose', () => {
    document.body.style.setProperty(CLIP_PROPERTY, '42px')
    const { dispose } = mount(1600, 1200)
    flush()
    expect(clip()).toBe('400px')

    dispose()
    expect(clip()).toBe('42px')
    expect(clipped()).toBe(false)
    expect(observed.size).toBe(0)
  })
})
