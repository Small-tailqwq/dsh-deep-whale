import { hasMutationOutsideTranscript } from './mutation-filter.ts'

/**
 * The workspace tree styles a group by what it contains: an expandable row, a
 * selectable row, the current session. CSS can only ask that through `:has()`
 * on every direct child of the tree, and `:has()` cannot be fast-rejected, so
 * each style pass paid ~4µs per row for it (the single most expensive selector
 * while typing in a long session). The client tags the few group rows instead.
 */
export const ORCA_WORKSPACE_MARKS = {
  group: 'data-orca-workspace-group',
  selectable: 'data-orca-workspace-selectable',
  current: 'data-orca-workspace-current',
} as const

const TREE_ROWS_SELECTOR = "[data-slot='sidebar'] [role='tree'] > div"
const TREE_SELECTOR = "[data-slot='sidebar'] [role='tree']"

function mark(element: Element, attribute: string, on: boolean): void {
  if (element.hasAttribute(attribute) !== on) element.toggleAttribute(attribute, on)
}

export function syncOrcaWorkspaceMarks(root: ParentNode = document): void {
  for (const row of root.querySelectorAll(TREE_ROWS_SELECTOR)) {
    mark(row, ORCA_WORKSPACE_MARKS.group, row.querySelector("[role='treeitem'][aria-expanded]") !== null)
    mark(row, ORCA_WORKSPACE_MARKS.selectable, row.querySelector("[role='treeitem'][aria-selected]") !== null)
    mark(row, ORCA_WORKSPACE_MARKS.current, row.querySelector("[role='treeitem'][aria-selected='true']") !== null)
  }
}

export function clearOrcaWorkspaceMarks(root: ParentNode = document): void {
  const attributes = Object.values(ORCA_WORKSPACE_MARKS)
  const selector = attributes.map(attribute => `[${attribute}]`).join(', ')
  for (const element of root.querySelectorAll(selector)) {
    for (const attribute of attributes) element.removeAttribute(attribute)
  }
}

/** Keep the workspace group tags in step with the tree; only tree mutations trigger a pass. */
export function installOrcaWorkspaceMarks(body: HTMLElement): () => void {
  let scheduled = false
  const run = (): void => {
    scheduled = false
    syncOrcaWorkspaceMarks(body)
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
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-expanded'],
  })
  syncOrcaWorkspaceMarks(body)
  return () => {
    observer.disconnect()
    clearOrcaWorkspaceMarks(body)
  }
}
