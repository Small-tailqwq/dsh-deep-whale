/**
 * DSH 0.1.1 wide-markdown-table preview/expand treatment.
 *
 * The official renderer marks >=4-column tables with the bare `md-table-wide`
 * hook and expands them out of the message column. In the maid bubble that
 * makes tables readable, but the sudden white slab competes with the chat
 * rhythm. This module keeps the table embedded by default, marks genuinely
 * overflowing tables as expandable, and opens a skin-owned enlarged clone on
 * explicit user intent.
 *
 * Every observer, listener, injected button, overlay, and attribute write is
 * owned here and released by the returned disposer: application order, hot
 * switching, and partial failures cannot leave a wrapper decorated.
 */
import type { Context } from '@deepseek-ai/cordis'

export const MAID_TABLE_SELECTOR = '.md-table-wide'
export const MAID_TABLE_FILL_SELECTOR = '.md-table-wide'
const SKIN_OWNER = 'maid-atelier'
const EXPANDABLE_ATTRIBUTE = 'data-maid-table-expandable'
const OPEN_ATTRIBUTE = 'data-maid-table-open'
const CONTROL_ATTRIBUTE = 'data-maid-table-expand'
const FRAME_ATTRIBUTE = 'data-maid-table-frame'
const OVERLAY_ATTRIBUTE = 'data-maid-table-lightbox'
const MODAL_DIALOG_SELECTOR = "[role='dialog'][aria-modal='true']"
const EXPANDED_HORIZONTAL_CHROME = 96
const EXPANDED_MIN_WIDTH = 560
const LIGHTBOX_EDGE_GAP = 56

interface TableCardRuntime {
  dispose(): void
}

interface TableBinding {
  button: HTMLButtonElement
  frame: HTMLDivElement
  originalTabIndex: string | null
  onClick: (event: MouseEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
}

interface OverlayState {
  root: HTMLDivElement
  source: HTMLElement
  onClick: (event: MouseEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
}

function interactiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element
    && target.closest('a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]') !== null
}

function isForeignModalDialog(element: Element): boolean {
  return element.matches(MODAL_DIALOG_SELECTOR)
    && !element.hasAttribute(OVERLAY_ATTRIBUTE)
    && element.closest(`[${OVERLAY_ATTRIBUTE}]`) === null
}

/**
 * Install the wide-table geometry pass on the current body. Idempotent per
 * call; every observer and mutation is torn down by the returned disposer.
 */
export function installMaidTableCards(_ctx: Context): TableCardRuntime {
  const bindings = new Map<HTMLElement, TableBinding>()
  let observer: MutationObserver | undefined
  let resizeObserver: ResizeObserver | undefined
  let overlay: OverlayState | undefined

  const release = (wrapper: HTMLElement): void => {
    const binding = bindings.get(wrapper)
    if (binding !== undefined) {
      binding.button.removeEventListener('click', binding.onClick)
      wrapper.removeEventListener('keydown', binding.onKeyDown)
      bindings.delete(wrapper)
      if (binding.originalTabIndex === null) wrapper.removeAttribute('tabindex')
      else wrapper.setAttribute('tabindex', binding.originalTabIndex)
      if (binding.frame.isConnected && wrapper.parentElement === binding.frame) {
        binding.frame.replaceWith(wrapper)
      } else {
        binding.button.remove()
        binding.frame.remove()
      }
    }
    resizeObserver?.unobserve(wrapper)
    wrapper.removeAttribute(EXPANDABLE_ATTRIBUTE)
    wrapper.removeAttribute(OPEN_ATTRIBUTE)
  }

  const closeOverlay = (immediate = false): void => {
    if (overlay === undefined) return
    const { root, source, onClick, onKeyDown } = overlay
    overlay = undefined
    source.removeAttribute(OPEN_ATTRIBUTE)
    root.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKeyDown)
    if (immediate) {
      root.remove()
      return
    }
    root.dataset.maidTableClosing = ''
    window.setTimeout(() => root.remove(), 180)
  }

  const hasForeignModalDialog = (): boolean => {
    return Array.from(document.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog)
  }

