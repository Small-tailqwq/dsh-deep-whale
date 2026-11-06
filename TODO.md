# TODO

> 2026-10-21 已核对 GitHub issue、PR、分支和 npm 发布状态。
> GitHub 用户回复安排在白天，晚上不打扰别人。

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
  - 等待确实录到卡顿的前台长会话对照 trace。已有六份短会话记录缺少正常绘制和函数级 CPU 采样；需固定同一会话与操作，对照官方默认界面和皮肤，再判断耗时与问题归属。

## 未排期计划

- **[#23](https://github.com/Small-tailqwq/dsh-deep-whale/issues/23)：裙摆动画**：保留愿望，待评估动画素材与维护成本。
- **按会话状态切换立绘**：保留 [PR #138](https://github.com/Small-tailqwq/dsh-deep-whale/pull/138)（@wjingshan）的思路，暂不排期。缺少思考、完成、失败三套配套立绘；实现时需覆盖按模型选择立绘与 `vision` 替身，不能只绑定右女仆。美术可与 ZipZipPipe（见 `maid-atelier/NOTICE`）协商，实现后保留 @wjingshan 的构思署名。
- **输入框美术草稿**：`../dsh-deep-whale-issue93/maid-atelier/ps-assets/` 下有 5 张未入库 PNG（`maid-composer-frame-shell-v1`、`maid-composer-frame-v4`、`maid-composer-lace-tile-v1`、`maid-composer-lace-right-tile-v1/v2`），只存在本地 worktree，分支 `codex/issue-93-ultrawide-composer` 已合并。决定去留后挪到正式位置或删除，再移除该 worktree 和分支；入库前补 `NOTICE` 署名。
- **内置插件图标替换**：两套皮肤的 `assets/plugin-icons/` 已备好 17 枚风格化 SVG，清单与约束见 `docs/plugin-artwork.md`，目前未接线。等官方开放皮肤替换内置插件图标的接口后，按其契约决定分发方式，覆盖宿主各图标位置的兼容（设置项、引导、官方包图标及回退），同步 `NOTICE`，并提高宿主版本下限。

常驻公告保留在 [#14](https://github.com/Small-tailqwq/dsh-deep-whale/issues/14)。
