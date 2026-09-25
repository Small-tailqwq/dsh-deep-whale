// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  beijingMinutesOfDay,
  formatBeijingTime,
  HOLIDAY_DATA_LAST_YEAR,
  installOrcaPricingLight,
  isChinaHoliday,
  isDeepSeekModelLabel,
  nextPriceChangeAt,
  priceBandAt,
  priceScheduleAt,
} from '../src/client/pricing-light.ts'
import type { PriceBand } from '../src/client/pricing-light.ts'

/** Build a Date from Beijing wall-clock components (UTC+8), TZ-independent. */
function beijing(day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 0, day, hour - 8, minute, 0, 0))
}

const classes = {
  light: 'pricingLight',
  housing: 'pricingHousing',
  lamp: 'pricingLamp',
  lampRed: 'pricingLampRed',
  lampAmber: 'pricingLampAmber',
  lampGreen: 'pricingLampGreen',
  label: 'pricingLabel',
  tooltip: 'pricingTooltip',
  tooltipTitle: 'pricingTooltipTitle',
  tooltipRow: 'pricingTooltipRow',
  tooltipKey: 'pricingTooltipKey',
  tooltipValue: 'pricingTooltipValue',
}

afterEach(() => {
  vi.useRealTimers()
  document.documentElement.removeAttribute('lang')
  document.body.innerHTML = ''
})

