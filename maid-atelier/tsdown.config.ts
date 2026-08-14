import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@dsh-external/dsh-client-ui-skin-maid-atelier', ['src/index.ts'], {
  portableCssModuleIds: true,
})
