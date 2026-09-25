// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installOrcaComposerCollapse } from '../src/client/composer-collapse.ts'
import { installOrcaComposerMotion } from '../src/client/composer-motion.ts'

const SCROLL_HIDE = 'data-dsh-whale-orca-composer-scroll-hide'
const HANDLES = 'data-dsh-whale-orca-composer-handles'

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(SCROLL_HIDE)
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
})
