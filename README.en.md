# dsh-deep-whale · Whale-Girl Skin Series

[简体中文](README.md) · **[English](README.en.md)**

Whale-girl themed skin series for the DeepSeek Harness Web GUI (standalone distribution repository).

## Previews

Click an image for the full size.

| Skin | Light mode | Dark mode |
|---|---|---|
| maid-atelier | [![maid-atelier light mode](maid-atelier/preview/light.webp)](maid-atelier/preview/light.webp) | [![maid-atelier dark mode](maid-atelier/preview/dark.webp)](maid-atelier/preview/dark.webp) |
| orca-link | [![orca-link light mode](orca-link/preview/light.png)](orca-link/preview/light.png) | [![orca-link dark mode](orca-link/preview/dark.png)](orca-link/preview/dark.png) |

## Residents

| Skin | Package | Description | License |
|---|---|---|---|
| [maid-atelier](maid-atelier/) | `@dsh-external/dsh-client-ui-skin-maid-atelier` | Abyssal Maid Atelier: twin-maid backdrop, deep-sea navy lace UI and a chibi sidebar | CC BY-NC-SA 4.0 |
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | ORCA LINK: pearl-white mechanical bay, orca-girl character and electric-blue link signals | CC BY-NC-SA 4.0 |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | Generic skin discovery, switching and skin-declared settings panel | MIT |

## Copyright Holders

| Copyright holder | Copyrighted content | Corresponding skin | Profile |
|---|---|---|---|
| 上善 (Shangshan) | Original whale-girl character design | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | Whale-girl maid redesign with DeepSeek elements | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*Please file issues/feedback through the GitHub issue tracker instead of contacting the two artists directly. That said, you are welcome to check out their whale-girl works, thanks!

## Installation

### One-line install (recommended)

The three distribution packages (skin manager + both skins) install directly as GitHub dependencies — **no clone required**; each package is a `#path:` subdirectory of the repository. Requires **pnpm ≥ 9**: the subdirectory syntax landed in pnpm 9, and pnpm 8 treats `path:...` as a commit reference and fails.

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

**PowerShell** (`#` starts a comment, so every spec must be quoted; use `;` instead of `&&`):

```powershell
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

For a single skin, drop the line you do not need (keep skin-manager: switching and mutual exclusion rely on it).

This is a first-time package addition, so restart DSH once. On that restart the skin manager detects "two skins enabled at once" and **atomically falls back to the official default**, so a fresh install can never leave skins stacked; then open Settings → Skin Management and click Switch on your skin — hot reload applies it. Later switches need no restart and no AI assistance.

> Shortcut: you can swap `github:Small-tailqwq/dsh-deep-whale#path:/` for a **local clone directory** (see [Standalone sub-package install](#standalone-sub-package-install-dev-and-weak-network-fallback)). The GitHub one-liner and a local link are two ways to reference the same package names; mixing them means the last `add` wins.

