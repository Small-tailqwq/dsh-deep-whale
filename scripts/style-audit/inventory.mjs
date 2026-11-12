import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(join(repository, 'orca-link/package.json'))
export const css = require('css-tree')
export const ts = require('typescript')
const { transform } = require('lightningcss')
export const skins = ['maid-atelier', 'orca-link']
export const digest = value => createHash('sha256').update(value).digest('hex')
export const portable = path => path.replaceAll('\\', '/')
export function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  }).sort()
}
export function skinInputs(skin) {
  return [...files(join(repository, skin, 'src/client')), ...files(join(repository, 'shared')),
    ...files(join(repository, skin, 'tests')), ...files(join(repository, skin, 'build')),
    ...files(join(repository, skin, 'scripts')).filter(path => /style-audit/.test(path)),
    join(repository, skin, 'package.json')].filter(path => /\.(?:tsx?|css|json)$/.test(path))
}
export function inputDigest(skin) {
  return digest(skinInputs(skin).map(path => `${portable(relative(repository, path))}\0${digest(readFileSync(path))}`).join('\n'))
}

export function selectorRows(selector, site, conditions, declarations) {
  const original = css.toPlainObject(css.parse(selector, { context: 'selector' }))
  const obligations = [{ tree: original, branch: 'selector' }]
  function alternatives(node, path, excluded, ancestors = []) {
    if (!node || typeof node !== 'object') return
    const negative = excluded || node.type === 'PseudoClassSelector' && node.name === 'not'
    if (!negative && node.type === 'PseudoClassSelector' && ['is', 'where', 'has'].includes(node.name)) {
      const list = node.children?.[0]
      if (list?.type === 'SelectorList' && list.children.length > 1) {
        list.children.forEach((choice, index) => {
          const tree = structuredClone(original)
          for (const selection of [{ path: [...path, 'children', 0], index }, ...ancestors.toReversed()]) {
            let selected = tree
            for (const key of selection.path) selected = selected[key]
            selected.children = [selected.children[selection.index]]
          }
          obligations.push({ tree, branch: `${path.join('.')}:${node.name}[${index}]` })
        })
      }
      if (list?.type === 'SelectorList') {
        list.children.forEach((choice, index) => alternatives(choice, [...path, 'children', 0, 'children', index], negative,
          [...ancestors, { path: [...path, 'children', 0], index }]))
        return
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue
      if (Array.isArray(value)) value.forEach((child, index) => alternatives(child, [...path, key, index], negative, ancestors))
      else if (value && typeof value === 'object') alternatives(value, [...path, key], negative, ancestors)
    }
  }
  alternatives(original, [], false)
  return obligations.map(({ tree, branch }) => {
    const effective = css.generate(css.fromPlainObject(structuredClone(tree)))
    const pseudo = []
    tree.children = tree.children.filter(node => {
      if (node.type === 'PseudoElementSelector' || node.type === 'PseudoClassSelector' && ['before', 'after', 'first-line', 'first-letter'].includes(node.name)) {
        pseudo.push(node.name)
        return false
      }
      return true
    })
    const query = css.generate(css.fromPlainObject(tree))
    return {
      id: digest(`${site.file}\0${selector}\0${branch}\0${JSON.stringify(conditions)}\0${declarations}`).slice(0, 24),
      kind: 'css', ...site, selector, effective, query, branch, pseudo, conditions, declarations,
    }
  })
}

export function cssInventory(skin) {
  const rows = [], issues = [], exports = {}, sheets = [], properties = []
  const createSelectorExpansion = skin === 'maid-atelier'
    ? createRequire(join(repository, skin, 'package.json'))('./build/selector-lists.ts').createSelectorExpansion : null
  for (const path of files(join(repository, skin, 'src/client')).filter(path => path.endsWith('.css'))) {
    const file = portable(relative(repository, path))
    const filename = portable(relative(join(repository, skin), path))
    const text = readFileSync(path, 'utf8')
    const expansion = createSelectorExpansion?.()
    if (expansion) transform({ filename, code: Buffer.from(text), visitor: expansion.collect })
    const compiled = transform({ filename, code: Buffer.from(text), cssModules: { pattern: '[hash]_[local]' }, minify: true, visitor: expansion?.expand })
    exports[file] = Object.fromEntries(Object.entries(compiled.exports ?? {}).map(([name, entry]) => [name, entry.name]))
    sheets.push({ file, digest: digest(text), compiled: compiled.code.toString() })
    const ast = css.parse(text, { positions: true, parseValue: false, parseCustomProperty: false, parseAtrulePrelude: false,
      onParseError: error => issues.push({ file, line: error.line, error: error.message }) })
    const conditions = []
    let keyframes = 0
    css.walk(ast, {
      enter(node) {
        if (node.type === 'Declaration') {
          if (node.property.startsWith('--')) properties.push({ file, line: node.loc.start.line, name: node.property, use: 'definition' })
          const value = css.generate(node.value)
          for (const match of value.matchAll(/var\(\s*(--[\w-]+)(\s*,)?/g)) properties.push({ file, line: node.loc.start.line, name: match[1], use: 'reference', fallback: Boolean(match[2]) })
        }
        if (node.type === 'Atrule') {
          if (node.name.endsWith('keyframes')) keyframes++
          conditions.push({ name: node.name, value: node.prelude ? css.generate(node.prelude) : '' })
        }
        if (node.type !== 'Rule' || keyframes) return
        if (node.prelude.type !== 'SelectorList') {
          issues.push({ file, line: node.loc.start.line, error: 'Unparsed selector prelude', text: css.generate(node.prelude) })
          return
        }
        const source = css.generate(node.prelude)
        // Use the same portable filename and module pattern as the shipped bundle.
        const transformed = transform({ filename, code: Buffer.from(`${source}{color:inherit}`), cssModules: { pattern: '[hash]_[local]' } }).code.toString()
        const selectors = css.parse(transformed).children.first.prelude.children
        const declarations = css.generate(node.block)
        selectors.forEach(selector => rows.push(...selectorRows(css.generate(selector), {
          skin, file, line: node.loc.start.line, sourceSelector: source,
        }, structuredClone(conditions), declarations)))
      },
      leave(node) {
        if (node.type !== 'Atrule') return
        conditions.pop()
        if (node.name.endsWith('keyframes')) keyframes--
      },
    })
  }
  const occurrences = new Map()
  for (const row of rows) {
    const occurrence = occurrences.get(row.id) ?? 0
    occurrences.set(row.id, occurrence + 1)
    if (occurrence) row.id = digest(`${row.id}\0${occurrence}`).slice(0, 24)
  }
  return { rows, issues, exports, sheets, properties }
}

function bindingOf(node, name) {
  for (let scope = node; scope; scope = scope.parent) {
    const declares = binding => binding && (ts.isIdentifier(binding) ? binding.text === name
      : binding.elements?.some(element => declares(element.name)))
    if (ts.isFunctionLike(scope) && scope.parameters.some(parameter => declares(parameter.name))) return undefined
    if (ts.isFunctionLike(scope)) {
      let hoisted = false
      function vars(child) {
        if (ts.isFunctionLike(child)) return
        if (ts.isVariableDeclaration(child) && !(child.parent.flags & (ts.NodeFlags.Const | ts.NodeFlags.Let)) && declares(child.name)) hoisted = true
        ts.forEachChild(child, vars)
      }
      if (scope.body) vars(scope.body)
      if (hoisted) return undefined
    }
    if (ts.isCatchClause(scope) && declares(scope.variableDeclaration?.name)) return undefined
    if (!ts.isBlock(scope) && !ts.isSourceFile(scope) && !ts.isForStatement(scope) && !ts.isForOfStatement(scope) && !ts.isForInStatement(scope)) continue
    let found, declared = false
    const visit = child => {
      if (child !== scope && (ts.isFunctionLike(child) || ts.isBlock(child) || ts.isForStatement(child) || ts.isForOfStatement(child) || ts.isForInStatement(child) || ts.isCatchClause(child))) return
      if (ts.isVariableDeclaration(child) && declares(child.name)) {
        declared = true
        if (ts.isIdentifier(child.name) && child.parent.flags & ts.NodeFlags.Const) found = child.initializer
      }
      ts.forEachChild(child, visit)
    }
    visit(scope)
    if (declared) return found
  }
}

export function literal(node, seen = new Set()) {
  if (!node || seen.has(node)) return undefined
  seen = new Set(seen).add(node)
  if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) return literal(node.expression, seen)
  if (ts.isIdentifier(node)) return literal(bindingOf(node, node.text), seen)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = literal(node.left, seen), right = literal(node.right, seen)
    if (left !== undefined && right !== undefined) return left + right
  }
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text
    for (const span of node.templateSpans) {
      const resolved = literal(span.expression, seen)
      if (resolved === undefined) return undefined
      value += resolved + span.literal.text
    }
    return value
  }
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'join') {
    let array = node.expression.expression
    if (ts.isIdentifier(array)) array = bindingOf(array, array.text)
    const separator = node.arguments.length ? literal(node.arguments[0], seen) : ','
    if (array && ts.isArrayLiteralExpression(array) && separator !== undefined) {
      const items = array.elements.map(item => literal(item, seen))
      if (items.every(item => item !== undefined)) return items.join(separator)
    }
  }
  return undefined
}

