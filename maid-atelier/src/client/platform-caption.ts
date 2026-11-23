import type { Context } from '@deepseek-ai/cordis'

/** Match the account feature's full-window portal without depending on localized labels. */
function platformOverlay(body: HTMLElement): HTMLElement | undefined {
  return Array.from(body.children).find((element): element is HTMLElement =>
    element instanceof HTMLElement
    && element.matches("[role='dialog'][aria-modal='true']")
    && Array.from(element.classList).some(name => name.endsWith('_overlay'))
    && element.querySelector(':scope > header[data-window-drag]') !== null
    && Array.from(element.children).some(child =>
      Array.from(child.classList).some(name => name.endsWith('_viewport'))))
}

/** Keep native Windows controls on the palette of the account page covering the main frame. */
export function installMaidPlatformCaption(ctx: Context, body: HTMLElement): void {
  if (!document.documentElement.hasAttribute('data-windows-titlebar')) return
  let sheet: HTMLStyleElement | undefined
  let observer: MutationObserver | undefined
  // The preload also samples on the head's stylesheet-load event. Notify it
  // in this checkpoint so native chrome does not wait behind other observers.
  const resample = (): void => { document.head.dispatchEvent(new Event('load')) }
  const clear = (): void => {
    if (sheet === undefined) return
    sheet.remove()
    sheet = undefined
    resample()
  }
  ctx.effect(() => () => {
    observer?.disconnect()
    clear()
  }, 'ui-skin-maid-atelier: account page caption palette')

  const sync = (): void => {
    const overlay = platformOverlay(body)
    if (overlay === undefined) {
      clear()
      return
    }
    const palette = getComputedStyle(overlay)
    // The preload does not observe portal mount/unmount. An owned stylesheet
    // supplies the temporary probe palette; resample only after it is applied.
    const css = `
html[data-windows-titlebar] body[data-dsh-maid-atelier]
  > span[style*='--dsw-specific-sidebar-fill'][style*='--dsw-alias-label-primary'] {
  --dsw-specific-sidebar-fill: ${palette.backgroundColor} !important;
  --dsw-alias-label-primary: ${palette.getPropertyValue('--dsw-alias-label-primary')} !important;
}
html[data-windows-titlebar] body[data-dsh-maid-atelier] > [data-windows-menu] {
  --dsw-alias-label-primary: ${palette.getPropertyValue('--dsw-alias-label-primary')} !important;
  --dsw-alias-label-secondary: ${palette.getPropertyValue('--dsw-alias-label-secondary')} !important;
  --dsw-alias-interactive-bg-hover: ${palette.getPropertyValue('--dsw-alias-interactive-bg-hover')} !important;
}`
    if (sheet === undefined) {
      sheet = document.createElement('style')
      sheet.dataset.skinOwner = 'maid-atelier'
      sheet.textContent = css
      document.head.append(sheet)
    } else if (sheet.textContent !== css) sheet.textContent = css
    else return
    resample()
  }
  observer = new MutationObserver(sync)
  observer.observe(body, {
    childList: true,
    attributes: true,
    attributeFilter: ['data-ds-dark-theme'],
  })
  sync()
}
