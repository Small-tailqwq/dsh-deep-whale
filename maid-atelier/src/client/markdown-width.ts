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

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const SIZE_CONTAINER_TYPES = new Set(['size', 'inline-size'])
const SIZE_CONTAIN_VALUES = new Set(['size', 'inline-size', 'strict'])

function isCompactElement(element: Element): boolean {
  // KaTeX MathML and inline SVG are host Markdown leaves, not plugin surfaces;
  // skipping them keeps formula-heavy replies out of the style probe.
  if (element.namespaceURI !== XHTML_NAMESPACE) return true
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

function hasToken(value: string, tokens: ReadonlySet<string>): boolean {
  return value.split(/\s+/).some(token => tokens.has(token))
}

/** Only size containment drops intrinsic width: `scroll-state` containers and
 * `contain: content` keep it, while `contain: strict` implies size. */
function hasSizeContainment(element: Element): boolean {
  const view = element.ownerDocument.defaultView
  if (view === null) return false
  const style = view.getComputedStyle(element)
  return hasToken(style.getPropertyValue('container-type'), SIZE_CONTAINER_TYPES)
    || hasToken(style.getPropertyValue('contain'), SIZE_CONTAIN_VALUES)
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

  const scanAttributeTarget = (target: Element): void => {
    if (isCompactElement(target)) return
    const root = target.closest<HTMLElement>(MARKDOWN_SELECTOR)
    if (root !== null) queueScan(root)
  }

  try {
    document.querySelectorAll<HTMLElement>(MARKDOWN_SELECTOR).forEach(queueScan)
    observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target instanceof Element ? record.target : undefined
        if (record.type === 'attributes') {
          if (target !== undefined) scanAttributeTarget(target)
          continue
        }
        if (record.type !== 'childList') continue
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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
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
