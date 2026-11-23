import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { makeSkinManagerRoute, inject } from '../src/index.ts'

describe('skin manager admission', () => {
  it.each([undefined, { principal: { kind: 'remote' } }])('rejects a request without an owner before reading body or catalog', async peer => {
    const apply = vi.fn()
    const catalog = vi.fn(() => [])
    const req = Object.assign(Readable.from([Buffer.from('{"target":"official"}')]), {
      method: 'POST', headers: { host: 'example.test' },
    }) as unknown as IncomingMessage
    const response = { writeHead: vi.fn(), end: vi.fn() }
    const route = makeSkinManagerRoute(catalog, apply)
    await route.handler(req, response as unknown as ServerResponse, peer)
    expect(apply).not.toHaveBeenCalled()
    expect(catalog).not.toHaveBeenCalled()
    expect(response.writeHead.mock.calls[0]?.[0]).toBe(403)
    expect(JSON.parse(response.end.mock.calls[0]![0])).toEqual({ ok: false, error: 'access-denied' })
    expect(req.readableEnded).not.toBe(true)
  })

  it('requires host authentication and preserves an admitted owner switch', async () => {
    expect(inject).toContain('webServer')
    const apply = vi.fn()
    const route = makeSkinManagerRoute(() => [], apply)
    expect(route.auth).toBe('required')
    const req = Object.assign(Readable.from([Buffer.from('{"target":"official"}')]), {
      method: 'POST', headers: { host: 'example.test' },
    }) as unknown as IncomingMessage
    const response = { writeHead: vi.fn(), end: vi.fn() }
    await route.handler(req, response as unknown as ServerResponse, { principal: { kind: 'owner' } })
    expect(response.writeHead.mock.calls[0]?.[0]).toBe(200)
    expect(apply).toHaveBeenCalledOnce()
  })
})
