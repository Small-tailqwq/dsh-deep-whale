/** Same-origin host route used for catalog discovery and activation. */
export const SKIN_MANAGER_ROUTE = '/api/dsh/skins'

export type SkinTarget = 'official' | string

/** Safe manifest fields exposed to the browser; package paths never leave the host. */
export interface SkinCatalogEntry {
  id: string
  name: string
  nameEn?: string
  tagline?: string
  package: string
  wiringId: string
  bodyAttr: string
  order: number
}
