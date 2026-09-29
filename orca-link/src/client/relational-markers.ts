import type { Context } from '@deepseek-ai/cordis'
import { installRelationalMarkers } from '../../../shared/relational-markers.ts'

export function installOrcaRelationalMarkers(ctx: Context): void {
  installRelationalMarkers(ctx, [
    {
      scope: "[role='menu'][class$='_menu']",
      rules: [
        { selector: ":scope:has([class$='_cell'])", attribute: 'data-orca-menu-cells' },
        { selector: ":scope:has([class$='_groupTitle'])", attribute: 'data-orca-menu-groups' },
        { selector: ":scope:has([role='menuitemradio'] [class$='_modelName'])", attribute: 'data-orca-menu-models' },
        { selector: ":scope:has([class$='_cell'], [class$='_groupTitle'], [role='menuitemradio'] [class$='_modelName'])", attribute: 'data-orca-model-menu' },
      ],
    },
    {
      scope: "[data-slot='sidebar']",
      rules: [{
        selector: ":scope > :first-child:has(> :is(button[data-dsh-part='sidebar-entry'], [data-plugin-entry], nav[class*='panelList']))",
        attribute: 'data-orca-sidebar-entries',
      }],
    },
  ])
}
