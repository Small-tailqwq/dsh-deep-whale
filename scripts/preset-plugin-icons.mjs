import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Reviewed official DSH 0.2.2-rc.1 identities and the skin's existing artwork keys. */
export const PRESET_PLUGIN_ICONS = [
  { item: 'shell', art: 'terminal' },
  { item: 'agent-loop', art: 'loop' },
  { item: 'subagent', art: 'subagent' },
  { item: 'web-search', art: 'search' },
  { package: '@deepseek-ai/dsh-experimental-voice-input-bundle', art: 'voice-input' },
  { package: '@deepseek-ai/dsh-experimental-plugin-market-bundle', art: 'plugin-market' },
  { package: '@deepseek-ai/dsh-experimental-auto-review', art: 'auto-review' },
  { package: '@deepseek-ai/dsh-experimental-tool-worktree', art: 'tool-worktree' },
  { package: '@deepseek-ai/dsh-personalized-recommendations', art: 'default' },
  { package: '@deepseek-ai/dsh-experimental-session-titles-bundle', art: 'session-titles' },
  { package: '@deepseek-ai/dsh-experimental-badge-skill-bundle', art: 'skill-badge' },
  { package: '@deepseek-ai/dsh-subagent-codex', art: 'subagent' },
  { package: '@deepseek-ai/dsh-subagent-claude-code', art: 'subagent' },
  { package: '@deepseek-ai/dsh-experimental-cot-translation-bundle', art: 'cot-translation' },
  { package: '@deepseek-ai/dsh-experimental-forge-bundle', art: 'tool-worktree' },
  { package: '@deepseek-ai/dsh-experimental-inspector-profile', art: 'inspector' },
  { package: '@deepseek-ai/dsh-experimental-session-search', art: 'session-search' },
  { package: '@deepseek-ai/dsh-experimental-terminal-bundle', art: 'terminal' },
  { package: '@deepseek-ai/dsh-experimental-ralph-bundle', art: 'loop' },
]

function targets(entry, bodyAttr) {
  const attributes = entry.item
    ? [`data-plugin-item="${entry.item}"`, `data-plugin-item-detail="${entry.item}"`]
    : [`data-plugin-package="${entry.package}"`, `data-plugin-detail="${entry.package}"`]
  return [
    `body[${bodyAttr}] [${attributes[0]}] > [class$="_cardHead"] > [class$="_cardIcon"]`,
    `body[${bodyAttr}] [${attributes[1]}] > [class$="_detailTop"] > [class$="_detailHead"] > [class$="_cardIcon"]`,
  ]
}

/** Embed the SVG source unchanged, with each image isolated from the page's SVG ids. */
export function presetPluginIconCss(root) {
  const { bodyAttr } = JSON.parse(readFileSync(join(root, 'skin.json'), 'utf8'))
  const all = PRESET_PLUGIN_ICONS.flatMap(entry => targets(entry, bodyAttr))
  const mappings = PRESET_PLUGIN_ICONS.map(entry => {
    const svg = readFileSync(join(root, 'assets/plugin-icons', `${entry.art}.svg`), 'utf8')
    return `${targets(entry, bodyAttr).join(',')}{--dsh-preset-plugin-icon:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`
  })
  return `/* Generated from assets/plugin-icons/ by npm run build. */\n${mappings.join('\n')}
${all.join(',')}{position:relative}
${all.flatMap(selector => [`${selector}>svg`, `${selector}>img`]).join(',')}{visibility:var(--dsh-preset-plugin-native,visible)}
${all.map(selector => `${selector}::after`).join(',')}{content:"";display:var(--dsh-preset-plugin-display,none);position:absolute;inset:0;margin:auto;width:36px;height:36px;pointer-events:none;background:var(--dsh-preset-plugin-icon) center/contain no-repeat}\n`
}