describe('ORCA LINK pricing light schedule (Beijing time)', () => {
  it('converts instants to Beijing wall clock without depending on host timezone', () => {
    expect(beijingMinutesOfDay(beijing(5, 0, 0))).toBe(0)
    expect(beijingMinutesOfDay(beijing(5, 9, 7))).toBe(547)
    expect(beijingMinutesOfDay(beijing(5, 23, 59))).toBe(1439)
    expect(formatBeijingTime(beijing(5, 9, 7))).toBe('09:07')
    expect(formatBeijingTime(beijing(5, 0, 0))).toBe('00:00')
  })

  it('maps every band boundary: green, 20-minute amber warning, red at peak start, back to green', () => {
    const samples: Array<[number, number, number, PriceBand]> = []
    const probe = (day: number, hour: number, bands: Array<[minute: number, band: PriceBand]>): void => {
      bands.forEach(([minute, band]) => samples.push([day, hour, minute, band]))
    }
    probe(5, 0, [[0, 'low']])
    probe(5, 8, [[0, 'low'], [39, 'low'], [40, 'transition'], [59, 'transition']])
    probe(5, 9, [[0, 'high'], [10, 'high'], [59, 'high']])
    probe(5, 11, [[59, 'high']])
    probe(5, 12, [[0, 'low']])
    probe(5, 13, [[0, 'low'], [39, 'low'], [40, 'transition'], [59, 'transition']])
    probe(5, 14, [[0, 'high'], [10, 'high']])
    probe(5, 17, [[59, 'high']])
    probe(5, 18, [[0, 'low']])
    probe(5, 23, [[59, 'low']])
    samples.forEach(([day, hour, minute, band]) => {
      expect(priceBandAt(beijing(day, hour, minute)), `day ${day} ${hour}:${minute}`).toBe(band)
    })
  })

  it('treats 08:40-09:00 and 13:40-14:00 as the amber early-warning window, red exactly at peak start', () => {
    expect(priceBandAt(beijing(5, 8, 39))).toBe('low')
    expect(priceBandAt(beijing(5, 8, 40))).toBe('transition')
    expect(priceBandAt(beijing(5, 8, 59))).toBe('transition')
    expect(priceBandAt(beijing(5, 9, 0))).toBe('high')
    expect(priceBandAt(beijing(5, 9, 10))).toBe('high')
    expect(priceBandAt(beijing(5, 13, 39))).toBe('low')
    expect(priceBandAt(beijing(5, 13, 40))).toBe('transition')
    expect(priceBandAt(beijing(5, 13, 59))).toBe('transition')
    expect(priceBandAt(beijing(5, 14, 0))).toBe('high')
    expect(priceBandAt(beijing(5, 11, 59))).toBe('high')
    expect(priceBandAt(beijing(5, 12, 0))).toBe('low')
    expect(priceBandAt(beijing(5, 17, 59))).toBe('high')
    expect(priceBandAt(beijing(5, 18, 0))).toBe('low')
  })

  it('finds the next pricing switch at 09:00 / 12:00 / 14:00 / 18:00 Beijing', () => {
    expect(nextPriceChangeAt(beijing(5, 8, 30)).getTime()).toBe(beijing(5, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 9, 5)).getTime()).toBe(beijing(5, 12, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 10, 0)).getTime()).toBe(beijing(5, 12, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 13, 0)).getTime()).toBe(beijing(5, 14, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 15, 0)).getTime()).toBe(beijing(5, 18, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 19, 0)).getTime()).toBe(beijing(6, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 23, 0)).getTime()).toBe(beijing(6, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 12, 0)).getTime()).toBe(beijing(5, 14, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 18, 0)).getTime()).toBe(beijing(6, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(5, 9, 0)).getTime()).toBe(beijing(5, 12, 0).getTime())
  })

  // 2026-01-05 is Monday, 01-09 Friday, 01-10 Saturday, 01-11 Sunday, 01-12 Monday.
  it('keeps every band green all weekend regardless of the clock time', () => {
    expect(priceBandAt(beijing(10, 0, 0))).toBe('low') // Saturday 00:00
    expect(priceBandAt(beijing(10, 8, 50))).toBe('low') // Saturday 08:50, would-be amber
    expect(priceBandAt(beijing(10, 9, 0))).toBe('low') // Saturday 09:00, would-be peak start
    expect(priceBandAt(beijing(10, 14, 0))).toBe('low') // Saturday 14:00
    expect(priceBandAt(beijing(10, 23, 59))).toBe('low') // Saturday late night
    expect(priceBandAt(beijing(11, 0, 0))).toBe('low') // Sunday 00:00
    expect(priceBandAt(beijing(11, 9, 0))).toBe('low') // Sunday 09:00
    expect(priceBandAt(beijing(11, 18, 0))).toBe('low') // Sunday 18:00
    expect(priceBandAt(beijing(11, 23, 59))).toBe('low') // Sunday late night
    expect(priceBandAt(beijing(9, 23, 59))).toBe('low') // Friday night stays valley
    // Weekday behavior is untouched: amber 20 min before, red exactly at the start.
    expect(priceBandAt(beijing(12, 8, 50))).toBe('transition')
    expect(priceBandAt(beijing(12, 9, 0))).toBe('high')
  })

  it('hops the next switch over the weekend to Monday 09:00', () => {
    expect(nextPriceChangeAt(beijing(9, 8, 30)).getTime()).toBe(beijing(9, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(9, 18, 30)).getTime()).toBe(beijing(12, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(9, 23, 0)).getTime()).toBe(beijing(12, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(10, 0, 0)).getTime()).toBe(beijing(12, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(10, 10, 0)).getTime()).toBe(beijing(12, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(11, 23, 59)).getTime()).toBe(beijing(12, 9, 0).getTime())
    expect(nextPriceChangeAt(beijing(12, 9, 0)).getTime()).toBe(beijing(12, 12, 0).getTime())
  })

  it('shows weekend flat-rate copy and names Monday in the next-change line', () => {
    const zh = priceScheduleAt(beijing(10, 10, 0), true)
    expect(zh).toMatchObject({
      band: 'low',
      label: 'LOW',
      statusLine: '周末全天半价',
      priceLine: '高峰价的 50% (半价)',
      nextChangeLine: '周一 09:00 -> 高峰 100%',
    })
    // Sunday's would-be amber window never fires: no warning, still flat rate.
    expect(priceScheduleAt(beijing(11, 8, 50), true).statusLine).toBe('周末全天半价')
    expect(priceScheduleAt(beijing(9, 19, 0), true).nextChangeLine).toBe('周一 09:00 -> 高峰 100%')
    const en = priceScheduleAt(beijing(10, 10, 0), false)
    expect(en.statusLine).toBe('Weekend half price all day')
    expect(en.nextChangeLine).toBe('Mon 09:00 -> Peak 100%')
  })

  it('labels only HIGH and LOW, with half price during the valley', () => {
    expect(priceScheduleAt(beijing(5, 10, 0), true)).toMatchObject({
      band: 'high',
      label: 'HIGH',
      statusLine: '高峰时段 PEAK',
      priceLine: '标准价格 100%',
    })
    expect(priceScheduleAt(beijing(5, 13, 0), true)).toMatchObject({
      band: 'low',
      label: 'LOW',
      statusLine: '空闲时段 OFF-PEAK',
      priceLine: '高峰价的 50% (半价)',
    })
    expect(priceScheduleAt(beijing(5, 8, 50), true)).toMatchObject({
      band: 'transition',
      label: 'HIGH',
      statusLine: '提前告警 · 10 分钟后进入高峰',
      priceLine: '高峰价的 50% (半价)',
    })
    // The amber warning carries a live countdown to the peak start.
    expect(priceScheduleAt(beijing(5, 8, 40), true).statusLine).toBe('提前告警 · 20 分钟后进入高峰')
    expect(priceScheduleAt(beijing(5, 13, 41), true).statusLine).toBe('提前告警 · 19 分钟后进入高峰')
    expect(priceScheduleAt(beijing(5, 8, 59), true).statusLine).toBe('提前告警 · 1 分钟后进入高峰')
    expect(priceScheduleAt(beijing(5, 8, 50), true).nextChangeLine).toContain('09:00')
    expect(priceScheduleAt(beijing(5, 13, 0), true).nextChangeLine).toContain('14:00')
    expect(priceScheduleAt(beijing(5, 13, 0), true).nextChangeLine).toContain('高峰 100%')
    expect(priceScheduleAt(beijing(5, 10, 0), true).nextChangeLine).toContain('12:00')
    expect(priceScheduleAt(beijing(5, 10, 0), true).nextChangeLine).toContain('空闲 50%')
    expect(priceScheduleAt(beijing(5, 22, 0), true).nextChangeLine).toContain('明日')
  })

  it('switches to complete English copy for a non-Chinese host UI', () => {
    expect(priceScheduleAt(beijing(5, 10, 0), false)).toMatchObject({
      band: 'high',
      label: 'HIGH',
      statusLine: 'PEAK HOURS',
      priceLine: 'Standard price 100%',
      nextChangeLine: '12:00 -> Off-peak 50%',
    })
    expect(priceScheduleAt(beijing(5, 13, 0), false)).toMatchObject({
      band: 'low',
      label: 'LOW',
      statusLine: 'OFF-PEAK',
      priceLine: '50% of peak price (half price)',
      nextChangeLine: '14:00 -> Peak 100%',
    })
    expect(priceScheduleAt(beijing(5, 8, 50), false)).toMatchObject({
      band: 'transition',
      label: 'HIGH',
      statusLine: 'Early warning: peak in 10 min',
      priceLine: '50% of peak price (half price)',
      nextChangeLine: '09:00 -> Peak 100%',
    })
    expect(priceScheduleAt(beijing(5, 22, 0), false).nextChangeLine).toBe('09:00 tomorrow -> Peak 100%')
  })
})

