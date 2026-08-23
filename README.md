# dsh-deep-whale · 鲸鱼娘皮肤系列

**[简体中文](README.md)** · [English](README.en.md)

DeepSeek Harness Web GUI 的鲸鱼娘主题皮肤系列(独立分发仓库)。

## 效果预览

点击图片可查看完整尺寸。

| 皮肤 | 亮色模式 | 暗色模式 |
|---|---|---|
| maid-atelier | [![maid-atelier 亮色模式](maid-atelier/preview/light.webp)](maid-atelier/preview/light.webp) | [![maid-atelier 暗色模式](maid-atelier/preview/dark.webp)](maid-atelier/preview/dark.webp) |
| orca-link | [![orca-link 亮色模式](orca-link/preview/light.png)](orca-link/preview/light.png) | [![orca-link 暗色模式](orca-link/preview/dark.png)](orca-link/preview/dark.png) |

## 住户

| 皮肤 | 包名 | 说明 | 许可 |
|---|---|---|---|
| [maid-atelier](maid-atelier/) | `@dsh-external/dsh-client-ui-skin-maid-atelier` | 深海女仆工坊:双女仆背景、深海蓝蕾丝界面与 Q 版侧栏 | CC BY-NC-SA 4.0 |
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | 虎鲸链路:珍珠白机械舱、虎鲸娘角色与电蓝链路信号 | CC BY-NC-SA 4.0 |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | 通用皮肤发现、切换与皮肤自声明配置面板 | MIT |

## 版权所有人

| 版权所有人 | 版权所有内容 | 对应皮肤 | 个人主页 |
|---|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*反馈问题尽可能在 issue 中发起，而不是跑去联系上面两位老师。但是，看鲸鱼娘二创可以去关注一下，谢谢喵

## 安装

### 一行安装（推荐）

三个发行包（皮肤管理器 + 两套皮肤）直接以 GitHub 依赖安装，**无需 clone**；每个包都是仓库中的一个 `#path:` 子目录。需要 **pnpm ≥ 9**:子目录语法从 pnpm 9 开始支持，pnpm 8 会把 `path:...` 当作 commit 引用而报错。

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

**PowerShell**（`#` 是注释起始符，spec 必须包在引号里；`&&` 不可用于分隔，用 `;`）：

```powershell
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'; dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

只想用其中一套皮肤时，把不需要的那行删掉（skin-manager 建议保留，切换与互斥都靠它）。

首次安装是新增插件包，需要重启一次 DSH。重启时 skin-manager 会检测“两套皮肤同时启用”并**自动原子回退到官方默认**，所以首次安装不会出现皮肤叠加窗口；随后打开「设置 → 皮肤管理」点击目标皮肤「切换」即热重载生效，此后切换不再需要重启，也不需要 AI 参与。

> 快捷方式：把 `github:Small-tailqwq/dsh-deep-whale#path:/` 换成**本地 clone 目录**也可以（见[独立子包安装](#独立子包安装本地开发与弱网备用)）；GitHub 一行安装与本地 link 是对同一包名的两种选择，混用会以最后一次 `add` 为准。

### 更新

**Linux / macOS / WSL:**

```sh
dsh plugin --profile web update @dsh-external/dsh-client-ui-skin-deep-whale-manager @dsh-external/dsh-client-ui-skin-maid-atelier @dsh-external/dsh-client-ui-skin-orca-link
```

**PowerShell**（`@` 开头 token 建议加引号）：

```powershell
dsh plugin --profile web update '@dsh-external/dsh-client-ui-skin-deep-whale-manager' '@dsh-external/dsh-client-ui-skin-maid-atelier' '@dsh-external/dsh-client-ui-skin-orca-link'
```

GitHub 依赖被 pnpm 锁定到安装时刻的 commit；`update` 重新解析仓库最新提交。也可以不带包名执行 `dsh plugin --profile web update`（更新 profile 全部依赖，只装了本仓库皮肤时效果相同）。bundle 内容更新走配置热重载；只有新增/删除插件包才需要重启。

### 皮肤互斥机制（必读）

