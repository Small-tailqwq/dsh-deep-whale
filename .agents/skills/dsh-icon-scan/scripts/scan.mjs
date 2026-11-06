import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, posix, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

const { values } = parseArgs({ options: {
  repo: { type: 'string', default: '.' }, source: { type: 'string' }, ref: { type: 'string' },
  base: { type: 'string' }, output: { type: 'string' },
} })
if (!values.source) throw new Error('Use --source <official-dsh-checkout> [--repo <skin-repo>] [--ref <target>] [--base <baseline>] [--output <report.json>]')
const repo = resolve(values.repo)
const source = resolve(values.source)
const skin = resolve(repo, 'orca-link')
const require = createRequire(resolve(skin, 'package.json'))
const ts = require('typescript')
const { JSDOM } = require('jsdom')
const { transform } = require('lightningcss')
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }).trimEnd()
const fixture = JSON.parse(readFileSync(resolve(skin, 'tests/fixtures/dsh-icons.json'), 'utf8'))
const targetCommit = git('rev-parse', '--verify', `${values.ref ?? fixture.hostCommit}^{commit}`)
const baseCommit = git('rev-parse', '--verify', `${values.base ?? fixture.hostCommit}^{commit}`)
const hash = text => createHash('sha256').update(text).digest('hex')
const roots = /^packages\/(client|extensions|experimental)\/[^/]+\/src\/.*\.(tsx?|css)$/

function snapshot(commit) {
  const paths = git('ls-tree', '-r', '--name-only', commit).split('\n').filter(path => roots.test(path))
  const bytes = execFileSync('git', ['-C', source, 'cat-file', '--batch'], {
    input: paths.map(path => `${commit}:${path}\n`).join(''), maxBuffer: 128 * 1024 * 1024,
  })
  let offset = 0
  return new Map(paths.map(path => {
    const newline = bytes.indexOf(10, offset)
    const [blob, type, length] = bytes.subarray(offset, newline).toString().split(' ')
    if (type !== 'blob') throw new Error(`Cannot read ${commit}:${path}`)
    offset = newline + 1
    const text = bytes.subarray(offset, offset + Number(length)).toString()
    offset += Number(length) + 1
    return [path, { path, blob, text }]
  }))
}

