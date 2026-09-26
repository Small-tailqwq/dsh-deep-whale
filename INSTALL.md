# dsh-deep-whale Installation

Written for AI assistants; people can run the same commands by hand. A normal install takes three tool calls: one check, one install, one hand-off. Don't clone the repository, open the bundled skills or read DSH source for it.

Commands use the `web` profile; substitute the user's profile if it differs. In PowerShell, replace `&&` with `;` and keep the single quotes.

## 1. Check

```sh
dsh --version && dsh plugin --profile web list
```

Stop at the first rule that matches:

- **`@linxin666/dsh-web-all` is listed** (dsh-web): stop. dsh-web ships its own adapted `maid-atelier` and `orca-link`; tell the user to install them from dsh-web's skin center. Never add this repository's packages to that profile.
- **DSH is older than 0.1.7-rc.1**: stop and ask the user to upgrade DSH first. Current releases target DSH 0.1.7.
- **Any `@dsh-external/*` package is listed** (installs from before 0.1.3): remove them, then continue with step 2. Keep only the names that were actually listed; pnpm fails on a name that isn't installed.

  ```sh
  dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-orca-link' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-deep-whale-manager'
  ```

- **All three `@smalltailqwq/dsh-client-ui-skin-*` packages are listed**: already installed. Skip to step 3, or run the update below if the user asked for one.

## 2. Install

Use npm unless the user wants the newest code from GitHub `main` (fixes land there first; npm releases become installable about a day after publishing).

```sh
# npm
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'

# GitHub main
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

If the user wants only one skin, drop the other skin's `add`. Always keep the manager.

## 3. Hand off

Tell the user, then stop:

1. **Restart DSH once.** The user does this. Do not stop or restart the running DSH process yourself; if you are running inside DSH, that ends your own session.
2. After the restart, open Settings → Skins (Chinese UI: 设置 → 皮肤管理) and click Switch on a skin. With both skins installed, the first restart still shows the official UI; that is expected, because the manager turns both off until one is picked. Later switches apply immediately.
3. The artwork is CC BY-NC-SA 4.0: no commercial use. Credits are in the README.

Don't verify further unless the user reports a problem; then use the README troubleshooting section.

## Update

```sh
dsh plugin --profile web update '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' '@smalltailqwq/dsh-client-ui-skin-maid-atelier' '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

Works for both sources; the user refreshes the page afterwards, with no restart. The pnpm bundled with DSH skips npm versions younger than 24 hours without reporting an error, so `update` can stay on the previous release. To take a specific new release immediately, `add` it with a caret range, e.g. `'@smalltailqwq/dsh-client-ui-skin-orca-link@^0.1.6'`: pnpm records that version as an exception, installs it and keeps the dependency as a range. Without the `^` the dependency is pinned and later `update` runs no longer upgrade it.

## Beyond a normal install

Installing from a local clone, testing a specific commit, restoring broken skin switches, or diagnosing a skin that doesn't load: clone the repository and follow `.agents/skills/dsh-skin-install/SKILL.md`.
