// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidComposerDismiss } from '../src/client/composer-dismiss.ts'
import { installMaidComposerCapsule } from '../src/client/composer-capsule.ts'
import { installMaidComposerScroll } from '../src/client/composer-scroll.ts'

const HIDDEN = 'data-maid-composer-hidden'
const CAPSULE = 'data-maid-composer-capsule'
const MODE = 'data-maid-composer-mode'

interface Fixture {
  seat: HTMLElement
  dock: HTMLElement
  pill: HTMLButtonElement
  dispose: () => void
}

// DSH 0.2.0 renders one [data-composer-stats] row; 0.2.1 renders one
// [data-composer-stat] dock entry per pill.
function mount(layout: 'row' | 'entry' = 'row'): Fixture {
  const root = document.createElement('div')
  root.dataset.phase = 'active'
  const scrollport = document.createElement('div')
  scrollport.dataset.conversationScroll = ''
  const phaseBody = document.createElement('div')
  const flow = document.createElement('div')
  flow.dataset.chatFlow = ''
  const seat = document.createElement('div')
  seat.dataset.composerSeat = ''
  const card = document.createElement('div')
  card.dataset.composerCard = ''
  const input = document.createElement('div')
  input.dataset.composerInput = ''
  card.append(input)
  const dock = document.createElement('div')
  dock.className = 'fixture_dock'
  const slot = document.createElement('span')
  slot.dataset.slot = 'conversation.composer.dock'
  const stats = document.createElement(layout === 'row' ? 'div' : 'span')
  if (layout === 'row') stats.dataset.composerStats = ''
  else stats.dataset.composerStat = 'activity'
  const pill = document.createElement('button')
  pill.type = 'button'
  pill.setAttribute('aria-haspopup', 'dialog')
  pill.setAttribute('aria-expanded', 'false')
  // The host's StatsPills owns this toggle; the skin only activates its button.
  pill.addEventListener('click', () => {
    pill.setAttribute('aria-expanded', String(pill.getAttribute('aria-expanded') !== 'true'))
  })
  stats.append(pill)
  slot.append(stats)
  dock.append(slot)
  seat.append(card, dock)
  scrollport.append(flow, seat)
  phaseBody.append(scrollport)
  root.append(phaseBody)
  document.body.append(root)
  return { seat, dock, pill, dispose: installMaidComposerDismiss(document.body) }
}

function pillClicks() {
  return vi.spyOn(document.querySelector<HTMLButtonElement>('[data-slot] button')!, 'click')
}

function nextMicrotask(): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, 0) })
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(MODE)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute(MODE)
})