describe('ORCA LINK pricing light chrome', () => {
  const mountBody = (): void => {
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
  }

  it('mounts under the sidebar wordmark row and reflects the injected clock', () => {
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 9, 30),
      true,
    )
    const pane = document.body.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    const light = pane.querySelector<HTMLElement>(':scope > [data-orca-link-price-light]')
    expect(light).not.toBeNull()
    expect(light!.dataset.orcaLinkPrice).toBe('high')
    expect(light!.dataset.skinChrome).toBe('pricing-light')
    expect(light!.querySelector('[data-orca-link-price-label]')!.textContent).toBe('HIGH')
    expect(light!.getAttribute('aria-label')).toContain('高峰')
    expect(light!.querySelectorAll('.pricingLamp').length).toBe(3)
    dispose()
  })

  it('fills every tooltip row from the schedule', () => {
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 13, 0),
      true,
    )
    const light = document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
    expect(light.dataset.orcaLinkPrice).toBe('low')
    expect(light.querySelector('[data-orca-link-price-label]')!.textContent).toBe('LOW')
    const value = (slot: string): string => (
      light.querySelector<HTMLElement>(`[data-orca-link-price-value='${slot}']`)!.textContent ?? ''
    )
    expect(value('status')).toBe('空闲时段 OFF-PEAK')
    expect(value('price')).toBe('高峰价的 50% (半价)')
    expect(value('next')).toContain('14:00')
    expect(value('peak-windows')).toBe('工作日 09:00-12:00 / 14:00-18:00')
    expect(value('valley-windows')).toContain('周末')
    dispose()
  })

  it('renders English tooltip rows, keys and aria-label for a non-Chinese host UI', () => {
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 8, 50),
      false,
    )
    const light = document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
    expect(light.dataset.orcaLinkPrice).toBe('transition')
    expect(light.querySelector('[data-orca-link-price-label]')!.textContent).toBe('HIGH')
    expect(light.getAttribute('aria-label')).toContain('Early warning')
    const value = (slot: string): string => (
      light.querySelector<HTMLElement>(`[data-orca-link-price-value='${slot}']`)!.textContent ?? ''
    )
    expect(value('status')).toBe('Early warning: peak in 10 min')
    expect(value('price')).toBe('50% of peak price (half price)')
    expect(value('next')).toBe('09:00 -> Peak 100%')
    expect(value('valley-windows')).toBe('Weekends, public holidays and off-peak hours at half peak price')
    const keys = [...light.querySelectorAll<HTMLElement>('[data-orca-link-price-row]')]
      .map((row) => row.firstElementChild?.textContent ?? '')
    expect(keys).toEqual(['Status', 'Price', 'Next', 'Peak', 'Valley'])
    dispose()
  })

  it('relocalizes the hover card copy live when the host repoints <html lang>', async () => {
    document.documentElement.lang = 'zh-CN'
    mountBody()
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 13, 0))
    const light = document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
    const value = (slot: string): string => (
      light.querySelector<HTMLElement>(`[data-orca-link-price-value='${slot}']`)!.textContent ?? ''
    )
    const keys = (): string[] => (
      [...light.querySelectorAll<HTMLElement>('[data-orca-link-price-row]')]
        .map((row) => row.firstElementChild?.textContent ?? '')
    )
    expect(value('status')).toBe('空闲时段 OFF-PEAK')
    expect(keys()).toEqual(['状态', '当前', '下次', '高峰', '空闲'])
    expect(light.querySelector('[data-orca-link-price-tooltip-title]')!.textContent)
      .toBe('定价信号 · 北京时区 UTC+8')

    document.documentElement.lang = 'en-US'
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(value('status')).toBe('OFF-PEAK')
    expect(keys()).toEqual(['Status', 'Price', 'Next', 'Peak', 'Valley'])
    expect(light.querySelector('[data-orca-link-price-tooltip-title]')!.textContent)
      .toBe('PRICING SIGNAL · BEIJING TZ UTC+8')
    expect(light.getAttribute('aria-label')).toBe('Pricing status: OFF-PEAK')

    document.documentElement.lang = 'zh-CN'
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(value('status')).toBe('空闲时段 OFF-PEAK')
    expect(keys()).toEqual(['状态', '当前', '下次', '高峰', '空闲'])
    dispose()
  })

  it('re-mounts after the sidebar pane is replaced and disposes cleanly', () => {
    vi.useFakeTimers()
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 10, 0),
      true,
    )
    expect(document.body.querySelector('[data-orca-link-price-light]')).not.toBeNull()
    mountBody()
    expect(document.body.querySelector('[data-orca-link-price-light]')).toBeNull()
    vi.advanceTimersByTime(15_000)
    expect(document.body.querySelector('[data-orca-link-price-light]')).not.toBeNull()
    dispose()
    expect(document.body.querySelectorAll('[data-orca-link-price-light]').length).toBe(0)
    vi.advanceTimersByTime(60_000)
    expect(document.body.querySelectorAll('[data-orca-link-price-light]').length).toBe(0)
  })

  it('stays mounted when the pane persists across unrelated body mutations', () => {
    vi.useFakeTimers()
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 10, 0),
      true,
    )
    const original = document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
    document.body.append(document.createElement('div'))
    vi.advanceTimersByTime(15_000)
    expect(document.body.querySelector('[data-orca-link-price-light]')).toBe(original)
    dispose()
  })
})

