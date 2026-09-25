// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { installOrcaWindowsMenu } from '../src/client/windows-menu.ts'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-link.module.css'), 'utf8')
  .replaceAll('\r\n', '\n')

function mountShellMenu(): ShadowRoot {
  const host = document.createElement('div')
  host.dataset.windowsMenu = ''
  const shadow = host.attachShadow({ mode: 'open' })
  const shellStyle = document.createElement('style')
  shellStyle.textContent = 'button { border-radius: 6px; }'
  shadow.append(shellStyle)
  document.body.append(host)
  return shadow
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ORCA LINK Windows caption menubar', () => {
  it('squares the shell menubar and removes only its own stylesheet', () => {
    const shadow = mountShellMenu()
    const dispose = installOrcaWindowsMenu(document.body)
    const owned = shadow.querySelectorAll('style[data-orca-windows-menu]')
    expect(owned).toHaveLength(1)
    expect(owned[0]!.textContent).toContain('border-radius: 0')

    dispose()
    expect(shadow.querySelectorAll('style[data-orca-windows-menu]')).toHaveLength(0)
    expect(shadow.querySelectorAll('style')).toHaveLength(1)
  })

  it('decorates a menubar the shell mounts after activation, once', async () => {
    const dispose = installOrcaWindowsMenu(document.body)
    const shadow = mountShellMenu()
    await Promise.resolve()
    document.body.append(document.createElement('div'))
    await Promise.resolve()
    expect(shadow.querySelectorAll('style[data-orca-windows-menu]')).toHaveLength(1)
    dispose()
    expect(shadow.querySelectorAll('style[data-orca-windows-menu]')).toHaveLength(0)
  })

  it('hovers the menubar and expanded toggle with the caption wash and drops the frame corner', () => {
    expect(CSS).toMatch(
      /html\[data-windows-titlebar\] body\[data-dsh-orca-link\] > \[data-windows-menu\]\s*\{\s*--dsw-alias-interactive-bg-hover: color-mix\(in srgb, var\(--dsw-alias-label-secondary\) 14%, transparent\);/,
    )
    expect(CSS).toMatch(
      /\[class\*='root'\]:not\(\[class\*='collapsed'\]\) > \[class\*='logoRow'\] > button\[class\*='toggle'\]:is\(:hover, :focus-visible\)\s*\{\s*background: color-mix\(in srgb, var\(--dsw-alias-label-secondary\) 14%, transparent\);/,
    )
    expect(CSS).toMatch(
      /html\[data-windows-titlebar\] body\[data-dsh-orca-link\] :is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\)\s*\{\s*border-radius: 0;/,
    )
  })
})
