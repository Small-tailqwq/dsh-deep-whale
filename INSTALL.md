# dsh-deep-whale Skin Installation Guide

> This file is the **standard installation entry point** for the dsh-deep-whale skin series. It only redirects dsh to the repository's bundled installation skill — the actual install flow is executed by `.agents/skills/dsh-skin-install`.
>
> **Communicate with the user in their language.**

## Have dsh run the installation

Tell dsh one of the following:

**1 Online (simplest)** — have dsh read this file directly:

```
Read https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md and install the skins following its guidance
```

**2 Local** — when online reads are unavailable, or you want to control where the clone lives: clone this repository locally first (reuse an existing clone if you have one), open the clone directory in dsh **as the workspace**, then say:

```
Load the skill at <clone directory>/.agents/skills/dsh-skin-install and install the skins from this repository
```

> When the dsh workspace **is** this repository, the `dsh-skin-install` skill is auto-discovered — no path needed.

## Fast paths (expected to finish within ~2 minutes)

- **Skin already installed**: just say "switch to maid-atelier" (or orca-link) — the skill hot-switches without reinstalling or restarting.
- **You already know which skin you want**: name it up front ("install maid-atelier") and the skill skips the selection question.

## What the skill does

1. Lists every skin in the repository and **asks which one the user wants to activate**;
2. Explains the attribution chain and license (CC BY-NC-SA 4.0, non-commercial);
3. Registers the chosen skin (together with the `skin-manager` skin manager) using an absolute path;
4. Writes the mutual-exclusion `disabled` rows into **both** patch layers (profile layer + home layer), leaving only the chosen skin enabled;
5. Verifies it is live (config hot reload — no dsh restart; later switches go through the same entry point).

## Why the skill flow matters / what mutual exclusion is

- Skins are enabled/disabled by `disabled` rows in the patch layers; **a skin with no row in the patch is enabled by default**.
- `skin-manager` is a skin **manager**, not a skin — it stays enabled permanently. Mutual exclusion applies to the skins themselves (maid-atelier and orca-link).
- Installing several skins at once and never switching leaves them all running **simultaneously**: their decoration layers stack up, and typical symptoms are **the settings button disappearing, abnormal sidebar width/layout, and a chaotic UI** (recovered once skins are disabled).
- Details: see [README.en.md](README.en.md), sections "Skin mutual exclusion (must read)" and "Installed too many / something looks broken".

## Already installed too many?

Open Settings → Skin Management and click "Official default" or any skin — the manager writes the exclusion rows and hot reloads; just refresh. If the manager is unavailable, hand-write both patch layers per README's "Manual installation · Option B" (note: dsh's default template "comments + `[]`" must have the `[]` line replaced entirely, otherwise the YAML is invalid).
