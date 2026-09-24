// @vitest-environment jsdom
/**
 * On a narrow frame a second tap on the active Plugins entry returns to the
 * conversation. The host re-renders `aria-current` synchronously during the
 * click, so the fixture's own handler does the same to reproduce that order.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installPanelToggle } from '../src/client/panel-toggle.ts'

function mountEntry(active: boolean): HTMLButtonElement {
  document.body.innerHTML = `<nav><button type="button" aria-label="插件"${active ? ' aria-current="page"' : ''}>
    <span aria-hidden="true"><div data-slot="sidebar.panellist" style="display: contents"><svg></svg></div></span>
  </button><button type="button" id="other">x</button></nav>`
  const entry = document.querySelector<HTMLButtonElement>('button[aria-label]')!
  // The host's own onClick: select this panel, which marks the entry current.
  entry.addEventListener('click', () => { entry.setAttribute('aria-current', 'page') })
  return entry
}

function setWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.innerHTML = ''
})

describe('narrow panel toggle', () => {
  it('returns to the conversation when the active entry is tapped again', () => {
    setWidth(375)
    const selectPanel = vi.fn()
    dispose = installPanelToggle(document, () => ({ selectPanel }))
    mountEntry(true).click()
    expect(selectPanel).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('leaves the first tap to open the panel', () => {
    setWidth(375)
    const selectPanel = vi.fn()
    dispose = installPanelToggle(document, () => ({ selectPanel }))
    mountEntry(false).click()
    expect(selectPanel).not.toHaveBeenCalled()
  })

  it('keeps wide frames and unrelated buttons as the host has them', () => {
    const selectPanel = vi.fn()
    dispose = installPanelToggle(document, () => ({ selectPanel }))
    setWidth(1280)
    mountEntry(true).click()
    setWidth(375)
    document.querySelector<HTMLButtonElement>('#other')!.click()
    expect(selectPanel).not.toHaveBeenCalled()
  })

  it('does nothing without the layout service and stops after disposal', () => {
    setWidth(375)
    const selectPanel = vi.fn()
    let service: { selectPanel: typeof selectPanel } | undefined
    dispose = installPanelToggle(document, () => service)
    const entry = mountEntry(true)
    expect(() => entry.click()).not.toThrow()
    service = { selectPanel }
    dispose()
    dispose = undefined
    entry.click()
    expect(selectPanel).not.toHaveBeenCalled()
  })
})
