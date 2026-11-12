import { describe, expect, it } from 'vitest'
import type { SkinCustomizationDefinition, SkinSetting } from '../src/protocol.ts'
import { layoutSettings, settingLock, settingVisible, type SettingNode } from '../src/client/runtime.ts'

const toggle = (key: string, extra: Partial<SkinSetting> = {}): SkinSetting => ({ key, type: 'boolean', label: key, defaultValue: false, ...extra } as SkinSetting)

function definition(settings: SkinSetting[], groups?: SkinCustomizationDefinition['groups']): SkinCustomizationDefinition {
  return { protocol: 2, skinId: 'test', title: 'Test', settings, apply: () => {}, ...(groups === undefined ? {} : { groups }) }
}

/** Compact tree: `key` or `key[child, child]`. */
const shape = (nodes: SettingNode[]): string[] => nodes.map(node => node.children.length === 0
  ? node.setting.key
  : `${node.setting.key}[${shape(node.children).join(', ')}]`)

describe('settings layout', () => {
  it('renders groups in declared order, whatever the array order', () => {
    const sections = layoutSettings(definition([
      toggle('late', { group: 'composer' }),
      toggle('art', { group: 'artwork' }),
      toggle('orphan'),
      toggle('unknown', { group: 'nope' }),
      toggle('look', { group: 'appearance' }),
    ], [
      { key: 'artwork', label: '立绘' },
      { key: 'appearance', label: '外观' },
      { key: 'composer', label: '输入框' },
      { key: 'empty', label: '空组' },
    ]))
    expect(sections.map(section => [section.key, section.label, shape(section.nodes)])).toEqual([
      ['artwork', '立绘', ['art']],
      ['appearance', '外观', ['look']],
      ['composer', '输入框', ['late']],
      // No group, or a group nobody declared: one untitled block at the end.
      ['', undefined, ['orphan', 'unknown']],
    ])
  })

  it('treats a skin without groups as one untitled block in array order', () => {
    const sections = layoutSettings(definition([toggle('a'), toggle('b')]))
    expect(sections).toHaveLength(1)
    expect(sections[0]!.label).toBeUndefined()
    expect(shape(sections[0]!.nodes)).toEqual(['a', 'b'])
  })

  it('drops a malformed group list instead of rejecting the controls', () => {
    const sections = layoutSettings(definition([toggle('a', { group: 'x' })], [null as never, { key: 1 as never, label: 'bad' }]))
    expect(shape(sections[0]!.nodes)).toEqual(['a'])
  })

  it('nests a dependent control under its parent even when it was appended last', () => {
    const sections = layoutSettings(definition([
      toggle('artwork'),
      toggle('font'),
      toggle('glasses', { visibleWhen: { key: 'artwork', values: [true] } }),
      toggle('character', { disabledWhen: 'auto' }),
      toggle('auto'),
    ]))
    expect(shape(sections[0]!.nodes)).toEqual(['artwork[glasses]', 'font', 'auto[character]'])
  })

  it('places an anyOf control beside its switches, under the row they share', () => {
    const sections = layoutSettings(definition([
      toggle('artwork'),
      toggle('desktop', { visibleWhen: { key: 'artwork', values: [true] } }),
      toggle('glasses', {
        visibleWhen: { key: 'mobile', values: [true], anyOf: [{ key: 'desktop', values: [true] }, { key: 'mobile', values: [true] }] },
      }),
      toggle('mobile', { visibleWhen: { key: 'artwork', values: [true] } }),
      toggle('schedule', { visibleWhen: { key: 'artwork', values: [true] } }),
    ]))
    expect(shape(sections[0]!.nodes)).toEqual(['artwork[desktop, mobile, glasses, schedule]'])
  })

  it('keeps dependencies across groups flat and survives a cycle', () => {
    const sections = layoutSettings(definition([
      toggle('a', { group: 'one', visibleWhen: { key: 'b', values: [true] } }),
      toggle('b', { group: 'one', visibleWhen: { key: 'a', values: [true] } }),
      toggle('c', { group: 'two', visibleWhen: { key: 'a', values: [true] } }),
    ], [{ key: 'one', label: 'One' }, { key: 'two', label: 'Two' }]))
    // The cycle is cut once, so both rows still render.
    expect(sections.map(section => shape(section.nodes))).toEqual([['a[b]'], ['c']])
  })
})

describe('dependent visibility and locks', () => {
  const settings = [
    toggle('artwork'),
    toggle('desktop', { visibleWhen: { key: 'artwork', values: [true] } }),
    toggle('mobile', { visibleWhen: { key: 'artwork', values: [true] } }),
    toggle('glasses', {
      visibleWhen: { key: 'mobile', values: [true], anyOf: [{ key: 'desktop', values: [true] }, { key: 'mobile', values: [true] }] },
    }),
    toggle('bottom'),
    toggle('scroll', { disabledWhen: 'bottom' }),
  ]

  it('hides the child of a hidden switch even while its own condition holds', () => {
    const glasses = settings[3]!
    expect(settingVisible(glasses, { artwork: true, desktop: false, mobile: true }, settings)).toBe(true)
    // Both model switches keep their stored "on", but artwork is off: they are
    // hidden, so the glasses option must not hang under nothing.
    expect(settingVisible(glasses, { artwork: false, desktop: true, mobile: true }, settings)).toBe(false)
    // Without the full list the check stays the single-level one.
    expect(settingVisible(glasses, { artwork: false, desktop: true, mobile: true })).toBe(true)
  })

  it('names the visible control that locks a row', () => {
    const scroll = settings[5]!
    expect(settingLock(scroll, { bottom: false }, settings)).toEqual({ locked: false })
    expect(settingLock(scroll, { bottom: true }, settings)).toEqual({ locked: true, by: settings[4] })
  })

  it('keeps a lock from a hidden control but names nothing', () => {
    const hiddenParent = [toggle('gate'), toggle('auto', { visibleWhen: { key: 'gate', values: [true] } }), toggle('manual', { disabledWhen: 'auto' })]
    expect(settingLock(hiddenParent[2]!, { gate: false, auto: true }, hiddenParent)).toEqual({ locked: true })
  })
})
