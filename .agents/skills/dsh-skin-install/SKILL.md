---
name: dsh-skin-install
description: 从 dsh-deep-whale 仓库安装或切换 DSH Web 皮肤：定位并同步仓库、扫描仓库全部皮肤清单、询问用户激活哪一套、介绍版权署名链与 CC BY-NC-SA 4.0 许可边界、按热重载或插件注册路径生效。当用户要求安装/切换本仓库皮肤（如 maid-atelier 深海女仆工坊、鲸鱼娘皮肤）或"安装皮肤"时使用。
---

# dsh-deep-whale 皮肤安装

目标：帮用户从本仓库（dsh-deep-whale，鲸鱼娘皮肤系列）安装或切换一套 DSH Web 皮肤，一次说清"有哪些皮肤、选哪套、作者是谁、能干什么不能干什么"，然后让皮肤生效。

**本技能只给流程指导，具体事实以现场读取为准**：仓库会更新（新增皮肤、改署名链），不要依赖本文件或记忆中的清单，每一步都实时读仓库内容。

## 流程

### 1. 定位仓库并同步

- 用户可能忘记仓库在哪。优先在当前工作目录找 `skin.json` 子目录特征（仓库根或子目录）；找不到就问用户，或 `git clone https://github.com/Small-tailqwq/dsh-deep-whale` 到临时目录。
- 确认最新：`git fetch origin` + `git status -sb`（无 behind 即最新；落后时 `git pull --ff-only`）。
- 皮肤目录形态：每个皮肤 = 一个含 `skin.json` 的子目录（如 `maid-atelier/`），`lib/` 内是预构建的 client bundle（随仓库分发，无需用户自行构建）。

### 2. 扫描皮肤清单（实时，勿硬编码）

对仓库中每个含 `skin.json` 的目录，读取并汇总：
- `id` / `name`（中文名）/ `nameEn` / `tagline`（一句话介绍）
- `package`（npm 包名）、`wiring.id`（patch 层控制的插件 id）
- `preview`（亮/暗预览图，可展示给用户）

### 3. 与用户交互：列出全部皮肤，询问激活哪一套（必做）

用交互工具（如 `ask_user_question`）列出所有皮肤（名称 + tagline），询问用户激活哪一套，并始终提供"保持现状/不切换"选项。**不要跳过交互擅自切换。**

### 4. 向用户交代版权署名链与许可（安装前必做）

- **署名链**：读取所选皮肤的 `NOTICE`（署名链权威来源）与 README，向用户简述创作链，格式如"一创 XX → 二创 XX → 本皮肤 XX"，附作者主页链接。**以 NOTICE 实际内容为准**，不要凭记忆介绍。
- **许可**：以皮肤 `LICENSE` 为准。当前皮肤为 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享），向用户简明解释：
  - ✅ 可以：个人/非商业使用、复制、分享、二次修改
  - ❌ 不可以：商业性使用；移除署名（须保留完整创作链）；将衍生作品以其他协议发布（须相同方式共享）
  - **禁止商用是红线**，务必点明。

### 5. 安装/切换

先查当前 dsh 环境状态：`dsh plugin --profile web list`（或实际 profile 名）看目标皮肤是否已安装：

- **已安装（常见：link: 依赖）→ 开关热重载，无需重启**：
  - 修改**两个** patch 层（都改，home 层覆盖 profile 层）：
    - `~/.dsh/profiles/<profile>/cordis.patch.yml`
    - `~/.dsh/cordis.patch.yml`
  - 目标皮肤 `disabled: false`，其余皮肤 `disabled: true`。
  - 保存即热重载生效（配置 HMR），**无需重启**，用户刷新页面即可看到新皮肤；会话不受影响。
- **未安装 → 插件注册，必须重启**：
  - `dsh plugin --profile web add <仓库路径>/<皮肤目录>`（仓库 README 的官方安装方式），然后**重启 dsh web** 才生效。

### 6. 验证生效

- `dsh --profile web --dump-config` 核对皮肤行 `disabled` 状态与 patch 来源（确认两个 patch 层都生效）。
- 有 `dsh-plugin-verify` 技能时走其三层验证（组合层/产物层/执行层）；没有时至少做到：主实例页面 `window.__DSH_BOOT__` 的 entries 含目标皮肤 id，且进程未重启（PID 不变，证明走的是热重载）。
- 告知用户刷新页面查看效果；皮肤异常（控制台报错、布局问题）时收集现象再排查。

## 已知要点（判断用，非写死事实）

- 本仓库皮肤是纯展示层 client 插件：不注入服务、不发 Cordis 事件、不触达模型请求；素材以数据 URI 内嵌于 bundle，激活不依赖远程资源。
- 皮肤可热切换，`wiring.id` 即 patch 层控制的插件 id；皮肤中心/互斥切换机制兼容。
- 仓库 README 安装示例为 `dsh plugin --profile web add ../dsh-deep-whale/<皮肤目录>`；懒人版是直接让 dsh 说"安装这个皮肤包"。
- 反馈问题走仓库 issue，不要联系画师本人；二创关注是另一回事。
