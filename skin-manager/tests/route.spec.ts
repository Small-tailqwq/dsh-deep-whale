import { describe, expect, it } from 'vitest'
import { skinManagerUrl } from '../src/client/route.ts'

describe('skin manager route', () => {
  it('stays under a reverse-proxy prefix', () => {
    expect(skinManagerUrl('https://example.com/dsh/')).toBe('https://example.com/dsh/api/dsh/skins')
  })

  it('keeps the root mount unchanged', () => {
    expect(skinManagerUrl('http://127.0.0.1:43120/')).toBe('http://127.0.0.1:43120/api/dsh/skins')
  })
})
