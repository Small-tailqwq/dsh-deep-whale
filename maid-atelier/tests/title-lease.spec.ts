// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { claimDocumentTitle } from '../src/client/title-lease.ts'

const HOST_TITLE = 'DeepSeek Harness'
const SKIN_TITLE = '深海女仆工坊 · DeepSeek Harness'

/** Let the MutationObserver microtask queue drain. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('claimDocumentTitle', () => {
  beforeEach(() => {
    document.title = HOST_TITLE
  })

  afterEach(() => {
    document.title = HOST_TITLE
  })

  it('paints the skin title on claim', () => {
    const lease = claimDocumentTitle(document, SKIN_TITLE)
    expect(document.title).toBe(SKIN_TITLE)
    lease.dispose()
  })

  it('restores the skin title after the host rewrites it', async () => {
    const lease = claimDocumentTitle(document, SKIN_TITLE)
    document.title = 'Build the drawer — DeepSeek Harness'
    await settle()
    expect(document.title).toBe(SKIN_TITLE)
    lease.dispose()
  })

  it('survives repeated host writes', async () => {
    const lease = claimDocumentTitle(document, SKIN_TITLE)
    for (const next of ['one — DeepSeek Harness', 'two — DeepSeek Harness', HOST_TITLE]) {
      document.title = next
      await settle()
      expect(document.title).toBe(SKIN_TITLE)
    }
    lease.dispose()
  })

  it('gives the host title back on dispose', async () => {
    const lease = claimDocumentTitle(document, SKIN_TITLE)
    document.title = 'another session — DeepSeek Harness'
    await settle()
    lease.dispose()
    expect(document.title).toBe('another session — DeepSeek Harness')
  })

  it('leaves a title the user replaced alone after dispose', () => {
    const lease = claimDocumentTitle(document, SKIN_TITLE)
    document.title = 'something else'
    lease.dispose()
    expect(document.title).toBe('something else')
  })
})
