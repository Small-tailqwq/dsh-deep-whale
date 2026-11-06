import { installComposerEditing } from '../../../shared/composer-editing.ts'

/**
 * Composer visibility presentation, driven by two skin-manager settings
 * (attributes on <html>, owned by installMaidCustomization):
 *
 * - `composerMode` ('scroll'): scrolling up through the transcript fades the
 *   docked composer out, scrolling back down (or reaching the bottom) fades
 *   it in. Ported from the ORCA LINK approach (see
 *   orca-link/src/client/composer-motion.ts).
 * - `composerBottomOnly`: position instead of direction — the composer is
 *   shown only while the reader sits at the newest message and disappears
 *   while reading back. Turning it on takes over the 'scroll' mode entirely.
 *
 * The module only presents a reversible visibility state on the host's
 * stable data hooks; it never submits prompts or creates sessions. When
 * neither switch is on (or the manager has not applied a state yet), every
 * listener stays inert and no seat state is touched.
 */
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]'
const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
const CHAT_FLOW_SELECTOR = '[data-chat-flow]'
const MODE_ATTRIBUTE = 'data-maid-composer-mode'
const BOTTOM_ONLY_ATTRIBUTE = 'data-maid-composer-bottom-only'
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

const TAIL_HIDE_THRESHOLD = 24
// A wheel gesture on the draft scroller may keep scrolling the transcript for
// a short while afterwards: the host's InputBar forwards the delta once the
// capped draft box reaches its own edge, so the transcript scroll that follows
// the gesture is not a "scrolling back through history" intent.
const SEAT_GESTURE_WINDOW_MS = 200
// Focusing the composer on a phone raises the soft keyboard, which resizes the
// viewport and lets the browser scroll the transcript to reveal the caret. That
// scroll is not reading intent either; hiding on it would blur the composer and
// drop the keyboard the reader just asked for.
const KEYBOARD_SETTLE_MS = 800
// Geometry notifications arrive every frame while the host drags the column
// width, toggles fullscreen or streams a reply. Host tasks that run after the
// frame (scheduler work, deferred reads) may have dirtied style again, so any
// read in that window can force a full transcript pass. Read once the layout
// has been quiet for a moment, and at most this often while it keeps moving.
const GEOMETRY_SETTLE_MS = 120
const GEOMETRY_MAX_WAIT_MS = 500

interface SeatSnapshot {
  hidden: string | null
  interactive: string | null
}

interface ScrollOwnership {
  token: symbol
  originals: Map<HTMLElement, SeatSnapshot>
}

const ownershipByDocument = new WeakMap<Document, ScrollOwnership>()

function phaseRootOf(element: Element): HTMLElement | null {
  let candidate = element.closest<HTMLElement>('[data-phase]')
  while (candidate !== null) {
    const scrollport = candidate.querySelector<HTMLElement>(SCROLLPORT_SELECTOR)
    if (scrollport?.closest('[data-phase]') === candidate) return candidate
    candidate = candidate.parentElement?.closest<HTMLElement>('[data-phase]') ?? null
  }
  return null
}

function scrollEnabled(doc: Document): boolean {
  return doc.documentElement.getAttribute(MODE_ATTRIBUTE) === 'scroll'
}

/** 「输入框置底」只跟随「是否停在最新消息处」，不再跟随滚动方向。 */
function bottomOnlyEnabled(doc: Document): boolean {
  return doc.documentElement.getAttribute(BOTTOM_ONLY_ATTRIBUTE) === 'on'
}

/** 当前生效的显隐模式；置底优先，两者皆无时模块保持惰性。 */
function activeMode(doc: Document): 'bottom' | 'scroll' | null {
  if (bottomOnlyEnabled(doc)) return 'bottom'
  return scrollEnabled(doc) ? 'scroll' : null
}

/** The sticky seat is outside the transcript; a tall ask must not count as unread history. */
function tailDistance(scrollport: HTMLElement): number | null {
  const flow = scrollport.querySelector<HTMLElement>(CHAT_FLOW_SELECTOR)
  if (flow === null || scrollport.clientHeight <= 0) return null
  const viewportBottom = scrollport.getBoundingClientRect().top + scrollport.clientTop + scrollport.clientHeight
  return flow.getBoundingClientRect().bottom - viewportBottom
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

/**
 * The host composer renders the draft in a capped scroll box
 * (`overflow-y: auto` with `max-height`) inside the seat. A wheel gesture on
 * that box belongs to the draft outright — including once it reaches its edge,
 * where the host forwards the delta to the transcript. Driving the hide state
 * from that forwarded scroll would hide (and blur) the composer whose long
 * draft the user is reading, so such gestures never steer the seat.
 */
function wheelTargetsSeatDraft(event: WheelEvent): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  const seat = target.closest(COMPOSER_SEAT_SELECTOR)
  if (seat === null) return false
  for (const candidate of event.composedPath()) {
    if (candidate === seat) break
    if (!(candidate instanceof HTMLElement)) continue
    const style = getComputedStyle(candidate)
    if (!/(auto|scroll)/.test(style.overflowY)) continue
    if (candidate.scrollHeight > candidate.clientHeight + 1) return true
  }
  return false
}

