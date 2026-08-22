---
name: dsh-skin-install
description: 安装、切换、更新或验证 DSH Web 本地皮肤（dsh-deep-whale 鲸鱼娘皮肤系列）。已安装/已 clone 的皮肤直接快速切换，不重复下载；仅在用户明确要求时同步远端或测试指定提交；重启前必须验证 profile 包身份与冷启动。当用户要求安装、切换、更新、加载本地改动或测试皮肤提交时使用。
---

# dsh-deep-whale 皮肤安装与切换

目标：让 DSH Web 皮肤快速且可恢复地生效。**首次安装默认注册仓库内全部皮肤、只激活用户选中的一套；先预置互斥状态，再新增包，任何时刻都不能让多套皮肤同时启用。**切换和已安装 link 的代码更新走热加载；初次新增包才重启；更新与指定提交测试只在用户要求时发生。

**本技能只给流程指导，具体事实以现场读取为准**：仓库会更新（新增皮肤、改署名链），不要依赖本文件或记忆中的清单，实时读取。

## 效率红线（任何场景都必须遵守）

- **一步一条命令**：同一个信息只获取一次；验证以 `dsh --profile <name> --dump-config` 的一次输出为准，不要再去 grep/read dsh 安装目录源码求证 patch 语义。
- **调用预算**：已安装→切换 ≤ 8 次工具调用；初次安装 ≤ 20 次；更新 ≤ 6 次。超预算说明在重复劳动，立即停止并汇报已完成动作。
- **默认不调用 `dsh-plugin-verify`，禁止读 dsh 源码包**。只有用户明确反馈“不生效/报错”时才进入诊断。
- 页面观感（装饰是否好看、设置面板布局）由用户刷新后自行确认，不由你逐项核对。

## 先判断场景（决定走哪条路）

先查当前 dsh 环境：`dsh plugin --profile <name> list`（实际 profile 名如 web；本地路径安装显示为 `link:`）。按实时清单核对 skin-manager 与每套皮肤的 `package` 是否都已安装，并确认本地是否有该仓库的 clone：

- **skin-manager 与清单中的全部皮肤均已安装（link: 依赖）→ 场景 A 切换**：直接热切换，不 clone、不提问、不介绍，**跳过“重启安全闸门”与扫描清单**。
- **目标皮肤未安装，或仓库内仍有皮肤未注册 → 场景 B 初次/补齐安装（本地仓库）**：直接用现有 clone，绝不重新下载。
- **未安装且本地无 clone → 场景 B 初次安装（需克隆）**：此时才 `git clone`。
- **用户明确要求"更新/检查更新" → 场景 C 更新**：才对比远端提交。
- **用户要求加载本地修改或测试指定提交 → 场景 D 验证开发版本**：保护当前工作区和正在运行的 DSH。

## 重启安全闸门（仅在新增/删除插件包等确实需要重启时执行）

**AI 不得自行 kill 或重启正在运行的 dsh web 进程**——宿主进程被杀，当前会话立即断线，任务无法收尾。需要重启时：把准确的启动命令（含 DSH_HOME/端口/环境）交给**用户**执行，或在用户明确授权后由你执行；冷启动探针（独立的 `--port 0` 临时进程）除外，可自行启动与终止。

DSH Web 正在运行不代表磁盘上的 profile 能再次启动；旧进程可能仍持有修改前的插件图。不要把“当前页面可用”当作冷启动证据，也不要在检查前建议用户重启。

1. 读取目标皮肤的 `package.json.name` 与 `skin.json.package`，两者必须相同。
2. 检查 `~/.dsh/profiles/<profile>/package.json`：依赖键、`dsh.profile.bundles` 条目和本地 link 目标的真实包名必须一致。发现别名或旧 scope 时，先用 `dsh plugin --profile <name> remove <错误键>` 移除，再用目标目录的绝对路径 `add`；**若包名/依赖键正确、只是 link 路径过期或不可访问，直接对新绝对路径执行 `add` 覆盖链接，不要先 remove。**不要手改或追查 `node_modules`、pnpm lockfile；异常后只重跑一次 `plugin list`，仍失败就停下汇报。
3. 运行 `dsh plugin --profile <name> list` 和 `dsh --profile <name> --dump-config`。目标 entry 必须能组合、包名正确且启停状态符合预期。
4. 只有确实需要重启时，先在保留现有进程的情况下运行冷启动探针：`dsh --profile <name> --no-open --port 0`。等待它打印临时 URL 后，只终止这个探针进程。探针失败则保留原进程，修复后重试；禁止让用户用生产端口重启来“试试看”。
5. 冷启动探针成功后才替换原进程，并验证固定端口返回 HTTP 200、启动页 `window.__DSH_BOOT__` 含目标包名。终止进程时只操作刚刚记录的精确 PID/会话，不按进程名批量结束。

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

