const MENU_HOST_SELECTOR = ':scope > [data-windows-menu]'
const OWNED_STYLE_ATTRIBUTE = 'data-orca-windows-menu'

// The desktop shell draws its 应用 / 编辑 caption menubar inside an open shadow
// root with 6px rounded buttons. Colours arrive through inherited tokens and
// are handled in CSS; the corner is shadow-local, so ORCA's square shape
// contract has to be carried in as a skin-owned stylesheet.
const MENU_CSS = `
  button { border-radius: 0; corner-shape: square; }
`

/**
 * Square the Windows caption menubar so it hovers like the neighbouring
 * caption toggle. Only the <style> node this activation appended is removed on
 * disposal; the shell's own menubar, shadow root and styles are never touched.
 */
export function installOrcaWindowsMenu(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const owned = new Set<HTMLStyleElement>()

  const decorate = (): void => {
    const host = body.querySelector<HTMLElement>(MENU_HOST_SELECTOR)
    const shadow = host?.shadowRoot
    if (shadow == null) return
    for (const style of owned) {
      if (style.parentNode === shadow) return
    }
    const style = doc.createElement('style')
    style.setAttribute(OWNED_STYLE_ATTRIBUTE, '')
    style.textContent = MENU_CSS
    shadow.append(style)
    owned.add(style)
  }

  // The shell mounts the menubar once its overlay exists, which can be after
  // the skin applies; only direct body children matter.
  const observer = new MutationObserver(decorate)
  observer.observe(body, { childList: true })
  decorate()

  return () => {
    observer.disconnect()
    owned.forEach(style => { style.remove() })
    owned.clear()
  }
}
