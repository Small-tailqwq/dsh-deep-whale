import { hasMutationOutsideTranscript } from './mutation-filter.ts'

/**
 * DeepSeek peak/valley pricing signal (Beijing time, UTC+8).
 *
 * Peak (red):      weekdays 09:00-12:00 and 14:00-18:00 Beijing.
 * Transition (amber): the 20 minutes before every weekday valley-to-peak
 *   switch, an early warning that hands the glow to red exactly at the peak
 *   start (08:40-09:00, 13:40-14:00).
 * Valley (green):  everything else, including all of Saturday and Sunday
 *   (flat valley rate since 2026-08-23) and every Chinese statutory holiday;
 *   valley price is half of the peak. Make-up workdays always fall on a
 *   weekend and DeepSeek still bills them at the valley rate, so the weekend
 *   rule already covers them.
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

/**
 * Statutory holidays that fall on a weekday, as Beijing MM-DD per year. Holiday
 * days on a weekend are valley already. Source: State Council notices, cross-
 * checked against the `chinese-days` dataset. The next year's schedule is
 * published around November; add it here when it is.
 */
const WEEKDAY_HOLIDAYS: Readonly<Record<number, ReadonlySet<string>>> = {
  2026: new Set([
    '01-01', '01-02',
    '02-16', '02-17', '02-18', '02-19', '02-20', '02-23',
    '04-06',
    '05-01', '05-04', '05-05',
    '06-19',
    '09-25',
    '10-01', '10-02', '10-05', '10-06', '10-07',
  ]),
}

/** Last year with holiday data; later dates fall back to the weekend rule only. */
export const HOLIDAY_DATA_LAST_YEAR = Math.max(...Object.keys(WEEKDAY_HOLIDAYS).map(Number))

/** Longest valley run a scan must cross: the National Day week plus adjoining weekends. */
const NEXT_CHANGE_SCAN_DAYS = 31

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

/** Beijing weekday (0 = Sunday ... 6 = Saturday), host-timezone independent. */
function beijingWeekday(date: Date): number {
  return new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCDay()
}

/** Weekends run at the flat valley rate all day, no peak windows at all. */
function isBeijingWeekend(date: Date): boolean {
  const weekday = beijingWeekday(date)
  return weekday === 0 || weekday === 6
}

/** Whether a UTC+8-shifted day-start epoch is a weekday statutory holiday. */
function isHolidayDayStart(dayStart: number): boolean {
  const day = new Date(dayStart)
  const monthDay = `${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`
  return WEEKDAY_HOLIDAYS[day.getUTCFullYear()]?.has(monthDay) === true
}

/** Beijing midnight of the instant's day, in the UTC+8-shifted epoch. */
function beijingDayStart(date: Date): number {
  return Math.floor((date.getTime() + BEIJING_OFFSET_MS) / DAY_MS) * DAY_MS
}

/** Statutory holidays run at the valley rate all day, like weekends. */
export function isChinaHoliday(date: Date): boolean {
  return isHolidayDayStart(beijingDayStart(date))
}

/** Whole-day valley: weekends (make-up workdays included) and statutory holidays. */
function isValleyDay(date: Date): boolean {
  return isBeijingWeekend(date) || isChinaHoliday(date)
}

export function priceBandAt(date: Date): PriceBand {
  if (isValleyDay(date)) return 'low'
  const minutes = beijingMinutesOfDay(date)
  const upcoming = PEAK_WINDOWS.some(([start]) => (
    minutes >= start - TRANSITION_MINUTES && minutes < start
  ))
  if (upcoming) return 'transition'
  if (PEAK_WINDOWS.some(([start, end]) => minutes >= start && minutes < end)) return 'high'
  return 'low'
}

/** Beijing weekday of a day-start epoch (still unit-aligned to DAY_MS). */
function beijingWeekdayOfDayStart(dayStart: number): number {
  // Math.round guards the E-16 float noise of dividing a large epoch by DAY_MS.
  return (Math.round(dayStart / DAY_MS) + 4) % 7
}

/**
 * Next pricing switch instant. Workdays change at the four Beijing boundaries
 * 09:00 / 12:00 / 14:00 / 18:00; weekends and statutory holidays stay flat at
 * valley price all day, so the next switch after Friday 18:00 or during any
 * such day is the next workday's 09:00. The per-day scan is exact because
 * every candidate boundary is visited in order and valley days emit none; its
 * horizon covers the longest holiday run (National Day plus weekends).
 */
