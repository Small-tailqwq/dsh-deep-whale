import { hasMutationOutsideTranscript } from './mutation-filter.ts'
import { createOrcaSettingsNavigation } from './settings-navigation.ts'

// Through DSH 0.1.7-rc.1 the panel mounts inside the settings slot; from rc.2 it
// portals to <body> and names itself with `data-shortcut-modal='settings'`.
const SETTINGS_SLOT_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog']"
const SETTINGS_DIALOG_SELECTOR = `${SETTINGS_SLOT_DIALOG_SELECTOR}, [role='dialog'][data-shortcut-modal='settings']`
const SETTINGS_OWNER_SELECTOR = "[data-slot='sidebar.settings'], [role='dialog'][data-shortcut-modal='settings']"
const SETTINGS_OPEN_ATTRIBUTE = 'data-orca-settings-open'
// Only the rc.1 slot mount puts the fixed panel inside the sidebar tree; the
// sidebar stacking and clipping releases are for that containment alone.
const SETTINGS_IN_SIDEBAR_ATTRIBUTE = 'data-orca-settings-in-sidebar'
const CORDIS_PANEL_SELECTOR = "[data-slot='sidebar.footer.action'] [data-cordis-panel]"
const CORDIS_OPEN_ATTRIBUTE = 'data-orca-cordis-panel-open'
const LAMP_ATTRIBUTE = 'data-orca-lamp'
const LAMP_FLICKER_MS = 1000

/** Keep the root stacking context above body-level plugin panels while the settings dialog owns the viewport. */
export function installOrcaSettingsOverlay(body: HTMLElement): () => void {
  const originallyOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
  const originallyInSidebar = body.hasAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE)
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
    const inSidebar = body.querySelector(SETTINGS_SLOT_DIALOG_SELECTOR) !== null
    if (body.hasAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE) !== inSidebar) body.toggleAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE, inSidebar)
    const isOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE)
    if (navigationChanged || wasOpen !== isOpen) navigation.synchronize()
    if (wasOpen && !isOpen) triggerLamp()
    // The cordis plugin panel has no state attribute of its own; keep the
    // body-level `:has()`-free rules driven by a JS-maintained flag instead of
    // letting Chromium re-evaluate a document-wide `:has()` on every mutation.
    body.toggleAttribute(CORDIS_OPEN_ATTRIBUTE, body.querySelector(CORDIS_PANEL_SELECTOR) !== null)
  }
  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTranscript(records)) {
      synchronize(records.some(record => record.type === 'childList'
        && record.target instanceof Element
        && record.target.closest(SETTINGS_OWNER_SELECTOR) !== null))
    }
    synchronizeTheme()
  })

  const dispose = (): void => {
    observer.disconnect()
    navigation.dispose()
    if (lampTimer !== undefined) clearTimeout(lampTimer)
    body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, originallyOpen)
    body.toggleAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE, originallyInSidebar)
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
