import { describe, expect, it } from 'vitest'
import { skinSwitchState } from '../src/index.ts'

const catalog = [
  { id: 'maid', name: 'Maid', package: '@test/maid', wiringId: 'maid', bodyAttr: 'data-maid', order: 5 },
  { id: 'link', name: 'Link', package: '@test/link', wiringId: 'link', bodyAttr: 'data-link', order: 10 },
]

describe('skin switch runtime state', () => {
  it('identifies only disabled, disposed skins still published to the client', () => {
    const graph = [{ id: '@test/link' }, { id: '@test/maid' }, { id: 'other-plugin' }]
    const entries = [
      { options: { name: '@test/link' }, disabled: true, fiber: { uid: null } },
      { options: { name: '@test/maid' }, disabled: false, fiber: { uid: 7 } },
    ]
    expect(skinSwitchState(['- id: maid\n  disabled: false\n- id: link\n  disabled: true\n'], catalog, graph, entries))
      .toEqual({ configured: ['maid'], active: ['maid', 'link'], stale: ['link'] })
    entries[0]!.disabled = false
    expect(skinSwitchState([], catalog, graph, entries).stale).toEqual([])
    entries[0]!.disabled = true
    expect(skinSwitchState([], catalog, [{ id: '@test/maid' }], entries).stale).toEqual([])
  })
})
