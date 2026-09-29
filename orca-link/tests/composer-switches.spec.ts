// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installOrcaComposerCollapse } from '../src/client/composer-collapse.ts'
import { installOrcaComposerMotion } from '../src/client/composer-motion.ts'

const SCROLL_HIDE = 'data-dsh-whale-orca-composer-scroll-hide'
const BOTTOM_ONLY = 'data-dsh-whale-orca-composer-bottom-only'
const HANDLES = 'data-dsh-whale-orca-composer-handles'

afterEach(() => {
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
        <div data-composer-seat><div data-composer-card><textarea data-composer-input></textarea></div></div>
      </div>
    </div>
  `
  return {
    scrollport: document.querySelector<HTMLElement>('[data-conversation-scroll]')!,
    seat: document.querySelector<HTMLElement>('[data-composer-seat]')!,
  }
}

/** jsdom 不做布局：手工给出滚动几何，供置底判定使用。 */
function defineScrollGeometry(scrollport: HTMLElement, height: number, contentHeight: number): void {
  Object.defineProperties(scrollport, {
    clientHeight: { configurable: true, value: height },
    scrollHeight: { configurable: true, value: contentHeight },
  })
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
  it('only tucks the composer away on scroll-up while scroll-hide is on', async () => {
    const { scrollport, seat } = mountConversation()
    const dispose = installOrcaComposerMotion(document.body)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    // Switching off releases the seat the last gesture hid...
    document.documentElement.setAttribute(SCROLL_HIDE, 'off')
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    // ...and later scroll-up gestures leave it alone.
    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    document.documentElement.setAttribute(SCROLL_HIDE, 'on')
    await flush()
    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
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

  it('keeps the composer only while the host renders no back-to-bottom control', () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const dispose = installOrcaComposerMotion(document.body)

    const toBottom = mountToBottomButton(scrollport)
    scrollport.scrollTop = 200
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    // 宿主认为停在新消息处：控件卸载后即使仍停在原位置也放回来。
    toBottom.remove()
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })

  it('reacts to the back-to-bottom control mounting after the scroll event', async () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    const dispose = installOrcaComposerMotion(document.body)

    scrollport.scrollTop = 200
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    // 宿主在上一次滚动事件之后才提交控件：此后再没有滚动事件可以依赖。
    const toBottom = mountToBottomButton(scrollport)
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    toBottom.remove()
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })

  it('takes over scroll-hide: wheel direction no longer moves the composer', async () => {
    const { scrollport, seat } = mountConversation()
    defineScrollGeometry(scrollport, 300, 800)
    const dispose = installOrcaComposerMotion(document.body)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)

    // 接管的那一刻按当前位置落定（此时没有回到底部控件，宿主仍在尾部）。
    document.documentElement.setAttribute(BOTTOM_ONLY, 'on')
    await flush()
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    scrollport.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    dispose()
  })
})
