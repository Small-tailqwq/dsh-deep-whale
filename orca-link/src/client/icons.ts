import { hasMutationOutsideTerminal } from './mutation-filter.ts'

/**
 * ORCA LINK icon redraw: every host UI glyph is redrawn in the skin's
 * rectilinear line language — square outlines, mitre joins, square caps,
 * straight segments only (45-degree chevrons are the sole concession to
 * direction marks). Host SVG nodes are never destroyed: the matching icon
 * keeps its element, sizing, attributes and React ownership, gains a
 * `data-orca-link-icon` marker, and receives one appended
 * `data-orca-link-icon-art` group drawn in a 16-unit design grid fitted
 * (uniform scale, centered) to the host viewBox. The stylesheet hides the
 * original children while the skin is active, so teardown is just removing
 * the art groups.
 *
 * Keys are distinctive fragments of the host path data as rendered by
 * @deepseek-ai/dsh-client-ui-primitives (verified against that package's
 * icons/index.tsx at c36a83ff6bb9, including its Regular/Medium variants).
 * Unmatched drawings, such as the brand wordmark and hero artwork, keep
 * their host geometry.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
const ICON_ATTRIBUTE = 'data-orca-link-icon'
const ICON_ART_ATTRIBUTE = 'data-orca-link-icon-art'

/**
 * Rectilinear icon art on a 16x16 design grid. Group defaults: stroke
 * currentColor, square caps, mitre joins; filled shapes opt out explicitly.
 */
