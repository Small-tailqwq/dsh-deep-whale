# DSH 样式匹配与夹具更新工作流

研究基线：2026-11-09。脚本核对精确源码，AI 分析结构变化，浏览器验收实际样式。
宽度把手、全量选择器清单、夹具记录与真实页面采集已有可执行入口；截图供审阅，自动视觉比较尚未接入。

## 宽度把手揭示的缺口

两个官方源码坐标的 `package.json` 都写 `0.2.2-rc.1`：

| 官方提交 | 正文结构 | 修复前 LINK 规则 | 修复后规则 |
|---|---|---|---|
| `66491b05e3f05ad35bcdd4f6cd7ed26041d9e3db`，发布标签 | 正文直接包含滚动体和两个把手 | 命中两个把手 | 命中两个把手 |
| `fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159`，核对时的 master | 滚动体外增加 `conversation.hero.frame` slot，把手仍直属正文 | 零命中 | 命中两个把手 |

依据是两个提交的 `ConversationContent.tsx`、`ConversationMainPanel.tsx`、
`ConversationWidthControls.tsx` 与 `ui-renderer/src/client/scoped-slots.tsx`。
`renderFactorySlot('conversation.content')` 本身没有 DOM 锚点；新增包装来自
`renderSlot('conversation.hero.frame')`。比较入口见
[官方源码差异](https://github.com/deepseek-ai/deepseek-harness/compare/66491b05e3f05ad35bcdd4f6cd7ed26041d9e3db...fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159)。

这两个结构都含 `data-phase`、`data-conversation-scroll`、`data-width-handle`。
只查属性名是否存在会通过；只在发布标签的夹具上跑测试，也会通过。
更新检测必须核对完整关系和夹具的源码来源。

## 可执行样例

[conversation-width.json](../orca-link/tests/fixtures/conversation-width.json) 保存两个经源码核对的
最小 DOM 投影，绑定六个宿主文件的 blob。绑定包括 slot 注册、renderer 和原生 CSS，
避免只盯着最终组件，漏掉包装、注册语义与状态变化。

在 `orca-link` 目录运行：

```sh
npm run test:host-structure -- --source /absolute/path/to/official-dsh --ref <fetched-tag-or-full-sha>
```

[脚本](../orca-link/scripts/test-host-structure.mjs) 先解析完整 SHA，再从 Git 对象库读取 blob，
不使用 checkout 的未提交文件或本地 `lib`。全部绑定与已审阅投影相同时，运行
`apply.spec.ts` 的宽度把手检查；任一来源变化且没有对应投影时，输出
`NEEDS_REVALIDATION` 和文件差异，退出码为 1，并停止该轮匹配测试。

测试用生产 CSS 中的实际选择器匹配左右把手，覆盖亮暗主题、拖动标记、减少动态效果规则的目标、
皮肤停用和正文之外的同名控件。减少动态效果的媒体查询生效、真实 hover、伪元素绘制与拖动行为
由浏览器阶段验收。源码绑定通过表示已审阅的来源没有变化；HTML 投影的正确性来自源码审阅。

这个入口只覆盖 LINK 宽度把手。图标继续使用已有 `test:host-icons`，
它从目标源码重新渲染 SVG，再与独立审阅的语义名称比较。

## 全量巡检入口

在仓库根目录运行，开发依赖安装在 `orca-link`。需要 Node.js 24 和本机 Chrome；先在两套皮肤目录安装开发依赖并构建。

```sh
node scripts/audit-host-styles.mjs --source /absolute/path/to/official-dsh --ref <full-sha> --base <previous-sha> --out .test-env/style-audit/current
```

`orca-link` 也提供 `npm run audit:styles -- ...`；该入口的相对参数按包目录解析。
脚本不更新官方仓库或审阅夹具。先 fetch 所需官方对象，再固定完整 SHA；同一版本号下的不同提交分别检查。

[清单提取器](../scripts/style-audit/inventory.mjs) 从两套皮肤的全部客户端 CSS 和 TypeScript、共享 DOM 装饰源码提取：

- 每个逗号选择器，以及 `:is()`、`:where()`、`:has()` 的正向替代分支。嵌套分支保留祖先约束，`:not()` 保留为排除条件。
- media、supports、container 条件，伪元素及声明；CSS 变量定义和 `var()` 引用。
- DOM 查询位置、方法、接收者和静态字符串；参数、可变绑定及无法求值的表达式单列。

提取器使用各包实际的 CSS Modules 文件名和构建规则。女仆的选择器展开属于其构建过程，模块样式须与提交的 bundle 一致。
宿主候选来源从 Git 对象库读取 `packages/`、`apps/` 下生产 `src/` 的 TS、TSX、CSS，排除测试和夹具。
属性名、枚举值、slot 名、类片段和变量的出现位置只作为源码审阅入口。

巡检通过独立 Vitest 配置运行两套皮肤现有测试，记录夹具 DOM、查询调用和精确调用位置；
查询结果只归到调用栈中的直接查询位置，外层调用者不继承嵌套查询的命中。
普通 `npm test` 不安装记录器。夹具在禁网的 Chrome 文档中逐分支匹配；测试中的模块类名按已知本地导出换算，宿主类名保留原样。
保存的 `fixtures/run.json` 绑定采集身份、皮肤源码、构建配置、测试及记录器摘要。只修改巡检算法时可通过 `--fixtures <directory>` 重用；输入变化后必须重新记录。

## 真实宿主采集

使用独立 `DSH_HOME`、官方完整源码构建和合成会话数据。构建方式按目标官方仓库的开发文档执行；不要复制日常 profile 或凭据。
皮肤安装和互斥配置按 [本地安装技能](../.agents/skills/dsh-skin-install/SKILL.md) 执行。
本文采集器使用已安装的皮肤管理器路由切换皮肤，默认检查两套；`--skin` 可只检查已冷启动的指定皮肤。

```sh
node scripts/capture-host-styles.mjs --source /absolute/path/to/built-official-dsh --ref <full-sha> --url-file /path/to/isolated-server.log --skin maid-atelier --out .test-env/style-audit/maid-runtime
```

采集器从隔离服务日志读取带 token 的本地地址，不将 token 写入报告。
页面需要一个名为 `Style audit fixture` 的合成会话；当前实例使用八轮 Markdown、表格、代码块和长段落，未发起模型请求。
会话未出现在列表时明确记录未覆盖，不创建替代 DOM。

采集检查源码 checkout 的 HEAD、服务版本、官方会话 CSS 构建产物及皮肤实际加载的样式。
每个场景核对唯一激活皮肤和样式仍在加载，记录 DOM、截图、媒体条件、命中数、slot owner、几何与计算样式。
DOM 文件保留根属性与 body，移除脚本，不作为可直接打开的离线页面。

场景覆盖会话、hover/拖动、输入草稿、亮暗主题、减少动态效果、左右侧栏、设置分类、手机导航和不同窗口宽度。
手机设置额外检查横向导航、关闭图标尺寸，并实际滚动进入最后一个分类。
插件主页等待原生插件分组出现后采样，避免把加载骨架记为已加载的插件列表。
未安装的第三方插件、桌面标题栏、启动错误、工具执行状态和真实触摸设备需要另设场景。

若热切换出现两套皮肤标记并存，采集失败。分别停掉自己启动的隔离实例，配置单一皮肤后冷启动，使用 `--skin` 分别采集，再合并报告：

```sh
node scripts/audit-host-styles.mjs --source /absolute/path/to/official-dsh --ref <full-sha> --out .test-env/style-audit/current --fixtures .test-env/style-audit/current/fixtures --runtime .test-env/style-audit/maid-runtime/capture.json --runtime .test-env/style-audit/orca-runtime/capture.json
```

## 报告与复核

`report.md` 是完整清单；`report.json` 包含分支、条件、源码 blob、夹具、变量和浏览器证据。

| 状态 | 含义 |
|---|---|
| `runtime-hit` | 当前已加载样式、有效条件和真实页面中存在目标；仍需审阅级联、目标语义与视觉结果 |
| `fixture-only` | 只有夹具或测试调用证据 |
| `query-needs-scope` | 相对接收者的查询需要核对作用域；全局存在同名元素不算实际命中 |
| `needs-source-review` | 宿主生产来源中缺少候选属性、取值或类片段，包含第三方依赖和历史规则 |
| `dynamic-query` | 静态分析无法解析查询，报告附有按调用位置记录的测试值 |
| `not-exercised` | 已采集状态没有覆盖目标 |
| `unsupported` | 浏览器拒绝解析选择器 |

浏览器明细另记未激活媒体条件、未加载样式、container 待核对等状态。
源码绑定变化列入 `needs-revalidation`。历史变体不要求都与新宿主相同；同一夹具至少要有一个已审阅来源完整匹配目标。

退出码：`1` 表示测试或运行时失败、确认的同场景零命中回归；`2` 表示已生成报告但存在待复核或未覆盖项；`0` 要求清单及证据闭合。
命中记录只认证匹配证据，视觉通过仍需要明确的样式与行为断言。

传入 `--baseline <previous-report.json>` 可比较相同选择器身份与相同场景：已到达场景从有目标变为零目标记回归；缺场景、清单增删、目标数量或计算样式变化分别待复核。
基线比较使用相同 Chrome、字体、视口、媒体状态与测试数据；截图留作人工或 AI 审阅，目前没有像素比较与自动审阅结论。

AI 按源码 owner 和场景归类疑点，核对定义、调用者、slot 包装、级联与官方默认界面对照，再决定补夹具或修皮肤。
预期语义、数量及视觉要求须独立审阅，不从当前 matcher 自动生成。
全绿的历史单测、变量名存在和单个合并规则被使用，都不能替代这一步。

图标继续使用 `orca-link` 的 `test:host-icons`，从目标源码重新提取并渲染 SVG；新增名称在审阅前失败。
定时发现新版本、CI 接入、动态查询的真实调用跟踪及截图自动比较尚未接入。

巡检工具的定向检查：

```sh
node --test scripts/style-audit/audit.test.mjs
```
