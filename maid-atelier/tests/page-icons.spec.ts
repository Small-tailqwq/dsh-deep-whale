// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { installMaidPageIcons } from '../src/client/page-icons.ts'

describe('maid page icons', () => {
  it('scopes the Web-app manifest to a reverse-proxy prefix', async () => {
    document.head.innerHTML = '<base href="http://localhost:3000/dsh/" />'
    const ctx = new Context()
    const fiber = ctx.plugin({ apply: (inner: Context) => { installMaidPageIcons(inner) } })
    await fiber
    const href = document.head.querySelector<HTMLLinkElement>('link[data-skin-chrome="manifest"]')!.getAttribute('href') ?? ''
    const manifest = JSON.parse(decodeURIComponent(href.slice('data:application/manifest+json,'.length)))
    expect(manifest).toMatchObject({ id: 'http://localhost:3000/dsh/', start_url: 'http://localhost:3000/dsh/', scope: 'http://localhost:3000/dsh/' })
    await fiber.dispose()
    expect(document.head.querySelector('link[data-skin-chrome]')).toBeNull()
    document.head.innerHTML = ''
  })
})
