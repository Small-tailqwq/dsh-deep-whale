/**
 * Deep-sea maid atelier skin. The client entry keeps the bare two-character
 * background, collapsible sidebar artwork, brand lockup, and ornamental
 * chrome as independent layers. Every write is restored by the Cordis effect
 * disposer.
 */
import type { Context } from 'cordis'
import {
  MAID_ATELIER_BOW_CLEAN,
  MAID_ATELIER_BRAND,
  MAID_ATELIER_CHIBI,
  MAID_ATELIER_ICON,
  MAID_ATELIER_NEW_SESSION,
  MAID_ATELIER_SIDEBAR_SWAG,
  MAID_ATELIER_TOP_TRIM_TILE,
} from './art.ts'
import {
  MAID_ATELIER_MAID_LEFT,
  MAID_ATELIER_MAID_RIGHT,
  MAID_ATELIER_PALACE_DARK,
  MAID_ATELIER_PALACE_LIGHT,
} from './background-art.generated.ts'
import {
  MAID_ATELIER_BOTTOM_CREST,
  MAID_ATELIER_BOTTOM_TRIM_TILE,
  MAID_ATELIER_COMPOSER_FRAME,
  MAID_ATELIER_SETTINGS_FRAME,
  MAID_ATELIER_SIDEBAR_CORNER,
} from './chrome-art.generated.ts'
import {
  MAID_ATELIER_WORKSPACE_RIBBON,
  MAID_ATELIER_WORKSPACE_SHIELD,
} from './workspace-art.generated.ts'
import './maid-atelier.module.css'

const SKIN_TITLE = '深海女仆工坊 · DeepSeek Harness'
const SKIN_OWNER = 'maid-atelier'
const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"

const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
  '--maid-sidebar-width',
  '--maid-top-trim-art',
  '--maid-bottom-trim-art',
  '--maid-bottom-crest-art',
  '--maid-bow-art',
  '--maid-new-session-art',
  '--maid-sidebar-swag-art',
  '--maid-sidebar-corner-art',
  '--maid-composer-frame-art',
  '--maid-settings-frame-art',
  '--maid-workspace-crest-art',
  '--maid-workspace-ribbon-art',
] as const

function createCharacterStage(): HTMLDivElement {
  const stage = document.createElement('div')
  stage.dataset.skinChrome = 'character-stage'
  stage.dataset.skinOwner = SKIN_OWNER
  stage.setAttribute('aria-hidden', 'true')

  const left = document.createElement('img')
  left.dataset.maidCharacter = 'left'
  left.alt = ''
  left.src = MAID_ATELIER_MAID_LEFT

  const right = document.createElement('img')
  right.dataset.maidCharacter = 'right'
  right.alt = ''
  right.src = MAID_ATELIER_MAID_RIGHT

  stage.append(left, right)
  return stage
}

function createBrandLockup(): HTMLImageElement {
  const lockup = document.createElement('img')
  lockup.dataset.skinChrome = 'brand-lockup'
  lockup.dataset.skinOwner = SKIN_OWNER
  lockup.setAttribute('aria-hidden', 'true')
  lockup.alt = ''
  lockup.src = MAID_ATELIER_BRAND
  return lockup
}

function createSidebarCorners(): HTMLDivElement {
  const corners = document.createElement('div')
  corners.dataset.skinChrome = 'sidebar-corners'
  corners.dataset.skinOwner = SKIN_OWNER
  corners.setAttribute('aria-hidden', 'true')
  for (const position of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) {
    const corner = document.createElement('span')
    corner.dataset.skinCorner = position
    corners.append(corner)
  }
  return corners
}

function decorateSidebar(): void {
  const sidebarRoot = document.querySelector<HTMLElement>(
    `${SIDEBAR_COLUMN_SELECTOR} > div`,
  )
  if (!sidebarRoot) return

  if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-corners']")) {
    sidebarRoot.prepend(createSidebarCorners())
  }

  if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-mascot']")) {
    const mascot = document.createElement('img')
    mascot.dataset.skinChrome = 'sidebar-mascot'
    mascot.dataset.skinOwner = SKIN_OWNER
    mascot.setAttribute('aria-hidden', 'true')
    mascot.alt = ''
    mascot.src = MAID_ATELIER_CHIBI
    sidebarRoot.prepend(mascot)
  }

  const brand = sidebarRoot.querySelector<HTMLElement>("button[class*='brand']")
  if (brand && !brand.querySelector("[data-skin-chrome='brand-lockup']")) {
    brand.append(createBrandLockup())
  }
}