const ICON_ART: Record<string, string> = {
  'panel-collapse': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M2.25 2.25h3.75v11.5H2.25z" fill="currentColor" stroke="none"/>',
    '<path d="M11.75 8H7.75M9.75 5.5 7.25 8l2.5 2.5"/>',
  ].join(''),
  'new-session': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M8 5.25v5.5M5.25 8h5.5"/>',
  ].join(''),
  search: [
    '<path d="M2.25 2.25h7.5v7.5h-7.5z"/>',
    '<path d="M10.25 10.25 13.75 13.75"/>',
  ].join(''),
  sliders: [
    '<path d="M2 4.75h12M2 8h12M2 11.25h12"/>',
    '<path d="M4.75 4h2.5v1.5h-2.5zM8.75 7.25h2.5v1.5h-2.5zM6.25 10.5h2.5v1.5h-2.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  'folder-closed': [
    '<path d="M2 3.5h4.25L8 5.25h6v8.25H2z"/>',
    '<path d="M4 8h8"/>',
  ].join(''),
  'folder-open': [
    '<path d="M2 6V3.5h4.25L8 5.25h6V7"/>',
    '<path d="M2.5 7h11.75l-2 6.5H1.75z"/>',
    '<path d="M5 10.25h6"/>',
  ].join(''),
  'add-workspace': [
    '<path d="M2 3.5h4.25L8 5.25h6V13.5H2z"/>',
    '<path d="M12.5 1.5v2.25M11.375 2.625h2.25"/>',
  ].join(''),
  gear: [
    '<path d="M4.75 4.75h6.5v6.5h-6.5z"/>',
    '<path d="M6.5 2.25h3v2.5h-3zM6.5 11.25h3v2.5h-3zM2.25 6.5h2.5v3h-2.5zM11.25 6.5h2.5v3h-2.5z" fill="currentColor" stroke="none"/>',
    '<path d="M7 7h2v2H7z" fill="currentColor" stroke="none"/>',
  ].join(''),
  sparkle: [
    '<path d="M8 1.5v3.25M8 11.25v3.25M1.5 8h3.25M11.25 8h3.25"/>',
    '<path d="M6.5 6.5h3v3h-3z" fill="currentColor" stroke="none"/>',
  ].join(''),
  // Tool rows: the host draws its own wrench off-axis for tool kinds, and the
  // conversation flow reuses the sparkle glyph there, so the skin squares a
  // double-ended wrench into two open jaws joined by one handle and rotates the
  // whole tool 45 degrees.
  wrench: [
    '<g transform="rotate(-45 8 8)">',
    '<path d="M8 4.75v6.5"/>',
    '<path d="M6 2.5v2.25h4V2.5"/>',
    '<path d="M6 13.5v-2.25h4V13.5"/>',
    '</g>',
  ].join(''),
  data: [
    '<rect x="2.5" y="2.5" width="11" height="4"/>',
    '<rect x="2.5" y="9" width="11" height="4"/>',
  ].join(''),
  // Token usage: the host draws a tall cylinder; the skin squares the same
  // three-tier store into one closed column with two rules. Two detached bars
  // would read as the settings `data` glyph, and a full-width column reads as a
  // slab beside the pill label, so the column keeps the host's tall proportion.
  database: [
    '<path d="M3.5 2h9v12h-9z"/>',
    '<path d="M3.5 6h9M3.5 10h9"/>',
  ].join(''),
  // Session stats: the host draws a dial with a needle; the skin squares the
  // dial into a frame left open at the bottom and keeps the needle at 45
  // degrees, distinct from the context-usage pixel field drawn under `usage`.
  gauge: [
    '<path d="M2.5 12.25V2.75h11v9.5"/>',
    '<path d="M8 9 11.25 5.75"/>',
    '<path d="M7 8h2v2H7z" fill="currentColor" stroke="none"/>',
  ].join(''),
  // Clock: the host draws a ring with two hands; the skin squares the dial and
  // keeps one L-shaped reading from the centre.
  clock: [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M8 8V4.5M8 8h3.5"/>',
  ].join(''),
  // Light theme: the skin's own register for brightness is ink coverage. The
  // whole glyph is one closed outline — a squared core with four stubby lobes,
  // no inner edges and nothing filled — so it reads as empty, and stays distinct
  // from `sparkle`'s filled core.
  sun: [
    '<path d="M6.5 1.5h3v2h3v3h2v3h-2v3h-3v2h-3v-2h-3v-3h-2v-3h2v-3h3z"/>',
  ].join(''),
  // Dark theme: the inverse register over the same 11-unit square — the area
  // stays filled and only a 45-degree corner is cut away, so the ink itself
  // carries the dark reading instead of a crescent outline.
  moon: ['<path fill-rule="evenodd" d="M2.5 2.5h11v11h-11zM8.75 2.5h4.75v4.75z" fill="currentColor" stroke="none"/>'].join(''),
  // Follow-system theme: a squared display on a stand; it carries no inner
  // prompt, so it cannot read as `terminal`.
  monitor: [
    '<path d="M1.75 2.75h12.5v8.75H1.75z"/>',
    '<path d="M8 11.5v1.5M5.25 13.25h5.5"/>',
  ].join(''),
  'agent-preset': [
    '<path d="M6.75 1.75h2.5v2.5h-2.5zM1.75 11.75h2.5v2.5h-2.5zM11.75 11.75h2.5v2.5h-2.5z" fill="currentColor" stroke="none"/>',
    '<path d="M8 4.25 3 11.75M8 4.25l5 7.5"/>',
  ].join(''),
  plus: ['<path d="M8 1.75v12.5M1.75 8h12.5"/>'].join(''),
  check: ['<path d="M3 8.5 6.5 12 13 4.5"/>'].join(''),
  shield: [
    '<path d="M8 1.75 13.75 3.6v3.65c0 4.1-2.9 5.9-5.75 7-2.85-1.1-5.75-2.9-5.75-7V3.6z"/>',
    '<path d="M5.6 7.9l1.7 1.7 3.1-3.4"/>',
  ].join(''),
  'permission-read': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M4.5 5.25h7M4.5 8h7M4.5 10.75h4.25"/>',
    '<path d="M10.25 10.25h1.5v1.5h-1.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  'permission-write': [
    '<path d="M2.25 3.25h4.25L8 4.75h5.75v4.5"/>',
    '<path d="M2.25 3.25v10.5h6"/>',
    '<path d="M8.25 12.5 12 8.75l1.75 1.75L10 14.25H8.25z"/>',
    '<path d="m11.75 9 1.75 1.75"/>',
  ].join(''),
  'permission-full': [
    '<path d="M2.25 6V2.25H6M10 2.25h3.75V6M13.75 10v3.75H10M6 13.75H2.25V10"/>',
    '<path d="M5.75 5.75h4.5v4.5h-4.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  send: [
    '<path d="M8 12.5V2.75M3.75 7 8 2.75 12.25 7"/>',
    '<path d="M4 13.75h8"/>',
  ].join(''),
  close: ['<path d="M3.75 3.75l8.5 8.5M12.25 3.75l-8.5 8.5"/>'].join(''),
  'chevron-down': ['<path d="M3.75 5.5 8 9.75 12.25 5.5"/>'].join(''),
  'chevron-up': ['<path d="M3.75 10.25 8 6l4.25 4.25"/>'].join(''),
  'chevron-left': ['<path d="M10.25 3.75 5.75 8l4.5 4.25"/>'].join(''),
  'chevron-right': ['<path d="M5.75 3.75 10.25 8l-4.5 4.25"/>'].join(''),
  'caret-right': ['<path d="M4.5 3 11.75 8 4.5 13z" fill="currentColor" stroke="none"/>'].join(''),
  ellipsis: [
    '<path d="M2.25 6.5h3v3h-3zM6.5 6.5h3v3h-3zM10.75 6.5h3v3h-3z" fill="currentColor" stroke="none"/>',
  ].join(''),
  // Thought balloon: square-cornered, tailing bottom-left, holding three filled
  // squares. The queue balloon tails bottom-right and holds two rules, so the
  // two stay apart. The previous square with an inner cross did not read as a
  // thought row.
  think: [
    '<path d="M2.25 2.75h11.5v8.25H6.75L4 13.75V11H2.25z"/>',
    '<path d="M4 6h2v2H4zM7 6h2v2H7zM10 6h2v2h-2z" fill="currentColor" stroke="none"/>',
  ].join(''),
  // Context injection: a syringe — thumb rest and plunger above the barrel,
  // drawn liquid at the barrel foot, needle below.
  'context-injection': [
    '<path d="M5.25 2.5h5.5"/>',
    '<path d="M8 2.5v2.25"/>',
    '<path d="M5 4.75h6v7.5H5z"/>',
    '<path d="M6.25 10.5h3.5v1.75h-3.5z" fill="currentColor" stroke="none"/>',
    '<path d="M8 12.25v2.25"/>',
  ].join(''),
  terminal: [
    '<path d="M1.75 2.5h12.5v11H1.75z"/>',
    '<path d="M4 6.5 6.25 8.75 4 11M8.75 11h3.5"/>',
  ].join(''),
  globe: [
    '<path d="M2.5 2.5h11v11h-11z"/>',
    '<path d="M2.5 8h11M8 2.5v11"/>',
  ].join(''),
  copy: [
    '<path d="M5.5 5.5h8v8h-8z"/>',
    '<path d="M10.5 2.5h-8v8"/>',
  ].join(''),
  edit: [
    '<path d="M2.5 13.5l.8-3.2 7.3-7.3 2.4 2.4-7.3 7.3z"/>',
    '<path d="M2.5 13.5l.8-3.2 2.4 2.4z" fill="currentColor" stroke="none"/>',
  ].join(''),
  'thumb-up': [
    '<path d="M2.25 6.75h2.5v7h-2.5z" fill="currentColor" stroke="none"/>',
    '<path d="M6 13.75V7.6L8.7 3.2l1.8 1-1.6 3.4h4.35v3.15l-1.2 3z" fill="currentColor" stroke="none"/>',
  ].join(''),
  'thumb-down': [
    '<g transform="rotate(180 8 8)">',
    '<path d="M2.25 6.75h2.5v7h-2.5z" fill="currentColor" stroke="none"/>',
    '<path d="M6 13.75V7.6L8.7 3.2l1.8 1-1.6 3.4h4.35v3.15l-1.2 3z" fill="currentColor" stroke="none"/>',
    '</g>',
  ].join(''),
  branch: [
    '<path d="M4.5 3.75v8.5M4.5 8h7v4.25"/>',
    '<path d="M3.25 1.25h2.5v2.5h-2.5zM3.25 12.25h2.5v2.5h-2.5zM10.25 12.25h2.5v2.5h-2.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  refresh: [
    '<path d="M2.5 13.25V4.5L4.75 2.25h6.5L13.5 4.5v4"/>',
    '<path d="M12.25 7.25 13.5 8.5 14.75 7.25"/>',
  ].join(''),
  loading: ['<path d="M8 2.25H2.25v11.5h11.5V8"/>'].join(''),
  code: [
    '<path d="M6.5 2.5 5 13.5M11.5 2.5 10 13.5M2.5 6.25h11M2 10h11"/>',
  ].join(''),
  browse: [
    '<path d="M2.25 2.5h11.5v11H2.25z"/>',
    '<path d="M4.75 5.75h6.5M4.75 8.75h4.5"/>',
  ].join(''),
  queue: [
    '<path d="M2.25 2.5h11.5v8.25H8.6l-3.1 2.75v-2.75H2.25z"/>',
    '<path d="M5 5.25h6M5 7.75h6"/>',
  ].join(''),
  trash: [
    '<path d="M2.25 3.75h11.5M6.25 3.5V2.25h3.5V3.5"/>',
    '<path d="M4 3.75v10.25h8V3.75M6.75 6.75v4.5M9.25 6.75v4.5"/>',
  ].join(''),
  warning: [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M8 5v3.5"/>',
    '<path d="M7.375 10h1.25v1.25h-1.25z" fill="currentColor" stroke="none"/>',
  ].join(''),
  user: [
    '<path d="M6.25 2.25h3.5v3.5h-3.5z" fill="currentColor" stroke="none"/>',
    '<path d="M2.5 13.75v-2l1.75-2.5h7.5l1.75 2.5v2"/>',
  ].join(''),
  // Users (0.1.7): the user figure shifted left, a second outlined one behind.
  users: [
    '<path d="M4.25 2.75h3.5v3.5h-3.5z" fill="currentColor" stroke="none"/>',
    '<path d="M1.25 13.75v-2l1.5-2.25h6.5l1.5 2.25v2"/>',
    '<path d="M10.25 3h3v3h-3M12 9.5l1.25 2v2.25"/>',
  ].join(''),
  stop: ['<path d="M3.75 3.75h8.5v8.5h-8.5z" fill="currentColor" stroke="none"/>'].join(''),
  // Two nested loops with the inner wire between them, tilted 45° so the three
  // parallel wires stay separated at the 14px button size. The previous
  // stem-only drawing read as a bracket and was reported as a broken glyph on
  // the 0.1.5 composer attach button.
  paperclip: ['<path d="M12 4.25v6.5a2.75 2.75 0 0 1-5.5 0V4.25a1.5 1.5 0 0 1 3 0v6.5" transform="rotate(-45 8 8)"/>'].join(''),
  // Composer command button: a prompt, distinct from the plus and the clip.
  command: ['<path d="M4.5 4.5 8 8l-3.5 3.5M8.75 11.5h4"/>'].join(''),
  download: [
    '<path d="M8 2.25v7.5M5.25 7 8 9.75 10.75 7"/>',
    '<path d="M2.5 11.25v2.5h11v-2.5"/>',
  ].join(''),
  share: ['<path d="M2.5 8h9.75M9 4.75 12.75 8 9 11.25"/>'].join(''),
  'right-up': ['<path d="M3 13.25 13.25 3M6.5 3h6.75v6.75"/>'].join(''),
  enhance: ['<path d="M2 2.75h12M2 6.75h12M2 10.75h12M2 14h8.5"/>'].join(''),
  link: [
    '<path d="M5.25 5.25h5.5v5.5h-5.5z"/>',
    '<path d="M2.5 8.25V2.5h5.75M7.75 13.5h5.75V7.75"/>',
  ].join(''),
  play: [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M6.75 5.5 10.75 8l-4 2.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  pause: [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M5.75 5h1.5v6h-1.5zM8.75 5h1.5v6h-1.5z" fill="currentColor" stroke="none"/>',
  ].join(''),
  fullscreen: ['<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>'].join(''),
  checklist: [
    '<path d="M2 2h3.5v3.5H2zM2 10h3.5v3.5H2z"/>',
    '<path d="M7.5 3.75h6M7.5 11.75h6"/>',
  ].join(''),
  'list-pen': [
    '<path d="M2.25 2h8L13.5 5.25V7.5"/>',
    '<path d="M4.75 5.5h6M4.75 9h4.5"/>',
    '<path d="M8.5 13.75 12.75 9.5l1.5 1.5-4.25 4.25H8.5z"/>',
  ].join(''),
  goal: [
    '<path d="M2.5 2.5h11v11h-11z"/>',
    '<path d="M6 6h4v4H6z"/>',
    '<path d="M13.75 2.25 8.5 7M11 7.5H8.5V5"/>',
  ].join(''),
  inspect: [
    '<path d="M6.25 4.75 2.75 8l3.5 3.25M9.75 4.75 13.25 8l-3.5 3.25M10 2.5 6 13.5"/>',
  ].join(''),
  skill: [
    '<path d="M2.25 1.75h8L13.5 5v9.25H2.25z"/>',
    '<path d="M4.75 5.75h5.5M4.75 8.75h5.5"/>',
    '<path d="M9.75 10.75v3M8.25 12.25h3"/>',
  ].join(''),
  question: [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M5.25 4.75h5.5v3H8.5v1.5"/>',
    '<path d="M7.375 10.75h1.25v1.25h-1.25z" fill="currentColor" stroke="none"/>',
  ].join(''),
  archive: [
    '<path d="M1.75 1.75h12.5V5H1.75zM2.75 5v9.25h10.5V5"/>',
    '<path d="M5.75 8h4.5v2.5h-4.5z"/>',
  ].join(''),
  'alarm-clock': [
    '<path d="M3.5 4h9v9h-9zM2 3l2-2M12 1l2 2M5 13l-1 2M11 13l1 2M8 6v3h2"/>',
  ].join(''),
  'archive-check': [
    '<path d="M1.75 2h12.5v3H1.75zM2.75 5v9h10.5V5M5 9l2 2 4-4"/>',
  ].join(''),
  'check-circle': ['<path d="M2.25 2.25h11.5v11.5H2.25zM4.5 8l2.5 2.5 4.5-5"/>'].join(''),
  'chevrons-up-down': ['<path d="M4.5 6 8 2.5 11.5 6M4.5 10 8 13.5 11.5 10"/>'].join(''),
  'close-circle': ['<path d="M2.25 2.25h11.5v11.5H2.25zM5.5 5.5l5 5M10.5 5.5l-5 5"/>'].join(''),
  compact: ['<path d="M2 2.5h12v11H2zM4 5l3 3-3 3M12 5 9 8l3 3"/>'].join(''),
  'compare-split': ['<path d="M1.75 2.25h4.5v11.5h-4.5zM9.75 2.25h4.5v11.5h-4.5z"/>'].join(''),
  plugin: ['<path d="M4.75 4.75h6.5v6.5h-6.5zM6.5 1.5v3.25M9.5 1.5v3.25M6.5 11.25v3.25M9.5 11.25v3.25M1.5 6.5h3.25M1.5 9.5h3.25M11.25 6.5h3.25M11.25 9.5h3.25"/>'].join(''),
  'deliver-doc': ['<path d="M3 1.75h7L13 4.75v9.5H3zM9.5 1.75V5H13M5 7h4M5 10l2 2 4-4"/>'].join(''),
  'flat-list': ['<path d="M6 3.5h8M6 8h8M6 12.5h8M2 2.5h2v2H2zM2 7h2v2H2zM2 11.5h2v2H2z"/>'].join(''),
  info: ['<path d="M2.25 2.25h11.5v11.5H2.25zM8 7v4M7 4.5h2"/>'].join(''),
  microphone: ['<path d="M5.5 1.75h5v8h-5zM2.5 7.5v4h11v-4M8 11.5v3M5.5 14.5h5"/>'].join(''),
  nowrap: ['<path d="M2 2v12M14 2v12M4 5h6M4 8h8M9.5 5.5 12 8l-2.5 2.5M4 11h3"/>'].join(''),
  'paper-plane': ['<path d="M1.75 6.75 14.25 1.75 9.25 14.25 6.75 9.25zM6.75 9.25l7.5-7.5"/>'].join(''),
  pin: ['<path d="M5 1.75h6V4l-1 1v3l2.5 2v1H3.5v-1L6 8V5L5 4zM8 11v3.5"/>'].join(''),
  'pin-filled': [
    '<path d="M5 1.75h6V4l-1 1v3l2.5 2v1H3.5v-1L6 8V5L5 4z" fill="currentColor"/>',
    '<path d="M8 11v3.5"/>',
  ].join(''),
  'plugin-pinwheel': ['<path d="M6.5 6.5h3v3h-3zM6.5 6.5V2h6v4.5h-3M9.5 9.5V14h-6V9.5h3M6.5 9.5H2v-6h4.5M9.5 6.5H14v6H9.5"/>'].join(''),
  'sliders-two': ['<path d="M2 5h5M10 5h4M2 11h3M8 11h6M7 3.5h3v3H7zM5 9.5h3v3H5z"/>'].join(''),
  // The connector uses its native 9x11 grid so adjoining tree stems meet.
  'tree-corner': ['<path d="M.5 0V10h8"/>'].join(''),
  unarchive: ['<path d="M1.75 2h12.5v3H1.75zM2.75 5v9h10.5V5M8 12V7M5.5 9.5 8 7l2.5 2.5"/>'].join(''),
  'warning-triangle': ['<path d="M8 1.75 14.25 13.5H1.75zM8 6v3M8 10.5v1"/>'].join(''),
  'workspace-tree': ['<path d="M1.75 2.25h12.5v11.5H1.75zM4.5 5v6h7M4.5 8h7M8 8v3"/>'].join(''),
  wrap: ['<path d="M2 2v12M14 2v12M4 5h6v5H6M8 8l-2 2 2 2"/>'].join(''),
  'wrap-lines': ['<path d="M2 3h12M2 7h12v5H8M10 10l-2 2 2 2M2 11h3"/>'].join(''),
  'dock-center': ['<path d="M1.75 2.25h12.5v11.5H1.75z"/><path d="M4 4.5h8v7H4z" fill="currentColor"/>'].join(''),
  'dock-left': ['<path d="M1.75 2.25h12.5v11.5H1.75z"/><path d="M1.75 2.25H8v11.5H1.75z" fill="currentColor"/>'].join(''),
  'dock-right': ['<path d="M1.75 2.25h12.5v11.5H1.75z"/><path d="M8 2.25h6.25v11.5H8z" fill="currentColor"/>'].join(''),
  'dock-top': ['<path d="M1.75 2.25h12.5v11.5H1.75z"/><path d="M1.75 2.25h12.5V8H1.75z" fill="currentColor"/>'].join(''),
  'dock-bottom': ['<path d="M1.75 2.25h12.5v11.5H1.75z"/><path d="M1.75 8h12.5v5.75H1.75z" fill="currentColor"/>'].join(''),
  'sandbox-on': ['<path d="M2.5 2.5h11v8L8 14l-5.5-3.5zM5 7.5l2 2 4-4"/>'].join(''),
  'sandbox-off': ['<path d="M2.5 2.5h11v8L8 14l-5.5-3.5zM5.5 5.5l5 5M10.5 5.5l-5 5"/>'].join(''),
  usage: ['<rect x="2.5" y="2.5" width="11" height="11"/>'].join(''),
}

