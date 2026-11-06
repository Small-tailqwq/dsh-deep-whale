# Host icon fixtures

`dsh-icons.json` contains complete SVG markup rendered with React
`renderToStaticMarkup` from the official DSH commit recorded in `hostCommit`.
`sources` records Git blob IDs; `component` identifies the export or inline
variant, and `name` is the reviewed expected ORCA redraw. Expected names are
independent of the production matcher. `symbols` records all 194 official
symbol drawings, and `symbolId` links each primitive variant to its artwork.

The 264 variants cover every exported primitive/permission icon, both compact
AppsAdd weights, all four
composer SVG branches, dock split/five drop zones, browser sandbox states,
the shared ongoing StateDot at its default and installation-dialog sizes,
library-external controls, quote marks, guide navigation, forge change/check
states, password visibility, shortcut feedback, and context
usage at 0/25/100%. Selected inline drawings come from the host TypeScript AST;
caller layout attributes, classes, refs and handlers are omitted while drawing
children and geometry constants are retained. `site` links rendered variants
to their source SVG. Dynamic usage updates have additional cases in `apply.spec.ts`.

`loaders` captures representative native HTML structures for the file-upload
card and platform authorization overlay, with placeholder CSS module hashes.
Their TSX and CSS blob IDs pin the reviewed contracts. A changed blob requires
review before the fixture can certify a new host. Tests exercise the actual
loader decoration, progress preservation, remounting, failure cleanup and disposal.

Run from `orca-link` against a local official Git object database:

```sh
npm run test:host-icons -- --source /path/to/deepseek-harness
npm run test:host-icons -- --source /path/to/deepseek-harness --ref dsh-v0.2.2-alpha.2
```

The default ref comes from the fixture's `hostCommit`. The command reads
committed blobs without switching the host checkout or loading its build or
dependencies. It renders fresh SVGs in memory and runs the production redraw
tests against them. Added/removed exports, missing semantic names and wrong
redraws fail with component names. A changed drawing that still resolves to
the correct artwork passes. Only use official source: rendering executes the
selected icon components.

For an upgrade, add `--write` to save the new fixture, review new `name: null`
entries and removed callers, update NOTICE attribution, then rerun the tests.
This refresh never guesses expected meanings from the matcher. Composer
inline branches are in source order; an unrecognized count records an error
while preserving the other inventories. The normal test suite checks the
pinned fixture version against the package's DSH peer minimum. Alpha builds
use that declaration because the skin manifest only accepts RC version syntax.
HTML loader structures keep their reviewed source bindings during refresh;
update them only after inspecting the new native DOM and CSS.

The command covers the listed icon sources; new inline SVGs in other host
files still require source review. Runtime matching uses semantic IDs for
public symbols and artwork fragments for inline SVGs. Unknown artwork stays native.
Tests check shared-sprite ownership, symbol updates, caller geometry and cleanup.
No browser observers or host services are added by the audit.

For a wider source inventory, run the repository's `dsh-icon-scan` skill.
It also lists inline SVGs outside these sources and CSS loading animations,
including unresolved dynamic drawings that need caller review.

The host SVG fixtures are MIT licensed by DeepSeek; see `DSH-LICENSE`.