function inventory(files) {
  const modules = new Map([...files].filter(([path]) => /\.tsx?$/.test(path)).map(([path, item]) => [path, {
    ...item, ast: ts.createSourceFile(path, item.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), constants: new Map(), imports: new Map(), css: new Map(),
  }]))
  for (const mod of modules.values()) {
    for (const node of mod.ast.statements) {
      if (ts.isVariableStatement(node)) for (const decl of node.declarationList.declarations) if (ts.isIdentifier(decl.name)) mod.constants.set(decl.name.text, decl.initializer)
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue
      const specifier = node.moduleSpecifier.text
      if (specifier.endsWith('.css') && node.importClause?.name) mod.css.set(node.importClause.name.text, posix.normalize(posix.join(posix.dirname(mod.path), specifier)))
      const bindings = node.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) mod.imports.set(binding.name.text, { specifier, name: binding.propertyName?.text ?? binding.name.text })
    }
  }
  function literal(node, mod, seen = new Set()) {
    if (!node) return undefined
    if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return `-${node.operand.text}`
    if (!ts.isIdentifier(node)) return undefined
    const key = `${mod.path}:${node.text}`
    if (seen.has(key)) return undefined
    seen.add(key)
    if (mod.constants.has(node.text)) return literal(mod.constants.get(node.text), mod, seen)
    const imported = mod.imports.get(node.text)
    if (imported?.specifier.startsWith('.')) {
      const path = posix.normalize(posix.join(posix.dirname(mod.path), imported.specifier))
      const owner = modules.get(path) ?? modules.get(`${path}.tsx`)
      if (owner) return literal(owner.constants.get(imported.name), owner, seen)
    }
    return undefined
  }
  const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  function serialize(node, mod, unknown) {
    if (ts.isJsxText(node)) return node.text.trim() ? escape(node.text) : ''
    if (ts.isJsxExpression(node)) {
      if (!node.expression) return ''
      if (ts.isJsxElement(node.expression) || ts.isJsxSelfClosingElement(node.expression)) return serialize(node.expression, mod, unknown)
      unknown.push(`children: ${node.expression.getText(mod.ast).slice(0, 100)}`)
      return ''
    }
    const opening = ts.isJsxElement(node) ? node.openingElement : node
    const tag = opening.tagName.getText(mod.ast)
    if (!/^(svg|g|path|rect|circle|ellipse|line|polyline|polygon|defs|clipPath|mask|use|title|desc)$/.test(tag)) {
      unknown.push(`component: ${tag}`)
      return ''
    }
    const attributes = []
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr)) { unknown.push('spread attributes'); continue }
      const name = attr.name.getText(mod.ast)
      if (/^(className|ref|strokeWidth|style|on[A-Z].*)$/.test(name) || tag === 'svg' && /^(width|height)$/.test(name)) continue
      const value = attr.initializer === undefined ? '' : ts.isJsxExpression(attr.initializer) ? literal(attr.initializer.expression, mod) : literal(attr.initializer, mod)
      if (value === undefined) { unknown.push(`attribute: ${name}`); continue }
      const htmlName = name === 'viewBox' ? name : name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      attributes.push(`${htmlName}="${escape(value)}"`)
    }
    return `<${tag} ${attributes.join(' ')}>${ts.isJsxElement(node) ? node.children.map(child => serialize(child, mod, unknown)).join('') : ''}</${tag}>`
  }
  function references(node, mod) {
    const found = []
    const visit = child => {
      if (ts.isPropertyAccessExpression(child) && ts.isIdentifier(child.expression) && mod.css.has(child.expression.text)) found.push(`${mod.css.get(child.expression.text)}#${child.name.text}`)
      ts.forEachChild(child, visit)
    }
    visit(node)
    return [...new Set(found)]
  }
  const svgs = [], uses = []
  for (const mod of modules.values()) {
    const counts = new Map()
    function visit(node, owner = 'module') {
      if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) && node.name) owner = node.name.getText(mod.ast)
      if (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) owner = node.name.getText(mod.ast)
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node
        const tag = opening.tagName.getText(mod.ast)
        if (tag === 'svg') {
          const index = (counts.get(owner) ?? 0) + 1
          counts.set(owner, index)
          const unknown = []
          const svg = serialize(node, mod, unknown)
          svgs.push({ id: `${mod.path}#${owner}:svg${index}`, path: mod.path, line: mod.ast.getLineAndCharacterOfPosition(node.getStart(mod.ast)).line + 1, owner, blob: mod.blob, signature: hash(node.getText(mod.ast) + svg), svg, unknown: [...new Set(unknown)], css: references(node, mod) })
        } else if (/^(Icon|StateDot)/.test(mod.imports.get(tag)?.name ?? tag)) {
          uses.push({ component: mod.imports.get(tag)?.name ?? tag, css: references(opening, mod), path: mod.path })
        }
      }
      ts.forEachChild(node, child => visit(child, owner))
    }
    visit(mod.ast)
  }
  const animations = [], parseErrors = []
  for (const file of files.values()) {
    if (!file.path.endsWith('.css')) continue
    try {
      transform({ filename: file.path, code: Buffer.from(file.text), visitor: { Rule(rule) {
        if (rule.type !== 'style') return
        const classes = rule.value.selectors.flat().filter(part => part.type === 'class').map(part => part.name)
        const declarations = [...rule.value.declarations.declarations, ...rule.value.declarations.importantDeclarations]
        const motion = declarations.filter(item => item.property === 'animation' || item.property === 'animation-name')
        if (!motion.length) return
        const names = motion.flatMap(item => item.value.map(value => value.name?.type === 'none' || value.type === 'none' ? null : value.name?.value ?? value.value ?? null)).filter(Boolean)
        if (!names.length) return
        if (!/spin|load|rotat|dash|shimmer|skeleton|pulse/i.test([...classes, ...names].join(' '))) return
        animations.push({ id: `${file.path}#${classes.join(',')}:${names.join(',')}`, path: file.path, line: rule.value.loc.line + 1, blob: file.blob, classes, names, signature: hash(JSON.stringify({ selectors: rule.value.selectors, declarations })) })
      } } })
    } catch (error) { parseErrors.push({ path: file.path, error: error.message }) }
  }
  return { svgs, uses, animations, parseErrors }
}

