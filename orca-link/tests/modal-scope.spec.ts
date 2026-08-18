import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

describe('ORCA modal style boundaries', () => {
  it('limits settings layout and animation to the settings host', () => {
    const settingsHost = "[data-slot='sidebar.settings'] > [role='presentation']:has(> [role='dialog'])"
    const unscopedDialogHost = /body\[data-dsh-orca-link\](?:\[[^\n]+\])?\s+(?!\[data-slot='sidebar\.settings'\])\[role='presentation'\]:has\(> \[role='dialog'\]\)/

    expect(css).toContain(settingsHost)
    expect(css).not.toMatch(unscopedDialogHost)
    expect(css).not.toContain(":has([data-slot='sidebar'] [role='dialog'])")
  })

  it('keeps the settings provider picker out of generic dialogs', () => {
    expect(css).toContain("[data-slot='sidebar.settings'] [role='dialog'] select")
    expect(css).not.toContain("body[data-dsh-orca-link] [role='dialog'] select")
  })

  it('centers appearance choices and gives the active theme a provider-style marker', () => {
    expect(css).toContain("[class$='_cubeRow'] > button[class*='_themeCube']")
    expect(css).toContain("button[class*='_themeCube'][aria-pressed='true']::after")
    expect(css).toContain('clip-path: polygon(0 0, 100% 0, 100% 100%, 58% 100%, 58% 42%, 0 42%)')
  })

  it('centers model provider select content and pushes its picker icon to the edge', () => {
    expect(css).toContain("select[class$='_selectInput']")
    expect(css).toContain("select[class$='_selectInput']::picker-icon")
    expect(css).toContain('margin-left: auto')
  })
})
