---
name: dsh-skin-upgrade
description: "审计并适配 DSH Web 展示型皮肤或主题插件的宿主版本升级，复用并补充按 exact SHA 持久化的宿主差异卡，再为当前皮肤独立建立影响矩阵；覆盖官方源码契约、DOM/CSS 结构、客户端模块表、生命周期与提交型构建产物。普通服务或工具插件升级、皮肤安装切换、以及没有升级差异的单纯性能优化不使用本技能。"
---

# DSH Web 皮肤升级

目标：以精确的 DSH 源码版本和皮肤真实调用面为证据，找出宿主升级对展示型 client 插件的影响，完成最小适配，并明确冷代码验证与真实宿主验证之间的边界。

## 必读通用审计

- 每次升级都读取 [references/contract-audit.md](references/contract-audit.md)，按其中的关系级审计检查构建、DOM、生命周期与产物。
- 安装、切换、重新 link 或指定提交运行验证改用 `dsh-skin-install`。只有提供了 Performance Trace 并要求定位瓶颈时才使用 `dsh-performance-investigation`。

## 权威来源与隔离

1. 读取目标皮肤仓库的 `AGENTS.md`、工作区状态、manifest、构建配置和真实入口。保护用户已有修改。
2. 使用官方 `deepseek-ai/deepseek-harness` 仓库中的精确 tag 或 commit；记录解析后的完整 SHA。发布说明用于确定调查方向，源码和调用者决定兼容结论。
3. 在独立 clone 或 detached worktree 中比较和适配。不要切换正在使用的源码 checkout，也不要把测试包 link 到用户当前 profile，除非用户明确要求运行验证。
4. 记录皮肤基线 commit、目标 DSH commit、dirty state，以及本次是“只支持目标版本”还是“同时支持一段版本走廊”。后者必须来自用户要求或仓库支持契约，不能仅因手边有旧版源码就自行扩大。
5. 历史适配提交只作行为与回归证据。普通工程升级允许按下文复用 Host Delta Card，但必须先从当前皮肤冻结 dependency contract keys；用户要求独立适配或技能前向评测时，在候选矩阵与补丁冻结前隐藏历史卡、golden patch 和现成适配分支，冻结后才作为 oracle 对照。不要把终端或工具返回的 `git show`/`git diff` 文本当成完整文件来源：输出可能被 token/字符上限截断。读取当前文件后只应用必要 hunk；确需整文件替换时必须从未截断的文件对象读取并先核对行数与 hash。
6. 宿主源码 checkout 的 HEAD 只证明源树版本，不证明正在服务的运行产物版本。源码启动器可能直接加载被 Git 忽略的 workspace `lib`；依赖安装也不等于构建。真实宿主验证前按官方源码仓库的构建入口生成宿主产物，并用页面暴露的版本信息及至少一个目标版本独有的 DOM/行为锚点证明实际运行版本。同包名本地 link 改指另一个工作树时，profile 路径和启动清单包名也不能证明旧进程已换用候选 client artifact；还要核对 served revision/hash 或一个只存在于候选构建中的编译后行为。证据仍指向旧产物时停止视觉归因，按已授权的精确测试进程重启流程处理。
7. 无法固定任一版本、运行产物或支持范围时只给风险判断，不宣称已适配。

## 双层差异资产

升级记录分成两层，不能混写：

1. **Host Delta Card**：脚手架 `.agents/knowledge/dsh-host-deltas/` 的持久化宿主事实，只写官方
   repository、base/target 完整 SHA、Git object/blob、contract key 与
   `changed / checked-unchanged / unknown`；不含任何皮肤补丁或视觉选择。
2. **Skin Adoption Matrix**：当前皮肤本轮产生的影响卡，写皮肤 import/selector/owner、拟采取动作、
   验证边界与 `受影响 / 无变化 / 未证实`。默认放当前任务忽略目录，不进入皮肤发行包。

B 皮肤可以服用 A 升级时证明的宿主事实，但不能继承 A 的“已适配”结论。卡片 identity 只认官方
仓库与 exact SHA；tag/version 仅展示。已 verified 的 revision 不改写，补证或纠错新增 revision 并
绑定上一文件 SHA-256；draft 只在首次晋升前补全。共享 store 不可写或脚手架工作树存在冲突时，把完整 card proposal 放当前皮肤
`.agents/bridge-state/host-delta-drafts/`，最终明确报告 deferred；不要静默丢弃、自动 commit/push，
也不要覆盖中央脏工作树。

