# dsh-deep-whale · 鲸鱼娘皮肤系列

**简体中文** · [English](README.en.md) · [Tiếng Việt](README.vi.md)

给 DeepSeek Harness（DSH）Web 界面换上鲸鱼娘主题的皮肤合集，附带一个用来切换皮肤的管理面板。

## 效果预览

点击图片可查看完整尺寸。

| 皮肤 | 亮色模式 | 暗色模式 |
|---|---|---|
| maid-atelier | [![maid-atelier 亮色模式](maid-atelier/preview/light.webp)](maid-atelier/preview/light.webp) | [![maid-atelier 暗色模式](maid-atelier/preview/dark.webp)](maid-atelier/preview/dark.webp) |
| orca-link | [![orca-link 亮色模式](orca-link/preview/light.png)](orca-link/preview/light.png) | [![orca-link 暗色模式](orca-link/preview/dark.png)](orca-link/preview/dark.png) |

## 住户

| 皮肤 | 包名 | 说明 | 许可 |
|---|---|---|---|
| [maid-atelier](maid-atelier/) | `@smalltailqwq/dsh-client-ui-skin-maid-atelier` | 深海女仆工坊：两位鲸鱼娘女仆、深海蓝蕾丝与 Q 版侧栏，把 DSH 布置成女仆工坊 | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [orca-link](orca-link/) | `@smalltailqwq/dsh-client-ui-skin-orca-link` | 虎鲸链路：酷酷的小黑鲸操作员，全直角界面加用直线重绘的图标；亮色机能，暗色治愈 | MIT (code) / CC BY-NC-SA 4.0 (artwork) |
| [skin-manager](skin-manager/) | `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` | 皮肤管理器：切换已安装的皮肤，调整各皮肤自带的选项，在「设置 → 皮肤管理」中打开 | MIT |

## 版权所有人

| 版权所有人 | 版权所有内容 | 对应皮肤 | 个人主页 |
|---|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*反馈问题尽可能在 issue 中发起，而不是跑去联系上面两位老师。但是，看鲸鱼娘二创可以去关注一下，谢谢喵

## 安装

> [!NOTE]
> 如果你用的是 dsh-web（装过 `@linxin666/dsh-web-all`），请直接在 dsh-web 自带的皮肤中心里安装 `maid-atelier` 和 `orca-link`，不要再运行下面的命令。两边的皮肤是分别适配的，装在同一个 profile 里会让界面显示错乱。

复制对应系统的命令运行即可，不需要 clone 仓库：

```sh
# Linux / macOS / WSL
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

```powershell
# PowerShell
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager'; dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier'; dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

装好后**重启一次 DSH**，然后打开「设置 → 皮肤管理」，在想用的皮肤上点「切换」就好。之后换皮肤都是即时生效，不用再重启。

- 只想要其中一套皮肤？把命令里另一套皮肤的那段 `add` 删掉即可。皮肤管理器建议保留，切换皮肤要靠它。
- 两套都装了的话，首次重启后界面还是官方默认的样子，这是正常的：两套皮肤同时启用会互相打架，管理器会先把它们都关掉，等你来选。
- 不想自己敲命令，可以把这句话发给任意 AI（或 DSH 本身），它会按 [INSTALL.md](INSTALL.md) 帮你装好：

  ```
  读取 https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md 并按其中的指引安装本仓库皮肤
  ```

## 更新

```sh
# Linux / macOS / WSL
dsh plugin --profile web update @smalltailqwq/dsh-client-ui-skin-deep-whale-manager @smalltailqwq/dsh-client-ui-skin-maid-atelier @smalltailqwq/dsh-client-ui-skin-orca-link
```

