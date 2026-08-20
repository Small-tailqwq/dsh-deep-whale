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
export function hasMutationOutsideTerminal(records: MutationRecord[]): boolean {
  return records.some((record) => {
    const target = record.target instanceof Element
      ? record.target
      : record.target.parentElement
    if (target?.closest('.xterm') !== null) return false
    if (target?.closest('[data-input-backdrop]') !== null) return false
    return true
  })
}
