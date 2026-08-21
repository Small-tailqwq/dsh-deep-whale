import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { ScheduleEditor } from '../src/client/SkinManager.tsx'
import type { SkinSetting } from '../src/protocol.ts'

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

  it('scopes the switch hit area to the control instead of the whole row', () => {
    const html = markup(() => renderToStaticMarkup(createElement(ScheduleEditor, {
      setting,
      value: { enabled: true, outside: 'visible', ranges: [] },
      onChange: () => {},
    })))
    // The row is a plain div: clicking the label copy or row blank space must
    // not flip the setting.
    expect(html).not.toMatch(/<label class="[^"]*_toggleRow_[^"]*">/)
    // The switch itself stays a label so the control (plus its small padded
    // hit slack) is the only click target.
    expect(html).toMatch(/<label class="[^"]*_toggleSwitch_[^"]*"><input type="checkbox" role="switch"/)
  })
})
