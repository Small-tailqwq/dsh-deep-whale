import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
const COMPOSER_CARD_SELECTOR = "[data-composer-card]:not([class*='cardWorkspaceTrigger'])"
const CHAT_FLOW_SELECTOR = '[data-chat-flow]'

export const MANUAL_HIDDEN_ATTRIBUTE = 'data-orca-composer-manual-hidden'

const DRAGGING_ATTRIBUTE = 'data-orca-composer-collapse-dragging'
const REBOUNDING_ATTRIBUTE = 'data-orca-composer-collapse-rebounding'
const COLLAPSING_ATTRIBUTE = 'data-orca-composer-collapsing'
const RESTORING_ATTRIBUTE = 'data-orca-composer-restoring'
const OWNED_INERT_ATTRIBUTE = 'data-orca-composer-owned-inert'
const BODY_DRAGGING_ATTRIBUTE = 'data-orca-composer-handle-dragging'

const HANDLE_ATTRIBUTE = 'data-orca-composer-handle'
const RESTORE_ATTRIBUTE = 'data-orca-composer-restore'
const RESTORE_EXIT_ATTRIBUTE = 'data-orca-composer-restore-exiting'
const ACTIVATION_DEAD_ZONE = 8
const COMMIT_THRESHOLD = 0.56
const REBOUND_LIFETIME_MS = 420
const COLLAPSE_LIFETIME_MS = 440
const RESTORE_LIFETIME_MS = 520
const RESTORE_SIZE = 28

type Side = 'left' | 'right'

interface Anchor {
  leftRatio: number
  topRatio: number
}

interface CollapseBinding {
  seat: HTMLElement
  card: HTMLElement
  root: HTMLElement
  handles: HTMLButtonElement[]
  restore: HTMLButtonElement | null
  anchor: Anchor | null
  suppressClickUntil: number
  cardRect: DOMRect | null
  transitionVersion: number
}

interface ActiveDrag {
  binding: CollapseBinding
  handle: HTMLButtonElement
  pointerId: number
  side: Side
  startX: number
  startProgress: number
  distance: number
  progress: number
  activated: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function phaseRootOf(element: Element): HTMLElement | null {
  let candidate: Element | null = element
  while (candidate !== null) {
    if (candidate instanceof HTMLElement && candidate.hasAttribute('data-phase')) {
      const scrollport = candidate.querySelector<HTMLElement>('[data-conversation-scroll]')
      if (scrollport?.closest('[data-phase]') === candidate) return candidate
    }
    candidate = candidate.parentElement
  }
  return null
}

function composerBelongsToConversation(root: HTMLElement): boolean {
  const phase = root.dataset.phase ?? ''
  return phase === 'active' && root.querySelector(CHAT_FLOW_SELECTOR) !== null
}

function isPrimaryPointer(event: PointerEvent): boolean {
  return event.button === 0 && event.isPrimary !== false
}

/**
 * Upgrade the decorative ORCA composer brackets into inward drag handles.
 * The host keeps ownership of the editor, draft and submit path; this
 * module only presents a reversible, manually locked visibility state.
 */
export function installOrcaComposerCollapse(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView
  const bindings = new Map<HTMLElement, CollapseBinding>()
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let activeDrag: ActiveDrag | null = null

  const prefersChinese = (
    doc.documentElement.lang
    || view?.navigator.language
    || 'en'
  ).toLowerCase().startsWith('zh')

  const schedule = (callback: () => void, delay: number): void => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
  }

  const clearDragProperties = (seat: HTMLElement): void => {
    for (const property of ['scale', 'dock-x', 'dock-y', 'dock-scale']) {
      seat.style.removeProperty(`--orca-composer-${property}`)
    }
    const binding = bindings.get(seat)
    if (binding !== undefined) {
      binding.cardRect = null
    }
  }

  const blurSeat = (seat: HTMLElement): void => {
    const active = doc.activeElement
    if (active instanceof HTMLElement && seat.contains(active)) active.blur()
  }