### Update

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web update @dsh-external/dsh-client-ui-skin-deep-whale-manager @dsh-external/dsh-client-ui-skin-maid-atelier @dsh-external/dsh-client-ui-skin-orca-link
```

**PowerShell** (quote `@`-prefixed tokens):

```powershell
dsh plugin --profile web update '@dsh-external/dsh-client-ui-skin-deep-whale-manager' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-orca-link'
```

GitHub dependencies are pinned to the commit resolved at install time; `update` re-resolves the latest commit. You can also run `dsh plugin --profile web update` without a package name (updates the whole profile; identical if only these packages are installed). Bundle content updates hot-reload through config HMR; a restart is needed only when adding/removing plugin packages.

### Can't be bothered? Let an AI install it

Paste this into any AI (or dsh itself). [INSTALL.md](INSTALL.md) is the standard entry point: the AI reads it and is led to the bundled `dsh-skin-install` skill — a plain install runs the same one-liner above, while legacy migration, local development and specified-commit flows follow the skill (staged mutual exclusion, absolute-path links, cold-start verification).

```
Read https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md and install the skins from this repository following its guidance
```

### Skin mutual exclusion (must read)

- First, a distinction: `skin-manager` is not a skin — it is the **skin manager** (discovery, switching and customization panels) and stays enabled permanently; mutual exclusion applies to the **skins themselves** — maid-atelier and orca-link.
- Skin enable/disable is controlled by patch layers: each of `~/.dsh/profiles/web/cordis.patch.yml` (profile layer) and `~/.dsh/cordis.patch.yml` (home layer) carries `- id: <wiring.id>` + `disabled: true/false` rows (**both layers must be written**; the home layer outranks the profile layer).
- **A skin without a `disabled` row is enabled by default.** A single installed skin therefore works out of the box; installing both at once without ever switching leaves them running **simultaneously**: the decoration layers stack and the sidebar/settings area gets mangled. Typical symptoms: **settings button disappears, abnormal sidebar width/layout, chaotic UI** (the stock UI is fine).
- **skin-manager guards mutual exclusion**: the one-line install registers all three packages; on the first restart the manager merges the profile→home states and, if two or more skins would actually be enabled, atomically falls back to "Official default" and writes the exclusion rows. A legal zero-or-one-skin selection is never rewritten. No manual pre-staging is needed.
- skin-manager (Settings → Skin Management) writes the exclusion rows into both patch layers for you when activating; hand-editing “one skin only” requires **explicitly disabling every other skin**.
- With skin-manager installed, skin customization items (e.g. the "less anime mode" visibility schedule) are stored in the current browser and applied by the manager.

### Standalone sub-package install (dev and weak-network fallback)

> Regular users do not need this section: the GitHub one-liner is faster (no clone). This is for local development, specified-commit testing, or when GitHub access is unavailable. The GitHub specs and local links address the same package names — pick one and stick with it.

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale   # clone anywhere (shallow is enough, skips history)
node <abs path to clone>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <abs path to clone>/skin-manager   # persistent skin manager panel (recommended)
dsh plugin --profile web add <abs path to clone>/maid-atelier   # Abyssal Maid Atelier
dsh plugin --profile web add <abs path to clone>/orca-link      # ORCA LINK
```

> The `node` command is an **optional optimization**: staged before any `plugin add`, it makes the target skin the only enabled one so the first startup already shows it; it preserves unrelated YAML and never overwrites the whole patch. Skipping it is safe too — the skin-manager fallback returns to Official default on first startup, then switch in Settings → Skin Management. Use `--target orca-link` for ORCA LINK or `--target official` for the stock UI.

**Option A (recommended): Settings → Skin Management → click Switch on the skin you want.** The manager writes the mutual-exclusion `disabled` rows to both patch layers and hot reloads; just refresh the page.

**Option B: hand-write both patch layers.** Append the following rows to **both** `~/.dsh/profiles/web/cordis.patch.yml` **and** `~/.dsh/cordis.patch.yml` (both are required; the home layer overrides the profile layer):

```yaml
# Example: enable only maid-atelier; for orca-link move `false` to its row — exactly one of the two skins may be false
- id: ui-skin-maid-atelier
  disabled: false
- id: ui-skin-orca-link
  disabled: true
- id: ui-skin-deep-whale-manager
  disabled: false
```

> If the patch file is still dsh's default template (comments + a single `[]` line), **replace that `[]` line entirely with the list above** — "comments + `[]` + other rows" is invalid YAML and config parsing will fail (the server keeps the last good config running; fix the file and refresh).

Windows example (forward or back slashes both work; pnpm normalizes them):
```powershell
dsh plugin --profile web add C:/Users/<you>/code/dsh-deep-whale/skin-manager
dsh plugin --profile web add C:/Users/<you>/code/dsh-deep-whale/maid-atelier
```

### Installed too many / something looks broken

Symptoms: the settings button disappears, the sidebar is covered by decoration or has an abnormal width, the UI looks chaotic (recovers once skins are disabled).

1. Open Settings → Skin Management and click "Official default" or any skin — the manager writes the exclusion rows and hot reloads; refresh to recover;
2. If the manager is unavailable (or the config file was already corrupted), run `stage-mutual-exclusion.mjs` above with `--target official` or the desired skin to recover both patch layers;
3. Or simply remove the packages you don't want: `dsh plugin --profile web remove <package>`, then re-check the exclusion rows.

