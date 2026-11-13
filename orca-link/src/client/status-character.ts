import { ORCA_LINK_STATUS_ATLAS } from './art.ts'
import type { LinkStatus } from './link-status.ts'
import { hasMutationOutsideTranscript } from './mutation-filter.ts'
import { createOrcaWorkLight } from './work-light.ts'

const CHARACTER_SELECTOR = '[data-orca-link-character]'
const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"
const STAGE_ACTION = "[data-slot='sidebar.session.action'] > :is(button[class*='newSession'], button:has(> svg[data-icon^='dsw-icon-upload-outline-']))"
/** Projected by customization.ts from the character switch and the SFW schedule. */
const CHARACTER_VISIBILITY_ATTRIBUTE = 'data-dsh-whale-orca-character'

const FRAME_INTERVAL_MS_BY_STATUS: Record<LinkStatus, number> = {
  /* The new-session standby is deliberately slower than the 12fps working
     cadence: its blink loop reads as nervous at 83ms/frame, so it gets its own
     relaxed 240ms pacing instead of sharing the global cel rate. */
  standby: 240,
  syncing: 83,
  working: 83,
  approval: 83,
  input: 83,
  review: 83,
  complete: 83,
  fault: 83,
  offline: 83,
  ready: 83,
}

const STATUS_ROWS: Record<LinkStatus, number> = {
  standby: 0,
  syncing: 1,
  working: 2,
  approval: 3,
  input: 4,
  review: 5,
  complete: 6,
  fault: 7,
  offline: 8,
  ready: 9,
}

const FRAME_SEQUENCES: Record<LinkStatus, readonly number[]> = {
  /* Standby is a long-eyed, rare-blink loop: several neutral (open-eye)
     cells are followed by one quick inhale -> half-blink -> closed-blink ->
     half-blink -> inhale trip, then back to neutral. The per-cell durations
     below make the blink itself fast while the open-eyed hold dominates the
     cycle, so the character blinks occasionally instead of blinking on every
     loop. */
  standby: [0, 0, 0, 0, 1, 2, 3, 2, 1],
  syncing: [0, 1, 2, 3, 4, 5, 6, 7],
  working: [0, 1, 2, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 2, 1, 0, 5, 6, 5, 0],
  approval: [0, 1, 2, 3, 4, 5, 6, 7],
  input: [0, 1, 2, 3, 4, 5, 6, 7],
  review: [0, 1, 2, 3, 4, 5, 6, 7],
  complete: [0, 1, 2, 3, 4, 5, 6, 7],
  fault: [0, 1, 2, 3, 4, 5],
  offline: [0, 1, 2, 3, 4, 5, 6, 7],
  ready: [0],
}

/**
 * Per-frame durations for statuses that need a non-uniform cadence. Array
 * length matches the status's FRAME_SEQUENCES entry; statuses without an
 * entry keep the fixed statusFrameInterval cadence. Standby holds the
 * open-eye cells long and plays the blink cells quickly, so blink frequency
 * drops without making the blink itself look slow.
 */
const FRAME_DURATIONS_MS_BY_STATUS: Partial<Record<LinkStatus, readonly number[]>> = {
  standby: [700, 700, 700, 700, 130, 90, 110, 90, 130],
  syncing: [900, 180, 900, 90, 100, 90, 160, 900],
  review: [600, 180, 260, 700, 1000, 260, 180, 600],
  // Notice the error, lift the mouse hand, then settle into a held facepalm.
  fault: [140, 280, 180, 220, 260, 500],
  // Spend most of the cycle typing with both hands, then briefly use the mouse.
  working: [120, 130, 200, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 130, 200, 130, 160, 160, 260, 160, 200],
}

const ONE_SHOT_STATUSES = new Set<LinkStatus>([
  'approval',
  'input',
  'complete',
  'fault',
  'offline',
  'ready',
])

function sequenceOffset(status: LinkStatus, sequenceIndex: number, sequenceLength: number): number {
  if (ONE_SHOT_STATUSES.has(status)) return Math.min(sequenceIndex, sequenceLength - 1)
  return sequenceIndex % sequenceLength
}

export function isLinkStatus(value: string | undefined): value is LinkStatus {
  return value !== undefined && Object.hasOwn(STATUS_ROWS, value)
}

export function statusFrame(status: LinkStatus, sequenceIndex: number): { frame: number, row: number } {
  const sequence = FRAME_SEQUENCES[status]
  return {
    frame: sequence[sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)] ?? 0,
    row: STATUS_ROWS[status],
  }
}

export function statusFrameInterval(status: LinkStatus): number {
  return FRAME_INTERVAL_MS_BY_STATUS[status]
}

