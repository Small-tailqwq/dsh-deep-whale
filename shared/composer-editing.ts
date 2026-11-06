const INPUT_SELECTOR = '[data-composer-input]'
const SEAT_SELECTOR = '[data-composer-seat]'
const QUOTE_SELECTOR = '[data-composer-quote]'

/** Track deliberate editing independently of the host's automatic focus. */
export function installComposerEditing(doc: Document, activate: (seat: HTMLElement) => boolean) {
  let editing = new WeakSet<HTMLElement>()
  let disposed = false

  const begin = (input: Element): void => {
    const seat = input.closest<HTMLElement>(SEAT_SELECTOR)
    if (seat === null || editing.has(seat)) return
    if (activate(seat)) editing.add(seat)
  }
  const onEdit = (event: Event): void => {
    const input = event.target instanceof Element ? event.target.closest(INPUT_SELECTOR) : null
    if (input !== null) begin(input)
  }
  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    const target = event.target
    if (!(target instanceof Element)) return
    // Clicking non-focusable transcript text still ends the editing session.
    if (target.closest(SEAT_SELECTOR) === null) editing = new WeakSet()
    else onEdit(event)
  }
  const onFocusOut = (event: FocusEvent): void => {
    const seat = event.target instanceof Element ? event.target.closest<HTMLElement>(SEAT_SELECTOR) : null
    if (seat === null) return
    queueMicrotask(() => {
      if (!disposed && !seat.contains(doc.activeElement)) editing.delete(seat)
    })
  }

  // Reuse the skin's structural observer. Text edits need no DOM scan; only
  // newly inserted quote elements inside the focused editor start protection.
  const handleMutations = (records: MutationRecord[]): void => {
    if (disposed) return
    for (const record of records) {
      if (record.type !== 'childList' || !(record.target instanceof Element)) continue
      const input = record.target.closest(INPUT_SELECTOR)
      if (input === null || !input.contains(doc.activeElement)) continue
      const seat = input.closest<HTMLElement>(SEAT_SELECTOR)
      if (seat === null || editing.has(seat)) continue
      if ([...record.addedNodes].some(node => node instanceof Element
        && (node.matches(QUOTE_SELECTOR) || node.querySelector(QUOTE_SELECTOR) !== null))) begin(input)
    }
  }

  const editEvents = ['beforeinput', 'input', 'compositionstart'] as const
  const dispose = (): void => {
    disposed = true
    editing = new WeakSet()
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    editEvents.forEach(type => { doc.removeEventListener(type, onEdit, true) })
  }
  try {
    doc.addEventListener('pointerdown', onPointerDown, true)
    doc.addEventListener('focusout', onFocusOut, true)
    editEvents.forEach(type => { doc.addEventListener(type, onEdit, true) })
  } catch (error) {
    dispose()
    throw error
  }
  return {
    isEditing: (seat: HTMLElement): boolean => !disposed && editing.has(seat),
    handleMutations,
    dispose,
  }
}