/**
 * @param body - skin owning element (document.body) used to reach the
 * document; the switch attribute lives on documentElement.
 */
export function installMaidComposerScroll(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  let editing: ReturnType<typeof installComposerEditing> | undefined
  const token = Symbol('maid-composer-scroll')
  const ownership = ownershipByDocument.get(doc) ?? { token, originals: new Map() }
  ownership.token = token
  ownershipByDocument.set(doc, ownership)
  const current = (): boolean => ownership.token === token
  const remember = (seat: HTMLElement): void => {
    if (ownership.originals.has(seat)) return
    // A conversation switch drops the old seat with its whole transcript; a
    // detached seat has nothing left to restore, and its snapshot would keep
    // that tree alive, so it goes before a new seat is remembered.
    ownership.originals.forEach((_, remembered) => {
      if (!remembered.isConnected) ownership.originals.delete(remembered)
    })
    ownership.originals.set(seat, {
      hidden: seat.getAttribute(HIDDEN_ATTRIBUTE),
      interactive: seat.getAttribute(INTERACTIVE_ATTRIBUTE),
    })
  }
  const write = (seat: HTMLElement, attribute: string, value: string | null): void => {
    if (!current()) return
    remember(seat)
    if (value === null) seat.removeAttribute(attribute)
    else seat.setAttribute(attribute, value)
  }
  const restoreSeat = (seat: HTMLElement, snapshot: SeatSnapshot): void => {
    if (snapshot.hidden === null) seat.removeAttribute(HIDDEN_ATTRIBUTE)
    else seat.setAttribute(HIDDEN_ATTRIBUTE, snapshot.hidden)
    if (snapshot.interactive === null) seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
    else seat.setAttribute(INTERACTIVE_ATTRIBUTE, snapshot.interactive)
  }
  const clearSeatStates = (): void => {
    if (!current()) return
    ownership.originals.forEach((snapshot, seat) => { restoreSeat(seat, snapshot) })
  }
  // Baseline per scrollport, established lazily so a freshly mounted
  // conversation never reacts to its first tear-down style pass.
  const lastTops = new WeakMap<HTMLElement, number>()

  const blurSeat = (seat: HTMLElement): void => {
    const active = doc.activeElement
    if (active instanceof HTMLElement && seat.contains(active)) active.blur()
  }

  const hideSeat = (seat: HTMLElement): void => {
    if (!current() || activeMode(doc) === null) return
    if (editing?.isEditing(seat)) return
    // The verdict runs again on every scroll frame, on control mounts and on
    // switch flips; a same-value write is still a mutation record that every
    // other observer and style pass pays for, so a settled state returns early.
    if (seat.hasAttribute(HIDDEN_ATTRIBUTE)) return
    write(seat, INTERACTIVE_ATTRIBUTE, null)
    blurSeat(seat)
    write(seat, HIDDEN_ATTRIBUTE, '')
  }

  const showSeat = (seat: HTMLElement): void => {
    if (!seat.hasAttribute(HIDDEN_ATTRIBUTE)) return
    write(seat, HIDDEN_ATTRIBUTE, null)
  }

  const activateSeat = (seat: HTMLElement): void => {
    showSeat(seat)
    write(seat, INTERACTIVE_ATTRIBUTE, '')
    if (activeMode(doc) === null) write(seat, INTERACTIVE_ATTRIBUTE, null)
  }

  // Separate hide/show boundaries keep the seat stable near the viewport edge.
  const applyBottomOnly = (scrollport: HTMLElement, seat: HTMLElement): void => {
    const distance = tailDistance(scrollport)
    if (distance === null || distance <= 0) showSeat(seat)
    else if (distance > TAIL_HIDE_THRESHOLD) hideSeat(seat)
  }

  const geometryBindings = new Map<HTMLElement, { seat: HTMLElement, flow: HTMLElement, observer: ResizeObserver }>()
  // ResizeObserver delivers inside the rendering update, after host observers
  // earlier in the same delivery have written inherited custom properties on
  // the conversation root (width axis, composer height). Reading geometry
  // there forces one more full transcript style pass in that frame. The read
  // waits for the burst to settle (GEOMETRY_SETTLE_MS) and coalesces every
  // notification of the burst into one read per scrollport.
  const pendingGeometry = new Map<HTMLElement, HTMLElement>()
  let geometryTask: ReturnType<typeof setTimeout> | undefined
  let geometryDeadline = 0
  const cancelGeometry = (): void => {
    if (geometryTask !== undefined) clearTimeout(geometryTask)
    geometryTask = undefined
    pendingGeometry.clear()
  }
  const releaseGeometryObservers = (): void => {
    geometryBindings.forEach(binding => { binding.observer.disconnect() })
    geometryBindings.clear()
    cancelGeometry()
  }
  const reconcileGeometry = (scrollport: HTMLElement, seat: HTMLElement): void => {
    if (!current() || activeSeatOf(scrollport) !== seat) return
    if (activeMode(doc) === 'bottom') applyBottomOnly(scrollport, seat)
    else if (activeMode(doc) === 'scroll') {
      // Growing streamed content may move the tail off screen without reader
      // intent. Only an upward scroll hides; layout changes can restore it.
      const distance = tailDistance(scrollport)
      if (distance === null || distance <= 0) showSeat(seat)
    }
  }
  const flushGeometry = (): void => {
    geometryTask = undefined
    const queued = [...pendingGeometry]
    pendingGeometry.clear()
    queued.forEach(([scrollport, seat]) => { reconcileGeometry(scrollport, seat) })
  }
  const scheduleGeometry = (scrollport: HTMLElement, seat: HTMLElement): void => {
    pendingGeometry.set(scrollport, seat)
    const now = Date.now()
    if (geometryTask === undefined) geometryDeadline = now + GEOMETRY_MAX_WAIT_MS
    else clearTimeout(geometryTask)
    const delay = Math.max(0, Math.min(GEOMETRY_SETTLE_MS, geometryDeadline - now))
    geometryTask = setTimeout(flushGeometry, delay)
  }
  const observeGeometry = (scrollport: HTMLElement, seat: HTMLElement): void => {
    const flow = scrollport.querySelector<HTMLElement>(CHAT_FLOW_SELECTOR)
    const previous = geometryBindings.get(scrollport)
    if (previous?.seat === seat && previous.flow === flow) return
    geometryBindings.forEach((binding, bound) => {
      if (bound.isConnected) return
      binding.observer.disconnect()
      geometryBindings.delete(bound)
    })
    previous?.observer.disconnect()
    geometryBindings.delete(scrollport)
    if (flow === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => { scheduleGeometry(scrollport, seat) })
    geometryBindings.set(scrollport, { seat, flow, observer })
    observer.observe(scrollport)
    observer.observe(flow)
    observer.observe(seat)
  }

  /** Observe only the three layout owners, including ask takeover and viewport resizing. */
  const synchronizeGeometry = (): void => {
    if (!current()) return
    geometryBindings.forEach((binding, scrollport) => {
      if (scrollport.isConnected && activeSeatOf(scrollport) === binding.seat) return
      binding.observer.disconnect()
      geometryBindings.delete(scrollport)
    })
    if (activeMode(doc) === null) {
      releaseGeometryObservers()
      return
    }
    doc.querySelectorAll<HTMLElement>(SCROLLPORT_SELECTOR).forEach((scrollport) => {
      const seat = activeSeatOf(scrollport)
      if (seat === null) return
      observeGeometry(scrollport, seat)
      reconcileGeometry(scrollport, seat)
    })
  }

  // Timestamp until which transcript scrolls are treated as forwarded draft
  // gestures (see SEAT_GESTURE_WINDOW_MS) rather than scroll-intent.
  let seatGestureUntil = 0

  const onScroll = (event: Event): void => {
    if (!current()) return
    const scrollport = event.target
    if (!(scrollport instanceof HTMLElement) || !scrollport.matches(SCROLLPORT_SELECTOR)) return
    const mode = activeMode(doc)
    if (mode === null) return
    const seat = activeSeatOf(scrollport)
    if (seat === null) return

    const top = scrollport.scrollTop
    const previousTop = lastTops.get(scrollport)
    lastTops.set(scrollport, top)

    observeGeometry(scrollport, seat)
    // Bottom-only is position-based, so forwarded draft scrolls still settle it.
    if (mode === 'bottom') {
      applyBottomOnly(scrollport, seat)
      return
    }
    if (Date.now() < seatGestureUntil) return

    const distance = tailDistance(scrollport)
    if (distance === null || distance <= 0) {
      showSeat(seat)
      return
    }
    if (previousTop !== undefined && top > previousTop) showSeat(seat)
    else if (previousTop !== undefined && top < previousTop && distance > TAIL_HIDE_THRESHOLD) hideSeat(seat)
  }

  const onWheel = (event: WheelEvent): void => {
    if (!current()) return
    const mode = activeMode(doc)
    if (mode === null) return
    // Inertia tails also belong to the draft, even with tiny wheel deltas.
    if (wheelTargetsSeatDraft(event)) {
      seatGestureUntil = Math.max(seatGestureUntil, Date.now() + SEAT_GESTURE_WINDOW_MS)
      return
    }
    for (const candidate of event.composedPath()) {
      if (!(candidate instanceof HTMLElement) || !candidate.matches(SCROLLPORT_SELECTOR)) continue
      const scrollport = candidate
      if (wheelBelongsToNestedSurface(event, scrollport)) return
      const seat = activeSeatOf(scrollport)
      if (seat === null) return
      if (!lastTops.has(scrollport)) lastTops.set(scrollport, scrollport.scrollTop)
      // Wheel direction alone does not imply that the transcript moved.
      return
    }
  }

  const settleKeyboard = (): void => {
    seatGestureUntil = Math.max(seatGestureUntil, Date.now() + KEYBOARD_SETTLE_MS)
  }

  const onFocusIn = (event: FocusEvent): void => {
    if (!current()) return
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat === null || phaseRootOf(seat)?.dataset.phase !== 'active') return
    activateSeat(seat)
    settleKeyboard()
  }

  // The keyboard keeps resizing the viewport while it animates in and out.
  const onViewportResize = (): void => {
    if (!current() || activeMode(doc) === null) return
    if ((doc.activeElement?.closest(COMPOSER_SEAT_SELECTOR) ?? null) !== null) settleKeyboard()
  }

  const onFocusOut = (event: FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const seat = target.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat === null) return
    queueMicrotask(() => {
      if (current() && !seat.contains(doc.activeElement)) write(seat, INTERACTIVE_ATTRIBUTE, null)
    })
  }

  // Toggling either switch must take effect at once instead of waiting for the
  // next scroll gesture: with every mode off each seat is restored, and the
  // bottom-only mode aligns every seat with the current scroll position.
  const stateObserver = new MutationObserver((records) => {
    if (!current()) return
    if (!records.some(record => record.type === 'attributes'
      && (record.attributeName === MODE_ATTRIBUTE || record.attributeName === BOTTOM_ONLY_ATTRIBUTE))) return
    const mode = activeMode(doc)
    if (mode === null) clearSeatStates()
    syncStructureObserver()
    synchronizeGeometry()
  })
  stateObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [MODE_ATTRIBUTE, BOTTOM_ONLY_ATTRIBUTE],
  })

  const structureObserver = new MutationObserver((records) => {
    if (!current()) return
    editing?.handleMutations(records)
    const hooks = `${SCROLLPORT_SELECTOR}, ${COMPOSER_SEAT_SELECTOR}, ${CHAT_FLOW_SELECTOR}`
    if (!records.some(record => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement
      if (target?.closest(`${CHAT_FLOW_SELECTOR}, ${COMPOSER_SEAT_SELECTOR}`)) return false
      if (record.type === 'attributes') return true
      return [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && (node.matches(hooks) || node.querySelector(hooks) !== null))
    })) return
    synchronizeGeometry()
  })
  let observingStructure = false
  const syncStructureObserver = (): void => {
    const on = activeMode(doc) !== null
    if (on === observingStructure) return
    observingStructure = on
    if (on) structureObserver.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] })
    else structureObserver.disconnect()
  }

  // Scroll does not bubble; capture on the document still sees each
  // scrollport's events, so no per-element binding lifecycle is needed.
  doc.addEventListener('scroll', onScroll, true)
  doc.addEventListener('wheel', onWheel, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)
  const view = doc.defaultView
  view?.addEventListener('resize', onViewportResize)
  view?.visualViewport?.addEventListener('resize', onViewportResize)
  syncStructureObserver()
  synchronizeGeometry()
  editing = installComposerEditing(doc, (seat) => {
    if (!current() || activeMode(doc) === null || phaseRootOf(seat)?.dataset.phase !== 'active') return false
    activateSeat(seat)
    return true
  })

  return () => {
    editing?.dispose()
    stateObserver.disconnect()
    structureObserver.disconnect()
    releaseGeometryObservers()
    doc.removeEventListener('scroll', onScroll, true)
    doc.removeEventListener('wheel', onWheel, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    view?.removeEventListener('resize', onViewportResize)
    view?.visualViewport?.removeEventListener('resize', onViewportResize)
    if (current()) {
      clearSeatStates()
      ownership.originals.clear()
      ownershipByDocument.delete(doc)
    }
  }
}
