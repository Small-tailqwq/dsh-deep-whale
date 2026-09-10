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

function mount(): Fixture {
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
  dock.dataset.slot = 'conversation.composer.dock'
  const stats = document.createElement('div')
  stats.dataset.composerStats = ''
  const pill = document.createElement('button')
  pill.type = 'button'
  pill.setAttribute('aria-haspopup', 'dialog')
  pill.setAttribute('aria-expanded', 'false')
  // The host's StatsPills owns this toggle; the skin only activates its button.
  pill.addEventListener('click', () => {
    pill.setAttribute('aria-expanded', String(pill.getAttribute('aria-expanded') !== 'true'))
  })
  stats.append(pill)
  dock.append(stats)
  seat.append(card, dock)
  scrollport.append(flow, seat)
  phaseBody.append(scrollport)
  root.append(phaseBody)
  document.body.append(root)
  return { seat, dock, pill, dispose: installMaidComposerDismiss(document.body) }
}

function pillClicks() {
  return vi.spyOn(document.querySelector<HTMLButtonElement>('[data-composer-stats] button')!, 'click')
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

    seat.closest('[data-conversation-scroll]')!.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -80 }))
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
    seat.querySelector('[data-slot]')!.append(picker)
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