describe('maid composer hide/collapse dialog hand-off', () => {
  it('dismisses an open stats dialog when the seat fades out on scroll', async () => {
    const { seat, pill, dispose } = mount()
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()
    document.documentElement.setAttribute(MODE, 'scroll')
    const disposeScroll = installMaidComposerScroll(document.body)

    const scrollport = seat.closest<HTMLElement>('[data-conversation-scroll]')!
    Object.defineProperty(scrollport, 'clientHeight', { configurable: true, value: 300 })
    scrollport.getBoundingClientRect = () => DOMRect.fromRect({ height: 300 })
    scrollport.querySelector<HTMLElement>('[data-chat-flow]')!.getBoundingClientRect =
      () => DOMRect.fromRect({ height: 650 - scrollport.scrollTop })
    scrollport.scrollTop = 400
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -80 }))
    scrollport.scrollTop = 300
    scrollport.dispatchEvent(new Event('scroll'))
    await nextMicrotask()
    expect(seat.hasAttribute(HIDDEN)).toBe(true)
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    expect(spy).toHaveBeenCalledTimes(1)
    disposeScroll()
    dispose()
  })

  it('dismisses an open stats dialog when the empty-state capsule folds the dock', async () => {
    const { seat, pill, dispose } = mount()
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()
    const disposeCapsule = installMaidComposerCapsule(document.body)

    document.documentElement.setAttribute(MODE, 'capsule')
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    expect(spy).toHaveBeenCalledTimes(1)
    disposeCapsule()
    dispose()
  })

  it('dismisses the dialog of an already collapsed composer on activation', () => {
    const { seat, pill, dispose } = mount()
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()

    dispose()
    seat.setAttribute(CAPSULE, '')
    const disposeCurrent = installMaidComposerDismiss(document.body)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    disposeCurrent()
  })

  it('dismisses an open pill rendered as a per-stat dock entry', async () => {
    const { seat, pill, dispose } = mount('entry')
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()

    seat.setAttribute(HIDDEN, '')
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    dispose()
  })

  it.each([HIDDEN, CAPSULE])('dismisses the context panel outside the stats slot on %s', async (attribute) => {
    const { seat, dock, dispose } = mount('entry')
    const context = document.createElement('button')
    context.setAttribute('aria-haspopup', 'dialog')
    context.setAttribute('aria-expanded', 'true')
    const panel = document.createElement('div')
    panel.setAttribute('role', 'dialog')
    document.body.append(panel)
    const toggle = vi.fn(() => {
      context.setAttribute('aria-expanded', 'false')
      panel.remove()
    })
    context.addEventListener('click', toggle)
    dock.append(context)
    seat.setAttribute(attribute, '')
    await nextMicrotask()
    expect(toggle).toHaveBeenCalledTimes(1)
    expect(panel.isConnected).toBe(false)
    seat.removeAttribute(attribute)
    await nextMicrotask()
    expect(toggle).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('touches nothing while the composer stays visible', async () => {
    const { seat, dock, dispose } = mount()
    const spy = pillClicks()
    dock.setAttribute('data-revision', '2')
    seat.setAttribute('data-maid-composer-interactive', '')
    await nextMicrotask()
    expect(spy).not.toHaveBeenCalled()
    dispose()
  })

  it('leaves closed pills and other popovers alone', async () => {
    const { seat, dispose } = mount()
    const picker = document.createElement('button')
    picker.setAttribute('aria-haspopup', 'dialog')
    picker.setAttribute('aria-expanded', 'true')
    seat.querySelector('[data-composer-card]')!.append(picker)
    const spy = pillClicks()
    const pickerClick = vi.fn()
    picker.addEventListener('click', pickerClick)

    seat.setAttribute(HIDDEN, '')
    await nextMicrotask()
    expect(spy).not.toHaveBeenCalled()
    expect(pickerClick).not.toHaveBeenCalled()
    expect(picker.getAttribute('aria-expanded')).toBe('true')
    dispose()
  })

  it('dismisses once per hide and re-arms after the composer returns', async () => {
    const { seat, pill, dispose } = mount()
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()

    seat.setAttribute(HIDDEN, '')
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(1)

    // Repeated hidden-state writes must not toggle a closed dialog open.
    seat.setAttribute(HIDDEN, '')
    seat.setAttribute('data-maid-composer-interactive', '')
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(pill.getAttribute('aria-expanded')).toBe('false')

    seat.removeAttribute(HIDDEN)
    await nextMicrotask()
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    pill.setAttribute('aria-expanded', 'true')
    seat.setAttribute(HIDDEN, '')
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('dispose preserves the current activation and detaches its own observer', async () => {
    const { seat, pill, dispose } = mount()
    pill.setAttribute('aria-expanded', 'true')
    const spy = pillClicks()
    const disposeCurrent = installMaidComposerDismiss(document.body)

    dispose()
    seat.setAttribute(HIDDEN, '')
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(1)
    seat.removeAttribute(HIDDEN)
    await nextMicrotask()
    pill.setAttribute('aria-expanded', 'true')
    seat.setAttribute(HIDDEN, '')
    disposeCurrent()
    await nextMicrotask()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(pill.getAttribute('aria-expanded')).toBe('true')
  })
})
