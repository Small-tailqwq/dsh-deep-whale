# Agent Note: 通用皮肤管理声明协议与本地时间段显隐

Status: implemented

## Problem

皮肤管理器曾硬编码 `maid-atelier` 与 `orca-link` 的包名、开关结构和 DOM 属性。第三方皮肤即使已经安装并带有 `skin.json`，也无法出现在激活列表或暴露自己的配置；旧“按秒轮切立绘”也不能表达工作时段隐藏、非工作时段显示的 SFW 需求。会话来源：2026-08-21 皮肤管理通用化与“不那么二次元模式”。

## Decision

- 常驻管理器从当前 Web profile 的依赖中发现所有有效 `skin.json`，以清单里的 `id`、`package`、`wiring.id`、`bodyAttr` 生成目录和互斥 patch；不再维护皮肤白名单。
- 浏览器端使用 v1 声明协议作为 seam。活动皮肤调用 `exposeSkinCustomization()` 注册布尔、选择和 `visibility-schedule` 控件；管理器只负责渲染、按 `skinId` 持久化和计算当前可见性。
- 皮肤的 adapter 接收 `apply(state | null)`。所有 DOM/CSS mutation、observer、listener 与模型判断仍由皮肤拥有；`null` 必须幂等恢复且只恢复仍由该 adapter 拥有的值。
- “不那么二次元模式”按本机时间使用半开区间 `[start, end)`，支持多个区间、跨午夜，以及“区间内隐藏/区间外显示”和反向策略。关闭模式时始终返回可见。
- v1 旧设置只迁移静态开关和字体；旧按秒轮切不迁移，避免在新语义下意外隐藏立绘。

## Verification

- 单元测试覆盖通用第三方皮肤发现、任意 `skinId` 切换、旧设置迁移、正反时间策略、跨午夜、注册加载顺序和属性所有权恢复。
- 3080 实际目录发现 Internet Angel、maid-atelier、Deepcel 与 ORCA LINK；真实切换 ORCA → maid → ORCA 成功。
- 浏览器在 14:42 使用 `09:00–12:00` 与 `14:00–17:00`：区间内隐藏得到 `hidden`，反向策略得到 `visible`；验证后恢复为关闭。
- 管理器、maid-atelier 与 orca-link 测试和构建通过，固定端口冷启动探针与 HTTP/boot 校验通过。

## Alternatives considered

- **继续在管理器里为每套皮肤加专用字段**：每新增一个皮肤都要改管理器并重复生命周期逻辑，接口浅且无法独立分发，放弃。
- **把全部配置写进 `skin.json` 并由管理器直接改 DOM 属性**： inactive 皮肤易展示配置，但管理器必须知道皮肤实现细节并承担其清理责任，破坏皮肤所有权，放弃。
- **让每套皮肤实现完整设置页和定时器**：避免协议设计，但重复持久化、时间计算和 UI，正是需要消除的管理轮子，放弃。
- **保留按秒显示/隐藏轮切**：只适合演示动画，无法表达办公时段和 SFW 意图，放弃。

## Consequences

- 任意带有效 `skin.json` 的已安装皮肤都会自动出现在激活列表；Deepcel 等皮肤只需接入小型声明接口即可获得统一配置 UI。
- 配置协议当前只包含三种控件；新增控件类型必须版本化并保持旧皮肤可用。
- 活动皮肤负责严格的 side-effect 清理，管理器无法替皮肤修复不完整的 `apply(null)`。
- Node 半边路由变化需要通过冷启动探针后重启；普通 client/皮肤 adapter 更新仍可配置热加载。

## Related

- 会话：2026-08-21 皮肤管理通用化与“不那么二次元模式”
- 仓库：`dsh-deep-whale/skin-manager`、`maid-atelier`、`orca-link`
- 接口：`skin-manager/src/protocol.ts`

