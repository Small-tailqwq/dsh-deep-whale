import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gzipSync, gunzipSync } from 'node:zlib'

export function isQueryAtSite(call, site) {
  const caller = call.stack.split('\n', 1)[0]?.replaceAll('\\', '/') ?? ''
  return call.method === site.method && caller.includes(`${site.file.replaceAll('\\', '/')}:${site.line}:`)
}

export function readCurrentRecords(directory, runId, knownFiles, repository) {
  return readdirSync(directory).filter(name => name.endsWith('.json.gz'))
    .map(name => JSON.parse(gunzipSync(readFileSync(join(directory, name)))))
    .filter(record => record.runId === runId && knownFiles.has(relative(repository, record.testFile).replaceAll('\\', '/')))
}

/** Optional Vitest instrumentation; never installed during ordinary tests. */
export function recordFixtures({ afterAll, state }) {
  const output = process.env.DSH_STYLE_AUDIT_FIXTURES
  if (!output || typeof document === 'undefined') return
  const runId = process.env.DSH_STYLE_AUDIT_RUN
  if (!runId) throw new Error('Fixture recording requires a run identity')
  const snapshots = new Map(), queries = new Map(), restore = []
  let recording = false
  const hash = text => createHash('sha256').update(text).digest('hex')
  function capture(doc, phase) {
    if (recording || !doc?.documentElement || !doc.body?.children.length) return
    recording = true
    try {
      const current = state()
      const html = doc.documentElement.cloneNode(false).outerHTML.replace('</html>', `${doc.body.outerHTML}</html>`)
      const key = hash(html)
      if (!snapshots.has(key)) snapshots.set(key, { id: key, html, test: current.currentTestName ?? '(setup)', phase })
    } finally { recording = false }
  }
  const inner = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
  Object.defineProperty(Element.prototype, 'innerHTML', {
    ...inner,
    set(value) {
      capture(this.ownerDocument, 'before-innerHTML')
      inner.set.call(this, value)
      capture(this.ownerDocument, 'after-innerHTML')
    },
  })
  restore.push(() => Object.defineProperty(Element.prototype, 'innerHTML', inner))
  for (const method of ['setAttribute', 'removeAttribute', 'toggleAttribute', 'remove']) {
    const original = Element.prototype[method]
    Element.prototype[method] = function (...args) {
      const relevant = this.tagName === 'BODY' || this.tagName === 'HTML' || method === 'remove' && this.hasAttribute('data-skin-chrome')
      if (relevant) capture(this.ownerDocument, `before-${method}`)
      const result = original.apply(this, args)
      if (relevant) capture(this.ownerDocument, `after-${method}`)
      return result
    }
    restore.push(() => { Element.prototype[method] = original })
  }
  for (const prototype of [Document.prototype, Element.prototype, DocumentFragment.prototype]) {
    for (const method of ['querySelector', 'querySelectorAll', 'matches', 'closest', 'getElementById', 'getElementsByClassName', 'getElementsByTagName']) {
      if (!Object.hasOwn(prototype, method)) continue
      const original = prototype[method]
      prototype[method] = function (selector, ...args) {
        const result = original.call(this, selector, ...args)
        if (!recording && typeof selector === 'string') {
          const current = state()
          const stack = new Error().stack.split('\n').filter(line => /(?:src[\\/]client|shared[\\/]|tests[\\/])/.test(line)).slice(0, 4).join('\n')
          const key = `${method}\0${selector}\0${current.currentTestName}\0${stack}`
          let entry = queries.get(key)
          if (!entry) {
            entry = { method, selector, test: current.currentTestName ?? '(setup)', stack, calls: 0, positive: 0, maxMatches: 0 }
            queries.set(key, entry)
          }
          const count = typeof result === 'boolean' ? Number(result) : method === 'querySelectorAll' || method.startsWith('getElementsBy') ? result.length : Number(result !== null)
          entry.calls++
          entry.positive += Number(count > 0)
          entry.maxMatches = Math.max(entry.maxMatches, count)
        }
        return result
      }
      restore.push(() => { prototype[method] = original })
    }
  }
  afterAll(() => {
    capture(document, 'afterAll')
    restore.reverse().forEach(dispose => dispose())
    const testFile = state().testPath
    if (!testFile) throw new Error('Fixture recorder has no test file identity')
    mkdirSync(output, { recursive: true })
    const payload = { schema: 1, runId, testFile, snapshots: [...snapshots.values()], queries: [...queries.values()] }
    writeFileSync(join(output, `${hash(testFile)}.json.gz`), gzipSync(JSON.stringify(payload)))
  })
}