  const setOwnedInert = (seat: HTMLElement, inert: boolean): void => {
    if (inert) {
      if (!seat.hasAttribute('inert')) {
        seat.setAttribute('inert', '')
        seat.setAttribute(OWNED_INERT_ATTRIBUTE, '')
      }
      return
    }
    if (seat.hasAttribute(OWNED_INERT_ATTRIBUTE)) {
      seat.removeAttribute('inert')
      seat.removeAttribute(OWNED_INERT_ATTRIBUTE)
    }
  }

  const applyDragProgress = (binding: CollapseBinding, progress: number): void => {
    binding.seat.style.setProperty('--orca-composer-scale', `${1 - progress * 0.58}`)
  }

  const anchorRestore = (binding: CollapseBinding, cardRect?: DOMRect): void => {
    const rootRect = binding.root.getBoundingClientRect()
    const rect = cardRect ?? binding.card.getBoundingClientRect()
    if (rootRect.width <= 0 || rootRect.height <= 0 || rect.width <= 0 || rect.height <= 0) return

    const left = clamp(rect.right - 16 - RESTORE_SIZE, rootRect.left + 8, rootRect.right - RESTORE_SIZE - 8)
    const top = clamp(rect.top - 36, rootRect.top + 8, rootRect.bottom - RESTORE_SIZE - 8)
    binding.anchor = {
      leftRatio: (left - rootRect.left) / rootRect.width,
      topRatio: (top - rootRect.top) / rootRect.height,
    }
    positionRestore(binding, rect)
  }

  const positionRestore = (binding: CollapseBinding, sourceRect?: DOMRect): void => {
    const button = binding.restore
    const anchor = binding.anchor
    if (button === null || anchor === null) return

    const rootRect = binding.root.getBoundingClientRect()
    const left = clamp(rootRect.left + rootRect.width * anchor.leftRatio,
      rootRect.left + 8, rootRect.right - RESTORE_SIZE - 8)
    const top = clamp(rootRect.top + rootRect.height * anchor.topRatio,
      rootRect.top + 8, rootRect.bottom - RESTORE_SIZE - 8)
    button.style.left = `${left}px`
    button.style.top = `${top}px`

    if (sourceRect !== undefined) {
      const sourceX = sourceRect.left + sourceRect.width / 2
      const sourceY = sourceRect.top + sourceRect.height / 2
      binding.seat.style.setProperty('--orca-composer-dock-x', `${left + RESTORE_SIZE / 2 - sourceX}px`)
      binding.seat.style.setProperty('--orca-composer-dock-y', `${top + RESTORE_SIZE / 2 - sourceY}px`)
      binding.seat.style.setProperty('--orca-composer-dock-scale', `${RESTORE_SIZE / sourceRect.width}`)
    }
  }

  const removeRestore = (binding: CollapseBinding): void => {
    binding.restore?.remove()
    binding.restore = null
  }

  const restoreComposer = (binding: CollapseBinding): void => {
    const seat = binding.seat
    if (!seat.hasAttribute(MANUAL_HIDDEN_ATTRIBUTE)) return

    const version = ++binding.transitionVersion
    const rect = seat.hasAttribute(COLLAPSING_ATTRIBUTE)
      ? binding.cardRect ?? binding.card.getBoundingClientRect()
      : binding.card.getBoundingClientRect()
    positionRestore(binding, rect)
    binding.restore?.setAttribute(RESTORE_EXIT_ATTRIBUTE, '')
    seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE)
    seat.removeAttribute('data-orca-composer-hidden')
    seat.removeAttribute(COLLAPSING_ATTRIBUTE)
    seat.removeAttribute(REBOUNDING_ATTRIBUTE)
    seat.setAttribute(RESTORING_ATTRIBUTE, '')
    setOwnedInert(seat, false)

