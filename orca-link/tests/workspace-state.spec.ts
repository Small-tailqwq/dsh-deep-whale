import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

function declarationBlock(selector: string): string {
  const selectorIndex = css.indexOf(selector)
  expect(selectorIndex).toBeGreaterThanOrEqual(0)
  const blockStart = css.indexOf('{', selectorIndex)
  const blockEnd = css.indexOf('}', blockStart)
  return css.slice(blockStart + 1, blockEnd)
}

describe('workspace state styling', () => {
  it('reserves blue for the current workspace instead of every open folder', () => {
    const openBlock = declarationBlock(
      "body[data-dsh-orca-link] [data-slot='sidebar'] [role='treeitem'][aria-expanded='true']",
    )
    const currentBlock = declarationBlock(
      "body[data-dsh-orca-link] [data-slot='sidebar'] [role='tree']\n  > div:has([role='treeitem'][aria-selected='true'])\n  [role='treeitem'][aria-expanded]",
    )

    expect(openBlock).toContain('var(--orca-graphite)')
    expect(openBlock).not.toContain('border-left: 2px solid var(--orca-blue)')
    expect(currentBlock).toContain('border-left-color: var(--orca-blue)')
  })

  it('adds an independent square marker to the current workspace', () => {
    const markerBlock = declarationBlock(
      "body[data-dsh-orca-link] [data-slot='sidebar'] [role='tree']\n  > div:has([role='treeitem'][aria-selected='true'])\n  [role='treeitem'][aria-expanded]::after",
    )

    expect(markerBlock).toContain('width: 5px')
    expect(markerBlock).toContain('height: 5px')
    expect(markerBlock).toContain('background: var(--orca-blue)')
  })
})
