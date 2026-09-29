/** ORCA LINK presentation-only client skin. */
import type { Context } from '@deepseek-ai/cordis'
import {
  ORCA_LINK_DARK_ACTIVE_ART,
  ORCA_LINK_DARK_HERO_ART,
  ORCA_LINK_LIGHT_ACTIVE_ART,
  ORCA_LINK_LIGHT_HERO_ART,
} from './art.ts'
import { installOrcaComposerCollapse } from './composer-collapse.ts'
import { installOrcaComposerMotion } from './composer-motion.ts'
import { installOrcaCustomization } from './customization.ts'
import { installOrcaHeadlineTypewriter } from './headline-typewriter.ts'
import { installOrcaIcons } from './icons.ts'
import { installOrcaLinkStatus } from './link-status.ts'
import { hasMutationOutsideTranscript } from './mutation-filter.ts'
import { installOrcaPageIcons } from './page-icons.ts'
import { installOrcaPricingLight } from './pricing-light.ts'
import { installOrcaRailSearch } from './rail-search.ts'
import { installOrcaScene } from './scene.ts'
import { installOrcaSettingsOverlay } from './settings-overlay.ts'
import { installOrcaStatusCharacter } from './status-character.ts'
import { installOrcaTerminalPerformance } from './terminal-performance.ts'
import { installOrcaWindowResume } from './window-resume.ts'
import { releaseClaimedStyles } from './release-claimed-styles.ts'
import { installOrcaWindowsMenu } from './windows-menu.ts'
import { installOrcaWorkspaceMarks } from './workspace-marks.ts'
import { installOrcaLightVisibility } from './work-light.ts'
import { installOrcaBootError } from './boot-error.ts'
import css from './orca-link.module.css'

const SKIN_TITLE = 'ORCA LINK · DSH'
const LIGHT_HERO_ART_PROPERTY = '--orca-link-light-hero-art'
const LIGHT_ACTIVE_ART_PROPERTY = '--orca-link-light-active-art'
const DARK_HERO_ART_PROPERTY = '--orca-link-dark-hero-art'
const DARK_ACTIVE_ART_PROPERTY = '--orca-link-dark-active-art'
const SIDEBAR_WIDTH_PROPERTY = '--orca-sidebar-width'
const SIDEBAR_ART_WIDTH_PROPERTY = '--orca-sidebar-art-width'
const SIDEBAR_WIDE_ATTRIBUTE = 'data-orca-sidebar-wide'
const SIDEBAR_DRAGGING_ATTRIBUTE = 'data-orca-sidebar-dragging'
const APP_FRAME_SELECTOR = "[id='root'] > div[data-slot='root'] > div"
const cls = (name: keyof typeof css): string => css[name] ?? ''

const DSH_WORDMARK = [
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M4 5H44L57 17V28L44 39H4V5ZM16 14V30H40L46 25V20L40 14H16Z" fill="currentColor"/>',
  '<path d="M70 5H119L110 14H80L76 18H108L118 27L106 39H59L68 30H101L105 26H72L62 17L70 5Z" fill="currentColor"/>',
  '<path d="M125 5H137V18H163V5H175V39H163V27H137V39H125V5Z" fill="currentColor"/>',
].join('')

// The logo row is the sidebar root's first child, except on the macOS desktop,
// where the host puts a draggable top strip (system window buttons and the
// sidebar toggle) in front of it.
const SIDEBAR_LOGO_ROW_SELECTOR = "[data-slot='sidebar'] > :first-child > :is([class*='logoRow'], :first-child:not([class*='topStrip']))"

function text(tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = value
  return element
}

function mountDshWordmark(): boolean {
  const row = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR)
  if (!(row instanceof HTMLElement)) return false

  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>(':scope > button'))
  const brand = buttons.find((button, index) => {
    const label = button.getAttribute('aria-label') ?? ''
    return index === 0 && (buttons.length > 1 || !/sidebar|侧边栏/i.test(label))
  })
  if (brand) brand.dataset.orcaLinkBrand = ''
  const sidebar = row.parentElement!
  if (!sidebar.querySelector(':scope > [data-orca-link-wordmark]')) {
    const wordmark = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    wordmark.classList.add(cls('dshWordmark'))
    wordmark.dataset.orcaLinkWordmark = ''
    wordmark.dataset.skinChrome = 'wordmark'
    wordmark.setAttribute('viewBox', '0 0 180 44')
    wordmark.setAttribute('aria-hidden', 'true')
    wordmark.innerHTML = DSH_WORDMARK
    sidebar.append(wordmark)
  }
  if (!row.querySelector(':scope > [data-orca-link-signal]')) {
    const chip = document.createElement('span')
    chip.className = cls('signalChip')
    chip.dataset.orcaLinkSignal = ''
    chip.dataset.skinChrome = 'signal'
    chip.setAttribute('aria-hidden', 'true')
    const dot = document.createElement('span')
    dot.className = cls('signalDot')
    const label = text('span', cls('signalChipLabel'), 'LINK ACTIVE')
    label.dataset.orcaLinkSignalLabel = ''
    chip.append(dot, label)
    row.append(chip)
  }
  return true
}

