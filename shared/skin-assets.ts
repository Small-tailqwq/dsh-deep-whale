import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'

interface AssetServer {
  register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }): () => void
}

/** Public, immutable artwork only. Paths come from the shipped allowlist, never from disk traversal. */
export function installSkinAssets(ctx: Context, id: string, directory: URL, files: readonly string[]): void {
  const prefix = `/skin-assets/${id}`
  const allowed = new Set(files)
  ctx.inject(['webServer'], webCtx => {
    const server = webCtx.get('webServer') as AssetServer
    webCtx.effect(() => server.register({ kind: 'prefix', path: prefix, handler: async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end()
        return
      }
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
      const file = pathname.slice(prefix.length + 1)
      if (!pathname.startsWith(`${prefix}/`) || !allowed.has(file) || !/^[a-f0-9]{64}\.(png|webp)$/.test(file)) {
        res.writeHead(404).end()
        return
      }
      let bytes: Buffer
      try {
        bytes = await readFile(new URL(file, directory))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        res.writeHead(404).end()
        return
      }
      const etag = `"${file.split('.')[0]}"`
      const headers = {
        'Content-Type': file.endsWith('.webp') ? 'image/webp' : 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ETag: etag,
      }
      if (req.headers['if-none-match']?.split(',').some(value => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')) {
        res.writeHead(304, headers).end()
        return
      }
      res.writeHead(200, { ...headers, 'Content-Length': bytes.length })
      res.end(req.method === 'HEAD' ? undefined : bytes)
    } }), `${id}: packaged artwork`)
  })
}
