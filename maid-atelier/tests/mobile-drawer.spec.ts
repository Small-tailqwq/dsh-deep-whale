// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMaidMobileDrawerAutoClose } from '../src/client/mobile-drawer.ts'

interface Fixture {
  frame: HTMLElement
  column: HTMLElement
  toggle: HTMLButtonElement
  row: HTMLElement
  rowAction: HTMLButtonElement
  dispose: () => void
}

/**
 * Build the layout shape the installer reads: a frame that drops
 * `data-sidebar-collapsed` while the narrow column is an overlay, plus a
 * decorated session row carrying DSH's nested actions control.
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
  column.append(toggle, row)
  frame.append(column)
  document.body.append(frame)
  return {
    frame,
    column,
    toggle,
    row,
    rowAction,
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
})
