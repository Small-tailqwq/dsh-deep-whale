import { ORCA_LINK_STATUS_ATLAS } from './art.ts'
import type { LinkStatus } from './link-status.ts'
import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const CHARACTER_SELECTOR = '[data-orca-link-character]'
const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"

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
  working: [0, 1, 2, 3, 4, 5, 6, 7],
  approval: [0, 1, 2, 3, 4, 5, 6, 7],
  input: [0, 1, 2, 3, 4, 5, 6, 7],
  review: [0, 1, 2, 3, 4, 5, 6, 7],
  complete: [0, 1, 2, 3, 4, 5, 6, 7],
  fault: [0, 1, 2, 3, 4, 5, 6, 7],
  offline: [0, 1, 2, 3, 4, 5, 6, 7],
  ready: [0, 1, 2, 3, 4, 5, 6, 7],
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
}

const ONE_SHOT_STATUSES = new Set<LinkStatus>([
  'approval',
  'input',
  'complete',
  'fault',
  'ready',
])

/** Atlas cell size in px for the inline ORCA LINK status atlas (8×10 grid). */
const STATUS_ATLAS_CELL = 236

/**
 * Per-frame alignment compensation for every status row.
 *
 * The atlas rows were assembled from source poses whose whole-body centroid
 * drifts between frames (and between different status rows). Without
 * compensation, both an individual animation loop and a status transition can
 * visibly jump at small UI sizes. Values are source-pixel offsets (standby
 * frame 0 centroid minus this frame's centroid) applied as a translate on the
 * sprite layer, so every status and every frame shares one stable anchor while
 * the pose changes. Recompute these from the inline atlas whenever the artwork
 * is re-embedded.
 */
const STATUS_FRAME_ALIGNMENT: Record<LinkStatus, ReadonlyArray<readonly [number, number]>> = {
  standby: [
    [0.0, 0.0],
    [5.0, -0.2],
    [2.6, 0.1],
    [0.8, -0.2],
    [0.9, 2.2],
    [2.6, 2.1],
    [2.9, 1.9],
    [0.0, 0.0],
  ],
  syncing: [
    [-3.5, 1.0],
    [-2.9, 0.8],
    [0.4, 0.6],
    [1.3, 0.4],
    [-1.1, 3.9],
    [-2.0, 4.2],
    [0.8, 3.4],
    [-3.5, 1.0],
  ],
  working: [
    [5.4, -1.6],
    [5.0, -1.8],
    [5.5, -1.6],
    [6.2, -1.7],
    [5.2, 0.9],
    [4.5, 0.6],
    [6.3, 0.4],
    [5.4, -1.6],
  ],
  approval: [
    [3.2, -1.8],
    [2.6, -1.6],
    [3.3, -0.1],
    [4.2, 1.3],
    [4.2, 1.1],
    [3.0, 1.1],
    [3.3, 0.6],
    [5.3, 1.0],
  ],
  input: [
    [9.6, 9.8],
    [8.8, 9.7],
    [8.5, 10.7],
    [8.7, 12.5],
    [7.3, 12.6],
    [7.3, 12.4],
    [8.1, 12.5],
    [7.3, 12.4],
  ],
  review: [
    [11.8, -2.5],
    [5.8, 2.0],
    [8.4, 2.1],
    [9.1, -0.1],
    [6.4, 1.1],
    [13.7, 1.8],
    [10.8, -0.2],
    [11.8, -2.5],
  ],
  complete: [
    [1.8, -2.3],
    [-0.1, -2.7],
    [-0.9, -2.7],
    [0.8, -1.3],
    [10.0, -2.4],
    [-1.3, -1.1],
    [-0.8, -0.8],
    [8.1, -0.2],
  ],
  fault: [
    [9.7, -0.8],
    [10.2, -0.8],
    [9.7, -0.4],
    [16.6, -0.2],
    [12.4, -0.1],
    [12.8, 0.7],
    [14.3, -0.7],
    [11.8, 1.4],
  ],
  offline: [
    [10.4, -1.8],
    [9.7, -2.0],
    [10.0, -2.0],
    [11.7, -2.0],
    [11.1, -1.5],
    [9.5, -1.5],
    [10.8, -1.9],
    [10.4, -1.8],
  ],
  ready: [
    [6.1, -0.1],
    [5.7, -0.4],
    [5.2, -1.1],
    [7.1, -1.2],
    [5.9, 0.9],
    [5.7, 0.8],
    [5.6, 0.6],
    [7.1, 0.6],
  ],
}

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
  character.append(frame, createBubble(classes.characterBubble))
  return character
}