## 读取与冻结顺序

1. 固定官方 base/target SHA、皮肤 commit/dirty state 与支持范围。
2. **读取历史卡之前**，只从当前皮肤源码冻结 dependency contract keys；这是防止卡片把调查面
   变成预写答案的边界。
3. 读取 `.agents/knowledge/dsh-host-deltas/INDEX.md`，再用
   `pnpm host-deltas:query -- --base <sha> --target <sha> --keys <key,key>` 只取相关事实。
4. 对命中的每条 edge 记录 revision、file SHA-256 与 facts SHA-256；在可用官方对象库上运行
   `pnpm host-deltas:verify-source -- --source <checkout> --base <sha> --target <sha>`。对象不符、
   卡链断裂、反向、跨分支、缺 key 或 `unknown` 一律现场重查，不能猜成 unchanged。
5. 把已验证宿主事实映射到当前皮肤，生成 Skin Adoption Matrix。冻结门槛是皮肤依赖清单中的
   每个候选触点都有证据并进入三态之一，不要求穷尽宿主全部 diff；暂时闭合不了的立即标未证实。
6. 保存 adoption 初版 hash 后才改代码。新证据写增量附录；不能迎合补丁静默改写初版。
7. 卡里没有的通用宿主事实，从官方对象补证并形成下一 revision；皮肤特定实现只留 adoption/note。

没有现成 edge 时，先用 `pnpm host-deltas:init -- --source <checkout> ...` 固定 diff inventory 和
坐标，再填 facts、重新计算 `factsSha256`，用 `host-deltas:verify-source -- --include-draft` 核验后把
status 从 draft 提升为 verified。schema、三态、revision 和查询规则见
`.agents/knowledge/dsh-host-deltas/README.md`。

## 数据卡推导方法

建立 `受影响 / 无变化 / 未证实` 三态矩阵，至少覆盖：

- `client/web/src/platform.ts`、client bundler preset、manifest 的 `dsh.client`/旧声明、最终 bundle 的模块请求；
- 皮肤使用的 slot、`data-*`、ARIA、role、事件、CSS 变量、portal 和 DOM 相对关系；
- observer、listener、timer、animation frame、注入节点、body/root 属性及热切换释放；
- 高频 mutation、scroll、resize、streaming 与动画路径的触发频率、影响范围和布局/样式读写；
- `src`、提交型 `lib`、`skin.build.json`、包身份、素材与许可链。

矩阵必须双向建立：既从现有皮肤 import/selector 追到宿主，也从宿主 diff 检查皮肤已经接管的 composer、conversation、header、sidebar、settings、message tail 与 overlay 中是否新增或移入了原生控件。展示型皮肤没有旧 selector，不代表新控件没有视觉影响。

每个新增或移入皮肤展示面的用户可见宿主表面都要单列，包括皮肤决定保留原生外观、当前无法确定设计、或不在本轮实现范围的项目。记录它的位置、可见状态、与现有皮肤语言的关系，以及 `已适配 / 保留原生 / 待用户决定 / 未证实` 的处理结论；不能只把它埋在宿主 diff、测试缺口或“未修改”汇总里。

升级审计还要给出静态性能风险预估，但不把预估冒充 Trace 结论。对皮肤或宿主变化涉及的高频路径，检查是否扩大 observer/selector 作用域、增加同步布局读写、在 resize/scroll/streaming 中反复写样式、触发大范围失效，或让新增控件进入已有动画与 mutation 热点。若只有风险线索，记录触发场景、可能影响、证据边界和建议的同条件测量；没有用户授权时不因此运行 benchmark/Trace，也不擅自实施性能重构。

只确认某个 `data-*` 名称仍存在是不够的。逐个检查皮肤实际依赖的父子、兄弟、滚动容器、定位容器和 portal 关系，特别搜索 `:scope >`、CSS `>`、`parentElement`、`children[n]`、`first/last-child` 和从 CSS Module 名称推断所有权的代码。宿主插入无语义 wrapper 时，从稳定的后代钩子反向定位最近的稳定 owner；不要绑定新 wrapper 的哈希类名，也不要无界放宽为全页面选择器。可见的 `aria-label` 文本通常会本地化；优先组合 role、ARIA 状态和 owner 关系，除非仓库明确把某个 locale 文本定义为固定契约。

