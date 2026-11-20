/**
 * The host's layout writes `document.title` from its own session-title effect
 * (`@deepseek-ai/dsh-client-ui-layout/src/client/DocumentTitle.tsx`), which
 * formats it as `${session} — ${product}` and restores the product name when
 * the panel is not a session. Writing the skin's title once at apply time
 * therefore survives only until the first conversation switch.
 *
 * Claim the title element instead: paint the skin title, watch it, and put it
 * back whenever the host overwrites it. Disposing hands the title back the same
 * way the favicon and body-attribute leases do — only if it is still ours.
 */
export interface TitleLease {
  dispose(): void
}

export function claimDocumentTitle(doc: Document, title: string): TitleLease {
  const previous = doc.title
  // The host's most recent intent, captured before each re-paint, so disposing
  // hands back what the host asked for rather than the title the skin replaced.
  let hostTitle = previous
  let applying = false

  const paint = (): void => {
    const element = doc.head.querySelector('title')
    if (element === null) return
    if (element.textContent === title) return
    applying = true
    element.textContent = title
    applying = false
  }

  paint()

  const observer = new MutationObserver(() => {
    // Our own write re-enters the observer; skip that pass instead of
    // re-painting forever.
    if (applying) return
    const element = doc.head.querySelector('title')
    if (element !== null && element.textContent !== null && element.textContent !== title) {
      hostTitle = element.textContent
    }
    paint()
  })
  observer.observe(doc.head, { childList: true, characterData: true, subtree: true })

  return {
    dispose(): void {
      observer.disconnect()
      if (doc.title === title) doc.title = hostTitle
    },
  }
}
