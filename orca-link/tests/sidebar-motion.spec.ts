import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n')

describe('ORCA LINK sidebar motion', () => {
  it('moves the wordmark in a stable sidebar coordinate system', () => {
    const rule = css.match(/body\[data-dsh-orca-link\] \.dshWordmark\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(rule).toContain('top: calc(21px + var(--orca-stage-top, 0px));')
    expect(rule).toContain('left: 0;')
    expect(rule).toContain('transform-origin: center;')
    expect(rule).not.toMatch(/(?:top|left) 260ms/)
  })

  it('centers the collapsed wordmark using the final sidebar track width', () => {
    expect(css).toContain('translateX(calc((var(--orca-sidebar-width, 56px) - 118px) / 2)) scale(0.28)')
    expect(css).toContain('transform: translateX(16px) scale(1);')
  })

  it('keeps the character stage width stable and lets the pane edge wipe it', () => {
    const rule = css.match(/:first-child > .statusCharacter {([^}]*)}/s)?.[1] ?? ''
    expect(rule).toContain('width: calc(var(--orca-sidebar-art-width, 280px) - 30px);')
    // No private clip or slide: a 180ms wipe outran the 300ms track and emptied the stage early.
    expect(rule).not.toContain('clip-path')
    expect(rule).not.toContain('transform: translateX')
    expect(rule).toContain('transition: opacity 90ms linear calc(var(--orca-track-duration) - 90ms);')
    expect(rule).toContain('will-change: opacity;')
  })

  it('runs every track-coupled layer on the host sidebar clock', () => {
    expect(css).toContain('--orca-track-duration: var(--ds-transition-duration-slow, 300ms);')
    expect(css).toContain('--orca-track-ease: var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));')
    expect(css).toContain('transform var(--orca-track-duration) var(--orca-track-ease)')
    expect(css).toContain('transition: opacity var(--orca-track-duration) var(--orca-track-ease);')
    expect(css).not.toContain('transition-duration: 200ms;')
  })

  it('moves the seam ruler by transform on the track clock and stops easing during a drag', () => {
    const spine = css.match(/.spine {([^}]*)}/s)?.[1] ?? ''
    expect(spine).toContain('left: 0;')
    expect(spine).toContain('transform: translateX(calc(var(--orca-sidebar-width) - 4px));')
    expect(spine).toContain('transition: transform var(--orca-track-duration) var(--orca-track-ease);')
    expect(css).toContain('body[data-dsh-orca-link][data-orca-sidebar-dragging] .spine { transition: none; }')
  })

  it('hides stale sidebar tooltips during WebApp window resume', () => {
    expect(css).toContain("[data-orca-window-resuming] [data-slot='sidebar'] [role='tooltip']")
    expect(css).toContain('display: none;')
  })

  it('takes over only the native New Session seat, independent of plugin markers', () => {
    const selector = css.match(/@media \(min-width: 901px\) \{\s*([^{]+)\{/)?.[1]?.trim() ?? ''
    const dom = new JSDOM(`<body data-dsh-orca-link><aside data-slot="sidebar" data-orca-sidebar-wide>
      <div class="host_root"><div class="host_logoRow"></div>
        <button id="native" class="host_newSession"></button>
        <button id="plain"></button><button class="host_newSession" data-plugin-entry="example"></button>
        <div data-plugin-entry="wrapper"><button class="host_newSession"></button></div>
        <nav class="host_panelList"><button></button></nav>
      </div></aside></body>`)
    const doc = dom.window.document
    expect([...doc.querySelectorAll(selector)].map(node => node.id)).toEqual(['native'])
    doc.querySelector('.host_root')!.classList.add('host_collapsed')
    expect(doc.querySelector(selector)).toBeNull()
    doc.querySelector('.host_root')!.classList.remove('host_collapsed')
    doc.documentElement.setAttribute('data-dsh-whale-orca-character', 'hidden')
    expect(doc.querySelector(selector)).toBeNull()
    dom.window.close()
  })

  it('gives the New Session hit plane exactly the portrait box', () => {
    const button = "html:not([data-dsh-whale-orca-character='hidden']) body[data-dsh-orca-link] [data-slot='sidebar'][data-orca-sidebar-wide] > :first-child:not([class*='collapsed']) > [class*='logoRow'] + button[class*='newSession']"
    const esc = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = (selector: string): string => css.match(new RegExp(`${esc(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const character = block("body[data-dsh-orca-link] [data-slot='sidebar'] > :first-child > .statusCharacter")
    const plane = block(`${button}::before`)
    for (const declaration of [
      'top: calc(58px + var(--orca-stage-top, 0px));',
      'left: 22px;',
      'width: calc(var(--orca-sidebar-art-width, 280px) - 30px);',
      'height: calc(var(--orca-stage, 300px) - 66px);',
    ]) {
      expect(character).toContain(declaration)
      expect(plane).toContain(declaration)
    }
    // The button stays static so both boxes resolve against the sidebar root.
    expect(block(button)).toContain('position: static;')
    expect(plane).toContain('z-index: 2;')
  })

  it('restores the web logo-row flow under the Windows caption frame', () => {
    const root = "html[data-windows-titlebar] body[data-dsh-orca-link]\n    [data-slot='sidebar'] > [class*='root']:not([class*='collapsed'])"
    expect(css).toContain(`${root} > [class*='logoRow'] {\n  height: 60px;\n  margin-bottom: 4px;\n}`)
    expect(css).toContain(`${root} > button[class*='newSession'] {\n  margin-top: 0;\n}`)
  })

  it('moves the absolute stage below the macOS window-button strip', () => {
    expect(css).toContain("html[data-platform='darwin'] body[data-dsh-orca-link] {\n  --orca-stage-top: 34px;\n}")
    expect(css).toMatch(/:is\(\[data-slot='sidebar'\] > :first-child\)::before \{\s*position: absolute;\s*inset: var\(--orca-stage-top, 0px\) auto 0 0;/)
    expect(css).toContain('top: calc(46px + var(--orca-stage-top, 0px));')
    expect(css).toContain("[class*='logoRow'] > [class*='brand'] {\n  visibility: hidden;\n}")
  })

  it('reserves the stage once in the native seat only while the portrait is shown', () => {
    const wide = css.match(/@media \(min-width: 901px\) \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(wide).toContain("html:not([data-dsh-whale-orca-character='hidden'])")
    expect(wide).toContain(":first-child:not([class*='collapsed']) > [class*='logoRow'] + button[class*='newSession']")
    expect(wide).toContain('height: calc(var(--orca-stage, 300px) - 78px);')
    const region = css.match(/\[data-orca-sidebar-wide\] \[class\*='regionArea'\] \{([^}]*)\}/)?.[1] ?? ''
    expect(region).toContain('border-top: 1px solid var(--orca-line);')
    expect(region).not.toContain('margin-top')
  })
})
