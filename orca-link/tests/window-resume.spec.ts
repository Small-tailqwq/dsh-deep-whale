// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { installOrcaWindowResume } from '../src/client/window-resume.ts'

function pointerMove(x: number, y: number): Event {
  const event = new Event('pointermove', { bubbles: true })
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: y },
  })
  return event
}

afterEach(() => {
  document.body.removeAttribute('data-orca-window-resuming')
})

describe('ORCA LINK WebApp window resume', () => {
  it('suppresses restored tooltips until fresh pointer movement or keyboard input', () => {
    const dispose = installOrcaWindowResume(document.body)
    document.dispatchEvent(pointerMove(40, 20))

    window.dispatchEvent(new Event('blur'))
    expect(document.body.hasAttribute('data-orca-window-resuming')).toBe(true)

    document.dispatchEvent(pointerMove(40, 20))
    expect(document.body.hasAttribute('data-orca-window-resuming')).toBe(true)

    document.dispatchEvent(pointerMove(43, 20))
    expect(document.body.hasAttribute('data-orca-window-resuming')).toBe(false)

    window.dispatchEvent(new Event('focus'))
    expect(document.body.hasAttribute('data-orca-window-resuming')).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.body.hasAttribute('data-orca-window-resuming')).toBe(false)

    dispose()
  })
})
