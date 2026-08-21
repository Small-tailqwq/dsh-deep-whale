# Agent Note: 设置打开后缩放窗口的布局抖动风暴——皮肤侧摘除读写交错

Status: implemented

## 背景

Trace-20260821T164758（设置打开 + 持续拖拽缩放浏览器）显示主线程长任务 200ms+：官方 `dsh-client-ui-deliverables` 的 `ProducedFiles.measure`（ResizeObserver 驱动）在循环里写 `textContent` 后立即读 `getBoundingClientRect`，每次读都强制全页同步布局；设置弹窗 + 后台会话的大 DOM 使单次 Layout 高达 20~24ms，单帧 46~95ms。CPU profile 中 `getBoundingClientRect` 自耗时 1844ms，占绝对主导。

皮肤的放大点（trace 实证）：风暴中段 `syncTitlebarHeight` 的 gBCR 强制布局 + 无条件 CSSOM 写回（24.3ms，恰好插在其它插件的读之间多逼出一次全页布局）；`applySidebarWidth` 每次回调无差别重写 3 个 CSSOM 变量 + 2 个 body dataset；装饰同步每轮全量删+写 dataset，净零变化也产生成对 mutation record，喂给页面上其它 MutationObserver（autofill 扩展的 `handlePageMutations` 在 trace 中持续被触发）。

## 结论

皮肤不能改官方插件，优化角度是把皮肤自己从读写交错链里摘掉、消除同值写入的无效失效（`maid-atelier/src/client/index.ts`）：

1. `syncTitlebarHeight`：读到的 `top` 与规则当前值相同则跳过 CSSOM 写回（读保留，写去重）。
2. `applySidebarWidth`：宽度、`data-maid-sidebar-size`、compact 三态全部同值则整体早退；ResizeObserver 因高度变化触发的回调不再重写 `--maid-sidebar-width`（角色位移、顶/底帘 translate、`::after` 居中 calc 都依赖它，同值重写等于每帧全树样式失效）。
3. `decorateWorkspaceTree`：改为 current/desired 双向最小差量，只写变化的 attribute（`WORKSPACE_FLAG_SELECTOR` 由 `WORKSPACE_FLAGS.map(flag => `[${flag}]`)` 生成，注意 join 不带方括号是类型选择器、静默匹配 0 个元素）。
4. `decorateSidebar` 的 footer 标记同样只做差量。

预期收益：风暴中皮肤贡献的强制布局与全树样式失效归零；官方 measure 的每次强制布局不再被皮肤的写回额外加倍。官方组件内部的 7+ 次写读交错仍在（需上游修复），单帧成本下界由它决定。

## 验证

- `pnpm test`：98/98 通过（含 workspace 标记/回收、footer 锚定、宽度跟踪既有契约）。
- 调试期间曾因选择器缺方括号出现 `data-maid-workspace-active` 残留回归，由既有测试 `marks the active workspace group...` 捕获，已修复。
- `pnpm build` 后 `lib/client.js` 同步包含三处去重逻辑。
- 未做浏览器端复测：建议重录同场景 trace 对比 measure 单次 dur 与 gBCR 自耗时。

## 关联

- 上游问题（不在本仓库修复）：`dsh-client-ui-deliverables` `ProducedFiles.measure` 与 `dsh-client-ui-conversation` `measure` 的布局抖动。
- `2026-08-21-maid-settings-responsive…`、`2026-08-21-settings-dialog-sidebar-…`（设置弹窗相关既有 note）。