## 场景 B：初次或补齐安装

### 1. 定位仓库（本地优先，绝不重复下载）

- 在当前工作目录或常见位置找含 `skin.json` 的目录（仓库根或子目录）；**找到即用，不重新 clone**。
- 找不到本地 clone 时，才 `git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale` 到临时目录（浅克隆足够：本仓库分发成品 bundle，不需要历史；网络慢时优先浅克隆）。
- 皮肤目录形态：每个皮肤 = 一个含 `skin.json` 的子目录（如 `maid-atelier/`、`orca-link/`），`lib/` 内是预构建的 client bundle（随仓库分发，无需自行构建）。

### 2. 扫描皮肤清单（实时，勿硬编码）

对仓库中每个含 `skin.json` 的目录，读取并汇总：
- `id` / `name`（中文名）/ `nameEn` / `tagline`
- `package`（npm 包名）、`wiring.id`（patch 层控制的插件 id）
- `preview`（亮/暗预览图）

### 3. 与用户交互：安装范围与激活目标必须分开表达

首次安装默认**注册清单中的全部皮肤和 skin-manager，但只激活一套**。用交互工具列出所有皮肤（名称 + tagline），明确说明“以下皮肤都会安装；这里只选择安装后激活哪一套”，并提供“官方默认（全部皮肤停用）”选项。不要把“激活哪套”偷换成“只安装哪套”。

**若用户已在任务里指名皮肤（如“安装 maid-atelier”），跳过询问：仍默认安装仓库内全部皮肤，只把 maid-atelier 设为激活目标。**只有用户明确要求“只安装这一套/最小安装”时，才缩小注册范围；即使最小安装，也必须显式停用其他已经安装的皮肤。

### 4. 向用户交代版权署名链与许可（初次安装必做）

- **署名链**：读取本次将安装的每套皮肤的 `NOTICE`（署名链权威来源）与 README，逐套简述创作链（"一创 XX → 二创 XX → 本皮肤 XX"），附作者主页链接。**以 NOTICE 实际内容为准**，不要凭记忆介绍。
- **许可**：以皮肤 `LICENSE` 为准。当前皮肤为 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享），简明解释：
  - ✅ 可以：个人/非商业使用、复制、分享、二次修改
  - ❌ 不可以：商业性使用；移除署名（须保留完整创作链）；以其他协议发布衍生作品（须相同方式共享）
  - **禁止商用是红线**，务必点明。

### 5. 先预置互斥状态，再注册全部目标包

- **安装前安全不变量**：先运行技能自带脚本，在两个 patch 层一次性预置仓库清单中**全部皮肤**的互斥行；目标皮肤 `disabled: false`，其余全部 `disabled: true`，选择官方默认时全部为 `true`。这一步必须发生在任何新的 `plugin add` 之前，避免新增包默认启用形成 #65 的叠加窗口：
  `node <仓库绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile <name> --target <skin-id|official>`
  脚本复用 skin-manager 的托管块、原子写入和双层回滚逻辑，并保留 patch 中所有非托管内容。**禁止用重定向、整文件覆盖或重新生成整个 YAML 的方式写 patch。**脚本失败即停止，不得继续 add。
- 再依次注册 skin-manager 与本次安装范围内的全部皮肤：`dsh plugin --profile <name> add <仓库绝对路径>/<目录>`（本地路径自动按 `link:` 注册）。默认范围是 skin-manager + 清单中的全部皮肤；已正确 link 到同一 clone 的包跳过，不 remove、不重复 add。新增插件包需要重启，但必须先通过“重启安全闸门”的一致性检查与冷启动探针；**重启由用户执行**（见闸门：AI 不自行杀宿主进程）。
  **路径规范（安装失败高发区）**：绝对路径最稳（Windows 正斜杠/反斜杠均可，pnpm 会自动规范化）；相对路径按 **dsh 命令调用目录**解析——`./`、`../` 前缀可以，但**不要用裸目录名**（如 `add maid-atelier`，会被当作 npm 包名去 registry 拉取而 404 失败）。安装后先 `dsh plugin --profile <name> list` 确认包已注册，再继续。更新（场景 C）后 bundle 变化走热切换，无需重启；**初次安装是新增插件包，必须重启**。
