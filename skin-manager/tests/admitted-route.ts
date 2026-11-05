import { makeSkinManagerRoute } from '../src/index.ts'

/** Existing functional fixtures represent an admitted owner request. */
export function makeAdmittedSkinManagerRoute(...args: Parameters<typeof makeSkinManagerRoute>) {
  return makeSkinManagerRoute(args[0], args[1], args[2], args[3], args[4], () => undefined)
}
