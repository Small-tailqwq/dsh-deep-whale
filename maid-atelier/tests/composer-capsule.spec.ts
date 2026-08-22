// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidComposerCapsule } from '../src/client/composer-capsule.ts'

const MODE = 'data-maid-composer-mode'
const CAPSULE = 'data-maid-composer-capsule'

interface Fixture {
  root: HTMLElement
  scrollport: HTMLElement
  seat: HTMLElement
  card: HTMLElement
  textarea: HTMLTextAreaElement
  dispose: () => void
}

function mount(mode: string = 'capsule'): Fixture {
  const root = document.createElement('div')
  root.dataset.phase = 'active'
  const scrollport = document.createElement('div')
  scrollport.dataset.conversationScroll = ''
  const flow = document.createElement('div')
  flow.dataset.chatFlow = ''
  const seat = document.createElement('div')
  seat.dataset.composerSeat = ''
  const card = document.createElement('div')
  card.dataset.composerCard = ''
  const textarea = document.createElement('textarea')
  card.append(textarea)
  seat.append(card)
  scrollport.append(flow, seat)
  root.append(scrollport)
  document.body.append(root)
  document.documentElement.setAttribute(MODE, mode)
  return { root, scrollport, seat, card, textarea, dispose: installMaidComposerCapsule(document.body) }
}

function nextMicrotask(): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, 0) })
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.removeAttribute(MODE)
})

afterEach(() => {
  document.documentElement.removeAttribute(MODE)
  vi.useRealTimers()
})

describe('maid composer empty-state capsule', () => {
  it('collapses an empty unfocused composer into the capsule', () => {
    const { seat, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    dispose()
  })

  it('keeps the capsule away while typing and does not re-collapse after clearing', () => {
    const { seat, textarea, dispose } = mount()
    textarea.value = 'hello'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    textarea.value = ''
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    // Typing owns the composer: clearing the draft must not fold it behind
    // the user's cursor.
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('expands on focus and stays expanded after a plain blur', async () => {
    const { seat, textarea, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    textarea.focus()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    textarea.blur()
    await nextMicrotask()
    // Interacting with the composer owns it; a plain blur (no click on
    // transcript/todo content) must not fold it.
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('does not collapse when clicking the card chrome outside the text', async () => {
    const { seat, card, textarea, dispose } = mount()
    textarea.focus()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    // Clicking a chrome control (or blank card area) blurs the textarea; the
    // pointerdown re-arms the interaction so the capsule must not fold.
    card.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    textarea.blur()
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('re-arms the automatic collapse only after clicking outside the composer', async () => {
    const { root, seat, card, textarea, dispose } = mount()
    textarea.focus()
    card.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    textarea.blur()
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    // Clicking transcript/todo content (an open popover excepted) re-arms.
    const todo = document.createElement('button')
    todo.dataset.testid = 'todo-toggle'
    todo.textContent = '展开 TODO'
    root.append(todo)
    todo.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    dispose()
  })

  it('does not re-arm when clicking inside an open popover', async () => {
    const { root, seat, textarea, dispose } = mount()
    textarea.focus()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    const menu = document.createElement('div')
    menu.setAttribute('role', 'menu')
    root.append(menu)
    menu.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('keeps the capsule away while a popover menu is open', async () => {
    const { seat, card, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    const trigger = document.createElement('button')
    trigger.setAttribute('aria-expanded', 'true')
    card.append(trigger)
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    trigger.remove()
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    dispose()
  })

  it('expands when the collapsed capsule is clicked and ends its one-shot marker', async () => {
    vi.useFakeTimers()
    const { seat, card, textarea, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).toBe(textarea)
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    // The fold -> expand flip plays a single compositor-only keyframe.
    expect(seat.hasAttribute('data-maid-composer-expanding')).toBe(true)
    await vi.advanceTimersByTimeAsync(400)
    expect(seat.hasAttribute('data-maid-composer-expanding')).toBe(false)
    dispose()
  })

  it('does not expand when clicking queue content bound inside the seat', () => {
    const { seat, card, textarea, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    // Todo/goal/queue panels are rendered near or even inside the seat; only
    // the pill card itself may steal focus.
    const queue = document.createElement('button')
    queue.dataset.testid = 'queue-item'
    queue.textContent = '展开队列消息'
    seat.append(queue)
    queue.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).not.toBe(textarea)
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    // clicking the pill card still expands
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).toBe(textarea)
    dispose()
  })

  it('does not expand when clicking todo content outside the seat', () => {
    const { root, scrollport, seat, textarea, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    const todo = document.createElement('button')
    todo.dataset.testid = 'todo-toggle'
    todo.textContent = '展开 TODO'
    scrollport.insertBefore(todo, seat)
    todo.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).not.toBe(textarea)
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    root.append(todo)
    todo.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).not.toBe(textarea)
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    dispose()
  })

  it('does not run outside capsule mode', () => {
    const persistent = mount('persistent')
    expect(persistent.seat.hasAttribute(CAPSULE)).toBe(false)
    persistent.dispose()
    const scroll = mount('scroll')
    expect(scroll.seat.hasAttribute(CAPSULE)).toBe(false)
    scroll.dispose()
  })

  it('clears the capsule immediately when the mode flips away', async () => {
    const { seat, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    document.documentElement.setAttribute(MODE, 'persistent')
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('ignores seats outside an active conversation with a chat flow', async () => {
    const { root, scrollport, seat, dispose } = mount()
    root.dataset.phase = 'hero'
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    root.dataset.phase = 'active'
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    scrollport.querySelector('[data-chat-flow]')!.remove()
    await nextMicrotask()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
    dispose()
  })

  it('dispose removes every owned capsule state', () => {
    const { seat, dispose } = mount()
    expect(seat.hasAttribute(CAPSULE)).toBe(true)
    dispose()
    expect(seat.hasAttribute(CAPSULE)).toBe(false)
  })
})