// Usage: node scripts/selector-delta.mjs <skin-repo> <host-src> <old-ref> <new-ref> <out.json>
//
// Host-upgrade smoke check. Collects every attribute value, attribute name,
// class fragment and icon path key the three packages select on (CSS and TS
// sources), then reports the ones the old host source contains and the new
// one no longer does ("lost"): each is a rule or icon mapping the upgrade
// silently disabled. Tokens absent from both hosts are third-party hooks or
// skin-authored drawings and are only written to the JSON.
//
// It cannot see structural changes (a wrapper or phase root that moved) and
// does not know fallbacks: an ORCA path key whose icon now ships as a
// `data-icon` symbol is still served by the name map and can be ignored.
// <host-src> is a clone of the official DSH repository with both refs.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const [repo, hostSrc, oldRef, newRef, out] = process.argv.slice(2)

function hostCorpus(ref) {
  const list = execFileSync('git', ['-C', hostSrc, 'ls-tree', '-r', '--name-only', ref, '--', 'packages'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\n')
    .filter(p => /\.(tsx?|css|mjs|js|json)$/.test(p) && !/\/(tests?|__tests__|fixtures)\//.test(p) && !/\.(spec|test)\./.test(p))
  const input = list.map(p => `${ref}:${p}`).join('\n') + '\n'
  return execFileSync('git', ['-C', hostSrc, 'cat-file', '--batch'], { input, maxBuffer: 1 << 30 }).toString('utf8')
}
const corpora = { old: hostCorpus(oldRef), new: hostCorpus(newRef) }

const SKIN_OWNED = /^(data-(maid|orca|skin|dsh-maid|dsh-orca|dsh-whale|whale|deep-whale)|aria-|role$|style$|id$|href$|type$|xmlns)/
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name.endsWith('.generated.ts')) continue
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (/\.(css|ts)$/.test(name)) acc.push(p)
  }
  return acc
}

const tokens = new Map()
function add(key, kind, needle, file, line) {
  if (!tokens.has(key)) tokens.set(key, { key, kind, needle, sites: [] })
  const t = tokens.get(key)
  if (t.sites.length < 6) t.sites.push(`${file}:${line}`)
}
const SELECTOR = /\[([a-zA-Z][\w-]*)\s*(?:([~|^$*]?=)\s*(?:'([^']*)'|"([^"]*)"|\\"([^"\\]*)\\"|([^\]\s'"]+)))?\s*\]/g
for (const pkg of ['maid-atelier', 'orca-link', 'skin-manager']) {
  for (const file of walk(join(repo, pkg, 'src'))) {
    const rel = relative(repo, file).split(sep).join('/')
    readFileSync(file, 'utf8').split(/\r?\n/).forEach((text, i) => {
      // Icon keys written as markup strings in TS (`'d="M8 4.5V10"'`).
      for (const m of text.matchAll(/\bd=\\?"(M[^"'\\]{6,})/g)) add(`d="${m[1]}`, 'value', m[1], rel, i + 1)
      for (const m of text.matchAll(SELECTOR)) {
        const [, attr, op, a, b, c, d] = m
        const value = a ?? b ?? c ?? d
        if (SKIN_OWNED.test(attr)) continue
        if (attr === 'class' && value) add(`class*=${value}`, 'class', value.replace(/^_/, ''), rel, i + 1)
        else if (value !== undefined && op) add(`${attr}${op}${value}`, 'value', value, rel, i + 1)
        else add(`[${attr}]`, 'attr', attr, rel, i + 1)
      }
    })
  }
}

const camel = s => s.replace(/^data-/, '').replace(/-(\w)/g, (_, ch) => ch.toUpperCase())
const has = (corpus, t) => t.kind === 'attr'
  ? corpus.includes(t.needle) || corpus.includes(camel(t.needle))
  : corpus.includes(t.needle)
const rows = [...tokens.values()].map(t => ({ ...t, old: has(corpora.old, t), new: has(corpora.new, t) }))
const lost = rows.filter(r => r.old && !r.new)
const never = rows.filter(r => !r.old && !r.new)
writeFileSync(out, JSON.stringify({ oldRef, newRef, total: rows.length, lost, never }, null, 1))
console.log(`tokens ${rows.length}; lost in ${newRef}: ${lost.length}; absent in both: ${never.length}`)
for (const r of lost) console.log(`LOST  ${r.key}  @ ${r.sites.slice(0, 3).join(', ')}`)
