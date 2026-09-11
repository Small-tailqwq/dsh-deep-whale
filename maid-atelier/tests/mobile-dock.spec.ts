// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installMaidMobileDock } from '../src/client/mobile-dock.ts'

/** jsdom reports 1024x768 for every window. */
function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

function box(top: number, height = 140, left = 16, width = 358): DOMRect {
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

/** jsdom ships no ResizeObserver either; keep the instances addressable. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  readonly targets = new Set<Element>()

  constructor(readonly callback: () => void) {
    FakeResizeObserver.instances.push(this)
  }

  observe(target: Element): void { this.targets.add(target) }
  unobserve(target: Element): void { this.targets.delete(target) }
  disconnect(): void { this.targets.clear() }
  fire(): void { this.callback() }
}

/** The composer's card, positioned where a phone would put it. */
function mountComposerCard(top: number, height = 140): HTMLElement {
  const card = document.createElement('div')
  card.setAttribute('data-composer-card', '')
  card.getBoundingClientRect = () => box(top, height)
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

let disposers: Array<() => void> = []

function install(): () => void {
  const dispose = installMaidMobileDock(document.body)
  disposers.push(dispose)
  return dispose
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  disposers = []
  FakeResizeObserver.instances = []
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: FakeResizeObserver })
  setViewport(390, 844)
})

afterEach(() => {
  for (const dispose of disposers) dispose()
  disposers = []
  Reflect.deleteProperty(globalThis, 'ResizeObserver')
  document.documentElement.removeAttribute('style')
})

describe('Maid Atelier phone dock geometry', () => {
  it('publishes the composer top edge as a bottom distance', async () => {
    mountComposerCard(438)
    install()
    await flush()

    // 844 (layout viewport) - 438 (composer top) + 10 (gap)
    expect(varOf('--maid-dock-offset')).toBe('416px')
  })

  it('follows a composer that grows past one line', async () => {
    const card = mountComposerCard(438)
    install()
    await flush()

    card.getBoundingClientRect = () => box(380, 198)
    window.dispatchEvent(new Event('resize'))
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('474px')
  })

  it('clears the distance when the composer is gone', async () => {
    const card = mountComposerCard(438)
    install()
    await flush()
    expect(varOf('--maid-dock-offset')).toBe('416px')

    card.remove()
    window.dispatchEvent(new Event('resize'))
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('')
  })

  it('falls back to the takeover card when a question replaces the composer', async () => {
    const frame = document.createElement('div')
    frame.setAttribute('data-question-key', 'k')
    const card = document.createElement('section')
    card.getBoundingClientRect = () => box(400, 300, 36, 318)
    frame.append(card)
    document.body.append(frame)
    install()
    await flush()

    // 844 - 400 + 10
    expect(varOf('--maid-dock-offset')).toBe('454px')
  })

  it('clears the hero phase workspace chip row above the input bar', async () => {
    const phase = document.createElement('div')
    phase.setAttribute('data-phase', 'hero')
    const card = document.createElement('div')
    card.setAttribute('data-composer-card', '')
    card.getBoundingClientRect = () => box(438)
    phase.append(card)
    document.body.append(phase)
    install()
    await flush()

    // 844 - 438 + 10 (gap) + 36 (28px chip row + its 8px gap)
    expect(varOf('--maid-dock-offset')).toBe('452px')
  })

  it('measures against the layout viewport, not a pinning shell', async () => {
    // A fixed box resolves against the layout viewport unless an ancestor
    // transforms it, so the keyboard's shorter visual viewport must not shift
    // the dock's `bottom`.
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: { height: 404, offsetTop: 12, scale: 1, width: 390, addEventListener: () => {}, removeEventListener: () => {} },
    })
    mountComposerCard(300)
    install()
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('554px')
  })

  it('watches the composer seat so a hero-to-conversation swap re-measures', async () => {
    const seat = document.createElement('div')
    seat.setAttribute('data-composer-seat', '')
    const card = mountComposerCard(438)
    seat.append(card)
    document.body.append(seat)
    install()
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('416px')
    const observer = FakeResizeObserver.instances.at(-1)
    expect(observer?.targets.has(seat)).toBe(true)

    // The shell swaps hero for an active conversation: the card moves to the
    // foot of the column while keeping its size, so only the seat reports it.
    card.getBoundingClientRect = () => box(660)
    observer?.fire()
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('194px')
  })

  it('leaves the desktop viewport without a dock distance', async () => {
    setViewport(1280, 900)
    mountComposerCard(720)
    install()
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('')
  })

  it('gives back the variable, the observer and the listeners on dispose', async () => {
    const seat = document.createElement('div')
    seat.setAttribute('data-composer-seat', '')
    const card = mountComposerCard(438)
    seat.append(card)
    document.body.append(seat)
    const dispose = install()
    await flush()

    expect(varOf('--maid-dock-offset')).not.toBe('')
    dispose()

    expect(varOf('--maid-dock-offset')).toBe('')
    expect(FakeResizeObserver.instances.at(-1)?.targets.size).toBe(0)
  })

  it('stops measuring once disposed', async () => {
    const card = mountComposerCard(438)
    const dispose = install()
    await flush()
    dispose()

    card.getBoundingClientRect = () => box(200)
    window.dispatchEvent(new Event('resize'))
    await flush()

    expect(varOf('--maid-dock-offset')).toBe('')
  })
})
