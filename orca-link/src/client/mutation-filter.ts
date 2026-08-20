/**
 * Skin controllers watch the document because DSH can replace their owning
 * surfaces during navigation. Two high-churn sources are excluded from the
 * reconciliation path because none of their mutations can affect ORCA chrome:
 *
 * - xterm, which mutates thousands of internal row nodes while replaying a
 *   terminal;
 * - the rc8 composer's ghost-text backdrop (`[data-input-backdrop]`), whose
 *   text nodes are rebuilt on every keystroke by the draft renderer.
 */
const HIGH_CHURN_SELECTOR = '.xterm, [data-input-backdrop]'

function belongsToHighChurnSubtree(node: Node): boolean {
  if (node instanceof Element) {
    return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null
  }
  return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null
}

function isHighChurnOnly(record: MutationRecord): boolean {
  if (belongsToHighChurnSubtree(record.target)) return true
  if (record.type !== 'childList') return false

  // Replacing the backdrop itself reports its parent as the mutation target.
  // Inspect the changed nodes too, and ignore the record only when every
  // added/removed node belongs to one of the excluded high-churn subtrees.
  const changed = [...record.addedNodes, ...record.removedNodes]
  return changed.length > 0 && changed.every(belongsToHighChurnSubtree)
}

export function hasMutationOutsideTerminal(records: MutationRecord[]): boolean {
  return records.some(record => !isHighChurnOnly(record))
}
