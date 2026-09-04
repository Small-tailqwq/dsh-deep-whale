# DSH Web 皮肤升级契约审计

本参考用于每次宿主版本升级。输出以证据矩阵为中心；不要把 release note、构建成功或选择器字符串仍存在单独当成兼容证明。

## 1. 固定比较坐标

记录以下值：

| 坐标 | 必需证据 |
|---|---|
| DSH 起点与终点 | 官方 remote、tag/commit、解析后的完整 SHA、dirty state |
| 皮肤基线 | commit、manifest 的兼容版本、包名与实际入口 |
| 支持范围 | 只支持目标版本，或同时支持哪些精确版本；对应的用户要求/仓库契约 |
| 构建面 | package scripts、client bundler、平台模块表、提交型输出目录 |
| 运行面 | 只在获准运行时记录 profile、额外 patch、宿主构建步骤、实际 served bundle 指纹、页面版本与目标版独有锚点 |

若 tag 可移动或来源不是官方 remote，先报告来源风险。不要用当前源码替代用户点名的历史 artifact 或 commit。

源码运行还要区分 checkout 与执行产物。`install` 只处理依赖时，不会自动更新被 Git 忽略的 workspace `lib`；若官方启动路径消费预构建包，必须先运行官方要求的完整 build。启动后同时核对页面暴露的版本和一个目标版本独有的关系或行为；二者任一仍是旧版时，先检查 served 文件的 hash/时间与 overlay，而不是把页面现象归因给皮肤。

候选皮肤本身也有独立的执行产物边界。同一 package identity 从一个 link 工作树改指另一个工作树后，运行进程可能继续提供先前解析的 client artifact；`plugin list` 的 link 路径、组合配置和启动清单中的包名只能证明注册关系。实机结论还需一个 served revision/hash，或一个从候选 `lib` 推导且旧产物不具备的编译后行为锚点。若锚点仍属于旧产物，在获得精确进程重启授权前只报告 stale runtime，不能比较视觉。

命令输出不是文件对象。`git show`、`git diff` 和日志可能在代理工具的输出预算处被静默截断；不得把显示文本回填为整文件。历史实现用于确认意图和行为，当前基线文件才是编辑底稿。每批 patch 后用 diff stat、行数和必要时的 blob/hash 做规模哨兵，异常大幅删除立即停下处理。

## 2. Host Delta Card 与 Skin Adoption Matrix

日常工程允许复用脚手架持久化的 Host Delta Card，但必须先从当前皮肤源码冻结 dependency
contract keys。宿主卡只记录官方 DSH 的 exact-SHA 事实；当前皮肤的调用点、影响结论、动作与验证
边界另写 Skin Adoption Matrix。不能把 A 皮肤的补丁或“已适配”结论当成 B 皮肤的证据。

独立技能评测使用更严格的盲测顺序：候选矩阵和补丁冻结前不向被测 agent 提供宿主卡，冻结后才把
卡当 oracle。日常工程和盲测都不能先看现成皮肤补丁再反推证据。

Skin Adoption Matrix 推荐结构：

```markdown
# DSH skin upgrade data card

## Coordinates
- Host base: <official remote + ref + full SHA + dirty state>
- Host target: <official remote + ref + full SHA + dirty state>
- Skin baseline: <repository + full SHA + dirty state>
- Support scope: <target only or explicitly requested corridor>

## Contract rows
| Host touchpoint | Base evidence | Target evidence | Skin caller/selector | Changed layer | State | Planned action | Validation boundary |
|---|---|---|---|---|---|---|---|
```

按以下顺序填充：

1. 先解析版本坐标，记录官方 remote、完整 SHA 和 dirty state；统计大 diff 只用于规划，不能直接生成兼容结论。
2. 从皮肤源码、manifest 与 build 入口生成依赖 key；每个 import、selector、owner 关系、生命周期资源和提交型产物都是候选。
3. 冻结 dependency keys 后，查询 exact edge 或连续卡链。逐 edge 校验 revision/file/facts hash，并用官方对象库核对 merge-base、name-status digest、blob 与 locator。tag 或版本相同不能替代对象验证。
4. 卡链中相关 key 全部 `checked-unchanged` 才能复用无变化事实；任一 `changed` 要求当前皮肤复核；缺 key、`unknown`、断链、反向或跨分支均为未证实。中途 changed 不能自动推出最终仍 changed，因为后续可能回滚。
5. 对没有卡覆盖的候选分别读取 base 与 target 文件对象、定义和调用者，记录路径、symbol、blob/hash 或调用链，再判断变化层级。
6. 反向检查宿主 changed files：凡是进入皮肤已接管展示面的新增控件、状态或 portal，即使皮肤原先没有 selector，也新增一行。
7. 只有宿主事实与当前皮肤调用面证据闭合时标记 `受影响` 或 `无变化`；证据缺口、必须实机观察或缺失 artifact 时标记 `未证实`。
8. 依赖清单全部进入三态后冻结 adoption 初版并记录 hash，才实施补丁；新发现另列增量记录，不静默回填成“当时已知”。
9. 新的通用宿主事实写入下一张不可变 card revision；皮肤决定不进入宿主卡。中央不可写时写本地 proposal，并明确 deferred，不自动提交或推送。