  const openOverlay = (wrapper: HTMLElement): void => {
    closeOverlay()
    if (hasForeignModalDialog()) return

    const root = document.createElement('div')
    root.setAttribute(OVERLAY_ATTRIBUTE, '')
    root.dataset.skinOwner = SKIN_OWNER
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')

    const backdrop = document.createElement('div')
    backdrop.dataset.maidTableBackdrop = ''

    const panel = document.createElement('div')
    panel.dataset.maidTablePanel = ''
    const sourceTable = wrapper.querySelector<HTMLElement>('table')
    const naturalWidth = sourceTable?.scrollWidth ?? wrapper.scrollWidth
    const availableWidth = Math.max(EXPANDED_MIN_WIDTH, window.innerWidth - LIGHTBOX_EDGE_GAP)
    const targetWidth = Math.min(
      availableWidth,
      Math.max(EXPANDED_MIN_WIDTH, Math.ceil(naturalWidth + EXPANDED_HORIZONTAL_CHROME)),
    )
    panel.style.setProperty('--maid-table-expanded-width', `${targetWidth}px`)

    const close = document.createElement('button')
    close.type = 'button'
    close.dataset.maidTableClose = ''
    close.setAttribute('aria-label', '关闭展开表格')

    const scroller = document.createElement('div')
    scroller.dataset.maidTableExpandedScroller = ''

    const clone = wrapper.cloneNode(true) as HTMLElement
    clone.removeAttribute(EXPANDABLE_ATTRIBUTE)
    clone.removeAttribute(OPEN_ATTRIBUTE)
    clone.removeAttribute('tabindex')
    clone.querySelector(`[${CONTROL_ATTRIBUTE}]`)?.remove()
    clone.dataset.maidTableExpanded = ''
    scroller.append(clone)
    panel.append(close, scroller)
    root.append(backdrop, panel)

    const onClick = (event: MouseEvent): void => {
      const target = event.target
      if (target instanceof Element
        && (target.closest('[data-maid-table-close]') !== null || target.hasAttribute('data-maid-table-backdrop'))) {
        closeOverlay()
      }
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeOverlay()
    }

    root.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    document.body.append(root)
    wrapper.setAttribute(OPEN_ATTRIBUTE, '')
    overlay = { root, source: wrapper, onClick, onKeyDown }
    close.focus({ preventScroll: true })
  }

  const measure = (wrapper: HTMLElement): void => {
    if (!wrapper.isConnected) {
      release(wrapper)
      return
    }
    const table = wrapper.querySelector<HTMLElement>('table')
    const viewport = wrapper.clientWidth
    const natural = table?.scrollWidth ?? wrapper.scrollWidth
    if (viewport > 0 && natural > viewport + 1) {
      wrapper.setAttribute(EXPANDABLE_ATTRIBUTE, '')
      bindings.get(wrapper)?.frame.setAttribute(EXPANDABLE_ATTRIBUTE, '')
      wrapper.tabIndex = 0
    } else {
      wrapper.removeAttribute(EXPANDABLE_ATTRIBUTE)
      bindings.get(wrapper)?.frame.removeAttribute(EXPANDABLE_ATTRIBUTE)
      const binding = bindings.get(wrapper)
      if (binding?.originalTabIndex === null) wrapper.removeAttribute('tabindex')
      else if (binding !== undefined) wrapper.setAttribute('tabindex', binding.originalTabIndex)
    }
    const button = bindings.get(wrapper)?.button
    if (button !== undefined) button.hidden = !wrapper.hasAttribute(EXPANDABLE_ATTRIBUTE)
  }

  const adopt = (wrapper: HTMLElement): void => {
    if (bindings.has(wrapper)) return
    const parent = wrapper.parentNode
    if (parent === null) return
    const frame = document.createElement('div')
    frame.setAttribute(FRAME_ATTRIBUTE, '')
    frame.dataset.skinOwner = SKIN_OWNER
    const button = document.createElement('button')
    button.type = 'button'
    button.hidden = true
    button.setAttribute(CONTROL_ATTRIBUTE, '')
    button.dataset.skinOwner = SKIN_OWNER
    button.setAttribute('aria-label', '展开表格')
    const originalTabIndex = wrapper.getAttribute('tabindex')
    const onClick = (event: MouseEvent): void => {
      event.stopPropagation()
      openOverlay(wrapper)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.key !== 'Enter' && event.key !== ' ') || interactiveTarget(event.target)) return
      event.preventDefault()
      openOverlay(wrapper)
    }
    button.addEventListener('click', onClick)
    wrapper.addEventListener('keydown', onKeyDown)
    parent.insertBefore(frame, wrapper)
    frame.append(wrapper, button)
    bindings.set(wrapper, { button, frame, originalTabIndex, onClick, onKeyDown })
    resizeObserver?.observe(wrapper)
    measure(wrapper)
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        measure(entry.target as HTMLElement)
      }
    })
  }

  observer = new MutationObserver((records) => {
    let sawForeignModal = false
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue
        if (isForeignModalDialog(node) || Array.from(node.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog)) {
          sawForeignModal = true
        }
        if (node.matches(MAID_TABLE_SELECTOR)) adopt(node as HTMLElement)
        else if (node.querySelectorAll(MAID_TABLE_SELECTOR).length > 0) {
          node.querySelectorAll<HTMLElement>(MAID_TABLE_SELECTOR).forEach(adopt)
        }
      }
    }
    if (sawForeignModal && overlay !== undefined) closeOverlay(true)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  document.querySelectorAll<HTMLElement>(MAID_TABLE_SELECTOR).forEach(adopt)

  return {
    dispose(): void {
      closeOverlay(true)
      observer?.disconnect()
      resizeObserver?.disconnect()
      resizeObserver = undefined
      for (const wrapper of [...bindings.keys()]) release(wrapper)
      bindings.clear()
    },
  }
}
