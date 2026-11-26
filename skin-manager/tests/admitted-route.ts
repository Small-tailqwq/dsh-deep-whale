import { makeSkinManagerRoute } from '../src/index.ts'

/** Existing functional fixtures represent an admitted owner request. */
export function makeAdmittedSkinManagerRoute(...args: Parameters<typeof makeSkinManagerRoute>) {
  const route = makeSkinManagerRoute(...args)
  return {
    ...route,
    handler: (req: Parameters<typeof route.handler>[0], res: Parameters<typeof route.handler>[1]) =>
      route.handler(req, res, { principal: { kind: 'owner' } }),
  }
}