/**
 * Context-usage gauge: a 6x6 pixel field inside the frame. Cells light up
 * one by one from the bottom-left, left to right per row, row by row
 * upward — solid blue for filled levels, the boundary cell fading in with
 * the fractional remainder, empties kept as a faint grid.
 */
const USAGE_CELLS = 36
const USAGE_COLS = 6
const USAGE_CELL_SIZE = 1
const USAGE_PITCH = 1.5
const USAGE_X0 = 3.75
const USAGE_Y_BOTTOM = 12.25
const USAGE_EMPTY_OPACITY = 0.12
const USAGE_MIN_PARTIAL = 0.28

function buildUsageCells(): SVGGElement {
  const cells = document.createElementNS(SVG_NS, 'g')
  for (let index = 0; index < USAGE_CELLS; index++) {
    const rect = document.createElementNS(SVG_NS, 'rect')
    const col = index % USAGE_COLS
    const row = Math.floor(index / USAGE_COLS)
    rect.setAttribute('data-orca-link-usage-cell', String(index))
    rect.setAttribute('x', String(USAGE_X0 + col * USAGE_PITCH))
    rect.setAttribute('y', String(USAGE_Y_BOTTOM - USAGE_CELL_SIZE - row * USAGE_PITCH))
    rect.setAttribute('width', String(USAGE_CELL_SIZE))
    rect.setAttribute('height', String(USAGE_CELL_SIZE))
    rect.setAttribute('fill', 'var(--orca-blue, currentColor)')
    rect.setAttribute('stroke', 'none')
    rect.setAttribute('opacity', String(USAGE_EMPTY_OPACITY))
    cells.append(rect)
  }
  return cells
}

