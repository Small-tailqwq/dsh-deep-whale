# dsh-deep-whale Installation

Install the complete root bundle directly; no AI-assisted installation is required:

```sh
dsh plugin --profile web add "github:Small-tailqwq/dsh-deep-whale"
```

The bundle installs skin-manager and every Deep Whale skin as real child packages pinned to the same repository release tag. This preserves each child's own `dsh.client` manifest, so DSH adds its browser entry to the startup roster. The root patch enables the manager and disables both skins, so the first startup uses the official DSH appearance. Restart DSH once, then choose a skin in Settings → Skin Management. Later switches hot-reload.

For a local development checkout, add the repository root by absolute path instead of the GitHub spec:

```powershell
dsh plugin --profile web add C:/absolute/path/dsh-deep-whale
```

Use the bundled `.agents/skills/dsh-skin-install` skill only for legacy-package migration, local development builds, specified-commit testing, or diagnosis. See [README.md](README.md) or [README.en.md](README.en.md) for compatibility and verification details.
