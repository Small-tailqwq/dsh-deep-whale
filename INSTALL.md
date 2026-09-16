# dsh-deep-whale Installation

The one-line install pulls the stable `latest` release of the skin manager and both Deep Whale skins from npm — no clone or AI assistance required.

> **Distribution boundary:** these instructions are only for standalone environments that run DSH directly. If `@linxin666/dsh-web-all` (dsh-web) is installed, stop here and install dsh-web's adapted `maid-atelier` and `orca-link` through its own skin center/installer. Do not add this repository's standalone packages to the same profile.

> AI assistants: follow this file as the installation guide. A plain install is just the one-liner below; use the bundled `.agents/skills/dsh-skin-install` skill only for legacy migration, local development builds, specified-commit testing, or diagnosis.

## Linux / macOS / WSL

```sh
dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-orca-link'
```

## PowerShell

```powershell
dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-deep-whale-manager'; dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-maid-atelier'; dsh plugin --profile web add '@wjingshan/dsh-client-ui-skin-orca-link'
```

Restart DSH once (first package addition). On that restart the skin manager detects "two skins enabled at once" and atomically falls back to the official default, so skins can never stack; then choose a skin in Settings → Skin Management. Later switches hot-reload without a restart.

Update with:

```sh
dsh plugin --profile web update @wjingshan/dsh-client-ui-skin-deep-whale-manager @wjingshan/dsh-client-ui-skin-maid-atelier @wjingshan/dsh-client-ui-skin-orca-link
```

```powershell
dsh plugin --profile web update '@wjingshan/dsh-client-ui-skin-deep-whale-manager' '@wjingshan/dsh-client-ui-skin-maid-atelier' '@wjingshan/dsh-client-ui-skin-orca-link'
```

## Migrating from the old placeholder scope

Installations made from GitHub before `0.1.3` use `@dsh-external/*` dependency keys. That scope was only a source-level placeholder for this project. Remove all three old keys before adding the npm packages above; otherwise DSH can retain duplicate plugin identities.

```sh
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-orca-link'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-maid-atelier'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-deep-whale-manager'
```

Then run the one-line npm install and restart DSH once. Existing skin preferences remain keyed by skin id (`maid-atelier` / `orca-link`) and are not renamed.

See [README.md](README.md) ([README.en.md](README.en.md)) for the mutual-exclusion explanation, standalone/local-development install path, verification and troubleshooting.

The bundled `.agents/skills/dsh-skin-install` skill is for legacy-package migration, local development builds, specified-commit testing, or diagnosis — not for a regular first install.