function syncSidebarWidth(body: HTMLElement, pane: Element, dragging: boolean): number {
  const measuredWidth = pane.getBoundingClientRect().width
  if (measuredWidth <= 0) return 0

  // AppFrame writes the transition's final grid tracks to its inline style
  // before animation begins. Prefer that endpoint over ResizeObserver's
  // intermediate pane width so one open/close produces one body style write,
  // not one inherited custom-property invalidation per rendered frame.
  const frame = body.querySelector<HTMLElement>(APP_FRAME_SELECTOR)
  const firstTrack = frame?.style.gridTemplateColumns.trim().match(/^(-?(?:\d+|\d*\.\d+))px(?:\s|$)/)?.[1]
  const targetWidth = firstTrack === undefined ? measuredWidth : Number.parseFloat(firstTrack)
  const width = Number.isFinite(targetWidth) && targetWidth > 0 ? targetWidth : measuredWidth
  const serializedWidth = `${width}px`
  // A body-level custom property invalidates every inheriting node in the
  // document. While the handle drags, widths arrive at pointer cadence, so the
  // body copy waits for the drop (the frame observer flushes it) and the
  // pane-scoped art width and the seam ruler follow the pointer instead.
  if (!dragging && body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY) !== serializedWidth) {
    body.style.setProperty(SIDEBAR_WIDTH_PROPERTY, serializedWidth)
  }
  const wide = width > 96
  if (body.hasAttribute(SIDEBAR_WIDE_ATTRIBUTE) !== wide) {
    body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, wide)
  }
  return width
}

