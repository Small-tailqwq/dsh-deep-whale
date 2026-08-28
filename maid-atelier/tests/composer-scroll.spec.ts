// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidComposerScroll } from '../src/client/composer-scroll.ts'

const SCROLLPORT_HEIGHT = 300
const SCROLLPORT_CONTENT_HEIGHT = 800
const SWITCH = 'data-maid-composer-mode'

interface Fixture {
  root: HTMLElement
  scrollport: HTMLElement
  seat: HTMLElement
  textarea: HTMLTextAreaElement
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

function mount(mode: string = 'scroll'): Fixture {
  const root = document.createElement('div')
  root.dataset.phase = 'active'
  const scrollport = document.createElement('div')
  scrollport.dataset.conversationScroll = ''
  Object.defineProperties(scrollport, {
    clientHeight: { configurable: true, value: SCROLLPORT_HEIGHT },
    scrollHeight: { configurable: true, value: SCROLLPORT_CONTENT_HEIGHT },
  })
  const flow = document.createElement('div')
  flow.dataset.chatFlow = ''
  const seat = document.createElement('div')
  seat.dataset.composerSeat = ''
  const textarea = document.createElement('textarea')
  seat.append(textarea)
  scrollport.append(flow, seat)
  root.append(scrollport)
  document.body.append(root)
  document.documentElement.setAttribute(SWITCH, mode)
  return { root, scrollport, seat, textarea, dispose: installMaidComposerScroll(document.body) }
}

/** Seat 内挂一个溢出的草稿滚动盒（宿主 InputBar 的 capped `.scroll`）。 */
function mountWithDraft(mode: string = 'scroll'): Fixture & { draft: HTMLElement } {
  const fixture = mount(mode)
  const draft = overflowBox(300, 700)
  fixture.textarea.remove()
  draft.append(fixture.textarea)
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
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(SWITCH)
})

afterEach(() => {
  document.documentElement.removeAttribute(SWITCH)
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

  it('steers by wheel direction and ignores micro-wheel deltas', () => {
    const { scrollport, seat, dispose } = mount()
    wheel(scrollport, -120)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    wheel(scrollport, 120)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    wheel(scrollport, 6)
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
    const { scrollport, seat, textarea, dispose } = mount()
    scrollTo(scrollport, 400)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    textarea.focus()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(true)

    textarea.blur()
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-interactive')).toBe(false)
    dispose()
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
    const { scrollport, seat, textarea, dispose } = mountWithDraft()
    scrollTo(scrollport, 400) // baseline

    // draft scroller at its edge; the host forwards the delta to the transcript
    textarea.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    scrollTo(scrollport, 280) // forwarded transcript scroll within the gesture window
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('the draft gesture window also covers touchpad inertia tails', () => {
    const { scrollport, seat, textarea, dispose } = mountWithDraft()
    scrollTo(scrollport, 400)

    textarea.dispatchEvent(new WheelEvent('wheel', { deltaY: -6, bubbles: true }))
    scrollTo(scrollport, 280)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('transcript scrolling steers the seat again once the draft gesture window closes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    try {
      const { scrollport, seat, textarea, dispose } = mountWithDraft()
      scrollTo(scrollport, 400)

      textarea.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
      vi.advanceTimersByTime(250)
      scrollTo(scrollport, 260) // a real upward transcript scroll, no gesture in flight
      expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)
      dispose()
    } finally {
      vi.useRealTimers()
    }
  })

  it('wheel on a short draft (no overflow) still steers by direction', () => {
    const { scrollport, seat, textarea, dispose } = mount()
    scrollTo(scrollport, 400)

    textarea.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    textarea.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
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
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    disposeNewer()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
  })
})