- 先分清：`skin-manager` 不是皮肤，而是**皮肤管理器**（提供发现、切换与定制面板），需要常驻启用；互斥的对象是**皮肤本身**——本仓库的皮肤是 maid-atelier 与 orca-link。
- 皮肤启停由 patch 层控制：profile 的 `~/.dsh/profiles/web/cordis.patch.yml` 与 home 层的 `~/.dsh/cordis.patch.yml` 里各自的 `- id: <wiring.id>` + `disabled: true/false` 行（**两层都要写**，home 层优先级更高）。
- **patch 里没有某皮肤行的 `disabled` 行 → 该皮肤默认启用**。所以只装一套皮肤时它开箱即用；一次装两套、又从未切换时它们会**同时运行**：装饰层互相叠加、侧栏/设置区被搅乱，典型症状是**设置按钮消失、侧栏宽度/布局异常、界面混乱**（原版正常）。
- **互斥由 skin-manager 兜底**：一行安装同时注册三包，首次重启时管理器合并 profile→home 两层状态，检测到实际同时启用两套及以上皮肤 → 自动原子回退到“官方默认”并写入互斥行；已有零套或一套启用的合法选择不会被改写。无需在安装前手工预置。
- skin-manager（设置 → 皮肤管理）激活时会自动把互斥行写入两个 patch 层；手写时“只保留一套”必须**显式停用其余每一套**。
- 安装了皮肤管理器后，皮肤定制项（如“不那么二次元模式”的可见时段）保存在当前浏览器，由管理器统一应用。

### 独立子包安装（本地开发与弱网备用）

> 普通用户不需要使用本节：GitHub 一行安装更快（无需 clone）。本节用于本地开发、指定提交测试，或 GitHub 网络不可用时。GitHub 依赖与本地 link 针对同一包名，用哪种就执行哪种，不要混跑。

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale   # clone 到任意位置（浅克隆足够，跳过历史）
node <clone 的绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <clone 的绝对路径>/skin-manager   # 常驻皮肤管理面板（推荐）
dsh plugin --profile web add <clone 的绝对路径>/maid-atelier   # 深海女仆工坊
dsh plugin --profile web add <clone 的绝对路径>/orca-link      # 虎鲸链路
```

> 第一条 `node` 命令是**可选优化**：它在 `plugin add` 前把目标皮肤设为唯一启用项，使第一次启动直接就是目标皮肤；保留非皮肤 YAML，不整文件覆盖 patch。跳过它也安全——首次启动时 skin-manager 兜底会回退到官方默认，进「设置 → 皮肤管理」切换即可。要默认启用虎鲸则把 target 改成 `orca-link`，要保持原版则改成 `official`。

**方式 A（推荐）：设置 → 皮肤管理 → 点击要用的那一套「切换」**。管理器自动把互斥 `disabled` 行写入两个 patch 层并热重载，刷新页面即可。

**方式 B：手写两个 patch 层**。把下面的行**追加到** `~/.dsh/profiles/web/cordis.patch.yml` **和** `~/.dsh/cordis.patch.yml`（两者缺一不可，home 层覆盖 profile 层）：

```yaml
# 示例：只启用 maid-atelier；改为 orca-link 时把 false 移到它那行，两套皮肤只能有一套是 false
- id: ui-skin-maid-atelier
  disabled: false
- id: ui-skin-orca-link
  disabled: true
- id: ui-skin-deep-whale-manager
  disabled: false
