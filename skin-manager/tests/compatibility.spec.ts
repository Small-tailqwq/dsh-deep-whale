/**
 * DSH 0.1.7 disables a plugin whose `@deepseek-ai/dsh*` peer ranges exclude
 * the running version, in memory only. These specs pin the manager's mirror of
 * that decision and the one path that overrides it: an explicit, exact-version
 * grant through the host, never a silent one.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { evaluateSkinCompatibility, readProfileExemptions } from '../src/compatibility.ts'
import type { SkinCatalogEntry, SkinCompatibility } from '../src/contract.ts'
import { discoverInstalledSkins, makeSkinManagerRoute } from '../src/index.ts'

const skin = (peers: Record<string, unknown>): unknown => ({
  name: '@test/skin', version: '1.2.3', peerDependencies: { '@deepseek-ai/cordis': '^4.0.1', ...peers },
})

describe('host admission mirror', () => {
  it('ignores packages without dsh peers', () => {
    expect(evaluateSkinCompatibility(skin({}), '0.1.8', {})).toBeUndefined()
    expect(evaluateSkinCompatibility({ name: 'x', version: '1.0.0' }, '0.1.8', {})).toBeUndefined()
  })

  it('reports only the dsh peers the runtime fails', () => {
    const manifest = skin({ '@deepseek-ai/dsh': '>=0.1.7-rc.1 <0.1.8-0', '@deepseek-ai/dsh-web-app': '>=0.1.0' })
    expect(evaluateSkinCompatibility(manifest, '0.1.7-rc.1', {})).toBeUndefined()
    expect(evaluateSkinCompatibility(manifest, '0.1.7', {})).toBeUndefined()
    expect(evaluateSkinCompatibility(manifest, '0.1.8-alpha.1', {})).toEqual({
      package: '@test/skin@1.2.3', runtimeVersion: '0.1.8-alpha.1', peers: { '@deepseek-ai/dsh': '>=0.1.7-rc.1 <0.1.8-0' }, exempted: false,
    })
  })

  it('treats workspace ranges as the runtime and empty ranges as incompatible, like the host', () => {
    expect(evaluateSkinCompatibility(skin({ '@deepseek-ai/dsh-agent': 'workspace:*' }), '0.2.0', {})).toBeUndefined()
    expect(evaluateSkinCompatibility(skin({ '@deepseek-ai/dsh': ' ' }), '0.2.0', {})?.peers).toEqual({ '@deepseek-ai/dsh': ' ' })
  })

  it('honours only an exact package and runtime grant', () => {
    const manifest = skin({ '@deepseek-ai/dsh': '<0.1.8-0' })
    expect(evaluateSkinCompatibility(manifest, '0.1.8', { '@test/skin@1.2.3': ['0.1.8'] })?.exempted).toBe(true)
    expect(evaluateSkinCompatibility(manifest, '0.1.8', { '@test/skin@1.2.3': ['0.1.9'] })?.exempted).toBe(false)
    expect(evaluateSkinCompatibility(manifest, '0.1.8', { '@test/skin@1.2.4': ['0.1.8'] })?.exempted).toBe(false)
  })

  it('reads a damaged grant file as granting nothing', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-grants-'))
    try {
      expect(readProfileExemptions(directory)).toEqual({})
      writeFileSync(join(directory, 'compatibility.json'), '{ not json')
      expect(readProfileExemptions(directory)).toEqual({})
      writeFileSync(join(directory, 'compatibility.json'), JSON.stringify({ '@test/skin@1.2.3': ['0.1.8'], bad: 'x' }))
      expect(readProfileExemptions(directory)).toEqual({ '@test/skin@1.2.3': ['0.1.8'] })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('marks a discovered skin the running version refuses', () => {
    const directory = mkdtempSync(join(tmpdir(), 'dsh-skin-compat-'))
    const patch = join(directory, 'cordis.patch.yml')
    const packageDir = join(directory, 'node_modules', '@test', 'skin')
    try {
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ dependencies: { '@test/skin': 'link:x' } }))
      writeFileSync(join(packageDir, 'package.json'), JSON.stringify(skin({ '@deepseek-ai/dsh': '>=0.1.7-rc.1 <0.1.8-0' })))
      writeFileSync(join(packageDir, 'skin.json'), JSON.stringify({
        id: 'test-skin', name: 'Test', package: '@test/skin', bodyAttr: 'data-test', wiring: { id: 'ui-skin-test' },
      }))
      expect(discoverInstalledSkins(patch, '0.1.7-rc.1')[0]?.compatibility).toBeUndefined()
      expect(discoverInstalledSkins(patch, '0.1.8')[0]?.compatibility?.exempted).toBe(false)
      writeFileSync(join(dirname(patch), 'compatibility.json'), JSON.stringify({ '@test/skin@1.2.3': ['0.1.8'] }))
      expect(discoverInstalledSkins(patch, '0.1.8')[0]?.compatibility?.exempted).toBe(true)
      // An unknown runtime makes no claim either way.
      expect(discoverInstalledSkins(patch, undefined)[0]?.compatibility).toBeUndefined()
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

const blocked: SkinCompatibility = { package: '@test/skin@1.2.3', runtimeVersion: '0.1.8', peers: { '@deepseek-ai/dsh': '<0.1.8-0' }, exempted: false }
const catalog: SkinCatalogEntry[] = [
  { id: 'test-skin', name: 'Test', package: '@test/skin', wiringId: 'ui-skin-test', bodyAttr: 'data-test', order: 1, compatibility: blocked },
]

async function post(route: ReturnType<typeof makeSkinManagerRoute>, body: unknown): Promise<{ status: number, body: Record<string, unknown> }> {
  const req = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: 'POST', headers: { host: 'localhost' }, url: '/api/dsh/skins',
  }) as unknown as IncomingMessage
  let status = 0
  let text = ''
  const res = {
    writeHead(code: number) { status = code; return this },
    end(chunk?: string) { text = chunk ?? '' },
  } as unknown as ServerResponse
  await route.handler(req, res)
  return { status, body: JSON.parse(text) as Record<string, unknown> }
}

describe('switching to a refused skin', () => {
  it('asks for consent instead of writing a patch the host would ignore', async () => {
    const apply = vi.fn()
    const grant = vi.fn(async () => {})
    const route = makeSkinManagerRoute(() => catalog, apply, () => new Map(), grant)
    const answer = await post(route, { target: 'test-skin' })
    expect(answer).toEqual({ status: 409, body: { ok: false, error: 'incompatible-version', compatibility: blocked } })
    expect(grant).not.toHaveBeenCalled()
    expect(apply).not.toHaveBeenCalled()
  })

  it('grants the exact pair through the host, then switches', async () => {
    const order: string[] = []
    const route = makeSkinManagerRoute(
      () => catalog,
      () => { order.push('switch') },
      () => new Map(),
      async (compatibility) => { order.push(`grant ${compatibility.package} ${compatibility.runtimeVersion}`) },
    )
    const answer = await post(route, { target: 'test-skin', acceptRisk: true })
    expect(answer).toEqual({ status: 200, body: { ok: true, target: 'test-skin' } })
    expect(order).toEqual(['grant @test/skin@1.2.3 0.1.8', 'switch'])
  })

  it('leaves the patch untouched when the host refuses the grant', async () => {
    const apply = vi.fn()
    const route = makeSkinManagerRoute(() => catalog, apply, () => new Map(), async () => { throw new Error('exemption-unavailable') })
    const answer = await post(route, { target: 'test-skin', acceptRisk: true })
    expect(answer).toEqual({ status: 400, body: { ok: false, error: 'exemption-unavailable' } })
    expect(apply).not.toHaveBeenCalled()
  })

  it('switches an already allowed skin without another grant', async () => {
    const grant = vi.fn(async () => {})
    const apply = vi.fn()
    const allowed = [{ ...catalog[0]!, compatibility: { ...blocked, exempted: true } }]
    const route = makeSkinManagerRoute(() => allowed, apply, () => new Map(), grant)
    expect((await post(route, { target: 'test-skin' })).status).toBe(200)
    expect(grant).not.toHaveBeenCalled()
    expect(apply).toHaveBeenCalledOnce()
  })
})
