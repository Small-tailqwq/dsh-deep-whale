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
 * icons/index.tsx and the live GUI). Unmatched glyphs — the brand wordmark,
 * hero glow, whale mark, and the pre-expanded tree-corner connector, which
 * is already rectilinear — keep the host drawing.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
const ICON_ATTRIBUTE = 'data-orca-link-icon'
const ICON_ART_ATTRIBUTE = 'data-orca-link-icon-art'
const USAGE_KEY = 'JObwrW_track'

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
  'panel-expand': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M10 2.25h3.75v11.5H10z" fill="currentColor" stroke="none"/>',
    '<path d="M4.25 8h4M6.25 5.5 8.75 8l-2.5 2.5"/>',
  ].join(''),
  'panel-bottom': [
    '<path d="M1.75 2h12.5v12H1.75z"/>',
    '<path d="M3.25 10h9.5v2.5H3.25z" fill="currentColor" stroke="none"/>',
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
  folder: ['<path d="M2 3.5h4.25L8 5.25h6V13.5H2z"/>'].join(''),
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
  data: [
    '<rect x="2.5" y="2.5" width="11" height="4"/>',
    '<rect x="2.5" y="9" width="11" height="4"/>',
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
  think: [
    '<path d="M2.5 2.5h11v11h-11z"/>',
    '<path d="M8 4.75v2M8 9.25v2M4.75 8h2M9.25 8h2"/>',
    '<path d="M7 7h2v2H7z" fill="currentColor" stroke="none"/>',
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
  stop: ['<path d="M3.75 3.75h8.5v8.5h-8.5z" fill="currentColor" stroke="none"/>'].join(''),
  paperclip: ['<path d="M4.75 13.75V4.25h6.5v7.5M7.25 13.75V6.75"/>'].join(''),
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
  'todo-pending': [
    '<path d="M2.25 6V2.25H6M10 2.25h3.75V6M13.75 10v3.75H10M6 13.75H2.25V10"/>',
  ].join(''),
  'todo-progress': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<rect data-orca-link-todo-progress-cell="0" x="4" y="10" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="1" x="7" y="10" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="2" x="10" y="10" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="3" x="4" y="7" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="4" x="7" y="7" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="5" x="10" y="7" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="6" x="4" y="4" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="7" x="7" y="4" width="2" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-todo-progress-cell="8" x="10" y="4" width="2" height="2" fill="currentColor" stroke="none"/>',
  ].join(''),
  'todo-completed': [
    '<path d="M2.25 2.25h11.5v11.5H2.25z"/>',
    '<path d="M4.75 8.25 7 10.5l4.5-5"/>',
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
  usage: ['<rect x="2.5" y="2.5" width="11" height="11"/>'].join(''),
  /**
   * Busy spinner: replaces the host's orbiting-dot loader with a square
   * outline whose four edges light up clockwise in hard steps (animated by
   * the stylesheet via the sequence attributes).
   */
  spinner: [
    '<rect data-orca-link-spinner-seq="0" x="2" y="2" width="12" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-spinner-seq="1" x="12" y="2" width="2" height="12" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-spinner-seq="2" x="2" y="12" width="12" height="2" fill="currentColor" stroke="none"/>',
    '<rect data-orca-link-spinner-seq="3" x="2" y="2" width="2" height="12" fill="currentColor" stroke="none"/>',
  ].join(''),
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

/** Host path-data fragments (as rendered, single-spaced) to icon names. */
const ICON_KEYS: ReadonlyArray<readonly [string, string]> = [
  // Sidebar and shell chrome.
  ['M9.67272 0.522841C10.8339', 'panel-collapse'],
  ['M8.00003 0.3237C3.76075', 'new-session'],
  ['M11.894845 6.647401C11.894845 3.725463', 'search'],
  ['M3.55246 0L3.55246 2.44252', 'add-workspace'],
  ['M5.19629 1.57104C5.81144', 'folder-open'],
  ['M5.05582 0.518756L4.50669 0.86654', 'folder-closed'],
  ['x="3.25" y="10"', 'panel-bottom'],
  ['x="10.5" y="3.25"', 'panel-expand'],
  // Settings dialog.
  ['clip0_1450_63327', 'gear'],
  ['clip0_2580_121189', 'gear'],
  ['M10.3232 9.18164C11.2868', 'sliders'],
  ['mask0_agent_preset_16', 'agent-preset'],
  ['M11.3496 8C11.3496 6.14985', 'sun'],
  ['M13.2764 9.52324C12.5607', 'moon'],
  ['M12.1665 13.5811V14.7803H3.66651', 'monitor'],
  ['M12.0997 8.54554C12.2905', 'data'],
  // Composer and message actions. Send16 appears with two float-drift
  // revisions (0.980183 deployed build, 0.981587 primitives source).
  ['M8.3125 0.980183C8.66767', 'send'],
  ['M8.3125 0.981587C8.66767', 'send'],
  ['M7.24707 1.01771C7.52897', 'send'],
  ['M7.00049 0.199829C3.24488', 'queue'],
  ['M8.64453 1.5V7.34961H14.5V8.65039', 'plus'],
  ['M12.1654 5.7552L8.9447', 'permission-read'],
  ['M8.08887 0.251709C8.20479', 'permission-write'],
  ['M9.10094 4.5V8.75939', 'permission-full'],
  ['M8.20554 0.899994L14.7901 3.36857', 'shield'],
  ['M4 4l8 8M12 4l-8 8', 'close'],
  ['M10.6074 4.40278L8.00975', 'close'],
  ['M14.1168 13.197L13.197 14.1167', 'close'],
  ['M6.14929 4.02032C7.11197', 'copy'],
  ['M9.94076 1.34942C10.7047', 'edit'],
  ['M14.4782 4.84067L14.2138 10.1152', 'trash'],
  ['M7.92136 0.349152C10.3744', 'refresh'],
  ['M1.272 6.21348C1.70645 3.08888', 'refresh'],
  ['M8.27868 0.811572C8.81991', 'thumb-up'],
  ['M14.0593 12.922L15.0976 10.1247', 'thumb-up'],
  ['M7.72451 15.1086C7.18929', 'thumb-down'],
  ['M1.92838 3.06811L0.88799 5.87104', 'thumb-down'],
  ['M13.0762 1.37207C14.0846', 'branch'],
  ['M12.3368 1.53569L11.931 4.43172', 'code'],
  ['M11.2426 4.80473V6.10551H4.75819', 'browse'],
  ['M7.06431 5.93342C7.68763', 'think'],
  ['M8.00192 6.64454C8.75026', 'think'],
  ['x="3" y="3" width="10" height="10" rx="3"', 'stop'],
  ['M2 4.88C2 3.68009', 'stop'],
  ['M15.3695 11.411L15.1234 12.8866', 'download'],
  ['M5.5498 9.75V5H6.9502', 'paperclip'],
  ['M2.871 13.1286', 'loading'],
  // Agent protocol nodes: todo, question, goal, skills.
  ['M13.3277 9.69629V10.976H7.28086', 'checklist'],
  ['stroke-dasharray="2.4 2.4"', 'todo-pending'],
  ['x1="2.5" y1="12" x2="10.5" y2="3.5"', 'todo-progress'],
  ['M10.9631 5.71411L7.70154 8.97571', 'todo-completed'],
  ['M12.5757 7.00012C12.5757 3.92085', 'question'],
  ['M8 0C8.31451 0 8.62464', 'goal'],
  ['M10.8239 3.54733V4.78443H4.63437', 'list-pen'],
  ['M6.1 3.1Q6.6 7.8 11.3 8.3', 'sparkle'],
  ['M16 8L10.8571 12V10.552', 'inspect'],
  ['M12.5113 15.4067C12.4395 15.6249', 'skill'],
  ['M15.8659 2.05975C17.2603', 'archive'],
  // Generic affordances.
  ['M4.55146 8.00001C4.55146 8.63513', 'ellipsis'],
  ['M4.25 2.82782L4.25 11.1722', 'caret-right'],
  ['M11.8486 5.5L11.4238 5.92383', 'chevron-down'],
  ['M2.15137 8.5L2.57617 8.07617L5.30273 5.34863', 'chevron-up'],
  ['M8.5 2.15137L8.07617 2.57617', 'chevron-left'],
  ['M5.5 2.15137L5.92383 2.57617', 'chevron-right'],
  ['M15.0498 3.92579', 'check'],
  ['M11.5635 4.58984', 'check'],
  ['M4.5 6.25 6.75 8 4.5 9.75', 'terminal'],
  ['M11.4818 5.57813C11.4818 4.45301', 'terminal'],
  ['ellipse cx="8" cy="8" rx="2.8" ry="6.5"', 'globe'],
  ['M8.19727 5.86969', 'link'],
  ['M9.94133 6.50173', 'link'],
  ['M7.95889 1.52285C7.95888 0.826234', 'share'],
  ['M6.54199 8.62824', 'right-up'],
  ['M13.588429 5.147807', 'right-up'],
  ['M14.9943 1.92389V3.32428H1.00598', 'enhance'],
  ['M14.1446 8C14.1446 4.6062', 'play'],
  ['M14.1448 8.00024', 'pause'],
  ['M2.58875 12.3407L6.59167 8.33777', 'fullscreen'],
  ['M6.3002 3.32843L7.69986 3.32843', 'warning'],
  ['M11.0307 5.46369C11.0305 3.78995', 'user'],
  [USAGE_KEY, 'usage'],
  ['_cell_10orb', 'spinner'],
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
  const transform = artTransform(svg)
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

/** Host ring dash fraction (dash / full circumference), clamped to 0..1. */
function usageFraction(circle: Element): number | null {
  const parts = (circle.getAttribute('stroke-dasharray') ?? '').match(/[\d.]+/g)
  if (!parts || parts.length < 2) return null
  const dash = Number.parseFloat(parts[0] ?? '0')
  const total = dash + Number.parseFloat(parts[1] ?? '0')
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

  const applyToSvg = (svg: SVGElement): boolean => {
    const name = matchIcon(hostHtml(svg))
    if (!name) return false
    svg.setAttribute(ICON_ATTRIBUTE, name)
    const art = buildArt(name, svg)
    if (name === 'usage') observeUsage(svg, art)
    svg.append(art)
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
    const nextName = matchIcon(hostHtml(svg))
    if (nextName !== null && nextName !== currentName) {
      art.remove()
      svg.removeAttribute(ICON_ATTRIBUTE)
      applyToSvg(svg)
      return
    }

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
  mountObserver.observe(body, { childList: true, subtree: true })

  return () => {
    mountObserver.disconnect()
    for (const observer of usageObservers.values()) observer.disconnect()
    usageObservers.clear()
    body.querySelectorAll(`[${ICON_ART_ATTRIBUTE}]`).forEach((node) => node.remove())
    body.querySelectorAll(`[${ICON_ATTRIBUTE}]`).forEach((node) => node.removeAttribute(ICON_ATTRIBUTE))
  }
}
