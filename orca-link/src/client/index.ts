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
import { hasMutationOutsideTerminal } from './mutation-filter.ts'
import { installOrcaPricingLight } from './pricing-light.ts'
import { installOrcaRailSearch } from './rail-search.ts'
import { installOrcaScene } from './scene.ts'
import { installOrcaSettingsOverlay } from './settings-overlay.ts'
import { installOrcaStatusCharacter } from './status-character.ts'
import { installOrcaTerminalPerformance } from './terminal-performance.ts'
import { installOrcaWindowResume } from './window-resume.ts'
import css from './orca-link.module.css'

const SKIN_TITLE = 'ORCA LINK · DSH'
const LIGHT_HERO_ART_PROPERTY = '--orca-link-light-hero-art'
const LIGHT_ACTIVE_ART_PROPERTY = '--orca-link-light-active-art'
const DARK_HERO_ART_PROPERTY = '--orca-link-dark-hero-art'
const DARK_ACTIVE_ART_PROPERTY = '--orca-link-dark-active-art'
const SIDEBAR_WIDTH_PROPERTY = '--orca-sidebar-width'
const SIDEBAR_ART_WIDTH_PROPERTY = '--orca-sidebar-art-width'
const SIDEBAR_WIDE_ATTRIBUTE = 'data-orca-sidebar-wide'
const cls = (name: keyof typeof css): string => css[name] ?? ''

const FAVICON = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  '<rect width="64" height="64" fill="#f7f9fc"/>',
  '<path d="M8 18c9 1 15 7 18 16 2-11 8-19 18-24-2 9 1 15 7 19 2-3 4-5 7-6-2 16-12 26-28 27-10 0-18-7-22-18-2-6-5-11-10-14Z" fill="#11151b"/>',
  '<rect x="43" y="26" width="4" height="4" fill="#086cff"/>',
  '</svg>',
].join('')

const DSH_WORDMARK = [
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M4 5H44L57 17V28L44 39H4V5ZM16 14V30H40L46 25V20L40 14H16Z" fill="currentColor"/>',
  '<path d="M70 5H119L110 14H80L76 18H108L118 27L106 39H59L68 30H101L105 26H72L62 17L70 5Z" fill="currentColor"/>',
  '<path d="M125 5H137V18H163V5H175V39H163V27H137V39H125V5Z" fill="currentColor"/>',
].join('')

const SIDEBAR_LOGO_ROW_SELECTOR = "[data-slot='sidebar'] > :first-child > :first-child"

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
  if (!row.querySelector(':scope > [data-orca-link-wordmark]')) {
    const wordmark = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    wordmark.classList.add(cls('dshWordmark'))
    wordmark.dataset.orcaLinkWordmark = ''
    wordmark.dataset.skinChrome = 'wordmark'
    wordmark.setAttribute('viewBox', '0 0 180 44')
    wordmark.setAttribute('aria-hidden', 'true')
    wordmark.innerHTML = DSH_WORDMARK
    row.append(wordmark)
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

function syncSidebarWidth(body: HTMLElement, pane: Element): number {
  const width = pane.getBoundingClientRect().width
  if (width <= 0) return 0
  body.style.setProperty(SIDEBAR_WIDTH_PROPERTY, `${width}px`)
  body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, width > 96)
  return width
}

export function apply(ctx: Context): void {
  const body = document.body
  ctx.effect(() => installOrcaCustomization(), 'ui-skin-orca-link: customization declaration')
  const originalTitle = document.title
  const originalLightHeroArt = body.style.getPropertyValue(LIGHT_HERO_ART_PROPERTY)
  const originalLightActiveArt = body.style.getPropertyValue(LIGHT_ACTIVE_ART_PROPERTY)
  const originalDarkHeroArt = body.style.getPropertyValue(DARK_HERO_ART_PROPERTY)
  const originalDarkActiveArt = body.style.getPropertyValue(DARK_ACTIVE_ART_PROPERTY)
  const originalSidebarWidth = body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY)
  const originalSidebarArtWidth = body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY)
  const originalSidebarWide = body.hasAttribute(SIDEBAR_WIDE_ATTRIBUTE)
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

  const wordmarkObserver = new MutationObserver((records) => {
    if (!hasMutationOutsideTerminal(records)) return
    mountDshWordmark()
  })
  mountDshWordmark()
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

  let observedSidebar: Element | null = null
  let sidebarArtWidthTimer: ReturnType<typeof setTimeout> | undefined
  const syncObservedSidebar = (pane: Element): void => {
    const width = syncSidebarWidth(body, pane)
    if (sidebarArtWidthTimer !== undefined) clearTimeout(sidebarArtWidthTimer)
    sidebarArtWidthTimer = undefined
    if (width <= 96) return
    if (body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) === '') {
      body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, `${width}px`)
      return
    }
    sidebarArtWidthTimer = setTimeout(() => {
      const stableWidth = Number.parseFloat(body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY))
      if (stableWidth > 96) body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, `${stableWidth}px`)
      sidebarArtWidthTimer = undefined
    }, 180)
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
      observedSidebar = pane
      sidebarResizeObserver?.observe(pane)
    }
    syncObservedSidebar(pane)
    return true
  }
  const sidebarMountObserver = new MutationObserver(() => {
    if (mountSidebarObserver()) sidebarMountObserver.disconnect()
  })
  if (!mountSidebarObserver()) sidebarMountObserver.observe(body, { childList: true, subtree: true })

  const spine = document.createElement('div')
  spine.className = cls('spine')
  spine.dataset.skinChrome = 'spine'
  spine.setAttribute('aria-hidden', 'true')

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

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(FAVICON)}`
  document.head.append(favicon)
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
    if (originalSidebarArtWidth === '') body.style.removeProperty(SIDEBAR_ART_WIDTH_PROPERTY)
    else body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, originalSidebarArtWidth)
    body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, originalSidebarWide)
    lightScene.remove()
    darkScene.remove()
    spine.remove()
    standby.remove()
    wordmarkObserver.disconnect()
    sidebarMountObserver.disconnect()
    sidebarResizeObserver?.disconnect()
    if (sidebarArtWidthTimer !== undefined) clearTimeout(sidebarArtWidthTimer)
    document.querySelectorAll('[data-orca-link-wordmark]').forEach((wordmark) => wordmark.remove())
    document.querySelectorAll('[data-orca-link-signal]').forEach((chip) => chip.remove())
    document.querySelectorAll('[data-orca-link-brand]').forEach((brandButton) => {
      brandButton.removeAttribute('data-orca-link-brand')
    })
    favicon.remove()
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-orca-link: technical chrome')
}