export function nextPriceChangeAt(date: Date): Date {
  const beijingEpoch = date.getTime() + BEIJING_OFFSET_MS
  let dayStart = beijingDayStart(date)
  for (let day = 0; day <= NEXT_CHANGE_SCAN_DAYS; day += 1) {
    const weekday = beijingWeekdayOfDayStart(dayStart)
    if (weekday === 0 || weekday === 6 || isHolidayDayStart(dayStart)) {
      dayStart += DAY_MS
      continue
    }
    const nextHour = [9, 12, 14, 18].find((hour) => (
      dayStart + hour * HOUR_MS > beijingEpoch
    ))
    if (nextHour === undefined) {
      dayStart += DAY_MS
      continue
    }
    return new Date(dayStart + nextHour * HOUR_MS - BEIJING_OFFSET_MS)
  }
  // Unreachable in practice: no holiday run spans a whole month.
  return new Date(dayStart + 9 * HOUR_MS - BEIJING_OFFSET_MS)
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
  /** Tooltip row: valley schedule, with a note once holiday data runs out. */
  valleyWindowsLine: string
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
  zh: '周末、法定节假日全天及非高峰时段, 价格为高峰的一半',
  en: 'Weekends, public holidays and off-peak hours at half peak price',
}

const PEAK_WINDOWS_LINE = {
  zh: '工作日 09:00-12:00 / 14:00-18:00',
  en: 'Workdays 09:00-12:00 / 14:00-18:00',
}

/** Valley row suffix once the clock passes the bundled holiday data. */
function holidayCoverageNote(date: Date, chinese: boolean): string {
  const year = new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCFullYear()
  if (year <= HOLIDAY_DATA_LAST_YEAR) return ''
  return chinese
    ? ` (节假日数据仅到 ${HOLIDAY_DATA_LAST_YEAR} 年)`
    : ` (holiday data ends in ${HOLIDAY_DATA_LAST_YEAR})`
}

/** Beijing weekday labels for the "next change" line, indexed by 0 = Sunday. */
const WEEKDAY_LABELS = {
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const

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
  let nextTime = formatBeijingTime(next)
  const dayGap = beijingDayNumber(next) - beijingDayNumber(date)
  if (dayGap === 1) {
    nextTime = chinese ? `${nextTime} 明日` : `${nextTime} tomorrow`
  } else if (dayGap > 1) {
    // Crossing a weekend or holiday: name the weekday instead of a vague "tomorrow".
    const weekday = chinese
      ? WEEKDAY_LABELS.zh[beijingWeekday(next)]
      : WEEKDAY_LABELS.en[beijingWeekday(next)]
    nextTime = `${weekday} ${nextTime}`
  }
  const statusLine = isBeijingWeekend(date)
    ? (chinese ? '周末全天半价' : 'Weekend half price all day')
    : isChinaHoliday(date)
      ? (chinese ? '法定节假日全天半价' : 'Public holiday half price all day')
      : band === 'transition'
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
    valleyWindowsLine: (chinese ? VALLEY_WINDOWS_LINE.zh : VALLEY_WINDOWS_LINE.en)
      + holidayCoverageNote(date, chinese),
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
/** ModelSelect is rendered inside this stable composer slot wrapper. */
const MODEL_CONTROL_SELECTOR = "[data-slot='conversation.input.model'] button[aria-haspopup='menu']"
/** The rendered name is preferred; title/ARIA cover host label-class changes. */
const MODEL_LABEL_SELECTOR = "[class*='triggerLabel']"
/** Set on the light while the selected model is not a DeepSeek model. */
const OTHER_MODEL_ATTRIBUTE = 'data-orca-link-price-other-model'
const PRICING_VISIBILITY_ATTRIBUTE = 'data-dsh-whale-orca-pricing'
/**
 * Projected on body while the light sits in the Windows caption row, so the
 * caption menubar (a body-level shadow host) can step aside for it.
 */
const CAPTION_ATTRIBUTE = 'data-orca-price-caption'
const COLLAPSED_FRAME_SELECTOR = '[data-sidebar-collapsed]'
/** Host placeholders shown before a model resolves; they say nothing about it. */
const UNRESOLVED_MODEL_LABELS = new Set(['正在加载模型…', '请选择模型', 'Loading models…', 'Select model'])

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
 * DeepSeek's peak/valley schedule only prices DeepSeek models. The picker shows
 * a display name (or `provider/model` when the catalog lacks it), so any label
 * naming DeepSeek counts; placeholders keep the previous verdict.
 * @returns true / false for a resolved label, undefined when unknown.
 */
export function isDeepSeekModelLabel(label: string): boolean | undefined {
  const text = label.trim()
  if (text === '' || UNRESOLVED_MODEL_LABELS.has(text)) return undefined
  return /deepseek/i.test(text)
}

/** Read the host model control even if its CSS-module label class changes. */
function readModelLabel(control: HTMLElement): string {
  const visibleLabel = control.querySelector<HTMLElement>(MODEL_LABEL_SELECTOR)?.textContent
  const candidates = [visibleLabel, control.getAttribute('title'), control.getAttribute('aria-label'), control.textContent]
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim() !== '')?.trim() ?? ''
}

