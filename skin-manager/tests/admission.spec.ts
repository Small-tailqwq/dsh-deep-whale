import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { makeSkinManagerRoute, inject } from '../src/index.ts'

describe('skin manager admission', () => {
  it.each([undefined, () => 401, () => 403, () => { throw new Error('unavailable') }])('rejects before reading body or changing skin', async admission => {
    const apply = vi.fn()
    const req = Object.assign(Readable.from([Buffer.from('{"target":"official"}')]), {
      method: 'POST', headers: { host: 'example.test' },
    }) as unknown as IncomingMessage
    const response = { writeHead: vi.fn(), end: vi.fn() }
    const route = makeSkinManagerRoute(() => [], apply, undefined, undefined, undefined, admission)
    await route.handler(req, response as unknown as ServerResponse)
    expect(apply).not.toHaveBeenCalled()
    expect(response.writeHead.mock.calls[0]?.[0]).toEqual(admission === undefined ? 503 : expect.any(Number))
    expect(req.readableEnded).not.toBe(true)
  })

  it('preserves an admitted owner switch and requires connection injection', async () => {
    expect(inject).toContain('connection')
    const apply = vi.fn()
    const route = makeSkinManagerRoute(() => [], apply, undefined, undefined, undefined, () => undefined)
    const req = Object.assign(Readable.from([Buffer.from('{"target":"official"}')]), {
      method: 'POST', headers: { host: 'example.test' },
    }) as unknown as IncomingMessage
    const response = { writeHead: vi.fn(), end: vi.fn() }
    await route.handler(req, response as unknown as ServerResponse)
    expect(response.writeHead.mock.calls[0]?.[0]).toBe(200)
    expect(apply).toHaveBeenCalledOnce()
  })
})