```powershell
# PowerShell
dsh plugin --profile web update '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' '@smalltailqwq/dsh-client-ui-skin-maid-atelier' '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

更新后刷新页面即可，不需要重启 DSH。如果这个 profile 里只装了本仓库的皮肤，也可以直接运行 `dsh plugin --profile web update` 更新全部插件。

## 遇到问题

**升级 DSH 后皮肤不见了**

每套皮肤只声明支持自己适配过的 DSH 版本（目前是 0.1.7 系列）。DSH 升级到更新的版本而皮肤还没跟上时，DSH 会自动停用皮肤、恢复官方界面，免得皮肤把输入框之类的控件挡住。

先按上面的命令更新皮肤。如果还没有新版，又想先用着旧皮肤，可以打开「设置 → 皮肤管理」：被停用的皮肤会显示「未声明支持当前的 DSH x.y.z，已被自动停用」，点「切换」并确认即可。这个放行只针对当前的皮肤版本和 DSH 版本，任意一方升级后会重新检查；用得不顺手随时切回「官方默认」。

<details>
<summary>用命令行放行</summary>

```sh
dsh plugin --profile web allow-version @smalltailqwq/dsh-client-ui-skin-orca-link@<皮肤版本> --dsh-version <DSH 版本> --accept-risk
```

</details>

**界面乱了：设置按钮不见、侧栏宽度异常、装饰叠在一起**

多半是两套皮肤同时在运行。打开「设置 → 皮肤管理」，点「官方默认」或任意一套皮肤，刷新页面即可恢复。如果连设置都打不开，展开下方的[皮肤互斥原理](#mutual-exclusion)，按其中的方法手动修复。

**装了但页面没变化**

先刷新浏览器；仍然没有的话，去「设置 → 皮肤管理」确认目标皮肤处于启用状态。

更多情况见下方的[常见安装报错](#install-errors)。

## 进阶说明

以下内容大多数用户用不到，按需展开。

<details>
<summary><b>从 0.1.3 之前的旧版本迁移</b></summary>

`0.1.3` 之前从 GitHub 安装的版本用的是 `@dsh-external/*` 这个旧包名。请先移除这三个旧包，再按[安装](#安装)重新装，否则 DSH 里会同时留着两份同样的插件：

```sh
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-orca-link'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-maid-atelier'
dsh plugin --profile web remove '@dsh-external/dsh-client-ui-skin-deep-whale-manager'
```

装好后重启一次 DSH。你之前选的皮肤和设置会保留，不受包名变化影响。

</details>

<details>
<summary><b>从 GitHub 或本地目录安装（开发 / 网络受限时）</b></summary>

想直接跟随 GitHub `main` 分支，可以把包名换成 `github:Small-tailqwq/dsh-deep-whale#path:/<子目录>`（需要 pnpm ≥ 9，PowerShell 下要用单引号包住）。

本地开发或 npm 连不上时，可以 clone 仓库后按目录安装：

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale
node <clone 的绝对路径>/.agents/skills/dsh-skin-install/scripts/stage-mutual-exclusion.mjs --profile web --target maid-atelier
dsh plugin --profile web add <clone 的绝对路径>/skin-manager
dsh plugin --profile web add <clone 的绝对路径>/maid-atelier
dsh plugin --profile web add <clone 的绝对路径>/orca-link
```

- 第二行 `node` 命令可以跳过。它的作用是提前选好默认皮肤，让第一次启动直接就是这套皮肤；`--target` 可以写 `maid-atelier`、`orca-link` 或 `official`（官方默认）。跳过的话，首次启动是官方界面，再去皮肤管理里切换即可。
- 路径请尽量写**绝对路径**，Windows 下正斜杠、反斜杠都行，例如 `C:/Users/<你>/code/dsh-deep-whale/maid-atelier`。
- 不要只写目录名：`dsh plugin --profile web add maid-atelier` 会被当成 npm 包名去下载，结果 404。相对路径要以 `./` 或 `../` 开头，并且是相对于你**运行 dsh 命令时所在的目录**，不是皮肤仓库目录；路径算错时命令不会报错，但皮肤不会生效。
- npm、GitHub、本地目录三种来源对应的是同一个包名，以最后一次 `add` 为准，不要混着装。

</details>

<details>
<summary><a name="mutual-exclusion"></a><b>皮肤互斥原理</b></summary>

同一时间只能启用一套皮肤；皮肤管理器本身不算皮肤，需要一直开着。

每套皮肤的开关记录在两个配置文件里：`~/.dsh/profiles/web/cordis.patch.yml`（profile 层）和 `~/.dsh/cordis.patch.yml`（home 层，优先级更高）。文件里没有写某套皮肤时，它默认是**开启**的，所以一次装两套又从没切换过，它们就会同时运行，导致界面错乱。

皮肤管理器会处理这件事：

- 每次启动时，如果发现有两套以上皮肤同时开着，会把它们全部关掉、回到官方默认，已经选好的单套皮肤不受影响；
- 在「设置 → 皮肤管理」里切换时，会自动把开关写进两个配置文件并即时生效。

管理器用不了时，可以手动修改。把下面的内容**同时**加到上面两个文件里，想启用哪套，就把哪套设为 `false`，另一套设为 `true`：

```yaml
- id: ui-skin-maid-atelier
  disabled: false
- id: ui-skin-orca-link
  disabled: true
- id: ui-skin-deep-whale-manager
  disabled: false
```

如果文件还是 DSH 的默认模板（几行注释加一行 `[]`），请用上面的内容**替换掉** `[]` 那一行，否则文件格式会出错。也可以运行上一节的 `stage-mutual-exclusion.mjs` 自动写好，或者用 `dsh plugin --profile web remove <包名>` 直接卸掉不用的皮肤。

皮肤的个性化设置（例如「不那么二次元模式」的生效时段）保存在当前浏览器里，由管理器统一应用。

</details>

<details>
<summary><b>确认安装是否成功</b></summary>

```sh
dsh plugin --profile web list          # 应该能看到三个 @smalltailqwq/dsh-client-ui-skin-* 包
dsh --profile web --dump-config        # 管理器应为 disabled: false；两套皮肤中恰好一套为 false
```

刚装完、还没重启时，两套皮肤可能都显示为启用，这是正常的，重启后管理器会处理。

重启后还可以在浏览器控制台运行下面这行，确认页面确实加载了皮肤脚本：

```js
document.documentElement.outerHTML.match(/\/plugins\/@smalltailqwq\/[^"'\s]+/g) ?? []
```

结果里应包含管理器和当前启用的那套皮肤；停用的皮肤不出现是正常的。

</details>

<details>
<summary><a name="install-errors"></a><b>常见安装报错</b></summary>

| 现象 | 原因 | 处理 |
|---|---|---|
| `ERR_PNPM_FETCH_404` | 包名拼错、网络不通，或本地安装时只写了目录名 | 直接复制本页的包名；本地安装改用绝对路径 |
| `The matching commit...` / 无法解析 ref | pnpm 版本低于 9，不支持 `#path:` 写法 | 升级 pnpm：`npm i -g pnpm@latest` |
| `ERR_PNPM_EXOTIC_SUBDEP` | 试图安装一个会再拉取 Git 依赖的聚合包（pnpm 11 的安全限制，本仓库不提供这类包） | 按本页命令分别安装三个包 |
| `pnpm not found on PATH` | 没有安装 pnpm | `npm i -g pnpm` 后重试 |
| 包已安装但页面没变化 | 皮肤处于停用状态，或浏览器没刷新 | 在皮肤管理里启用它，然后刷新页面 |
| PowerShell 命令不完整或报错 | 包名没加引号，`#` 后面被当成注释截掉了 | 包名一律用单引号包住 |

</details>

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

项目自有代码采用 **MIT**，许可范围见 [LICENSE](LICENSE)。美术资源保留原作者版权与既有授权：两套皮肤的全部美术（包括 AI 生成及加工的图片）按 CC BY-NC-SA 4.0 使用，**禁止商业性使用**，署名链见各自 `NOTICE`，许可正文见 `LICENSE-ARTWORK`。图片即使嵌入源码、CSS 或构建产物，也不属于 MIT 授权范围。第三方材料保留其适用许可；历史版本已授出的权限不因本说明而撤销。

皮肤工程脚手架来自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)，本仓库仅分发皮肤成品，不包含脚手架。
