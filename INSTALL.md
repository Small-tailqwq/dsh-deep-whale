# dsh-deep-whale Installation

The one-line install pulls the skin manager and all Deep Whale skins directly from GitHub as `#path:` sub-packages — no clone, no AI assistance. Requires **pnpm ≥ 9**.

> AI assistants: follow this file as the installation guide. A plain install is just the one-liner below; use the bundled `.agents/skills/dsh-skin-install` skill only for legacy migration, local development builds, specified-commit testing, or diagnosis.

## Linux / macOS / WSL

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

## PowerShell

```powershell
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

Restart DSH once (first package addition). On that restart the skin manager detects "two skins enabled at once" and atomically falls back to the official default, so skins can never stack; then choose a skin in Settings → Skin Management. Later switches hot-reload without a restart.

Update with:

```sh
dsh plugin --profile web update @dsh-external/dsh-client-ui-skin-deep-whale-manager @dsh-external/dsh-client-ui-skin-maid-atelier @dsh-external/dsh-client-ui-skin-orca-link
```

```powershell
dsh plugin --profile web update '@dsh-external/dsh-client-ui-skin-deep-whale-manager' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-orca-link'
```

See [README.md](README.md) ([README.en.md](README.en.md)) for the mutual-exclusion explanation, standalone/local-development install path, verification and troubleshooting.

The bundled `.agents/skills/dsh-skin-install` skill is for legacy-package migration, local development builds, specified-commit testing, or diagnosis — not for a regular first install.