### Relative path rules (common pitfall)

- Relative paths (`./`, `../`-prefixed) resolve against **the directory dsh was invoked from**, not the skin repository directory.
- **Never use a bare directory name**: `dsh plugin --profile web add maid-atelier` is treated as an npm package name, hits the registry and fails with a 404. Use `./maid-atelier` (when already inside the skin repo), `../dsh-deep-whale/maid-atelier` (when dsh-deep-whale is a sibling), or an absolute path.
- `../dsh-deep-whale/maid-atelier` after `cd <harness>` only works if **dsh-deep-whale is a sibling of your harness directory**; if you cloned elsewhere, the relative path links to the wrong place (the command succeeds silently but the skin does nothing). When in doubt, use an absolute path.

### Post-install verification

```sh
dsh plugin --profile web list          # should list all three @dsh-external/dsh-client-ui-skin-* packages
dsh --profile web --dump-config        # manager row disabled: false; skins mutually exclusive — exactly one false
```

> Right after the one-line install, **before the first restart**, what `--dump-config` shows depends on your patch layers: in a clean environment both skins have no exclusion rows yet (enabled by default — a normal transitional state; the skin-manager fallback rewrites the rows at the first restart). If the home layer already carries exclusion rows (you installed and later removed this skin series before), that state is simply reused. After the cold start, inspect the client roster in the browser console (configuration entries alone do not prove browser bundles were registered). The startup page must reference `/plugins/<real package name>/client.js` for the manager and the active skin; the carrier differs across DSH versions (older builds put it in the `window.__DSH_BOOT__` JSON, 0.1.1rc2+ uses direct `<script src>` tags), so this one-liner works on both:

```js
document.documentElement.outerHTML.match(/\/plugins\/@dsh-external\/[^"'\s]+/g) ?? []
```

It must contain the manager and the active skin package; disabled skins may be absent. Refresh the browser to see the skin; skin toggles go through config hot reload, so no dsh restart is needed (restart only when adding/removing plugin packages).

### Install failure troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_PNPM_FETCH_404` | misspelled GitHub spec, unavailable network, or a bare standalone directory | copy the complete spec above; use absolute paths for development links |
| `The matching commit...` / cannot resolve ref | **pnpm < 9** — `#path:` subdirectory syntax unsupported | upgrade pnpm to ≥ 9 (`npm i -g pnpm@latest`) |
| `ERR_PNPM_EXOTIC_SUBDEP` | installing an aggregate "root package" that itself carries Git dependencies (pnpm 11 supply-chain policy; this repo ships no such package) | install the three `#path:` sub-packages as shown above |
| `pnpm not found on PATH` | pnpm missing from the environment | install pnpm (`npm i -g pnpm`) and retry |
| package listed but no effect on the page | skin is `disabled` (multi-skin mutual exclusion) or the browser was not refreshed | check `disabled` in `--dump-config`; refresh |
| PowerShell command truncated / errors | unquoted `#` starts a comment | always quote specs in single quotes |

## Contributors

Thanks to the following developers for their contributions to dsh-deep-whale:

<a href="https://github.com/Small-tailqwq/dsh-deep-whale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Small-tailqwq/dsh-deep-whale" />
</a>

### Valuable but unmerged PRs

These PRs conflicted with the existing upstream implementation and were not merged, but their feature requests have been implemented in this repository. Thanks to:

- **@yaoyiqun** — character position switching by selected model (#15)
- **@Chartreuse310** — conversation-area serif font (#22)
- **@Vergemesh** — immediate stock/whale-girl skin switching (#27)
- **@joejojoking-cloud** — top-trim decoration layering (#26), character-stage layering (#31) fixes

> This section is maintained by hand; update it when such PRs arrive.

## License

The skins in this repository are **derivative works**, published as a whole under CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike); commercial use is prohibited. See each skin's `NOTICE` for the attribution chain.

The skin scaffolding originates from [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui); this repository distributes finished skins only and does not include the scaffolding.