/** Whether the caption needs to reserve space for a light users can see. */
function isPricingLightVisible(light: HTMLElement, doc: Document): boolean {
  if (doc.documentElement.getAttribute(PRICING_VISIBILITY_ATTRIBUTE) === 'hidden') return false
  const view = doc.defaultView
  if (view === null) return true
  const style = view.getComputedStyle(light)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse'
}

/**
 * Mount the pricing traffic light under the sidebar's DSH wordmark. The light
 * stays visible on both the collapsed rail and the expanded sidebar, so the
 * current pricing band is always glanceable. Hovering it opens a detail card
 * with the band, the effective price, the next switch, and the full schedule.
 *
 * The light shows only while the composer's selected model is a DeepSeek
 * model. On the Windows desktop a collapsed sidebar is zero wide, so the light
 * moves into the caption row beside the host's pinned controls.
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
  let deepSeekModel = true
  let observedModelControl: HTMLElement | null = null
  const doc = body.ownerDocument

  const syncCaption = (): void => {
    const inCaption = light !== null && light.isConnected
      && deepSeekModel
      && isPricingLightVisible(light, doc)
      && !body.hasAttribute('data-orca-settings-open')
      && doc.documentElement.hasAttribute('data-windows-titlebar')
      && body.querySelector(COLLAPSED_FRAME_SELECTOR) !== null
    if (body.hasAttribute(CAPTION_ATTRIBUTE) !== inCaption) body.toggleAttribute(CAPTION_ATTRIBUTE, inCaption)
  }

  const syncModel = (): void => {
    const modelControl = body.querySelector<HTMLElement>(MODEL_CONTROL_SELECTOR)
    if (modelControl !== observedModelControl) {
      modelObserver.disconnect()
      observedModelControl = modelControl
      // ModelSelect edits the visible name in place. Observe the named slot's
      // trigger so text, accessible-label fallbacks and label-class changes
      // all keep the verdict current without scanning unrelated menu buttons.
      if (modelControl !== null) {
        modelObserver.observe(modelControl, {
          attributes: true,
          attributeFilter: ['aria-label', 'title', 'class'],
          characterData: true,
          childList: true,
          subtree: true,
        })
      }
    }
    const verdict = modelControl === null ? undefined : isDeepSeekModelLabel(readModelLabel(modelControl))
    if (verdict !== undefined) deepSeekModel = verdict
    if (light !== null && light.hasAttribute(OTHER_MODEL_ATTRIBUTE) === deepSeekModel) {
      light.toggleAttribute(OTHER_MODEL_ATTRIBUTE, !deepSeekModel)
    }
    syncCaption()
  }
  const modelObserver = new MutationObserver(syncModel)

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
    syncModel()
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
        'peak-windows': zh ? PEAK_WINDOWS_LINE.zh : PEAK_WINDOWS_LINE.en,
        'valley-windows': schedule.valleyWindowsLine,
      }
      for (const [slot, value] of Object.entries(lines)) {
        const element = tooltip.querySelector<HTMLElement>(`[data-orca-link-price-value='${slot}']`)
        if (element !== null && element.textContent !== value) element.textContent = value
      }
    }
  }

  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTranscript(records)) return
    if (light !== null && light.isConnected) {
      // Composer remounts and sidebar collapse flips change the model label or
      // the caption seat without touching the light itself.
      syncModel()
      return
    }
    render()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-sidebar-collapsed', 'data-orca-settings-open'],
  })

  const visibilityObserver = new MutationObserver(syncCaption)
  visibilityObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [PRICING_VISIBILITY_ATTRIBUTE],
  })
  const view = doc.defaultView
  view?.addEventListener('resize', syncCaption)

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
    modelObserver.disconnect()
    visibilityObserver.disconnect()
    langObserver.disconnect()
    view?.removeEventListener('resize', syncCaption)
    body.querySelectorAll(PRICE_LIGHT_SELECTOR).forEach((element) => element.remove())
    body.removeAttribute(CAPTION_ATTRIBUTE)
  }
}
