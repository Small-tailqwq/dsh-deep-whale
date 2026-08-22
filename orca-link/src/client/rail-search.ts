/**
 * Rail search completion: clicking the search control in the collapsed
 * rail expands the sidebar and focuses the search input, but the search
 * row's own open state is lost across the rail-to-wide remount — the input
 * ends up focused at its 4px collapsed width and the row needs a second
 * click. When the input lands focused while its row button still reports
 * aria-expanded="false", wait out the sidebar expansion, re-check, and
 * finish the interaction with one click on the row button. Rows that
 * opened normally (aria-expanded="true" before focus) are never touched.
 */

const SEARCH_INPUT_SELECTOR = "[data-slot='sidebar'] input[class*='searchInput']"
const SEARCH_BUTTON_SELECTOR = "button[class*='searchButton']"
const RECHECK_DELAY_MS = 320

/**
 * Resolve the search row for a focused input. The input's own class already
 * contains "search", so closest() would match the input itself; climb the
 * ancestors instead until the element that owns the search button is found.
 */
function searchContextOf(target: EventTarget | null): { row: HTMLElement; input: HTMLInputElement } | null {
  if (!(target instanceof HTMLInputElement)) return null
  if (!target.matches(SEARCH_INPUT_SELECTOR)) return null
  let node: HTMLElement | null = target.parentElement
  for (let depth = 0; depth < 3 && node instanceof HTMLElement; depth++) {
    if (node.querySelector(SEARCH_BUTTON_SELECTOR)) return { row: node, input: target }
    node = node.parentElement
  }
  return null
}

/**
 * Install the rail search completion. Returns a disposer that removes the
 * listener and cancels any pending completion.
 */
export function installOrcaRailSearch(body: HTMLElement): () => void {
  const pending = new Map<HTMLInputElement, ReturnType<typeof setTimeout>>()

  const onFocusIn = (event: FocusEvent): void => {
    const context = searchContextOf(event.target)
    if (!context) return
    const { row, input } = context
    // Browsers dispatch both focus and focusin for one focus action; the
    // latest event for an input replaces its pending completion.
    const previous = pending.get(input)
    if (previous !== undefined) clearTimeout(previous)
    const timer = setTimeout(() => {
      pending.delete(input)
      if (document.activeElement !== input) return
      const button = row.querySelector<HTMLElement>(SEARCH_BUTTON_SELECTOR)
      if (!button || button.getAttribute('aria-expanded') !== 'false') return
      if (!body.hasAttribute('data-orca-sidebar-wide')) return
      button.click()
    }, RECHECK_DELAY_MS)
    pending.set(input, timer)
  }

  // focusin covers real browsers (bubbling); the capture-phase focus event
  // additionally covers environments where programmatic focus does not
  // synthesize focusin. The per-input dedupe above collapses the overlap.
  body.addEventListener('focusin', onFocusIn)
  body.addEventListener('focus', onFocusIn, true)
  return () => {
    body.removeEventListener('focusin', onFocusIn)
    body.removeEventListener('focus', onFocusIn, true)
    for (const timer of pending.values()) clearTimeout(timer)
    pending.clear()
  }
}
