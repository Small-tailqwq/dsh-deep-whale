/**
 * The sidebar releases a layer of its own chrome around a tooltip, a modal
 * dialog or a cordis panel that mounts inside it. CSS can only reach that
 * *ancestor* through `:has()`, which cannot be fast-rejected: every style pass
 * evaluated it on every element in the document (186k attempts over six panel
 * toggles; the tooltip probe alone cost 87ms). The client tags the few
 * carriers instead, and the stylesheet matches the tag.
 */
export const ORCA_CARRIER_MARKS = {
  tooltip: 'data-orca-tooltip-carrier',
  tooltipRoot: 'data-orca-tooltip-root',
  dialog: 'data-orca-dialog-carrier',
  cordis: 'data-orca-cordis-carrier',
} as const

const SIDEBAR_ROOT_SELECTOR = "[data-slot='sidebar'] > :first-child"
const TOOLTIP_SELECTOR = "[role='tooltip']"
const DIALOG_SELECTOR = "[role='dialog']"
const CORDIS_PANEL_SELECTOR = '[data-cordis-panel]'

function mark(element: Element, attribute: string, on: boolean): void {
  if (element.hasAttribute(attribute) !== on) element.toggleAttribute(attribute, on)
}

/** Tag the sidebar root, and the root's children, that hold a tooltip, dialog or cordis panel. */
export function syncOrcaSidebarCarriers(root: ParentNode = document): void {
  for (const pane of root.querySelectorAll(SIDEBAR_ROOT_SELECTOR)) {
    mark(pane, ORCA_CARRIER_MARKS.tooltipRoot, pane.querySelector(TOOLTIP_SELECTOR) !== null)
    for (const child of pane.children) {
      mark(child, ORCA_CARRIER_MARKS.tooltip, child.querySelector(TOOLTIP_SELECTOR) !== null)
      mark(child, ORCA_CARRIER_MARKS.dialog, child.querySelector(DIALOG_SELECTOR) !== null)
      mark(child, ORCA_CARRIER_MARKS.cordis, child.querySelector(CORDIS_PANEL_SELECTOR) !== null)
    }
  }
}

export function clearOrcaSidebarCarriers(root: ParentNode = document): void {
  const attributes = Object.values(ORCA_CARRIER_MARKS)
  const selector = attributes.map(attribute => `[${attribute}]`).join(', ')
  for (const element of root.querySelectorAll(selector)) {
    for (const attribute of attributes) element.removeAttribute(attribute)
  }
}
