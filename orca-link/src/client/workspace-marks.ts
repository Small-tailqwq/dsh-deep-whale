import { hasMutationOutsideTranscript } from './mutation-filter.ts'

const MARKS = {
  group: 'data-orca-workspace-group',
  selectable: 'data-orca-workspace-selectable',
  children: 'data-orca-workspace-children',
  overflow: 'data-orca-workspace-overflow',
} as const

const TREE_SELECTOR = "[data-slot='sidebar'] [role='tree']"
const SECTION_SELECTOR = "[class*='groupSection']"

/** Keep the workspace group tags in step with the tree; only tree mutations trigger a pass. */
export function installOrcaWorkspaceMarks(body: HTMLElement): () => void {
  const changes = new Map<Element, Map<string, { original: string | null, written: string | null }>>()
  let active = true
  let scheduled = false
  const mark = (element: Element, attribute: string, on: boolean): void => {
    if (element.hasAttribute(attribute) === on) return
    let attributes = changes.get(element)
    if (!attributes) changes.set(element, attributes = new Map())
    const original = element.getAttribute(attribute)
    const change = attributes.get(attribute) ?? { original, written: original }
    attributes.set(attribute, change)
    change.written = on ? '' : null
    if (on) element.setAttribute(attribute, '')
    else element.removeAttribute(attribute)
  }
  const restore = (element: Element): void => {
    for (const [attribute, { original, written }] of changes.get(element) ?? []) {
      if (element.getAttribute(attribute) !== written) continue
      if (original === null) element.removeAttribute(attribute)
      else element.setAttribute(attribute, original)
    }
    changes.delete(element)
  }
  const run = (): void => {
    scheduled = false
    if (!active) return
    const sections = new Map<Element, boolean>()
    for (const tree of body.querySelectorAll(TREE_SELECTOR)) {
      for (const row of tree.querySelectorAll("[role='treeitem'][aria-expanded]")) {
        const section = row.closest(SECTION_SELECTOR)
        if (section && tree.contains(section)) sections.set(section, false)
      }
      // Parent sessions follow the complete child subtree in the host layout.
      // Their closest section, rather than the previous folder, owns the guide.
      for (const row of tree.querySelectorAll("[role='treeitem'][aria-selected]")) {
        const section = row.closest(SECTION_SELECTOR)
        if (section && sections.has(section)) sections.set(section, true)
      }
    }
    for (const element of changes.keys()) {
      if (!sections.has(element)) restore(element)
    }
    for (const [section, hasSessions] of sections) {
      mark(section, MARKS.group, true)
      mark(section, MARKS.selectable, hasSessions)
      mark(section, MARKS.children, section.querySelector(":scope > [role='group']") !== null)
      mark(section, MARKS.overflow, section.querySelector(":scope > button[class*='sessionOverflowButton']") !== null)
    }
  }
  const observer = new MutationObserver((records) => {
    if (scheduled || !hasMutationOutsideTranscript(records)) return
    const touchesTree = records.some(record => record.target instanceof Element
      && (record.target.closest(TREE_SELECTOR) !== null
        || (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes]
          .some(node => node instanceof Element && (node.matches(TREE_SELECTOR) || node.querySelector(TREE_SELECTOR) !== null)))))
    if (!touchesTree) return
    scheduled = true
    queueMicrotask(run)
  })
  const dispose = (): void => {
    active = false
    observer.disconnect()
    for (const element of changes.keys()) restore(element)
  }
  try {
    observer.observe(body, { childList: true, subtree: true })
    run()
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
