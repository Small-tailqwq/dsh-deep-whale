/**
 * Skin controllers watch the document because DSH can replace their owning
 * surfaces during navigation. xterm, however, mutates thousands of internal
 * row nodes while replaying a terminal. None of those mutations can affect
 * ORCA chrome, so keep them out of the document-level reconciliation path.
 */
export function hasMutationOutsideTerminal(records: MutationRecord[]): boolean {
  return records.some((record) => {
    const target = record.target instanceof Element
      ? record.target
      : record.target.parentElement
    return target?.closest('.xterm') === null
  })
}
