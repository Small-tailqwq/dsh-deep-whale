/**
 * Composer scroll-intent presentation: scrolling up through the transcript
 * fades the docked composer out, scrolling back down (or reaching the
 * bottom) fades it in. Ported from the ORCA LINK approach (see
 * orca-link/src/client/composer-motion.ts) and gated by the skin-manager
 * setting `composerMode` (`data-maid-composer-mode` on <html>, owned by
 * installMaidCustomization; active only for the 'scroll' choice).
 *
 * The module only presents a reversible visibility state on the host's
 * stable data hooks; it never submits prompts or creates sessions. When the
 * switch is off (or the manager has not applied a state yet), every listener
 * stays inert and no seat state is touched.
 */
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]'
const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
const CHAT_FLOW_SELECTOR = '[data-chat-flow]'
const MODE_ATTRIBUTE = 'data-maid-composer-mode'
const HIDDEN_ATTRIBUTE = 'data-maid-composer-hidden'
const INTERACTIVE_ATTRIBUTE = 'data-maid-composer-interactive'
const NESTED_SCROLL_SURFACE_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[data-radix-popper-content-wrapper]',
  '[data-floating-ui-portal]',
].join(',')

const SCROLL_THRESHOLD = 10
const BOTTOM_THRESHOLD = 24

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

function scrollEnabled(doc: Document): boolean {
  return doc.documentElement.getAttribute(MODE_ATTRIBUTE) === 'scroll'
}

function activeSeatOf(scrollport: HTMLElement): HTMLElement | null {
  const root = phaseRootOf(scrollport)
  if (root?.dataset.phase !== 'active') return null
  // The inspector overlay mounts an extra scrollport without a chat flow; its
  // seat is already display:none'd by the skin and must not be driven. Only
  // transcript scrollports own the gesture (same gate as the CSS contract).
  if (scrollport.querySelector(CHAT_FLOW_SELECTOR) === null) return null
  return scrollport.querySelector<HTMLElement>(COMPOSER_SEAT_SELECTOR)
}

/**
 * Wheeling inside an open popover (model picker, mode list, attachments)
 * must not drive the composer state. Any scrollable element on the event
 * path before the transcript scrollport owns the gesture.
 */
function wheelBelongsToNestedSurface(event: WheelEvent, scrollport: HTMLElement): boolean {
  for (const candidate of event.composedPath()) {
    if (candidate === scrollport) break
    if (!(candidate instanceof HTMLElement)) continue
    if (candidate.matches(NESTED_SCROLL_SURFACE_SELECTOR)) return true

    const style = getComputedStyle(candidate)
    if (!/(auto|scroll)/.test(style.overflowY) || candidate.scrollHeight <= candidate.clientHeight) continue
    if (event.deltaY < 0 && candidate.scrollTop > 0) return true
    if (event.deltaY > 0 && candidate.scrollTop + candidate.clientHeight < candidate.scrollHeight) return true
  }
  return false
}

function clearSeatStates(doc: Document): void {
  doc.querySelectorAll<HTMLElement>(COMPOSER_SEAT_SELECTOR).forEach((seat) => {
    seat.removeAttribute(HIDDEN_ATTRIBUTE)
    seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
  })
}

/**
 * @param body - skin owning element (document.body) used to reach the
 * document; the switch attribute lives on documentElement.
 */
export function installMaidComposerScroll(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  // Baseline per scrollport, established lazily so a freshly mounted
  // conversation never reacts to its first tear-down style pass.
  const lastTops = new WeakMap<HTMLElement, number>()

  const blurSeat = (seat: HTMLElement): void => {
    const active = doc.activeElement
    if (active instanceof HTMLElement && seat.contains(active)) active.blur()
  }

  const hideSeat = (seat: HTMLElement): void => {
    if (!scrollEnabled(doc)) return
    seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
    blurSeat(seat)
    seat.setAttribute(HIDDEN_ATTRIBUTE, '')
  }

  const showSeat = (seat: HTMLElement): void => {
    seat.removeAttribute(HIDDEN_ATTRIBUTE)
  }

  const activateSeat = (seat: HTMLElement): void => {
    showSeat(seat)
    seat.setAttribute(INTERACTIVE_ATTRIBUTE, '')
    if (!scrollEnabled(doc)) seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
  }

  const onScroll = (event: Event): void => {
    if (!scrollEnabled(doc)) return
    const scrollport = event.target
    if (!(scrollport instanceof HTMLElement) || !scrollport.matches(SCROLLPORT_SELECTOR)) return
    const seat = activeSeatOf(scrollport)
    if (seat === null) return

    const top = scrollport.scrollTop
    const previousTop = lastTops.get(scrollport)
    lastTops.set(scrollport, top)

    const distanceToBottom = scrollport.scrollHeight - top - scrollport.clientHeight
    if (distanceToBottom <= BOTTOM_THRESHOLD) {
      showSeat(seat)
      return
    }
    if (previousTop !== undefined && top > previousTop + SCROLL_THRESHOLD) showSeat(seat)
    else if (previousTop !== undefined && top < previousTop - SCROLL_THRESHOLD) hideSeat(seat)
  }

  const onWheel = (event: WheelEvent): void => {
    if (!scrollEnabled(doc)) return
    if (Math.abs(event.deltaY) <= SCROLL_THRESHOLD) return

    for (const candidate of event.composedPath()) {
      if (!(candidate instanceof HTMLElement) || !candidate.matches(SCROLLPORT_SELECTOR)) continue
      const scrollport = candidate
      if (wheelBelongsToNestedSurface(event, scrollport)) return
      const seat = activeSeatOf(scrollport)
      if (seat === null) return
      if (!lastTops.has(scrollport)) lastTops.set(scrollport, scrollport.scrollTop)
      if (event.deltaY < 0) hideSeat(seat)
      else showSeat(seat)
      return
    }
  }

  const onFocusIn = (event: FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat !== null && phaseRootOf(seat)?.dataset.phase === 'active') activateSeat(seat)
  }

  const onFocusOut = (event: FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat === null) return
    queueMicrotask(() => {
      if (!seat.contains(doc.activeElement)) seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
    })
  }

  // Toggling the setting off must immediately restore every seat instead of
  // waiting for the next scroll gesture.
  const stateObserver = new MutationObserver((records) => {
    if (!records.some(record => record.type === 'attributes' && record.attributeName === MODE_ATTRIBUTE)) return
    if (!scrollEnabled(doc)) clearSeatStates(doc)
  })
  stateObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [MODE_ATTRIBUTE],
  })

  // Scroll does not bubble; capture on the document still sees each
  // scrollport's events, so no per-element binding lifecycle is needed.
  doc.addEventListener('scroll', onScroll, true)
  doc.addEventListener('wheel', onWheel, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)

  return () => {
    stateObserver.disconnect()
    doc.removeEventListener('scroll', onScroll, true)
    doc.removeEventListener('wheel', onWheel, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    clearSeatStates(doc)
  }
}
