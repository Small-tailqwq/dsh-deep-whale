# Repository guidance

## Code Review Rules

### Skin lifecycle

- Treat every DOM or CSS mutation, observer, event listener, timer, animation frame, and injected node as skin-owned state. Flag any path where partial `apply()` failure, disposal, repeated activation, or hot switching can leave state behind or remove another activation's state. Safe path: register cleanup before fallible work, retain exact original values and owned handles, and restore only what the current activation changed.

### Product compatibility

- This repository ships presentation-only skins. Flag changes that alter DSH services, events, or model requests; require remote runtime assets; block native controls or overlays; or rely on unstable DOM selectors without a safe fallback. Safe path: scope CSS and DOM decoration to the active skin and preserve native behavior across light and dark themes, narrow and wide sidebars, conversation and workspace views, and browser and desktop layouts.

### Distribution and attribution

- `maid-atelier/lib/` 与 `orca-link/lib/` are committed distribution output. Flag source or asset changes without matching built output, generated bundles containing absolute machine paths or remote asset dependencies, and asset or license changes that break the CC BY-NC-SA 4.0 terms or the `NOTICE` attribution chain. Safe path: regenerate bundles only from repository inputs and update `LICENSE` or `NOTICE` whenever provenance changes.

## Repository layout

- `maid-atelier/` 与 `orca-link/`：独立皮肤包，结构一致：
  - `src/`：插件源码（`src/client/` 为浏览器半边，`src/index.ts` 为 node 半边空 apply）
  - `build/`：`tsdown.client.ts`（clientBundle 管道，`portableCssModuleIds: true`）+ `web-platform.ts`
  - `lib/`：提交的构建产物（`client.js` + `index.js`；`*.js.map` 不入库）
  - `skin.json`：皮肤清单（id/name/package/wiring/bodyAttr/preview/order）
  - `cordis.patch.yml`：bundle patch（`dsh.bundle.patch`，insert 皮肤行）
  - `NOTICE` / `LICENSE`：署名链与许可（CC BY-NC-SA 4.0）
- `.agents/skills/`：`dsh-skin-install`（安装/切换/更新）、`dsh-plugin-verify`（三层验证）
- `AGENTS.md`：本文件

## Common issues & fixes（常见问题速查）

### 层叠上下文 / z-index

- DSH 层级契约：menu 100 / Modal 1000 / portal menu 1100。皮肤浮层一律 < 1000。
- 祖先 stacking context 会困住 `position: fixed` 面板（Safari/WebKit 不绘制）——设置弹窗期间释放侧栏列上下文（`z-index: auto` + `isolation: auto`，保留 `relative`）。
- `#root` 提升必须 `[id='root']` + `!important`（官方 trajectory 的 `#root { z-index: 1 }` 特异性更高）。
- 禁止 2^31 附近魔法数字（lightningcss 会改写数值）与 `#root` ID 选择器（CSS Modules 会哈希）。

### 输入性能

- rc8 幽灵文本每按键重建 `[data-input-backdrop]` 节点：mutation 过滤它；`:has()` 尽量属性化，禁止 body 级 `:has`。

### rc 适配

- 内联 token 压制 → `--dsw-*` 覆盖加 `!important`；幽灵文本 → 补 `-webkit-text-fill-color`；官方 DOM 结构变化 → 按 slot 契约写选择器并留降级。

### 安装

- `dsh plugin add` 一律用绝对路径（Windows 正斜杠/反斜杠均可）；裸目录名会被当 npm 包名 404；相对路径按 dsh 调用目录解析。

## Agent Notes

- 皮肤开发/优化过程以 note 形式记录，规范与格式见脚手架仓库 `.agents/notes/README.md`（Problem/Decision/Alternatives considered/Consequences/Related 结构、闭集分类、生命周期）。
- **权威副本与唯一维护地在脚手架仓库** `Small-tailqwq/dsh-skin-template`（`.agents/notes/implemented/<分类>/`），由 `dsh-note-maintainer` 技能在会话收尾时增/改；本仓库**不提交笔记**。
- **共享方式**：本仓库 `.agents/notes/` 是指向脚手架 `.agents/notes/` 的目录 junction（Windows），已加入 `.gitignore`——clone 皮肤的用户不会拿到笔记，开发会话里两边经验实时互通（皮肤修复与皮肤创建的经验共通）。
- 分类：compatibility（rc 适配）/ performance / stacking / install / process / skin。
