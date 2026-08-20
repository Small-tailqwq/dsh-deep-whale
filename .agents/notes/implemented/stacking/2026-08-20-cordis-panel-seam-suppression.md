# Agent Note: Cordis 面板释放层叠上下文后的接缝刻度穿透

Status: implemented

## 背景

orca-link 为让侧栏 footer 内的 fixed Cordis 面板逃出祖先 stacking context，会在面板打开时释放侧栏的 `z-index` 与 `isolation`。释放后，body 直属的 `.spine` 接缝标尺（z-index 850）与面板进入同一页面层叠空间，其 56px 周期刻度会画在面板背景之上。

## 结论

保留 `.spine`，并为 Cordis 面板增加独立的 `--orca-z-cordis: 975` 层级：高于接缝标尺 850 和其他皮肤 chrome，低于设置面板 980、官方 Modal 1000 与 portal menu 1100。不要重新提升 Cordis 的侧栏祖先，否则会复发 WebKit fixed 面板被困和点击穿透。

## 验证

- `cordis-panel.spec.ts` 固定“释放祖先上下文 + 850 < Cordis 975 < settings 980 < Modal 1000”的组合契约。
- 构建后的 `lib/client.js` 同步包含该规则。

## 关联

- PR #58 后续人工验收：创造模式 Cordis 插件权限弹窗。
- `2026-08-20-z-index-ladder-and-root-promotion.md`。
