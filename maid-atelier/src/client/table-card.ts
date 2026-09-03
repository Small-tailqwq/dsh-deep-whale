/**
 * DSH wide-markdown-table preview/expand treatment.
 *
 * The official renderer marks >=4-column tables with the bare `md-table-wide`
 * hook and expands them out of the message column. In the maid bubble that
 * makes tables readable, but the sudden white slab competes with the chat
 * rhythm. This module keeps the table embedded by default, marks genuinely
 * overflowing tables as expandable, and opens a skin-owned enlarged clone on
 * explicit user intent. The renderer owns the original table subtree, so the
 * enhancer decorates that wrapper in place and never reparents it. The
 * renderer's column-count hook is only a discovery hint: activation follows
 * the live table and bubble geometry instead.
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
const SCROLL_SUPPRESSED_ATTRIBUTE = 'data-maid-table-scroll-suppressed'
const OVERLAY_ATTRIBUTE = 'data-maid-table-lightbox'
const MODAL_DIALOG_SELECTOR = "[role='dialog'][aria-modal='true']"
const ASSISTANT_STEP_SELECTOR = "[data-chat-flow-kind='assistant-step']"
const MARKDOWN_CONTAINER_SELECTOR = "div[class*='markdown']"
const EXPANDED_HORIZONTAL_CHROME = 96
const EXPANDED_MIN_WIDTH = 560
const LIGHTBOX_EDGE_GAP = 56

interface AttributeLease {
  originalValue: string | null
  owners: Set<symbol>
}

interface ControlLease {
  button: HTMLButtonElement
  owners: Map<symbol, () => void>
  onClick: (event: MouseEvent) => void
}

const attributeLeases = new WeakMap<HTMLElement, Map<string, AttributeLease>>()
const controlLeases = new WeakMap<HTMLElement, ControlLease>()

function setLeasedAttribute(element: HTMLElement, attribute: string, owner: symbol, active: boolean): void {
  let attributes = attributeLeases.get(element)
  let lease = attributes?.get(attribute)
  if (active) {
    if (attributes === undefined) {
      attributes = new Map()
      attributeLeases.set(element, attributes)
    }
    if (lease === undefined) {
      lease = { originalValue: element.getAttribute(attribute), owners: new Set() }
      attributes.set(attribute, lease)
    }
    lease.owners.add(owner)
    element.setAttribute(attribute, '')
    return
  }
  if (lease === undefined || attributes === undefined) return
  lease.owners.delete(owner)
  if (lease.owners.size > 0) {
    element.setAttribute(attribute, '')
    return
  }
  if (element.getAttribute(attribute) === '') {
    if (lease.originalValue === null) element.removeAttribute(attribute)
    else element.setAttribute(attribute, lease.originalValue)
  }
  attributes.delete(attribute)
  if (attributes.size === 0) attributeLeases.delete(element)
}

function acquireControl(wrapper: HTMLElement, owner: symbol, activate: () => void): HTMLButtonElement {
  let lease = controlLeases.get(wrapper)
  if (lease === undefined) {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute(CONTROL_ATTRIBUTE, '')
    button.dataset.skinOwner = SKIN_OWNER
    button.setAttribute('aria-label', '展开表格预览')
    button.title = '展开表格预览'
    const owners = new Map<symbol, () => void>()
    const onClick = (event: MouseEvent): void => {
      if (!wrapper.hasAttribute(EXPANDABLE_ATTRIBUTE)) return
      const current = Array.from(owners.values()).at(-1)
      if (current === undefined) return
      event.stopPropagation()
      current()
    }
    button.addEventListener('click', onClick)
    lease = { button, owners, onClick }
    controlLeases.set(wrapper, lease)
  }
  lease.owners.set(owner, activate)
  try {
    if (lease.button.parentElement !== wrapper) wrapper.append(lease.button)
  } catch (error) {
    releaseControl(wrapper, owner)
    throw error
  }
  return lease.button
}

function releaseControl(wrapper: HTMLElement, owner: symbol): void {
  const lease = controlLeases.get(wrapper)
  if (lease === undefined) return
  lease.owners.delete(owner)
  if (lease.owners.size > 0) return
  lease.button.removeEventListener('click', lease.onClick)
  lease.button.remove()
  controlLeases.delete(wrapper)
}

interface TableCardRuntime {
  dispose(): void
}

interface TableBinding {
  button: HTMLButtonElement
  onPointerLeave: () => void
  onScroll: () => void
}

interface TableCandidate {
  bubble: HTMLElement | null
  table: HTMLElement | null | undefined
  availableWidth: number
  naturalWidth: number
}

interface OverlayState {
  root: HTMLDivElement
  source: HTMLElement
  onClick: (event: MouseEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
}

function isForeignModalDialog(element: Element): boolean {
  return element.matches(MODAL_DIALOG_SELECTOR)
    && !element.hasAttribute(OVERLAY_ATTRIBUTE)
    && element.closest(`[${OVERLAY_ATTRIBUTE}]`) === null
}

function findBubble(wrapper: HTMLElement): HTMLElement | null {
  const assistantStep = wrapper.closest<HTMLElement>(ASSISTANT_STEP_SELECTOR)
  const markdown = wrapper.closest<HTMLElement>(MARKDOWN_CONTAINER_SELECTOR)
  if (assistantStep !== null && markdown !== null && assistantStep.contains(markdown)) return markdown
  return wrapper.parentElement
}

function contentWidth(element: HTMLElement | null): number {
  if (element === null || element.clientWidth <= 0) return 0
  const style = getComputedStyle(element)
  const start = Number.parseFloat(style.paddingLeft) || 0
  const end = Number.parseFloat(style.paddingRight) || 0
  return Math.max(0, element.clientWidth - start - end)
}

function contentInlineSize(entry: ResizeObserverEntry): number {
  return entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
}

function borderInlineSize(entry: ResizeObserverEntry): number {
  return entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
}

/**
 * Install the wide-table geometry pass on the current body. Idempotent per
 * call; every observer and mutation is torn down by the returned disposer.
 */
