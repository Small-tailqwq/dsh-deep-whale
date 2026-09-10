import { hasMutationOutsideTerminal } from './mutation-filter.ts'
import { createOrcaSettingsNavigation } from './settings-navigation.ts'

const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog']"
const SETTINGS_OPEN_ATTRIBUTE = 'data-orca-settings-open'
const CORDIS_PANEL_SELECTOR = "[data-slot='sidebar.footer.action'] [data-cordis-panel]"
const CORDIS_OPEN_ATTRIBUTE = 'data-orca-cordis-panel-open'
const LAMP_ATTRIBUTE = 'data-orca-lamp'
const LAMP_FLICKER_MS = 1000

/** Keep the root stacking context above body-level plugin panels while the settings dialog owns the viewport. */
export function installOrcaSettingsOverlay(body: HTMLElement): () => void {
  const originallyOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
  const originallyCordisOpen = body.hasAttribute(CORDIS_OPEN_ATTRIBUTE)
  const originalLamp = body.getAttribute(LAMP_ATTRIBUTE)
  let lampTimer: ReturnType<typeof setTimeout> | undefined
  let wasDark = body.hasAttribute('data-ds-dark-theme')
  const navigation = createOrcaSettingsNavigation(body)

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

  const synchronize = (navigationChanged: boolean): void => {
    const wasOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null)
    const isOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
    if (navigationChanged || wasOpen !== isOpen) navigation.synchronize()
    if (wasOpen && !isOpen) triggerLamp()
    // The cordis plugin panel has no state attribute of its own; keep the
    // body-level `:has()`-free rules driven by a JS-maintained flag instead of
    // letting Chromium re-evaluate a document-wide `:has()` on every mutation.
    body.toggleAttribute(CORDIS_OPEN_ATTRIBUTE, body.querySelector(CORDIS_PANEL_SELECTOR) !== null)
  }
  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) {
      synchronize(records.some(record => record.type === 'childList'
        && record.target instanceof Element
        && record.target.closest("[data-slot='sidebar.settings']") !== null))
    }
    synchronizeTheme()
  })

  const dispose = (): void => {
    observer.disconnect()
    navigation.dispose()
    if (lampTimer !== undefined) clearTimeout(lampTimer)
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, originallyOpen)
    body.toggleAttribute(CORDIS_OPEN_ATTRIBUTE, originallyCordisOpen)
    if (originalLamp === null) body.removeAttribute(LAMP_ATTRIBUTE)
    else body.setAttribute(LAMP_ATTRIBUTE, originalLamp)
  }
  try {
    observer.observe(body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ds-dark-theme'],
    })
    synchronize(true)
    synchronizeTheme()
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