function decorateWorkspaceTree(): void {
  const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
  if (!sidebar) return

  sidebar.querySelectorAll<HTMLElement>(
    '[data-maid-workspace-group], [data-maid-workspace-row], [data-maid-workspace-active], [data-maid-session-row], [data-maid-session-first], [data-maid-session-last]',
  ).forEach((element) => {
    delete element.dataset.maidWorkspaceGroup
    delete element.dataset.maidWorkspaceRow
    delete element.dataset.maidWorkspaceActive
    delete element.dataset.maidSessionRow
    delete element.dataset.maidSessionFirst
    delete element.dataset.maidSessionLast
  })

  sidebar.querySelectorAll<HTMLElement>("[role='tree']").forEach((tree) => {
    let workspaceRow: HTMLElement | undefined
    let sessionRows: HTMLElement[] = []
    const decorateGroup = (): void => {
      if (!workspaceRow) return

      workspaceRow.dataset.maidWorkspaceRow = ''
      if (workspaceRow.parentElement) workspaceRow.parentElement.dataset.maidWorkspaceGroup = ''
      sessionRows.forEach((sessionRow) => {
        sessionRow.dataset.maidSessionRow = ''
      })
      if (sessionRows[0]) sessionRows[0].dataset.maidSessionFirst = ''
      if (sessionRows.at(-1)) sessionRows.at(-1)!.dataset.maidSessionLast = ''

      const containsCurrent = workspaceRow.getAttribute('aria-expanded') === 'true'
        && sessionRows.some(sessionRow => sessionRow.getAttribute('aria-selected') === 'true')
      if (containsCurrent) workspaceRow.dataset.maidWorkspaceActive = ''
    }

    tree.querySelectorAll<HTMLElement>("[role='treeitem']").forEach((row) => {
      if (row.hasAttribute('aria-expanded')) {
        decorateGroup()
        workspaceRow = row
        sessionRows = []
      } else if (workspaceRow && row.hasAttribute('aria-selected')) {
        sessionRows.push(row)
      }
    })
    decorateGroup()
  })
}

/**
 * Apply the skin-owned background and independently retractable chrome.
 * @param ctx - owning context whose effect retracts every DOM and CSS write.
 */