/** Target glyph fragments from DSH 0.1.7-alpha.1 (c36a83ff6bb9), plus the
 * keys marked "(0.1.7)" taken from the 0.1.7-rc.2 ui-primitives icons (the
 * clock, user and users artwork changed or first appeared there; the
 * tests/fixtures alpha.1 set still holds their older drawings, kept as the
 * "(<= 0.1.6)" keys).
 * Shared contours are keyed by their distinguishing drawing, not the frame.
 * Full alpha.1 target SVGs, including inline controls, live in tests/fixtures. */
const ICON_KEYS: ReadonlyArray<readonly [string, string]> = [
  ["d=\"M6.51867 12.3282C7.29816", 'agent-preset'], // IconAgentPresetOutlineMedium
  ["d=\"M4.09372 11.9895L3.11865", 'alarm-clock'], // IconAlarmClockOutlineMedium
  ["d=\"M9 12H13\"", 'terminal'], // IconApiOutlineMedium
  ["d=\"M2.95 5.7v4.8a2.9 2.9 0 ", 'archive-check'], // IconArchiveCheckOutlineMedium
  ["d=\"M6.5 9.5H9.5\"", 'archive'], // IconArchiveOutlineMedium
  ["d=\"M1.01503 8.0001L5.6964 8", 'branch'], // IconBranchOutlineMedium
  ["d=\"M12.5 1.32617C13.3039 1.32617 14 1.95171 14 2.77637V13.2246C13.9", 'browse'], // IconBrowseOutlineMedium
  ["d=\"M28.1936 14.6936L19.8066", 'check-circle'], // IconCheckCircleFillMedium
  ["d=\"M12.5303 6.53027L8.80273", 'check-circle'], // IconCheckCircleOutlineMedium
  ["d=\"M2.25 8.5L5.49732 11.747", 'check'], // IconCheckOutlineMedium
  ["d=\"M7.5 4.5H13.5\"", 'checklist'], // IconChecklistOutlineMedium
  ["d=\"M4 6L7.29289 9.29289C7.6", 'chevron-down'], // IconChevronDownOutlineMedium
  ["d=\"M10 4L6.70711 7.29289C6.", 'chevron-left'], // IconChevronLeftOutlineMedium
  ["d=\"M6 12L9.29289 8.70711C9.", 'chevron-right'], // IconChevronRightOutlineMedium
  ["d=\"M12 10L8.70711 6.70711C8", 'chevron-up'], // IconChevronUpOutlineMedium
  ["d=\"m5.1 6 2.9-2.9L10.9 6\"", 'chevrons-up-down'], // IconChevronsUpDownOutlineMedium
  ["d=\"M8 4V8.5L11.25 10.25\"", 'clock'], // IconClockOutlineMedium (<= 0.1.6)
  ["d=\"M8 4.31V8.46L11 10.08", 'clock'], // IconClockOutlineMedium (0.1.7)
  ["d=\"M15 8A7 7 0 1 1 1 8A7 7 ", 'close-circle'], // IconCloseCircleFillMedium
  ["d=\"M3.5 3.5L12.5 12.5\"", 'close'], // IconCloseFillMedium
  ["d=\"M2.5 2.5L13.5 13.5\"", 'close'], // IconCloseOutlineMedium
  ["d=\"M2.39868 5.5H14.0681\"", 'code'], // IconCodeOutlineMedium
  ["d=\"M8 1.5C8.85359 1.5 9.698", 'compact'], // IconCompactOutlineMedium
  ["d=\"M6 1.5H2.5C1.94772 1.5 1", 'compare-split'], // IconCompareSplitOutlineMedium
  ["d=\"M8 0.5V7.5\"", 'context-injection'], // IconContextInjectionOutlineMedium
  ["d=\"M11.9792 1.53296C13.36 1", 'copy'], // IconCopyOutlineMedium
  ["d=\"M3.16143 6.59068L1.75205", 'plugin'], // IconCordisPluginOutlineMedium
  ["d=\"M14.1127 8.70663C14.2576", 'moon'], // IconDarkOutlineMedium
  ["d=\"M7.8667 0.349609C8.96906", 'data'], // IconDataOutlineMedium
  ["d=\"M2 3.80371V11.7848\"", 'database'], // IconDatabaseOutlineMedium
  ["d=\"M11.8798 9.55347V2.71525", 'deliver-doc'], // IconDeliverDocMedium
  ["d=\"M2.46302 8.06749L3.60171", 'thumb-down'], // IconDislikeFillMedium
  ["d=\"M8 1.95317V10.0469\"", 'download'], // IconDownloadOutlineMedium
  ["d=\"M8.85596 2.69971H4.19971", 'edit'], // IconEditOutlineMedium
  ["d=\"M3 9C3.55228 9 4 8.55228", 'ellipsis'], // IconEllipsisOutlineMedium
  ["d=\"M1.98486 13.0463H8.4627\"", 'enhance'], // IconEnhanceOutlineMedium
  ["d=\"M6 3.5h7.5M6 8h7.5M6 12.", 'flat-list'], // IconFlatListOutlineMedium
  ["d=\"M1.50439 3.11059C1.50439", 'folder-closed'], // IconFolderCloseMedium
  ["d=\"M2.55912 7.93683C2.67584", 'folder-open'], // IconFolderOpenMedium
  ["d=\"M12.3994 13.5986H2.04956", 'folder-open'], // IconFolderOpenOutlineMedium
  ["d=\"M5 14.5H11\"", 'monitor'], // IconFollowsystemOutlineMedium
  ["d=\"M2.33154 9.40576V13.1685", 'fullscreen'], // IconFullscreenOutlineMedium
  ["d=\"M3.4041 13.096C2.49514 1", 'gauge'], // IconGaugeOutlineMedium
  ["d=\"M2.34619 8H13.6538\"", 'globe'], // IconGlobeOutlineMedium
  ["d=\"M11.5 8C11.5001 8.69227 ", 'goal'], // IconGoalOutlineMedium
  ["d=\"M12.5757 7.00012C12.5757", 'info'], // IconInfoOutlineMedium
  ["d=\"M4.67398 4.25061L1.36094", 'inspect'], // IconInspectOutlineMedium
  ["d=\"M13.3899 8H15.1499\"", 'sun'], // IconLightOutlineMedium
  ["d=\"M13.537 8.12098L12.3983 ", 'thumb-up'], // IconLikeFillMedium
  ["d=\"M6.59961 9.40051C6.82779", 'link'], // IconLinkOutlineMedium
  ["d=\"M8.97212 14.3693C9.17511", 'list-pen'], // IconListPenOutlineMedium
  ["d=\"M12.596 12.596C11.687 13", 'loading'], // IconLoadingOutlineMedium
  ["d=\"M2.35 8.675C3.075 11.3 5", 'microphone'], // IconMicrophoneOutlineMedium
  ["d=\"M8 5V11\"", 'new-session'], // IconNewChatOutlineMedium
  ["d=\"M12.3535 7.64645C12.5487", 'nowrap'], // IconNowrapFillMedium
  ["d=\"M5.5 1.5V14.5\"", 'panel-collapse'], // IconPanelLeftOutlineMedium
  ["d=\"M4.74024 9.11029L1.82882", 'paper-plane'], // IconPaperPlaneOutlineMedium
  ["d=\"M12.75 4.5V9.5C12.75 10.", 'paperclip'], // IconPaperclipOutlineMedium
  ["d=\"M6.5 5V11\"", 'pause'], // IconPauseOutlineMedium
  ["d=\"M3.25 7.16357C3.20417 7.", 'sliders'], // IconPersonalizationOutlineMedium
  ['d="M9.96976 1.70572L13.1554', 'pin'], // IconPinOutline / IconPinFill
  ["d=\"M10.3329 7.91346C10.3996", 'play'], // IconPlayOutlineMedium
  ["d=\"M7.84457 5.06199C11.6605", 'plugin-pinwheel'], // IconPluginPinwheelOutlineMedium
  ["d=\"M8 2V14\"", 'plus'], // IconPlusOutlineMedium
  ["d=\"M5.54492 2.06738C5.91034", 'add-workspace'], // IconProjectAddOutlineMedium
  ["d=\"M8 10.7416V11.7416\"", 'question'], // IconQuestionOutlineMedium
  ["d=\"M5 9H8\"", 'queue'], // IconQueueOutlineMedium
  ["d=\"M14.4999 1.5V5.1H10.8999\"", 'refresh'], // IconRefreshOutlineMedium
  ["d=\"M11.7256 2.77441C12.5538", 'right-up'], // IconRightUpOutlineMedium
  ["d=\"M6.58727 11.8586C9.55061", 'search'], // IconSearchOutlineMedium
  ["d=\"M6.97211 1.94476C7.55785", 'send'], // IconSendOutlineMedium
  ["d=\"M8 9.75012C8.9665 9.7501", 'gear'], // IconSettingsOutlineMedium
  ["d=\"M14.1256 7.58723C14.3483", 'share'], // IconShareOutlineMedium
  ["<path d=\"M6.80132 2.14853C7.70663 1.80917 8.70422 1.80919 9.60952 2.14859L14.1296 3.84317V7.11961C14.1296 11.6089 10.7615 13.5975 8.20543 14.5779C5.64931 13.5975 2.28052 11.6089 2.28052 7.11961V3.84317L6.80132 2.14853Z\" stroke=\"currentColor\" stroke-linejoin=\"round\">", 'shield'], // IconShieldOutlineMedium
  ["d=\"M12.1404 1.19446C12.9442", 'skill'], // IconSkillOutlineMedium
  ["d=\"M2.3 11h1.65M7.85 11h5.8", 'sliders-two'], // IconSlidersTwoOutlineMedium
  ["d=\"M5.875 3C5.875 6.33333 7", 'sparkle'], // IconSparkleMedium
  ["d=\"M12.5 2.5H3.5C2.94772 2.", 'stop'], // IconStopFillMedium
  ["d=\"M10.7554 5.24466C13.9891", 'think'], // IconThinkOutlineMedium
  ["d=\"M5.41602 3.88833V2.47962", 'trash'], // IconTrashOutlineMedium
  ["d=\"M0.5 0V7C0.5 7.79565 0.8", 'tree-corner'], // IconTreeCornerMedium
  ["d=\"M5.5 4.5C5.5 4.40714 5.5", 'caret-right'], // IconTriangleRightFillMedium
  ["d=\"M15.8659 2.05975C17.2603", 'unarchive'], // IconUnarchiveOutlineMedium
  ["d=\"M8 8.5C9.65685 8.5 11 7.", 'user'], // IconUserOutlineMedium (<= 0.1.6)
  ["d=\"M8 8.25C9.51878 8.25 10.75 7.01878 10.75", 'user'], // IconUserOutlineMedium (0.1.7)
  ["d=\"M6 8.25C7.51878 8.25 8.75 7.01878 8.75", 'users'], // IconUsersOutlineMedium
  ["d=\"M8 10.708V11.708\"", 'warning'], // IconWarningOutlineMedium
  ["d=\"M8 6v3m0 2.33h.01\"", 'warning-triangle'], // IconWarningTriangleOutlineMedium
  ["d=\"M8.7 8.1v3M11.2 8.1v3\"", 'workspace-tree'], // IconWorkspaceTreeOutlineMedium
  ["d=\"M10.9999 8C10.9999 6.895", 'wrap'], // IconWrapFillMedium
  ["d=\"M2.3457 11.7369H6.4849\"", 'wrap-lines'], // IconWrapLinesOutlineMedium
  ["d=\"M8 4.39209V9.89209\"", 'permission-full'], // PermissionIconFullAccessMedium
  ["d=\"M5.08545 8.13775L7.18455", 'permission-read'], // PermissionIconReadOnlyMedium
  ["d=\"M6.4209 1.68067C7.43922 ", 'permission-write'], // PermissionIconWorkspaceWriteMedium
  ["d=\"M8.3125 0.980183C8.66767", 'send'], // ComposerSend
  ["<rect x=\"3\" y=\"3\" width=\"10\" height=\"10\" rx=\"3\" fill=\"currentColor\">", 'stop'], // ComposerStop
  ["d=\"M8 1.5V14.5\"", 'compare-split'], // DockSplit
  ["d=\"M4.56 3.48H11.44A1.6 1.6", 'dock-center'], // DockZonecenter
  ["d=\"M4 0.523H8V15.477H4A4 4 ", 'dock-left'], // DockZoneleft
  ["d=\"M8 0.523H12A4 4 0 0 1 16", 'dock-right'], // DockZoneright
  ["d=\"M0 8V4.523A4 4 0 0 1 4 0", 'dock-top'], // DockZonetop
  ["d=\"M0 8H16V11.477A4 4 0 0 1", 'dock-bottom'], // DockZonebottom
  ["d=\"M12.1654 5.7552L8.9447 9", 'sandbox-on'], // SandboxEnabled
  ["d=\"M10.6074 4.40278L8.00975", 'sandbox-off'], // SandboxDisabled
]

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, ' ').trim()
}

