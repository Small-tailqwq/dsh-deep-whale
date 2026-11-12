import { afterAll, expect } from 'vitest'
import { recordFixtures } from '../../scripts/style-audit/fixture-recorder.mjs'

recordFixtures({ afterAll, state: () => expect.getState() })