export function queryInventory(skin) {
  const rows = []
  const sourceFiles = [...files(join(repository, skin, 'src/client')), ...files(join(repository, 'shared'))].filter(path => /\.tsx?$/.test(path))
  const methods = new Set(['querySelector', 'querySelectorAll', 'matches', 'closest', 'getElementById', 'getElementsByClassName', 'getElementsByTagName'])
  for (const path of sourceFiles) {
    const file = portable(relative(repository, path))
    const source = ts.createSourceFile(file, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
    const visit = node => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && methods.has(node.expression.name.text)) {
        const method = node.expression.name.text, argument = node.arguments[0]
        const argumentValue = literal(argument)
        let selector = argumentValue
        if (selector !== undefined) {
          if (method === 'getElementById') selector = `[id=${JSON.stringify(selector)}]`
          if (method === 'getElementsByClassName') selector = selector.split(/\s+/).map(value => `[class~=${JSON.stringify(value)}]`).join('')
        }
        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1
        const expression = argument?.getText(source) ?? ''
        rows.push({ id: digest(`${skin}\0${file}\0${node.getStart()}`).slice(0, 24), kind: 'query', skin, file, line, method,
          receiver: node.expression.expression.getText(source), expression,
          argumentValue: argumentValue ?? null,
          selector: selector ?? null, effective: selector ?? null, query: selector ?? null,
          resolution: selector === undefined ? 'dynamic' : 'static', conditions: [], pseudo: [] })
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return rows
}

export function hostSources(source, ref) {
  const git = (...args) => execFileSync('git', ['-C', resolve(source), ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trimEnd()
  const commit = git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`)
  const tree = git('ls-tree', '-r', commit).split('\n').filter(Boolean)
    .map(line => { const [meta, path] = line.split('\t'); return { path, blob: meta.split(' ')[2] } })
  const blobs = new Map(tree.map(entry => [entry.path, entry.blob]))
  const entries = tree.filter(entry => /^(?:packages|apps)\//.test(entry.path) && entry.path.includes('/src/') && /\.(?:tsx?|css)$/.test(entry.path)
    && !/(?:^|\/)(?:tests?|__tests__|fixtures?|__fixtures__)(?:\/|$)/.test(entry.path)
    && !/\.(?:spec|test|e2e|perf)\.[cm]?[jt]sx?$/.test(entry.path))
  const result = spawnSync('git', ['-C', resolve(source), 'cat-file', '--batch'], {
    input: entries.map(entry => entry.blob).join('\n') + '\n', maxBuffer: 128 * 1024 * 1024,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr.toString())
  let offset = 0
  const sources = new Map()
  for (const entry of entries) {
    const newline = result.stdout.indexOf(10, offset)
    const size = Number(result.stdout.subarray(offset, newline).toString().split(' ')[2])
    offset = newline + 1
    sources.set(entry.path, { blob: entry.blob, text: result.stdout.subarray(offset, offset + size).toString() })
    offset += size + 1
  }
  const version = JSON.parse(git('show', `${commit}:package.json`)).version
  return { commit, version, sources, blobs }
}

export function selectorTokens(selector) {
  if (!selector) return []
  const tokens = []
  let ast
  try { ast = css.toPlainObject(css.parse(selector, { context: 'selector' })) }
  catch (error) { return [{ kind: 'unparsed', name: selector, error: error.message }] }
  function visit(node, negative = false) {
    if (!node || typeof node !== 'object') return
    negative ||= node.type === 'PseudoClassSelector' && node.name === 'not'
    if (node.type === 'AttributeSelector') tokens.push({ kind: 'attribute', name: node.name.name, value: node.value?.value ?? node.value?.name ?? null, matcher: node.matcher, negative })
    if (node.type === 'ClassSelector') tokens.push({ kind: 'class', name: node.name, negative })
    for (const [key, child] of Object.entries(node)) {
      if (key === 'loc') continue
      if (Array.isArray(child)) child.forEach(item => visit(item, negative))
      else if (child && typeof child === 'object') visit(child, negative)
    }
  }
  visit(ast)
  return tokens
}

export function sourceEvidence(rows, host, localClasses) {
  const index = new Map(), local = new Set(Object.values(localClasses).flatMap(map => Object.values(map)))
  const hostClasses = new Map()
  const parseErrors = []
  for (const [path, entry] of host.sources) {
    if (!path.endsWith('.css')) continue
    const ast = css.parse(entry.text, { parseValue: false, parseCustomProperty: false, parseAtrulePrelude: false,
      onParseError: error => parseErrors.push({ path, line: error.line, error: error.message }) })
    const addClass = node => {
      if (!hostClasses.has(node.name)) hostClasses.set(node.name, [])
      hostClasses.get(node.name).push({ path, blob: entry.blob })
    }
    css.walk(ast, { enter(node) {
      if (node.type === 'ClassSelector') addClass(node)
      if (node.type === 'PseudoClassSelector' && node.name === 'global' && node.children?.first?.type === 'Raw') {
        css.walk(css.parse(node.children.first.value, { context: 'selectorList' }), { visit: 'ClassSelector', enter: addClass })
      }
    } })
  }
  const names = new Set(rows.flatMap(row => selectorTokens(row.query)).filter(token => token.kind === 'attribute' && token.name.startsWith('data-')).map(token => token.name))
  for (const name of names) {
    const matches = []
    const dataset = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    for (const [path, entry] of host.sources) if (entry.text.includes(name) || entry.text.includes(`dataset.${dataset}`)) matches.push({ path, blob: entry.blob })
    index.set(name, matches)
  }
  for (const row of rows) {
    row.hostEvidence = []
    row.missingHostAttributes = []
    row.missingHostClasses = []
    row.missingHostValues = []
    for (const token of selectorTokens(row.query)) {
      if (token.negative) continue
      if (token.kind === 'class' && !local.has(token.name) || token.kind === 'attribute' && token.name === 'class' && token.value) {
        const fragment = token.kind === 'class' ? token.name : token.value
        const matches = [...hostClasses].filter(([name]) => {
          if (token.kind === 'class' || token.matcher === '=') return name === fragment
          const candidates = [name, `HASH_${name}`, `HASH_${name} `]
          return candidates.some(value => token.matcher === '^=' ? value.startsWith(fragment) : token.matcher === '$=' ? value.endsWith(fragment) : value.includes(fragment))
        })
        if (!matches.length) row.missingHostClasses.push(fragment)
        else row.hostEvidence.push({ classFragment: fragment, sources: matches.flatMap(([, sources]) => sources) })
      }
      if (token.kind !== 'attribute' || !token.name.startsWith('data-')) continue
      if (/^data-(?:dsh-(?:maid-atelier|orca-link|whale-)|skin-|orca(?:-|$)|maid(?:-|$))/.test(token.name)) continue
      const matches = index.get(token.name) ?? []
      if (!matches.length) row.missingHostAttributes.push(token.name)
      else row.hostEvidence.push({ attribute: token.name, sources: matches })
      if (matches.length && token.value && token.matcher === '=') {
        const candidates = token.name === 'data-slot' ? [...host.sources].map(([path, entry]) => ({ path, blob: entry.blob })) : matches
        const values = candidates.filter(match => {
          const text = host.sources.get(match.path).text
          return text.includes(`'${token.value}'`) || text.includes(`"${token.value}"`) || text.includes(`=${token.value}]`)
        })
        if (!values.length) row.missingHostValues.push(`${token.name}=${token.value}`)
        else row.hostEvidence.push({ attribute: token.name, value: token.value, sources: values })
      }
    }
    row.ownClasses = selectorTokens(row.query).filter(token => token.kind === 'class' && local.has(token.name)).map(token => token.name)
  }
  return { attributes: Object.fromEntries(index), parseErrors }
}

export function propertyEvidence(properties, host) {
  const index = new Map()
  const defined = new Set(properties.filter(property => property.use === 'definition').map(property => property.name))
  const used = new Set(properties.filter(property => property.use === 'reference').map(property => property.name))
  for (const [path, entry] of host.sources) {
    for (const name of new Set(entry.text.match(/--[a-zA-Z_][\w-]*/g))) {
      if (!index.has(name)) index.set(name, [])
      index.get(name).push({ path, blob: entry.blob })
    }
  }
  return properties.map(property => ({ ...property, sources: index.get(property.name) ?? [],
    status: /^(?:--dsw-|--dsh-|--dsl-)/.test(property.name) && !index.has(property.name)
      ? defined.has(property.name) && used.has(property.name) ? 'skin-defined' : 'needs-source-review' : 'candidate' }))
}
