---
name: dsh-skin-install
description: 处理 DSH Web 上 dsh-deep-whale 皮肤（skin-manager + maid-atelier + orca-link）的非常规安装与运维：从本地 clone 安装、加载本地修改、测试指定提交、迁移旧 `@dsh-external/*` 包、切换皮肤与修复互斥、更新后版本不变、升级 DSH 后皮肤被停用、皮肤不加载的诊断。从 npm 或 GitHub 的普通首次安装按仓库 INSTALL.md 执行，不需要本技能。
---

# dsh-deep-whale 皮肤安装与运维

从 npm 或 GitHub 的普通首次安装只按仓库 `INSTALL.md` 的三步做，不进入本技能。本技能只给流程；包名、皮肤清单和署名链以现场读取为准，不要凭记忆。

## 红线

- 调用预算：切换 ≤ 8 次工具调用，安装 ≤ 20 次，更新 ≤ 6 次。超出说明在重复劳动，停下汇报已完成的动作和卡住的点。
- 同一信息只取一次。状态以 `dsh plugin --profile <name> list` 与 `dsh --profile <name> --dump-config` 的各一次输出为准。不读 DSH 源码，不递归扫描 `~/.dsh` 或全局 `node_modules`，不手改 `node_modules` 与 lockfile。
- 不自行停止或重启正在运行的 DSH 进程：若你运行在 DSH 内，这会结束你自己的会话。需要重启时把启动命令交给用户；只有你自己启动的冷启动探针可以自行终止。
- 不整文件重写 patch YAML；互斥行只经皮肤管理器或本技能脚本写入。
- 页面观感由用户刷新后自行确认；只在用户反馈异常时诊断。

## 先分场景

先运行一次 `dsh --version && dsh plugin --profile <name> list`（profile 通常是 `web`）。列表里 npm 来源显示版本号，GitHub 来源显示 `github:`，本地来源显示 `link:`。

- 有 `@linxin666/dsh-web-all`（dsh-web）：停止。dsh-web 自带适配过的皮肤，请用户从它的皮肤中心安装，不要把本仓库的包加进同一 profile。
- 有 `@dsh-external/*`（0.1.3 之前的占位包名）：先 `remove` 实际列出的那几个（pnpm 对未安装的名字会报错），再装 `@smalltailqwq/*`。新旧包名不能并存。
- 然后按用户意图：切换皮肤 → A；从本地 clone 安装或加载本地修改 → B；更新 → C；测试指定提交 → D；皮肤消失、不加载或界面错乱 → E。

## 共用规则：互斥与版本准入

- 同一时间只能启用一套皮肤。管理器（wiring id `ui-skin-deep-whale-manager`）不是皮肤，保持启用。
- 开关写在两个 patch 层：`~/.dsh/profiles/<profile>/cordis.patch.yml` 与 `~/.dsh/cordis.patch.yml`（home 层优先），每条是 `- id: <skin.json 的 wiring.id>` 加 `disabled: true|false`。**没有条目的皮肤默认启用**，所以只留一套时必须显式停用其余每一套。
- 管理器每次启动时若算出两套以上皮肤启用，会原子回退到官方默认并写入互斥行；已有零套或一套启用的选择保持不变。
- 版本准入（DSH 0.1.7+）：皮肤 `package.json` 的 `peerDependencies['@deepseek-ai/dsh']` 不包含运行中的 DSH 版本时，宿主会停用该皮肤，**即使 patch 写的是 `disabled: false`**。管理器只声明下限，不受影响。放行只对“这个皮肤版本 + 这个 DSH 版本”生效，由宿主记录在 profile 的 `compatibility.json`，不要手写这个文件。放行有风险，必须先征得用户同意，再让用户在「设置 → 皮肤管理」里点该皮肤「切换」并确认，或运行 `dsh plugin --profile <name> allow-version <包名>@<皮肤版本> --dsh-version <DSH 版本> --accept-risk`。

## A 切换皮肤

三个包都已安装时，用户点名目标皮肤就直接执行，不提问、不介绍作者。用户没说目标时，用一句话列出已安装的皮肤问一下。

1. 首选皮肤管理器：请用户在「设置 → 皮肤管理」点目标皮肤的「切换」；或向运行中的 DSH 同源发送 `POST /api/dsh/skins`，body 为 `{ "target": "<skin-id|official>" }`。服务端校验目标并原子写入两个 patch 层。返回 409 `incompatible-version` 表示被版本准入拦下，按 E 第 2 步处理。
2. 管理器不可用时：有 clone 就运行 `node <clone 绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile <name> --target <skin-id|official>`；没有 clone 就按共用规则手改两个 patch 层。文件若还是默认模板（注释加一行 `[]`），用条目列表替换 `[]` 那一行。
3. 配置会热重载，不需要重启，请用户刷新页面。用一次 `--dump-config` 验证：目标皮肤 `disabled: false`，其余皮肤 `true`，管理器 `false`。到此结束。

## B 从本地 clone 安装

