import { hasMutationOutsideTerminal } from './mutation-filter.ts'

/**
 * DeepSeek peak/valley pricing signal (Beijing time, UTC+8).
 *
 * Peak (red):      09:00-12:00 and 14:00-18:00 Beijing.
 * Transition (amber): the 20 minutes before every valley-to-peak switch, an
 *   early warning that hands the glow to red exactly at the peak start
 *   (08:40-09:00, 13:40-14:00).
 * Valley (green):  everything else; valley price is half of the peak price.
 *
 * All wall-clock math is epoch-shifted by the fixed UTC+8 offset and read
 * through getUTC* accessors, so the result is identical in every host
 * timezone and never depends on Intl timezone data.
 */

export type PriceBand = 'high' | 'transition' | 'low'

const BEIJING_OFFSET_MS = 8 * 3_600_000
const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

/** DeepSeek peak windows in Beijing minutes-of-day. */
const PEAK_WINDOWS: ReadonlyArray<readonly [start: number, end: number]> = [
  [9 * 60, 12 * 60],
  [14 * 60, 18 * 60],
]

/** Amber early-warning window right before each valley-to-peak switch. */
const TRANSITION_MINUTES = 20

/** Beijing wall-clock minutes of day for any instant, host-timezone independent. */
export function beijingMinutesOfDay(date: Date): number {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS)
  return beijing.getUTCHours() * 60 + beijing.getUTCMinutes()
}

