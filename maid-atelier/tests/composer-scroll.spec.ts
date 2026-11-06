// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidComposerScroll } from '../src/client/composer-scroll.ts'

const SCROLLPORT_HEIGHT = 300
const SCROLLPORT_CONTENT_HEIGHT = 800
const SWITCH = 'data-maid-composer-mode'
const BOTTOM_SWITCH = 'data-maid-composer-bottom-only'
// Mirrors the module's settle window and max wait for geometry reads.
const GEOMETRY_SETTLE_MS = 120
const GEOMETRY_MAX_WAIT_MS = 500

const resizeObservers: FixtureResizeObserver[] = []
class FixtureResizeObserver {
  readonly targets = new Set<Element>()
  constructor(private readonly callback: ResizeObserverCallback) { resizeObservers.push(this) }
  observe(target: Element): void { this.targets.add(target) }
  disconnect(): void { this.targets.clear() }
  notify(): void { this.callback([], this as unknown as ResizeObserver) }
}

function resize(target: Element): void {
  resizeObservers.filter(observer => observer.targets.has(target)).forEach(observer => { observer.notify() })
}

function defineGeometry(scrollport: HTMLElement): void {
  Object.defineProperties(scrollport, {
    clientHeight: { configurable: true, value: SCROLLPORT_HEIGHT },
    scrollHeight: { configurable: true, value: SCROLLPORT_CONTENT_HEIGHT },
  })
  scrollport.getBoundingClientRect = () => DOMRect.fromRect({ height: SCROLLPORT_HEIGHT })
  const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
  flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 650 - scrollport.scrollTop })
}

interface Fixture {
  root: HTMLElement
  scrollport: HTMLElement
  seat: HTMLElement
  input: HTMLElement
  dispose: () => void
}

function overflowBox(height: number, contentHeight: number): HTMLElement {
  const box = document.createElement('div')
  box.style.overflowY = 'auto'
  Object.defineProperties(box, {
    clientHeight: { configurable: true, value: height },
    scrollHeight: { configurable: true, value: contentHeight },
  })
  return box
}

function mount(mode: string = 'scroll', bottomOnly = false): Fixture {
  const root = document.createElement('div')
  root.dataset.phase = 'active'
  const scrollport = document.createElement('div')
  scrollport.dataset.conversationScroll = ''
  const phaseBody = document.createElement('div')
  const flow = document.createElement('div')
  flow.dataset.chatFlow = ''
  const seat = document.createElement('div')
  seat.dataset.composerSeat = ''
  const input = document.createElement('div')
  input.dataset.composerInput = ''
  input.setAttribute('contenteditable', 'true')
  seat.append(input)
  scrollport.append(flow, seat)
  defineGeometry(scrollport)
  scrollport.scrollTop = SCROLLPORT_CONTENT_HEIGHT - SCROLLPORT_HEIGHT
  phaseBody.append(scrollport)
  root.append(phaseBody)
  document.body.append(root)
  document.documentElement.setAttribute(SWITCH, mode)
  if (bottomOnly) document.documentElement.setAttribute(BOTTOM_SWITCH, 'on')
  return { root, scrollport, seat, input, dispose: installMaidComposerScroll(document.body) }
}

/** 宿主 ui-chat 的「回到底部」控件：只在 reader 离开最新消息时渲染。 */
function mountToBottomButton(scrollport: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.className = 'EvIC1a_toBottom'
  scrollport.append(button)
  return button
}

/** Seat 内挂一个溢出的草稿滚动盒（宿主 InputBar 的 capped `.scroll`）。 */
function mountWithDraft(mode: string = 'scroll', bottomOnly = false): Fixture & { draft: HTMLElement } {
  const fixture = mount(mode, bottomOnly)
  const draft = overflowBox(300, 700)
  fixture.input.remove()
  draft.append(fixture.input)
  fixture.seat.append(draft)
  return { ...fixture, draft }
}

function scrollTo(scrollport: HTMLElement, top: number): void {
  scrollport.scrollTop = top
  scrollport.dispatchEvent(new Event('scroll'))
}

function wheel(scrollport: HTMLElement, deltaY: number): void {
  scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true }))
}

function nextMicrotask(): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, 0) })
}

beforeEach(() => {
  resizeObservers.length = 0
  vi.stubGlobal('ResizeObserver', FixtureResizeObserver)
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(SWITCH)
  document.documentElement.removeAttribute(BOTTOM_SWITCH)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute(SWITCH)
  document.documentElement.removeAttribute(BOTTOM_SWITCH)
})

