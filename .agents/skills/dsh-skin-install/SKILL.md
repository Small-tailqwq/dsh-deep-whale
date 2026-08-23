---
name: dsh-skin-install
description: 迁移、切换、更新或验证 DSH Web 的 dsh-deep-whale 根 bundle 与本地开发皮肤。普通首次安装直接使用根包一条命令，不需要 AI；本技能处理旧三包迁移、本地 link、指定提交、互斥切换与故障验证。
---

# dsh-deep-whale 皮肤安装与切换

目标：让 DSH Web 皮肤快速且可恢复地生效。**普通首次安装只注册仓库根 bundle；根 patch 内建安全默认值（manager 启用、全部皮肤停用），不需要 AI 预处理。**旧版独立三包迁移与本地开发仍须保证互斥。切换和已安装 link 的代码更新走热加载；初次新增包才重启；更新与指定提交测试只在用户要求时发生。

**本技能只给流程指导，具体事实以现场读取为准**：仓库会更新（新增皮肤、改署名链），不要依赖本文件或记忆中的清单，实时读取。

## 效率红线（任何场景都必须遵守）

- **一步一条命令**：同一个信息只获取一次；验证以 `dsh --profile <name> --dump-config` 的一次输出为准，不要再去 grep/read dsh 安装目录源码求证 patch 语义。
- **调用预算**：已安装→切换 ≤ 8 次工具调用；初次安装 ≤ 20 次；更新 ≤ 6 次。超预算说明在重复劳动，立即停止并汇报已完成动作。
- **默认不调用 `dsh-plugin-verify`，禁止读 dsh 源码包**。只有用户明确反馈“不生效/报错”时才进入诊断。
- 页面观感（装饰是否好看、设置面板布局）由用户刷新后自行确认，不由你逐项核对。

## 先判断场景（决定走哪条路）

先查当前 dsh 环境：`dsh plugin --profile <name> list`（实际 profile 名如 web；本地路径安装显示为 `link:`）。根包名以仓库根 `package.json.name` 为准；旧安装则会列出 skin-manager 与各独立皮肤包：

- **根 bundle 已安装 → 场景 A 切换**：直接热切换，不 clone、不提问、不介绍，**跳过“重启安全闸门”与扫描清单**。
- **仅旧版独立三包已安装 → 场景 B 迁移**：先切官方默认，移除旧包，再安装根 bundle；禁止根包与旧包同时出现在 bundles。
- **未安装且只需正式版本 → 场景 B 首次安装**：直接添加 `github:Small-tailqwq/dsh-deep-whale`，不 clone。
- **用户明确要求本地开发版本 → 场景 B/D**：复用现有 clone，用仓库根绝对路径 link；找不到才 clone。
- **用户明确要求"更新/检查更新" → 场景 C 更新**：才对比远端提交。
- **用户要求加载本地修改或测试指定提交 → 场景 D 验证开发版本**：保护当前工作区和正在运行的 DSH。

## 重启安全闸门（仅在新增/删除插件包等确实需要重启时执行）

**AI 不得自行 kill 或重启正在运行的 dsh web 进程**——宿主进程被杀，当前会话立即断线，任务无法收尾。需要重启时：把准确的启动命令（含 DSH_HOME/端口/环境）交给**用户**执行，或在用户明确授权后由你执行；冷启动探针（独立的 `--port 0` 临时进程）除外，可自行启动与终止。

DSH Web 正在运行不代表磁盘上的 profile 能再次启动；旧进程可能仍持有修改前的插件图。不要把“当前页面可用”当作冷启动证据，也不要在检查前建议用户重启。

1. 读取目标皮肤的 `package.json.name` 与 `skin.json.package`，两者必须相同。
2. 检查 `~/.dsh/profiles/<profile>/package.json`：依赖键、`dsh.profile.bundles` 条目和本地 link 目标的真实包名必须一致。发现别名或旧 scope 时，先用 `dsh plugin --profile <name> remove <错误键>` 移除，再用目标目录的绝对路径 `add`；**若包名/依赖键正确、只是 link 路径过期或不可访问，直接对新绝对路径执行 `add` 覆盖链接，不要先 remove。**不要手改或追查 `node_modules`、pnpm lockfile；异常后只重跑一次 `plugin list`，仍失败就停下汇报。
3. 运行 `dsh plugin --profile <name> list` 和 `dsh --profile <name> --dump-config`。目标 entry 必须能组合、包名正确且启停状态符合预期。
4. 只有确实需要重启时，先运行 `dsh --profile <name> --help` 核对当前 CLI 参数，再在保留现有进程的情况下启动冷启动探针。当前已验证语法是 `dsh --profile <name> --no-open --port 0`；若现场 CLI 没有 `--no-open`，使用其 help 所示启动语法并设置 `BROWSER=echo` 抑制弹窗。等待它打印临时 URL 后，只终止这个探针进程。探针失败则保留原进程，修复后重试；禁止让用户用生产端口重启来“试试看”。
5. 冷启动探针成功后才替换原进程，并验证固定端口返回 HTTP 200。解析启动页 `window.__DSH_BOOT__.entries`：必须包含 manager 和当前启用皮肤的真实子包 id；被停用的皮肤可以不出现。只查 HTML 是否含字符串、只看 `--dump-config` 或只看 API 都不能证明 client bundle 已注册。终止进程时只操作刚刚记录的精确 PID/会话，不按进程名批量结束。