- add 完成后不要再次手写 patch；运行 `--dump-config` 验证预置状态仍然成立，再进入冷启动探针。若新增过程中任一步失败，已安装包可以保留，但必须维持预置的安全状态并向用户说明未完成项。

### 6. 验证生效（两条命令，到此为止）

- `dsh --profile <name> --dump-config` 一次输出，确认：目标皮肤行存在且 `disabled: false`（官方默认则所有皮肤为 `true`）、其余皮肤 `disabled: true`、管理器 `disabled: false`。能看到这些即可，**不要逐行标注 patch 来源**。
- 安装了 skin-manager 时，`GET /api/dsh/skins` 能返回目录即可；**不要**核对定制卡片等页面细节。
- **不要调用 `dsh-plugin-verify`，不要读 dsh 源码。** 页面效果由用户刷新后自行确认；只有用户反馈异常才进入诊断。
- 告知用户刷新页面查看效果；皮肤异常（控制台报错、布局问题）时收集现象再排查。

## 场景 C：更新（仅用户明确要求时）

默认**不做任何网络同步**——已 clone/已安装就原样使用。仅当用户明确表达"更新皮肤/检查更新"时：

1. `git fetch origin`
2. 对比本地与远端：`git rev-list --count HEAD..origin/main`（落后提交数）
3. 落后 > 0 → `git pull --ff-only`，并告知更新内容（`git log --oneline HEAD@{1}..HEAD`）；已是最新 → 直接告知，不做多余操作。
4. 已安装皮肤若更新了 bundle，仍走场景 A 的 patch 热切换生效（无需重启，除非涉及新增/删除插件包）。

## 场景 D：加载本地修改或测试指定提交

- **当前 link 目录里的源码修改**：先按仓库脚本构建并确认提交型 `lib/` 同步，再通过 patch 禁用/启用目标 entry 触发热加载；记录并复核 PID，正常情况下不重启。
- **测试指定提交**：禁止对用户正在使用的工作区执行 `git restore --source=<commit> --worktree -- <skin>`。创建临时 detached worktree，在其中构建并验证，然后用绝对路径把同名包重新 link 到该 worktree；记录原 link 路径，测试结束后才能按用户指示恢复。
- 重新 link 后先核对依赖键仍等于目标 `package.json.name`。若包身份改变，按“移除旧键 → 绝对路径 add → dump-config → 冷启动探针”的顺序处理，不能依赖旧进程内存里的插件图。
- 热加载失败时不要触碰未变化的 patch 文件伪造刷新，也不要立即建议重启；先走有界诊断。只有新增/删除插件包或启动图确实无法热更新时才使用安全重启流程。

## 已知要点（判断用，非写死事实）

- 本仓库皮肤是纯展示层 client 插件：不注入服务、不发 Cordis 事件、不触达模型请求；素材以数据 URI 内嵌于 bundle，激活不依赖远程资源。
- 皮肤可热切换，`wiring.id` 即 patch 层控制的插件 id；皮肤中心/互斥切换机制兼容。
- **skin-manager 插件**（`@dsh-external/dsh-client-ui-skin-deep-whale-manager`，与本仓库皮肤同分发）在设置面板注册"皮肤管理"分类：发现已安装皮肤（`GET /api/dsh/skins`）、一键激活（`POST /api/dsh/skins { target }`，同源校验 + catalog 校验 + 两 patch 层原子写入回滚）、皮肤定制声明渲染（布尔/下拉/可见性时段）。启动时若按 profile→home 优先级计算出同时启用两套及以上皮肤，管理器会自动原子切到“官方默认”；已有零套或一套启用的合法选择保持不变。安装皮肤后管理器自动发现,无需额外配置。
- 仓库 README 安装示例推荐**绝对路径**（`dsh plugin --profile web add <clone 绝对路径>/<皮肤目录>`），并附相对路径规则与失败排查表；懒人版是直接让 dsh 说"安装这个皮肤包"。
- 反馈问题走仓库 issue，不要联系画师本人；二创关注是另一回事。
