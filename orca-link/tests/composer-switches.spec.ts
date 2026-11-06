// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installOrcaComposerCollapse } from '../src/client/composer-collapse.ts'
import { installOrcaComposerDismiss } from '../src/client/composer-dismiss.ts'
import { installOrcaComposerMotion } from '../src/client/composer-motion.ts'

const SCROLL_HIDE = 'data-dsh-whale-orca-composer-scroll-hide'
const BOTTOM_ONLY = 'data-dsh-whale-orca-composer-bottom-only'
const HANDLES = 'data-dsh-whale-orca-composer-handles'

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

function scrollTo(scrollport: HTMLElement, top: number): void {
  scrollport.scrollTop = top
  scrollport.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  resizeObservers.length = 0
  vi.stubGlobal('ResizeObserver', FixtureResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(SCROLL_HIDE)
  document.documentElement.removeAttribute(BOTTOM_ONLY)
  document.documentElement.removeAttribute(HANDLES)
})

function mountConversation(): { scrollport: HTMLElement, seat: HTMLElement } {
  document.body.innerHTML = `
    <div data-phase="active">
      <div data-conversation-scroll>
        <div data-chat-flow></div>
        <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
      </div>
    </div>
  `
  const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
  defineScrollGeometry(scrollport, 300, 800)
  scrollport.scrollTop = 500
  return {
    scrollport,
    seat: document.querySelector<HTMLElement>('[data-composer-seat]')!,
  }
}

/** jsdom 不做布局：手工给出滚动几何，供置底判定使用。 */
function defineScrollGeometry(scrollport: HTMLElement, height: number, contentHeight: number): void {
  Object.defineProperties(scrollport, {
    clientHeight: { configurable: true, value: height },
    scrollHeight: { configurable: true, value: contentHeight },
  })
  scrollport.getBoundingClientRect = () => DOMRect.fromRect({ height })
  scrollport.querySelector<HTMLElement>('[data-chat-flow]')!.getBoundingClientRect =
    () => DOMRect.fromRect({ height: contentHeight - 150 - scrollport.scrollTop })
}

/** 宿主 ui-chat 的「回到底部」控件：只在 reader 离开最新消息时渲染。 */
function mountToBottomButton(scrollport: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.className = 'EvIC1a_toBottom'
  scrollport.append(button)
  return button
}

const flush = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 0) })

