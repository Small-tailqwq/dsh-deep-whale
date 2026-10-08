# dsh-deep-whale Installation

Written for AI assistants; people can follow the same steps. First identify whether the user runs the official desktop app or the CLI Web version. Don't clone the repository, open the bundled skills or read DSH source for a normal install.

If the user runs dsh-web (`@linxin666/dsh-web-all`), use its own skin center instead of this repository's packages.

## Official desktop app

1. Choose one or more skins. Open **Plugins** in the sidebar, click **Add plugin**, and install the corresponding npm packages one at a time:

   | Plugin | npm package name |
   |---|---|
   | [maid-atelier](https://www.npmjs.com/package/@smalltailqwq/dsh-client-ui-skin-maid-atelier) | `@smalltailqwq/dsh-client-ui-skin-maid-atelier` |
   | [orca-link](https://www.npmjs.com/package/@smalltailqwq/dsh-client-ui-skin-orca-link) | `@smalltailqwq/dsh-client-ui-skin-orca-link` |
   | [Skin Manager](https://www.npmjs.com/package/@smalltailqwq/dsh-client-ui-skin-deep-whale-manager) | `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` |

2. With **one skin**, the manager is optional; without it, customization controls are unavailable. With **multiple skins, the manager is required** to prevent them from running together and breaking the layout. Enable the plugins when prompted, then ask the user to **restart DSH once**.
3. If Skin Manager is installed, open **Settings → Skins** (设置 → 皮肤管理) after restarting. If the first start still shows the official UI, select the skin to enable there.

For the latest code on `main`, enter the GitHub specs for the chosen skins and manager in the same install field, one at a time, without a `dsh plugin add` prefix:

```text
github:Small-tailqwq/dsh-deep-whale#main&path:/skin-manager
github:Small-tailqwq/dsh-deep-whale#main&path:/maid-atelier
github:Small-tailqwq/dsh-deep-whale#main&path:/orca-link
```

The pnpm bundled with DSH defaults to a 24-hour minimum package age, so a newly published npm version may not be available yet. GitHub sources are not subject to this npm package-age check.

Use the app's plugin list to check the installed packages. Desktop manages its own `desktop` profile; do not run the `web` commands below for it or use CLI `--dump-config` to verify it. No `dsh` command on PATH is needed for this route.

## CLI Web version

A normal CLI install takes one check, one install, and one hand-off. Commands use the `web` profile; substitute the profile the user actually launches if it differs. In PowerShell, replace `&&` with `;` and keep the single quotes.

### 1. Check

```sh
dsh --version && dsh plugin --profile web list
```

Stop at the first rule that matches:

- **`@linxin666/dsh-web-all` is listed** (dsh-web): stop. dsh-web ships its own adapted `maid-atelier` and `orca-link`; tell the user to install them from dsh-web's skin center. Never add this repository's packages to that profile.
- **DSH is older than 0.1.7-rc.1**: stop and ask the user to upgrade DSH first. Current releases target DSH 0.1.7 and 0.2.
- **Any `@dsh-external/*` package is listed** (installs from before 0.1.3): remove them, then continue with step 2. Keep only the names that were actually listed; pnpm fails on a name that isn't installed.

  ```sh
  dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-orca-link' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-deep-whale-manager'
  ```

- **All the requested packages are listed**: already installed. Skip to step 3, or run the update below if the user asked for one.

### 2. Install

Use npm unless the user wants the newest code from GitHub `main` (fixes land there first; the bundled pnpm normally excludes npm versions less than 24 hours old).

```sh
# npm
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'

# GitHub main
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#main&path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#main&path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#main&path:/orca-link'
```

If the user wants only one skin, drop the other skin's `add`; the manager is optional, but supplies customization controls. With multiple skins, always keep the manager to prevent them from running together.

### 3. Hand off

Tell the user, then stop:

1. **Restart DSH once.** The user does this. Do not stop or restart the running DSH process yourself; if you are running inside DSH, that ends your own session.
2. If the manager is installed, after the restart open Settings → Skins (Chinese UI: 设置 → 皮肤管理) and click Switch on a skin. With both skins installed, the first restart still shows the official UI; that is expected, because the manager turns both off until one is picked. Later switches apply immediately.
3. The artwork is CC BY-NC-SA 4.0: no commercial use. Credits are in the README.

Don't verify further unless the user reports a problem; then use the README troubleshooting section.

## Update

**Desktop:** as of DSH 0.2.0-rc.2, the plugin page has no upgrade control and third-party plugins do not update automatically. Uninstall the plugin to update from **Plugins**, reinstall and enable it through **Add plugin**, then ask the user to restart DSH.

**CLI Web version:** keep only the package names actually installed.

```sh
dsh plugin --profile web update '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' '@smalltailqwq/dsh-client-ui-skin-maid-atelier' '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

Works for both sources; the user refreshes the page afterwards, with no restart. The bundled pnpm prefers npm versions published at least 24 hours ago by default, so `update` can stay on the previous release. To request a specific release, `add` it with a caret range, e.g. `'@smalltailqwq/dsh-client-ui-skin-orca-link@^0.1.7'`; it is still subject to the current pnpm package-age policy. Without the `^` the dependency is pinned and later `update` runs no longer upgrade it.

## Beyond a normal install

Installing from a local clone, testing a specific commit, restoring broken skin switches, or diagnosing a skin that doesn't load: clone the repository and follow `.agents/skills/dsh-skin-install/SKILL.md`.
