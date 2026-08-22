// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installOrcaHeadlineTypewriter } from '../src/client/headline-typewriter.ts'

const FIRST_GROUP = '如切如磋，如琢如磨'
const LINKED_FIRST = '不诱于誉，不恐于诽'
const LINKED_SECOND = '率道而行，端然正己'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function mountHeadline(): HTMLElement {
  document.body.innerHTML = `
    <div data-phase="hero">
      <span class="headlineText">探索未至之境</span>
    </div>
  `
  return document.querySelector<HTMLElement>('.headlineText')!
}

describe('Orca Link headline typewriter', () => {
  it('opens empty, types a group, holds it for 20 seconds, then deletes it', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const headline = mountHeadline()
    const dispose = installOrcaHeadlineTypewriter(document.body)

    expect(headline.textContent).toBe('')
    expect(headline.hasAttribute('data-orca-headline-typewriter')).toBe(true)

    await vi.advanceTimersByTimeAsync(1_500)
    expect(headline.textContent).toBe(FIRST_GROUP)

    await vi.advanceTimersByTimeAsync(19_500)
    expect(headline.textContent).toBe(FIRST_GROUP)
    await vi.advanceTimersByTimeAsync(300)
    expect(headline.textContent?.length).toBeLessThan(FIRST_GROUP.length)

    dispose()
    expect(headline.textContent).toBe('探索未至之境')
    expect(headline.hasAttribute('data-orca-headline-typewriter')).toBe(false)
  })

  it('keeps the linked pair together and displays it in two stages', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9)
    const headline = mountHeadline()
    const dispose = installOrcaHeadlineTypewriter(document.body)

    await vi.advanceTimersByTimeAsync(1_500)
    expect(headline.textContent).toBe(LINKED_FIRST)

    await vi.advanceTimersByTimeAsync(12_000)
    expect(headline.textContent).toBe(LINKED_SECOND)

    dispose()
  })

  it('keeps the original localized headline in the candidate rotation', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const headline = mountHeadline()
    const dispose = installOrcaHeadlineTypewriter(document.body)

    await vi.advanceTimersByTimeAsync(1_500)
    expect(headline.textContent).toBe('探索未至之境')

    dispose()
  })
})