describe('ORCA LINK composer switches', () => {
  it.each(['scroll', 'manual'])('closes dock dialogs when the composer hides via %s', async (mode) => {
    const { scrollport, seat } = mountConversation()
    const dock = document.createElement('div')
    dock.dataset.composerDock = ''
    dock.innerHTML = `<span data-slot="conversation.composer.dock"><span data-composer-stat="usage"><button aria-expanded="true" aria-haspopup="dialog"></button></span></span><span><button aria-expanded="true" aria-haspopup="dialog"></button></span>`
    seat.append(dock)
    const toggles = [...dock.querySelectorAll('button')].map(button => {
      const toggle = vi.fn(() => button.setAttribute('aria-expanded', 'false'))
      button.addEventListener('click', toggle)
      return toggle
    })
    const disposeDismiss = installOrcaComposerDismiss(document.body)
    const disposeMotion = installOrcaComposerMotion(document.body)
    const disposeCollapse = installOrcaComposerCollapse(document.body)
    const disposeSecond = installOrcaComposerDismiss(document.body)
    disposeDismiss()
    if (mode === 'scroll') {
      scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
      scrollTo(scrollport, 460)
      scrollTo(scrollport, 300)
    } else {
      document.querySelector('[data-orca-composer-handle]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    }
    await flush()
    toggles.forEach(toggle => { expect(toggle).toHaveBeenCalledTimes(1) })
    expect([...dock.querySelectorAll('button')].every(button => button.getAttribute('aria-expanded') === 'false')).toBe(true)
    disposeSecond()
    disposeSecond()
    disposeCollapse()
    disposeMotion()
    await flush()
    dock.querySelectorAll('button').forEach(button => button.setAttribute('aria-expanded', 'true'))
    seat.setAttribute('data-orca-composer-hidden', '')
    await flush()
    toggles.forEach(toggle => { expect(toggle).toHaveBeenCalledTimes(1) })
  })

  it('only tucks the composer away on scroll-up while scroll-hide is on', async () => {
    const { scrollport, seat } = mountConversation()
    const dispose = installOrcaComposerMotion(document.body)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    scrollTo(scrollport, 460)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    scrollTo(scrollport, 300)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    // Switching off releases the seat the last gesture hid...
    document.documentElement.setAttribute(SCROLL_HIDE, 'off')
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    // ...and later scroll-up gestures leave it alone.
    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    scrollTo(scrollport, 260)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    document.documentElement.setAttribute(SCROLL_HIDE, 'on')
    await flush()
    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    scrollTo(scrollport, 200)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    dispose()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
  })

  it('mounts drag handles only while the handles switch is on', async () => {
    mountConversation()
    const dispose = installOrcaComposerCollapse(document.body)
    expect(document.querySelectorAll('[data-orca-composer-handle]')).toHaveLength(2)

    document.documentElement.setAttribute(HANDLES, 'off')
    await flush()
    expect(document.querySelectorAll('[data-orca-composer-handle]')).toHaveLength(0)

    document.documentElement.setAttribute(HANDLES, 'on')
    await flush()
    expect(document.querySelectorAll('[data-orca-composer-handle]')).toHaveLength(2)
    dispose()
    expect(document.querySelectorAll('[data-orca-composer-handle]')).toHaveLength(0)
  })

  it.each([false, true])('keeps a quoted draft visible until a transcript click (bottom-only: %s)', async (bottomOnly) => {
    if (bottomOnly) document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const { scrollport, seat } = mountConversation()
    const input = seat.querySelector<HTMLElement>('[data-composer-input]')!
    const dispose = installOrcaComposerMotion(document.body)
    try {
      scrollTo(scrollport, 400)
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
      input.innerHTML = '<p><span data-composer-quote contenteditable="false">Quoted reply</span> </p>'
      input.focus()
      await flush()
      scrollTo(scrollport, 199)
      input.append(document.createTextNode('A longer draft\nwith another line'))
      resize(seat)
      scrollTo(scrollport, 100)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
      expect(document.activeElement).toBe(input)

      scrollport.querySelector('[data-chat-flow]')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      scrollTo(scrollport, 90)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
      expect(document.activeElement).not.toBe(input)
    } finally {
      dispose()
    }
  })

  it.each(['pointerdown', 'beforeinput', 'input', 'compositionstart'])('protects deliberate %s until focus leaves the seat', async (type) => {
    const { scrollport, seat } = mountConversation()
    const input = seat.querySelector<HTMLElement>('[data-composer-input]')!
    const dispose = installOrcaComposerMotion(document.body)
    try {
      scrollTo(scrollport, 400)
      input.focus()
      scrollTo(scrollport, 200)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

      input.focus()
      input.dispatchEvent(type === 'pointerdown' ? new MouseEvent(type, { bubbles: true }) : new Event(type, { bubbles: true }))
      scrollTo(scrollport, 100)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
      expect(document.activeElement).toBe(input)
      input.blur()
      await flush()
      scrollTo(scrollport, 90)
      expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    } finally {
      dispose()
    }
  })

  it('releases a manually collapsed composer when the handles switch turns off', async () => {
    const { seat } = mountConversation()
    const dispose = installOrcaComposerCollapse(document.body)
    const handle = document.querySelector<HTMLButtonElement>('[data-orca-composer-handle]')!
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(true)
    expect(document.querySelector('[data-orca-composer-restore]')).not.toBeNull()

    document.documentElement.setAttribute(HANDLES, 'off')
    await flush()
    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(false)
    expect(seat.hasAttribute('inert')).toBe(false)
    expect(document.querySelector('[data-orca-composer-restore]')).toBeNull()
    dispose()
  })

  it('uses the transcript tail independently of the back-to-bottom control', () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const dispose = installOrcaComposerMotion(document.body)

    const toBottom = mountToBottomButton(scrollport)
    scrollport.scrollTop = 200
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    toBottom.remove()
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollTo(scrollport, 350)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })

  it('settles a forwarded draft scroll by position inside the gesture window', () => {
    const { scrollport, seat } = mountConversation()
    const input = seat.querySelector<HTMLElement>('[data-composer-input]')!
    const draft = document.createElement('div')
    draft.style.overflowY = 'auto'
    Object.defineProperties(draft, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 700 },
    })
    input.replaceWith(draft)
    draft.append(input)
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const dispose = installOrcaComposerMotion(document.body)

    // draft scroller at its edge; the host forwards the delta to the transcript
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120 }))
    scrollTo(scrollport, 200) // the transcript tail leaves the viewport
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    dispose()
  })

  it('observes layout owners only while a visibility mode is on', async () => {
    const { scrollport } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    document.documentElement.setAttribute(SCROLL_HIDE, 'off')
    const observe = vi.spyOn(FixtureResizeObserver.prototype, 'observe')
    const disconnect = vi.spyOn(FixtureResizeObserver.prototype, 'disconnect')
    try {
      const transcriptObservers = (): FixtureResizeObserver[] => observe.mock.calls
        .map(([target], i) => (target === scrollport ? observe.mock.contexts[i] as FixtureResizeObserver : null))
        .filter((observer): observer is FixtureResizeObserver => observer !== null)
      const dispose = installOrcaComposerMotion(document.body)
      expect(transcriptObservers()).toHaveLength(0)

      document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
      await flush()
      const [observer] = transcriptObservers()
      expect(observer).toBeDefined()
      expect(observer.targets.size).toBe(3)

      document.documentElement.setAttribute(BOTTOM_ONLY, 'off')
      await flush()
      expect(disconnect.mock.contexts).toContain(observer)
      dispose()
    } finally {
      observe.mockRestore()
      disconnect.mockRestore()
    }
  })

  it('releases the bindings of a replaced conversation once the next one mounts', async () => {
    const { scrollport: first } = mountConversation()
    const dispose = installOrcaComposerMotion(document.body)
    const removed = vi.spyOn(first, 'removeEventListener')

    // A conversation switch replaces the whole phase root and its scrollport.
    mountConversation()
    await flush()
    await flush()
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['scroll', 'wheel']))
    dispose()
  })

  it('keeps a long ask visible and reconciles its height without another scroll event', async () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const dispose = installOrcaComposerMotion(document.body)

    const flow = scrollport.querySelector<HTMLElement>('[data-chat-flow]')!
    flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 400 - scrollport.scrollTop })
    scrollTo(scrollport, 380)
    scrollTo(scrollport, 260)
    scrollTo(scrollport, 80)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    scrollTo(scrollport, 75)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollTo(scrollport, 80) // The hysteresis band retains the hidden state.
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    flow.getBoundingClientRect = () => DOMRect.fromRect({ height: 290 })
    resize(seat)
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })

  it('takes over scroll-hide: wheel direction no longer moves the composer', async () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    const dispose = installOrcaComposerMotion(document.body)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    scrollTo(scrollport, 300)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    // The mode switch samples the tail, independent of the host's control.
    scrollport.scrollTop = 350
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    scrollTo(scrollport, 300)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollTo(scrollport, 320)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollTo(scrollport, 350)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })
})