1. 复用已有 clone；没有才运行 `git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale`。`lib/` 是提交型构建产物，clone 下来即可安装，不需要构建。
2. 首次安装时向用户交代署名与许可：读各皮肤目录的 `NOTICE`，逐套简述创作链并附作者主页；代码采用 MIT，美术（含 AI 生成的图片）采用 CC BY-NC-SA 4.0，禁止商用。补装或切换时不重复交代。
3. **在 add 之前**预置互斥（add 之后再写会出现两套叠加的窗口）：`node <clone 绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile <name> --target <skin-id|official>`。脚本从 clone 读取各 `skin.json`，复用管理器的原子写入与回滚，保留 patch 中的其他内容。脚本失败就停止，不要继续 add。
4. 依次 `dsh plugin --profile <name> add <clone 绝对路径>/skin-manager` 与需要的皮肤子目录。
   - 必须 add 子目录；仓库根没有 `package.json`，会直接失败。
   - 用绝对路径。相对路径按运行 dsh 的目录解析，算错时不报错，但皮肤不会生效；裸目录名会被当作 npm 包名，返回 404。
   - 同名包已 link 到同一目录就跳过；link 路径失效时直接对新路径 add 覆盖，不要先 remove。
5. 新增包需要重启：先完成下面的「重启前检查」，再把启动命令交给用户。

## C 更新（仅用户明确要求时）

- npm 或 GitHub 来源：`dsh plugin --profile <name> update '<包名>' ...`。npm 来源更新到最新发布版，GitHub 来源拉取 `main` 最新提交。
- **24 小时规则**：DSH 内置的 pnpm 11 默认 `minimumReleaseAge` 为 1 天，发布不满 24 小时的 npm 版本会被静默跳过，不报错，停在上一版。更新后版本没变时，先用 `npm view <包名> time --json` 看发布时间，不要重试或排查。要马上用某个新版，运行 `dsh plugin --profile <name> add '<包名>@^<版本>'`：pnpm 会把该版本记为例外并安装，依赖仍记为版本范围。不要写成不带 `^` 的精确版本，那样依赖会被锁死，以后的 `update` 不再升级。也可以改用 GitHub 来源。
- 本地 link：在 clone 里 `git fetch origin` 后 `git pull --ff-only`。
- bundle 内容变化会热加载，请用户刷新页面；只有新增或删除包才需要重启。更新后用一次 `list` 确认版本。

## D 加载本地修改或测试指定提交

- 本地修改：在改动的包目录运行 `npm run build`，确认 `lib/` 与 `skin.build.json` 已更新（绝不手改指纹）。请用户刷新页面；没生效时在皮肤管理里切到官方默认再切回，触发热加载。
- 指定提交：不要在用户的工作区 checkout 或 restore。用 `git worktree add --detach <临时目录> <commit>` 建临时工作树，再用绝对路径把同名包 add 到其中的子目录。记下原 link 路径；测试结束后按用户指示 add 回原路径，并删除临时工作树。
- 重新 link 后核对依赖键仍等于目标 `package.json.name`。包名变了就先 remove 旧键再 add，并完成「重启前检查」。

## E 诊断：皮肤消失、不加载或界面错乱

按顺序检查，命中就停：

1. **界面错乱**（设置按钮消失、侧栏宽度异常、装饰叠在一起）：多半是两套皮肤同时启用，按 A 切到一套或官方默认。
2. **升级 DSH 后皮肤消失**：比较 `dsh --version` 与已安装皮肤的 `peerDependencies['@deepseek-ai/dsh']`。不在范围内就是版本准入停用，属于预期行为：先按 C 更新；没有新版而用户仍想用，征得同意后按共用规则放行。
3. **包在列表里但页面没变化**：`--dump-config` 看目标皮肤是否为 `disabled: false`；是的话请用户刷新页面。
4. **仍不加载**：检查 link 目标与 `lib/client.js` 是否存在，再做冷启动探针，核对启动页是否引用该皮肤。图片 404 说明宿主进程仍在用旧的 node 半边，需要重启。
5. **仍无法解释**：停下，把已收集的输出交给用户，建议到仓库 issue 反馈。不要扩大扫描范围或长时间轮询。

## 重启前检查与冷启动探针

仅在新增、删除包或诊断需要时执行。运行中的 DSH 可能仍持有旧的插件图，当前页面正常不能证明磁盘上的 profile 能再次启动。

1. 目标皮肤 `package.json.name` 与 `skin.json.package` 相同，profile 的依赖键也与之一致；有别名或旧 scope 时先 remove 再用绝对路径 add。
2. `dsh --profile <name> --dump-config` 能正常组合，管理器与目标皮肤的启停状态符合预期。
3. 保留原进程，另起探针 `dsh --profile <name> --no-open --port 0`（参数若有变化，先看 `dsh --profile <name> --help`）。等它打印临时 URL 后取启动页 HTML，确认包含管理器和已启用皮肤的 `/plugins/<包名>/client.js`，停用的皮肤可以不出现。然后按记录的 PID 只终止这个探针，不按进程名批量结束。探针失败就修复后重试，不要让用户“重启试试”。
4. 探针通过后，把启动命令交给用户重启。