    schedule(() => {
      if (version !== binding.transitionVersion) return
      seat.removeAttribute(RESTORING_ATTRIBUTE)
      clearDragProperties(seat)
      removeRestore(binding)
    }, RESTORE_LIFETIME_MS)
  }

  const mountRestore = (binding: CollapseBinding, cardRect: DOMRect): void => {
    removeRestore(binding)
    const button = doc.createElement('button')
    button.type = 'button'
    button.setAttribute(RESTORE_ATTRIBUTE, '')
    button.setAttribute('aria-label', prefersChinese ? '显示输入框' : 'Show composer')
    const core = doc.createElement('span')
    core.setAttribute('data-orca-composer-restore-core', '')
    core.setAttribute('aria-hidden', 'true')
    button.append(core)
    button.addEventListener('click', () => { restoreComposer(binding) })
    body.append(button)
    binding.restore = button
    anchorRestore(binding, cardRect)
  }

  const commitCollapse = (binding: CollapseBinding): void => {
    const seat = binding.seat
    if (seat.hasAttribute(MANUAL_HIDDEN_ATTRIBUTE)) return

    const version = ++binding.transitionVersion
    const cardRect = binding.cardRect ?? binding.card.getBoundingClientRect()
    binding.cardRect = cardRect
    blurSeat(seat)
    seat.removeAttribute(DRAGGING_ATTRIBUTE)
    seat.removeAttribute(REBOUNDING_ATTRIBUTE)
    seat.removeAttribute(RESTORING_ATTRIBUTE)
    seat.removeAttribute('data-orca-composer-entering')
    seat.removeAttribute('data-orca-composer-interactive')
    seat.removeAttribute('data-orca-composer-hidden')
    seat.setAttribute(MANUAL_HIDDEN_ATTRIBUTE, '')
    seat.setAttribute(COLLAPSING_ATTRIBUTE, '')
    setOwnedInert(seat, true)
    body.removeAttribute(BODY_DRAGGING_ATTRIBUTE)
    mountRestore(binding, cardRect)

    schedule(() => {
      if (version !== binding.transitionVersion) return
      seat.removeAttribute(COLLAPSING_ATTRIBUTE)
      seat.style.removeProperty('--orca-composer-scale')
    }, COLLAPSE_LIFETIME_MS)
  }

  const reboundComposer = (binding: CollapseBinding): void => {
    const seat = binding.seat
    seat.removeAttribute(DRAGGING_ATTRIBUTE)
    const version = ++binding.transitionVersion
    seat.setAttribute(REBOUNDING_ATTRIBUTE, '')
    body.removeAttribute(BODY_DRAGGING_ATTRIBUTE)
    schedule(() => {
      if (version !== binding.transitionVersion) return
      seat.removeAttribute(REBOUNDING_ATTRIBUTE)
      clearDragProperties(seat)
    }, REBOUND_LIFETIME_MS)
  }

  const finishDrag = (commit: boolean): void => {
    const drag = activeDrag
    if (drag === null) return
    activeDrag = null
    drag.binding.suppressClickUntil = Date.now() + 420
    if (drag.handle.hasPointerCapture?.(drag.pointerId)) {
      drag.handle.releasePointerCapture(drag.pointerId)
    }
    if (!drag.activated) {
      body.removeAttribute(BODY_DRAGGING_ATTRIBUTE)
      clearDragProperties(drag.binding.seat)
      return
    }
    if (commit) commitCollapse(drag.binding)
    else reboundComposer(drag.binding)
  }

  const onPointerMove = (event: PointerEvent): void => {
    const drag = activeDrag
    if (drag === null || event.pointerId !== drag.pointerId) return
    if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) {
      finishDrag(false)
      return
    }
    const inward = drag.side === 'left'
      ? event.clientX - drag.startX
      : drag.startX - event.clientX
    if (!drag.activated) {
      if (inward <= ACTIVATION_DEAD_ZONE) return
      drag.activated = true
      drag.binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE)
      drag.binding.seat.removeAttribute('data-orca-composer-entering')
      drag.binding.seat.removeAttribute('data-orca-composer-hidden')
      drag.binding.seat.setAttribute(DRAGGING_ATTRIBUTE, '')
      body.setAttribute(BODY_DRAGGING_ATTRIBUTE, drag.side)
    }
    drag.progress = clamp(
      drag.startProgress + (inward - ACTIVATION_DEAD_ZONE) / (drag.distance - ACTIVATION_DEAD_ZONE),
      0,
      1,
    )
    applyDragProgress(drag.binding, drag.progress)
    event.preventDefault()
  }

  const onPointerUp = (event: PointerEvent): void => {
    const drag = activeDrag
    if (drag === null || event.pointerId !== drag.pointerId) return
    finishDrag(drag.progress >= COMMIT_THRESHOLD)
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (activeDrag === null || event.pointerId !== activeDrag.pointerId) return
    finishDrag(false)
  }

  const onWindowBlur = (): void => {
    if (activeDrag !== null) finishDrag(false)
  }

  const onVisibilityChange = (): void => {
    if (doc.visibilityState === 'hidden' && activeDrag !== null) finishDrag(false)
  }

  const beginDrag = (
    event: PointerEvent,
    binding: CollapseBinding,
    side: Side,
    handle: HTMLButtonElement,
  ): void => {
    if (!isPrimaryPointer(event) || activeDrag !== null) return
    if (binding.seat.hasAttribute(MANUAL_HIDDEN_ATTRIBUTE) || binding.seat.hasAttribute(RESTORING_ATTRIBUTE)) return
    const phase = binding.root.dataset.phase ?? ''
    if (phase !== 'active' || binding.root.querySelector(CHAT_FLOW_SELECTOR) === null) return

    const rebounding = binding.seat.hasAttribute(REBOUNDING_ATTRIBUTE)
    const transform = rebounding ? view?.getComputedStyle(binding.card).transform : undefined
    const scale = transform?.startsWith('matrix(') ? Number.parseFloat(transform.slice(7)) : 1
    const startProgress = clamp((1 - (scale ?? 1)) / 0.58, 0, 1)
    const rect = rebounding && binding.cardRect !== null ? binding.cardRect : binding.card.getBoundingClientRect()
    ++binding.transitionVersion
    binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE)
    clearDragProperties(binding.seat)
    const width = rect.width
    binding.cardRect = rect
    if (rebounding) {
      applyDragProgress(binding, startProgress)
      binding.seat.setAttribute(DRAGGING_ATTRIBUTE, '')
      body.setAttribute(BODY_DRAGGING_ATTRIBUTE, side)
    }
    activeDrag = {
      binding,
      handle,
      pointerId: event.pointerId,
      side,
      startX: event.clientX,
      startProgress,
      distance: clamp(width * 0.34, 88, 168),
      progress: startProgress,
      activated: rebounding,
    }
    handle.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  const createHandle = (binding: CollapseBinding, side: Side): HTMLButtonElement => {
    const handle = doc.createElement('button')
    handle.type = 'button'
    handle.setAttribute(HANDLE_ATTRIBUTE, side)
    const label = prefersChinese
      ? `${side === 'left' ? '向右' : '向左'}拖动以收起输入框`
      : `Drag ${side === 'left' ? 'right' : 'left'} to hide composer`
    handle.setAttribute('aria-label', label)
    handle.addEventListener('pointerdown', event => { beginDrag(event, binding, side, handle) })
    handle.addEventListener('lostpointercapture', event => {
      if (activeDrag === null || event.pointerId !== activeDrag.pointerId) return
      finishDrag(false)
    })
    handle.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      commitCollapse(binding)
    })
    handle.addEventListener('click', event => {
      if (Date.now() < binding.suppressClickUntil) return
      if (event.detail === 0) commitCollapse(binding)
    })
    return handle
  }

  const mountBinding = (seat: HTMLElement): void => {
    const root = phaseRootOf(seat)
    const card = seat.querySelector<HTMLElement>(COMPOSER_CARD_SELECTOR)
    if (root === null || card === null) return

    let binding = bindings.get(seat)
    if (binding === undefined) {
      binding = {
        seat,
        card,
        root,
        handles: [],
        restore: null,
        anchor: null,
        suppressClickUntil: 0,
        cardRect: null,
        transitionVersion: 0,
      }
      bindings.set(seat, binding)
    } else {
      binding.root = root
      if (binding.card !== card) {
        binding.handles.forEach(handle => { handle.remove() })
        binding.handles = []
        binding.card = card
      }
    }

    if (!composerBelongsToConversation(root)) {
      if (activeDrag?.binding === binding) {
        finishDrag(false)
      }
      ++binding.transitionVersion
      binding.handles.forEach(handle => { handle.remove() })
      binding.handles = []
      removeRestore(binding)
      setOwnedInert(seat, false)
      seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE)
      seat.removeAttribute(DRAGGING_ATTRIBUTE)
      seat.removeAttribute(REBOUNDING_ATTRIBUTE)
      seat.removeAttribute(COLLAPSING_ATTRIBUTE)
      seat.removeAttribute(RESTORING_ATTRIBUTE)
      clearDragProperties(seat)
      return
    }

    if (binding.handles.length === 0) {
      const left = createHandle(binding, 'left')
      const right = createHandle(binding, 'right')
      card.append(left, right)
      binding.handles = [left, right]
    }

    if (binding.restore !== null) {
      positionRestore(binding)
    }
  }

  const removeBinding = (binding: CollapseBinding): void => {
    if (activeDrag?.binding === binding) finishDrag(false)
    ++binding.transitionVersion
    binding.handles.forEach(handle => { handle.remove() })
    binding.handles = []
    removeRestore(binding)
    setOwnedInert(binding.seat, false)
    binding.seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE)
    binding.seat.removeAttribute(DRAGGING_ATTRIBUTE)
    binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE)
    binding.seat.removeAttribute(COLLAPSING_ATTRIBUTE)
    binding.seat.removeAttribute(RESTORING_ATTRIBUTE)
    clearDragProperties(binding.seat)
  }

  const synchronize = (): void => {
    doc.querySelectorAll<HTMLElement>(COMPOSER_SEAT_SELECTOR).forEach(mountBinding)
    bindings.forEach((binding, seat) => {
      if (seat.isConnected) return
      removeBinding(binding)
      bindings.delete(seat)
    })
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || activeDrag === null) return
    event.preventDefault()
    finishDrag(false)
  }

  const onResize = (): void => {
    bindings.forEach(binding => { positionRestore(binding) })
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
  doc.addEventListener('pointermove', onPointerMove, { passive: false })
  doc.addEventListener('pointerup', onPointerUp, true)
  doc.addEventListener('pointercancel', onPointerCancel, true)
  doc.addEventListener('keydown', onKeyDown, true)
  doc.addEventListener('visibilitychange', onVisibilityChange)
  view?.addEventListener('blur', onWindowBlur)
  view?.addEventListener('resize', onResize)
  synchronize()

  return () => {
    observer.disconnect()
    doc.removeEventListener('pointermove', onPointerMove)
    doc.removeEventListener('pointerup', onPointerUp, true)
    doc.removeEventListener('pointercancel', onPointerCancel, true)
    doc.removeEventListener('keydown', onKeyDown, true)
    doc.removeEventListener('visibilitychange', onVisibilityChange)
    view?.removeEventListener('blur', onWindowBlur)
    view?.removeEventListener('resize', onResize)
    if (activeDrag !== null) finishDrag(false)
    body.removeAttribute(BODY_DRAGGING_ATTRIBUTE)
    bindings.forEach(removeBinding)
    bindings.clear()
    timers.forEach(timer => { clearTimeout(timer) })
    timers.clear()
    doc.querySelectorAll(`[${RESTORE_ATTRIBUTE}], [${HANDLE_ATTRIBUTE}]`).forEach(element => { element.remove() })
  }
}