const targetFiles = snapshot(targetCommit)
const target = inventory(targetFiles)
const baseFiles = baseCommit === targetCommit ? targetFiles : snapshot(baseCommit)
const base = baseCommit === targetCommit ? target : inventory(baseFiles)
const { renderHostIcons } = await import(pathToFileURL(resolve(skin, 'scripts/render-host-icons.mjs')))
let exported, exportError
try { exported = renderHostIcons(source, targetCommit) } catch (error) { exportError = error.message }
let baseExported, baseExportError
try { baseExported = baseCommit === targetCommit ? exported : renderHostIcons(source, baseCommit) } catch (error) { baseExportError = error.message }
const beforeExports = new Map((baseExported?.icons ?? []).map(icon => [icon.component, icon]))
const expected = new Map(fixture.icons.map(icon => [icon.component, icon]))
const expectedSymbols = new Map(fixture.icons.filter(icon => icon.symbolId).map(icon => [icon.symbolId, icon.name]))
const dom = new JSDOM('<!doctype html><body></body>')
for (const key of ['document', 'Element', 'HTMLElement', 'SVGElement', 'SVGGElement', 'MutationObserver']) globalThis[key] = dom.window[key]
const { installOrcaIcons } = await import(pathToFileURL(resolve(skin, 'src/client/icons.ts')))
const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
sprite.setAttribute('data-dsh-icon-sprite', '')
for (const [id, markup] of Object.entries(exported?.symbols ?? {})) {
  const root = new dom.window.DOMParser().parseFromString(markup, 'image/svg+xml').documentElement
  const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
  for (const { name, value } of root.attributes) if (!['width', 'height', 'xmlns', 'class', 'aria-hidden'].includes(name)) symbol.setAttribute(name, value)
  symbol.id = id
  symbol.innerHTML = root.innerHTML
  sprite.append(symbol)
}
const originalSprite = sprite.outerHTML
const drawn = [
  ...(exported?.icons ?? []).map(icon => ({ ...icon, id: `export:${icon.component}`, kind: 'export', expected: expected.get(icon.component)?.name ?? null })),
  ...Object.entries(exported?.symbols ?? {}).map(([symbolId, artwork]) => ({ id: `symbol:${symbolId}`, kind: 'symbol', symbolId, artwork, expected: expectedSymbols.get(symbolId) ?? null, svg: `<svg data-icon="${symbolId}"><use href="#${symbolId}"></use></svg>` })),
  ...(fixture.loaders ?? []).map(loader => ({ ...loader, id: `html-loader:${loader.component}`, kind: 'html-loader', expected: loader.name })),
  ...target.svgs.map(item => ({ ...item, kind: 'inline' })),
]
document.body.innerHTML = drawn.map((item, index) => `<div data-scan-index="${index}">${item.svg ?? item.html}</div>`).join('')
document.body.prepend(sprite)
const originalBody = document.body.innerHTML
const dispose = installOrcaIcons(document.body)
for (const [index, item] of drawn.entries()) {
  const svg = document.querySelector(`[data-scan-index="${index}"] ${item.kind === 'html-loader' ? 'svg[data-orca-link-loader-art]' : '> svg'}`)
  item.matched = svg?.getAttribute('data-orca-link-icon') ?? null
  const art = svg?.querySelector('[data-orca-link-icon-art]')
  item.status = item.matched === null ? 'unmatched' : !art?.querySelector('path,rect,line,circle,polygon,polyline') ? 'empty-art' : item.expected && item.expected !== item.matched ? 'wrong-match' : 'matched'
  if (item.unknown?.length) item.status = 'needs-review'
  if (['export', 'symbol'].includes(item.kind) && item.expected === null && item.status === 'matched') item.status = 'needs-review'
  if (item.kind === 'html-loader') {
    if (Object.entries(item.sources).some(([path, blob]) => targetFiles.get(path)?.blob !== blob)) item.status = 'needs-review'
    item.change = Object.keys(item.sources).some(path => baseFiles.get(path)?.blob !== targetFiles.get(path)?.blob) ? 'changed' : 'unchanged'
  } else if (item.kind === 'symbol') {
    const before = baseExported?.symbols?.[item.symbolId]
    item.change = !before ? 'added' : before === item.artwork ? 'unchanged' : 'changed'
  } else {
    const before = item.kind === 'export' ? beforeExports.get(item.component) : base.svgs.find(old => old.id === item.id)
    item.change = item.kind === 'export' && !baseExported ? 'unknown-baseline' : !before ? 'added' : item.kind === 'export' ? before.svg === item.svg ? 'unchanged' : 'changed' : before.signature === item.signature ? 'unchanged' : 'changed'
  }
}
const sharedSpriteUnchanged = sprite.outerHTML === originalSprite
dispose()
const cleanupRestoresOriginal = document.body.innerHTML === originalBody
for (const item of drawn.filter(item => item.kind === 'inline' && item.unknown.length)) {
  const variants = drawn.filter(icon => icon.kind === 'export' && icon.site === item.id)
  if (fixture.sources[item.path] === item.blob && variants.length && variants.every(icon => icon.status === 'matched')) {
    item.status = 'matched-via-fixture'
    item.coveredBy = variants.map(icon => icon.component)
  }
}
const classCoverage = new Map()
for (const item of drawn.filter(item => item.kind === 'inline')) for (const key of item.css) if (item.status === 'matched') classCoverage.set(key, item.id)
for (const item of drawn.filter(item => item.kind === 'html-loader' && item.status === 'matched')) for (const key of item.css) classCoverage.set(key, item.component)
const exportsByName = new Map(drawn.filter(item => item.kind === 'export').map(item => [item.component, item]))
for (const use of target.uses) {
  const icon = exportsByName.get(use.component === 'StateDot' ? 'StateDotOngoing' : use.component)
  if (icon?.status === 'matched') for (const key of use.css) classCoverage.set(key, use.component)
}
for (const item of target.animations) {
  item.coveredBy = item.classes.map(name => classCoverage.get(`${item.path}#${name}`)).filter(Boolean)
  item.status = item.coveredBy.length ? 'matched-via-svg' : 'needs-review'
  const before = base.animations.find(old => old.id === item.id)
  item.change = !before ? 'added' : before.signature === item.signature ? 'unchanged' : 'changed'
}
const removed = [...base.svgs.filter(old => !target.svgs.some(item => item.id === old.id)).map(item => ({ id: item.id, path: item.path, line: item.line, kind: 'inline', change: 'removed' })), ...(baseExported?.icons ?? []).filter(old => exported && !exported.icons.some(item => item.component === old.component)).map(item => ({ id: `export:${item.component}`, kind: 'export', change: 'removed' })), ...Object.keys(baseExported?.symbols ?? {}).filter(id => exported && !Object.hasOwn(exported.symbols, id)).map(id => ({ id: `symbol:${id}`, kind: 'symbol', change: 'removed' })), ...base.animations.filter(old => !target.animations.some(item => item.id === old.id)).map(item => ({ id: item.id, path: item.path, kind: 'css-animation', change: 'removed' }))]
const items = [...drawn.map(({ svg, html, css, ...item }) => item), ...target.animations.map(item => ({ ...item, kind: 'css-animation' })), ...removed]
const tally = key => Object.fromEntries([...new Set(items.map(item => item[key]).filter(Boolean))].sort().map(value => [value, items.filter(item => item[key] === value).length]))
const report = { schema: 2, host: { targetCommit, baseCommit, targetVersion: JSON.parse(git('show', `${targetCommit}:package.json`)).version }, skin: { commit: execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), workingTree: true }, scope: 'packages/{client,extensions,experimental}/**/src/**/*.{ts,tsx,css}', checks: { sharedSpriteUnchanged, cleanupRestoresOriginal }, summary: { files: targetFiles.size, kinds: tally('kind'), status: tally('status'), changes: tally('change') }, errors: [...target.parseErrors, ...(exported?.errors ?? []), ...(exportError ? [{ source: 'render-host-icons', error: exportError }] : []), ...(baseCommit !== targetCommit ? (baseExported?.errors ?? []).map(error => ({ ...error, source: `baseline ${error.source}` })) : []), ...(baseExportError ? [{ source: 'baseline render-host-icons', error: baseExportError }] : []), ...(!sharedSpriteUnchanged || !cleanupRestoresOriginal ? [{ source: 'icon-ownership', error: 'Shared sprite changed or decoration cleanup did not restore the original DOM' }] : [])], items }
if (values.output) {
  const output = resolve(values.output)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Report: ${output}`)
}
console.log(JSON.stringify({ host: report.host, summary: report.summary, errors: report.errors }, null, 2))
if (report.errors.length || items.some(item => ['unmatched', 'wrong-match', 'empty-art', 'needs-review'].includes(item.status))) process.exitCode = 1