describe('maid composer scroll-intent', () => {
  it('fades the seat out when scrolling up and back in when scrolling down', () => {
    const { scrollport, seat, dispose } = mount()
    scrollTo(scrollport, 400) // baseline
    scrollTo(scrollport, 200) // scroll up past the threshold
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, 320) // scroll down past the threshold
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('always shows the seat when reaching the bottom', () => {
    const { scrollport, seat, dispose } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, SCROLLPORT_CONTENT_HEIGHT - SCROLLPORT_HEIGHT - 8) // distanceToBottom <= 24
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('keeps a long ask visible until the transcript tail leaves the viewport', () => {
    const { scrollport, seat, dispose } = mount()
    const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
    // A 400px ask reserves room below a 400px transcript.
    flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 400 - scrollport.scrollTop })
    wheel(scrollport, -120)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    scrollTo(scrollport, 380)
    scrollTo(scrollport, 260)
    scrollTo(scrollport, 100)
    scrollTo(scrollport, 80) // Tail is 20px below the viewport: retain visibility.
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    scrollTo(scrollport, 75)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    scrollTo(scrollport, 76) // Actual downward movement restores scroll mode.
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('stays inert when the switch is off and clears state on flipping it off', async () => {
    const { scrollport, seat, dispose } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    document.documentElement.setAttribute(SWITCH, 'persistent')
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    scrollTo(scrollport, 150)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('does not run on a non-scroll mode from the start', () => {
    const { scrollport, seat, dispose } = mount('persistent')
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('focusing the composer brings it back and marks it interactive', async () => {
    const { scrollport, seat, input, dispose } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    input.focus()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(true)

    input.blur()
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(false)
    dispose()
  })

  it.each([false, true])('keeps a quoted draft visible until a transcript click (bottom-only: %s)', async (bottomOnly) => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    const { scrollport, seat, input, dispose } = mount('scroll', bottomOnly)
    try {
      scrollTo(scrollport, 400)
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      input.focus()
      input.innerHTML = '<p><span data-composer-quote contenteditable="false">Quoted reply</span> </p>'
      await nextMicrotask()
      clock.mockReturnValue(10_000)
      scrollTo(scrollport, 199)
      input.append(document.createTextNode('A longer draft\nwith another line'))
      resize(seat)
      scrollTo(scrollport, 100)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
      expect(document.activeElement).toBe(input)

      scrollport.querySelector('[data-chat-flow]')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      scrollTo(scrollport, 90)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      expect(document.activeElement).not.toBe(input)
    } finally {
      dispose()
      clock.mockRestore()
    }
  })

  it.each(['pointerdown', 'beforeinput', 'input', 'compositionstart'])('protects deliberate %s until focus leaves the seat', async (type) => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
    const { scrollport, seat, input, dispose } = mount()
    try {
      scrollTo(scrollport, 400)
      input.focus()
      clock.mockReturnValue(3000)
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

      input.focus()
      input.dispatchEvent(type === 'pointerdown' ? new MouseEvent(type, { bubbles: true }) : new Event(type, { bubbles: true }))
      clock.mockReturnValue(10_000)
      scrollTo(scrollport, 100)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
      expect(document.activeElement).toBe(input)
      input.blur()
      await nextMicrotask()
      scrollTo(scrollport, 90)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    } finally {
      dispose()
      clock.mockRestore()
    }
  })

  // #201: the soft keyboard a focus raises scrolls the transcript; reading that
  // as an upward scroll hid and blurred the composer, dropping the keyboard.
  it('a scroll the keyboard causes after focusing the composer neither hides nor blurs it', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    try {
      const { scrollport, seat, input, dispose } = mount()
      scrollTo(scrollport, 400)
      input.focus()
      vi.advanceTimersByTime(300)
      scrollTo(scrollport, 200)
      // The keyboard is still animating: every viewport resize extends the window.
      window.dispatchEvent(new Event('resize'))
      vi.advanceTimersByTime(700)
      scrollTo(scrollport, 150)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
      expect(document.activeElement).toBe(input)

      vi.advanceTimersByTime(900)
      scrollTo(scrollport, 100) // the reader scrolls back through history
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      dispose()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores scrollports outside an active conversation root', () => {
    const { root, scrollport, seat, dispose } = mount()
    root.dataset.phase = 'hero'
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    root.dataset.phase = 'active'
    root.querySelector('[data-chat-flow]')!.remove()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('dispose removes every owned seat state', () => {
    const { scrollport, seat, dispose } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    dispose()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(false)
  })

  it('wheeling a long draft at its edge never hides the seat', () => {
    const { scrollport, seat, input, dispose } = mountWithDraft()
    scrollTo(scrollport, 400) // baseline

    // draft scroller at its edge; the host forwards the delta to the transcript
    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    scrollTo(scrollport, 280) // forwarded transcript scroll within the gesture window
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('the draft gesture window also covers touchpad inertia tails', () => {
    const { scrollport, seat, input, dispose } = mountWithDraft()
    scrollTo(scrollport, 400)

    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -6, bubbles: true }))
    scrollTo(scrollport, 280)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('transcript scrolling steers the seat again once the draft gesture window closes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    try {
      const { scrollport, seat, input, dispose } = mountWithDraft()
      scrollTo(scrollport, 400)

      input.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
      vi.advanceTimersByTime(250)
      scrollTo(scrollport, 260) // a real upward transcript scroll, no gesture in flight
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      dispose()
    } finally {
      vi.useRealTimers()
    }
  })

  it('wheel on a short draft follows actual transcript movement', () => {
    const { scrollport, seat, input, dispose } = mount()
    scrollTo(scrollport, 400)

    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    scrollTo(scrollport, 280)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    input.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
    scrollTo(scrollport, 400)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('older disposal cannot clear state owned by a repeated activation', () => {
    const { scrollport, seat, dispose: disposeOlder } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    const disposeNewer = installMaidComposerScroll(document.body)
    disposeOlder()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    wheel(scrollport, 120)
    scrollTo(scrollport, 320)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    disposeNewer()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
  })
})

describe('maid composer bottom-only', () => {
  it('uses the transcript tail independently of the back-to-bottom control', () => {
    const { scrollport, seat, dispose } = mount('persistent', true)
    const toBottom = mountToBottomButton(scrollport)

    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    toBottom.remove()
    scrollTo(scrollport, 180)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    scrollTo(scrollport, 350)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('takes over the scroll mode: direction no longer drives the seat', () => {
    const { scrollport, seat, dispose } = mount('scroll', true)
    mountToBottomButton(scrollport)

    scrollTo(scrollport, 200) // 上滚回顾：位置在最新消息之外
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, 300) // 下滚但正文末尾尚未回到视口：不再渐现
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, SCROLLPORT_CONTENT_HEIGHT - SCROLLPORT_HEIGHT)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('settles a forwarded draft scroll by position inside the gesture window', () => {
    const { scrollport, seat, input, dispose } = mountWithDraft('scroll', true)
    scrollTo(scrollport, SCROLLPORT_CONTENT_HEIGHT - SCROLLPORT_HEIGHT)

    // draft scroller at its edge; the host forwards the delta to the transcript
    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    scrollTo(scrollport, 200) // the transcript tail leaves the viewport
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    dispose()
  })

  it('aligns the seat the moment the switch flips, both ways', async () => {
    const { scrollport, seat, dispose } = mount('persistent')
    mountToBottomButton(scrollport)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    document.documentElement.setAttribute(BOTTOM_SWITCH, 'on')
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    document.documentElement.setAttribute(BOTTOM_SWITCH, 'off')
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('reconciles an ask height change without another scroll event', () => {
    vi.useFakeTimers()
    try {
      const { scrollport, seat, dispose } = mount('persistent', true)
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

      const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
      flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 290 })
      resize(seat)
      vi.advanceTimersByTime(GEOMETRY_SETTLE_MS)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

      flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 325 })
      resize(seat)
      vi.advanceTimersByTime(GEOMETRY_SETTLE_MS)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 310 })
      resize(seat)
      vi.advanceTimersByTime(GEOMETRY_SETTLE_MS)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      dispose()
      flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 325 })
      resize(seat)
      vi.advanceTimersByTime(GEOMETRY_SETTLE_MS)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('reads geometry once a resize burst settles, never inside the delivery', () => {
    vi.useFakeTimers()
    try {
      const { scrollport, seat, dispose } = mount('persistent', true)
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

      const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
      const reads = vi.fn(() => DOMRect.fromRect({ height: 290 }))
      flow.getBoundingClientRect = reads
      // A width drag: one delivery per frame, each touching all three owners.
      for (let frame = 0; frame < 6; frame++) {
        resize(seat)
        resize(scrollport)
        resize(flow)
        // Host observers in the same delivery may have dirtied style: no read.
        expect(reads).not.toHaveBeenCalled()
        vi.advanceTimersByTime(16)
      }
      expect(reads).not.toHaveBeenCalled()
      vi.advanceTimersByTime(GEOMETRY_SETTLE_MS)
      expect(reads).toHaveBeenCalledTimes(1)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

      const late = vi.fn(() => DOMRect.fromRect({ height: 325 }))
      flow.getBoundingClientRect = late
      resize(seat)
      dispose()
      vi.advanceTimersByTime(GEOMETRY_MAX_WAIT_MS)
      // Disposal cancels the queued read along with the observers.
      expect(late).not.toHaveBeenCalled()
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('still reads within the max wait while the layout keeps moving', () => {
    vi.useFakeTimers()
    try {
      const { scrollport, seat, dispose } = mount('persistent', true)
      scrollTo(scrollport, 200)
      const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
      const reads = vi.fn(() => DOMRect.fromRect({ height: 290 }))
      flow.getBoundingClientRect = reads
      // A streamed reply grows the flow faster than the settle window.
      for (let elapsed = 0; elapsed < GEOMETRY_MAX_WAIT_MS; elapsed += 50) {
        resize(flow)
        vi.advanceTimersByTime(50)
      }
      expect(reads).toHaveBeenCalledTimes(1)
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
      dispose()
    } finally {
      vi.useRealTimers()
    }
  })

  it('releases the observer of a replaced conversation once the next one binds', () => {
    const observed = new Map<Element, FixtureResizeObserver>()
    const observe = vi.spyOn(FixtureResizeObserver.prototype, 'observe').mockImplementation(function (this: FixtureResizeObserver, target: Element) {
      observed.set(target, this)
    })
    const disconnect = vi.spyOn(FixtureResizeObserver.prototype, 'disconnect')
    try {
      const first = mount('persistent', true)
      scrollTo(first.scrollport, 200)
      const firstObserver = observed.get(first.scrollport)
      expect(firstObserver).toBeDefined()

      // A conversation switch replaces the whole phase root and its scrollport.
      first.root.remove()
      const next = first.root.cloneNode(true) as HTMLElement
      document.body.append(next)
      const nextScrollport = next.querySelector<HTMLElement>('[data-conversation-scroll]')!
      defineGeometry(nextScrollport)
      scrollTo(nextScrollport, 200)

      expect(observed.get(nextScrollport)).toBeDefined()
      expect(disconnect.mock.contexts).toContain(firstObserver)
      first.dispose()
    } finally {
      observe.mockRestore()
      disconnect.mockRestore()
    }
  })

  it('disconnects the geometry observers when visibility modes turn off', async () => {
    const observed = new Map<Element, FixtureResizeObserver>()
    const observe = vi.spyOn(FixtureResizeObserver.prototype, 'observe')
    const disconnect = vi.spyOn(FixtureResizeObserver.prototype, 'disconnect')
    try {
      const { scrollport, dispose } = mount('persistent', true)
      scrollTo(scrollport, 200)
      observe.mock.calls.forEach(([target], i) => { observed.set(target, observe.mock.contexts[i] as FixtureResizeObserver) })
      const transcriptObserver = observed.get(scrollport)
      expect(transcriptObserver).toBeDefined()

      document.documentElement.setAttribute(BOTTOM_SWITCH, 'off')
      await nextMicrotask()
      expect(disconnect.mock.contexts).toContain(transcriptObserver)
      dispose()
    } finally {
      observe.mockRestore()
      disconnect.mockRestore()
    }
  })

  it('forgets the seat of a replaced conversation instead of holding its tree', () => {
    const first = mount('persistent', true)
    mountToBottomButton(first.scrollport)
    scrollTo(first.scrollport, 200)
    expect(first.seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    first.root.remove()
    const next = first.root.cloneNode(true) as HTMLElement
    next.querySelector('[data-composer-seat]')!.removeAttribute('data-maid-composer-hidden')
    document.body.append(next)
    const nextScrollport = next.querySelector<HTMLElement>('[data-conversation-scroll]')!
    defineGeometry(nextScrollport)
    scrollTo(nextScrollport, 200)

    // Only a remembered seat is restored on dispose; the detached one was dropped.
    first.dispose()
    expect(first.seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
    expect(next.querySelector('[data-composer-seat]')!.hasAttribute('data-maid-composer-hidden')).toBe(false)
  })

  it('dispose clears the bottom-only seat state', () => {
    const { scrollport, seat, dispose } = mount('persistent', true)
    mountToBottomButton(scrollport)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    dispose()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
  })
})
