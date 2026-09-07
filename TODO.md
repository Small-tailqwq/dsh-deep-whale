# TODO

> 2026-09-07 已核对下列 GitHub issue 的当前状态和讨论。
> 注意事项：白天再回复 GitHub 上的用户；晚上不打扰别人。
> 来源 issue 分析记录见会话整理稿，此处只留可执行项。

## 一、明确待办

- [ ] **#13 发布鲸鱼娘 .ico**
  - 现状：三套透明底 ICO、网页随机 favicon 和固定托腮 Web App 图标已提交并推送 dev（3acd4dc），原图及处理脚本保留；构建产物与包内 README 获取链接已更新。待合并 main 后回复并关闭 issue。
  - 素材：用户 2026-09-07 提供的三张原图，保存在 maid-atelier/assets/icons/source/。
  - 完成标准：.ico 进仓库或 release 资产，README / issue 里有获取指引
- [ ] **#106 README 补充 DSH Desktop / 插件市场注意事项**
  - 现状：README 仍缺 Desktop / 市场说明；#106 已记录市场停用状态冲突与 Desktop 2.0.5 缺少 patch 热重载。上游当前版本是否修复尚待确认。
  - 内容：推荐 README 一行安装命令；解释已有市场停用状态不会因直接安装自动清除；限定 Desktop 2.0.5 的已知行为，避免泛化为所有桌面版本。
  - 完成标准：README 有对应段落（含指向 #106 的上下文）
- [ ] **#100 回复「女仆皮肤教程」提问**
  - 现状：0 回复
  - 待定：想清楚要不要写教程/FAQ，还是简答并指向仓库源码结构
- [ ] **#23 决定裙摆动画是否做并回应**
  - 现状：纯功能愿望；Live2D/动画投入大，且曾说过鲸鱼娘在出新思路前只做小修小补
  - 待定：回复暂不计划 / 收进 backlog 再议

## 二、已完成归档（2026-09-07）

- [x] **#40**：原始 Safari 设置面板问题已修复，有历史 Mac 用户确认；已评论并关闭。其他布局问题不视为一并验证。
- [x] **#53**：ORCA 设置弹窗已有修复及用户确认；已评论并关闭。
- [x] **#81**：对方确认完成 ORCA 移植收录；已评论并关闭。
- [x] **#110**：已说明工坊 0.3.1 分发来源、归档插件身份、本仓库 4cb4297 已有修复及验证边界，已关闭。

## 三、已跟进，等待回复

- **#109**：[9 月 7 日跟进](https://github.com/Small-tailqwq/dsh-deep-whale/issues/109#issuecomment-5567290438)，待安装来源、当前版本和恢复结果。
- **#99**：[9 月 7 日跟进](https://github.com/Small-tailqwq/dsh-deep-whale/issues/99#issuecomment-5567290680)，待分辨率、系统/浏览器缩放、窗口状态及当前截图。
- **#52**：[9 月 7 日跟进](https://github.com/Small-tailqwq/dsh-deep-whale/issues/52#issuecomment-5567290932)，待 EAC 临时会话按钮所属插件、版本及当前截图。
- **#55**：[9 月 7 日跟进](https://github.com/Small-tailqwq/dsh-deep-whale/issues/55#issuecomment-5567291165)，待截图、版本及图标所属插件；已有 4K / 150% 系统缩放信息。
- **#106**：[9 月 7 日跟进](https://github.com/Small-tailqwq/dsh-deep-whale/issues/106#issuecomment-5567294781)，待用户当前版本、恢复结果及上游进展。
- **上游催办未送达**：[dsh-market#519](https://github.com/dsh-market/dsh-market/issues/519)、[dsh-desktop#835](https://github.com/anywhere-labs/dsh-desktop/issues/835) 均开放、无回复；9 月 7 日连接器评论返回 403（集成无写权限）。需有权限的账号继续跟进市场共存边界、Desktop patch 热重载/重启契约；未标为已催办。

## 四、保留

- **#14**（公告牌）、**#20**（安全提醒）：不动
