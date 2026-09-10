// Stats panels are portaled to body, so hiding their composer does not close
// them. Toggle only its open stats trigger to let the host release the panel.
const SEAT_SELECTOR = '[data-composer-seat]'
const OPEN_PILL_SELECTOR = "[data-composer-stats] button[aria-expanded='true'][aria-haspopup='dialog']"
const HIDING_ATTRIBUTES = [
  'data-maid-composer-hidden',
  'data-maid-composer-capsule',
] as const
const installations = new WeakMap<Document, { users: number, dispose: () => void }>()

/**
 * @param body - skin owning element (document.body) used to reach the
 * document; the hide states live on the composer seats.
 */
export function installMaidComposerDismiss(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  let installation = installations.get(doc)
  if (installation === undefined) {
    installation = { users: 0, dispose: observeComposer(body) }
    installations.set(doc, installation)
  }
  const current = installation
  current.users += 1
  let active = true
  return () => {
    if (!active) return
    active = false
    if (--current.users > 0) return
    current.dispose()
    installations.delete(doc)
  }
}

function observeComposer(body: HTMLElement): () => void {
  const hidden = new WeakMap<HTMLElement, boolean>()

  const synchronize = (seat: HTMLElement): void => {
    const hiding = HIDING_ATTRIBUTES.some(attribute => seat.hasAttribute(attribute))
    if (hidden.get(seat) === hiding) return
    hidden.set(seat, hiding)
    if (!hiding) return
    seat.querySelectorAll<HTMLButtonElement>(OPEN_PILL_SELECTOR).forEach(pill => { pill.click() })
  }

  const observer = new MutationObserver((records) => {
    const seats = new Set<HTMLElement>()
    for (const record of records) {
      if (record.target instanceof HTMLElement && record.target.matches(SEAT_SELECTOR)
        && body.contains(record.target)) seats.add(record.target)
    }
    seats.forEach(synchronize)
  })
  const dispose = (): void => {
    observer.disconnect()
  }

  try {
    observer.observe(body, {
      attributes: true,
      attributeFilter: [...HIDING_ATTRIBUTES],
      subtree: true,
    })
    body.querySelectorAll<HTMLElement>(SEAT_SELECTOR).forEach(synchronize)
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
