# Repository guidance

<!-- dsh-agent-scaffold:v1 -->

## Code Review Rules

### Skin lifecycle

- Treat every DOM or CSS mutation, observer, event listener, timer, animation frame, and injected node as skin-owned state. Flag any path where partial `apply()` failure, disposal, repeated activation, or hot switching can leave state behind or remove another activation's state. Safe path: register cleanup before fallible work, retain exact original values and owned handles, and restore only what the current activation changed.

### Product compatibility

- This repository ships presentation-only skins. Flag changes that alter DSH services, events, or model requests; require remote runtime assets; block native controls or overlays; or rely on unstable DOM selectors without a safe fallback. Safe path: scope CSS and DOM decoration to the active skin and preserve native behavior across light and dark themes, narrow and wide sidebars, conversation and workspace views, and browser and desktop layouts.
- `skin.json.dshCompatibility` records the latest explicitly verified DSH build in `x.y.zrcN` form. Routine fixes do not change it; whenever a skin is adapted or revalidated for a newer DSH build, update every affected manifest before building. `skin.build.json` 由各皮肤包目录内的 `npm run build` 生成（`tsdown` 后接 `scripts/write-skin-build.mjs`）；绝不可手改其 fingerprint。两套皮肤各有该清单与指纹文件，skin-manager 没有 `skin.json`，其 build 只跑 `tsdown`。

### Distribution and attribution

- `maid-atelier/lib/` 与 `orca-link/lib/` are committed distribution output. Flag source or asset changes without matching built output, generated bundles containing absolute machine paths or remote asset dependencies, and asset or license changes that break the MIT code / CC BY-NC-SA 4.0 artwork boundary or the `NOTICE` attribution chain. Safe path: regenerate bundles only from repository inputs and update `LICENSE`, `LICENSE-ARTWORK` or `NOTICE` whenever provenance changes.

## Repository layout

- `maid-atelier/` 与 `orca-link/`：两套独立皮肤包，结构一致：
  - `src/`：插件源码（`src/client/` 为浏览器半边，`src/index.ts` 为 node 半边空 apply）
  - `build/`：`tsdown.client.ts`（clientBundle 管道，`portableCssModuleIds: true`）+ `web-platform.ts`
  - `lib/`：提交的构建产物（`client.js` + `index.js`；`*.js.map` 不入库）
  - `skin.json`：皮肤清单（id/name/package/wiring/bodyAttr/preview/order）
  - `cordis.patch.yml`：bundle patch（`dsh.bundle.patch`，insert 皮肤行）
  - `NOTICE` / `LICENSE` / `LICENSE-ARTWORK`：署名链、MIT 代码许可与 CC BY-NC-SA 4.0 美术许可
- `skin-manager/`：第三发行包，不是皮肤（无 `skin.json`，无 `build/` 与 `preview/`；`src/index.ts` 是真实 node 半边），提供发现已安装皮肤、切换互斥与定制声明的管理面板。`lib/` 同为提交型产物。
- `.agents/skills/`：仓库专属 `dsh-skin-install`；镜像的 `dsh-skin-upgrade`；本机桥接的
  `dsh-note-maintainer` / `dsh-plugin-verify` / `dsh-boot-error-verify`。实际声明见 `.agents/dsh-scaffold.json`；桥接技能正文里的仓库相对路径（如 `shared/web-platform.json`）按脚手架仓库解析，本仓库宿主模块表在 `maid-atelier/build/web-platform.ts` 与 `orca-link/build/web-platform.ts`。
- `AGENTS.md`：本文件

## Common issues & fixes（常见问题速查）

### 层叠上下文 / z-index

- DSH 层级契约：menu 100 / Modal 1000 / portal menu 1100。皮肤浮层一律 < 1000。
- 祖先 stacking context 会困住 `position: fixed` 面板（Safari/WebKit 不绘制）——设置弹窗期间释放侧栏列上下文（`z-index: auto` + `isolation: auto`，保留 `relative`）。
- `#root` 提升必须 `[id='root']` + `!important`（官方 trajectory 的 `#root { z-index: 1 }` 特异性更高）。
- 禁止 2^31 附近魔法数字（lightningcss 会改写数值）与 `#root` ID 选择器（CSS Modules 会哈希）。

### 输入性能

- 宿主输入区每按键会产生高频 DOM 变更（幽灵文本、输入镜像）：mutation 只按需要的属性过滤，不要全量扫描；`:has()` 尽量属性化，禁止 body 级 `:has`。rc8 时代的 `[data-input-backdrop]` 选择器在当前宿主已不存在（全量取证 0 命中），不要照抄。

### rc 适配

- 内联 token 压制 → `--dsw-*` 覆盖加 `!important`；幽灵文本 → 补 `-webkit-text-fill-color`；官方 DOM 结构变化 → 按 slot 契约写选择器并留降级。

### 安装

- `dsh plugin add` 推荐用绝对路径（Windows 正斜杠/反斜杠均可）；裸目录名会被当 npm 包名 404，须写成 `./maid-atelier` 这类路径，相对路径按 dsh 调用目录解析。普通安装按 `INSTALL.md` 的一行命令；仅迁移、本地 link、指定提交与故障诊断走 `dsh-skin-install`。

## Agent Notes

- 开始非平凡诊断前，先在 `.agents/notes/INDEX.md` 按症状/scope/contract key 渐进检索，只读命中的少量 note；宿主升级调用 `dsh-skin-upgrade`，先冻结当前皮肤依赖 key，再查 `.agents/knowledge/dsh-host-deltas/INDEX.md`。
- **权威副本与唯一维护地在脚手架仓库** `Small-tailqwq/dsh-skin-template`；本仓库不提交共享 Note/Card。皮肤源码、`lib` 与 `skin.build.json` 作为本仓库发布提交，知识变更在脚手架另行提交，用 Related/commit SHA 互链。
- 每次非平凡修复、结构/流程变化或宿主升级收尾，必须调用 `dsh-note-maintainer` 并明确输出 `Agent Notes: 增 / 改 / 不记 / deferred`。Junction 可读不等于中央可写；不可写或中央文件冲突时把完整草稿写入本地忽略的 `.agents/bridge-state/`，不能静默漏记。
- `.agents/dsh-scaffold.json` 是 tracked bridge 清单；`pnpm agents:bridge` 与 `dsh-skin-upgrade` 里的
  `pnpm host-deltas:*` 都定义在**脚手架仓库**，本仓库根没有 `package.json`，必须在脚手架目录运行并把
  `--repo <本仓库绝对路径>` 指向本仓库。禁止链接整个 `.agents/skills`，以保留本仓库场景版 install。
