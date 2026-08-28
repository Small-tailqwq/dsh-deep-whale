/**
 * Skin controllers watch the document because DSH can replace their owning
 * surfaces during navigation. Two high-churn sources are excluded from the
 * reconciliation path because none of their mutations can affect ORCA chrome:
 *
 * - xterm, which mutates thousands of internal row nodes while replaying a
 *   terminal;
 * - the alpha composer's Lexical surface (`[data-composer-input]`), whose
 *   child nodes are maintained by the editor while typing.
 */
const HIGH_CHURN_SELECTOR = '.xterm'
const COMPOSER_INPUT_SELECTOR = '[data-composer-input]'

function belongsToHighChurnSubtree(node: Node): boolean {
  if (node instanceof Element) {
    return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null
  }
  return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null
}

function isHighChurnOnly(record: MutationRecord): boolean {
  if (belongsToHighChurnSubtree(record.target)) return true
  if (record.type !== 'childList') return false

  // Ignore only edits *inside* the resident Lexical root. Replacing the root
  // itself targets its parent and must still reconcile skin-owned chrome.
  if (record.target instanceof Element && record.target.closest(COMPOSER_INPUT_SELECTOR) !== null) return true

  // Replacing an xterm subtree reports its parent as the mutation target.
  // Inspect the changed nodes too, and ignore the record only when every
  // added/removed node belongs to that excluded subtree.
  const changed = [...record.addedNodes, ...record.removedNodes]
  return changed.length > 0 && changed.every(belongsToHighChurnSubtree)
}

export function hasMutationOutsideTerminal(records: MutationRecord[]): boolean {
  return records.some(record => !isHighChurnOnly(record))
}
