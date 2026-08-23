# dsh-deep-whale Installation

Install the complete root bundle directly; no AI-assisted installation is required:

```sh
dsh plugin --profile web add "github:Small-tailqwq/dsh-deep-whale"
```

The bundle installs skin-manager and every Deep Whale skin as real child packages pinned to the same repository release tag. This preserves each child's own `dsh.client` manifest, so DSH adds its browser entry to the startup roster. The root patch enables the manager and disables both skins, so the first startup uses the official DSH appearance. Restart DSH once, then choose a skin in Settings → Skin Management. Later switches hot-reload.

For a local development checkout, do **not** add the repository root: the root's child packages are pinned to a release tag, and a local link install never resolves them (startup fails with `Cannot find package '@dsh-external/dsh-client-ui-skin-...'`). Install the standalone sub-package directories instead — see "Standalone packages (compatibility and development)" in [README.en.md](README.en.md) (or 独立子包安装 in [README.md](README.md)): stage mutual exclusion, then add `skin-manager` and the target skin sub-directories by absolute path.

Use the bundled `.agents/skills/dsh-skin-install` skill only for legacy-package migration, local development builds, specified-commit testing, or diagnosis. See [README.md](README.md) or [README.en.md](README.en.md) for compatibility and verification details.