## 3. 收集皮肤依赖面

从源码而不是生成 bundle 开始，列出：

1. 浏览器运行时 import、type-only import、manifest inject/external 和 Cordis service 使用；
2. slot 名、`data-*`、ARIA、role、HTML 元素类型、CSS 变量和 CSS Module 后缀选择器；
3. 父子/兄弟/portal/滚动/position/stacking 假设；
4. MutationObserver 过滤、事件目标、ResizeObserver、timer、RAF、注入节点、body/root 属性；
5. build 输入、`lib`、`skin.build.json`、素材 URL、NOTICE/LICENSE。

再反向枚举宿主 diff 中进入上述皮肤拥有区域的新控件和新状态。重点包括 resize/drag handle、导航、连接状态、header action、message action、搜索/分组入口和 portal；即使旧皮肤从未选择它们，也要判断是否沿用相邻视觉语言或保持“未证实”。

用户可见新增面必须在矩阵中独立可见，不能因“保留宿主原生行为”“没有旧 selector”或“本轮不修改”而并入无变化。除源码坐标外，记录出现位置、展示条件、交互状态、当前外观处理和是否需要用户作设计选择。最终报告要把这些项目从矩阵中提取为简短清单，避免用户只能从实现 diff 猜测新功能是否已经纳入皮肤设计。

对每个确定需要适配的展示面，同时列出仍存在的主题、布局和交互状态，例如 light/dark、rail/wide、hover/focus/current/dragging 与 reduced-motion。历史实现若已分别校准这些状态，不能仅因新 selector 可以合并就把它们压成一条规则；先证明状态或差异已经消失。

对 CSS/DOM 重点搜索：

```text
:scope >
 > [data-
parentElement / parentNode
children[ / firstElementChild / lastElementChild
:first-child / :last-child / + / ~
[class*= / [class$= / [class^=
closest( / querySelector(
position: fixed / transform / filter / backdrop-filter / isolation / z-index
```

CSS Module 名称只能作为带语义锚点和安全降级的末级兼容线索；不能用新版本偶然出现的哈希类名修复结构变化。`aria-label` 的可见文本可能随 locale 改变，不能把某一种语言的完整标签当成跨语言选择器；优先使用 role、`aria-current`/`aria-expanded` 等状态与稳定 owner 关系共同收窄。

静态性能预估围绕真实高频入口建立：mutation/resize/scroll/streaming 的触发源，observer 与 selector 的作用域，布局读取与样式写入的先后关系，动画期间重复工作，以及新增宿主节点是否放大既有失效范围。结论记录为“已测量”或“风险线索”；后者必须写明触发场景、可能影响、缺失证据和建议的同条件 Trace/交互复现，不能给出未经测量的改善或回归幅度。发现风险不自动授权 benchmark、Trace 或性能修复。

## 4. 对每个宿主触点比较四个层级

| 层级 | 要回答的问题 | 常见误判 |
|---|---|---|
| 名称 | import、slot、data/ARIA/token 是否仍存在 | 名称存在就判定兼容 |
| 语义 | 值、状态机、事件和可用时机是否相同 | 属性同名但含义改变 |
| 关系 | owner、父子、兄弟、portal、scroll/position context 是否相同 | 中间 wrapper 使 `>` 静默失配 |
| 生命周期 | 服务到达、HMR、重复激活、dispose 和失败回滚是否相同 | manifest metadata 被当成 readiness |

结构修复要从语义 owner 出发。宿主插入无语义 wrapper 后，直属关系可能失效，即使 owner 与目标的语义属性都仍存在。不要把旧的直属查询直接放宽成无界后代查询；先证明目标仍属于当前候选 owner。通用判定可以写成：

```ts
const target = candidate.querySelector<HTMLElement>(targetSelector)
const owner = target?.closest<HTMLElement>(ownerSelector)
if (owner === candidate) return candidate
```

其中 `targetSelector` 与 `ownerSelector` 必须从本次目标源码和实际调用者推导，不能从历史答案复制。CSS 同理：改变 `>` 前先证明新关系只会命中目标 owner。一个区域出现多个控件时，从官方源码确认目标功能对应的 element、role、ARIA 状态和 owner 关系；不要选择首个或任意控件。

