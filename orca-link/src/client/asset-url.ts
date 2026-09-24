/** Resolve against the host base, including reverse-proxy mounts and dsh-app desktop forwarding. */
export function skinAssetUrl(file: string): string {
  return new URL(`skin-assets/orca-link/${file}`, document.baseURI).href
}