/** Mount the ORCA-specific state actor in the sidebar's existing art stage. */
export function installOrcaStatusCharacter(body: HTMLElement, classes: {
  character: string
  characterBubble: string
  characterFrame: string
  characterSprite: string
}): () => void {
  let character: HTMLElement | null = null
  let sprite: HTMLElement | null = null
  let status: LinkStatus = 'standby'
  let sequenceIndex = 0
  let timeout: number | undefined

  const mount = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    if (pane === null) return
    const existing = pane.querySelector<HTMLElement>(CHARACTER_SELECTOR)
    if (existing !== null) {
      character = existing
      sprite = existing.querySelector<HTMLElement>('[data-orca-link-character-sprite]')
      return
    }
    character = createCharacter(classes)
    sprite = character.querySelector<HTMLElement>('[data-orca-link-character-sprite]')
    pane.append(character)
  }

  const render = (): void => {
    mount()
    const nextStatus = isLinkStatus(body.dataset.orcaLinkStatus) ? body.dataset.orcaLinkStatus : 'standby'
    if (nextStatus !== status) {
      status = nextStatus
      sequenceIndex = 0
    }
    const current = statusFrame(status, sequenceIndex)
    if (character !== null) {
      if (character.dataset.orcaLinkStatus !== status) character.dataset.orcaLinkStatus = status
      if (character.dataset.orcaLinkFrame !== String(current.frame)) {
        character.dataset.orcaLinkFrame = String(current.frame)
      }
      character.style.setProperty('--orca-status-column', String(current.frame))
      character.style.setProperty('--orca-status-row', String(current.row))
      character.style.setProperty('--orca-status-x', `${(current.frame / 7) * 100}%`)
      character.style.setProperty('--orca-status-y', `${(current.row / 9) * 100}%`)
    }
    if (sprite !== null) {
      sprite.style.setProperty('--orca-status-column', String(current.frame))
      sprite.style.setProperty('--orca-status-row', String(current.row))
      sprite.style.setProperty('--orca-status-x', `${(current.frame / 7) * 100}%`)
      sprite.style.setProperty('--orca-status-y', `${(current.row / 9) * 100}%`)
      const alignment = STATUS_FRAME_ALIGNMENT[status]?.[current.frame]
      if (alignment !== undefined) {
        sprite.style.transform = `translate(${(alignment[0] / STATUS_ATLAS_CELL) * 100}%, ${(alignment[1] / STATUS_ATLAS_CELL) * 100}%)`
      } else {
        sprite.style.transform = ''
      }
    }
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const tick = (): void => {
    if (prefersReducedMotion?.matches !== true) sequenceIndex += 1
    render()
    scheduleTick()
  }

  const scheduleTick = (): void => {
    if (timeout !== undefined) window.clearTimeout(timeout)
    timeout = window.setTimeout(tick, statusFrameDuration(status, sequenceIndex))
  }

  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTerminal(records)) return
    const previousStatus = status
    render()
    if (status !== previousStatus) scheduleTick()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-orca-link-status'],
    childList: true,
    subtree: true,
  })
  render()
  scheduleTick()

  return () => {
    if (timeout !== undefined) window.clearTimeout(timeout)
    observer.disconnect()
    body.querySelectorAll(CHARACTER_SELECTOR).forEach(element => element.remove())
  }
}
