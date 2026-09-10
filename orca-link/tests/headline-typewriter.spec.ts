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

// 0.1.5-alpha.1 hero markup: the title text and the preview badge share one
// `.titleGroup` flex unit, and only the text span is the typewriter's target.
function mountHeadline(): HTMLElement {
  document.body.innerHTML = `
    <div data-phase="hero">
      <span class="titleGroup">
        <span>探索未至之境</span>
        <span class="previewBadge">预览</span>
      </span>
    </div>
  `
  return document.querySelector<HTMLElement>('.titleGroup > span:first-child')!
}

function badgeText(): string | null | undefined {
  return document.querySelector<HTMLElement>('.previewBadge')?.textContent
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
    // The badge is a sibling inside the shared title group: it must survive the
    // typewriter's writes and its dispose-time restore.
    expect(badgeText()).toBe('预览')

    await vi.advanceTimersByTimeAsync(19_500)
    expect(headline.textContent).toBe(FIRST_GROUP)
    await vi.advanceTimersByTimeAsync(300)
    expect(headline.textContent?.length).toBeLessThan(FIRST_GROUP.length)

    dispose()
    expect(headline.textContent).toBe('探索未至之境')
    expect(headline.hasAttribute('data-orca-headline-typewriter')).toBe(false)
    expect(badgeText()).toBe('预览')
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
