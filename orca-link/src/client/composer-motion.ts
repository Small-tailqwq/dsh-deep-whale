import { MANUAL_HIDDEN_ATTRIBUTE } from './composer-collapse.ts'
import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
const COMPOSER_CARD_SELECTOR = '[data-composer-card]'
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]'
const CHAT_FLOW_SELECTOR = '[data-chat-flow]'
const NESTED_SCROLL_SURFACE_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[data-radix-popper-content-wrapper]',
  '[data-floating-ui-portal]',
].join(',')

const ENTER_ATTRIBUTE = 'data-orca-composer-entering'
const HIDDEN_ATTRIBUTE = 'data-orca-composer-hidden'
const INTERACTIVE_ATTRIBUTE = 'data-orca-composer-interactive'
const MOTION_ATTRIBUTE = 'data-orca-composer-motion'
const GHOST_ATTRIBUTE = 'data-orca-composer-ghost'
const OUTSIDE_CHAT_ATTRIBUTE = 'data-orca-composer-outside-chat'

const SCROLL_THRESHOLD = 10
const BOTTOM_THRESHOLD = 24
const GHOST_LIFETIME_MS = 260
const ENTER_LIFETIME_MS = 820
// A submit press on the hero card only arms a snapshot of how that card looks
// right now; the host leaving the hero phase is what turns the snapshot into
// the exit ghost. An unconsumed snapshot expires instead of hiding anything, so
// a candidate menu — or any other overlay that takes the key — leaves the
// composer exactly as it was.
const EXIT_SNAPSHOT_LIFETIME_MS = 800
// The seat's own transition runs 300ms (opacity) / 340ms (transform).
const MOTION_LIFETIME_MS = 360
// A wheel gesture on the draft scroller may keep scrolling the transcript for
// a short while afterwards: the host's InputBar forwards the delta once the
// capped draft box reaches its own edge, so the transcript scroll that follows
// the gesture is not a "scrolling back through history" intent.
const SEAT_GESTURE_WINDOW_MS = 200

interface ScrollBinding {
  lastTop: number | null
  dispose: () => void
}

interface ExitSnapshot {
  seat: HTMLElement
  ghost: HTMLElement
}

function phaseRootOf(element: Element): HTMLElement | null {
  let candidate: Element | null = element
  while (candidate !== null) {
    if (candidate instanceof HTMLElement && candidate.hasAttribute('data-phase')) {
      const scrollport = candidate.querySelector<HTMLElement>(SCROLLPORT_SELECTOR)
      if (scrollport?.closest('[data-phase]') === candidate) return candidate
    }
    candidate = candidate.parentElement
  }
  return null
}

function seatOf(element: Element): HTMLElement | null {
  if (element.matches(COMPOSER_SEAT_SELECTOR)) return element as HTMLElement
  return element.querySelector<HTMLElement>(COMPOSER_SEAT_SELECTOR)
}

function activeSeatOf(scrollport: HTMLElement): HTMLElement | null {
  const root = phaseRootOf(scrollport)
  if (root?.dataset.phase !== 'active') return null
  const seat = scrollport.querySelector<HTMLElement>(COMPOSER_SEAT_SELECTOR)
  if (seat?.hasAttribute(OUTSIDE_CHAT_ATTRIBUTE)) return null
  return seat
}

function composerBelongsToConversation(root: HTMLElement): boolean {
  const phase = root.dataset.phase ?? ''
  if (phase === 'hero' || phase === 'settling') return true
  return phase === 'active' && root.querySelector(CHAT_FLOW_SELECTOR) !== null
}

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
 * Own the ORCA composer transition and scroll-intent presentation. This
 * module observes the host's stable data hooks; it never submits prompts or
 * creates sessions itself. The hero exit is driven by the host's own phase
 * change: a press only snapshots the card, and the ghost plays once the host
 * confirms the submit by leaving the hero phase.
 */