/** Beijing wall-clock instant on any date, TZ-independent. */
function beijingOn(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0, 0))
}

describe('ORCA LINK pricing light statutory holidays (issue #152)', () => {
  it('keeps weekday statutory holidays green all day', () => {
    // 2026-09-25 is the Mid-Autumn Festival, a Friday.
    expect(priceBandAt(beijingOn(2026, 9, 25, 16, 33))).toBe('low')
    expect(priceBandAt(beijingOn(2026, 9, 25, 8, 50))).toBe('low')
    expect(priceBandAt(beijingOn(2026, 9, 25, 10, 0))).toBe('low')
    for (const [month, day] of [[1, 1], [1, 2], [2, 17], [2, 23], [4, 6], [5, 1], [5, 5], [6, 19], [10, 1], [10, 7]]) {
      expect(priceBandAt(beijingOn(2026, month!, day!, 10, 0)), `2026-${month}-${day}`).toBe('low')
      expect(isChinaHoliday(beijingOn(2026, month!, day!, 10, 0))).toBe(true)
    }
  })

  it('leaves ordinary workdays around a holiday untouched', () => {
    expect(priceBandAt(beijingOn(2026, 9, 24, 16, 33))).toBe('high')
    expect(priceBandAt(beijingOn(2026, 9, 24, 8, 50))).toBe('transition')
    expect(priceBandAt(beijingOn(2026, 9, 28, 10, 0))).toBe('high')
    expect(isChinaHoliday(beijingOn(2026, 9, 24, 10, 0))).toBe(false)
  })

  it('keeps weekend make-up workdays green, as DeepSeek bills them', () => {
    for (const [month, day] of [[1, 4], [2, 14], [2, 28], [5, 9], [9, 20], [10, 10]]) {
      expect(priceBandAt(beijingOn(2026, month!, day!, 10, 0)), `2026-${month}-${day}`).toBe('low')
    }
  })

  it('reads the holiday date in Beijing time, not the host clock', () => {
    // 2026-09-24 23:30 Beijing is still the workday before the festival; 00:10 is the festival.
    expect(isChinaHoliday(beijingOn(2026, 9, 24, 23, 30))).toBe(false)
    expect(isChinaHoliday(beijingOn(2026, 9, 25, 0, 10))).toBe(true)
  })

  it('skips whole holiday runs when finding the next switch', () => {
    // Evening before National Day: the week off plus the weekend ends on Thursday 10-08.
    expect(nextPriceChangeAt(beijingOn(2026, 9, 30, 20, 0)).toISOString())
      .toBe(beijingOn(2026, 10, 8, 9, 0).toISOString())
    expect(nextPriceChangeAt(beijingOn(2026, 10, 3, 12, 0)).toISOString())
      .toBe(beijingOn(2026, 10, 8, 9, 0).toISOString())
    // Mid-Autumn Friday plus the weekend: back on Monday.
    expect(nextPriceChangeAt(beijingOn(2026, 9, 24, 18, 30)).toISOString())
      .toBe(beijingOn(2026, 9, 28, 9, 0).toISOString())
    // Spring Festival: 02-16..02-20 and 02-23 around a weekend.
    expect(nextPriceChangeAt(beijingOn(2026, 2, 13, 19, 0)).toISOString())
      .toBe(beijingOn(2026, 2, 24, 9, 0).toISOString())
  })

  it('shows holiday copy and names the weekday of the next switch', () => {
    const zh = priceScheduleAt(beijingOn(2026, 9, 25, 16, 33), true)
    expect(zh.band).toBe('low')
    expect(zh.statusLine).toBe('法定节假日全天半价')
    expect(zh.nextChangeLine).toBe('周一 09:00 -> 高峰 100%')
    const en = priceScheduleAt(beijingOn(2026, 10, 1, 10, 0), false)
    expect(en.statusLine).toBe('Public holiday half price all day')
    expect(en.nextChangeLine).toBe('Thu 09:00 -> Peak 100%')
  })

  it('says when the clock has run past the bundled holiday data', () => {
    const inRange = priceScheduleAt(beijingOn(HOLIDAY_DATA_LAST_YEAR, 12, 31, 10, 0), true)
    expect(inRange.valleyWindowsLine).toBe('周末、法定节假日全天及非高峰时段, 价格为高峰的一半')
    const beyond = priceScheduleAt(beijingOn(HOLIDAY_DATA_LAST_YEAR + 1, 1, 4, 10, 0), true)
    expect(beyond.valleyWindowsLine).toContain(`节假日数据仅到 ${HOLIDAY_DATA_LAST_YEAR} 年`)
    const beyondEn = priceScheduleAt(beijingOn(HOLIDAY_DATA_LAST_YEAR + 1, 1, 4, 10, 0), false)
    expect(beyondEn.valleyWindowsLine).toContain(`holiday data ends in ${HOLIDAY_DATA_LAST_YEAR}`)
  })
})

