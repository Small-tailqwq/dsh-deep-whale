import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { ScheduleEditor } from '../src/client/SkinManager.tsx'
import type { SkinSetting } from '../src/protocol.ts'

const css = readFileSync(new URL('../src/client/skin-manager.module.css', import.meta.url), 'utf8')

const setting = {
  key: 'sfw',
  type: 'visibility-schedule',
  label: 'SFW',
} as Extract<SkinSetting, { type: 'visibility-schedule' }>

function markup(render: () => string): string {
  const onError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    return render()
  } finally {
    onError.mockRestore()
  }
}

describe('schedule editor', () => {
  it('renders each range as a pair of hour/minute selects instead of the OS time picker', () => {
    const html = markup(() => renderToStaticMarkup(createElement(ScheduleEditor, {
      setting,
      value: { enabled: true, outside: 'visible', ranges: [{ start: '09:00', end: '12:00' }] },
      onChange: () => {},
    })))
    expect(html).toContain('aria-label="时段 1 开始 时"')
    expect(html).toContain('aria-label="时段 1 开始 分"')
    expect(html).toContain('aria-label="时段 1 结束 时"')
    expect(html).toContain('aria-label="时段 1 结束 分"')
    // The open popup must be the themeable select surface, never input[type=time].
    expect(html).not.toContain('type="time"')
    // 24 hour options + 60 minute options per side, plus the policy select's
    // two choices.
    expect(html.match(/<option/g) ?? []).toHaveLength(2 * (24 + 60) + 2)
  })

  it('splits and recombines the HH:MM value through hour/minute selects', () => {
    const html = markup(() => renderToStaticMarkup(createElement(ScheduleEditor, {
      setting,
      value: { enabled: true, outside: 'visible', ranges: [{ start: '09:30', end: '22:05' }] },
      onChange: () => {},
    })))
    expect(html).toContain('value="09" selected="">09</option>')
    expect(html).toContain('value="30" selected="">30</option>')
    expect(html).toContain('value="22" selected="">22</option>')
    expect(html).toContain('value="05" selected="">05</option>')
  })

  it('draws the enable toggle with the host Switch, not a native checkbox', () => {
    const html = markup(() => renderToStaticMarkup(createElement(ScheduleEditor, {
      setting,
      value: { enabled: true, outside: 'visible', ranges: [] },
      onChange: () => {},
    })))
    // The row is a plain div: clicking the label copy or row blank space must
    // not flip the setting; only the switch button does.
    expect(html).not.toMatch(/<label class="[^"]*_toggleRow_[^"]*">/)
    expect(html).toMatch(/<button type="button" role="switch" aria-checked="true" aria-label="SFW"/)
    expect(html).not.toContain('type="checkbox"')
  })

  it('lets the hour and minute selects share their pair instead of the fixed select column', () => {
    // The generic select is a non-shrinking 240px column; inside a time pair
    // that pushed the minute select and the Remove button out of view.
    const rule = css.match(/\.timeSelect \.selectInput\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toContain('flex: 1 1 0')
    expect(rule).toContain('width: auto')
    expect(rule).toContain('min-width: 56px')
    expect(css).toMatch(/\.rangeRow\s*\{[^}]*grid-template-columns: minmax\(128px, 1fr\) auto minmax\(128px, 1fr\) auto/)
  })

  it('gives every select the host settings select geometry', () => {
    const html = markup(() => renderToStaticMarkup(createElement(ScheduleEditor, {
      setting,
      value: { enabled: true, outside: 'visible', ranges: [{ start: '09:00', end: '12:00' }] },
      onChange: () => {},
    })))
    // policy + 2 × (hour, minute)
    expect(html.match(/<select class="[^"]*_selectInput_/g) ?? []).toHaveLength(5)
    const rule = css.match(/\.selectInput\s*\{([^}]*)\}/)?.[1] ?? ''
    for (const declaration of ['height: 32px', 'width: 240px', 'flex: none', 'text-overflow: ellipsis', 'cursor: pointer']) {
      expect(rule).toContain(declaration)
    }
  })
})
