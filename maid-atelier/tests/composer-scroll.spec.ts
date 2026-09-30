// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidComposerScroll } from '../src/client/composer-scroll.ts'

const SCROLLPORT_HEIGHT = 300
const SCROLLPORT_CONTENT_HEIGHT = 800
const SWITCH = 'data-maid-composer-mode'
const BOTTOM_SWITCH = 'data-maid-composer-bottom-only'

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
  Object.defineProperties(scrollport, {
    clientHeight: { configurable: true, value: SCROLLPORT_HEIGHT },
    scrollHeight: { configurable: true, value: SCROLLPORT_CONTENT_HEIGHT },
  })
  const flow = document.createElement('div')
  flow.dataset.chatFlow = ''
  const seat = document.createElement('div')
  seat.dataset.composerSeat = ''
  const input = document.createElement('div')
  input.dataset.composerInput = ''
  input.setAttribute('contenteditable', 'true')
  seat.append(input)
  scrollport.append(flow, seat)
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
function mountWithDraft(mode: string = 'scroll'): Fixture & { draft: HTMLElement } {
  const fixture = mount(mode)
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
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(SWITCH)
  document.documentElement.removeAttribute(BOTTOM_SWITCH)
})

afterEach(() => {
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

  it('wheel on a short draft (no overflow) still steers by direction', () => {
    const { scrollport, seat, input, dispose } = mount()
    scrollTo(scrollport, 400)

    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    input.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
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

describe('maid composer bottom-only', () => {
  it('hides the seat while the host renders its back-to-bottom control and shows it again at the tail', () => {
    const { scrollport, seat, dispose } = mount('persistent', true)
    const toBottom = mountToBottomButton(scrollport)

    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    toBottom.remove()
    scrollTo(scrollport, 180)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('takes over the scroll mode: direction no longer drives the seat', () => {
    const { scrollport, seat, dispose } = mount('scroll', true)
    mountToBottomButton(scrollport)

    scrollTo(scrollport, 200) // 上滚回顾：位置在最新消息之外
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, 350) // 下滚但尚未回到末尾：不再渐现
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    scrollTo(scrollport, SCROLLPORT_CONTENT_HEIGHT - SCROLLPORT_HEIGHT)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
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

  it('hides the seat when the control mounts after the scroll event (middle-click autoscroll)', async () => {
    const { scrollport, seat, dispose } = mount('persistent', true)
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)

    // 宿主在上一次滚动事件之后才提交控件：此后再没有滚动事件可以依赖。
    mountToBottomButton(scrollport)
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(true)

    // 回到尾部时控件被卸载，同样立即恢复。
    scrollport.querySelector<HTMLElement>('button')!.remove()
    await nextMicrotask()
    expect(seat.hasAttribute('data-maid-composer-hidden')).toBe(false)
    dispose()
  })

  it('releases the observer of a replaced conversation once the next one binds', () => {
    const observed = new Map<Node, MutationObserver>()
    const observe = vi.spyOn(MutationObserver.prototype, 'observe').mockImplementation(function (this: MutationObserver, target: Node) {
      observed.set(target, this)
    })
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
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
      Object.defineProperties(nextScrollport, {
        clientHeight: { configurable: true, value: SCROLLPORT_HEIGHT },
        scrollHeight: { configurable: true, value: SCROLLPORT_CONTENT_HEIGHT },
      })
      scrollTo(nextScrollport, 200)

      expect(observed.get(nextScrollport)).toBeDefined()
      expect(disconnect.mock.contexts).toContain(firstObserver)
      first.dispose()
    } finally {
      observe.mockRestore()
      disconnect.mockRestore()
    }
  })

  it('disconnects the transcript observers when bottom-only mode turns off', async () => {
    const observed = new Map<Node, MutationObserver>()
    const observe = vi.spyOn(MutationObserver.prototype, 'observe')
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    try {
      const { scrollport, dispose } = mount('persistent', true)
      scrollTo(scrollport, 200)
      observe.mock.calls.forEach(([target], i) => { observed.set(target, observe.mock.contexts[i] as MutationObserver) })
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
    Object.defineProperties(nextScrollport, {
      clientHeight: { configurable: true, value: SCROLLPORT_HEIGHT },
      scrollHeight: { configurable: true, value: SCROLLPORT_CONTENT_HEIGHT },
    })
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
