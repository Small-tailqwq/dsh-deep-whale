# 鲸鱼娘皮肤：选择器命中检查第一步（给 GPT 接手用）

依据：`Small-tailqwq/dsh-deep-whale` main @ `6421ca5`（2026-11-12），官方 `deepseek-ai/deepseek-harness` 标签源码。
本文只是方案，尚未改动任何脚本。

## 现有验证器已经做到的

`scripts/audit-host-styles.mjs` + `scripts/style-audit/*` + `scripts/capture-host-styles.mjs`（说明见 `docs/style-matching-workflow.md`）：

- 固定宿主完整 SHA，从 Git 对象库读官方生产源码，不吃本地 checkout。
- 抽出两套皮肤全部 CSS 选择器（含 `:is/:where/:has` 每个分支）和 TS 里的 DOM 查询。
- 静态核对：宿主源码里找不到的属性 / 类片段 / 取值 → `needs-source-review`；`--base` 列出被删掉的。
- 夹具核对：跑皮肤测试时录 DOM，在禁网 Chrome 里逐分支匹配。
- 真实页面采集：隔离 DSH 实例 + 合成会话，按场景记命中数、owner、几何和计算样式。
- `--baseline`：同选择器同场景从有目标变零目标 → 回归（退出码 1）。
- `orca-link` 的 `test:host-structure` 把宽度把手夹具绑定到宿主文件 blob，来源变了就 `NEEDS_REVALIDATION`。

## 缺口

1. 没进 CI，也没有"官方出新标签就跑"的触发（文档自己写了尚未接入）。
2. 真实采集要手动构建官方 DSH，跑一次成本高。
3. `inspectPage` 只采 10 个样式属性（color、background-color、display、visibility、opacity、width、height、content、animation-name、pointer-events），没有 border / outline / box-shadow；每条规则只取前 3 个目标。
4. 不跟官方默认皮肤对照，所以"选择器照样命中、但宿主新加的属性被皮肤染了色"这类问题看不出来。

## 0.2.2 两个案例：现有工具抓不抓得到

- **侧栏折叠灰线（#231，已由 `856849a` 修）**：抓不到。0.2.2-rc.1 把 `.panelRow` 的横向缩进从 `margin: 0 2px` 改成 `border-inline: var(--dsh-sidebar-paint-inset) solid transparent`（已在官方 `dsh-v0.2.1-rc.5` 与 `dsh-v0.2.2-rc.1` 的 `packages/client/ui-sidebar/src/client/SidebarRoot.module.css` 核对）。皮肤的通配 `border-color` 规则照常命中，是"命中了但画错了"，不是"没命中"。采样没有 border 属性，前 3 个目标多半也不是 panelRow；官方折叠态自己写了 `border-inline: 0`，只有第三方折叠（`data-sidebar-nav-collapsed`）才显眼，现有场景没有。
- **宽度把手零命中（文档里的 `conversation.hero.frame` 包装）**：带运行时采集 + 基线时能抓到；只跑静态不行（属性名两边都在）。
- **手机端坏了一天（PR #232 评论）**：评论只说"孩子手机上的歇逼了一天"，没说坏在哪，无法确认成因，暂不当测试用例。需要报告者补现象和 DSH / 皮肤版本。

## 第一步（按顺序，每步可单独合入）

1. **CI 静态层**：新增 workflow，PR 触发 + 每日定时。`git ls-remote --tags` 官方仓库，`dsh-v*` 里比仓库内 `host-pin.json` 新的标签就跑
   `audit-host-styles.mjs --source <blobless clone> --ref <新SHA> --base <pin SHA>`（不带 `--runtime`）。
   与提交在仓库的上一份 `report.json` 对比，只在**新增** `needs-source-review` 行、`removedHostAttributes`、过期夹具绑定时失败；报告作为 artifact 上传。
2. **补采样属性**：`inspectPage` 加 `border-{top,right,bottom,left}-{width,color}`、`outline-color`、`outline-width`、`box-shadow`；样本按宿主 owner / 类片段去重取样，而不是只取前 3 个。
3. **加"透明被染色"检查**：同一场景分别在官方默认皮肤和本皮肤下采集；对每个元素，若某边宽度 > 0、默认皮肤下颜色 alpha = 0、本皮肤下 alpha > 0 → 记 `painted-transparent`，计入退出码 2。同理查 outline。
4. **加场景**：侧栏面板列表用第三方方式折叠（打 `data-sidebar-nav-collapsed`、不加官方 `.collapsed`），36px 图标格。
5. **验收用例（必须全部达成才算这一步完成）**：
   - 宿主 `66491b05`（0.2.2-rc.1）、`--base b830ec95`（0.2.1-rc.5），皮肤用修复前 `374bebb` → 必须报出 panelRow `painted-transparent`；皮肤换成 `856849a` → 不报。
   - 宿主 `fcc0ad46` 对修复前的 LINK 宽度把手规则 → 必须报零命中回归。
   - 再把 #231 里的最小复现 HTML 做成 `node --test` 单元夹具，不依赖真实宿主。
6. **运行时层进 CI 放后面**：需要在 runner 上构建官方 DSH + Chrome，先在你电脑本地或自托管 runner 上跑，静态层稳定后再接。
