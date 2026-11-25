// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  if (typeof requestAnimationFrame === 'function') {
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
  } else {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  await Promise.resolve()
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('installMaidMarkdownWidth', () => {
  it('keeps prose compact and marks size-contained embeds full width', async () => {
    const markdown = hostMarkdown('<p>short <strong>answer</strong></p>')
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)

    const embedded = document.createElement('div')
    embedded.setAttribute('style', 'container-type: inline-size')
    embedded.innerHTML = '<div><button type="button">action</button></div>'
    markdown.append(embedded)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)

    embedded.remove()
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it.each([
    ['contain: size', true],
    ['contain: strict', true],
    ['contain: inline-size layout', true],
    ['container-type: inline-size scroll-state', true],
    ['contain: content', false],
    ['container-type: scroll-state', false],
  ])('reads size containment from %s', async (declaration, wide) => {
    const runtime = installMaidMarkdownWidth({} as never)
    const markdown = hostMarkdown(`<div style="${declaration}"><canvas></canvas></div>`)
    await mutations()
    const marked = markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)
    runtime.dispose()
    expect(marked).toBe(wide)
  })

  it('keeps MathML and SVG out of the style probe', async () => {
    const markdown = hostMarkdown(
      '<p><span class="katex"><math><semantics><mrow><mi>x</mi></mrow></semantics></math></span></p>'
      + '<p><svg viewBox="0 0 1 1"><path d="M0 0"></path></svg></p>',
    )
    const probed: Element[] = []
    const getComputedStyle = window.getComputedStyle.bind(window)
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      probed.push(element)
      return getComputedStyle(element, pseudo)
    })
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
    const wide = markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)
    runtime.dispose()
    spy.mockRestore()
    expect(probed.filter(element => element.namespaceURI !== 'http://www.w3.org/1999/xhtml')).toEqual([])
    expect(wide).toBe(false)
  })

  it('rechecks mounted content when containment is enabled or removed', async () => {
    const markdown = hostMarkdown('<div id="embedded"><canvas></canvas></div>')
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)

    const embedded = markdown.querySelector<HTMLElement>('#embedded')
    expect(embedded).not.toBeNull()
    embedded!.setAttribute('style', 'container-type: inline-size')
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)

    embedded!.removeAttribute('style')
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it.each([
    ['inline KaTeX MathML', '<p>answer <span class="katex"><math><semantics><mrow><mi>x</mi></mrow></semantics></math></span></p>'],
    ['a short code block', '<div class="md-code-block"><pre><code>const x = 1</code></pre></div>'],
    ['a small table', '<div class="table-scroll"><table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>'],
    ['a single image', '<p><img alt="plot" src="data:image/png;base64,x"></p>'],
  ])('keeps host Markdown compact: %s', async (_name, content) => {
    const markdown = hostMarkdown(content)
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it('marks rich markdown when a complete assistant step is inserted', async () => {
    const runtime = installMaidMarkdownWidth({} as never)
    const markdown = hostMarkdown('<p>chart</p><div style="container-type: inline-size"><canvas></canvas></div>')
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)
    runtime.dispose()
  })

  it('marks existing size-contained content and restores overlapping activation cleanly', async () => {
    const markdown = hostMarkdown('<p>chart</p><div style="container-type: inline-size"><canvas></canvas></div>')
    const first = installMaidMarkdownWidth({} as never)
    const second = installMaidMarkdownWidth({} as never)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)

    first.dispose()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(true)
    second.dispose()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
  })

  it('does not treat task-list checkboxes as embedded forms', async () => {
    const markdown = hostMarkdown('<ul><li><input type="checkbox" checked> done</li></ul>')
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
    expect(markdown.hasAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE)).toBe(false)
    runtime.dispose()
  })

  it('restores a pre-existing attribute value on dispose', async () => {
    const markdown = hostMarkdown('<div style="container-type: inline-size"><canvas></canvas></div>')
    markdown.setAttribute(MAID_MARKDOWN_FULL_WIDTH_ATTRIBUTE, 'host')
    const runtime = installMaidMarkdownWidth({} as never)
    await mutations()
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