manifest 的模块加载元数据不等于 Cordis 服务 readiness。持续服务使用宿主支持的注入生命周期并对称清理；DOM 只能作为有证据的短暂展示兜底，不能替代完整业务数据。

## 实施边界

- 修改拥有行为的皮肤源码和必要的直接依赖；不借升级之名重构视觉系统、接入新服务或改变模型请求。
- 对新增宿主控件，原生功能可用只证明交互未被阻断，不能直接判定皮肤兼容。若现有设计 token、相邻控件或已验证的历史皮肤实现足以确定外观，做最小语义化适配；否则列为“未证实”的真实宿主视觉项，不凭空发明样式。
- 已验证历史实现包含浅/深主题、窄/宽布局、hover/focus/active/dragging 或 reduced-motion 分支时，逐项确认目标宿主是否仍有这些状态。最小改动是把规则限制在受影响控件，不是在没有证据时合并或删减仍受支持的状态分支。
- 先从 package script、import 和调用者证明本包实际使用了哪段构建辅助代码。只同步目标版本所需的模块表、external 或纯净度规则；不要因为官方共享预设整体变化就删除、复制或改写本包未调用的 helper。
- 目标单版本适配可以替换已失效的旧关系；多版本走廊才保留经过精确源码证明的旧路径，并为每个结构分别加夹具。每个发生变化且有冷测试入口的关系至少要有一个精确目标版夹具，避免旧结构测试通过掩盖迁移漏项；不要机械改写不触及该关系的无关夹具，也不要为猜测的 DOM 同时维护多条宽泛路径。
- 每次激活拥有自己的 mutation、listener、observer、timer、节点和属性租约。先注册可执行的 cleanup，再进入可能失败的工作；只恢复本次激活实际改过的值。
- `skin.json.dshCompatibility` 必须符合当前 schema。目标版本无法被该字段表示时，保留最后一个明确验证且可表示的版本；不能虚构一个近似版本，待 schema 可表示并完成相应验证后再更新。
- 源码或素材变化后运行仓库既有 build，提交型 `lib` 和生成的 `skin.build.json` 必须同步；不得手改 fingerprint。
- 每完成一批编辑立即检查 `git diff --stat` 和关键文件行数。若升级补丁突然删除大段既有定制，先停止并恢复本批由自己产生的改动，再重新以最小 hunk 实施；不要用后续编辑掩盖异常覆盖。

## 验证与报告

运行受影响包已有的最窄确定性测试、build/typecheck/lint 中实际存在的命令以及 `git diff --check`。检查最终 bundle 的模块请求、机器绝对路径、远程运行时资产和 source map。不要为了升级默认运行浏览器、GUI、真实 profile 或 E2E。

若用户另行授权真实宿主验证，先确认实际监听进程、checkout、宿主构建产物、profile 和所有额外 `--patch` 层，再判断皮肤是否未生效。优先闭合数据卡中可由实机判断的 `未证实` 行，并把结果写成带时间与运行坐标的增量附录，不改写冻结初版。页面加载后对每个迁移关系做一次运行时 census：确认新语义目标的数量与 owner、旧关系不再被依赖，并读取关键计算样式或皮肤自有状态，证明规则实际命中而不是仅有 DOM。元素类型、可编辑模型或折叠/隐藏布局发生变化时，实际检查指针唤醒、focus、键盘、IME、caret 与草稿保留；jsdom 的程序化 `.focus()` 不能证明隐藏或浏览器可编辑输入面真实可达。若 checkout SHA、页面版本和目标版独有锚点不一致，先排查 stale `lib`/overlay，不进行视觉归因；构建成功也不能替代视觉、IME、拖拽、portal 或热切换验收。

最终报告必须给出：

- 起止版本的完整 SHA 与证据来源；
- 每个相关宿主变化的三态结论、皮肤触点和采取/不采取动作的理由；
- 新增或移入皮肤展示面的用户可见 UI 清单，并明确哪些已经适配、保留原生、需要设计选择或仍未证实；
- 基于实际高频调用面的性能风险预估、证据强度与建议验证场景；没有 Trace 时明确写成风险而不是回归结论；
- 修改文件和生成产物；
- 实际运行的检查及结果；
- 未运行的真实宿主、视觉、交互或性能验证；
- 一个按影响排序的人机协同清单，只保留需要用户作设计取舍、提供运行证据或授权专项验证/修复的未闭环事项；没有则明确写无。
