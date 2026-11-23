import { SKIN_MANAGER_ROUTE } from '../contract.ts'

/**
 * Resolve the Host route against the document base, as the official client
 * resolves its own channels: a root-absolute path escapes a reverse-proxy
 * prefix such as `/dsh/`.
 * @param base - the page base; the Host serves `<base href="./">`.
 */
export const skinManagerUrl = (base: string = document.baseURI): string =>
  new URL(SKIN_MANAGER_ROUTE.slice(1), base).href
