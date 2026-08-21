# dsh-deep-whale · 鲸鱼娘皮肤系列

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
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | 虎鲸链路:珍珠白机械舱、黑曜虎鲸操作员与电蓝链路信号 | CC BY-NC-SA 4.0 |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | 通用皮肤发现、切换与皮肤自声明配置面板 | MIT |

## 版权所有人

| 版权所有人 | 版权所有内容 | 对应皮肤 | 个人主页 |
|---|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*反馈问题尽可能在 issue 中发起，而不是跑去联系上面两位老师。但是，看鲸鱼娘二创可以去关注一下，谢谢喵

## 安装

### 懒人版

对你的 dsh 说：
```
安装一下这个皮肤包：https://github.com/Small-tailqwq/dsh-deep-whale
```
dsh 会按 `dsh-skin-install` 技能走完整流程：列出全部皮肤、交代署名链与许可、用绝对路径注册并激活你选的那一套。

### 手动安装（推荐绝对路径）

```sh
git clone https://github.com/Small-tailqwq/dsh-deep-whale   # clone 到任意位置
dsh plugin --profile web add <clone 的绝对路径>/skin-manager   # 常驻皮肤管理面板
dsh plugin --profile web add <clone 的绝对路径>/maid-atelier   # 深海女仆工坊
dsh plugin --profile web add <clone 的绝对路径>/orca-link      # 虎鲸链路
```

Windows 示例（正斜杠与反斜杠均可，pnpm 会自动规范化）：
```powershell
dsh plugin --profile web add C:/Users/<你>/code/dsh-deep-whale/skin-manager
dsh plugin --profile web add C:/Users/<你>/code/dsh-deep-whale/maid-atelier
```

安装管理器和任意皮肤包并刷新后，打开 DSH 的“设置 → 皮肤管理”。面板会自动发现当前 Web profile 中所有带有效 `skin.json` 的皮肤；皮肤支持 v1 自定义协议时，还会显示它自行声明的配置项。“不那么二次元模式”可设置多个显示或隐藏时段，配置均保存在当前浏览器。

### 相对路径的规则（容易踩坑）

- 相对路径（`./`、`../` 开头）按 **dsh 命令的调用目录**解析，不是皮肤仓库目录。
- **不要直接写裸目录名**：`dsh plugin --profile web add maid-atelier` 会被当作 npm 包名去 registry 拉取而 404 失败。请用 `./maid-atelier`（已在皮肤仓库目录内）、`../dsh-deep-whale/maid-atelier`（与 dsh-deep-whale 同级）或绝对路径。
- `cd <harness>` 后用 `../dsh-deep-whale/maid-atelier` 的前提是 **dsh-deep-whale 与你的 harness 目录同级**；clone 到别处时相对路径会 link 到错误位置（命令不报错、但皮肤不生效）。不确定就用绝对路径。

### 安装后验证

```sh
dsh plugin --profile web list          # 应看到 @dsh-external/dsh-client-ui-skin-* 的 link: 依赖
dsh --profile web --dump-config        # 皮肤行在组合配置中，disabled 状态正确
```
刷新浏览器页面即可看到皮肤；皮肤开关走配置热重载，无需重启 dsh（新增/删除插件包才需要重启）。

### 安装失败排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `ERR_PNPM_FETCH_404 ... <名字>` | 传了裸目录名（如 `add maid-atelier`），被当成 npm 包名 | 改为绝对路径或 `./`/`../` 前缀路径 |
| 命令成功但 `dsh plugin list` 没有该包 | 相对路径解析到了错误位置（clone 位置与假设不符） | 用绝对路径重新 add |
| `pnpm not found on PATH` | 环境缺少 pnpm | 安装 pnpm（`npm i -g pnpm`）后重试 |
| 包在列表里但页面无效果 | 皮肤被 `disabled`（多皮肤互斥开关）或浏览器未刷新 | `--dump-config` 核对 disabled；刷新页面 |

### 懒人版 · 自带技能

本仓库自带 `dsh-skin-install` 技能（`.agents/skills/`）。dsh 在仓库目录内运行时自动发现该技能；对你的 dsh 说"安装一下这个皮肤包"或"切换皮肤"，它会列出仓库全部皮肤、询问你要激活哪一套，并交代作者署名链与许可边界后再安装。无需自行克隆到 dsh 源码里，皮肤开关走配置热重载，无需重启。

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

> 本节由人工维护，新增此类 PR 时请同步更新。

## 许可

本仓库各皮肤为**衍生创作**,整体以 CC BY-NC-SA 4.0(署名-非商业性使用-相同方式共享)发布,禁止商业性使用。署名链见各皮肤 `NOTICE`。

皮肤工程脚手架来自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) ,本仓库仅分发皮肤成品,不包含脚手架。
