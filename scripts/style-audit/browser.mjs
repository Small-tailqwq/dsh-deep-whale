import { createRequire } from 'node:module'
import { join } from 'node:path'
import { repository } from './inventory.mjs'

const require = createRequire(join(repository, 'orca-link/package.json'))
export const { chromium } = require('playwright')

export async function matchFixtureDocuments(rows, snapshots, exports, progress) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const context = await browser.newContext()
    await context.route('**/*', route => route.abort())
    const page = await context.newPage()
    const classes = {}
    for (const map of Object.values(exports)) {
      for (const [local, compiled] of Object.entries(map)) {
        if (!(local in classes)) classes[local] = compiled
        else if (classes[local] !== compiled) classes[local] = null
      }
    }
    const unique = [...new Set(rows.map(row => row.query).filter(Boolean))]
    await page.evaluate(({ selectors, classes }) => {
      window.audit = { selectors, classes, result: {}, documents: 0 }
      for (const selector of selectors) {
        const result = window.audit.result[selector] = { witnesses: [], error: null }
        try { document.querySelector(selector) }
        catch (error) { result.error = error.message }
      }
    }, { selectors: unique, classes })
    for (let start = 0; start < snapshots.length; start += 20) {
      await page.evaluate(batch => {
        for (const snapshot of batch) {
          const doc = new DOMParser().parseFromString(snapshot.html, 'text/html')
          // Vite's test-time scoped names and the portable release names share
          // a reviewed local export; host hash fragments are left untouched.
          for (const element of doc.querySelectorAll('[class]')) {
            for (const name of [...element.classList]) {
              const local = /^_(.+)_[a-z0-9]+_\d+$/i.exec(name)?.[1]
              const canonical = local && window.audit.classes[local]
              if (canonical) { element.classList.remove(name); element.classList.add(canonical) }
            }
          }
          for (const selector of window.audit.selectors) {
            const result = window.audit.result[selector]
            if (result.error || result.witnesses.length >= 3) continue
            const targets = doc.querySelectorAll(selector)
            if (targets.length) result.witnesses.push({ id: snapshot.id, test: snapshot.test, file: snapshot.file, count: targets.length })
          }
          window.audit.documents++
        }
      }, snapshots.slice(start, start + 20))
      progress?.(Math.min(start + 20, snapshots.length), snapshots.length)
    }
    return await page.evaluate(() => ({ browser: navigator.userAgent, ...window.audit }))
  } finally { await browser.close() }
}

/** Evaluate real state, conditional rules and pseudo-elements in the serving page. */
export async function inspectPage(page, rows, activeFiles) {
  return page.evaluate(({ rows, activeFiles }) => rows.map(row => {
    const result = { id: row.id, count: 0, conditions: [], samples: [] }
    if (!row.query) return { ...result, status: 'dynamic' }
    if (row.kind === 'css' && !activeFiles.includes(row.file)) return { ...result, status: 'stylesheet-not-loaded' }
    for (const condition of row.conditions) {
      let active = null
      if (condition.name === 'media') active = matchMedia(condition.value).matches
      if (condition.name === 'supports') active = CSS.supports(condition.value)
      if (condition.name === 'container') active = null
      result.conditions.push({ ...condition, active })
    }
    if (result.conditions.some(condition => condition.active === false)) return { ...result, status: 'inactive-condition' }
    if (result.conditions.some(condition => condition.name === 'container')) return { ...result, status: 'container-needs-review' }
    try {
      const targets = document.querySelectorAll(row.query)
      result.count = targets.length
      for (const element of [...targets].slice(0, 3)) {
        const style = getComputedStyle(element, row.pseudo[0] ? `::${row.pseudo[0]}` : null)
        const rect = element.getBoundingClientRect()
        result.samples.push({ tag: element.tagName, owner: element.closest('[data-slot]')?.getAttribute('data-slot') ?? null,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          style: Object.fromEntries(['color', 'background-color', 'display', 'visibility', 'opacity', 'width', 'height', 'content', 'animation-name', 'pointer-events'].map(name => [name, style.getPropertyValue(name)])) })
      }
      return { ...result, status: targets.length ? row.kind === 'query' && row.receiver !== 'document' ? 'query-needs-scope' : 'runtime-hit' : 'not-exercised' }
    } catch (error) { return { ...result, status: 'unsupported', error: error.message } }
  }), { rows: rows.map(({ id, query, conditions, pseudo, file, kind, receiver }) => ({ id, query, conditions, pseudo, file, kind, receiver })), activeFiles })
}
