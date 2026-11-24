/**
 * Conversation phase for the composer visibility modes.
 *
 * The main conversation carries its phase on the ConversationMainPanel root
 * (`data-phase`). Embedded conversations — the subagent sidebar chat and the
 * Forge review pane — render ConversationContent alone, whose own
 * `data-content-phase` is the only phase marker. They join the visibility
 * modes only while the `composerEmbedded` setting projects
 * `data-maid-composer-embedded="on"` on <html>.
 */
const SCROLLPORT_SELECTOR = '[data-conversation-scroll]'
const CONTENT_SELECTOR = '[data-conversation-content]'

export const EMBEDDED_ATTRIBUTE = 'data-maid-composer-embedded'

/** The nearest `[data-phase]` ancestor that owns its scrollport. */
function phaseRootOf(element: Element): HTMLElement | null {
  let candidate = element.closest<HTMLElement>('[data-phase]')
  while (candidate !== null) {
    const scrollport = candidate.querySelector<HTMLElement>(SCROLLPORT_SELECTOR)
    if (scrollport?.closest('[data-phase]') === candidate) return candidate
    candidate = candidate.parentElement?.closest<HTMLElement>('[data-phase]') ?? null
  }
  return null
}

/** The nearest conversation content instance that owns its scrollport. */
function contentRootOf(element: Element): HTMLElement | null {
  const content = element.closest<HTMLElement>(CONTENT_SELECTOR)
  if (content === null) return null
  return content.querySelector(SCROLLPORT_SELECTOR)?.closest(CONTENT_SELECTOR) === content ? content : null
}

function embeddedEnabled(element: Element): boolean {
  return element.ownerDocument.documentElement.getAttribute(EMBEDDED_ATTRIBUTE) === 'on'
}

/** 'hero' | 'active' | 'settling' for a composer the visibility modes may drive. */
export function conversationPhaseOf(element: Element): string | undefined {
  const root = phaseRootOf(element)
  if (root !== null) return root.dataset.phase
  if (!embeddedEnabled(element)) return undefined
  return contentRootOf(element)?.dataset.contentPhase
}

/** True when `element` is the root whose phase attribute decides its seats. */
export function isConversationPhaseRoot(element: Element): boolean {
  return phaseRootOf(element) === element || contentRootOf(element) === element
}