describe('ORCA LINK pricing light model and desktop caption', () => {
  const composer = (model: string): string => (
    '<div data-composer-card><div class="trailing">'
    + '<button aria-haspopup="menu"><span class="u91W7W_triggerLabel">Balanced</span></button>'
    + `<div data-slot="conversation.input.model"><button aria-haspopup="menu" title="${model}" aria-label="${model}"><span class="u91W7W_triggerLabel">${model}</span></button></div>`
    + '</div></div>'
  )
  const mountBody = (model: string, collapsed = false): void => {
    document.body.innerHTML = `<div ${collapsed ? 'data-sidebar-collapsed="true"' : ''}>`
      + '<div data-slot="sidebar"><div class="root"><div></div></div></div>'
      + `${composer(model)}</div>`
  }
  const light = (): HTMLElement => document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
  const modelText = (): Text => document.body.querySelector("[data-slot='conversation.input.model'] [class*='triggerLabel']")!.firstChild as Text
  const modelControl = (): HTMLButtonElement => document.body.querySelector("[data-slot='conversation.input.model'] button")!
  const flush = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 0) })

  afterEach(() => {
    document.documentElement.removeAttribute('data-windows-titlebar')
    document.documentElement.removeAttribute('data-dsh-whale-orca-pricing')
  })

  it('recognizes DeepSeek model labels and ignores host placeholders', () => {
    expect(isDeepSeekModelLabel('DeepSeek V4 Pro')).toBe(true)
    expect(isDeepSeekModelLabel('deepseek-official/deepseek-v4-flash')).toBe(true)
    expect(isDeepSeekModelLabel('Claude Sonnet 5')).toBe(false)
    expect(isDeepSeekModelLabel('gpt-5')).toBe(false)
    expect(isDeepSeekModelLabel('正在加载模型…')).toBeUndefined()
    expect(isDeepSeekModelLabel('Select model')).toBeUndefined()
    expect(isDeepSeekModelLabel('')).toBeUndefined()
  })

  it('shows the light for DeepSeek models only and follows a live model switch', async () => {
    mountBody('DeepSeek V4 Flash')
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 10, 0), true)
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(false)

    // React edits the label's text node in place on a model switch.
    modelText().nodeValue = 'Claude Sonnet 5'
    await flush()
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(true)

    // A loading placeholder keeps the last verdict instead of flashing.
    modelText().nodeValue = '正在加载模型…'
    await flush()
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(true)

    // A remounted composer is picked up through the body observer.
    document.body.querySelector('[data-composer-card]')!.outerHTML = composer('DeepSeek V4 Pro')
    await flush()
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(false)
    dispose()
  })

  it('scopes model detection to its slot and falls back to title and ARIA labels', async () => {
    mountBody('DeepSeek V4 Flash')
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 10, 0), true)
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(false)

    // A changed CSS-module token falls back to the model control's title.
    modelControl().querySelector('span')!.className = 'renamedLabel'
    modelControl().setAttribute('title', 'Claude Sonnet 5')
    await flush()
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(true)

    // Accessible text is the last stable fallback when title is absent.
    modelControl().removeAttribute('title')
    modelControl().setAttribute('aria-label', 'DeepSeek V4 Pro')
    await flush()
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(false)
    dispose()
  })

  it('keeps the light visible when no composer is mounted', () => {
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 10, 0), true)
    expect(light().hasAttribute('data-orca-link-price-other-model')).toBe(false)
    dispose()
  })

  it('projects the caption seat only for a collapsed Windows desktop sidebar', async () => {
    document.documentElement.setAttribute('data-windows-titlebar', '')
    mountBody('DeepSeek V4 Flash')
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 10, 0), true)
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)

    const frame = document.body.firstElementChild!
    frame.setAttribute('data-sidebar-collapsed', 'true')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(true)

    // A hidden user preference must not leave the caption menu shifted.
    document.documentElement.setAttribute('data-dsh-whale-orca-pricing', 'hidden')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
    document.documentElement.setAttribute('data-dsh-whale-orca-pricing', 'visible')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(true)

    // The responsive CSS hides the light at narrow widths; re-sync on resize.
    light().style.display = 'none'
    window.dispatchEvent(new Event('resize'))
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
    light().style.display = ''
    window.dispatchEvent(new Event('resize'))
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(true)

    // Full-screen skin settings hide the light as well.
    document.body.setAttribute('data-orca-settings-open', '')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
    document.body.removeAttribute('data-orca-settings-open')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(true)

    // A non-DeepSeek model hides the light, so the menubar must not step aside.
    modelText().nodeValue = 'gpt-5'
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
    modelText().nodeValue = 'DeepSeek V4 Pro'
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(true)

    frame.removeAttribute('data-sidebar-collapsed')
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)

    frame.setAttribute('data-sidebar-collapsed', 'true')
    await flush()
    dispose()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
  })

  it('never projects the caption seat in the browser layout', async () => {
    mountBody('DeepSeek V4 Flash', true)
    const dispose = installOrcaPricingLight(document.body, classes, () => beijing(5, 10, 0), true)
    await flush()
    expect(document.body.hasAttribute('data-orca-price-caption')).toBe(false)
    dispose()
  })
})