/** Duration of the frame shown at one sequence index (per-frame cadence). */
export function statusFrameDuration(status: LinkStatus, sequenceIndex: number): number {
  const sequence = FRAME_SEQUENCES[status]
  const durations = FRAME_DURATIONS_MS_BY_STATUS[status]
  if (durations === undefined) return statusFrameInterval(status)
  const offset = sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)
  return durations[offset] ?? statusFrameInterval(status)
}

function createBubble(className: string): HTMLElement {
  const bubble = document.createElement('span')
  bubble.className = className
  bubble.dataset.orcaLinkCharacterBubble = ''

  const glyph = document.createElement('span')
  glyph.dataset.orcaLinkCharacterBubbleGlyph = ''
  glyph.setAttribute('aria-hidden', 'true')
  bubble.append(glyph)
  return bubble
}

function createCharacter(classes: {
  character: string
  characterBubble: string
  characterFrame: string
  characterSprite: string
}): HTMLElement {
  const character = document.createElement('div')
  character.className = classes.character
  character.dataset.orcaLinkCharacter = ''
  character.dataset.skinChrome = 'status-character'
  character.setAttribute('aria-hidden', 'true')

  const frame = document.createElement('div')
  frame.className = classes.characterFrame
  const sprite = document.createElement('div')
  sprite.className = classes.characterSprite
  sprite.dataset.orcaLinkCharacterSprite = ''
  character.style.setProperty('--orca-link-status-atlas', `url("${ORCA_LINK_STATUS_ATLAS}")`)
  sprite.style.setProperty('--orca-link-status-atlas', `url("${ORCA_LINK_STATUS_ATLAS}")`)
  frame.append(sprite)
  character.append(frame, createOrcaWorkLight('sidebar'), createBubble(classes.characterBubble))
  return character
}

function followStagePointer(pane: HTMLElement, character: HTMLElement, signal: AbortSignal): void {
  const view = pane.ownerDocument.defaultView ?? window
  const motion = view.matchMedia?.('(min-width: 901px) and (hover: hover) and (prefers-reduced-motion: no-preference)')
  let frame: number | undefined
  let x = 0
  let y = 0

  const reset = (): void => {
    if (frame !== undefined) view.cancelAnimationFrame(frame)
    frame = undefined
    character.style.removeProperty('--orca-frame-offset')
  }
  const paint = (): void => {
    frame = undefined
    const rect = character.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const offset = (fraction: number): number => Math.round(Math.max(-1, Math.min(1, fraction * 2 - 1)) * 3)
    const value = `${offset((x - rect.left) / rect.width)}px ${offset((y - rect.top) / rect.height)}px`
    if (character.style.getPropertyValue('--orca-frame-offset') !== value) {
      character.style.setProperty('--orca-frame-offset', value)
    }
  }
  const isAction = (target: EventTarget | null): boolean => target instanceof Element && target.closest(STAGE_ACTION) !== null
  const move = (event: PointerEvent): void => {
    if (!motion?.matches || event.pointerType === 'touch' || !isAction(event.target)) return
    if (!pane.parentElement?.hasAttribute('data-orca-sidebar-wide') || pane.className.includes('collapsed')
      || character.ownerDocument.documentElement.getAttribute(CHARACTER_VISIBILITY_ATTRIBUTE) === 'hidden') return
    x = event.clientX
    y = event.clientY
    if (frame === undefined) frame = view.requestAnimationFrame(paint)
  }
  const leave = (event: PointerEvent): void => {
    if (isAction(event.target) && !isAction(event.relatedTarget)) reset()
  }
  signal.addEventListener('abort', reset, { once: true })
  pane.addEventListener('pointermove', move, { passive: true, signal })
  pane.addEventListener('pointerout', leave, { signal })
}

