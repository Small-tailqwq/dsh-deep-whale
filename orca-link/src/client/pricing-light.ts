import { hasMutationOutsideTerminal } from './mutation-filter.ts'

/**
 * DeepSeek peak/valley pricing signal (Beijing time, UTC+8).
 *
 * Peak (red):      09:00-12:00 and 14:00-18:00 Beijing.
 * Transition (amber): the first 10 minutes of every peak window, right after
 *   the valley switches to peak (09:00-09:10, 14:00-14:10).
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

/** Amber window right after each valley-to-peak switch. */
const TRANSITION_MINUTES = 10

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
  const entering = PEAK_WINDOWS.some(([start]) => (
    minutes >= start && minutes < start + TRANSITION_MINUTES
  ))
  if (entering) return 'transition'
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
  /** Persistent English label shown next to the lamps: HIGH or LOW. */
  label: 'HIGH' | 'LOW'
  /** Tooltip row: current pricing status. */
  statusLine: string
  /** Tooltip row: current effective price. */
  priceLine: string
  /** Tooltip row: when and how pricing changes next. */
  nextChangeLine: string
}

export function priceScheduleAt(date: Date): PriceSchedule {
  const band = priceBandAt(date)
  const next = nextPriceChangeAt(date)
  const tomorrow = beijingDayNumber(next) > beijingDayNumber(date)
  const nextTime = `${formatBeijingTime(next)}${tomorrow ? ' 明日' : ''}`
  if (band === 'low') {
    return {
      band,
      label: 'LOW',
      statusLine: '空闲时段 OFF-PEAK',
      priceLine: '高峰价的 50% (半价)',
      nextChangeLine: `${nextTime} -> 高峰 100%`,
    }
  }
  if (band === 'transition') {
    return {
      band,
      label: 'HIGH',
      statusLine: '切换窗口 (绿切红 10 分钟内)',
      priceLine: '标准价格 100% (高峰已生效)',
      nextChangeLine: `${nextTime} -> 空闲 50%`,
    }
  }
  return {
    band,
    label: 'HIGH',
    statusLine: '高峰时段 PEAK',
    priceLine: '标准价格 100%',
    nextChangeLine: `${nextTime} -> 空闲 50%`,
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

const TOOLTIP_ROWS: ReadonlyArray<readonly [key: string, slot: string]> = [
  ['状态', 'status'],
  ['当前', 'price'],
  ['下次', 'next'],
  ['高峰', 'peak-windows'],
  ['空闲', 'valley-windows'],
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
  tooltip.append(text('div', classes.tooltipTitle, 'PRICING SIGNAL · 北京时区 UTC+8'))
  for (const [key, slot] of TOOLTIP_ROWS) {
    const row = text('div', classes.tooltipRow, '')
    row.dataset.orcaLinkPriceRow = slot
    const value = text('strong', classes.tooltipValue, '')
    value.dataset.orcaLinkPriceValue = slot
    row.append(text('span', classes.tooltipKey, key), value)
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
 * @param now - clock provider, injectable for deterministic tests.
 */
export function installOrcaPricingLight(
  body: HTMLElement,
  classes: PricingLightClasses,
  now: () => Date = () => new Date(),
): () => void {
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
    const schedule = priceScheduleAt(now())
    if (light.dataset.orcaLinkPrice !== schedule.band) {
      light.dataset.orcaLinkPrice = schedule.band
    }
    if (label !== null && label.textContent !== schedule.label) label.textContent = schedule.label
    light.setAttribute('aria-label', `定价状态：${schedule.statusLine}`)
    if (tooltip !== null) {
      const lines: Record<string, string> = {
        status: schedule.statusLine,
        price: schedule.priceLine,
        next: schedule.nextChangeLine,
        'peak-windows': '09:00-12:00 / 14:00-18:00',
        'valley-windows': '其余时段, 价格为高峰的一半',
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

  const interval = window.setInterval(render, POLL_INTERVAL_MS)
  render()

  return () => {
    window.clearInterval(interval)
    observer.disconnect()
    body.querySelectorAll(PRICE_LIGHT_SELECTOR).forEach((element) => element.remove())
  }
}
