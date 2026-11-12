// @vitest-environment node
/**
 * macOS desktop sidebar fills (dsh-deep-whale#230).
 *
 * Under `html[data-platform='darwin']` DSH 0.2.2-rc.1 clears SidebarRoot's
 * fill (`ui-sidebar .root { background: transparent }`) and replaces the
 * AppFrame column fill with a translucent vibrancy tint
 * (`.frame:not([data-sidebar-drawer]) .sidebarCol`, plus a dark-theme
 * variant). The maid mascot sits under the root and relies on the root fill
 * to read as a watermark, so the skin restores both fills on macOS.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')
  .replaceAll('\r\n', '\n')

const COLUMN = "html[data-platform='darwin'] body[data-dsh-maid-atelier]\n  [class*='frame']:not([data-sidebar-drawer]) > [class*='sidebarCol']"
const ROOT = "html[data-platform='darwin'] body[data-dsh-maid-atelier] [data-slot='sidebar'] > [class*='root']"

function declarations(selector: string): string {
  const start = CSS.indexOf(`${selector} {`)
  if (start < 0) return ''
  const open = CSS.indexOf('{', start)
  return CSS.slice(open + 1, CSS.indexOf('}', open))
}

/** [ids, classes/attributes/pseudo-classes, elements]; enough for these selectors. */
function specificity(selector: string): [number, number, number] {
  let rest = selector
  let inner: [number, number, number] = [0, 0, 0]
  rest = rest.replace(/:not\(([^()]*)\)/g, (_, arg: string) => {
    const s = specificity(arg)
    inner = [inner[0] + s[0], inner[1] + s[1], inner[2] + s[2]]
    return ' '
  })
  const ids = (rest.match(/#[\w-]+/g) ?? []).length
  const classes = (rest.match(/\[[^\]]*\]|\.[\w-]+|:(?!:)[\w-]+/g) ?? []).length
  const elements = (rest.replace(/\[[^\]]*\]/g, ' ').match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length
  return [ids + inner[0], classes + inner[1], elements + inner[2]]
}

function outranks(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

describe('Maid Atelier macOS sidebar fills', () => {
  it('restores the opaque navy column outside the drawer', () => {
    expect(declarations(COLUMN)).toContain('background: #0a173b')
  })

  it('restores the root fill that veils the sidebar mascot', () => {
    expect(declarations(ROOT)).toContain('background: var(--dsw-specific-sidebar-fill)')
  })

  it('outranks the host darwin column and root rules, dark theme included', () => {
    const column = specificity(COLUMN)
    expect(outranks(column, specificity("[data-platform='darwin'] .frame:not([data-sidebar-drawer]) .sidebarCol"))).toBe(true)
    expect(outranks(column, specificity("[data-platform='darwin'] [data-ds-dark-theme] .frame:not([data-sidebar-drawer]) .sidebarCol"))).toBe(true)
    expect(outranks(specificity(ROOT), specificity("[data-platform='darwin'] .root"))).toBe(true)
  })

  it('keeps the mascot layered below the sidebar content root', () => {
    const mascot = CSS.match(/body\[data-dsh-maid-atelier\] \[data-skin-chrome='sidebar-mascot'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(mascot).toContain('z-index: 0')
    expect(CSS).toMatch(/\[class\*='sidebarCol'\] > div > :not\(\s*\[data-skin-chrome='sidebar-mascot'\],[^)]*\)\s*\{\s*position: relative;\s*z-index: 2;/)
  })
})