## 5. 构建与模块表

同时核对：

- 官方 `PLATFORM_MODULES` 或等价表的键；
- 官方 client bundler 的 baseline externals、inline-safe 规则和 manifest 语义；
- 皮肤 build 配置与 manifest 声明；
- 最终 `lib/client.js` 的裸模块请求。

四者必须一致。平台模块表未变化只证明加载面稳定，不能推导 DOM 或 CSS 稳定；源码不再 import 某包也不代表旧生成 bundle 已更新。

在复制或删除共享构建逻辑前，用 `rg` 追踪该 export、helper 和配置分支在当前包的调用者。官方预设是契约证据，不是要求整文件同步的模板；未被当前包调用、且不影响目标 bundle 的 mobile/server/companion helper 留在原处，除非它本身阻断目标构建。

## 6. 生命周期与宿主所有权

- DOM/CSS mutation、observer、listener、timer、RAF 和注入节点都属于一次皮肤激活。
- cleanup 在 fallible work 前可达；dispose、部分 apply 失败、重复激活和热切换都必须回收本激活拥有的状态。
- 属性或样式恢复保存精确原值，并只在当前激活仍拥有该值时恢复。共享 body/root 状态使用每次激活的 lease，不能由旧激活删除新激活状态。
- 不移动 React/Markdown renderer 拥有的节点；在原位增强。皮肤自有预览可 clone，但 clone 不回写宿主 renderer 树。
- `position: fixed` 的浮层要检查所有祖先的 transform/filter/backdrop-filter/contain；z-index 不能逃出祖先 stacking context。

## 7. 产物闭包

构建后检查：

1. `package.json.name` 与 `skin.json.package` 一致；
2. `src` 变化对应提交型 `lib` 变化，`skin.build.json` 由 build 生成；
3. bundle 无绝对机器路径、意外 source map、运行时远程素材或未知裸 `require()`；
4. CSS Module 编译未改写关键 selector，素材与 NOTICE/LICENSE 署名链仍闭合；
5. 不把 consumer `prepare` 或本机依赖路径带入发行包。

## 8. 结论与验证等级

矩阵状态：

- **受影响**：存在真实皮肤调用点，且宿主名称、语义、关系或生命周期已变化。
- **无变化**：相关宿主源码或等价行为可证明相同，且皮肤调用点已逐项覆盖。
- **未证实**：需要 GUI、浏览器、真实 profile、设备、性能 Trace 或缺失 artifact 才能判断。

冷验证可包含已有的定向单元测试、build/typecheck/lint、`git diff --check` 与产物扫描。它不能证明视觉、IME、拖拽、焦点、portal、真实热切换或性能。真实运行另获授权后，还要先确认正在监听的进程、checkout、宿主构建产物、profile、home/profile patch 和命令行额外 `--patch`；否则可能把 stale bundle 或 overlay 覆盖误判成升级回归。

真实页面对每个已迁移关系做最小 census：记录目标数量和稳定 owner，验证旧的直属/兄弟关系不再被代码依赖，并读取关键计算样式、伪元素或皮肤自有属性。选择器文本存在、DOM 名称存在和视觉上“差不多”都不能单独证明皮肤规则已经命中。

若用户已授权真实宿主验证，按风险优先处理初版卡中的 `未证实` 行，并把运行坐标、观察和状态变化写入增量附录；保留初版 hash，不把运行后才知道的事实回填成静态审计结论。编辑元素类型、可编辑模型、折叠或隐藏方式发生变化时，至少验证一次真实指针唤醒、focus、键盘输入、IME/caret 与草稿保留。DOM 夹具或 jsdom 的 `.focus()` 只能证明代码路径，不能证明隐藏元素或浏览器可编辑输入面真实可达。

收尾时把矩阵中的新增可见面、性能风险线索和仍为 `未证实` 的用户相关事项提炼成人机协同清单，按用户可见影响排序。每项说明当前选择、为何尚未闭环，以及需要的是设计取舍、运行证据还是另行授权；不要只列一串“未运行测试”，也不要把可选美化伪装成兼容性阻断。

若声明多版本走廊，结构测试必须分别构造每个受支持版本的最小 DOM。若声明只支持目标版本，每个改变的关系至少应由一个精确目标版最小 DOM 夹具覆盖；旧 fixture 继续通过不能证明新 wrapper、sibling 或 portal 关系已被验证，同时也不需要机械重写不经过该关系的测试。不要用“兼容”措辞暗示旧版仍被验证。manifest 的最后验证 RC 只是元数据限制，不自动等于多版本支持承诺。

推荐矩阵格式：

| 宿主变化 | 皮肤触点 | 状态 | 动作 | 证据/未验证项 |
|---|---|---|---|---|