诊断必须有界：热加载未发生时先查 link 目标、`lib/client.js` 哈希、boot entry 与 `--dump-config`；不要递归扫描整个 `~/.dsh`、全局 `node_modules`，也不要用长时间 SSE 请求碰运气。

## 场景 A：切换（已安装）—— 快速切换，不啰嗦

用户点名目标皮肤（如"切到女仆皮肤"/"切到 orca-link"）后直接执行，**不提问、不介绍作者与许可**：

**首选：皮肤管理器 UI/API 切换**（安装了 skin-manager 插件时）：
1. 告知用户在设置 → 皮肤管理页点击目标皮肤的"切换"按钮（或脚本调用 `POST /api/dsh/skins { target }`，同源校验后服务端执行）；
2. 服务端 `useSkin` 等价于手改两个 patch 层（目标 `disabled: false`、其余 `disabled: true`），**带 catalog 校验与原子回滚**，比手改更安全；
3. 保存即热重载生效（配置 HMR），**无需重启**；告知用户刷新页面即可，会话不受影响；
4. 快速验证：`dsh --profile <name> --dump-config` 一次输出，确认目标皮肤行 `disabled: false`、其余皮肤 `disabled: true`、管理器 `disabled: false`。到此结束，不做其他验证。

**备选（无 skin-manager 插件 / 脚本化批处理）：手改两个 patch 层**：
1. 修改**两个** patch 层（都改，home 层覆盖 profile 层）：
   - `~/.dsh/profiles/<profile>/cordis.patch.yml`
   - `~/.dsh/cordis.patch.yml`
2. 目标皮肤 `disabled: false`，其余已安装皮肤各补一行 `disabled: true`。注意：patch 里没有行的皮肤默认**启用**，所以"只保留一套"必须显式停用其余每一套。
3. 保存即热重载生效（配置 HMR），**无需重启**；告知用户刷新页面即可，会话不受影响。
4. 快速验证：`dsh --profile <name> --dump-config` 一次输出，确认目标皮肤行 `disabled: false`、其余皮肤 `disabled: true`。到此结束。

若用户只说了"切换皮肤"而未指明哪一套，才用一句话列出已安装皮肤询问目标。

## 场景 B：根 bundle 首次安装或旧版迁移

### 1. 确定安装来源

- 正式安装直接使用 `github:Small-tailqwq/dsh-deep-whale`；根包依赖同一仓库版本标签下的真实子包，pnpm 将它们作为同一发行快照安装。发布新根版本时，依赖 spec、根 `version` 与 Git tag 必须同步。
- 本地开发才定位 clone，并以仓库根绝对路径安装。不要分别 add 子目录，除非用户明确要求验证独立包兼容性。
- 根 `package.json` 的 `dependencies` 提供带各自 `dsh.client` manifest 的真实子包，`dsh.skinCollection.packages` 声明 manager 可发现的皮肤包名，根 `cordis.patch.yml` 提供安全默认 wiring。三者必须一起验证。

### 2. 扫描皮肤清单（实时，勿硬编码）

对仓库中每个含 `skin.json` 的目录，读取并汇总：
- `id` / `name`（中文名）/ `nameEn` / `tagline`
- `package`（npm 包名）、`wiring.id`（patch 层控制的插件 id）
- `preview`（亮/暗预览图）

### 3. 与用户交互：安装范围与激活目标必须分开表达

首次安装默认**注册一个根 bundle，其中包含全部皮肤和 skin-manager，并以官方默认启动**。无需询问安装范围。若用户已点名目标，说明首次重启后可在设置页一键激活；本地 clone 场景也可在 add 前用预置脚本写入目标状态。

**若用户已在任务里指名皮肤（如“安装 maid-atelier”），跳过询问：仍默认安装仓库内全部皮肤，只把 maid-atelier 设为激活目标。**只有用户明确要求“只安装这一套/最小安装”时，才缩小注册范围；即使最小安装，也必须显式停用其他已经安装的皮肤。

### 4. 向用户交代版权署名链与许可（初次安装必做）

- **署名链**：读取本次将安装的每套皮肤的 `NOTICE`（署名链权威来源）与 README，逐套简述创作链（"一创 XX → 二创 XX → 本皮肤 XX"），附作者主页链接。**以 NOTICE 实际内容为准**，不要凭记忆介绍。
- **许可**：以皮肤 `LICENSE` 为准。当前皮肤为 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享），简明解释：
  - ✅ 可以：个人/非商业使用、复制、分享、二次修改
  - ❌ 不可以：商业性使用；移除署名（须保留完整创作链）；以其他协议发布衍生作品（须相同方式共享）
  - **禁止商用是红线**，务必点明。

