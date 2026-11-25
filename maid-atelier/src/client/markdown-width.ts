/**
 * Keep embedded rich surfaces from collapsing the maid Markdown bubble.
 *
 * The bubble is normally `width: fit-content` so short prose keeps a compact
 * plate. Container-query surfaces (GenUI fences, delivered cards, and similar
 * plugin output) often use `container-type: inline-size`; inline-size
 * containment contributes no intrinsic width, so a shrink-to-fit ancestor
 * collapses to its padding. Tags alone are projected here rather than using a
 * transcript-wide `:has()` probe: unknown or width-bearing descendants opt the
 * bubble out of compact sizing, while ordinary prose, lists, and inline markup
 * keep it.
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
  // to embedded forms and need the full measure.
  if (tag === 'input') return element.getAttribute('type')?.toLowerCase() === 'checkbox'
  return COMPACT_TAG_NAMES.has(tag)
}

function hasWideElement(root: Element, includeRoot: boolean): boolean {
  if (includeRoot && !isCompactElement(root)) return true
  for (const element of root.querySelectorAll('*')) {
    if (!isCompactElement(element)) return true
  }
  return false
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
  let observer: MutationObserver | undefined

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
    write(root, hasWideElement(root, false))
  }

  const scanAddedNode = (node: Element): void => {
    const roots = markdownRootsWithin(node)
    if (roots.length > 0) {
      roots.forEach(scan)
      return
    }
    const root = node.closest<HTMLElement>(MARKDOWN_SELECTOR)
    if (root === null || wideRoots.has(root)) return
    if (hasWideElement(node, true)) write(root, true)
  }

  const scanRemovedNode = (node: Element, target: Element | undefined, rescan: Set<HTMLElement>): void => {
    if (!hasWideElement(node, true) || target === undefined) return
    const root = target.closest<HTMLElement>(MARKDOWN_SELECTOR)
    if (root !== null) rescan.add(root)
  }

  try {
    document.querySelectorAll<HTMLElement>(MARKDOWN_SELECTOR).forEach(scan)
    observer = new MutationObserver((records) => {
      const rescan = new Set<HTMLElement>()
      for (const record of records) {
        if (record.type !== 'childList') continue
        const target = record.target instanceof Element ? record.target : undefined
        // Composer/input churn never intersects assistant Markdown; reject it
        // before walking or querying the added subtree.
        if (target === undefined || target.closest(ASSISTANT_STEP_SELECTOR) === null) continue
        for (const node of record.addedNodes) {
          if (node instanceof Element) scanAddedNode(node)
        }
        for (const node of record.removedNodes) {
          if (node instanceof Element) scanRemovedNode(node, target, rescan)
        }
      }
      for (const root of [...wideRoots]) {
        if (!root.isConnected || !root.matches(MARKDOWN_SELECTOR)) write(root, false)
      }
      rescan.forEach(scan)
    })
    observer.observe(document.body, { childList: true, subtree: true })
  } catch (error) {
    observer?.disconnect()
    for (const root of [...wideRoots]) write(root, false)
    throw error
  }

  return {
    dispose(): void {
      observer?.disconnect()
      for (const root of [...wideRoots]) write(root, false)
      wideRoots.clear()
    },
  }
}