export function installOrcaComposerMotion(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const phases = new WeakMap<HTMLElement, string>()
  const scrollBindings = new Map<HTMLElement, ScrollBinding>()
  // Timestamp until which transcript scrolls are treated as forwarded draft
  // gestures (see SEAT_GESTURE_WINDOW_MS) rather than scroll-intent.
  let seatGestureUntil = 0
  let hasSeenHero = false
  let exitSnapshot: ExitSnapshot | null = null
  let exitSnapshotTimer: ReturnType<typeof setTimeout> | undefined

  const schedule = (callback: () => void, delay: number): void => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const motionTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

  // Keep the promotion hint for the transition window only: a seat that stays
  // promoted renders the composer dock (the goal banner inside it included) on
  // the scaled compositor raster instead of the crisp 1:1 one.
  const markMotion = (seat: HTMLElement): void => {
    const previous = motionTimers.get(seat)
    if (previous !== undefined) {
      clearTimeout(previous)
      timers.delete(previous)
    }
    seat.setAttribute(MOTION_ATTRIBUTE, '')
    const timer = setTimeout(() => {
      timers.delete(timer)
      motionTimers.delete(seat)
      seat.removeAttribute(MOTION_ATTRIBUTE)
    }, MOTION_LIFETIME_MS)
    timers.add(timer)
    motionTimers.set(seat, timer)
  }

  const removeMotionAttributes = (seat: HTMLElement): void => {
    seat.removeAttribute(ENTER_ATTRIBUTE)
    seat.removeAttribute(HIDDEN_ATTRIBUTE)
    seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
    seat.removeAttribute(MOTION_ATTRIBUTE)
    seat.removeAttribute(OUTSIDE_CHAT_ATTRIBUTE)
    seat.style.removeProperty('--orca-composer-enter-distance')
  }

  const blurSeat = (seat: HTMLElement): void => {
    const active = doc.activeElement
    if (active instanceof HTMLElement && seat.contains(active)) active.blur()
  }

  const isManualMotion = (seat: HTMLElement): boolean => seat.matches(
    '[data-orca-composer-manual-hidden], [data-orca-composer-collapse-dragging], [data-orca-composer-collapse-rebounding], [data-orca-composer-restoring]',
  )

  const showSeat = (seat: HTMLElement): void => {
    if (isManualMotion(seat)) return
    if (!seat.hasAttribute(HIDDEN_ATTRIBUTE)) return
    markMotion(seat)
    seat.removeAttribute(HIDDEN_ATTRIBUTE)
  }

  const hideSeat = (seat: HTMLElement): void => {
    if (isManualMotion(seat)) return
    if (!seat.hasAttribute(HIDDEN_ATTRIBUTE)) markMotion(seat)
    seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
    blurSeat(seat)
    seat.removeAttribute(ENTER_ATTRIBUTE)
    seat.setAttribute(HIDDEN_ATTRIBUTE, '')
  }

  const activateSeat = (seat: HTMLElement, interruptEntry = false): void => {
    if (isManualMotion(seat)) return
    showSeat(seat)
    if (interruptEntry) seat.removeAttribute(ENTER_ATTRIBUTE)
    seat.setAttribute(INTERACTIVE_ATTRIBUTE, '')
  }

  const enterSeat = (seat: HTMLElement): void => {
    if (isManualMotion(seat)) return
    seat.removeAttribute(HIDDEN_ATTRIBUTE)
    const card = seat.querySelector<HTMLElement>(COMPOSER_CARD_SELECTOR)
    if (card === null) return
    const top = card.getBoundingClientRect().top
    seat.style.setProperty('--orca-composer-enter-distance', `${Math.max(0, (doc.defaultView?.innerHeight ?? 0) - top) + 32}px`)
    seat.setAttribute(ENTER_ATTRIBUTE, '')
    schedule(() => {
      seat.removeAttribute(ENTER_ATTRIBUTE)
      seat.style.removeProperty('--orca-composer-enter-distance')
    }, ENTER_LIFETIME_MS)
  }

  const copyLiveFieldValues = (source: HTMLElement, clone: HTMLElement): void => {
    const sourceFields = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
    const cloneFields = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
    sourceFields.forEach((field, index) => {
      const clonedField = cloneFields.item(index)
      if (clonedField !== null) clonedField.value = field.value
    })
  }

  const discardExitSnapshot = (): void => {
    if (exitSnapshotTimer !== undefined) {
      clearTimeout(exitSnapshotTimer)
      timers.delete(exitSnapshotTimer)
      exitSnapshotTimer = undefined
    }
    exitSnapshot = null
  }

  /**
   * Snapshot the hero card while it is still on screen. Nothing is hidden and
   * nothing is mounted yet: the snapshot only becomes a ghost once the host
   * actually leaves the hero phase, and it is dropped untouched when the press
   * turned out not to be a submit.
   */
  const prepareExitGhost = (seat: HTMLElement, card: HTMLElement): void => {
    const rect = card.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      discardExitSnapshot()
      return
    }
    const ghost = card.cloneNode(true)
    if (!(ghost instanceof HTMLElement)) return
    copyLiveFieldValues(card, ghost)
    ghost.setAttribute(GHOST_ATTRIBUTE, '')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.setAttribute('inert', '')
    ghost.querySelectorAll('[id]').forEach(element => { element.removeAttribute('id') })
    ghost.querySelectorAll<HTMLElement>('button, input, textarea, select, [contenteditable], [tabindex]').forEach(element => {
      element.tabIndex = -1
    })
    ghost.style.left = `${rect.left}px`
    ghost.style.top = `${rect.top}px`
    ghost.style.width = `${rect.width}px`
    ghost.style.height = `${rect.height}px`

    discardExitSnapshot()
    exitSnapshot = { seat, ghost }
    const timer = setTimeout(() => {
      timers.delete(timer)
      exitSnapshotTimer = undefined
      exitSnapshot = null
    }, EXIT_SNAPSHOT_LIFETIME_MS)
    exitSnapshotTimer = timer
    timers.add(timer)
  }

  /**
   * The seat is leaving the hero phase for the active conversation: mount the
   * snapshot where the old card stood so it fades out there while the seat runs
   * its own dock-in animation. Without a snapshot (a phase change nobody
   * pressed for) this is a no-op.
   */
  const playExitGhost = (seat: HTMLElement): void => {
    const snapshot = exitSnapshot
    if (snapshot === null) return
    // A replaced seat is not the one this press belonged to: drop the
    // snapshot now instead of waiting out its window.
    if (snapshot.seat !== seat) {
      discardExitSnapshot()
      return
    }
    const ghost = snapshot.ghost
    discardExitSnapshot()
    body.append(ghost)
    // animationend bubbles: only the ghost's own fade-out may retire it, not a
    // descendant animation that happens to finish first.
    ghost.addEventListener('animationend', (event) => {
      if (event.target === ghost) ghost.remove()
    })
    schedule(() => { ghost.remove() }, GHOST_LIFETIME_MS)
  }

  const primaryButtonOf = (card: HTMLElement): HTMLButtonElement | null => {
    const buttons = card.querySelectorAll<HTMLButtonElement>('button')
    return buttons.item(buttons.length - 1)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const input = target.closest<HTMLElement>('[data-composer-input]')
    if (input === null) return

    const root = phaseRootOf(input)
    if (root?.dataset.phase === 'active') {
      const seat = input.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
      if (seat !== null) activateSeat(seat, true)
      return
    }
    if (root?.dataset.phase !== 'hero') return
    if (event.key !== 'Enter' || event.shiftKey || event.repeat || event.isComposing || event.keyCode === 229) return

    // Only a press that looks like a submit arms a snapshot. What the key
    // actually meant is the host's call: an open candidate menu takes it, the
    // phase stays hero, and the snapshot expires on its own.
    const card = input.closest<HTMLElement>(COMPOSER_CARD_SELECTOR)
    if (card === null || card.matches("[class*='cardWorkspaceTrigger']")) return
    const primary = primaryButtonOf(card)
    if (primary === null || primary.disabled) return
    const seat = input.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat !== null) prepareExitGhost(seat, card)
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

  const onClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('button')
    const card = button?.closest<HTMLElement>(COMPOSER_CARD_SELECTOR)
    const root = card === null || card === undefined ? null : phaseRootOf(card)
    if (button === null || card === null || card === undefined || root?.dataset.phase !== 'hero') return
    if (button.disabled || primaryButtonOf(card) !== button) return
    const seat = card.closest<HTMLElement>(COMPOSER_SEAT_SELECTOR)
    if (seat !== null) prepareExitGhost(seat, card)
  }

  const bindScrollport = (scrollport: HTMLElement): void => {
    if (scrollBindings.has(scrollport)) return
    const binding: ScrollBinding = {
      // Reading scrollTop while a newly mounted conversation still has dirty
      // style forces a full-document layout. Establish the baseline on the
      // first reader interaction instead.
      lastTop: null,
      dispose: () => {},
    }

    const onWheel = (event: WheelEvent): void => {
      // Checked before the delta threshold: touchpad inertia tails emit small
      // deltas that still chain onto the transcript via the host's forwarding.
      if (wheelTargetsSeatDraft(event)) {
        seatGestureUntil = Date.now() + SEAT_GESTURE_WINDOW_MS
        return
      }
      if (wheelBelongsToNestedSurface(event, scrollport)) return
      if (binding.lastTop === null) binding.lastTop = scrollport.scrollTop
      const seat = activeSeatOf(scrollport)
      if (seat === null || Math.abs(event.deltaY) <= SCROLL_THRESHOLD) return
      if (event.deltaY < 0) hideSeat(seat)
      else showSeat(seat)
    }
    const onScroll = (): void => {
      const top = scrollport.scrollTop
      const previousTop = binding.lastTop
      binding.lastTop = top
      const seat = activeSeatOf(scrollport)
      if (seat !== null) {
        if (Date.now() < seatGestureUntil) return
        const distanceToBottom = scrollport.scrollHeight - top - scrollport.clientHeight
        if (distanceToBottom <= BOTTOM_THRESHOLD) showSeat(seat)
        else if (previousTop !== null && top > previousTop + SCROLL_THRESHOLD) showSeat(seat)
        else if (previousTop !== null && top < previousTop - SCROLL_THRESHOLD) hideSeat(seat)
      }
    }

    scrollport.addEventListener('wheel', onWheel, { passive: true })
    scrollport.addEventListener('scroll', onScroll, { passive: true })
    binding.dispose = () => {
      scrollport.removeEventListener('wheel', onWheel)
      scrollport.removeEventListener('scroll', onScroll)
    }
    scrollBindings.set(scrollport, binding)
  }

  const synchronize = (): void => {
    doc.querySelectorAll<HTMLElement>(SCROLLPORT_SELECTOR).forEach((scrollport) => {
      bindScrollport(scrollport)
      const root = phaseRootOf(scrollport)
      if (root === null) return
      const phase = root.dataset.phase ?? ''
      const previous = phases.get(root)
      phases.set(root, phase)
      if (phase === 'hero') hasSeenHero = true
      const seat = seatOf(root)
      if (seat === null) return

      const wasOutsideChat = seat.hasAttribute(OUTSIDE_CHAT_ATTRIBUTE)
      const belongsToConversation = composerBelongsToConversation(root)
      seat.toggleAttribute(OUTSIDE_CHAT_ATTRIBUTE, !belongsToConversation)
      if (!belongsToConversation) {
        seat.removeAttribute(ENTER_ATTRIBUTE)
        seat.removeAttribute(INTERACTIVE_ATTRIBUTE)
        blurSeat(seat)
        return
      }

      // The exit ghost is owed to the host leaving the hero phase, not to the
      // seat reaching active: a submit may pass through settling while the
      // session is created, and the snapshot must not wait that out.
      if (previous === 'hero' && phase !== 'hero') playExitGhost(seat)

      if (phase === 'active') {
        if (
          wasOutsideChat
          || previous === 'hero'
          || previous === 'settling'
          || (previous === undefined && hasSeenHero)
        ) {
          enterSeat(seat)
        }
      } else {
        if (!seat.hasAttribute(MANUAL_HIDDEN_ATTRIBUTE)) seat.removeAttribute(HIDDEN_ATTRIBUTE)
        if (phase === 'hero') seat.removeAttribute(ENTER_ATTRIBUTE)
      }
    })
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) synchronize()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-phase'],
  })
  doc.addEventListener('keydown', onKeyDown, true)
  doc.addEventListener('click', onClick, true)
  doc.addEventListener('focusin', onFocusIn, true)
  doc.addEventListener('focusout', onFocusOut, true)
  synchronize()

  return () => {
    observer.disconnect()
    doc.removeEventListener('keydown', onKeyDown, true)
    doc.removeEventListener('click', onClick, true)
    doc.removeEventListener('focusin', onFocusIn, true)
    doc.removeEventListener('focusout', onFocusOut, true)
    scrollBindings.forEach(binding => { binding.dispose() })
    scrollBindings.clear()
    discardExitSnapshot()
    timers.forEach(timer => { clearTimeout(timer) })
    timers.clear()
    doc.querySelectorAll<HTMLElement>(COMPOSER_SEAT_SELECTOR).forEach(removeMotionAttributes)
    doc.querySelectorAll(`[${GHOST_ATTRIBUTE}]`).forEach(ghost => { ghost.remove() })
  }
}
