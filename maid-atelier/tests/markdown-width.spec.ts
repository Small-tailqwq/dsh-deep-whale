// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { installMaidMarkdownWidth, MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE } from '../src/client/markdown-width.ts'

const css = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')

function hostMarkdown(content = ''): HTMLElement {
  const step = document.createElement('div')
  step.dataset.chatFlowKind = 'assistant-step'
  const seat = document.createElement('div')
  const assistant = document.createElement('div')
  const column = document.createElement('div')
  const markdown = document.createElement('div')
  markdown.className = 'fixture_markdown'
  markdown.innerHTML = content
  column.append(markdown)
  assistant.append(column)
  seat.append(assistant)
  step.append(seat)
  document.body.append(step)
  return markdown
}

async function mutations(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('installMaidMarkdownWidth', () => {
  it('keeps prose compact and marks embedded plugin surfaces full width', async () => {
    const markdown = hostMarkdown('<p>short <strong>answer</strong></p>')
    const runtime = installMaidMarkdownWidth({} as never)
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)

    const embedded = document.createElement('div')
    embedded.className = 'genui-dom-fence'
    embedded.innerHTML = '<div><button type="button">action</button></div>'
    markdown.append(embedded)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)

    embedded.remove()
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it('marks rich markdown when a complete assistant step is inserted', async () => {
    const runtime = installMaidMarkdownWidth({} as never)
    const markdown = hostMarkdown('<p>chart</p><div><canvas></canvas></div>')
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)
    runtime.dispose()
  })

  it('marks existing width-bearing content and restores overlapping activation cleanly', async () => {
    const markdown = hostMarkdown('<p>form</p><div><input type="text" aria-label="name"></div>')
    const first = installMaidMarkdownWidth({} as never)
    const second = installMaidMarkdownWidth({} as never)
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)

    first.dispose()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)
    second.dispose()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
  })

  it('does not treat task-list checkboxes as embedded forms', () => {
    const markdown = hostMarkdown('<ul><li><input type="checkbox" checked> done</li></ul>')
    const runtime = installMaidMarkdownWidth({} as never)
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it('restores a pre-existing attribute value on dispose', () => {
    const markdown = hostMarkdown('<div><canvas></canvas></div>')
    markdown.setAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE, 'host')
    const runtime = installMaidMarkdownWidth({} as never)
    expect(markdown.getAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe('')
    runtime.dispose()
    expect(markdown.getAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe('host')
  })
})

describe('full-width markdown rule', () => {
  it('overrides only the projected Markdown bubble width', () => {
    const rule = css.match(
      /div\[class\*='markdown'\]\[data-maid-markdown-full-width\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(rule).toContain('align-self: stretch')
    expect(rule).toContain('width: auto')
    expect(css).not.toContain("[data-chat-flow-kind='assistant-step'] > * > * > * > div[class*='markdown']:has")
  })
})
