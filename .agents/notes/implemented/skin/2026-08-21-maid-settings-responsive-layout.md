# Agent Note: 女仆皮肤设置面板小屏响应式布局

Status: implemented

## 背景

官方 SettingsPanel 是固定 800px 居中模态：188px 分类导航列 + 不收缩的行内 selector。窄视口下内容列被压成竖排碎片，描述文字逐字换行、控件挤出边界，可读性差。maid-atelier 此前只覆盖了设置面板的玻璃质感（`backdrop-filter` 半透明），没有任何空间布局处理；orca-link 已有完整的响应式设置 shell（大屏 dock、受限视口全屏、手机导航置顶、窄内容行堆叠）。

## 结论

**只采纳 orca-link 的受限视口（小窗）响应式规则；打开位置与尺寸保持官方默认居中模态，不学大屏 dock。** 全部规则挂在 `body[data-dsh-maid-atelier][data-maid-settings-open]`（index.ts 已按 dialog 存在投影该属性，关闭自恢复，无需新增 JS）：

- 受限视口 `(max-width: 1099px), (max-height: 680px)`：dialog 全屏 `100vw / 100dvh`，去边框、圆角、阴影——消除中间态挤压。
- 手机 `(max-width: 640px)`：dialog 纵向，nav 移到顶部横向条，navList 变 3 列 grid（`repeat(3, minmax(0, 1fr))`），navCell 36px 高；`(max-width: 420px)` 降为 2 列。
- 窄内容 `(max-width: 520px)`：官方 `_row`（`[class$='_row']:has(> [class$='_rowText'])`）纵向堆叠，`_rowText` 释放 48px 右侧 gutter、selector 全宽 space-between；skin-manager 自定义设置卡（本皮肤自己的 artwork/sfwMode/font/modelExit 控件，`[class$='_toggleRow']` / `[class$='_selectRow']`）同契约堆叠、select 全宽。

桌面（≥1100px 且 ≥681px 高）没有任何覆盖：官方 overlay 居中 flex、dialog 800px / `min(800px, 100vh-48px)`、阴影圆角原样保留。层级保持官方 Modal 1000。`:has()` 仅用于 dialog 内部行结构，无 body 级 `:has`，符合仓库约束。

## 验证

- `maid-atelier/tests/apply.spec.ts` 新增用例 `responds to constrained viewports without squeezing settings rows`：断言 1099/680 全屏、640 nav grid、520 行堆叠；并断言无 `min-width: 1100px` dock 媒体块、无 `justify-content: flex-start`、设置 overlay 无基线尺寸/位置覆盖（保持官方默认）。全套 96 用例通过。
- 重新构建 `lib/client.js`（tsdown + lightningcss），压缩产物确认包含全部小窗规则（`width<=1099px` / `width<=640px` / `width<=520px` / `width<=420px` / `height<=680px` / `100dvh`），且不含 `min-width:1100px` 与 `justify-content:flex-start`。

## 关联

- orca-link `orca-link.module.css` 506–750 行响应式设置 shell（参考实现；dock 部分有意不采纳）。
- 后续人工验收：窄窗口/手机宽度下打开设置面板检查 nav 置顶与行堆叠、桌面打开位置与官方一致。
