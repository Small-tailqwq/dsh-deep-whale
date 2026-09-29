// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { installOrcaRelationalMarkers } from '../src/client/relational-markers.ts'

/** The marker installer only consumes `effect`, so the context can stay a stub. */
function installMarkers(): Array<() => void> {
  const disposers: Array<() => void> = []
  const ctx = {
    effect(factory: () => () => void): void {
      disposers.push(factory())
    },
  } as unknown as Context
  installOrcaRelationalMarkers(ctx)
  return disposers
}

describe('ORCA model menu markers follow the host menu shape', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('marks the 0.2.0-rc.2 drilled pane, whose surface is role=group', () => {
    document.body.innerHTML = `
      <div class="ModelSelect_menu" role="group" data-menu-material="translucent">
        <div class="ModelSelect_groups" role="menu">
          <section data-menu-group="">
            <div data-menu-group-heading=""></div>
            <button type="button" role="menuitemradio"><span class="ModelSelect_modelName"></span></button>
          </section>
        </div>
      </div>
    `
    const disposers = installMarkers()
    const surface = document.querySelector<HTMLElement>('.ModelSelect_menu')!
    expect(surface.hasAttribute('data-orca-model-menu')).toBe(true)
    expect(surface.hasAttribute('data-orca-menu-groups')).toBe(true)
    expect(surface.hasAttribute('data-orca-menu-models')).toBe(true)
    expect(surface.hasAttribute('data-orca-menu-cells')).toBe(false)

    for (const dispose of disposers) dispose()
    expect(surface.hasAttribute('data-orca-model-menu')).toBe(false)
  })

  it('keeps marking the 0.1.7 menu, whose surface is role=menu with a group title', () => {
    document.body.innerHTML = `
      <div class="ModelSelect_menu" role="menu">
        <div class="ModelSelect_groups"><section role="group"><div class="ModelSelect_groupTitle"></div>
          <button type="button" role="menuitemradio"><span class="ModelSelect_modelName"></span></button></section></div>
      </div>
    `
    const disposers = installMarkers()
    const surface = document.querySelector<HTMLElement>('.ModelSelect_menu')!
    expect(surface.hasAttribute('data-orca-model-menu')).toBe(true)
    expect(surface.hasAttribute('data-orca-menu-groups')).toBe(true)
    expect(surface.hasAttribute('data-orca-menu-models')).toBe(true)

    for (const dispose of disposers) dispose()
    expect(surface.hasAttribute('data-orca-model-menu')).toBe(false)
  })
})
