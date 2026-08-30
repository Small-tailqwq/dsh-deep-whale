/**
 * Empty-state composer capsule: when the skin setting 'composerMode' is
 * 'capsule', an empty, unfocused active composer collapses into a compact
 * pill ("✎ 给智能体发消息"); clicking the pill focuses the editor to
 * expand it, typing keeps it expanded, and any open popover (model picker,
 * mode list, attachments) keeps it expanded too. Ported from the PR #42 idea
 * but attribute-driven instead of document-level :has(): the module owns the
 * 'data-maid-composer-capsule' seat attribute and the stylesheet reacts to
 * it, so typing never re-evaluates a document-wide selector.
 *
 * The fold/unfold layout swap is instant; the only animated properties are
 * compositor-friendly transform/opacity keyframes (see the stylesheet), so
 * state flips never reflow the transcript. Clicking content bound to the
 * composer area (todo, queue messages, goal progress) is ignored — focus is
 * stolen only for clicks landing on the pill card itself.
 */
const SEAT_SELECTOR = '[data-composer-seat]'
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]'
const CHAT_FLOW_SELECTOR = '[data-chat-flow]'
const CARD_SELECTOR = "[data-composer-card]:not([class*='cardWorkspaceTrigger'])"
const INPUT_SELECTOR = '[data-composer-input]'
const MODE_ATTRIBUTE = 'data-maid-composer-mode'
const CAPSULE_ATTRIBUTE = 'data-maid-composer-capsule'
const EXPANDING_ATTRIBUTE = 'data-maid-composer-expanding'
const MENU_OPEN_SELECTOR = "[aria-expanded='true']"
// Clicking inside an open popover must not count as leaving the composer.
const POPOVER_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[data-radix-popper-content-wrapper]',
  '[data-floating-ui-portal]',
].join(',')
const EXPAND_LIFETIME_MS = 280
// Excluded from the reconciliation path because none of their mutations can
// affect the composer state (same stance as the other skin controllers).
const HIGH_CHURN_SELECTOR = '.xterm'

interface SeatSnapshot {
  capsule: string | null
  expanding: string | null
}

interface CapsuleOwnership {
  token: symbol
  originals: Map<HTMLElement, SeatSnapshot>
}

const ownershipByDocument = new WeakMap<Document, CapsuleOwnership>()

function phaseRootOf(element: Element): HTMLElement | null {
  let candidate: Element | null = element
  while (candidate !== null) {
    if (
      candidate instanceof HTMLElement
      && candidate.hasAttribute('data-phase')
      && candidate.querySelector(':scope > [data-conversation-scroll]') !== null
    ) return candidate
    candidate = candidate.parentElement
  }
  return null
}

function belongsToHighChurnSubtree(node: Node): boolean {
  if (node instanceof Element) {
    return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null
  }
  return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null
}

/**
 * @param body - skin owning element (document.body) used to reach the
 * document; the mode attribute lives on documentElement.
 */
