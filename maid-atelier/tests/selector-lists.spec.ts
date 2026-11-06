import { transform } from 'lightningcss'
import { describe, expect, it } from 'vitest'
import { createSelectorExpansion, specificity } from '../build/selector-lists.ts'

/** Run the same two passes as the client bundle and return the selector of each rule. */
function expand(css: string): string[] {
  const code = Buffer.from(css)
  const expansion = createSelectorExpansion()
  transform({ filename: 'x.css', code, visitor: expansion.collect })
  const out = transform({ filename: 'x.css', code, minify: true, visitor: expansion.expand }).code.toString()
  return [...out.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(match => match[1])
}

function specificityOf(selector: string): [number, number, number] {
  let result: [number, number, number] = [0, 0, 0]
  transform({ filename: 'x.css', code: Buffer.from(`${selector}{color:red}`), visitor: { Rule: { style(rule) { result = specificity(rule.value.selectors[0]) } } } })
  return result
}

describe('selector list expansion', () => {
  it('splits a rightmost :is() list into bucketable selectors', () => {
    expect(expand('body[data-x] [data-chat] :is(span, button) { color: red }'))
      .toEqual(['body[data-x] [data-chat] span,body[data-x] [data-chat] button'])
  })

  it('pads each branch back to the :is() specificity', () => {
    const [selectors] = expand('body[data-x] :is([data-a], div[data-b] > div) span { color: red }')
    expect(selectors).toBe('body[data-x] [data-a]:not(maid-specificity-pad):not(maid-specificity-pad) span,body[data-x] div[data-b]>div span')
    for (const selector of selectors.split(',')) expect(specificityOf(selector)).toEqual([0, 2, 4])
    expect(specificityOf('body[data-x] :is([data-a], div[data-b] > div) span')).toEqual([0, 2, 4])
  })

  it('keeps lists whose complex branches cannot be padded to one specificity', () => {
    expect(expand('body :is(#a, .b .c .d) { color: red }')).toEqual(['body :is(#a,.b .c .d)'])
  })

  it('restarts a compound branch from :where() when it outweighs a lighter maximum', () => {
    const [selectors] = expand('body[data-x] :is(dialog, [role="dialog"]) { color: red }')
    expect(selectors).toBe('body[data-x] :where(dialog):not([data-maid-specificity-pad]),body[data-x] [role=dialog]')
    for (const selector of selectors.split(',')) expect(specificityOf(selector)).toEqual([0, 2, 1])
  })

  it('keeps combinator branches that could start above the :is() anchor', () => {
    // A child combinator, or a prefix below body, would let the branch's left
    // side match an ancestor of the anchor in the original selector.
    expect(expand('body > :is([data-a] span, [data-b]) { color: red }')).toEqual(['body>:is([data-a] span,[data-b])'])
    expect(expand('body [data-col] :is([data-a] span, [data-b]) { color: red }')).toEqual(['body [data-col] :is([data-a] span,[data-b])'])
  })

  it('keeps combinator branches whose left side may be html or body', () => {
    expect(expand('body[data-dark] a { color: red } body[data-x] :is([data-dark] span, [data-b]) { color: blue }')[1])
      .toBe('body[data-x] :is([data-dark] span,[data-b])')
    expect(expand('body[data-x] :is(:where(body) > [role="presentation"], [data-b]) { color: blue }'))
      .toEqual(['body[data-x] :is(:where(body)>[role=presentation],[data-b])'])
    expect(expand('body[data-x] :is(.plugin-state span, [data-b]) { color: red }'))
      .toEqual(['body[data-x] :is(.plugin-state span,[data-b])'])
    expect(expand('body[data-x] :is([data-plugin-state] span, [data-b]) { color: red }'))
      .toEqual(['body[data-x] :is([data-plugin-state] span,[data-b])'])
  })

  it('expands combinator branches under an html/body anchor', () => {
    expect(expand('body[data-x] :is(div[data-goal] > div, [data-todo]) [data-h] { color: red }'))
      .toEqual(['body[data-x] div[data-goal]>div [data-h],body[data-x] [data-todo]:not(maid-specificity-pad):not(maid-specificity-pad) [data-h]'])
  })

  it('merges the surrounding compound into the branch tail', () => {
    expect(expand('body [data-y]:is(div[data-a] > b, div[data-c] > b):hover::before { color: red }'))
      .toEqual(['body div[data-a]>b[data-y]:hover:before,body div[data-c]>b[data-y]:hover:before'])
  })

  it('leaves :is() nested in :not() or :has() as written', () => {
    expect(expand('body [data-a]:not(:is([data-b], [data-c])) { color: red }')).toEqual(['body [data-a]:not(:is([data-b],[data-c]))'])
    expect(expand('body [data-a]:has(:is([data-b], [data-c])) { color: red }')).toEqual(['body [data-a]:has(:is([data-b],[data-c]))'])
  })

  it('expands nested lists within the budget', () => {
    expect(expand('html[data-f] body :is([data-a], [data-b]) :is(p, li) { color: red }')).toEqual([
      'html[data-f] body [data-a] p,html[data-f] body [data-a] li,html[data-f] body [data-b] p,html[data-f] body [data-b] li',
    ])
    const many = Array.from({ length: 20 }, (_, i) => `[data-k="${i}"]`).join(', ')
    expect(expand(`body :is(${many}) { color: red }`)[0]).toContain(':is(')
  })
})
