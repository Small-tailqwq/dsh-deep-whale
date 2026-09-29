// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidCharacterFit } from '../src/client/character-fit.ts'

/** The marker the stylesheet's crowded rules are scoped on. */
const CROWDED_ATTRIBUTE = 'data-maid-figures-crowded'

/** jsdom lays nothing out (every offset is 0), so hand each element its box. */
interface Box {
  left: number
  width: number
}

let frames: FrameRequestCallback[]
let cancelled: number[]
let notifications: ResizeObserverCallback | undefined
let observed: Set<Element>
let disconnected: boolean

interface Fixture {
  stage: HTMLElement
  stageBox: Box
  setGap: (gap: number) => void
  /** One box changed: the observer notifies, then the frame measures. */
  remeasure: () => void
  dispose: () => void
}

/** The boxes jsdom would report for a pair of maids that must stand apart. */
const LEFT_BOX: Box = { left: 24, width: 300 }
const RIGHT_BOX: Box = { left: 0, width: 280 }
const STAGE_BOX: Box = { left: 0, width: 900 }

/**
 * Mirror the stylesheet: both maids are absolutely positioned in the stage, so
 * they share an offset parent and every offset is relative to its padding edge.
 */
function setBox(element: HTMLElement, box: Box): void {
  Object.defineProperty(element, 'offsetLeft', { configurable: true, get: () => box.left })
  Object.defineProperty(element, 'offsetWidth', { configurable: true, get: () => box.width })
}

/**
 * Build the stage shape the installer reads — one stage holding the left and
 * right maids — and start the pair far enough apart to fit.
 */
function mount(): Fixture {
  const stage = document.createElement('div')
  stage.dataset.skinChrome = 'character-stage'
  const left = document.createElement('img')
  left.dataset.maidCharacter = 'left'
  const right = document.createElement('img')
  right.dataset.maidCharacter = 'right'
  stage.append(left, right)
  document.body.append(stage)
  setBox(stage, STAGE_BOX)
  setBox(left, LEFT_BOX)
  setBox(right, RIGHT_BOX)
  const setGap = (gap: number): void => {
    RIGHT_BOX.left = LEFT_BOX.left + LEFT_BOX.width + gap
  }
  setGap(240)
  const dispose = installMaidCharacterFit(stage)
  return {
    stage,
    stageBox: STAGE_BOX,
    setGap,
    remeasure: () => {
      notifications?.([], {} as ResizeObserver)
      const pending = frames
      frames = []
      for (const callback of pending) callback(0)
    },
    dispose,
  }
}

const crowded = (): boolean => document.body.hasAttribute(CROWDED_ATTRIBUTE)

beforeEach(() => {
  frames = []
  cancelled = []
  notifications = undefined
  observed = new Set()
  disconnected = false
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => { cancelled.push(handle) })
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) {
      notifications = callback
    }

    observe(target: Element): void { observed.add(target) }
    unobserve(target: Element): void { observed.delete(target) }
    disconnect(): void { observed.clear(); disconnected = true }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.body.removeAttribute(CROWDED_ATTRIBUTE)
})

describe('maid character fit', () => {
  it('watches the stage and both maids, and starts a fitting pair unmarked', () => {
    const fixture = mount()
    try {
      // The column's width is the stage's, the maids' height is a percentage of
      // it, and the chat-active retreat changes that height again.
      expect(observed.has(fixture.stage)).toBe(true)
      expect(observed.size).toBe(3)
      fixture.remeasure()
      expect(crowded()).toBe(false)
    } finally {
      fixture.dispose()
    }
  })

  it('marks the body while the two maids no longer fit side by side', () => {
    const fixture = mount()
    try {
      fixture.setGap(-20)
      fixture.remeasure()
      expect(crowded()).toBe(true)

      fixture.setGap(240)
      fixture.remeasure()
      expect(crowded()).toBe(false)
    } finally {
      fixture.dispose()
    }
  })

  it('keeps the marker until the pair has real room again, so a dragged column cannot flicker', () => {
    const fixture = mount()
    try {
      fixture.setGap(-20)
      fixture.remeasure()
      expect(crowded()).toBe(true)

      // Past the crowded threshold, still inside the restore one.
      fixture.setGap(60)
      fixture.remeasure()
      expect(crowded()).toBe(true)

      fixture.setGap(120)
      fixture.remeasure()
      expect(crowded()).toBe(false)
    } finally {
      fixture.dispose()
    }
  })

  it('decides nothing while the stage is not laid out', () => {
    const fixture = mount()
    try {
      // A column that has not mounted yet, or was detached mid-render, reports
      // 0/0 for both maids: that is not a crowd.
      fixture.stage.remove()
      fixture.setGap(-20)
      fixture.remeasure()
      expect(crowded()).toBe(false)

      document.body.append(fixture.stage)
      fixture.stageBox.width = 0
      fixture.remeasure()
      expect(crowded()).toBe(false)

      fixture.stageBox.width = 900
      fixture.remeasure()
      expect(crowded()).toBe(true)
    } finally {
      fixture.dispose()
    }
  })

  it('retracts the marker, the pending frame and the observer on dispose', () => {
    const fixture = mount()
    try {
      fixture.setGap(-20)
      fixture.remeasure()
      expect(crowded()).toBe(true)

      // A measurement still in flight is cancelled, not run against a disposed
      // owner, and the marker goes with the observers.
      notifications?.([], {} as ResizeObserver)
      fixture.dispose()
      expect(cancelled).toHaveLength(1)
      expect(crowded()).toBe(false)
      expect(disconnected).toBe(true)
      expect(observed.size).toBe(0)
    } finally {
      fixture.dispose()
    }
  })

  it('leaves a stage holding no maids completely alone', () => {
    const stage = document.createElement('div')
    stage.dataset.skinChrome = 'character-stage'
    document.body.append(stage)
    setBox(stage, STAGE_BOX)
    const dispose = installMaidCharacterFit(stage)
    try {
      expect(frames).toHaveLength(0)
      expect(observed.size).toBe(0)
      expect(crowded()).toBe(false)
    } finally {
      dispose()
    }
  })
})