describe('ORCA LINK pricing light CSS cascade', () => {
  const css = readFileSync('src/client/orca-link.module.css', 'utf8')

  it('band rules repeat the base selector chain so signal vars beat the base defaults', () => {
    // The base rule declares --orca-price-signal / --orca-price-glow on the
    // light element itself at specificity (0,4,1). Every band rule must carry
    // that full chain plus the data attribute ((0,5,1)) or the text color,
    // border and lamp glow stay frozen on the valley green.
    const base = "body[data-dsh-orca-link] [data-slot='sidebar'] > :first-child > .pricingLight {"
    expect(css).toContain(base)
    for (const band of ['high', 'transition', 'low']) {
      const rule = `body[data-dsh-orca-link] [data-slot='sidebar'] > :first-child > .pricingLight[data-orca-link-price='${band}'] {`
      expect(css).toContain(rule)
    }
    // The short standalone band rule loses to the base rule; it must not come back.
    expect(css).not.toContain("body[data-dsh-orca-link] .pricingLight[data-orca-link-price='high'] {")
    expect(css).not.toContain("body[data-dsh-orca-link] .pricingLight[data-orca-link-price='transition'] {")
    expect(css).not.toContain("body[data-dsh-orca-link] .pricingLight[data-orca-link-price='low'] {")
  })

  it('hides the light for other models with the full base chain', () => {
    expect(css).toMatch(/body\[data-dsh-orca-link\] \[data-slot='sidebar'\] > :first-child > \.pricingLight\[data-orca-link-price-other-model\] \{\s*display: none;/)
  })

  it('seats the light in the Windows caption and moves the menubar aside', () => {
    const caption = css.match(/html\[data-windows-titlebar\] body\[data-dsh-orca-link\] \[data-sidebar-collapsed\]\s*\[data-slot='sidebar'\] > \[class\*='root'\]\[class\*='collapsed'\] > \.pricingLight \{([^}]*)\}/)?.[1] ?? ''
    expect(caption).toContain('position: fixed')
    expect(caption).toContain('left: 84px')
    expect(caption).toContain('width: 52px')
    expect(caption).toContain('pointer-events: none')
    expect(caption).not.toContain('display')
    const menu = css.match(/html\[data-windows-titlebar\] body\[data-dsh-orca-link\]\[data-orca-price-caption\] > \[data-windows-menu\] \{([^}]*)\}/)?.[1] ?? ''
    // 52px light plus the host's 8px caption gap.
    expect(menu).toContain('margin-left: 60px')
  })
})
