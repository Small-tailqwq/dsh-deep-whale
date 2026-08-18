// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  beijingMinutesOfDay,
  formatBeijingTime,
  installOrcaPricingLight,
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

  it('maps every band boundary: green, 10-minute amber, red, back to green', () => {
    const cases: Array<[number, number, PriceBand]> = [
      [5, 0, 'low'],
      [5, 8, 'low'],
      [5, 9, 'transition'],
      [5, 9, 'high'],
      [5, 11, 'high'],
      [5, 12, 'low'],
      [5, 13, 'low'],
      [5, 14, 'transition'],
      [5, 14, 'high'],
      [5, 17, 'high'],
      [5, 18, 'low'],
      [5, 23, 'low'],
    ]
    const minutes = new Map<PriceBand, number[]>([
      ['low', [0, 58, 59]],
      ['transition', [0, 9]],
      ['high', [10, 59]],
    ])
    cases.forEach(([day, hour, band]) => {
      const samples = minutes.get(band) ?? [0]
      samples.forEach((minute) => {
        expect(priceBandAt(beijing(day, hour, minute)), `day ${day} ${hour}:${minute}`).toBe(band)
      })
    })
  })

  it('treats 09:00-09:10 and 14:00-14:10 as the amber transition window', () => {
    expect(priceBandAt(beijing(5, 8, 59))).toBe('low')
    expect(priceBandAt(beijing(5, 9, 0))).toBe('transition')
    expect(priceBandAt(beijing(5, 9, 9))).toBe('transition')
    expect(priceBandAt(beijing(5, 9, 10))).toBe('high')
    expect(priceBandAt(beijing(5, 13, 59))).toBe('low')
    expect(priceBandAt(beijing(5, 14, 0))).toBe('transition')
    expect(priceBandAt(beijing(5, 14, 9))).toBe('transition')
    expect(priceBandAt(beijing(5, 14, 10))).toBe('high')
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

  it('labels only HIGH and LOW, with half price during the valley', () => {
    expect(priceScheduleAt(beijing(5, 10, 0))).toMatchObject({
      band: 'high',
      label: 'HIGH',
      statusLine: '高峰时段 PEAK',
      priceLine: '标准价格 100%',
    })
    expect(priceScheduleAt(beijing(5, 13, 0))).toMatchObject({
      band: 'low',
      label: 'LOW',
      statusLine: '空闲时段 OFF-PEAK',
      priceLine: '高峰价的 50% (半价)',
    })
    expect(priceScheduleAt(beijing(5, 9, 5))).toMatchObject({
      band: 'transition',
      label: 'HIGH',
    })
    expect(priceScheduleAt(beijing(5, 9, 5)).statusLine).toContain('绿切红')
    expect(priceScheduleAt(beijing(5, 13, 0)).nextChangeLine).toContain('14:00')
    expect(priceScheduleAt(beijing(5, 13, 0)).nextChangeLine).toContain('高峰 100%')
    expect(priceScheduleAt(beijing(5, 10, 0)).nextChangeLine).toContain('12:00')
    expect(priceScheduleAt(beijing(5, 10, 0)).nextChangeLine).toContain('空闲 50%')
    expect(priceScheduleAt(beijing(5, 22, 0)).nextChangeLine).toContain('明日')
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
      () => beijing(5, 10, 0),
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
    expect(value('peak-windows')).toBe('09:00-12:00 / 14:00-18:00')
    expect(value('valley-windows')).toContain('一半')
    dispose()
  })

  it('re-mounts after the sidebar pane is replaced and disposes cleanly', () => {
    vi.useFakeTimers()
    mountBody()
    const dispose = installOrcaPricingLight(
      document.body,
      classes,
      () => beijing(5, 10, 0),
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
    )
    const original = document.body.querySelector<HTMLElement>('[data-orca-link-price-light]')!
    document.body.append(document.createElement('div'))
    vi.advanceTimersByTime(15_000)
    expect(document.body.querySelector('[data-orca-link-price-light]')).toBe(original)
    dispose()
  })
})