export function installMaidComposerCapsule(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const token = Symbol('maid-composer-capsule')
  const ownership = ownershipByDocument.get(doc) ?? { token, originals: new Map() }
  ownership.token = token
  ownershipByDocument.set(doc, ownership)
  const current = (): boolean => ownership.token === token
  const remember = (seat: HTMLElement): void => {
    if (ownership.originals.has(seat)) return
    ownership.originals.set(seat, {
      capsule: seat.getAttribute(CAPSULE_ATTRIBUTE),
      expanding: seat.getAttribute(EXPANDING_ATTRIBUTE),
    })
  }
  const write = (seat: HTMLElement, attribute: string, value: string | null): void => {
    if (!current()) return
    remember(seat)
    if (value === null) seat.removeAttribute(attribute)
    else seat.setAttribute(attribute, value)
  }
  const restoreAttribute = (seat: HTMLElement, attribute: string): void => {
    if (!current()) return
    const snapshot = ownership.originals.get(seat)
    if (snapshot === undefined) return
    const value = attribute === CAPSULE_ATTRIBUTE ? snapshot.capsule : snapshot.expanding
    if (value === null) seat.removeAttribute(attribute)
    else seat.setAttribute(attribute, value)
  }
  const restoreSeat = (seat: HTMLElement, snapshot: SeatSnapshot): void => {
    if (snapshot.capsule === null) seat.removeAttribute(CAPSULE_ATTRIBUTE)
    else seat.setAttribute(CAPSULE_ATTRIBUTE, snapshot.capsule)
    if (snapshot.expanding === null) seat.removeAttribute(EXPANDING_ATTRIBUTE)
    else seat.setAttribute(EXPANDING_ATTRIBUTE, snapshot.expanding)
  }
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const wasCapsule = new WeakMap<HTMLElement, boolean>()
  // Once the user touches the composer card (focus, typing, clicking its
  // chrome), the capsule must not collapse behind their cursor: clicking the
  // card's non-text areas blur the editor, and an unconditional empty+
  // unfocused rule would fold it immediately. Only an explicit click outside
  // the card area (transcript, todo, sidebar - but not an open popover)
  // re-arms the automatic collapse.
  const interacted = new WeakMap<HTMLElement, boolean>()

  const schedule = (callback: () => void, delay: number): void => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const capsuleMode = (): boolean => doc.documentElement.getAttribute(MODE_ATTRIBUTE) === 'capsule'

  const synchronize = (): void => {
    if (!current()) return
    const active = capsuleMode()
    doc.querySelectorAll<HTMLElement>(SEAT_SELECTOR).forEach((seat) => {
      const root = phaseRootOf(seat)
      const scrollport = seat.closest<HTMLElement>(SCROLLPORT_SELECTOR)
      const pending: () => void = () => {
        remember(seat)
        restoreAttribute(seat, CAPSULE_ATTRIBUTE)
        restoreAttribute(seat, EXPANDING_ATTRIBUTE)
      }
      if (
        !active
        || root?.dataset.phase !== 'active'
        || scrollport === null
        || scrollport.querySelector(CHAT_FLOW_SELECTOR) === null
      ) {
        wasCapsule.set(seat, false)
        pending()
        return
      }
      const card = seat.querySelector<HTMLElement>(CARD_SELECTOR)
      const input = card?.querySelector<HTMLElement>(INPUT_SELECTOR) ?? null
      if (card === null || input === null) {
        wasCapsule.set(seat, false)
        pending()
        return
      }
      const empty = (input.textContent ?? '').trim() === ''
      const focused = card.contains(doc.activeElement)
      const menuOpen = card.querySelector(MENU_OPEN_SELECTOR) !== null
      const next = empty && !focused && !menuOpen && interacted.get(seat) !== true
      const previous = wasCapsule.get(seat) === true
      wasCapsule.set(seat, next)
      if (next) {
        write(seat, CAPSULE_ATTRIBUTE, '')
        restoreAttribute(seat, EXPANDING_ATTRIBUTE)
        return
      }
      restoreAttribute(seat, CAPSULE_ATTRIBUTE)
      if (previous) {
        // Fold -> expand: layout swaps instantly; the one-shot marker plays
        // a transform/opacity keyframe so the transition never reflows.
        write(seat, EXPANDING_ATTRIBUTE, '')
        schedule(() => { restoreAttribute(seat, EXPANDING_ATTRIBUTE) }, EXPAND_LIFETIME_MS)
      } else {
        restoreAttribute(seat, EXPANDING_ATTRIBUTE)
      }
    })
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element)) return
    const card = target.closest<HTMLElement>(CARD_SELECTOR)
    if (card !== null) {
      // Any interaction with the pill card (a click on its chrome, a drag
      // start on the card) owns the composer: never auto-collapse behind it.
      const seat = card.closest<HTMLElement>(SEAT_SELECTOR)
      if (seat !== null) interacted.set(seat, true)
      return
    }
    // Leaving the composer for the transcript, todo, or sidebar re-arms the
    // automatic collapse - but clicks inside an open popover are part of the
    // composer interaction and must not.
    if (target.closest(SEAT_SELECTOR) !== null || target.closest(POPOVER_SELECTOR) !== null) return
    doc.querySelectorAll<HTMLElement>(SEAT_SELECTOR).forEach(seat => { interacted.set(seat, false) })
    synchronize()
  }

  const onFocusIn = (event: FocusEvent): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(SEAT_SELECTOR)
    if (seat === null) return
    interacted.set(seat, true)
    synchronize()
  }

  const onFocusOut = (event: FocusEvent): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element) || target.closest(SEAT_SELECTOR) === null) return
    // The focus may move to a popover outside the seat; a microtask lets the
    // menu's own aria-expanded mutation land first so the capsule stays away
    // while the picker is open.
    queueMicrotask(synchronize)
  }

  const onInput = (event: Event): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(SEAT_SELECTOR)
    if (seat === null) return
    interacted.set(seat, true)
    synchronize()
  }

  const onClick = (event: MouseEvent): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element)) return
    // Only clicks landing on the pill card itself steal focus. Content bound
    // to the composer area (todo, queued messages, goal progress) may live
    // inside the seat or nearby and must never expand the capsule.
    const card = target.closest<HTMLElement>(CARD_SELECTOR)
    if (card === null) return
    const seat = card.closest<HTMLElement>(SEAT_SELECTOR)
    if (seat === null || !seat.hasAttribute(CAPSULE_ATTRIBUTE)) return
    const input = card.querySelector<HTMLElement>(INPUT_SELECTOR)
    if (input === null || card.contains(doc.activeElement)) return
    // Alpha 1 keeps the Lexical root inside the scrollport that capsule CSS
    // removes from layout. Reveal it before focus; focusin then performs the
    // full transition while the previous capsule state is still known.
    interacted.set(seat, true)
    restoreAttribute(seat, CAPSULE_ATTRIBUTE)
    input.focus({ preventScroll: true })
  }

  const touchComposerMutation = (record: MutationRecord): boolean => {
    if (record.type === 'attributes') {
      // A phase flip (hero/active/settling) re-owns every seat seat-wide.
      if (record.attributeName === 'data-phase') return true
      const element = record.target instanceof Element ? record.target : undefined
      return element?.closest(SEAT_SELECTOR) !== null
    }
    if (belongsToHighChurnSubtree(record.target)) return false
    if (record.target instanceof Element && record.target.closest(INPUT_SELECTOR) !== null) return false
    const changed = [...record.addedNodes, ...record.removedNodes]
    if (changed.length === 0) {
      return record.target instanceof Element && record.target.closest(SEAT_SELECTOR) !== null
    }
    if (changed.every(belongsToHighChurnSubtree)) return false
    const targetElement = record.target instanceof Element ? record.target : undefined
    return (targetElement?.closest(SEAT_SELECTOR) ?? null) !== null
      || (targetElement?.closest(SCROLLPORT_SELECTOR) ?? null) !== null
      || changed.some(node => (
        node instanceof Element
        && (node.matches([SEAT_SELECTOR, CARD_SELECTOR, INPUT_SELECTOR].join(', '))
          || node.querySelector([SEAT_SELECTOR, CARD_SELECTOR, INPUT_SELECTOR].join(', ')) !== null)
      ))
  }

  const observer = new MutationObserver((records) => {
    if (!records.some(touchComposerMutation)) return
    synchronize()
  })
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded', 'data-phase'],
  })

  // Switching the skin setting must apply or clear the capsule immediately,
  // without waiting for focus/input/mutation.
  const modeObserver = new MutationObserver(() => { synchronize() })
  modeObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [MODE_ATTRIBUTE],
  })

  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)
  doc.addEventListener('input', onInput, true)
  doc.addEventListener('click', onClick)
  synchronize()

  return () => {
    observer.disconnect()
    modeObserver.disconnect()
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    doc.removeEventListener('input', onInput, true)
    doc.removeEventListener('click', onClick)
    timers.forEach(timer => { clearTimeout(timer) })
    timers.clear()
    if (current()) {
      ownership.originals.forEach((snapshot, seat) => { restoreSeat(seat, snapshot) })
      ownership.originals.clear()
      ownershipByDocument.delete(doc)
    }
  }
}
