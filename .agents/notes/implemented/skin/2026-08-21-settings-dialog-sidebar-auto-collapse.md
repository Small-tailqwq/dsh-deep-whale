# Agent Note: 设置面板跨侧边栏自动收起断点不再闪没

Status: implemented

## Problem

设置面板（SettingsPanel）是 `position: fixed` 的模态层，但挂在侧边栏 footer 的 `sidebar.settings` slot 内。官方侧边栏在窗口宽度跨过 1024px 断点时自动收起/展开：SidebarRoot 元素按阶段加类——收起加 `railIn`（`.railIn .footArea` 执行 `rail-fade-in` 动画，0% opacity: 0，backwards fill），展开加 `fading`（`.fading > *` 把 root 所有直接子元素淡出）——**动画目标都是 root 的直接子元素 `.footArea`，即设置面板 overlay 的载体**。

皮肤把设置面板做成全屏响应式后（参考 orca-link 的受限视口方案），用户在设置打开状态下调整窗口跨过断点，footArea 的透明度动画连带 fixed overlay 一起淡出/淡入，设置界面"消失一瞬间"。maid-atelier 初次修复只抑制了 SidebarRoot（错误层级），实测仍闪烁；orca-link 的 shell 早已修复过该问题。

## Decision

移植 orca-link 的修复，但选对层级。关键结构事实：slot 锚点（SlotOutlet）是 `display: contents` 的 `div[data-slot='sidebar']`，所以 DOM 是 `sidebarCol > div[data-slot=sidebar](display:contents) > SidebarRoot > .footArea > .settingsArea > [data-slot=sidebar.settings] > overlay`。两件事分挂两层：

```css
/* 1) SidebarRoot：释放 stacking context（面板逃出 root 的 z-index: 2 上下文） */
body[data-dsh-maid-atelier]
  :is([data-pane='sidebar'], [class*='sidebarCol']) > div
  > :has([role='dialog'][aria-modal='true']) {
  z-index: auto !important;
}

/* 2) .footArea（root 的直接子元素、dialog 载体）：抑制官方收起/展开动画 */
body[data-dsh-maid-atelier]
  :is([data-pane='sidebar'], [class*='sidebarCol']) > div
  > :not([data-skin-chrome='sidebar-mascot'], [data-skin-chrome='sidebar-corners'], [role='tooltip'])
  > :has([role='dialog'][aria-modal='true']) {
  opacity: 1 !important;
  transition: none !important;
  animation: none !important;
}
```

要点：

- 第一次修复把 `opacity/transition/animation` 挂在了 SidebarRoot 上（`> div > :has(...)` 因 `:has()` 深度包含匹配到 root），但官方动画作用于 root 的**子元素** footArea，故无效。footArea 必须写成 root 的直接子元素：`> div > :not(装饰) > :has(...)`（`:not(...)` 排除皮肤注入的 mascot/corners/tooltip）。
- orca-link 的 `[data-slot='sidebar'] > :first-child > :has([role='dialog'])` 能直接命中 footArea，因为 `:first-child` 约束的是 root（slot 锚点的第一个子元素），而 `:has` 深度匹配落在 root 的直接子元素 footArea 上；maid 用列级选择器需要显式走出两层。
- `z-index` 释放仍在 root（maid 的 `> div > :not(...)` 给 root `position: relative; z-index: 2` 制造 stacking context）；footArea 本无 stacking context 角色，无需释放。
- 触发条件沿用 maid 的 `:has()` 锚定真实 dialog（带 `aria-modal='true'`），关闭即自恢复。

## Verification

- `maid-atelier/tests/apply.spec.ts`：
  - `retires the sidebar stacking context while the settings dialog is open`：root 规则含 `z-index: auto`，且**不含** opacity/animation。
  - `keeps the settings dialog carrier opaque across the sidebar auto-collapse`：footArea 规则含 `opacity: 1 !important` / `transition: none !important` / `animation: none !important`。
  - `targets the carrier suppression at the official footArea, not the SidebarRoot`：jsdom 模拟官方 DOM（slot 锚点 display:contents → root → footArea → settings slot → overlay），断言 root 释放选择器命中 SidebarRoot、载体抑制选择器命中 footArea——防止层级回归。
  - 全套 98 用例通过。
- 重新构建 `lib/client.js`，确认两条规则分别挂在正确的选择器上。
- 人工验收（待执行）：设置打开时从 1100px 缩到 900px 以下、再拉回，确认无闪烁；关闭设置后侧边栏收起/展开动画正常。

## Alternatives considered

- **只抑制 SidebarRoot（首次修复）**：无效，动画在子元素 footArea 上，已实测仍有闪烁。
- **在 dialog 自身设置 `opacity/animation: none`**：无效，官方动画作用于载体；且 dialog 的 animation 会被官方内容动画覆盖。
- **JS 拦截收起动画**：不必要，纯 CSS 抑制即可，避免新增 observer/时序代码。

## Consequences

- 收益：设置打开期间跨 1024px 断点不再闪没；与 orca-link 行为一致。
- 约束：后续皮肤必须区分 SidebarRoot（z-index 释放）与 footArea（动画抑制）两个层级；slot 锚点是 `display: contents`，`> div` 不代表 SidebarRoot。改动载体选择器时同步更新 `apply.spec.ts` 的三个提取/验证用例。
- 现有 `data-maid-viewport-resizing`（120ms 防抖投影）只覆盖皮肤自身 resize 过渡，与本问题无关。

## Related

- 参考实现：orca-link `src/client/orca-link.module.css` 477–495（`[data-orca-settings-open]` 载体抑制块）。
- 官方行为：`dsh-client-ui-sidebar` SidebarRoot.module.css（`railIn`/`fading` 类）与 ui-layout `SIDEBAR_AUTO_COLLAPSE = 1024`；slot 锚点实现见 `dsh-client-ui-renderer` SlotOutlet（`display: contents`）。
- maid-atelier 既有规则：`maid-atelier.module.css`（root z-index 释放，本 note 补充 footArea 抑制）。
- 会话：2026-08-21 女仆皮肤设置面板响应式优化（小窗全屏/导航置顶/行堆叠/收起闪烁）。