/** Mount the ORCA-specific state actor in the sidebar's existing art stage. */
export function installOrcaStatusCharacter(body: HTMLElement, classes: {
  character: string
  characterBubble: string
  characterFrame: string
  characterSprite: string
}): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView ?? window
  const prefersReducedMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)')
  const readStatus = (): LinkStatus => isLinkStatus(body.dataset.orcaLinkStatus) ? body.dataset.orcaLinkStatus : 'standby'
  let character: HTMLElement | null = null
  let sprite: HTMLElement | null = null
  let pointerEvents: AbortController | undefined
  let status = readStatus()
  let targetStatus = status
  let sequenceIndex = 0
  let returningFrame: number | null = null
  let returnPath: number[] = []
  let timeout: number | undefined

  const mount = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    if (character !== null && character.parentElement === pane && character.isConnected) return
    pointerEvents?.abort()
    pointerEvents = undefined
    character?.remove()
    character = null
    sprite = null
    if (pane === null) return
    // A different activation retains ownership of its node and animation clock.
    if (pane.querySelector(CHARACTER_SELECTOR) !== null) return
    character = createCharacter(classes)
    sprite = character.querySelector<HTMLElement>('[data-orca-link-character-sprite]')
    pane.append(character)
    pointerEvents = new view.AbortController()
    followStagePointer(pane, character, pointerEvents.signal)
  }

  const currentFrame = (): { frame: number, row: number } => returningFrame === null
    ? statusFrame(status, sequenceIndex)
    : { frame: returningFrame, row: STATUS_ROWS[status] }

  const render = (): void => {
    mount()
    const current = currentFrame()
    if (character !== null) {
      // Signals follow the host immediately, even while the arm is returning.
      if (character.dataset.orcaLinkStatus !== targetStatus) character.dataset.orcaLinkStatus = targetStatus
      if (character.dataset.orcaLinkFrame !== String(current.frame)) {
        character.dataset.orcaLinkFrame = String(current.frame)
      }
    }
    for (const layer of [character, sprite]) {
      if (layer === null) continue
      layer.style.setProperty('--orca-status-column', String(current.frame))
      layer.style.setProperty('--orca-status-row', String(current.row))
      layer.style.setProperty('--orca-status-x', `${(current.frame / 7) * 100}%`)
      layer.style.setProperty('--orca-status-y', `${(current.row / 9) * 100}%`)
    }
  }

  const visible = (): boolean => doc.visibilityState !== 'hidden'
    && doc.documentElement.getAttribute(CHARACTER_VISIBILITY_ATTRIBUTE) !== 'hidden'

  const enterTarget = (): void => {
    status = targetStatus
    returningFrame = null
    returnPath = []
    sequenceIndex = prefersReducedMotion?.matches === true && ONE_SHOT_STATUSES.has(status)
      ? FRAME_SEQUENCES[status].length - 1 : 0
  }

  const animating = (): boolean => (
    character !== null
    && visible()
    && prefersReducedMotion?.matches !== true
    && (returningFrame !== null || !(ONE_SHOT_STATUSES.has(status) && sequenceIndex >= FRAME_SEQUENCES[status].length - 1))
  )

  const tick = (): void => {
    timeout = undefined
    if (!animating()) return
    if (returningFrame !== null) {
      returningFrame = returnPath.shift() ?? 0
      if (returnPath.length === 0) enterTarget()
    } else {
      sequenceIndex += 1
    }
    render()
    scheduleTick()
  }

  const scheduleTick = (): void => {
    if (timeout !== undefined) view.clearTimeout(timeout)
    timeout = undefined
    if (!animating()) return
    const returnDuration = status === 'fault' ? 100 : 60
    timeout = view.setTimeout(tick, returningFrame === null ? statusFrameDuration(status, sequenceIndex) : returnDuration)
  }

  const synchronize = (): void => {
    const nextStatus = readStatus()
    const changed = nextStatus !== targetStatus
    if (changed) {
      targetStatus = nextStatus
      const frame = currentFrame().frame
      if (frame === 0 || !visible() || prefersReducedMotion?.matches === true) {
        enterTarget()
      } else if (returningFrame === null) {
        // Each row starts with the same neutral cel. Finish a short loop or
        // retract a held gesture before entering the latest requested action.
        returningFrame = frame
        if (status === 'working') {
          // Typing and mouse motion are separate branches. Retract through the
          // wrist-transfer cel instead of jumping from the keyboard to mouse.
          returnPath = frame >= 2 && frame <= 4 ? [2, 1, 0] : [0]
          if (frame === 2) returnPath = [1, 0]
        } else if (status === 'fault') {
          // Release the temple gesture without replaying the surprised face.
          returnPath = frame >= 4 ? [6, 7, 0] : frame >= 2 ? [7, 0] : [0]
        } else if (!ONE_SHOT_STATUSES.has(status) && frame >= 4) {
          returnPath = Array.from({ length: 7 - frame }, (_, i) => frame + i + 1)
        } else {
          returnPath = Array.from({ length: frame }, (_, i) => frame - i - 1)
        }
      }
    }
    render()
    if (changed || timeout === undefined) scheduleTick()
  }

  const resume = (): void => {
    if (prefersReducedMotion?.matches === true) {
      enterTarget()
      render()
    }
    scheduleTick()
  }
  const visibilityObserver = new MutationObserver(resume)
  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTranscript(records)) return
    synchronize()
  })

  const dispose = (): void => {
    if (timeout !== undefined) view.clearTimeout(timeout)
    observer.disconnect()
    visibilityObserver.disconnect()
    doc.removeEventListener('visibilitychange', resume)
    prefersReducedMotion?.removeEventListener?.('change', resume)
    pointerEvents?.abort()
    character?.remove()
    character = null
    sprite = null
  }
  try {
    visibilityObserver.observe(doc.documentElement, { attributes: true, attributeFilter: [CHARACTER_VISIBILITY_ATTRIBUTE] })
    doc.addEventListener('visibilitychange', resume)
    prefersReducedMotion?.addEventListener?.('change', resume)
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-orca-link-status'],
      childList: true,
      subtree: true,
    })
    enterTarget()
    render()
    scheduleTick()
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