/** Serialize only React-owned host drawing, excluding our appended art. */
function hostHtml(svg: SVGElement): string {
  const clone = svg.cloneNode(true) as SVGElement
  clone.querySelectorAll(`[${ICON_ART_ATTRIBUTE}]`).forEach((node) => node.remove())
  return normalizeHtml(clone.innerHTML)
}

function matchIcon(html: string): string | null {
  for (const [key, name] of ICON_KEYS) {
    if (html.includes(key)) return name
  }
  return null
}

/**
 * A glyph can mean different things by position. The composer's command button
 * draws the generic plus, which reads as an add/attach affordance next to the
 * paperclip, so it becomes the command prompt while every other plus keeps its
 * meaning. The sparkle is the same story: the trajectory view uses it for
 * assistant messages, but every tool row (`dsh-client-ui-tool`'s ToolRow, marked
 * with `data-tool`) borrows it for its icon, and those rows become the wrench
 * the host itself draws for tools.
 */
function contextualName(svg: SVGElement, name: string): string {
  if (name === 'pin') {
    return svg.querySelector(':scope > path')?.getAttribute('fill') === 'currentColor' ? 'pin-filled' : name
  }
  if (name === 'sparkle') {
    return svg.closest('[data-tool]') !== null ? 'wrench' : name
  }
  if (name !== 'plus') return name
  const trigger = svg.closest("button[aria-haspopup='listbox']")
  return trigger !== null && trigger.closest('[data-composer-seat]') !== null ? 'command' : name
}

