// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidMobileDrawerAutoClose } from '../src/client/mobile-drawer.ts'

interface Fixture {
  frame: HTMLElement
  column: HTMLElement
  toggle: HTMLButtonElement
  row: HTMLElement
  rowAction: HTMLButtonElement
  settingsButton: HTMLButtonElement
  dispose: () => void
}

/**
 * Build the layout shape the installer reads: a frame that drops
 * `data-sidebar-collapsed` while the narrow column is an overlay, plus a
 * decorated session row carrying DSH's nested actions control and the sidebar's
 * own settings entry.
 */
function mount(): Fixture {
  const frame = document.createElement('div')
  frame.className = 'pI_x6G_frame'
  const column = document.createElement('div')
  column.className = 'pI_x6G_sidebarCol'
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'hHd-Xa_iconButton hHd-Xa_toggle'
  const row = document.createElement('div')
  row.dataset.maidSessionRow = ''
  row.setAttribute('role', 'treeitem')
  row.className = 'YDXeBa_sessionRow'
  const rowAction = document.createElement('button')
  rowAction.type = 'button'
  rowAction.className = 'YDXeBa_iconButton'
  rowAction.setAttribute('aria-label', 'Session actions')
  row.append(rowAction)
  const settingsSlot = document.createElement('div')
  settingsSlot.dataset.slot = 'sidebar.settings'
  const settingsButton = document.createElement('button')
  settingsButton.type = 'button'
  settingsButton.setAttribute('aria-haspopup', 'dialog')
  settingsSlot.append(settingsButton)
  column.append(toggle, row, settingsSlot)
  frame.append(column)
  document.body.append(frame)
  return {
    frame,
    column,
    toggle,
    row,
    rowAction,
    settingsButton,
    dispose: installMaidMobileDrawerAutoClose(document.body),
  }
}

/** jsdom reports 1024 for every viewport; the installer reads it per click. */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

/** The column is measured, so give it a phone-sized overlay box. */
function setColumnWidth(column: HTMLElement, width: number): void {
  vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 844,
    top: 0,
    left: 0,
    right: width,
    bottom: 844,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

/** A control that sits behind the open drawer, where a phone puts the composer. */
function mountOutside(): HTMLElement {
  const outside = document.createElement('div')
  outside.id = 'outside-the-drawer'
  document.body.append(outside)
  return outside
}

/** Mount the host dialog the sidebar's settings entry opens above the drawer. */
function mountDialog(): HTMLElement {
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  document.body.append(dialog)
  return dialog
}

/** jsdom ships no PointerEvent; the installer only reads `isPrimary`/`button`. */
function pointerDown(target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, ...init })
  target.dispatchEvent(event)
  return event
}

function click(target: Element): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

function settle(): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, 20) })
}

beforeEach(() => {
  document.body.innerHTML = ''
  setViewportWidth(390)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Maid Atelier mobile drawer auto-close', () => {
  it('closes the narrow drawer after a session row is activated', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    fixture.row.prepend(icon)
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()

    expect(toggleClick).toHaveBeenCalledTimes(1)
    fixture.dispose()
  })

  it('keeps the drawer open when the row opens its own actions menu', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    fixture.rowAction.click()
    await settle()

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('keeps the docked column open on a desktop viewport', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 280)
    setViewportWidth(1280)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    fixture.row.click()
    await settle()

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('does nothing while the collapsed rail is on screen', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 390)
    fixture.frame.setAttribute('data-sidebar-collapsed', 'true')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    fixture.row.click()
    await settle()

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('closes the drawer when the tap lands outside the column', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    pointerDown(outside)

    expect(toggleClick).toHaveBeenCalledTimes(1)
    fixture.dispose()
  })

  it('swallows the click a dismissing tap produced', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')
    let reachedTarget = false
    outside.addEventListener('click', () => { reachedTarget = true })

    pointerDown(outside)
    const mouse = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    outside.dispatchEvent(mouse)
    const tapped = click(outside)

    expect(toggleClick).toHaveBeenCalledTimes(1)
    expect(mouse.defaultPrevented).toBe(true)
    expect(tapped.defaultPrevented).toBe(true)
    expect(reachedTarget).toBe(false)
    fixture.dispose()
  })

  it('still dismisses for a click with no pointerdown in front of it', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    click(outside)

    expect(toggleClick).toHaveBeenCalledTimes(1)
    fixture.dispose()
  })

  it('keeps the drawer open for a tap inside the column', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    pointerDown(fixture.toggle)
    pointerDown(fixture.row)

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('lets an open popup own the tap that dismisses it', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')
    const menu = document.createElement('div')
    menu.setAttribute('role', 'menu')
    document.body.append(menu)

    pointerDown(outside)

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('ignores the host resize handle and secondary buttons', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')
    const handle = document.createElement('div')
    handle.className = 'pI_x6G_handle'
    document.body.append(handle)

    pointerDown(handle)
    pointerDown(handle, { button: 2 })

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('does not dismiss the docked column on a desktop viewport', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 280)
    setViewportWidth(1280)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    pointerDown(outside)
    click(outside)

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })

  it('stops dismissing outside taps once disposed', async () => {
    const fixture = mount()
    const outside = mountOutside()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    fixture.dispose()
    pointerDown(outside)
    click(outside)

    expect(toggleClick).not.toHaveBeenCalled()
  })

  it('stops listening once disposed', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    fixture.row.click()
    fixture.dispose()
    fixture.row.click()
    await settle()

    expect(toggleClick).not.toHaveBeenCalled()
  })

  it('leaves the drawer open when the settings dialog it opened is dismissed', async () => {
    const fixture = mount()
    setColumnWidth(fixture.column, 301)
    fixture.frame.removeAttribute('data-sidebar-collapsed')
    const toggleClick = vi.spyOn(fixture.toggle, 'click')

    // The drawer's own settings entry opens a host dialog above the overlay.
    // Closing that dialog closes one surface, not two: the drawer the reader
    // opened stays exactly where it was. The installer used to fold the drawer
    // with the dialog, and the user rejected the app deciding to restore more
    // than the one surface they closed.
    fixture.settingsButton.click()
    const dialog = mountDialog()
    await settle()
    dialog.remove()
    await settle()

    expect(toggleClick).not.toHaveBeenCalled()
    fixture.dispose()
  })
})
