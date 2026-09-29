# #114：两款皮肤的本机性能复测

测量日期：2026-09-29。修复前基线为本地 `dev` 的 `40cef63`，已经包含上一轮女仆与虎鲸优化；下列改善是本次继续优化带来的增量，不是相对于 npm 发行版。

## 环境与方法

- DSH `0.2.0-rc.1`，独立 `DSH_HOME`，本地链接三款发行包，不修改日常使用的 profile。
- 实际运行的 Chrome `154.0.8037.58`，有窗口模式，1600×900。CDP 确认 RTX 4070 Ti SUPER，GPU compositing / rasterization 均启用。显示器约 240 Hz。
- 两个各 40 轮的合成会话，经宿主原生会话存储、Markdown、表格与代码块渲染；没有调用模型。官方约 4,297 个 DOM 元素，女仆约 4,315，虎鲸约 5,410。
- 安装真实 `dsh-conversation-navigator@0.2.10`，使用 `minimal-left` 模式，约 44 个导航相关元素。其完整面板在当前宿主的官方主题下也报 React 130，不能把这个模式当作可用基线。
- 每项先预热一次，再串行测量三次取算术平均；每轮校验当前激活皮肤。使用 CDP `Performance.getMetrics` 的累计耗时差值，并记录 rAF 帧间隔。表中是整轮操作的样式重算总耗时，不是单帧耗时或键入延迟。
- 正式计时不启用 SelectorStats 或 invalidation tracking；这些诊断开关会显著放大耗时，单独用于归因。

操作定义：输入 41 个字符后全选删除；左栏收起再展开；会话 A→B→A；右栏展开再收起。每次侧栏切换后等待 600 ms。会话预先加载较早记录。

## 结果

单位：ms / 轮，越低越好。同一浏览器版本、同一 profile 和同一会话内容。

| 操作 | 官方 | 女仆：修复前 → 后 | 虎鲸：修复前 → 后 |
| --- | ---: | ---: | ---: |
| 输入并清空 | 14.48 | 149.41 → **31.56**（−79%） | 208.45 → **102.87**（−51%） |
| 左栏收放 | 79.98 | 308.20 → **287.76**（−7%） | 506.51 → **483.15**（−5%） |
| 会话往返切换 | 207.93 | 483.62 → **417.86**（−14%） | 692.78 → **665.14**（−4%） |
| 右栏收放 | 75.63 | 249.31 → **128.41**（−48%） | 362.19 → **242.52**（−33%） |

输入轮的平均最长 rAF 间隔：女仆 80.53→19.47 ms，虎鲸 77.80→20.80 ms。输入轮脚本耗时分别为 79.90→81.71 ms、76.59→78.95 ms；新增标记逻辑没有出现与样式收益同量级的脚本成本。三次样本不构成统计显著性检验，小幅变化不宜过度解释。

**尚未追平官方。** 左栏仍约为官方的 3.6 倍 / 6.0 倍，会话切换约为 2.0 倍 / 3.2 倍。本次没有解决全部侧栏成本，也没有据此宣称 #114 已关闭。

## 原因与修复

除了单条选择器的匹配成本，还存在关系选择器带来的失效传播。Chromium trace 中，编辑器插入或删除节点会产生 `changedPseudo: has`，聊天容器收到的 invalidation set 同时包含 `class`、`span`、`div`、`svg` 等宽泛目标。即使首页或菜单不在显示，其 `A:has(B) C` 规则也会扩大集合，使转录内大量元素重新匹配样式。一次输入相关重算涉及约 6,957 个元素及伪元素；仅看 SelectorStats 排名容易漏掉这种关联。

这与 [#114](https://github.com/Small-tailqwq/dsh-deep-whale/issues/114) 所述“重算次数更少，但每次更贵”相符。机制也可对照 Chromium 的 [invalidation set 构建源码](https://chromium.googlesource.com/chromium/src/+/71729e86fb31e3e968c4922a765c1029360f8e48/third_party/blink/renderer/core/css/invalidation/rule_invalidation_data_visitor.cc)；本次判断的直接依据是本机 trace 和对照测量。

修复把这些特定关系投影为局部属性：

- 女仆：首页标题装饰、输入卡模式按钮与旧版 ContextMeter 结构、侧栏设置按钮及状态行。
- 虎鲸：模型/推理强度菜单的结构类型、含插件入口的侧栏行。
- 共用实现只重新检查受影响的小区域，忽略纯文本变更，不逐键扫描转录，也不新增 body 状态切换。
- 标记按差量写入；保留原属性值，覆盖重叠激活、作用域移除、部分初始化失败和 dispose 的恢复路径。其他关系选择器继续保留。

## 验证与边界

- 两款皮肤均通过 `npm run build`，同步生成 `lib/client.js` 和 `skin.build.json`。
- 女仆现有 `apply.spec.ts`：120 项通过；虎鲸现有 apply / model-menu / sidebar-motion / state-projection：59 项通过。仅同步受影响的既有样式断言，没有新增测试套件。
- 产物 `node --check` 通过；client bundle 无新增 runtime require、无本机绝对路径。
- 真实 Chrome 检查浅/深色首页、1600px 与 390px 设置页；对受影响节点比较修复前后 9 类计算样式，没有差异，并检查截图。
- 浏览器中验证结构插入/移除会更新标记；从构建产物提取标记模块，验证重叠激活、原值恢复、外部改值保留、脱离文档与部分初始化失败清理。
- 皮肤管理器切换后按其实际流程刷新页面，检查旧标记消失。单独 POST 切换接口不会立即卸载当前页面，不能拿它冒充已验证的页面内热卸载。
- 菜单关系的动态验证使用本地 DOM fixture；没有发送模型请求或添加账户。未复现反馈者的完整导航面板、其另外两款插件、UHD 770 或原始真实会话，因此不能复用反馈者的 49 倍数字。

## 本地证据

探针、JSON、截图与诊断 trace 位于忽略目录 `.test-env/perf-probe/`，不进入发行包：

- `seed-114.mjs`：通过已安装宿主的 Session API 生成两份合成会话。
- `measure-114.mjs`：测量四类操作；使用独立实例日志中的本地认证地址，避免把 token 放入命令行或报告。
- `official-chrome-before.json`、`maid-before-final.json`、`orca-before-final.json`、`maid-after-final.json`、`orca-after-final.json`：本表原始三轮结果。其他实验文件不用于本表。
- `functional-114.mjs`、`verify-*.png`：外观、动态关系与切换检查；`lifecycle-114.json`：生命周期检查和 GPU 信息。

在本机独立实例已启动、探针依赖路径有效时：

```powershell
$env:CHANNEL='chrome'
$env:RUNS='3'
$env:AFTER='1'
node .test-env/perf-probe/measure-114.mjs maid-atelier maid-after-final
node .test-env/perf-probe/measure-114.mjs orca-link orca-after-final
```

两条测量必须串行运行；它们共享独立实例的皮肤开关。正式计时不与构建、其他浏览器探针或测试并行。
