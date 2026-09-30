import type { Context } from '@deepseek-ai/cordis'
import { installRelationalMarkers } from '../../../shared/relational-markers.ts'

export function installMaidRelationalMarkers(ctx: Context): void {
  installRelationalMarkers(ctx, [
    {
      scope: "[data-phase='hero']",
      rules: [{ selector: "[class*='headline']:has(> [class*='fish'])", attribute: 'data-maid-hero-headline' }],
    },
    {
      scope: '[data-composer-card]',
      rules: [
        { selector: "button:has([class*='triggerIcon'])", attribute: 'data-maid-mode-trigger' },
        { selector: "button:has(> svg circle[class$='_track'])", attribute: 'data-maid-context-track' },
        { selector: "button:has(> svg circle[class$='_fill'])", attribute: 'data-maid-context-fill' },
        { selector: "span:has(> button[class$='_trigger'][aria-haspopup='dialog'] > svg circle[class$='_track'])", attribute: 'data-maid-context-meter' },
      ],
    },
    {
      scope: "[data-slot='sidebar.settings']",
      rules: [
        { selector: "button:has(> [data-slot='settings.trigger'])", attribute: 'data-maid-settings-trigger' },
        { selector: ":scope > :has(> [data-slot='settings.launcher'])", attribute: 'data-maid-settings-launcher-row' },
        { selector: ":scope > :has(> :is(button[data-phase], [role='status']))", attribute: 'data-maid-settings-status-row' },
      ],
    },
  ])
}