### 5. 注册根 bundle

- **新安装**：根 patch 已让 manager `disabled: false`、全部皮肤 `disabled: true`，因此可直接 add，不需要先改用户 patch：
  - 正式版本：`dsh plugin --profile <name> add "github:Small-tailqwq/dsh-deep-whale"`
  - 本地版本：`dsh plugin --profile <name> add <仓库根绝对路径>`
- **旧版迁移**：先通过 manager 切到官方默认；再移除 manager/maid/orca 三个旧依赖，确认它们已从 `dsh.profile.bundles` 消失，最后 add 根包。不得让根包与独立包同时存在，因为它们插入相同 wiring id。
- **独立包兼容性测试（仅明确要求时）**：仍须先运行技能自带脚本，在两个 patch 层预置互斥行：
  `node <仓库绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile <name> --target <skin-id|official>`
  脚本复用 manager 的原子写入与双层回滚逻辑。禁止重定向或整文件覆盖 YAML。
- 新增根包需要重启，但必须先通过重启安全闸门；重启由用户执行。

### 6. 验证生效

- `dsh plugin --profile <name> list` 应只显示根包（迁移后不得残留三个独立包）。
- `dsh --profile <name> --dump-config` 一次输出，确认三个真实子包 entry 存在、管理器 `disabled: false`、首次安装两套皮肤均为 `true`；已有选择则恰好一套为 `false`。
- 走重启安全闸门完成冷启动，并解析 `window.__DSH_BOOT__.entries`；manager 与当前启用皮肤的真实包 id 必须存在。不得用配置树或 HTML 原始字符串替代此项。
- 安装了 skin-manager 时，`GET /api/dsh/skins` 能返回目录即可；**不要**核对定制卡片等页面细节。
- **不要调用 `dsh-plugin-verify`，不要读 dsh 源码。** 页面效果由用户刷新后自行确认；只有用户反馈异常才进入诊断。
- 告知用户刷新页面查看效果；皮肤异常（控制台报错、布局问题）时收集现象再排查。

## 场景 C：更新（仅用户明确要求时）

默认**不做任何网络同步**——已 clone/已安装就原样使用。仅当用户明确表达"更新皮肤/检查更新"时：

1. GitHub 根包安装：`dsh plugin --profile <name> update @dsh-external/dsh-deep-whale`，再用 `plugin list` 与 `--dump-config` 验证。
2. 本地 link：才执行 `git fetch origin`、比较并 `git pull --ff-only`。
3. bundle 内容更新通常热加载；只有包身份或插件图变化才重启。

## 场景 D：加载本地修改或测试指定提交

- **当前根 link 目录里的源码修改**：先按仓库脚本构建并确认提交型 `lib/` 同步，再通过 patch 禁用/启用目标 entry 触发热加载；记录并复核 PID，正常情况下不重启。
- **测试指定提交**：禁止对用户正在使用的工作区执行 `git restore --source=<commit> --worktree -- <skin>`。创建临时 detached worktree，在其中构建并验证，然后用绝对路径把同名包重新 link 到该 worktree；记录原 link 路径，测试结束后才能按用户指示恢复。
- 重新 link 后先核对依赖键仍等于目标 `package.json.name`。若包身份改变，按“移除旧键 → 绝对路径 add → dump-config → 冷启动探针”的顺序处理，不能依赖旧进程内存里的插件图。
- 热加载失败时不要触碰未变化的 patch 文件伪造刷新，也不要立即建议重启；先走有界诊断。只有新增/删除插件包或启动图确实无法热更新时才使用安全重启流程。

## 已知要点（判断用，非写死事实）

- 本仓库皮肤是纯展示层 client 插件：不注入服务、不发 Cordis 事件、不触达模型请求；素材以数据 URI 内嵌于 bundle，激活不依赖远程资源。
- 皮肤可热切换，`wiring.id` 即 patch 层控制的插件 id；皮肤中心/互斥切换机制兼容。
- 根包 `@dsh-external/dsh-deep-whale` 依赖 manager/maid/orca 三个真实子包；每个子包自己的 `dsh.client` 负责进入 client roster，`dsh.skinCollection.packages` 只负责让 manager 发现归属该 collection 的皮肤。根 patch 直接插入真实子包名。
- **skin-manager 插件**在设置面板注册"皮肤管理"分类：发现已安装皮肤（`GET /api/dsh/skins`）、一键激活（`POST /api/dsh/skins { target }`，同源校验 + catalog 校验 + 两 patch 层原子写入回滚）、皮肤定制声明渲染。启动冲突时自动回退官方默认。
- 仓库 README 的普通安装入口是一条根包 GitHub spec；绝对路径仅用于本地开发。
- 反馈问题走仓库 issue，不要联系画师本人；二创关注是另一回事。
