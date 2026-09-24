import { Context } from '@deepseek-ai/cordis'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { once } from 'node:events'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { installSkinAssets } from '../../shared/skin-assets.ts'
import { hashSkinAssets } from '../../scripts/skin-asset-inputs.mjs'

describe('packaged skin artwork', () => {
  for (const id of ['maid-atelier', 'orca-link']) {
    it(`${id}: serves exact packaged bytes and releases the route`, async () => {
      const directory = new URL(`../../${id}/assets/runtime/`, import.meta.url)
      const files: string[] = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'))
      let route: { handler(req: IncomingMessage, res: ServerResponse): Promise<void> } | undefined
      const ctx = new Context()
      ctx.provide('webServer')
      ctx.set('webServer', { register(value: typeof route) { route = value; return () => { route = undefined } } })
      const fiber = ctx.plugin((child: Context) => installSkinAssets(child, id, directory, files))
      await fiber.ready
      const server = createServer((req, res) => {
        if (!route) { res.writeHead(404).end(); return }
        void route.handler(req, res).catch(() => { res.writeHead(500).end() })
      })
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      const address = server.address() as { port: number }
      const base = `http://127.0.0.1:${address.port}/skin-assets/${id}/`
      try {
        for (const file of files) {
          const response = await fetch(base + file)
          expect(response.status).toBe(200)
          expect(response.headers.get('content-type')).toBe(file.endsWith('.png') ? 'image/png' : 'image/webp')
          expect(response.headers.get('cache-control')).toContain('immutable')
          const bytes = Buffer.from(await response.arrayBuffer())
          expect(bytes.equals(readFileSync(new URL(file, directory)))).toBe(true)
          expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.split('.')[0])
        }
        const head = await fetch(base + files[0], { method: 'HEAD' })
        expect(head.status).toBe(200)
        expect(await head.text()).toBe('')
        expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0)
        expect((await fetch(base + files[0], { headers: { 'If-None-Match': head.headers.get('etag')! } })).status).toBe(304)
        expect((await fetch(base + files[0], { method: 'POST' })).status).toBe(405)
        for (const bad of ['missing.webp', '%2e%2e%2fpackage.json', 'manifest.json', `${files[0]}/extra`]) {
          expect((await fetch(base + bad)).status).toBe(404)
        }
        await fiber.dispose()
        expect(route).toBeUndefined()
        expect((await fetch(base + files[0])).status).toBe(404)
      } finally {
        await fiber.dispose()
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
      }
    })
  }

  it('detects missing or changed image bytes without changing legacy fingerprints', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-skin-assets-'))
    const digest = () => { const hash = createHash('sha256'); hashSkinAssets(hash, root); return hash.digest('hex') }
    try {
      expect(digest()).toBe(createHash('sha256').digest('hex'))
      mkdirSync(join(root, 'assets/runtime'), { recursive: true })
      const bytes = Buffer.from('fixture')
      const file = `${createHash('sha256').update(bytes).digest('hex')}.png`
      writeFileSync(join(root, 'assets/runtime/manifest.json'), JSON.stringify([file]))
      expect(digest).toThrow()
      writeFileSync(join(root, 'assets/runtime', file), bytes)
      expect(digest()).not.toBe(createHash('sha256').digest('hex'))
      writeFileSync(join(root, 'assets/runtime', file), 'changed')
      expect(digest).toThrow('content hash mismatch')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
})
