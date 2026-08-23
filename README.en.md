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
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | ORCA LINK: pearl-white mechanical bay, obsidian orca operator and electric-blue link signals | CC BY-NC-SA 4.0 |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | Generic skin discovery, switching and skin-declared settings panel | MIT |

## Copyright Holders

| Copyright holder | Copyrighted content | Corresponding skin | Profile |
|---|---|---|---|
| 上善 (Shangshan) | Original whale-girl character design | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | Whale-girl maid redesign with DeepSeek elements | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*Please file issues/feedback through the GitHub issue tracker instead of contacting the two artists directly. That said, you are welcome to check out their whale-girl works, thanks!

## Installation

### One-command installation (recommended)

The repository root is a complete DSH bundle. It depends on skin-manager and every skin subpackage at the same repository release tag, preserving each package's own `dsh.client` declaration, then starts safely on the official default with both skins disabled.

```sh
dsh plugin --profile web add "github:Small-tailqwq/dsh-deep-whale"
```

Restart DSH once after the first package installation, then open Settings → Skin Management and select maid-atelier or orca-link. Later switches hot-reload without a restart or an AI-assisted installer.

```sh
dsh plugin --profile web update @dsh-external/dsh-deep-whale
```

For local development, replace the GitHub spec with the absolute repository-root path.

### Skin mutual exclusion (must read)

- First, a distinction: `skin-manager` is not a skin — it is the **skin manager** (discovery, switching and customization panels) and should stay enabled permanently; mutual exclusion applies to the **skins themselves** — maid-atelier and orca-link in this repository.
- Skin enable/disable is controlled by patch layers: each of `~/.dsh/profiles/web/cordis.patch.yml` (profile layer) and `~/.dsh/cordis.patch.yml` (home layer) carries `- id: <wiring.id>` + `disabled: true/false` rows (**both layers must be written**; the home layer outranks the profile layer).
- **A skin without a `disabled` row in the patch is enabled by default.** If you install several skins at once (e.g. maid-atelier and orca-link) and never switch, they all run **simultaneously**: their decoration layers stack on top of each other and the sidebar/settings area gets mangled. Typical symptoms are **the settings button disappearing, abnormal sidebar width/layout, and a chaotic UI** (the stock UI is fine).
- The root bundle explicitly enables the manager and disables every skin, so a fresh install has no overlap window.
- skin-manager (Settings → Skin Management) writes the exclusion rows into both patch layers for you when activating; if you hand-edit the patch, keeping “only one skin enabled” requires **explicitly disabling every other skin**.
- Legacy standalone and marketplace installs are still guarded: skin-manager atomically falls back to "Official default" if multiple skins would be active.
- With skin-manager installed, skin customization items (e.g. the "less anime mode" visibility schedule) are stored in the current browser and applied by the manager.

### Standalone packages (compatibility and development)

> Regular users do not need this section. Never register the root bundle and these standalone bundles together: they insert the same wiring ids. To migrate, select Official Default, remove the three old packages, install the root bundle, and restart.

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale   # clone anywhere (shallow is enough, skips history)
node <abs path to clone>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <abs path to clone>/skin-manager   # persistent skin manager panel (recommended)
dsh plugin --profile web add <abs path to clone>/maid-atelier   # Abyssal Maid Atelier
dsh plugin --profile web add <abs path to clone>/orca-link      # ORCA LINK
```

> Run the `node` command before any `plugin add`. It preserves unrelated YAML and makes maid-atelier the only enabled skin. Use `--target orca-link` for ORCA LINK or `--target official` for the stock UI. Never overwrite the whole patch file. Skipping this staging step lets newly installed skins start enabled together.

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
dsh plugin --profile web list          # root install shows @dsh-external/dsh-deep-whale
dsh --profile web --dump-config        # manager=false; both skins initially true
```
After a cold start, also inspect the client roster in the browser console (configuration entries alone do not prove browser bundles were registered):

```js
window.__DSH_BOOT__.entries.map(({ id }) => id).filter((id) => id.includes('deep-whale') || id.includes('maid-atelier') || id.includes('orca-link'))
```

It must contain the manager and the active skin package; disabled skins may be absent. Refresh the browser to see the skin; skin toggles go through config hot reload, so no dsh restart is needed (restart only when adding/removing plugin packages).

### Install failure troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_PNPM_FETCH_404` | misspelled GitHub spec, unavailable network, or a bare standalone directory | copy the complete spec above; use absolute paths for development links |
| root and standalone packages both appear | a legacy installation was not migrated | select Official Default, remove the three old packages, and keep only the root bundle |
| `pnpm not found on PATH` | pnpm missing from the environment | install pnpm (`npm i -g pnpm`) and retry |
| package listed but no effect on the page | skin is `disabled` (multi-skin mutual exclusion) or the browser was not refreshed | check `disabled` in `--dump-config`; refresh |

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