export function installMaidTableCards(_ctx: Context): TableCardRuntime {
  const owner = Symbol('maid-table-card-activation')
  const bindings = new Map<HTMLElement, TableBinding>()
  const candidates = new Map<HTMLElement, TableCandidate>()
  const resizeTargets = new Map<Element, Set<HTMLElement>>()
  let observer: MutationObserver | undefined
  let resizeObserver: ResizeObserver | undefined
  let overlay: OverlayState | undefined
  const closingOverlays = new Map<HTMLDivElement, ReturnType<typeof setTimeout>>()

  const closeOverlay = (immediate = false): void => {
    if (overlay === undefined) return
    const { root, source, onClick, onKeyDown } = overlay
    overlay = undefined
    setLeasedAttribute(source, OPEN_ATTRIBUTE, owner, false)
    root.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKeyDown)
    if (immediate) {
      root.remove()
      return
    }
    root.dataset.maidTableClosing = ''
    const timer = window.setTimeout(() => {
      closingOverlays.delete(root)
      root.remove()
    }, 180)
    closingOverlays.set(root, timer)
  }

  const deactivate = (wrapper: HTMLElement): void => {
    if (overlay?.source === wrapper) closeOverlay(true)
    const binding = bindings.get(wrapper)
    if (binding !== undefined) {
      wrapper.removeEventListener('pointerleave', binding.onPointerLeave)
      wrapper.removeEventListener('scroll', binding.onScroll)
      releaseControl(wrapper, owner)
      bindings.delete(wrapper)
    }
    setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, false)
    setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, false)
    setLeasedAttribute(wrapper, OPEN_ATTRIBUTE, owner, false)
    setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, false)
  }

  const watch = (wrapper: HTMLElement, target: Element | null): void => {
    if (resizeObserver === undefined || target === null) return
    let wrappers = resizeTargets.get(target)
    if (wrappers === undefined) {
      wrappers = new Set()
      resizeTargets.set(target, wrappers)
      resizeObserver.observe(target)
    }
    wrappers.add(wrapper)
  }

  const unwatch = (wrapper: HTMLElement, target: Element | null): void => {
    if (target === null) return
    const wrappers = resizeTargets.get(target)
    if (wrappers === undefined) return
    wrappers.delete(wrapper)
    if (wrappers.size > 0) return
    resizeTargets.delete(target)
    resizeObserver?.unobserve(target)
  }

  const removeClosingOverlays = (): void => {
    for (const [root, timer] of closingOverlays) {
      clearTimeout(timer)
      root.remove()
    }
    closingOverlays.clear()
  }

  const hasForeignModalDialog = (): boolean => {
    return Array.from(document.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog)
  }

  const openOverlay = (wrapper: HTMLElement): void => {
    closeOverlay(true)
    removeClosingOverlays()
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
    clone.removeAttribute(FRAME_ATTRIBUTE)
    clone.removeAttribute(EXPANDABLE_ATTRIBUTE)
    clone.removeAttribute(OPEN_ATTRIBUTE)
    clone.removeAttribute(SCROLL_SUPPRESSED_ATTRIBUTE)
    clone.removeAttribute('tabindex')
    clone.removeAttribute('aria-label')
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
    setLeasedAttribute(wrapper, OPEN_ATTRIBUTE, owner, true)
    overlay = { root, source: wrapper, onClick, onKeyDown }
    close.focus({ preventScroll: true })
  }

  const activate = (wrapper: HTMLElement): void => {
    if (bindings.has(wrapper)) {
      setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, true)
      setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, true)
      return
    }
    const button = acquireControl(wrapper, owner, () => openOverlay(wrapper))
    const onScroll = (): void => {
      setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, true)
    }
    const onPointerLeave = (): void => {
      setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, false)
    }
    bindings.set(wrapper, { button, onPointerLeave, onScroll })
    try {
      setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, true)
      setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, true)
      wrapper.addEventListener('pointerleave', onPointerLeave)
      wrapper.addEventListener('scroll', onScroll, { passive: true })
    } catch (error) {
      deactivate(wrapper)
      throw error
    }
  }

  const refreshCandidate = (wrapper: HTMLElement): TableCandidate | undefined => {
    const candidate = candidates.get(wrapper)
    if (candidate === undefined) return undefined
    const bubble = findBubble(wrapper)
    if (bubble !== candidate.bubble) {
      unwatch(wrapper, candidate.bubble)
      candidate.bubble = bubble
      candidate.availableWidth = contentWidth(bubble)
      watch(wrapper, bubble)
    }
    const table = wrapper.querySelector<HTMLElement>('table')
    if (table !== candidate.table) {
      unwatch(wrapper, candidate.table ?? null)
      candidate.table = table
      candidate.naturalWidth = table?.scrollWidth ?? wrapper.scrollWidth
      watch(wrapper, table)
    }
    return candidate
  }

  const untrack = (wrapper: HTMLElement): void => {
    const candidate = candidates.get(wrapper)
    if (candidate === undefined) return
    deactivate(wrapper)
    unwatch(wrapper, candidate.bubble)
    unwatch(wrapper, candidate.table ?? null)
    candidates.delete(wrapper)
  }

  const reconcile = (wrapper: HTMLElement): void => {
    if (!wrapper.isConnected) {
      untrack(wrapper)
      return
    }
    const candidate = candidates.get(wrapper)
    if (candidate === undefined) return
    if (candidate.availableWidth > 0 && candidate.naturalWidth > candidate.availableWidth + 1) {
      activate(wrapper)
    } else {
      deactivate(wrapper)
    }
  }

  const track = (wrapper: HTMLElement): void => {
    if (wrapper.closest(`[${OVERLAY_ATTRIBUTE}]`) !== null) return
    if (candidates.has(wrapper)) {
      refreshCandidate(wrapper)
      reconcile(wrapper)
      return
    }
    candidates.set(wrapper, {
      bubble: null,
      table: undefined,
      availableWidth: 0,
      naturalWidth: 0,
    })
    try {
      refreshCandidate(wrapper)
      reconcile(wrapper)
    } catch (error) {
      untrack(wrapper)
      throw error
    }
  }

  const runtime: TableCardRuntime = {
    dispose(): void {
      closeOverlay(true)
      removeClosingOverlays()
      observer?.disconnect()
      resizeObserver?.disconnect()
      for (const wrapper of [...candidates.keys()]) untrack(wrapper)
      resizeTargets.clear()
      resizeObserver = undefined
      bindings.clear()
      candidates.clear()
    },
  }

  try {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const affected = new Set<HTMLElement>()
        for (const entry of entries) {
          const wrappers = resizeTargets.get(entry.target)
          if (wrappers === undefined) continue
          for (const wrapper of wrappers) {
            const candidate = candidates.get(wrapper)
            if (candidate === undefined) continue
            if (entry.target === candidate.bubble) candidate.availableWidth = contentInlineSize(entry)
            if (entry.target === candidate.table) candidate.naturalWidth = borderInlineSize(entry)
            affected.add(wrapper)
          }
        }
        affected.forEach(reconcile)
      })
    }

    observer = new MutationObserver((records) => {
      let sawForeignModal = false
      const refresh = new Set<HTMLElement>()
      const removed = new Set<HTMLElement>()
      for (const record of records) {
        if (record.target instanceof HTMLElement) {
          const wrapper = record.target.matches(MAID_TABLE_SELECTOR)
            ? record.target
            : record.target.closest<HTMLElement>(MAID_TABLE_SELECTOR)
          if (wrapper !== null && candidates.has(wrapper)) {
            const binding = bindings.get(wrapper)
            if (binding !== undefined && binding.button.parentElement !== wrapper) {
              wrapper.append(binding.button)
            }
            refresh.add(wrapper)
          }
        }
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          if (isForeignModalDialog(node) || Array.from(node.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog)) {
            sawForeignModal = true
          }
          if (node.matches(MAID_TABLE_SELECTOR)) track(node as HTMLElement)
          else if (node.querySelectorAll(MAID_TABLE_SELECTOR).length > 0) {
            node.querySelectorAll<HTMLElement>(MAID_TABLE_SELECTOR).forEach(track)
          }
        }
        for (const node of record.removedNodes) {
          if (!(node instanceof Element)) continue
          if (node.matches(MAID_TABLE_SELECTOR)) removed.add(node as HTMLElement)
          node.querySelectorAll<HTMLElement>(MAID_TABLE_SELECTOR).forEach(wrapper => removed.add(wrapper))
        }
      }
      for (const wrapper of removed) {
        if (!wrapper.isConnected) untrack(wrapper)
      }
      for (const wrapper of refresh) {
        if (wrapper.isConnected) {
          const candidate = candidates.get(wrapper)
          const table = wrapper.querySelector<HTMLElement>('table')
          if (candidate !== undefined && table !== candidate.table) {
            refreshCandidate(wrapper)
            reconcile(wrapper)
          }
        }
      }
      if (sawForeignModal && overlay !== undefined) closeOverlay(true)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll<HTMLElement>(MAID_TABLE_SELECTOR).forEach(track)
    return runtime
  } catch (error) {
    runtime.dispose()
    throw error
  }
}
