import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const HEADLINE_SELECTOR = "[data-phase='hero'] [class*='headlineText']"
const TYPE_DELAY_MS = 105
const DELETE_DELAY_MS = 55
const OPEN_DELAY_MS = 320
const SEGMENT_GAP_MS = 420
const GROUP_GAP_MS = 640
const GROUP_HOLD_MS = 20_000

const HEADLINE_GROUPS = [
  ['如切如磋，如琢如磨'],
  ['不诱于誉，不恐于诽', '率道而行，端然正己'],
] as const

type Timer = ReturnType<typeof setTimeout>

function splitGraphemes(value: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(value), ({ segment }) => segment)
  }
  return Array.from(value)
}

function shuffledGroupOrder(previousGroup: number, groupCount: number): number[] {
  const order = Array.from({ length: groupCount }, (_, index) => index)
  for (let index = order.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[order[index], order[target]] = [order[target], order[index]]
  }
  if (order.length > 1 && order[0] === previousGroup) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }
  return order
}

export function installOrcaHeadlineTypewriter(body: HTMLElement): () => void {
  const timers = new Set<Timer>()
  const reducedMotion = body.ownerDocument.defaultView
    ?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  let headline: HTMLElement | null = null
  let originalText = ''
  let renderedText = ''
  let generation = 0
  let headlineGroups: readonly (readonly string[])[] = HEADLINE_GROUPS
  let groupOrder: number[] = []
  let previousGroup = -1

  const clearTimers = (): void => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  }

  const schedule = (callback: () => void, delay: number, token = generation): void => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      if (token === generation && headline?.isConnected) callback()
    }, delay)
    timers.add(timer)
  }

  const render = (value: string): void => {
    renderedText = value
    if (headline) headline.textContent = value
  }

  const typeText = (value: string, complete: () => void): void => {
    if (reducedMotion) {
      render(value)
      complete()
      return
    }
    const graphemes = splitGraphemes(value)
    let length = 0
    const typeNext = (): void => {
      length += 1
      render(graphemes.slice(0, length).join(''))
      if (length < graphemes.length) schedule(typeNext, TYPE_DELAY_MS)
      else complete()
    }
    typeNext()
  }

  const deleteText = (complete: () => void): void => {
    if (reducedMotion) {
      render('')
      complete()
      return
    }
    const graphemes = splitGraphemes(renderedText)
    let length = graphemes.length
    const deleteNext = (): void => {
      length -= 1
      render(graphemes.slice(0, length).join(''))
      if (length > 0) schedule(deleteNext, DELETE_DELAY_MS)
      else complete()
    }
    schedule(deleteNext, DELETE_DELAY_MS)
  }

  const takeNextGroup = (): number => {
    if (groupOrder.length === 0) groupOrder = shuffledGroupOrder(previousGroup, headlineGroups.length)
    return groupOrder.shift() ?? 0
  }

  const playNextGroup = (): void => {
    const groupIndex = takeNextGroup()
    const group = headlineGroups[groupIndex]
    const segmentHold = GROUP_HOLD_MS / group.length

    const playSegment = (segmentIndex: number): void => {
      typeText(group[segmentIndex], () => {
        schedule(() => {
          deleteText(() => {
            if (segmentIndex + 1 < group.length) {
              schedule(() => playSegment(segmentIndex + 1), SEGMENT_GAP_MS)
              return
            }
            previousGroup = groupIndex
            schedule(playNextGroup, GROUP_GAP_MS)
          })
        }, segmentHold)
      })
    }

    playSegment(0)
  }

  const start = (element: HTMLElement): void => {
    clearTimers()
    generation += 1
    headline = element
    originalText = element.textContent ?? ''
    headlineGroups = originalText === '' ? HEADLINE_GROUPS : [[originalText], ...HEADLINE_GROUPS]
    groupOrder = []
    previousGroup = -1
    element.dataset.orcaHeadlineTypewriter = ''
    render('')
    schedule(playNextGroup, OPEN_DELAY_MS)
  }

  const stop = (restore: boolean): void => {
    clearTimers()
    generation += 1
    if (headline) {
      headline.removeAttribute('data-orca-headline-typewriter')
      if (restore && headline.isConnected) headline.textContent = originalText
    }
    headline = null
    renderedText = ''
  }

  const sync = (): void => {
    const found = body.querySelector<HTMLElement>(HEADLINE_SELECTOR)
    if (found !== headline) {
      stop(true)
      if (found) start(found)
      return
    }
    if (headline && headline.textContent !== renderedText) {
      const externalText = headline.textContent ?? ''
      if (externalText !== '') {
        originalText = externalText
        headlineGroups = [[originalText], ...HEADLINE_GROUPS]
      }
      clearTimers()
      generation += 1
      render('')
      schedule(playNextGroup, OPEN_DELAY_MS)
    }
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) sync()
  })
  observer.observe(body, { attributes: true, childList: true, characterData: true, subtree: true })
  sync()

  return () => {
    observer.disconnect()
    stop(true)
  }
}