/**
 * The context meter's ring: a track circle plus a dashed progress circle. Its
 * class name is a CSS-module hash that moves with the host's build (path,
 * toolchain and content all feed it), so the drawing — not the class — is the
 * identity. StateDot also has two circles, but drives its arc from CSS rather
 * than the progress circle's stroke-dasharray attribute.
 */
function isUsageRing(svg: SVGElement): boolean {
  return svg.querySelectorAll('circle').length === 2
    && svg.querySelector('circle[stroke-dasharray]') !== null
}

/** Resolve the ORCA art name for one host SVG, or null when nothing matches. */
function resolveIconName(svg: SVGElement): string | null {
  if (isUsageRing(svg)) return 'usage'
  const matched = matchIcon(hostHtml(svg))
  return matched === null ? null : contextualName(svg, matched)
}

/**
 * Fit the 16-unit design grid onto the host viewBox: uniform scale to the
 * smaller axis, centered on the other (icons with portrait/landscape
 * viewBoxes stay centered like the host's own meet-fit).
 */
function artTransform(svg: SVGElement): string {
  const viewBox = svg.getAttribute('viewBox')
  if (!viewBox) return ''
  const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat)
  const [x, y, width, height] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 0]
  if (!(width > 0) || !(height > 0)) return ''
  const scale = Math.min(width, height) / 16
  const offsetX = x + (width - 16 * scale) / 2
  const offsetY = y + (height - 16 * scale) / 2
  if (scale === 1 && offsetX === 0 && offsetY === 0) return ''
  return `translate(${offsetX} ${offsetY}) scale(${scale})`
}

