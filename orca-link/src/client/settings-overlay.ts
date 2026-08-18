import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog']"
const SETTINGS_OPEN_ATTRIBUTE = 'data-orca-settings-open'
const LAMP_ATTRIBUTE = 'data-orca-lamp'
const LAMP_FLICKER_MS = 1000

/** Keep the root stacking context above body-level plugin panels while the settings dialog owns the viewport. */
export function installOrcaSettingsOverlay(body: HTMLElement): () => void {
  const originallyOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
  const originalLamp = body.getAttribute(LAMP_ATTRIBUTE)
  let lampTimer: ReturnType<typeof setTimeout> | undefined
  let wasDark = body.hasAttribute('data-ds-dark-theme')

  const triggerLamp = (): void => {
    if (body.hasAttribute('data-ds-dark-theme') !== true) return
    body.setAttribute(LAMP_ATTRIBUTE, 'flicker')
    if (lampTimer !== undefined) clearTimeout(lampTimer)
    lampTimer = setTimeout(() => {
      if (body.getAttribute(LAMP_ATTRIBUTE) === 'flicker') body.removeAttribute(LAMP_ATTRIBUTE)
    }, LAMP_FLICKER_MS)
  }

  const synchronizeTheme = (): void => {
    const isDark = body.hasAttribute('data-ds-dark-theme')
    if (wasDark && !isDark) {
      if (lampTimer !== undefined) clearTimeout(lampTimer)
      body.removeAttribute(LAMP_ATTRIBUTE)
    }
    wasDark = isDark
  }

  const synchronize = (): void => {
    const wasOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null)
    const isOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
    if (wasOpen && !isOpen) triggerLamp()
  }
  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) synchronize()
    synchronizeTheme()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-ds-dark-theme'],
  })
  synchronize()
  synchronizeTheme()

  return () => {
    observer.disconnect()
    if (lampTimer !== undefined) clearTimeout(lampTimer)
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, originallyOpen)
    if (originalLamp === null) body.removeAttribute(LAMP_ATTRIBUTE)
    else body.setAttribute(LAMP_ATTRIBUTE, originalLamp)
  }
}
