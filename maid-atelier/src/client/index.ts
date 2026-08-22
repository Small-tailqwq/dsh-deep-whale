/**
 * Deep-sea maid atelier skin. The client entry keeps the character variants
 * background, collapsible sidebar artwork, and ornamental chrome as
 * independent layers. The sidebar keeps the product's native vector
 * wordmark; every skin-owned write is restored by the Cordis effect disposer.
 */
import type { Context } from '@deepseek-ai/cordis'
import {
  MAID_ATELIER_BOW_CLEAN,
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
import { MAID_ATELIER_MAID_RIGHT_VISION } from './vision-art.generated.ts'
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
import { MAID_ATELIER_TITLEBAR_BRAND } from './titlebar-brand.ts'
import { installMaidComposerCapsule } from './composer-capsule.ts'
import { installMaidComposerScroll } from './composer-scroll.ts'
import { installMaidCustomization } from './customization.ts'
import { installMaidTableCards } from './table-card.ts'

const SKIN_TITLE = '深海女仆工坊 · DeepSeek Harness'
const SKIN_OWNER = 'maid-atelier'
const SKIN_SYSTEM_CHROME_COLOR = '#0b193f'
const VIEWPORT_RESIZE_SETTLE_MS = 120
const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
const CONVERSATION_COLUMN_SELECTOR = ":is([data-pane='conversation'], [class*='centerCol'])"
const SETTINGS_TRIGGER_SELECTOR = "[data-slot='sidebar.settings'] > :is(button, [role='button'])"
const SETTINGS_MASK_SELECTOR = "[role='presentation'] > [class*='mask']"
const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']"
const ACTIVE_CONVERSATION_SELECTOR = "[data-phase='active']"
const ACTIVE_CHAT_SELECTOR = `${ACTIVE_CONVERSATION_SELECTOR} [data-chat-flow]`
const WORKSPACE_SELECTOR = "header [role='tablist']"
const CORDIS_PANEL_SELECTOR = '[data-cordis-panel]'
const TERMINAL_SELECTOR = '.xterm'

interface AttributeLeaseState {
  originalValue: string | null
  owners: Set<symbol>
  value: string
}

const bodyAttributeLeases = new WeakMap<HTMLElement, Map<string, AttributeLeaseState>>()

function createBodyAttributeLease(body: HTMLElement, attribute: string, value = ''): {
  acquire: () => void
  release: () => void
} {
  const owner = Symbol(attribute)
  let active = false

  return {
    acquire(): void {
      if (active) return
      let attributes = bodyAttributeLeases.get(body)
      if (attributes === undefined) {
        attributes = new Map()
        bodyAttributeLeases.set(body, attributes)
      }
      let state = attributes.get(attribute)
      if (state === undefined) {
        state = {
          originalValue: body.getAttribute(attribute),
          owners: new Set(),
          value,
        }
        attributes.set(attribute, state)
      }
      state.owners.add(owner)
      active = true
      body.setAttribute(attribute, state.value)
    },
    release(): void {
      if (!active) return
      active = false
      const attributes = bodyAttributeLeases.get(body)
      const state = attributes?.get(attribute)
      if (state === undefined || !state.owners.delete(owner)) return
      if (state.owners.size > 0) {
        body.setAttribute(attribute, state.value)
        return
      }
      attributes?.delete(attribute)
      if (attributes?.size === 0) bodyAttributeLeases.delete(body)
      if (body.getAttribute(attribute) !== state.value) return
      if (state.originalValue === null) body.removeAttribute(attribute)
      else body.setAttribute(attribute, state.originalValue)
    },
  }
}

const PROJECTED_STATE_ATTRIBUTES = {
  activeChat: 'data-maid-chat-active',
  activeConversation: 'data-maid-conversation-active',
  cordisPanelOpen: 'data-maid-cordis-panel-open',
  settingsOpen: 'data-maid-settings-open',
  workspace: 'data-maid-workspace',
} as const

const PROJECTED_STATE_SELECTOR = [
  ACTIVE_CONVERSATION_SELECTOR,
  '[data-chat-flow]',
  WORKSPACE_SELECTOR,
  CORDIS_PANEL_SELECTOR,
  "[data-slot='sidebar.settings']",
].join(', ')

/** Workspace decoration flags, listed so diff application iterates a fixed order. */
const WORKSPACE_FLAGS = [
  'data-maid-workspace-group',
  'data-maid-workspace-row',
  'data-maid-workspace-active',
  'data-maid-session-row',
  'data-maid-session-flat',
  'data-maid-session-first',
  'data-maid-session-last',
] as const

const WORKSPACE_FLAG_SELECTOR = WORKSPACE_FLAGS.map(flag => `[${flag}]`).join(', ')

const SIDEBAR_FOOTER_FLAG = 'data-maid-sidebar-footer'

const BACKDROP_PROPERTIES = [
  '--maid-palace-art',
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

  const vision = document.createElement('img')
  vision.dataset.maidCharacter = 'vision'
  vision.alt = ''
  vision.src = MAID_ATELIER_MAID_RIGHT_VISION

  stage.append(left, right, vision)
  return stage
}

/**
 * Seat the character stage (palace + both maids) inside the conversation
 * column. The stage is a first child at z-index 0; the ConversationRoot
 * paints above it by DOM order once the skin gives it `position: relative`
 * without a z-index (no new stacking context, so fixed popups keep their
 * page-level tier). The column is the chat-owning box, so any layout push
 * (right/bottom workbenches) moves the artwork with the chat instead of
 * leaving it fixed to the viewport. When the column has not mounted yet the
 * stage waiter returns false; the conversation-column mutation path retries
 * once the chat area appears or is replaced.
 */
function ensureChatAreaStage(stage: HTMLElement): boolean {
  const chat = document.querySelector<HTMLElement>(CONVERSATION_COLUMN_SELECTOR)
  if (!chat) return false
  if (stage.parentElement !== chat) chat.prepend(stage)
  return true
}

function ensureChatAreaChrome(...chrome: HTMLElement[]): boolean {
  const chat = document.querySelector<HTMLElement>(CONVERSATION_COLUMN_SELECTOR)
  if (!chat) return false
  for (const element of chrome) {
    if (element.parentElement !== chat) chat.append(element)
  }
  return true
}

function hasAcceleratedWebGL(): boolean {
  if (typeof WebGLRenderingContext === 'undefined') return false
  const canvas = document.createElement('canvas')
  const options: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true }
  for (const kind of ['webgl2', 'webgl'] as const) {
    try {
      const context = canvas.getContext(kind, options)
      if (context === null) continue
      context.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    } catch {
      // A blocked or software-only context should use the CPU-safe CSS path.
    }
  }
  return false
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

/**
 * Place the whale-free DeepSeek Harness wordmark at the left of the
 * frameless title bar (Web-app overlay / desktop shell), mirroring the
 * sidebar brand at a smaller scale.
 */
function decorateTitlebarBrand(ownedNodes: Set<Element>): void {
  const titlebar = document.querySelector<HTMLElement>("[class*='titlebar']")
  if (!titlebar) return
  if (titlebar.querySelector("[data-skin-chrome='titlebar-brand']")) return
  const brand = document.createElement('span')
  brand.dataset.skinChrome = 'titlebar-brand'
  brand.dataset.skinOwner = SKIN_OWNER
  brand.setAttribute('aria-hidden', 'true')
  brand.innerHTML = MAID_ATELIER_TITLEBAR_BRAND
  ownedNodes.add(brand)
  titlebar.prepend(brand)
}
function decorateSidebar(ownedNodes: Set<Element>, decoratedElements: Set<HTMLElement>): void {
  const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
  const sidebarRoot = sidebar?.querySelector<HTMLElement>(':scope > div')
  if (!sidebar || !sidebarRoot) return

  /* Write only the delta: every attribute write is a mutation record that the
     page's other observers (and style invalidation) pay for, and a resize
     storm re-runs this pass per structural change. */
  const settingsSlot = sidebar.querySelector<HTMLElement>("[data-slot='sidebar.settings']")
  let footer: HTMLElement | undefined
  if (settingsSlot) {
    let candidate = settingsSlot.parentElement
    while (candidate && candidate !== sidebar) {
      if (candidate.querySelector("[data-slot='sidebar.footer.action']")) {
        footer = candidate
        break
      }
      candidate = candidate.parentElement
    }
  }
  sidebar.querySelectorAll<HTMLElement>(`[${SIDEBAR_FOOTER_FLAG}]`).forEach((element) => {
    if (element === footer) return
    delete element.dataset.maidSidebarFooter
    decoratedElements.delete(element)
  })
  if (footer && !footer.hasAttribute(SIDEBAR_FOOTER_FLAG)) {
    footer.dataset.maidSidebarFooter = ''
    decoratedElements.add(footer)
  }

  if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-corners']")) {
    const corners = createSidebarCorners()
    ownedNodes.add(corners)
    sidebarRoot.prepend(corners)
  }

  if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-mascot']")) {
    const mascot = document.createElement('img')
    mascot.dataset.skinChrome = 'sidebar-mascot'
    mascot.dataset.skinOwner = SKIN_OWNER
    mascot.setAttribute('aria-hidden', 'true')
    mascot.alt = ''
    mascot.src = MAID_ATELIER_CHIBI
    ownedNodes.add(mascot)
    sidebarRoot.prepend(mascot)
  }

}