function buildArt(name: string, svg: SVGElement): SVGGElement {
  const art = document.createElementNS(SVG_NS, 'g')
  const transform = name === 'tree-corner' ? '' : artTransform(svg)
  art.setAttribute(ICON_ART_ATTRIBUTE, '')
  art.setAttribute('fill', 'none')
  art.setAttribute('stroke', 'currentColor')
  art.setAttribute('stroke-width', /scale\(0\.[0-7]/.test(transform) ? '1.7' : '1.5')
  art.setAttribute('stroke-linejoin', 'miter')
  art.setAttribute('stroke-linecap', 'square')
  if (transform) art.setAttribute('transform', transform)
  art.innerHTML = ICON_ART[name] ?? ''
  if (name === 'usage') art.append(buildUsageCells())
  return art
}

function usageCircle(svg: SVGElement): SVGElement | null {
  return Array.from(svg.querySelectorAll('circle'))
    .find((circle) => circle.hasAttribute('stroke-dasharray')) ?? null
}

/** ContextMeter emits the filled arc followed by the full circumference. */
function usageFraction(circle: Element): number | null {
  const parts = (circle.getAttribute('stroke-dasharray') ?? '').match(/[\d.]+/g)
  if (!parts || parts.length < 2) return null
  const dash = Number.parseFloat(parts[0] ?? '0')
  const total = Number.parseFloat(parts[1] ?? '0')
  if (!Number.isFinite(total) || total <= 0) return null
  return Math.min(Math.max(dash / total, 0), 1)
}

/** Mirror the host ring's dash fraction onto the pixel cell field. */
function syncUsageFill(svg: SVGElement, art: SVGGElement): void {
  const cells = art.querySelectorAll<SVGElement>('rect[data-orca-link-usage-cell]')
  const circle = usageCircle(svg)
  if (cells.length === 0 || !circle) return
  const fraction = usageFraction(circle)
  if (fraction === null) return
  const level = fraction * USAGE_CELLS
  const solid = Math.floor(level + 1e-9)
  const partial = level - solid
  cells.forEach((cell, index) => {
    let opacity = USAGE_EMPTY_OPACITY
    if (index < solid) opacity = 1
    else if (index === solid && partial > 0) opacity = Math.max(partial, USAGE_MIN_PARTIAL)
    cell.setAttribute('opacity', String(Math.round(opacity * 100) / 100))
  })
}

/**
 * Install the icon redraw: an initial pass plus a subtree observer that
 * re-skins icons React (re)mounts. Returns a disposer that removes every
 * art group and marker attribute.
 */
export function installOrcaIcons(body: HTMLElement): () => void {
  const usageObservers = new Map<Element, MutationObserver>()

  const observeUsage = (svg: SVGElement, art: SVGGElement): void => {
    syncUsageFill(svg, art)
    const circle = usageCircle(svg)
    if (circle === null || usageObservers.has(circle)) return
    const observer = new MutationObserver(() => syncUsageFill(svg, art))
    observer.observe(circle, { attributes: true, attributeFilter: ['stroke-dasharray'] })
    usageObservers.set(circle, observer)
  }

  const syncPermissionHost = (svg: SVGElement, name: string): void => {
    // Host buttons carry no permission marker of their own; the CSS contract
    // reads `data-orca-permission` so no `:has()` has to re-scan the composer
    // subtree on every keystroke.
    if (!name.startsWith('permission-')) return
    const host = svg.closest('button, [role="menuitem"]')
    if (host instanceof HTMLElement) host.dataset.orcaPermission = name.slice('permission-'.length)
  }

  const applyToSvg = (svg: SVGElement): boolean => {
    const name = resolveIconName(svg)
    if (name === null) return false
    svg.setAttribute(ICON_ATTRIBUTE, name)
    const art = buildArt(name, svg)
    if (name === 'usage') observeUsage(svg, art)
    svg.append(art)
    syncPermissionHost(svg, name)
    return true
  }

  const reconcileSvg = (svg: SVGElement): void => {
    if (!svg.isConnected) return
    const art = svg.querySelector(`[${ICON_ART_ATTRIBUTE}]`)
    if (!(art instanceof SVGGElement)) {
      applyToSvg(svg)
      return
    }

    // Composer send/stop and several other host controls retain one SVG
    // element while React swaps only its owned children. Re-match that
    // drawing instead of treating our first marker as permanently final.
    const currentName = svg.getAttribute(ICON_ATTRIBUTE)
    const nextName = resolveIconName(svg)
    if (nextName !== currentName) {
      if (currentName?.startsWith('permission-') && !nextName?.startsWith('permission-')) {
        svg.closest('button, [role="menuitem"]')?.removeAttribute('data-orca-permission')
      }
      art.remove()
      svg.removeAttribute(ICON_ATTRIBUTE)
      if (nextName !== null) applyToSvg(svg)
      return
    }

    const transform = currentName === 'tree-corner' ? '' : artTransform(svg)
    if (transform) {
      if (art.getAttribute('transform') !== transform) art.setAttribute('transform', transform)
    } else art.removeAttribute('transform')

    // A retained usage SVG may receive a replacement host ring. Observe the
    // new ring without keeping the detached ring alive.
    if (currentName === 'usage') observeUsage(svg, art)
  }

  const collectContainingSvg = (node: Node, found: Set<SVGElement>): void => {
    if (!(node instanceof Element)) return
    const containing = node.closest('svg')
    if (containing instanceof SVGElement) found.add(containing)
  }

  const collectSvgSubtree = (node: Node, found: Set<SVGElement>): void => {
    if (!(node instanceof Element)) return
    collectContainingSvg(node, found)
    node.querySelectorAll('svg').forEach((svg) => {
      if (svg instanceof SVGElement) found.add(svg)
    })
  }

  const belongsToArt = (node: Node): boolean => (
    node instanceof Element && node.closest(`[${ICON_ART_ATTRIBUTE}]`) !== null
  )

  const pruneUsageObservers = (): void => {
    for (const [circle, observer] of usageObservers) {
      if (circle.isConnected) continue
      observer.disconnect()
      usageObservers.delete(circle)
    }
  }

  body.querySelectorAll('svg').forEach((svg) => {
    if (svg instanceof SVGElement) reconcileSvg(svg)
  })
  const mountObserver = new MutationObserver((records) => {
    if (!hasMutationOutsideTerminal(records)) return
    const changed = new Set<SVGElement>()
    for (const record of records) {
      if (belongsToArt(record.target)) continue
      const nodes = [...record.addedNodes, ...record.removedNodes]
      // Appending or replacing our own art creates child-list records too;
      // they must not schedule a second reconciliation pass.
      if (nodes.length > 0 && nodes.every(belongsToArt)) continue
      collectContainingSvg(record.target, changed)
      record.addedNodes.forEach(node => collectSvgSubtree(node, changed))
    }
    changed.forEach(reconcileSvg)
    pruneUsageObservers()
  })
  mountObserver.observe(body, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['d', 'fill', 'stroke', 'viewBox'],
  })

  return () => {
    mountObserver.disconnect()
    for (const observer of usageObservers.values()) observer.disconnect()
    usageObservers.clear()
    body.querySelectorAll(`[${ICON_ART_ATTRIBUTE}]`).forEach((node) => node.remove())
    body.querySelectorAll(`[${ICON_ATTRIBUTE}]`).forEach((node) => node.removeAttribute(ICON_ATTRIBUTE))
    body.querySelectorAll('[data-orca-permission]').forEach((node) => node.removeAttribute('data-orca-permission'))
  }
}
