// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { SKIN_PACKAGE_ID, releaseClaimedStyles } from '../src/client/release-claimed-styles.ts'

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { name: string }

const style = (attrs: Record<string, string>): HTMLStyleElement => {
  const el = document.createElement('style')
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  document.head.append(el)
  return el
}

describe('release of styles the client loader claimed', () => {
  afterEach(() => { document.head.innerHTML = '' })

  it('uses the package name the loader stamps on this skin', () => {
    expect(SKIN_PACKAGE_ID).toBe(pkg.name)
  })

  it('un-claims runtime tags but keeps the tags the bundle emitted', () => {
    const own = style({ 'data-plugin': SKIN_PACKAGE_ID, 'data-plugin-css': `${SKIN_PACKAGE_ID}/x.module.css` })
    // e.g. CSS-in-JS rule tags another plugin injected, then claimed for this skin
    const foreign = style({ 'data-plugin': SKIN_PACKAGE_ID })
    const other = style({ 'data-plugin': '@deepseek-ai/dsh-client-ui-chat', 'data-plugin-css': 'chat/a.css' })
    const untagged = style({})

    releaseClaimedStyles()

    expect(own.getAttribute('data-plugin')).toBe(SKIN_PACKAGE_ID)
    expect(foreign.hasAttribute('data-plugin')).toBe(false)
    expect(other.getAttribute('data-plugin')).toBe('@deepseek-ai/dsh-client-ui-chat')
    expect(untagged.hasAttribute('data-plugin')).toBe(false)
  })

  it('leaves the loader sweep nothing of another plugin to delete', () => {
    style({ 'data-plugin': SKIN_PACKAGE_ID, 'data-plugin-css': 'own' })
    style({ 'data-plugin': SKIN_PACKAGE_ID })
    releaseClaimedStyles()
    // The loader's own sweep, as in modules/entry-lifecycle removeOwnedStyles.
    for (const el of document.querySelectorAll('style[data-plugin]')) {
      if (el.getAttribute('data-plugin') === SKIN_PACKAGE_ID) el.remove()
    }
    expect(document.querySelectorAll('style')).toHaveLength(1)
  })
})