export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const previous = new Map<string, string>()
  for (const property of BACKDROP_PROPERTIES) {
    previous.set(property, body.style.getPropertyValue(property))
  }

  body.dataset.dshMaidAtelier = ''
  body.style.setProperty('--maid-top-trim-art', `url(${MAID_ATELIER_TOP_TRIM_TILE})`)
  body.style.setProperty('--maid-bottom-trim-art', `url(${MAID_ATELIER_BOTTOM_TRIM_TILE})`)
  body.style.setProperty('--maid-bottom-crest-art', `url(${MAID_ATELIER_BOTTOM_CREST})`)
  body.style.setProperty('--maid-bow-art', `url(${MAID_ATELIER_BOW_CLEAN})`)
  body.style.setProperty('--maid-new-session-art', `url(${MAID_ATELIER_NEW_SESSION})`)
  body.style.setProperty('--maid-sidebar-swag-art', `url(${MAID_ATELIER_SIDEBAR_SWAG})`)
  body.style.setProperty('--maid-sidebar-corner-art', `url(${MAID_ATELIER_SIDEBAR_CORNER})`)
  body.style.setProperty('--maid-composer-frame-art', `url(${MAID_ATELIER_COMPOSER_FRAME})`)
  body.style.setProperty('--maid-settings-frame-art', `url(${MAID_ATELIER_SETTINGS_FRAME})`)
  body.style.setProperty('--maid-workspace-crest-art', `url(${MAID_ATELIER_WORKSPACE_SHIELD})`)
  body.style.setProperty('--maid-workspace-ribbon-art', `url(${MAID_ATELIER_WORKSPACE_RIBBON})`)

  const syncBackdrop = (): void => {
    const source = body.hasAttribute('data-ds-dark-theme')
      ? MAID_ATELIER_PALACE_DARK
      : MAID_ATELIER_PALACE_LIGHT
    body.style.setProperty('background-image', `url(${source})`)
  }
  syncBackdrop()
  body.style.setProperty('background-position', 'center top')
  body.style.setProperty('background-size', 'cover')
  body.style.setProperty('background-attachment', 'fixed')
  body.style.setProperty('background-repeat', 'no-repeat')

  let observedSidebar: HTMLElement | undefined
  let resizeObserver: ResizeObserver | undefined
  let composerPhase: 'hero' | 'active' | undefined
  let composerMotionTimer: ReturnType<typeof setTimeout> | undefined

  // 宽度联动写入独立的 <style> 规则而非 body style：CSSOM 修改不产生
  // attribute mutation，Chrome autofill 的 MutationObserver 不会逐帧触发，
  // 因此可以每帧跟随侧边栏宽度（幕布瞬移跟手）而无需防抖节流。
  const widthSheet = document.createElement('style')
  widthSheet.dataset.skinChrome = 'sidebar-width-rule'
  widthSheet.dataset.skinOwner = SKIN_OWNER
  document.head.append(widthSheet)
  widthSheet.sheet!.insertRule('body { --maid-sidebar-width: 280px; --maid-sidebar-swag-height: 72.1px; --maid-sidebar-mascot-width: 229.6px; }')
  const widthRule = widthSheet.sheet!.cssRules[0] as CSSStyleRule

  const applySidebarWidth = (width: number): void => {
    if (width <= 0) return
    const roundPx = (value: number): string => `${Math.round(value * 100) / 100}px`
    widthRule.style.setProperty('--maid-sidebar-width', roundPx(width))
    widthRule.style.setProperty('--maid-sidebar-swag-height', roundPx(Math.min(94, Math.max(54, width * 0.2575))))
    widthRule.style.setProperty('--maid-sidebar-mascot-width', roundPx(Math.min(320, width * 0.82)))
    body.dataset.maidSidebarSize = width <= 120 ? 'rail' : width <= 220 ? 'narrow' : 'wide'
    if (width <= 104) body.dataset.maidSidebarCompact = ''
    else delete body.dataset.maidSidebarCompact
  }

  const clearSidebarWidth = (): void => {
    widthRule.style.setProperty('--maid-sidebar-width', '0px')
    widthRule.style.setProperty('--maid-sidebar-swag-height', '54px')
    widthRule.style.setProperty('--maid-sidebar-mascot-width', '0px')
    body.dataset.maidSidebarSize = 'rail'
    body.dataset.maidSidebarCompact = ''
  }

  const ensureSidebarObserved = (): void => {
    const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
    if (!sidebar || !resizeObserver || sidebar === observedSidebar) return
    if (observedSidebar) resizeObserver.unobserve(observedSidebar)
    observedSidebar = sidebar
    resizeObserver.observe(sidebar)
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries.at(-1)
      if (entry) applySidebarWidth(entry.contentRect.width)
    })
  }

  const syncComposerMotion = (): void => {
    const phaseRoot = document.querySelector<HTMLElement>("[data-phase='hero'], [data-phase='active']")
    const next = phaseRoot?.dataset.phase
    if (next !== 'hero' && next !== 'active') return

    if (composerPhase !== undefined && composerPhase !== next) {
      body.dataset.maidComposerMotion = next === 'active' ? 'dock' : 'rise'
      if (composerMotionTimer !== undefined) clearTimeout(composerMotionTimer)
      composerMotionTimer = setTimeout(() => {
        delete body.dataset.maidComposerMotion
        composerMotionTimer = undefined
      }, 560)
    }
    composerPhase = next
  }

  decorateSidebar()
  decorateWorkspaceTree()
  ensureSidebarObserved()
  const initialSidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
  if (initialSidebar) applySidebarWidth(initialSidebar.getBoundingClientRect().width)
  syncComposerMotion()

  body.prepend(createCharacterStage())

  const syncSidebarDecorations = (): void => {
    decorateSidebar()
    decorateWorkspaceTree()
    ensureSidebarObserved()
    const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
    if (sidebar === null) clearSidebarWidth()
    else if (resizeObserver === undefined) applySidebarWidth(sidebar.getBoundingClientRect().width)
  }

  const isSkinChrome = (node: Node): boolean => (
    node instanceof Element && node.getAttribute('data-skin-owner') === SKIN_OWNER
  )

  // ResizeObserver writes the animated width through CSSOM, so it never enters
  // this observer. Keep structural decoration in the MutationObserver checkpoint
  // before paint: delaying every change made the wide/rail hand-off visibly late.
  // Skin-owned insertions are ignored so decorating a React-owned node cannot
  // schedule a redundant whole-sidebar pass.
  const observer = new MutationObserver((records) => {
    let sidebarStructureChanged = false
    let workspaceStateChanged = false
    let backdropChanged = false
    let composerChanged = false
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.attributeName === 'aria-expanded' || record.attributeName === 'aria-selected') {
          workspaceStateChanged = true
        } else if (record.attributeName === 'data-ds-dark-theme') {
          backdropChanged = true
        } else if (record.attributeName === 'data-phase') {
          composerChanged = true
        }
        continue
      }
      const appNodes = [...record.addedNodes, ...record.removedNodes]
        .some(node => node instanceof Element && !isSkinChrome(node))
      if (appNodes) {
        sidebarStructureChanged = true
        composerChanged = true
      }
    }
    if (sidebarStructureChanged) syncSidebarDecorations()
    else if (workspaceStateChanged) decorateWorkspaceTree()
    if (backdropChanged) syncBackdrop()
    if (composerChanged) syncComposerMotion()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['aria-expanded', 'aria-selected', 'data-ds-dark-theme', 'data-phase'],
    childList: true,
    subtree: true,
  })

  const topTrim = document.createElement('div')
  topTrim.dataset.skinChrome = 'top-trim'
  topTrim.dataset.skinOwner = SKIN_OWNER
  topTrim.setAttribute('aria-hidden', 'true')
  const landingTrimLayer = document.createElement('div')
  landingTrimLayer.dataset.skinTrimLayer = 'landing'
  const workspaceTrimLayer = document.createElement('div')
  workspaceTrimLayer.dataset.skinTrimLayer = 'workspace'
  topTrim.append(landingTrimLayer, workspaceTrimLayer)
  body.append(topTrim)

  const bottomTrim = document.createElement('div')
  bottomTrim.dataset.skinChrome = 'bottom-trim'
  bottomTrim.dataset.skinOwner = SKIN_OWNER
  bottomTrim.setAttribute('aria-hidden', 'true')
  body.append(bottomTrim)

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/png'
  favicon.href = MAID_ATELIER_ICON
  favicon.dataset.skinChrome = 'favicon'
  favicon.dataset.skinOwner = SKIN_OWNER
  document.head.append(favicon)

  document.title = SKIN_TITLE

  ctx.effect(() => () => {
    delete body.dataset.dshMaidAtelier
    delete body.dataset.maidComposerMotion
    delete body.dataset.maidSidebarCompact
    delete body.dataset.maidSidebarSize
    if (composerMotionTimer !== undefined) clearTimeout(composerMotionTimer)
    observer.disconnect()
    resizeObserver?.disconnect()
    for (const [property, value] of previous) {
      body.style.setProperty(property, value)
    }
    document.querySelectorAll(`[data-skin-owner='${SKIN_OWNER}']`).forEach(element => element.remove())
    document.querySelectorAll<HTMLElement>(
      '[data-maid-workspace-group], [data-maid-workspace-row], [data-maid-workspace-active], [data-maid-session-row], [data-maid-session-first], [data-maid-session-last]',
    ).forEach((element) => {
      delete element.dataset.maidWorkspaceGroup
      delete element.dataset.maidWorkspaceRow
      delete element.dataset.maidWorkspaceActive
      delete element.dataset.maidSessionRow
      delete element.dataset.maidSessionFirst
      delete element.dataset.maidSessionLast
    })
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-maid-atelier: layered background and ornament')
}
