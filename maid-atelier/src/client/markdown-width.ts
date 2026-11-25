/**
 * Keep embedded size-contained surfaces from collapsing the maid Markdown bubble.
 *
 * The bubble is normally `width: fit-content` so short prose keeps a compact
 * plate. Container-query surfaces often use `container-type: inline-size`;
 * inline-size containment contributes no intrinsic width, so a shrink-to-fit
 * ancestor collapses to its padding. Detection therefore looks for computed
 * size containment rather than treating host Markdown markup (code blocks,
 * tables, KaTeX, images) as rich embeds. Candidate checks are batched into one
 * animation frame so streaming mutations do not force style work per batch.
 */
import type { Context } from '@deepseek-ai/cordis'
import { setLeasedAttribute } from '../../../shared/attribute-lease.ts'

export const MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE = 'data-maid-markdown-full-width'
const ASSISTANT_STEP_SELECTOR = "[data-chat-flow-kind='assistant-step']"
const MARKDOWN_SELECTOR = `${ASSISTANT_STEP_SELECTOR} > * > * > * > div[class*='markdown']`

const COMPACT_TAG_NAMES = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'cite', 'code', 'data', 'dd', 'del', 'dfn', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'ul', 'var', 'wbr',
])

function isCompactElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase()
  // Task-list checkboxes are inline Markdown affordances. Other inputs belong
  // to embedded forms and are candidates for the containment probe.
  if (tag === 'input') return element.getAttribute('type')?.toLowerCase() === 'checkbox'
  return COMPACT_TAG_NAMES.has(tag)
}

function hasCandidateElement(root: Element, includeRoot: boolean): boolean {
  if (includeRoot && !isCompactElement(root)) return true
  for (const element of root.querySelectorAll('*')) {
    if (!isCompactElement(element)) return true
  }
  return false
}

function hasSizeContainment(element: Element): boolean {
  const view = element.ownerDocument.defaultView
  if (view === null) return false
  let style: CSSStyleDeclaration
  try {
    style = view.getComputedStyle(element)
  } catch {
    // Embedded MathML/SVG is host markup, not a container-query surface. Some
    // DOM implementations cannot compute every foreign-element style; treat
    // those leaves as compact rather than failing the transcript observer.
    return false
  }
  if (style.getPropertyValue('container-type') !== 'normal') return true
  return style.getPropertyValue('contain').split(/\s+/).some(token => token === 'size' || token === 'inline-size')
}

function hasSizeContainedElement(root: Element, includeRoot: boolean): boolean {
  if (includeRoot && !isCompactElement(root) && hasSizeContainment(root)) return true
  for (const element of root.querySelectorAll('*')) {
    if (!isCompactElement(element) && hasSizeContainment(element)) return true
  }
  return false
}

function intersectsAssistantStep(node: Element): boolean {
  return node.closest(ASSISTANT_STEP_SELECTOR) !== null || node.querySelector(ASSISTANT_STEP_SELECTOR) !== null
}

function markdownRootsWithin(node: Element): HTMLElement[] {
  const roots: HTMLElement[] = []
  if (node.matches(MARKDOWN_SELECTOR)) roots.push(node as HTMLElement)
  node.querySelectorAll<HTMLElement>(MARKDOWN_SELECTOR).forEach(root => roots.push(root))
  return roots
}

export interface MarkdownWidthRuntime {
  dispose(): void
}

export function installMaidMarkdownWidth(_ctx: Context): MarkdownWidthRuntime {
  const owner = Symbol('maid-markdown-width')
  const wideRoots = new Set<HTMLElement>()
  const pendingRoots = new Set<HTMLElement>()
  let observer: MutationObserver | undefined
  let scheduled: number | undefined
  let scheduledWithAnimationFrame = false

  const write = (root: HTMLElement, active: boolean): void => {
    setLeasedAttribute(root, MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE, owner, active)
    if (active) wideRoots.add(root)
    else wideRoots.delete(root)
  }

  const scan = (root: HTMLElement): void => {
    if (!root.isConnected || !root.matches(MARKDOWN_SELECTOR)) {
      write(root, false)
      return
    }
    write(root, hasSizeContainedElement(root, false))
  }

  const flushPending = (): void => {
    scheduled = undefined
    const roots = [...pendingRoots]
    pendingRoots.clear()
    roots.forEach(scan)
  }

  const scheduleFlush = (): void => {
    if (scheduled !== undefined) return
    if (typeof requestAnimationFrame === 'function') {
      scheduledWithAnimationFrame = true
      scheduled = requestAnimationFrame(flushPending)
    } else {
      scheduledWithAnimationFrame = false
      scheduled = setTimeout(flushPending, 0) as unknown as number
    }
  }

  const cancelFlush = (): void => {
    if (scheduled === undefined) return
    if (scheduledWithAnimationFrame) cancelAnimationFrame(scheduled)
    else clearTimeout(scheduled)
    scheduled = undefined
    pendingRoots.clear()
  }

  const queueScan = (root: HTMLElement): void => {
    if (!root.isConnected) {
      write(root, false)
      return
    }
    pendingRoots.add(root)
    scheduleFlush()
  }

  const scanAddedNode = (node: Element): void => {
    const roots = markdownRootsWithin(node)
    if (roots.length > 0) {
      roots.forEach(queueScan)
      return
    }
    const root = node.closest<HTMLElement>(MARKDOWN_SELECTOR)
    if (root === null || wideRoots.has(root) || !hasCandidateElement(node, true)) return
    queueScan(root)
  }

  const scanRemovedNode = (node: Element, target: Element | undefined): void => {
    if (!hasCandidateElement(node, true) || target === undefined) return
    const root = target.closest<HTMLElement>(MARKDOWN_SELECTOR)
    if (root !== null) queueScan(root)
  }

  try {
    document.querySelectorAll<HTMLElement>(MARKDOWN_SELECTOR).forEach(queueScan)
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== 'childList') continue
        const target = record.target instanceof Element ? record.target : undefined
        // Composer/input churn never intersects assistant Markdown. Complete
        // assistant steps are inserted into a surrounding list, so relevance
        // must consider the added/removed subtree as well as the target.
        const targetInStep = target !== undefined && target.closest(ASSISTANT_STEP_SELECTOR) !== null
        for (const node of record.addedNodes) {
          if (node instanceof Element && (targetInStep || intersectsAssistantStep(node))) scanAddedNode(node)
        }
        for (const node of record.removedNodes) {
          if (node instanceof Element && (targetInStep || intersectsAssistantStep(node))) scanRemovedNode(node, target)
        }
      }
      for (const root of [...wideRoots]) {
        if (!root.isConnected || !root.matches(MARKDOWN_SELECTOR)) write(root, false)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  } catch (error) {
    cancelFlush()
    observer?.disconnect()
    for (const root of [...wideRoots]) write(root, false)
    throw error
  }

  return {
    dispose(): void {
      cancelFlush()
      observer?.disconnect()
      for (const root of [...wideRoots]) write(root, false)
      wideRoots.clear()
    },
  }
}
