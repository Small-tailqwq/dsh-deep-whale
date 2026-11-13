# Repository guidance

<!-- dsh-agent-scaffold:v1 -->

## Branch and release workflow

- `dev` 是开发分支，可以提前适配尚未进入 rc 的 DSH alpha 版本。对应宿主版本进入 rc 后，再通过 `dev → main` PR 审阅并发布这些适配。
- `dev` 同时承载 `main` 的修复：修复验证完成后先提交到 `dev`，再通过面向 `main` 的 PR 使用 GitHub review 机制审阅。
- 创建修复 PR 前检查相对 `main` 的完整差异。若 `dev` 混有尚未进入 rc 的 alpha 适配或其他不属于该修复的改动，从 `main` 创建独立修复分支，只提取已在 `dev` 验证的修复，并重新生成产物、验证；不得为修复 PR 将这些未发布改动整体带入 `main`，也不得改写 `dev` 历史来清除它们。
- 只有小型文档改动，或用户明确授权直接提交到 `main` 的改动，才可跳过 PR 直接提交到 `main`。一般性的修复、提交或发布授权不等于授权绕过 PR review。

## Code Review Rules

### Bug ownership and third-party compatibility

- 以同一官方 DSH 版本、相同场景和配置为对照：官方默认界面正常、启用本仓库皮肤后出现的问题，归本仓库；默认界面与皮肤下均存在的同一问题，归宿主或对应插件，不由皮肤兜底。皮肤额外引入或加重的部分仍归本仓库。
- 第三方桌面发行版不等于官方 DSH。先核对发行来源、精确版本及其对官方插件的修改，区分官方原版缺陷、皮肤缺陷和第三方改动造成的兼容冲突。只有源码分析或报告者描述时，注明证据边界，不把推断写成已完成的运行时对照。
- 若第三方修改官方插件后造成兼容冲突，先判断能否在既有职责内通过通用、简洁且符合官方契约的改进解决。若必须识别该插件的专属 DOM、增加专用例外或补偿其修改结果，则不在皮肤中修复；说明冲突来源与归属，交由第三方处理，避免积累针对其他插件的补丁。仅在第三方环境中停用皮肤后恢复，不自动意味着本仓库必须承担兼容修复。

### Skin lifecycle

- Treat every DOM or CSS mutation, observer, event listener, timer, animation frame, and injected node as skin-owned state. Flag any path where partial `apply()` failure, disposal, repeated activation, or hot switching can leave state behind or remove another activation's state. Safe path: register cleanup before fallible work, retain exact original values and owned handles, and restore only what the current activation changed.

### Product compatibility

- 新改动面向当前已适配的官方 DSH 基线，不为旧宿主增加向下兼容分支或回退；使用新接口时同步提高皮肤的宿主版本下限。旧宿主用户使用对应旧版皮肤，或基于旧版本自行维护。此原则不要求在无关任务中清理已有历史兼容代码。
- This repository ships presentation-only skins. Flag changes that alter DSH services, events, or model requests; require remote runtime assets; block native controls or overlays; or rely on unstable DOM selectors without a safe fallback. Safe path: scope CSS and DOM decoration to the active skin and preserve native behavior across light and dark themes, narrow and wide sidebars, conversation and workspace views, and browser and desktop layouts.
- 两套皮肤的 `package.json` 用可选 peer `@deepseek-ai/dsh` 声明已适配的版本范围（`maid-atelier` 为 `>=0.2.2-0 <0.2.3-0`；`orca-link` 依赖 0.2.2-rc.3 的新会话行结构，为 `>=0.2.2-rc.3 <0.2.3-0`）；DSH 0.1.7+ 在范围外自动停用皮肤，由皮肤管理器提供按精确版本的手动放行。适配其他 DSH 版本（含 `dev` 上的 alpha 预适配）时必须同步调整范围，否则皮肤在范围外的宿主上会被停用。皮肤管理器只写下限，保持可用。`skin-manager/tests/package-meta.spec.ts` 固定这些范围。
- `skin.json.dshCompatibility` records the latest explicitly verified DSH RC build in `x.y.zrcN` form. Routine fixes do not change it; whenever a skin is adapted or revalidated for a newer RC build, update every affected manifest before building. Alpha adaptations retain the last RC value and pin the alpha version in the package peer minimum and relevant fixtures. `skin.build.json` 由各皮肤包目录内的 `npm run build` 生成（`tsdown` 后接 `scripts/write-skin-build.mjs`）；绝不可手改其 fingerprint。两套皮肤各有该清单与指纹文件，skin-manager 没有 `skin.json`，其 build 只跑 `tsdown`。

### Distribution and attribution

- `maid-atelier/lib/` 与 `orca-link/lib/` are committed distribution output. Flag source or asset changes without matching built output, generated bundles containing absolute machine paths or remote asset dependencies, and asset or license changes that break the MIT code / CC BY-NC-SA 4.0 artwork boundary or the `NOTICE` attribution chain. Safe path: regenerate bundles only from repository inputs and update `LICENSE`, `LICENSE-ARTWORK` or `NOTICE` whenever provenance changes.

## Repository layout

- `maid-atelier/` 与 `orca-link/`：两套独立皮肤包，结构一致：
  - `src/`：插件源码（`src/client/` 为浏览器半边，`src/index.ts` 为 node 半边静态图片路由）
  - `build/`：`tsdown.client.ts`（clientBundle 管道，`portableCssModuleIds: true`）+ `web-platform.ts`
  - `lib/`：提交的构建产物（`client.js` + `index.js`；`*.js.map` 不入库）
  - `skin.json`：皮肤清单（id/name/package/wiring/bodyAttr/preview/order）
  - `assets/runtime/`：内容哈希命名的 PNG/WebP 与构建生成的资源清单；随包分发并计入构建指纹，维护方式见 `docs/asset-delivery.md`
  - `cordis.patch.yml`：bundle patch（`dsh.bundle.patch`，insert 皮肤行）
  - `NOTICE` / `LICENSE` / `LICENSE-ARTWORK`：署名链、MIT 代码许可与 CC BY-NC-SA 4.0 美术许可
- 三个发行包都带 `locale/{en,zh}.json`（`meta.title` / `meta.description`）与 `package.json#icon`：DSH 0.1.7+ 插件菜单据此显示本地化名称、简介与图标，须经 `./locale/*.json` 导出并列入 `files`；`skin-manager/tests/package-meta.spec.ts` 校验该契约。女仆图标由 `scripts/build-maid-icons.py` 同步生成。
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