export function apply(ctx: Context): void {
  const body = document.body
  ctx.effect(() => installOrcaCustomization(), 'ui-skin-orca-link: customization declaration')
  // The loader claims untagged <style> tags for whichever plugin loads last and
  // sweeps them when it unloads; hand other plugins' tags back before that.
  ctx.effect(() => () => releaseClaimedStyles(), 'ui-skin-orca-link: release styles claimed by the loader')
  ctx.effect(() => installOrcaLightVisibility(body), 'ui-skin-orca-link: decorative light visibility')
  ctx.effect(() => installOrcaBootError(), 'ui-skin-orca-link: boot failure presentation')
  ctx.effect(() => installOrcaPageIcons(), 'ui-skin-orca-link: page icons')
  ctx.effect(() => installOrcaWindowsMenu(body), 'ui-skin-orca-link: windows caption menubar')
  ctx.effect(() => installOrcaWorkspaceMarks(body), 'ui-skin-orca-link: workspace group tags')
  const originalTitle = document.title
  const originalLightHeroArt = body.style.getPropertyValue(LIGHT_HERO_ART_PROPERTY)
  const originalLightActiveArt = body.style.getPropertyValue(LIGHT_ACTIVE_ART_PROPERTY)
  const originalDarkHeroArt = body.style.getPropertyValue(DARK_HERO_ART_PROPERTY)
  const originalDarkActiveArt = body.style.getPropertyValue(DARK_ACTIVE_ART_PROPERTY)
  const originalSidebarWidth = body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY)
  const originalSidebarWide = body.hasAttribute(SIDEBAR_WIDE_ATTRIBUTE)
  const originalSidebarDragging = body.hasAttribute(SIDEBAR_DRAGGING_ATTRIBUTE)
  body.dataset.dshOrcaLink = ''
  body.style.setProperty(LIGHT_HERO_ART_PROPERTY, `url("${ORCA_LINK_LIGHT_HERO_ART}")`)
  body.style.setProperty(LIGHT_ACTIVE_ART_PROPERTY, `url("${ORCA_LINK_LIGHT_ACTIVE_ART}")`)
  body.style.setProperty(DARK_HERO_ART_PROPERTY, `url("${ORCA_LINK_DARK_HERO_ART}")`)
  body.style.setProperty(DARK_ACTIVE_ART_PROPERTY, `url("${ORCA_LINK_DARK_ACTIVE_ART}")`)
  const disposeScene = installOrcaScene(body)
  const disposeComposerMotion = installOrcaComposerMotion(body)
  const disposeComposerCollapse = installOrcaComposerCollapse(body)
  const disposeHeadlineTypewriter = installOrcaHeadlineTypewriter(body)
  const disposeIcons = installOrcaIcons(body)
  const disposeRailSearch = installOrcaRailSearch(body)
  const disposeWindowResume = installOrcaWindowResume(body)
  const disposeTerminalPerformance = installOrcaTerminalPerformance(body)
  const disposeSettingsOverlay = installOrcaSettingsOverlay(body)

  let wordmarkRow: Element | null = null
  const wordmarkObserver = new MutationObserver((records) => {
    if (!hasMutationOutsideTranscript(records)) return
    // Conversation updates cannot replace chrome inside a connected logo row.
    if (wordmarkRow?.isConnected && !records.some(record => wordmarkRow!.contains(record.target))) return
    mountDshWordmark()
    wordmarkRow = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR)
  })
  mountDshWordmark()
  wordmarkRow = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR)
  const disposeLinkStatus = installOrcaLinkStatus(body)
  const disposeStatusCharacter = installOrcaStatusCharacter(body, {
    character: cls('statusCharacter'),
    characterBubble: cls('statusCharacterBubble'),
    characterFrame: cls('statusCharacterFrame'),
    characterSprite: cls('statusCharacterSprite'),
  })
  const disposePricingLight = installOrcaPricingLight(body, {
    light: cls('pricingLight'),
    housing: cls('pricingHousing'),
    lamp: cls('pricingLamp'),
    lampRed: cls('pricingLampRed'),
    lampAmber: cls('pricingLampAmber'),
    lampGreen: cls('pricingLampGreen'),
    label: cls('pricingLabel'),
    tooltip: cls('pricingTooltip'),
    tooltipTitle: cls('pricingTooltipTitle'),
    tooltipRow: cls('pricingTooltipRow'),
    tooltipKey: cls('pricingTooltipKey'),
    tooltipValue: cls('pricingTooltipValue'),
  })
  wordmarkObserver.observe(body, { childList: true, subtree: true })

  const spine = document.createElement('div')
  spine.className = cls('spine')
  spine.dataset.skinChrome = 'spine'
  spine.setAttribute('aria-hidden', 'true')

  let observedSidebar: Element | null = null
  let observedFrame: Element | null = null
  let originalArtWidth = ''
  const syncObservedSidebar = (pane: Element): void => {
    const dragging = body.hasAttribute(SIDEBAR_DRAGGING_ATTRIBUTE)
    const width = syncSidebarWidth(body, pane, dragging)
    if (width <= 96) return
    // The stage keeps the last wide width while the track collapses (the
    // narrow branch returns above), and follows a drag live. It hangs on the
    // pane, not the body: every consumer is a pane descendant, so a write
    // restyles the sidebar subtree instead of the whole document.
    if (pane instanceof HTMLElement && pane.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) !== `${width}px`) {
      pane.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, `${width}px`)
    }
    if (dragging) spine.style.transform = `translateX(${width - 4}px)`
  }
  const frameObserver = new MutationObserver(() => {
    const dragging = observedFrame?.hasAttribute('data-dragging') === true
    if (body.hasAttribute(SIDEBAR_DRAGGING_ATTRIBUTE) === dragging) return
    body.toggleAttribute(SIDEBAR_DRAGGING_ATTRIBUTE, dragging)
    if (dragging) return
    // Drop: hand the seam back to the stylesheet and commit the final width.
    spine.style.removeProperty('transform')
    if (observedSidebar) syncObservedSidebar(observedSidebar)
  })
  const restoreArtWidth = (pane: HTMLElement): void => {
    if (originalArtWidth === '') pane.style.removeProperty(SIDEBAR_ART_WIDTH_PROPERTY)
    else pane.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, originalArtWidth)
  }
  const sidebarResizeObserver = typeof ResizeObserver === 'undefined'
    ? undefined
    : new ResizeObserver(() => {
        if (observedSidebar) syncObservedSidebar(observedSidebar)
      })
  const mountSidebarObserver = (): boolean => {
    const pane = document.querySelector("[data-slot='sidebar'] > :first-child")
    if (!pane) return false
    if (pane !== observedSidebar) {
      sidebarResizeObserver?.disconnect()
      if (observedSidebar instanceof HTMLElement) restoreArtWidth(observedSidebar)
      observedSidebar = pane
      originalArtWidth = pane instanceof HTMLElement ? pane.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) : ''
      sidebarResizeObserver?.observe(pane)
    }
    const frame = body.querySelector(APP_FRAME_SELECTOR)
    if (frame !== observedFrame) {
      frameObserver.disconnect()
      observedFrame = frame
      if (frame) frameObserver.observe(frame, { attributes: true, attributeFilter: ['data-dragging'] })
    }
    syncObservedSidebar(pane)
    return true
  }
  const sidebarMountObserver = new MutationObserver(() => {
    if (mountSidebarObserver()) sidebarMountObserver.disconnect()
  })
  if (!mountSidebarObserver()) sidebarMountObserver.observe(body, { childList: true, subtree: true })

  const lightScene = document.createElement('div')
  lightScene.className = cls('lightScene')
  lightScene.dataset.skinChrome = 'light-scene'
  lightScene.setAttribute('aria-hidden', 'true')
  const lightHeroScene = document.createElement('div')
  lightHeroScene.className = `${cls('lightSceneLayer')} ${cls('lightSceneHero')}`
  const lightActiveScene = document.createElement('div')
  lightActiveScene.className = `${cls('lightSceneLayer')} ${cls('lightSceneActive')}`
  lightScene.append(lightHeroScene, lightActiveScene)

  const darkScene = document.createElement('div')
  darkScene.className = cls('darkScene')
  darkScene.dataset.skinChrome = 'dark-scene'
  darkScene.setAttribute('aria-hidden', 'true')
  const darkHeroScene = document.createElement('div')
  darkHeroScene.className = `${cls('darkSceneLayer')} ${cls('darkSceneHero')}`
  const darkActiveScene = document.createElement('div')
  darkActiveScene.className = `${cls('darkSceneLayer')} ${cls('darkSceneActive')}`
  darkScene.append(darkHeroScene, darkActiveScene)

  const standby = document.createElement('div')
  standby.className = cls('standby')
  standby.dataset.skinChrome = 'standby'
  standby.setAttribute('aria-hidden', 'true')
  standby.append(text('span', cls('standbyLine'), ''))
  standby.append(text('span', cls('standbyCopy'), 'ORCA LINK STANDBY'))
  standby.append(text('span', cls('standbyLine'), ''))

  document.title = SKIN_TITLE
  body.append(lightScene, darkScene, spine, standby)

  ctx.effect(() => () => {
    disposeScene()
    disposeLinkStatus()
    disposeStatusCharacter()
    disposePricingLight()
    disposeHeadlineTypewriter()
    disposeComposerCollapse()
    disposeComposerMotion()
    disposeIcons()
    disposeRailSearch()
    disposeWindowResume()
    disposeTerminalPerformance()
    disposeSettingsOverlay()
    delete body.dataset.dshOrcaLink
    if (originalLightHeroArt === '') body.style.removeProperty(LIGHT_HERO_ART_PROPERTY)
    else body.style.setProperty(LIGHT_HERO_ART_PROPERTY, originalLightHeroArt)
    if (originalLightActiveArt === '') body.style.removeProperty(LIGHT_ACTIVE_ART_PROPERTY)
    else body.style.setProperty(LIGHT_ACTIVE_ART_PROPERTY, originalLightActiveArt)
    if (originalDarkHeroArt === '') body.style.removeProperty(DARK_HERO_ART_PROPERTY)
    else body.style.setProperty(DARK_HERO_ART_PROPERTY, originalDarkHeroArt)
    if (originalDarkActiveArt === '') body.style.removeProperty(DARK_ACTIVE_ART_PROPERTY)
    else body.style.setProperty(DARK_ACTIVE_ART_PROPERTY, originalDarkActiveArt)
    if (originalSidebarWidth === '') body.style.removeProperty(SIDEBAR_WIDTH_PROPERTY)
    else body.style.setProperty(SIDEBAR_WIDTH_PROPERTY, originalSidebarWidth)
    if (observedSidebar instanceof HTMLElement) restoreArtWidth(observedSidebar)
    body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, originalSidebarWide)
    body.toggleAttribute(SIDEBAR_DRAGGING_ATTRIBUTE, originalSidebarDragging)
    lightScene.remove()
    darkScene.remove()
    spine.remove()
    standby.remove()
    wordmarkObserver.disconnect()
    sidebarMountObserver.disconnect()
    sidebarResizeObserver?.disconnect()
    frameObserver.disconnect()
    document.querySelectorAll('[data-orca-link-wordmark]').forEach((wordmark) => wordmark.remove())
    document.querySelectorAll('[data-orca-link-signal]').forEach((chip) => chip.remove())
    document.querySelectorAll('[data-orca-link-brand]').forEach((brandButton) => {
      brandButton.removeAttribute('data-orca-link-brand')
    })
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-orca-link: technical chrome')
}
