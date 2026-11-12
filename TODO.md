# TODO

> 2026-10-21 已核对 GitHub issue、PR、分支和 npm 发布状态。
> GitHub 用户回复安排在白天，晚上不打扰别人。
> 2026-11-06 补充历史 worktree / stash 核对结果；下列调查项不代表已复现的新缺陷。

## 待合入 main

- [ ] **[#211](https://github.com/Small-tailqwq/dsh-deep-whale/issues/211)：工作区树层级缩进**
  - 处理 [PR #212](https://github.com/Small-tailqwq/dsh-deep-whale/pull/212)。原提交 `51d493d` 已保留在 `dev`，另有 `94347e6` 的树形装饰调整；确认最终范围后合入 `main`。
- [ ] **[#207](https://github.com/Small-tailqwq/dsh-deep-whale/issues/207)：竖屏抽屉被第三方遮罩拦截**
  - `dev` 的 `94347e6` 已移除抽屉 `z-index: 60` 上的 `!important`，允许宿主覆盖，尚未合入 `main`。合入并发布后，请报告者在 DSHA 上复测。

## 等待复测或补充材料

- [ ] **[#201](https://github.com/Small-tailqwq/dsh-deep-whale/issues/201)：移动端会话点击与软键盘**
  - 0.1.9 已包含吞点击窗口清理和软键盘修复，等待原报告者更新复测。若仍有侧栏空间不足，补充完整截图、视口尺寸和工作区数量后再定位。
- [ ] **[#208](https://github.com/Small-tailqwq/dsh-deep-whale/issues/208)：竖屏右侧栏高度塌陷**
  - 修复已随 0.1.9 发布，等待原报告者确认。#207 的报告者已反馈新版右栏正常。
- [ ] **[#192](https://github.com/Small-tailqwq/dsh-deep-whale/issues/192)：正文被面板阅读底板覆盖**
  - 面板页误判修复已随 0.1.9 发布，等待更新后复测。若仍有正文与立绘重叠，需客户端发行来源、宿主与皮肤精确版本，以及同一窗口尺寸的截图，按实际几何与可读性问题继续排查。
- [ ] **[#202](https://github.com/Small-tailqwq/dsh-deep-whale/issues/202)：长会话卡顿**
  - 旧的六份短会话记录缺少正常绘制和函数级 CPU 采样，不能据此归因。另有 2026-10-18 的独立调查，保留在 `.claude/worktrees/modest-dubinsky-3dd478/.agents/bridge-state/issue202/REPORT.md` 及同目录原始记录：官方 0.2.0-rc.2、211 步/378 次工具调用的隔离长会话未复现报告者卡顿，逐行模糊的因果假设未获支持；不能把这份隔离调查写成报告者环境已修复。
  - 后续若仍有当前版本的实际卡顿，固定同一会话、窗口和操作采集官方默认与皮肤的前台对照，再判断归属。旧 stash 的离屏行冻结/宽度锁仅是实验方案，不直接恢复到现版。

## 历史清点后待复核（2026-11-06）

- [ ] **ORCA 窗口恢复的指针基线**
  - 当前 `orca-link/src/client/window-resume.ts` 的 `suppress/release` 未清空 `lastPointer`；复核跨窗口恢复后的第一次移动是否沿用旧坐标，再决定是否重置基线及去重属性写入。来源：旧 stash `4a62392`。本轮只做源码比对，未将其认定为已复现故障。
- [ ] **ORCA 首页打字机观察器的无效调度**
  - 当前 `headline-typewriter.ts` 仍观察全部属性，虽然已排除转录等高频区域。计数角色/装饰属性变化引起的无效 `sync()`，核对真实依赖后再决定过滤范围。来源：旧 stash `4a62392` 的 `class/data-phase` 过滤方案；不直接照搬旧过滤器。
- [ ] **[#214](https://github.com/Small-tailqwq/dsh-deep-whale/issues/214)：快捷方式白纸与任务栏噪点待复测**
  - 等待旧写入和图标助手退出的生命周期修复已有后续实现；原报告中的两种现象仍缺报告者分别复测。该 issue 因等待超时关闭，不代表两种现象都已修复。保留独立当前版本复测条件，不恢复旧 ICO 格式推断或把旧分支整体再合入。
- [ ] **修正 Bug 模板的 PowerShell 说明**
  - `.github/ISSUE_TEMPLATE/bug.yml` 仍写“反斜杠在双引号字符串里是转义符”，应纠正；多行正文优先说明 UTF-8 文件配合 `gh issue create --body-file`，并保留发布后重读检查。来源：旧 stash `4a62392`。不恢复旧的自动关闭 Bug 报告实验工作流。

## 未排期计划

- **ORCA 移动端补全与真机验收范围**：旧 stash `d29ee59` 留有女仆移动端完成后继续 LINK 适配、安排真机测试的计划。按当前官方宿主确认尚需覆盖的具体布局与交互；没有现行版本的真机证据时不登记为验收完成，也不把整份历史手机补丁恢复回来。
- **[#23](https://github.com/Small-tailqwq/dsh-deep-whale/issues/23)：裙摆动画**：保留愿望，待评估动画素材与维护成本。
- **按会话状态切换立绘**：保留 [PR #138](https://github.com/Small-tailqwq/dsh-deep-whale/pull/138)（@wjingshan）的思路，暂不排期。缺少思考、完成、失败三套配套立绘；实现时需覆盖按模型选择立绘与 `vision` 替身，不能只绑定右女仆。美术可与 ZipZipPipe（见 `maid-atelier/NOTICE`）协商，实现后保留 @wjingshan 的构思署名。
- **输入框美术草稿**：`../dsh-deep-whale-issue93/maid-atelier/ps-assets/` 下有 5 张未入库 PNG（`maid-composer-frame-shell-v1`、`maid-composer-frame-v4`、`maid-composer-lace-tile-v1`、`maid-composer-lace-right-tile-v1/v2`），只存在本地 worktree，分支 `codex/issue-93-ultrawide-composer` 已合并。决定去留后挪到正式位置或删除，再移除该 worktree 和分支；入库前补 `NOTICE` 署名。
- **内置插件图标替换**：两套皮肤的 `assets/plugin-icons/` 已备好 17 枚风格化 SVG，清单与约束见 `docs/plugin-artwork.md`，目前未接线。等官方开放皮肤替换内置插件图标的接口后，按其契约决定分发方式，覆盖宿主各图标位置的兼容（设置项、引导、官方包图标及回退），同步 `NOTICE`，并提高宿主版本下限。

常驻公告保留在 [#14](https://github.com/Small-tailqwq/dsh-deep-whale/issues/14)。