/** Beijing wall-clock HH:MM for any instant. */
export function formatBeijingTime(date: Date): string {
  const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS)
  const hour = String(beijing.getUTCHours()).padStart(2, '0')
  const minute = String(beijing.getUTCMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function beijingDayNumber(date: Date): number {
  return Math.floor((date.getTime() + BEIJING_OFFSET_MS) / DAY_MS)
}

export function priceBandAt(date: Date): PriceBand {
  const minutes = beijingMinutesOfDay(date)
  const upcoming = PEAK_WINDOWS.some(([start]) => (
    minutes >= start - TRANSITION_MINUTES && minutes < start
  ))
  if (upcoming) return 'transition'
  if (PEAK_WINDOWS.some(([start, end]) => minutes >= start && minutes < end)) return 'high'
  return 'low'
}

/**
 * Next pricing switch instant. Pricing only changes at the four Beijing
 * boundaries 09:00 / 12:00 / 14:00 / 18:00, so the scan is exact.
 */
export function nextPriceChangeAt(date: Date): Date {
  const beijingEpoch = date.getTime() + BEIJING_OFFSET_MS
  const dayStart = Math.floor(beijingEpoch / DAY_MS) * DAY_MS
  const candidates = [
    dayStart + 9 * HOUR_MS,
    dayStart + 12 * HOUR_MS,
    dayStart + 14 * HOUR_MS,
    dayStart + 18 * HOUR_MS,
    dayStart + DAY_MS + 9 * HOUR_MS,
  ]
  const next = candidates.find((instant) => instant > beijingEpoch)
    ?? dayStart + DAY_MS + 9 * HOUR_MS
  return new Date(next - BEIJING_OFFSET_MS)
}

export interface PriceSchedule {
  band: PriceBand
  /**
   * Persistent English label shown next to the lamps: HIGH or LOW. During the
   * amber warning the effective price is still half — the label announces the
   * peak band the light is warning about.
   */
  label: 'HIGH' | 'LOW'
  /** Tooltip row: current pricing status, localized. */
  statusLine: string
  /** Tooltip row: current effective price, localized. */
  priceLine: string
  /** Tooltip row: when and how pricing changes next, localized. */
  nextChangeLine: string
}

/** Localized status/price/next copy per band. */
interface BandCopy {
  zh: { status: string; price: string; next: string }
  en: { status: string; price: string; next: string }
}

const BAND_COPY: Record<PriceBand, BandCopy> = {
  low: {
    zh: { status: '空闲时段 OFF-PEAK', price: '高峰价的 50% (半价)', next: '-> 高峰 100%' },
    en: { status: 'OFF-PEAK', price: '50% of peak price (half price)', next: '-> Peak 100%' },
  },
  transition: {
    // Static default; the rendered status carries a live countdown instead.
    zh: { status: '提前告警', price: '高峰价的 50% (半价)', next: '-> 高峰 100%' },
    en: { status: 'Early warning', price: '50% of peak price (half price)', next: '-> Peak 100%' },
  },
  high: {
    zh: { status: '高峰时段 PEAK', price: '标准价格 100%', next: '-> 空闲 50%' },
    en: { status: 'PEAK HOURS', price: 'Standard price 100%', next: '-> Off-peak 50%' },
  },
}

const VALLEY_WINDOWS_LINE = {
  zh: '其余时段, 价格为高峰的一半',
  en: 'All other hours at half peak price',
}

const PEAK_WINDOWS_LINE = '09:00-12:00 / 14:00-18:00'

/** Match the host UI language, same heuristic as the composer collapse. */
function detectChinese(): boolean {
  const lang = document.documentElement.lang || window.navigator.language || 'en'
  return lang.toLowerCase().startsWith('zh')
}

/** Minutes until the next peak window start; meaningful during the amber
 * warning, where one is always upcoming. */
function minutesUntilNextPeak(date: Date): number {
  const minutes = beijingMinutesOfDay(date)
  const upcoming = PEAK_WINDOWS.find(([start]) => minutes < start)
  return upcoming === undefined ? TRANSITION_MINUTES : upcoming[0] - minutes
}

export function priceScheduleAt(date: Date, chinese = detectChinese()): PriceSchedule {
  const band = priceBandAt(date)
  const copy = chinese ? BAND_COPY[band].zh : BAND_COPY[band].en
  const next = nextPriceChangeAt(date)
  const tomorrow = beijingDayNumber(next) > beijingDayNumber(date)
  const nextTime = `${formatBeijingTime(next)}${tomorrow ? (chinese ? ' 明日' : ' tomorrow') : ''}`
  const statusLine = band === 'transition'
    ? (chinese
        ? `提前告警 · ${minutesUntilNextPeak(date)} 分钟后进入高峰`
        : `Early warning: peak in ${minutesUntilNextPeak(date)} min`)
    : copy.status
  return {
    band,
    label: band === 'low' ? 'LOW' : 'HIGH',
    statusLine,
    priceLine: copy.price,
    nextChangeLine: `${nextTime} ${copy.next}`,
  }
}

export interface PricingLightClasses {
  light: string
  housing: string
  lamp: string
  lampRed: string
  lampAmber: string
  lampGreen: string
  label: string
  tooltip: string
  tooltipTitle: string
  tooltipRow: string
  tooltipKey: string
  tooltipValue: string
}

const PRICE_LIGHT_SELECTOR = '[data-orca-link-price-light]'
const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child"

const POLL_INTERVAL_MS = 15_000

/** Tooltip row keys: [Chinese key, English key, row slot]. */
const TOOLTIP_ROWS: ReadonlyArray<readonly [zh: string, en: string, slot: string]> = [
  ['状态', 'Status', 'status'],
  ['当前', 'Price', 'price'],
  ['下次', 'Next', 'next'],
  ['高峰', 'Peak', 'peak-windows'],
  ['空闲', 'Valley', 'valley-windows'],
]

function text(tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = value
  return element
}

function createLight(classes: PricingLightClasses): HTMLElement {
  const light = document.createElement('div')
  light.className = classes.light
  light.dataset.orcaLinkPriceLight = ''
  light.dataset.skinChrome = 'pricing-light'

  const housing = document.createElement('div')
  housing.className = classes.housing
  housing.setAttribute('aria-hidden', 'true')
  housing.append(
    text('span', `${classes.lamp} ${classes.lampRed}`, ''),
    text('span', `${classes.lamp} ${classes.lampAmber}`, ''),
    text('span', `${classes.lamp} ${classes.lampGreen}`, ''),
  )

  const label = text('span', classes.label, 'LOW')
  label.dataset.orcaLinkPriceLabel = ''

  const tooltip = document.createElement('div')
  tooltip.className = classes.tooltip
  tooltip.dataset.orcaLinkPriceTooltip = ''
  // Title and row keys carry their own data hooks so `render()` can relocalize
  // them live when the host repoints <html lang> on a locale switch.
  const title = text('div', classes.tooltipTitle, '')
  title.dataset.orcaLinkPriceTooltipTitle = ''
  tooltip.append(title)
  for (const [keyZh, , slot] of TOOLTIP_ROWS) {
    const row = text('div', classes.tooltipRow, '')
    row.dataset.orcaLinkPriceRow = slot
    const key = text('span', classes.tooltipKey, keyZh)
    key.dataset.orcaLinkPriceKey = slot
    const value = text('strong', classes.tooltipValue, '')
    value.dataset.orcaLinkPriceValue = slot
    row.append(key, value)
    tooltip.append(row)
  }

  light.append(housing, label, tooltip)
  return light
}

/**
 * Mount the pricing traffic light under the sidebar's DSH wordmark. The light
 * stays visible on both the collapsed rail and the expanded sidebar, so the
 * current pricing band is always glanceable. Hovering it opens a detail card
 * with the band, the effective price, the next switch, and the full schedule.
 *
 * The copy follows the host UI language on every render: when no `chinese`
 * override is given the document/navigator heuristic is re-read, and a
 * `lang` attribute observer on <html> re-renders immediately when the host
 * switches locale, so the hover card relocalizes without a reload.
 *
 * @param now - clock provider, injectable for deterministic tests.
 * @param chinese - explicit language override for tests; when omitted the
 * language is detected live on every render.
 */
export function installOrcaPricingLight(
  body: HTMLElement,
  classes: PricingLightClasses,
  now: () => Date = () => new Date(),
  chinese?: boolean,
): () => void {
  const chineseOverride = chinese
  let light: HTMLElement | null = null
  let label: HTMLElement | null = null
  let tooltip: HTMLElement | null = null

  const mount = (): void => {
    const pane = body.querySelector<HTMLElement>(SIDEBAR_PANE_SELECTOR)
    if (pane === null) return
    const existing = pane.querySelector<HTMLElement>(`:scope > ${PRICE_LIGHT_SELECTOR}`)
    if (existing !== null) {
      light = existing
      label = existing.querySelector<HTMLElement>('[data-orca-link-price-label]')
      tooltip = existing.querySelector<HTMLElement>('[data-orca-link-price-tooltip]')
      return
    }
    const created = createLight(classes)
    pane.append(created)
    light = created
    label = created.querySelector<HTMLElement>('[data-orca-link-price-label]')
    tooltip = created.querySelector<HTMLElement>('[data-orca-link-price-tooltip]')
  }

  const render = (): void => {
    mount()
    if (light === null) return
    const zh = chineseOverride ?? detectChinese()
    const schedule = priceScheduleAt(now(), zh)
    if (light.dataset.orcaLinkPrice !== schedule.band) {
      light.dataset.orcaLinkPrice = schedule.band
    }
    if (label !== null && label.textContent !== schedule.label) label.textContent = schedule.label
    light.setAttribute(
      'aria-label',
      zh ? `定价状态：${schedule.statusLine}` : `Pricing status: ${schedule.statusLine}`,
    )
    if (tooltip !== null) {
      const titleElement = tooltip.querySelector<HTMLElement>('[data-orca-link-price-tooltip-title]')
      if (titleElement !== null) {
        const titleCopy = zh ? '定价信号 · 北京时区 UTC+8' : 'PRICING SIGNAL · BEIJING TZ UTC+8'
        if (titleElement.textContent !== titleCopy) titleElement.textContent = titleCopy
      }
      for (const [keyZh, keyEn, slot] of TOOLTIP_ROWS) {
        const keyElement = tooltip.querySelector<HTMLElement>(`[data-orca-link-price-key='${slot}']`)
        if (keyElement === null) continue
        const keyCopy = zh ? keyZh : keyEn
        if (keyElement.textContent !== keyCopy) keyElement.textContent = keyCopy
      }
      const lines: Record<string, string> = {
        status: schedule.statusLine,
        price: schedule.priceLine,
        next: schedule.nextChangeLine,
        'peak-windows': PEAK_WINDOWS_LINE,
        'valley-windows': zh ? VALLEY_WINDOWS_LINE.zh : VALLEY_WINDOWS_LINE.en,
      }
      for (const [slot, value] of Object.entries(lines)) {
        const element = tooltip.querySelector<HTMLElement>(`[data-orca-link-price-value='${slot}']`)
        if (element !== null && element.textContent !== value) element.textContent = value
      }
    }
  }

  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTerminal(records)) return
    if (light !== null && light.isConnected) return
    render()
  })
  observer.observe(body, { childList: true, subtree: true })

  // The host repoints <html lang> whenever the locale changes; re-render the
  // hover card copy in place instead of waiting for the next poll tick.
  const langObserver = new MutationObserver(() => {
    if (light !== null && light.isConnected) render()
  })
  langObserver.observe(body.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  })

  const interval = window.setInterval(render, POLL_INTERVAL_MS)
  render()

  return () => {
    window.clearInterval(interval)
    observer.disconnect()
    langObserver.disconnect()
    body.querySelectorAll(PRICE_LIGHT_SELECTOR).forEach((element) => element.remove())
  }
}
