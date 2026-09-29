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
const TO_BOTTOM_SELECTOR = "button[class*='toBottom']"
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
// A wheel gesture on the draft scroller may keep scrolling the transcript for
// a short while afterwards: the host's InputBar forwards the delta once the
// capped draft box reaches its own edge, so the transcript scroll that follows
// the gesture is not a "scrolling back through history" intent.
const SEAT_GESTURE_WINDOW_MS = 200

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

/**
 * 置底模式以宿主「回到底部」按钮为基准：ui-chat 只在 reader 离开最新消息
 * （内部 atBottom 为假）时渲染该按钮，所以按钮出现即表示应当收起输入框，
 * 按钮缺席表示宿主仍认为停在尾部。距底部的几何判定只用于在按钮尚未渲染
 * （或宿主换掉该控件）时短路，正常滚到底部因此不会多一次 DOM 查询。
 */
function atConversationBottom(scrollport: HTMLElement): boolean {
  const distanceToBottom = scrollport.scrollHeight - scrollport.scrollTop - scrollport.clientHeight
  if (distanceToBottom <= BOTTOM_THRESHOLD) return true
  return scrollport.querySelector(TO_BOTTOM_SELECTOR) === null
}

/**
 * 回底控件的增删是置底判定唯一关心的结构变化。宿主在离开尾部之后才提交渲染，
 * 所以本模块读到的 scroll 事件往往仍对应旧 DOM，而该次事件之后可能不再有滚动：
 * 中键自动滚动与平滑滚动结束时就停在“按钮已经出现、输入框却没消失”。因此把
 * 控件的出现/消失本身当作事件源。transcript 内的高频变更先按容器排除。
 */
function touchesBackToBottom(record: MutationRecord): boolean {
  const target = record.target instanceof Element ? record.target : record.target.parentElement
  if (target?.closest(CHAT_FLOW_SELECTOR) !== null) return false
  for (const node of [...record.addedNodes, ...record.removedNodes]) {
    if (node instanceof Element
      && (node.matches(TO_BOTTOM_SELECTOR) || node.querySelector(TO_BOTTOM_SELECTOR) !== null)) return true
  }
  return false
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
  const token = Symbol('maid-composer-scroll')
  const ownership = ownershipByDocument.get(doc) ?? { token, originals: new Map() }
  ownership.token = token
  ownershipByDocument.set(doc, ownership)
  const current = (): boolean => ownership.token === token
  const remember = (seat: HTMLElement): void => {
    if (ownership.originals.has(seat)) return
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

  /** 置底判定与写入：滚动方向不参与，位置即状态。 */
  const applyBottomOnly = (scrollport: HTMLElement, seat: HTMLElement): void => {
    if (atConversationBottom(scrollport)) showSeat(seat)
    else hideSeat(seat)
  }

  // The host commits the back-to-bottom control after the scroll event this
  // module already read, and a gesture may end on that very event (middle-click
  // autoscroll, smooth scroll): the control is on screen while the seat stays
  // visible until the next scroll. Reacting to the control's own insertion and
  // removal removes that dependency on timing.
  const bottomObservers = new Map<HTMLElement, MutationObserver>()
  const observeBottomControl = (scrollport: HTMLElement): void => {
    if (bottomObservers.has(scrollport)) return
    const observer = new MutationObserver((records) => {
      if (!current() || activeMode(doc) !== 'bottom') return
      if (!records.some(touchesBackToBottom)) return
      const seat = activeSeatOf(scrollport)
      if (seat !== null) applyBottomOnly(scrollport, seat)
    })
    observer.observe(scrollport, { childList: true, subtree: true })
    bottomObservers.set(scrollport, observer)
  }
  // A conversation replaces its scrollport, so dropped ones are released on the
  // next sweep instead of accumulating for the life of the page.
  const releaseDetachedObservers = (): void => {
    bottomObservers.forEach((observer, scrollport) => {
      if (scrollport.isConnected) return
      observer.disconnect()
      bottomObservers.delete(scrollport)
    })
  }

  /** 开关打开或会话换新时立刻对齐一次，不必等待下一次滚动。 */
  const synchronizeBottomOnly = (): void => {
    if (!current() || activeMode(doc) !== 'bottom') return
    releaseDetachedObservers()
    doc.querySelectorAll<HTMLElement>(SCROLLPORT_SELECTOR).forEach((scrollport) => {
      const seat = activeSeatOf(scrollport)
      if (seat === null) return
      observeBottomControl(scrollport)
      applyBottomOnly(scrollport, seat)
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

    if (mode === 'bottom') {
      observeBottomControl(scrollport)
      applyBottomOnly(scrollport, seat)
      return
    }

    if (Date.now() < seatGestureUntil) return

    const distanceToBottom = scrollport.scrollHeight - top - scrollport.clientHeight
    if (distanceToBottom <= BOTTOM_THRESHOLD) {
      showSeat(seat)
      return
    }
    if (previousTop !== undefined && top > previousTop + SCROLL_THRESHOLD) showSeat(seat)
    else if (previousTop !== undefined && top < previousTop - SCROLL_THRESHOLD) hideSeat(seat)
  }

  const onWheel = (event: WheelEvent): void => {
    if (!current()) return
    const mode = activeMode(doc)
    // 置底模式只看位置，滚轮方向不再驱动座内状态。
    if (mode !== 'scroll') return
    // Checked before the delta threshold: touchpad inertia tails emit small
    // deltas that still chain onto the transcript via the host's forwarding.
    if (wheelTargetsSeatDraft(event)) {
      seatGestureUntil = Date.now() + SEAT_GESTURE_WINDOW_MS
      return
    }
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
    if (!current()) return
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
    else if (mode === 'bottom') synchronizeBottomOnly()
  })
  stateObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [MODE_ATTRIBUTE, BOTTOM_ONLY_ATTRIBUTE],
  })

  // Scroll does not bubble; capture on the document still sees each
  // scrollport's events, so no per-element binding lifecycle is needed.
  doc.addEventListener('scroll', onScroll, true)
  doc.addEventListener('wheel', onWheel, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)
  synchronizeBottomOnly()

  return () => {
    stateObserver.disconnect()
    bottomObservers.forEach(observer => { observer.disconnect() })
    bottomObservers.clear()
    doc.removeEventListener('scroll', onScroll, true)
    doc.removeEventListener('wheel', onWheel, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    if (current()) {
      clearSeatStates()
      ownership.originals.clear()
      ownershipByDocument.delete(doc)
    }
  }
}
