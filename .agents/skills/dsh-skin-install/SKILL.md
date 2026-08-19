---
name: dsh-skin-install
description: 安装、切换或更新 DSH Web 皮肤（dsh-deep-whale 鲸鱼娘皮肤系列）。已安装/已 clone 的皮肤直接快速切换、不重新下载；仅当用户明确要求更新时才对比本地与远端提交；只有初次安装才做皮肤清单询问与署名链/许可介绍。当用户要求安装/切换/更新皮肤（如 maid-atelier 深海女仆工坊、orca-link 虎鲸链路、鲸鱼娘皮肤）或"安装皮肤"时使用。
---

# dsh-deep-whale 皮肤安装与切换

目标：让 DSH Web 皮肤快速生效。**切换走捷径，初次安装才走全流程，更新只在用户要求时发生。**

**本技能只给流程指导，具体事实以现场读取为准**：仓库会更新（新增皮肤、改署名链），不要依赖本文件或记忆中的清单，实时读取。

## 先判断场景（决定走哪条路）

先查当前 dsh 环境：`dsh plugin --profile <name> list`（实际 profile 名如 web；本地路径安装显示为 `link:`）。按目标皮肤的 `package` 名核对是否已安装，并确认本地是否有该仓库的 clone：

- **已安装（link: 依赖）→ 场景 A 切换**：直接热切换，不 clone、不提问、不介绍。
- **未安装但本地已有仓库 clone → 场景 B 初次安装（本地仓库）**：直接用现有 clone，绝不重新下载。
- **未安装且本地无 clone → 场景 B 初次安装（需克隆）**：此时才 `git clone`。
- **用户明确要求"更新/检查更新" → 场景 C 更新**：才对比远端提交。

## 场景 A：切换（已安装）—— 快速切换，不啰嗦

用户点名目标皮肤（如"切到女仆皮肤"/"切到 orca-link"）后直接执行，**不提问、不介绍作者与许可**：

1. 修改**两个** patch 层（都改，home 层覆盖 profile 层）：
   - `~/.dsh/profiles/<profile>/cordis.patch.yml`
   - `~/.dsh/cordis.patch.yml`
2. 目标皮肤 `disabled: false`，其余已安装皮肤各补一行 `disabled: true`。注意：patch 里没有行的皮肤默认**启用**，所以"只保留一套"必须显式停用其余每一套。
3. 保存即热重载生效（配置 HMR），**无需重启**；告知用户刷新页面即可，会话不受影响。
4. 快速验证：`dsh --profile <name> --dump-config` 确认目标皮肤行 `disabled: false`（有 `dsh-plugin-verify` 技能时走其三层验证）。

若用户只说了"切换皮肤"而未指明哪一套，才用一句话列出已安装皮肤询问目标。

## 场景 B：初次安装（未安装）

### 1. 定位仓库（本地优先，绝不重复下载）

- 在当前工作目录或常见位置找含 `skin.json` 的目录（仓库根或子目录）；**找到即用，不重新 clone**。
- 找不到本地 clone 时，才 `git clone https://github.com/Small-tailqwq/dsh-deep-whale` 到临时目录。
- 皮肤目录形态：每个皮肤 = 一个含 `skin.json` 的子目录（如 `maid-atelier/`、`orca-link/`），`lib/` 内是预构建的 client bundle（随仓库分发，无需自行构建）。

### 2. 扫描皮肤清单（实时，勿硬编码）

对仓库中每个含 `skin.json` 的目录，读取并汇总：
- `id` / `name`（中文名）/ `nameEn` / `tagline`
- `package`（npm 包名）、`wiring.id`（patch 层控制的插件 id）
- `preview`（亮/暗预览图）

### 3. 与用户交互：列出全部皮肤，询问激活哪一套

用交互工具（如 `ask_user_question`）列出所有皮肤（名称 + tagline），询问激活哪一套，并始终提供"保持现状/不切换"选项。**初次安装不要跳过交互擅自安装。**

### 4. 向用户交代版权署名链与许可（初次安装必做）

- **署名链**：读取所选皮肤的 `NOTICE`（署名链权威来源）与 README，简述创作链（"一创 XX → 二创 XX → 本皮肤 XX"），附作者主页链接。**以 NOTICE 实际内容为准**，不要凭记忆介绍。
- **许可**：以皮肤 `LICENSE` 为准。当前皮肤为 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享），简明解释：
  - ✅ 可以：个人/非商业使用、复制、分享、二次修改
  - ❌ 不可以：商业性使用；移除署名（须保留完整创作链）；以其他协议发布衍生作品（须相同方式共享）
  - **禁止商用是红线**，务必点明。

### 5. 注册并启用

- `dsh plugin --profile <name> add <仓库路径>/<皮肤目录>`（本地路径自动按 `link:` 注册），然后**重启 dsh web** 才生效。
- 安装并重启后，同样写入两个 patch 层的 `disabled` 行（见场景 A），保持同一时间只启用一套皮肤。

### 6. 验证生效

- `dsh --profile <name> --dump-config` 核对皮肤行 `disabled` 状态与 patch 来源：每行标注 `patched by <文件路径>`，确认两个 patch 层都生效（home 层覆盖 profile 层）。
- 有 `dsh-plugin-verify` 技能时走其三层验证（组合层/产物层/执行层）；没有时至少做到：刷新页面后 `window.__DSH_BOOT__` 的 entries 含目标皮肤的 **package 名**（boot 图以包名为 key，不是 `wiring.id`），且进程未重启（PID 不变，证明走的是热重载）。
- 告知用户刷新页面查看效果；皮肤异常（控制台报错、布局问题）时收集现象再排查。

## 场景 C：更新（仅用户明确要求时）

默认**不做任何网络同步**——已 clone/已安装就原样使用。仅当用户明确表达"更新皮肤/检查更新"时：

1. `git fetch origin`
2. 对比本地与远端：`git rev-list --count HEAD..origin/main`（落后提交数）
3. 落后 > 0 → `git pull --ff-only`，并告知更新内容（`git log --oneline HEAD@{1}..HEAD`）；已是最新 → 直接告知，不做多余操作。
4. 已安装皮肤若更新了 bundle，仍走场景 A 的 patch 热切换生效（无需重启，除非涉及新增/删除插件包）。

## 已知要点（判断用，非写死事实）

- 本仓库皮肤是纯展示层 client 插件：不注入服务、不发 Cordis 事件、不触达模型请求；素材以数据 URI 内嵌于 bundle，激活不依赖远程资源。
- 皮肤可热切换，`wiring.id` 即 patch 层控制的插件 id；皮肤中心/互斥切换机制兼容。
- 仓库 README 安装示例为 `dsh plugin --profile web add ../dsh-deep-whale/<皮肤目录>`；懒人版是直接让 dsh 说"安装这个皮肤包"。
- 反馈问题走仓库 issue，不要联系画师本人；二创关注是另一回事。
