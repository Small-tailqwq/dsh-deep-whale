// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selector]) => selector.includes("[data-slot='conversation.chat.turnTail']"))
  .map(([, selector, body]) => `${selector}{${body}}`)
  .join('\n')

afterEach(() => {
  document.head.replaceChildren()
  document.body.replaceChildren()
  document.body.removeAttribute('data-dsh-maid-atelier')
  document.body.removeAttribute('data-ds-dark-theme')
})

describe('turn-tail reading surface', () => {
  it.each([false, true])('keeps delivered cards full width without trapping fixed overlays (dark=%s)', dark => {
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.toggleAttribute('data-ds-dark-theme', dark)
    const style = document.createElement('style')
    style.textContent = rules
    document.head.append(style)
    const slot = document.createElement('div')
    slot.dataset.slot = 'conversation.chat.turnTail'
    const delivery = document.createElement('div')
    delivery.style.containerType = 'inline-size'
    delivery.textContent = 'Delivered report'
    slot.append(delivery)
    document.body.append(slot)

    const surface = getComputedStyle(slot)
    expect(surface.display).toBe('flex')
    expect(surface.width).toBe('auto')
    expect(surface.maxWidth).toBe('100%')
    expect(surface.alignSelf).toBe('stretch')
    expect(surface.minWidth).toBe('0px')
    expect(surface.transform).toMatch(/^(?:none)?$/)
    expect(surface.backdropFilter).toMatch(/^(?:none)?$/)
  })
})
