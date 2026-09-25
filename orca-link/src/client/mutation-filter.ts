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

const TRANSCRIPT_SELECTOR = '[data-chat-flow]'

function insideTranscript(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement
  return (element?.closest(TRANSCRIPT_SELECTOR) ?? null) !== null
}

/**
 * For controllers that only follow the conversation's frame (phase, scrollport,
 * composer seat, sidebar chrome): streaming replies rewrite the transcript
 * (`[data-chat-flow]`) on every batch, and none of those edits can move the
 * frame, so they are skipped along with the terminal and editor churn above.
 * Mounting or replacing the transcript itself targets its parent and still
 * counts. The composer seat and the approval/question cards sit outside it.
 */
export function hasMutationOutsideTranscript(records: MutationRecord[]): boolean {
  return records.some(record => !isHighChurnOnly(record) && !insideTranscript(record.target))
}
