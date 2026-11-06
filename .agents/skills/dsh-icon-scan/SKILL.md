---
name: dsh-icon-scan
description: 扫描 ORCA LINK 对官方 DSH 图标与加载动画的覆盖，定位版本更新后失配、新增和原有未匹配项。用于图标或加载器遗漏及升级前后的快速检查；完整宿主布局升级使用 dsh-skin-upgrade。
---

# 图标与加载动画覆盖扫描

在皮肤仓库运行，使用官方 DSH 的本地 Git 对象库。检查当前工作区状态，保留未提交内容。

```powershell
node .agents/skills/dsh-icon-scan/scripts/scan.mjs --repo . --source ../dsh --output .test-env/icon-scan/report.json
```

目标默认取 `orca-link/tests/fixtures/dsh-icons.json` 的 `hostCommit`，可用 `--ref <tag-or-sha>` 指定；
比较基线默认取现有图标 fixture 的 `hostCommit`，可用 `--base <tag-or-sha>` 指定。
报告记录双方完整 SHA 和源码 blob，读取已提交对象，不切换宿主 checkout。

- 导出图标通过现有 `render-host-icons.mjs` 渲染，再调用真实 `installOrcaIcons`。期望含义来自 fixture，不能从匹配器生成答案。
- 公共符号表 `ICON_SYMBOLS` 独立枚举，覆盖默认与 compact 变体；通过 `data-icon` / `<use href>` 调用实际绘制器，并检查共享 sprite 原样保留和卸载还原。单组内联控件提取失败记入 `errors`，保留其他清单。
- 已登记的 HTML 加载器也调用真实装饰函数，并核对 TSX/CSS 源码绑定。动态内联 SVG 只有在源码 blob 与已审阅 fixture 一致、登记变体全部通过时才标记 `matched-via-fixture`；源码变化后恢复待核对。
- 同时枚举客户端源码里的所有内联 SVG 和 CSS 加载动画。`StateDot` 等库外控件、圆环由 CSS 绘制或动态拼出的图形都要进入清单，不能只检查图标导出表。
- 按 `change` 区分新增、变化、未变化和删除；按 `status` 区分匹配、失配、错误映射、空 art 和待核对。新增或源码变化本身不等于缺陷。
- 先看 `summary`，再读取有问题条目的源码位置与调用者。动态图形、解析失败和没有 SVG 覆盖证据的 CSS 动画保持待核对；匹配到图形只证明识别成功，位置语义和视觉效果仍需核对。
- 对确认保留原生的品牌、美术、文件类型、图表等内容，给出位置和理由，不为压低未匹配数量添加泛化规则。修复按任务授权完成；发布、安装和真实会话操作不由扫描授权。

脚本依赖 `orca-link` 已安装的 TypeScript、React、jsdom、lightningcss 与现有图标渲染入口。
输出文件为按需报告，不增加 CI gate。扫描范围是官方 `packages/{client,extensions,experimental}` 中的
`src/**/*.{ts,tsx,css}`；远程页面、运行时字符串生成的界面和第三方插件需要另查实际页面。
报告 `errors` 为空时，退出码 1 表示存在未匹配或待核对项；它不表示扫描执行失败。