```

> 若 patch 文件还是 dsh 的默认模板（注释 + 一行 `[]`），请**用上面的列表整体替换 `[]` 那一行**——“注释 + `[]` + 其他条目”是非法 YAML，配置解析会失败（服务器会保留上一个可用配置继续运行，修复后并刷新即可）。

Windows 示例（正斜杠与反斜杠均可，pnpm 会自动规范化）：
```powershell
dsh plugin --profile web add C:/Users/<你>/code/dsh-deep-whale/skin-manager
dsh plugin --profile web add C:/Users/<你>/code/dsh-deep-whale/maid-atelier
```

### 装多了 / 出现异常怎么办

症状：设置按钮消失、侧栏被装饰层覆盖或宽度异常、界面混乱（停用皮肤后恢复）。

1. 打开 设置 → 皮肤管理，点击「官方默认」或任一皮肤——管理器会自动写互斥行并热重载，刷新即可恢复；
2. 管理器不可用时（或配置已被写坏）：运行上方 `stage-mutual-exclusion.mjs`，用 `--target official` 或目标皮肤恢复两个 patch 层；
3. 也可以直接摘掉不用的包：`dsh plugin --profile web remove <包名>`，摘除后同样检查互斥行。

### 相对路径的规则（容易踩坑）

- 相对路径（`./`、`../` 开头）按 **dsh 命令的调用目录**解析，不是皮肤仓库目录。
- **不要直接写裸目录名**：`dsh plugin --profile web add maid-atelier` 会被当作 npm 包名去 registry 拉取而 404 失败。请用 `./maid-atelier`（已在皮肤仓库目录内）、`../dsh-deep-whale/maid-atelier`（与 dsh-deep-whale 同级）或绝对路径。
- `cd <harness>` 后用 `../dsh-deep-whale/maid-atelier` 的前提是 **dsh-deep-whale 与你的 harness 目录同级**；clone 到别处时相对路径会 link 到错误位置（命令不报错、但皮肤不生效）。不确定就用绝对路径。

### 安装后验证

```sh
dsh plugin --profile web list          # 应看到三个 @dsh-external/dsh-client-ui-skin-* 依赖
dsh --profile web --dump-config        # manager 行 disabled: false；两套皮肤互斥：skins 恰一套 false
```

> 一行安装后、**尚未重启前** `--dump-config` 会显示两套皮肤都启用（patch 里还没有互斥行）——这是正常过渡态；重启时 skin-manager 兜底回退并写入互斥行。冷启动后还必须在浏览器控制台检查 client roster（仅有配置 entry 不代表浏览器包已注册）。启动页 HTML 必须引用 manager 与启用皮肤的 `/plugins/<真实包名>/client.js`；不同 DSH 版本载体不同（旧版在 `window.__DSH_BOOT__` JSON 里，0.1.1rc2+ 是直接 `<script src>` 标签），下面这条两种版本都能用：

```js
document.documentElement.outerHTML.match(/\/plugins\/@dsh-external\/[^"'\s]+/g) ?? []
```

结果必须包含 manager 与当前启用的皮肤包名；被停用的皮肤可以不出现。刷新浏览器页面即可看到皮肤；皮肤开关走配置热重载，无需重启 dsh（新增/删除插件包才需要重启）。

### 常见安装失败排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `ERR_PNPM_FETCH_404` | GitHub spec 拼写错误、网络不可用，或独立子包用了裸目录名 | 复制上方完整 spec；开发 link 使用绝对路径 |
| `The matching commit...`/无法解析 ref | **pnpm < 9**，`#path:` 子目录语法不被支持 | 升级 pnpm 到 ≥ 9（`npm i -g pnpm@latest`） |
| `ERR_PNPM_EXOTIC_SUBDEP` | 尝试安装会再带 Git 依赖的“根包/聚合包”（pnpm 11 安全策略，本仓库不提供此类包） | 按本页一行安装三个 `#path:` 子包 |
| `pnpm not found on PATH` | 环境缺少 pnpm | 安装 pnpm（`npm i -g pnpm`）后重试 |
| 包在列表里但页面无效果 | 皮肤被 `disabled`（多皮肤互斥开关）或浏览器未刷新 | `--dump-config` 核对 disabled；刷新页面 |
| PowerShell 命令不完整/报错 | `#` 未加引号被当注释截断 | spec 一律单引号包裹 |

## 贡献者

感谢以下开发者对 dsh-deep-whale 的贡献：

<a href="https://github.com/Small-tailqwq/dsh-deep-whale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Small-tailqwq/dsh-deep-whale" />
</a>

### 有价值但未合入的 PR

以下 PR 因与现有上游实现冲突未能合入，但其功能需求已在仓库中落地，特此致谢：

- **@yaoyiqun** — 按所选模型切换角色位置（#15）
- **@Chartreuse310** — 对话区衬线字体（#22）
- **@Vergemesh** — 原版/鲸鱼娘皮肤即时切换（#27）
- **@joejojoking-cloud** — top-trim 装饰层级（#26）、字符舞台层级（#31）修复


## 许可

本仓库各皮肤为**衍生创作**,整体以 CC BY-NC-SA 4.0(署名-非商业性使用-相同方式共享)发布,禁止商业性使用。署名链见各皮肤 `NOTICE`。

皮肤工程脚手架来自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)，本仓库仅分发皮肤成品,不包含脚手架。