function decorateWorkspaceTree(decoratedElements: Set<HTMLElement>): void {
  const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
  if (!sidebar) return

  /* Compute the desired flags first, then write only the delta. During a
     resize storm this pass re-runs per structural mutation; unconditional
     delete+rewrite pairs would emit zero-net-change mutation records that
     other page observers and style invalidation pay for every frame. */
  const current = new Map<HTMLElement, Set<string>>()
  sidebar.querySelectorAll<HTMLElement>(WORKSPACE_FLAG_SELECTOR).forEach((element) => {
    const flags = new Set<string>()
    for (const flag of WORKSPACE_FLAGS) {
      if (element.hasAttribute(flag)) flags.add(flag)
    }
    current.set(element, flags)
  })
  const desired = new Map<HTMLElement, Set<string>>()
  const claim = (element: HTMLElement, flag: string): void => {
    let flags = desired.get(element)
    if (!flags) { flags = new Set(); desired.set(element, flags) }
    flags.add(flag)
  }

  sidebar.querySelectorAll<HTMLElement>("[role='tree']").forEach((tree) => {
    const rows = [...tree.querySelectorAll<HTMLElement>("[role='treeitem']")]
    if (tree.matches("[class*='flatList']") && !rows.some(row => row.hasAttribute('aria-expanded'))) {
      rows.filter(row => row.hasAttribute('aria-selected')).forEach((sessionRow) => {
        claim(sessionRow, 'data-maid-session-row')
        claim(sessionRow, 'data-maid-session-flat')
      })
      return
    }

    let workspaceRow: HTMLElement | undefined
    let sessionRows: HTMLElement[] = []
    const decorateGroup = (): void => {
      if (!workspaceRow) return

      claim(workspaceRow, 'data-maid-workspace-row')
      if (workspaceRow.parentElement) {
        claim(workspaceRow.parentElement, 'data-maid-workspace-group')
      }
      sessionRows.forEach((sessionRow) => {
        claim(sessionRow, 'data-maid-session-row')
      })
      if (sessionRows[0]) claim(sessionRows[0], 'data-maid-session-first')
      if (sessionRows.at(-1)) claim(sessionRows.at(-1)!, 'data-maid-session-last')

      const containsCurrent = workspaceRow.getAttribute('aria-expanded') === 'true'
        && sessionRows.some(sessionRow => sessionRow.getAttribute('aria-selected') === 'true')
      if (containsCurrent) claim(workspaceRow, 'data-maid-workspace-active')
    }

    rows.forEach((row) => {
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

  const touched = new Set<HTMLElement>([...current.keys(), ...desired.keys()])
  for (const element of touched) {
    const before = current.get(element)
    const after = desired.get(element)
    if (before !== undefined) {
      for (const flag of before) {
        if (!after?.has(flag)) element.removeAttribute(flag)
      }
    }
    if (after !== undefined) {
      for (const flag of after) {
        if (!before?.has(flag)) element.setAttribute(flag, '')
      }
      if (after.size > 0) decoratedElements.add(element)
    }
  }
}

/**
 * Apply the skin-owned background and independently retractable chrome.
 * @param ctx - owning context whose effect retracts every DOM and CSS write.
 */
export function apply(ctx: Context): void {
  const body = document.body
  ctx.effect(() => installMaidCustomization(), 'ui-skin-maid-atelier: customization declaration')
  const originalTitle = document.title
  const layoutResizeLease = createBodyAttributeLease(body, 'data-maid-layout-resizing')
  const lowPowerLease = createBodyAttributeLease(body, 'data-maid-low-power')
  const previous = new Map<string, string>()
  for (const property of BACKDROP_PROPERTIES) {
    previous.set(property, body.style.getPropertyValue(property))
  }
  const previousProjectedStates = new Map<string, string | null>()
  for (const attribute of Object.values(PROJECTED_STATE_ATTRIBUTES)) {
    previousProjectedStates.set(attribute, body.getAttribute(attribute))
  }

  const ownedNodes = new Set<Element>()
  const decoratedElements = new Set<HTMLElement>()
  const characterStage = createCharacterStage()
  ownedNodes.add(characterStage)
  let themeColorMeta: HTMLMetaElement | null = null
  let previousThemeColor: string | undefined
  let themeColorObserver: MutationObserver | undefined
  let observedSidebar: HTMLElement | undefined
  let resizeObserver: ResizeObserver | undefined
  let composerPhase: 'hero' | 'active' | undefined
  let composerMotionTimer: ReturnType<typeof setTimeout> | undefined
  let viewportResizeTimer: ReturnType<typeof setTimeout> | undefined
  let handleViewportResize: (() => void) | undefined
  let railSearchFocusFrame: number | undefined
  let recoverRailSearchFocus: ((event: MouseEvent) => void) | undefined
  let settingsBackdropFrame: HTMLDivElement | undefined
  let observer: MutationObserver | undefined
  let titlebarOverlay: WindowControlsOverlay | undefined
  let syncTitlebarHeight: (() => void) | undefined
  let disposeMaidTableCards = (): void => {}

  ctx.effect(() => () => {
    delete body.dataset.dshMaidAtelier
    delete body.dataset.maidComposerMotion
    delete body.dataset.maidSidebarCompact
    delete body.dataset.maidSidebarSize
    for (const [attribute, value] of previousProjectedStates) {
      if (value === null) body.removeAttribute(attribute)
      else body.setAttribute(attribute, value)
    }
    disposeMaidComposerCapsule()
    disposeMaidComposerScroll()
    disposeMaidTableCards()
    if (composerMotionTimer !== undefined) clearTimeout(composerMotionTimer)
    if (viewportResizeTimer !== undefined) clearTimeout(viewportResizeTimer)
    if (handleViewportResize !== undefined) window.removeEventListener('resize', handleViewportResize)
    layoutResizeLease.release()
    lowPowerLease.release()
    if (railSearchFocusFrame !== undefined) cancelAnimationFrame(railSearchFocusFrame)
    if (recoverRailSearchFocus !== undefined) {
      document.removeEventListener('click', recoverRailSearchFocus)
    }
    observer?.disconnect()
    themeColorObserver?.disconnect()
    if (titlebarOverlay !== undefined && syncTitlebarHeight !== undefined) {
      titlebarOverlay.removeEventListener('geometrychange', syncTitlebarHeight)
    }
    resizeObserver?.disconnect()
    for (const [property, value] of previous) {
      body.style.setProperty(property, value)
    }
    ownedNodes.forEach(element => element.remove())
    decoratedElements.forEach((element) => {
      delete element.dataset.maidSidebarFooter
      delete element.dataset.maidWorkspaceGroup
      delete element.dataset.maidWorkspaceRow
      delete element.dataset.maidWorkspaceActive
      delete element.dataset.maidSessionRow
      delete element.dataset.maidSessionFlat
      delete element.dataset.maidSessionFirst
      delete element.dataset.maidSessionLast
    })
    if (themeColorMeta?.isConnected && themeColorMeta.content === SKIN_SYSTEM_CHROME_COLOR) {
      themeColorMeta.content = previousThemeColor ?? ''
    }
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-maid-atelier: layered background and ornament')

  handleViewportResize = (): void => {
    layoutResizeLease.acquire()
    if (viewportResizeTimer !== undefined) clearTimeout(viewportResizeTimer)
    viewportResizeTimer = setTimeout(() => {
      layoutResizeLease.release()
      viewportResizeTimer = undefined
    }, VIEWPORT_RESIZE_SETTLE_MS)
  }
  window.addEventListener('resize', handleViewportResize)
  if (!hasAcceleratedWebGL()) lowPowerLease.acquire()

  const syncSystemChrome = (): void => {
    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta === null) return
    if (meta !== themeColorMeta) {
      themeColorMeta = meta
      previousThemeColor = meta.content
    }
    if (meta.content !== SKIN_SYSTEM_CHROME_COLOR) meta.content = SKIN_SYSTEM_CHROME_COLOR
  }
  themeColorObserver = new MutationObserver(syncSystemChrome)
  themeColorObserver.observe(document.head, {
    attributes: true,
    attributeFilter: ['content'],
    childList: true,
    subtree: true,
  })
  syncSystemChrome()
  body.dataset.dshMaidAtelier = ''
  // Composer presentation modes (skin setting 「输入框显示方式」):
  // capsule collapses the empty unfocused card, scroll fades it on scroll-up.
  const disposeMaidComposerCapsule = installMaidComposerCapsule(body)
  const disposeMaidComposerScroll = installMaidComposerScroll(body)
  disposeMaidTableCards = installMaidTableCards(ctx).dispose
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
    const next = `url(${source})`
    // The palace rides a custom property so the stage inside the conversation
    // column owns the backdrop — the column's box (not the viewport) defines
    // where the art lives and how it re-fits when the chat area is pushed.
    if (body.style.getPropertyValue('--maid-palace-art') !== next) {
      body.style.setProperty('--maid-palace-art', next)
    }
  }
  syncBackdrop()

  // 宽度联动写入独立的 <style> 规则而非 body style：CSSOM 修改不产生
  // attribute mutation，Chrome autofill 的 MutationObserver 不会逐帧触发，
  // 因此可以每帧跟随侧边栏宽度（幕布瞬移跟手）而无需防抖节流。
  const widthSheet = document.createElement('style')
  widthSheet.dataset.skinChrome = 'sidebar-width-rule'
  widthSheet.dataset.skinOwner = SKIN_OWNER
  ownedNodes.add(widthSheet)
  document.head.append(widthSheet)
  widthSheet.sheet!.insertRule('body { --maid-sidebar-width: 280px; --maid-sidebar-swag-height: 72.1px; --maid-sidebar-mascot-width: 229.6px; --maid-titlebar-height: 0px; }')
  // The official frame rules reference env(titlebar-area-height), but the
  // CSS-modules pipeline rewrites the env() identifier there too, so the
  // title-bar row silently falls back to an auto row: expanding the sidebar
  // is fine, but collapsing it lets the content row’s max-content grow and
  // stretches the title-bar row to hundreds of pixels. Re-assert the rows
  // here through CSSOM, where env() survives verbatim (fallback 40px keeps
  // the headless/plain-tab mock sane), and pin the drag handles to the same
  // boundary.
  // insertRule defaults to index 0, which would push the body rule aside and
  // orphan the widthRule reference; append explicitly so cssRules[0] stays
  // the body variable rule.
  const appendRule = (rule: string): void => {
    widthSheet.sheet!.insertRule(rule, widthSheet.sheet!.cssRules.length)
  }
  appendRule('body[data-dsh-maid-atelier] [class*=\"frame\"][data-wco] { grid-template-rows: env(titlebar-area-height, 40px) 1fr; }')
  appendRule('body[data-dsh-maid-atelier] [class*=\"frame\"][data-desktop] { grid-template-rows: 32px 1fr; }')
  appendRule('body[data-dsh-maid-atelier] [class*=\"frame\"] [class*=\"handle\"] { top: var(--maid-titlebar-height, 0px); }')

  const widthRule = widthSheet.sheet!.cssRules[0] as CSSStyleRule
  // The curtain is position:fixed, so it needs the viewport-space top of
  // the frame's title-bar row. Measuring the sidebar column (the row below
  // it) is authoritative: whatever the title-bar height is — WCO env(), the
  // desktop 32px row, or a scaled window — the curtain lands exactly on the
  // rendered boundary, never a pixel off.
  syncTitlebarHeight = (): void => {
    const columns = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
    if (columns !== null) {
      const top = columns.getBoundingClientRect().top
      if (top > 0) {
        // Same-value CSSOM writes still invalidate the custom properties every
        // dependent (curtain translate, ::after centering, handles) reads back;
        // during a resize storm this pass runs per structural mutation, so a
        // redundant write forces one extra full layout for every other reader.
        if (widthRule.style.getPropertyValue('--maid-titlebar-height') !== `${top}px`) {
          widthRule.style.setProperty('--maid-titlebar-height', `${top}px`)
        }
        return
      }
    }
    // Desktop shell: fixed 32px row (columns not laid out yet).
    if (document.querySelector("[class*='frame'][data-desktop]") !== null) {
      widthRule.style.setProperty('--maid-titlebar-height', '32px')
      return
    }
    widthRule.style.setProperty('--maid-titlebar-height', '0px')
  }
  titlebarOverlay = navigator.windowControlsOverlay
  titlebarOverlay?.addEventListener('geometrychange', syncTitlebarHeight)
  syncTitlebarHeight()

  const applySidebarWidth = (width: number): void => {
    if (width <= 0) return
    const roundPx = (value: number): string => `${Math.round(value * 100) / 100}px`
    const nextSize = width <= 120 ? 'rail' : width <= 220 ? 'narrow' : 'wide'
    // ResizeObserver fires for height-only changes too; a same-value write of
    // --maid-sidebar-width re-invalidates every dependent (character translate,
    // curtain translate, ::after centering) and forces a full style pass per
    // frame. Write only when a derived state actually moved.
    const compact = width <= 104
    if (roundPx(width) === widthRule.style.getPropertyValue('--maid-sidebar-width')
      && body.dataset.maidSidebarSize === nextSize
      && body.hasAttribute('data-maid-sidebar-compact') === compact) {
      return
    }
    widthRule.style.setProperty('--maid-sidebar-width', roundPx(width))
    widthRule.style.setProperty('--maid-sidebar-swag-height', roundPx(Math.min(94, Math.max(54, width * 0.2575))))
    widthRule.style.setProperty('--maid-sidebar-mascot-width', roundPx(Math.min(320, width * 0.82)))
    body.dataset.maidSidebarSize = nextSize
    if (compact) body.dataset.maidSidebarCompact = ''
    else delete body.dataset.maidSidebarCompact
  }

  const clearSidebarWidth = (): void => {
    widthRule.style.setProperty('--maid-sidebar-width', '0px')
    widthRule.style.setProperty('--maid-sidebar-swag-height', '54px')
    widthRule.style.setProperty('--maid-sidebar-mascot-width', '0px')
    body.dataset.maidSidebarSize = 'rail'
    body.dataset.maidSidebarCompact = ''
  }

  const syncProjectedState = (): void => {
    const set = (attribute: string, active: boolean): void => {
      body.toggleAttribute(attribute, active)
    }
    set(
      PROJECTED_STATE_ATTRIBUTES.activeChat,
      document.querySelector(ACTIVE_CHAT_SELECTOR) !== null,
    )
    set(
      PROJECTED_STATE_ATTRIBUTES.activeConversation,
      document.querySelector(ACTIVE_CONVERSATION_SELECTOR) !== null,
    )
    set(
      PROJECTED_STATE_ATTRIBUTES.workspace,
      document.querySelector(WORKSPACE_SELECTOR) !== null,
    )
    set(
      PROJECTED_STATE_ATTRIBUTES.cordisPanelOpen,
      document.querySelector(CORDIS_PANEL_SELECTOR) !== null,
    )
    set(
      PROJECTED_STATE_ATTRIBUTES.settingsOpen,
      document.querySelector(SETTINGS_DIALOG_SELECTOR) !== null,
    )
  }

  let observedChatArea: HTMLElement | undefined

  const ensureResizeObserved = (): void => {
    if (!resizeObserver) return
    const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
    if (sidebar !== observedSidebar) {
      if (observedSidebar) resizeObserver.unobserve(observedSidebar)
      observedSidebar = sidebar ?? undefined
      if (sidebar) resizeObserver.observe(sidebar)
    }
    const chat = document.querySelector<HTMLElement>(CONVERSATION_COLUMN_SELECTOR)
    if (chat !== observedChatArea) {
      if (observedChatArea) resizeObserver.unobserve(observedChatArea)
      observedChatArea = chat ?? undefined
      if (chat) resizeObserver.observe(chat)
    }
  }

  /* rc.6 can mount its wide search and its outside-click listener during the
     rail button's own click. That same event then reaches document with the
     detached rail button as its target and immediately collapses the field.
     Re-enter the component through its wide search root after the slide has
     mounted; newer workspace builds already keep the wide field open, so the
     rail-only origin check makes this compatibility path inert there. */
  recoverRailSearchFocus = (event: MouseEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>("button[class*='searchButton']")
      : null
    const railSearch = target?.closest<HTMLElement>("[class*='search']")
    if (target === null || railSearch === null
      || railSearch.querySelector("input[class*='searchInput']") !== null) return

    if (railSearchFocusFrame !== undefined) cancelAnimationFrame(railSearchFocusFrame)
    const startedAt = performance.now()
    const recover = (): void => {
      railSearchFocusFrame = undefined
      const input = document.querySelector<HTMLInputElement>(
        `${SIDEBAR_COLUMN_SELECTOR} input[class*='searchInput']`,
      )
      const searchRoot = input?.closest<HTMLElement>("[class*='search']")
      if (input !== null && input !== undefined && searchRoot !== null && searchRoot !== undefined) {
        searchRoot.click()
        input.focus({ preventScroll: true })
        return
      }
      if (performance.now() - startedAt < 500) {
        railSearchFocusFrame = requestAnimationFrame(recover)
      }
    }
    railSearchFocusFrame = requestAnimationFrame(recover)
  }
  document.addEventListener('click', recoverRailSearchFocus)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      // Sidebar entries drive the ornament width; conversation-area entries
      // drive the layout lease so maid tracking re-tracks during any push
      // (right/bottom workbench panels) without transition lag.
      for (const entry of entries) {
        if (entry.target === observedSidebar) applySidebarWidth(entry.contentRect.width)
        else if (entry.target === observedChatArea) handleViewportResize?.()
      }
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

  /* The settings mask is mounted inside a promoted sidebar descendant. Chrome
     can omit sibling composited layers from that backdrop sample, so seat a
     copy of the existing frame immediately before the mask while it is open. */
  const syncSettingsBackdropFrame = (): void => {
    const dialog = document.querySelector(SETTINGS_DIALOG_SELECTOR)
    const mask = dialog === null
      ? null
      : document.querySelector<HTMLElement>(SETTINGS_MASK_SELECTOR)
    const overlay = mask?.parentElement
    if (overlay === undefined || overlay === null) {
      settingsBackdropFrame?.remove()
      return
    }

    if (settingsBackdropFrame === undefined) {
      settingsBackdropFrame = createSidebarCorners()
      settingsBackdropFrame.dataset.maidSettingsBackdropFrame = ''
      ownedNodes.add(settingsBackdropFrame)
    }
    if (settingsBackdropFrame.parentElement !== overlay) {
      overlay.insertBefore(settingsBackdropFrame, mask)
    }
  }

  const topTrim = document.createElement('div')
  topTrim.dataset.skinChrome = 'top-trim'
  topTrim.dataset.skinOwner = SKIN_OWNER
  topTrim.setAttribute('aria-hidden', 'true')
  const landingTrimLayer = document.createElement('div')
  landingTrimLayer.dataset.skinTrimLayer = 'landing'
  const workspaceTrimLayer = document.createElement('div')
  workspaceTrimLayer.dataset.skinTrimLayer = 'workspace'
  topTrim.append(landingTrimLayer, workspaceTrimLayer)
  ownedNodes.add(topTrim)

  const bottomTrim = document.createElement('div')
  bottomTrim.dataset.skinChrome = 'bottom-trim'
  bottomTrim.dataset.skinOwner = SKIN_OWNER
  bottomTrim.setAttribute('aria-hidden', 'true')
  ownedNodes.add(bottomTrim)

  decorateTitlebarBrand(ownedNodes)
  decorateSidebar(ownedNodes, decoratedElements)
  decorateWorkspaceTree(decoratedElements)
  ensureChatAreaStage(characterStage)
  ensureChatAreaChrome(topTrim, bottomTrim)
  ensureResizeObserved()
  const initialSidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
  if (initialSidebar) applySidebarWidth(initialSidebar.getBoundingClientRect().width)
  syncComposerMotion()
  syncSettingsBackdropFrame()
  syncProjectedState()

  const syncSidebarDecorations = (): void => {
    syncTitlebarHeight?.()
    decorateTitlebarBrand(ownedNodes)
    decorateSidebar(ownedNodes, decoratedElements)
    decorateWorkspaceTree(decoratedElements)
    ensureChatAreaStage(characterStage)
    ensureChatAreaChrome(topTrim, bottomTrim)
    ensureResizeObserved()
    const sidebar = document.querySelector<HTMLElement>(SIDEBAR_COLUMN_SELECTOR)
    if (sidebar === null) clearSidebarWidth()
    else if (resizeObserver === undefined) applySidebarWidth(sidebar.getBoundingClientRect().width)
  }

  const isSkinChrome = (node: Node): boolean => (
    node instanceof Element && node.getAttribute('data-skin-owner') === SKIN_OWNER
  )

  const nodeTouches = (node: Node, selector: string): boolean => (
    node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null)
  )
  const sidebarChromeSelector = `${SIDEBAR_COLUMN_SELECTOR}, [class*='titlebar']`
  const composerSelector = "[data-phase='hero'], [data-phase='active']"

  // ResizeObserver writes the animated width through CSSOM, so it never enters
  // this observer. Keep structural decoration in the MutationObserver checkpoint
  // before paint: delaying every change made the wide/rail hand-off visibly late.
  // Skin-owned insertions are ignored so decorating a React-owned node cannot
  // schedule a redundant whole-sidebar pass.
  observer = new MutationObserver((records) => {
    let sidebarStructureChanged = false
    let workspaceStateChanged = false
    let backdropChanged = false
    let composerChanged = false
    let chatStructureChanged = false
    let settingsStateChanged = false
    let projectedStateChanged = false
    for (const record of records) {
      const target = record.target instanceof Element ? record.target : undefined
      if (target?.closest(TERMINAL_SELECTOR) !== null) continue

      if (record.type === 'attributes') {
        if (record.attributeName === 'aria-expanded'
          && target !== undefined
          && target.closest("[data-slot='sidebar.settings']") !== null) {
          settingsStateChanged = true
          projectedStateChanged = true
        } else if ((record.attributeName === 'aria-expanded' || record.attributeName === 'aria-selected')
          && target !== undefined && target.closest(SIDEBAR_COLUMN_SELECTOR) !== null) {
          workspaceStateChanged = true
        } else if (record.attributeName === 'data-ds-dark-theme' && record.target === body) {
          backdropChanged = true
        } else if (record.attributeName === 'data-phase') {
          composerChanged = true
        }
        if (record.attributeName === 'data-phase'
          || record.attributeName === 'data-chat-flow'
          || record.attributeName === 'data-cordis-panel'
          || record.attributeName === 'data-slot'
          || record.attributeName === 'role') {
          projectedStateChanged = true
        }
        continue
      }
      const appNodes = [...record.addedNodes, ...record.removedNodes]
        .filter(node => node instanceof Element && !isSkinChrome(node))
      if (appNodes.length > 0 && (appNodes.some(node => nodeTouches(node, sidebarChromeSelector))
        || (target !== undefined && target.closest(SIDEBAR_COLUMN_SELECTOR) !== null))) {
        sidebarStructureChanged = true
      }
      if (appNodes.length > 0 && (appNodes.some(node => nodeTouches(node, composerSelector))
        || (target !== undefined && target.closest(composerSelector) !== null))) {
        composerChanged = true
      }
      if (appNodes.length > 0 && (appNodes.some(node => nodeTouches(node, CONVERSATION_COLUMN_SELECTOR))
        || (target !== undefined && target.closest(CONVERSATION_COLUMN_SELECTOR) !== null))) {
        chatStructureChanged = true
      }
      if (appNodes.some(node => nodeTouches(node, SETTINGS_MASK_SELECTOR))) {
        settingsStateChanged = true
      }
      if (appNodes.length > 0 && (appNodes.some(node => nodeTouches(node, PROJECTED_STATE_SELECTOR))
        || target?.matches("header, [data-slot='sidebar.settings']") === true)) {
        projectedStateChanged = true
      }
    }
    if (projectedStateChanged) syncProjectedState()
    if (sidebarStructureChanged) syncSidebarDecorations()
    else if (workspaceStateChanged) decorateWorkspaceTree(decoratedElements)
    if (!sidebarStructureChanged && chatStructureChanged) {
      ensureChatAreaStage(characterStage)
      ensureChatAreaChrome(topTrim, bottomTrim)
      ensureResizeObserved()
    }
    if (backdropChanged) syncBackdrop()
    if (composerChanged) {
      syncComposerMotion()
    }
    if (settingsStateChanged || projectedStateChanged) syncSettingsBackdropFrame()
  })
  observer.observe(body, {
    attributes: true,
    attributeFilter: [
      'aria-expanded',
      'aria-selected',
      'data-chat-flow',
      'data-cordis-panel',
      'data-ds-dark-theme',
      'data-phase',
      'data-slot',
      'role',
    ],
    childList: true,
    subtree: true,
  })

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/png'
  favicon.href = MAID_ATELIER_ICON
  favicon.dataset.skinChrome = 'favicon'
  favicon.dataset.skinOwner = SKIN_OWNER
  ownedNodes.add(favicon)
  document.head.append(favicon)

  document.title = SKIN_TITLE
}
