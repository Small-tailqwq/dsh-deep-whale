// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { ScheduleEditor } from '../src/client/SkinManager.tsx'
import type { SkinSetting } from '../src/protocol.ts'
import {
  definitionTitle,
  optionLabel,
  settingDescription,
  settingLabel,
  skinManagerCopy,
  subscribeUiLang,
  uiLangSnapshot,
} from '../src/client/locale.ts'

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

const originalLanguage = window.navigator.language

function setNavigatorLanguage(value: string): void {
  Object.defineProperty(window.navigator, 'language', { value, configurable: true })
}

afterEach(() => {
  document.documentElement.lang = ''
  setNavigatorLanguage(originalLanguage)
})

describe('ui language detection', () => {
  it('prefers <html lang> over the navigator default', () => {
    document.documentElement.lang = 'zh-CN'
    setNavigatorLanguage('en-US')
    expect(uiLangSnapshot()).toBe('zh')
    document.documentElement.lang = 'en'
    expect(uiLangSnapshot()).toBe('en')
  })

  it('falls back to navigator.language and treats every zh tag as Chinese', () => {
    document.documentElement.lang = ''
    setNavigatorLanguage('zh-TW')
    expect(uiLangSnapshot()).toBe('zh')
    setNavigatorLanguage('en-US')
    expect(uiLangSnapshot()).toBe('en')
    setNavigatorLanguage('ja-JP')
    expect(uiLangSnapshot()).toBe('en')
  })
})

describe('ui language following', () => {
  it('notifies subscribers when the host repoints <html lang>', async () => {
    document.documentElement.lang = 'zh-CN'
    const calls: string[] = []
    const unsubscribe = subscribeUiLang(() => calls.push(uiLangSnapshot()))
    expect(calls).toEqual([])

    document.documentElement.lang = 'en'
    await flush()
    expect(calls).toEqual(['en'])

    document.documentElement.lang = 'zh-HK'
    await flush()
    expect(calls).toEqual(['en', 'zh'])
    unsubscribe()
  })

  it('drops the observer once the last subscriber leaves', async () => {
    document.documentElement.lang = 'zh-CN'
    let notified = false
    const unsubscribe = subscribeUiLang(() => { notified = true })
    unsubscribe()

    document.documentElement.lang = 'en'
    await flush()
    expect(notified).toBe(false)
  })

  it('resamples when a subscription era starts with a different locale', async () => {
    document.documentElement.lang = 'zh-CN'
    subscribeUiLang(() => {})()
    expect(uiLangSnapshot()).toBe('zh')

    document.documentElement.lang = 'en'
    await flush()
    expect(uiLangSnapshot()).toBe('en')

    // The notification baseline must restart with the fresh locale: a flip
    // back and forth across eras still reaches the new subscriber.
    document.documentElement.lang = 'zh-CN'
    await flush()
    const calls: string[] = []
    const unsubscribe = subscribeUiLang(() => calls.push(uiLangSnapshot()))
    document.documentElement.lang = 'en'
    await flush()
    expect(calls).toEqual(['en'])
    unsubscribe()
  })
})

describe('manager copy tables', () => {
  it('keeps both languages on the same key set', () => {
    expect(Object.keys(skinManagerCopy('en'))).toEqual(Object.keys(skinManagerCopy('zh')))
  })

  it('localizes parameterized copy', () => {
    expect(skinManagerCopy('zh').compatibility('1.2.3rc8')).toBe('已适配 DSH 1.2.3rc8')
    expect(skinManagerCopy('en').compatibility('1.2.3rc8')).toBe('Verified on DSH 1.2.3rc8')
  })
})

describe('skin-declared copy fallbacks', () => {
  it('prefers the En variant only in English and only when declared', () => {
    const setting: SkinSetting = {
      key: 'demo',
      type: 'select',
      label: '示例',
      defaultValue: 'a',
      options: [
        { value: 'a', label: '甲', labelEn: 'A' },
        { value: 'b', label: '乙' },
      ],
    }
    expect(settingLabel(setting, 'en')).toBe('示例')
    expect(settingLabel({ ...setting, labelEn: 'Demo' }, 'en')).toBe('Demo')
    expect(settingDescription(setting, 'en')).toBeUndefined()
    expect(optionLabel(setting.options[0]!, 'en')).toBe('A')
    // Un-localized options degrade to the Chinese declaration.
    expect(optionLabel(setting.options[1]!, 'en')).toBe('乙')
    expect(definitionTitle({ skinId: 's', title: '标题', titleEn: 'Title', settings: [], apply: () => {} }, 'zh')).toBe('标题')
    expect(definitionTitle({ skinId: 's', title: '标题', settings: [], apply: () => {} }, 'en')).toBe('标题')
  })
})

describe('localized settings markup', () => {
  const setting = {
    key: 'sfw',
    type: 'visibility-schedule',
    label: 'SFW',
  } as Extract<SkinSetting, { type: 'visibility-schedule' }>
  const props = {
    setting,
    value: { enabled: true, outside: 'visible' as const, ranges: [{ start: '09:00', end: '12:00' }] },
    onChange: () => {},
  }
  const markup = (): string => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      return renderToStaticMarkup(createElement(ScheduleEditor, props))
    } finally {
      onError.mockRestore()
    }
  }

  it('renders Chinese controls while the host is Chinese', () => {
    document.documentElement.lang = 'zh-CN'
    expect(markup()).toContain('aria-label="时段 1 开始 时"')
    expect(markup()).toContain('添加时间段')
  })

  it('renders English controls while the host is English', () => {
    document.documentElement.lang = 'en'
    expect(markup()).toContain('aria-label="Period 1 start hour"')
    expect(markup()).toContain('Add period')
  })
})
