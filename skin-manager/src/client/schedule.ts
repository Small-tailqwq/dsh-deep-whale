import type { TimeRange, VisibilitySchedule } from '../protocol.ts'

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export const DEFAULT_VISIBILITY_SCHEDULE: VisibilitySchedule = {
  enabled: false,
  outside: 'visible',
  ranges: [],
}

export function normalizeTimeRange(value: unknown): TimeRange | null {
  if (typeof value !== 'object' || value === null) return null
  const { start, end } = value as Partial<TimeRange>
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!TIME.test(start) || !TIME.test(end) || start === end) return null
  return { start, end }
}

export function normalizeVisibilitySchedule(
  value: unknown,
  fallback: VisibilitySchedule = DEFAULT_VISIBILITY_SCHEDULE,
): VisibilitySchedule {
  const source = typeof value === 'object' && value !== null
    ? value as Partial<VisibilitySchedule>
    : {}
  const ranges = Array.isArray(source.ranges)
    ? source.ranges.map(normalizeTimeRange).filter((range): range is TimeRange => range !== null).slice(0, 24)
    : fallback.ranges
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled,
    outside: source.outside === 'hidden' ? 'hidden' : source.outside === 'visible' ? 'visible' : fallback.outside,
    ranges,
  }
}

const minutes = (time: string): number => {
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function isInTimeRange(range: TimeRange, minuteOfDay: number): boolean {
  const start = minutes(range.start)
  const end = minutes(range.end)
  return start < end
    ? minuteOfDay >= start && minuteOfDay < end
    : minuteOfDay >= start || minuteOfDay < end
}

/** Resolve local-time visibility; ranges always invert the outside policy. */
export function scheduleVisibility(schedule: VisibilitySchedule, now = new Date()): boolean {
  if (!schedule.enabled) return true
  const minuteOfDay = now.getHours() * 60 + now.getMinutes()
  const inside = schedule.ranges.some(range => isInTimeRange(range, minuteOfDay))
  const outsideVisible = schedule.outside === 'visible'
  return inside ? !outsideVisible : outsideVisible
}

/** Wake at the next minute boundary; exact enough for minute-resolution rules. */
export function millisecondsToNextMinute(now = new Date()): number {
  return Math.max(50, 60_000 - now.getSeconds() * 1000 - now.getMilliseconds() + 25)
}
