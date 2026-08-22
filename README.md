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
| [orca-link](orca-link/) | `@dsh-external/dsh-client-ui-skin-orca-link` | 虎鲸链路:珍珠白机械舱、黑曜虎鲸操作员与电蓝链路信号 | CC BY-NC-SA 4.0 |
| [skin-manager](skin-manager/) | `@dsh-external/dsh-client-ui-skin-deep-whale-manager` | 通用皮肤发现、切换与皮肤自声明配置面板 | MIT |

## 版权所有人

| 版权所有人 | 版权所有内容 | 对应皮肤 | 个人主页 |
|---|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | maid-atelier / orca-link | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili（上善无形）](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | maid-atelier | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili（ZipZipPipe）](https://b23.tv/Pnw6nG8) |

\*反馈问题尽可能在 issue 中发起，而不是跑去联系上面两位老师。但是，看鲸鱼娘二创可以去关注一下，谢谢喵

## 安装

> **皮肤的安装手段只有一个正确姿势：让你的 dsh 读取本仓库的 [INSTALL.md](INSTALL.md)（标准安装入口），它会引导 dsh 使用自带的 `dsh-skin-install` 技能执行**——询问你选哪一套、交代署名链与许可、并写入互斥开关。不要自己照抄下面的命令——照抄会把 skin-manager 与**两套皮肤**全部装上，而两套皮肤默认**同时运行**（详见[皮肤互斥机制](#皮肤互斥机制必读)与 [issue #65](https://github.com/Small-tailqwq/dsh-deep-whale/issues/65)）。

### 标准流程：让 dsh 按 INSTALL.md 安装（推荐，唯一保证互斥的路径）

1. 让你的 dsh 读取本仓库的标准安装入口：

   ```
   读取 https://github.com/Small-tailqwq/dsh-deep-whale/INSTALL.md 并按其中指引安装皮肤
   ```

2. INSTALL.md 会把 dsh 引导到仓库自带的 `dsh-skin-install` 技能（若 dsh 无法读取远端文件：先 `git clone` 到本地，在 dsh 中把 clone 目录**打开为工作区**——技能会被自动发现——或让它读取本地 `INSTALL.md` 路径）。技能随后依次完成：

   列出全部皮肤并**询问你要激活哪一套** → 交代署名链与许可（CC BY-NC-SA 4.0）→ 绝对路径注册所选皮肤（连同 skin-manager）→ **写入两个 patch 层的互斥 `disabled` 行** → 验证生效。之后切换皮肤也走同一入口（配置热重载，无需重启）。

   已安装/已知目标时走快车道：直接说“切换到 maid-atelier”或“安装 orca-link”，技能跳过询问与扫描，预计 1–2 分钟完成。

### 皮肤互斥机制（必读）

- 先分清：`skin-manager` 不是皮肤，而是**皮肤管理器**（提供发现、切换与定制面板），需要常驻启用；互斥的对象是**皮肤本身**——本仓库的皮肤是 maid-atelier 与 orca-link。
- 皮肤启停由 patch 层控制：profile 的 `~/.dsh/profiles/web/cordis.patch.yml` 与 home 层的 `~/.dsh/cordis.patch.yml` 里各自的 `- id: <wiring.id>` + `disabled: true/false` 行（**两层都要写**，home 层优先级更高）。
- **patch 里没有某皮肤行的 `disabled` 行 → 该皮肤默认启用**。一次把多套皮肤（maid-atelier 与 orca-link）都装上、又从未切换时，它们会**同时运行**：装饰层互相叠加、侧栏/设置区被搅乱，典型症状是**设置按钮消失、侧栏宽度/布局异常、界面混乱**（原版正常）。
- skin-manager（设置 → 皮肤管理）激活时会自动把互斥行写入两个 patch 层；手写时“只保留一套”必须**显式停用其余每一套**。
- 安装了皮肤管理器后，皮肤定制项（如“不那么二次元模式”的可见时段）保存在当前浏览器，由管理器统一应用。

### 手动安装（备用路径，装完必须立即补齐互斥写入）

```sh
git clone --depth 1 https://github.com/Small-tailqwq/dsh-deep-whale   # clone 到任意位置（浅克隆足够，跳过历史）
dsh plugin --profile web add <clone 的绝对路径>/skin-manager   # 常驻皮肤管理面板（推荐）
dsh plugin --profile web add <clone 的绝对路径>/maid-atelier   # 深海女仆工坊
dsh plugin --profile web add <clone 的绝对路径>/orca-link      # 虎鲸链路
```

> ⚠️ 上面命令会安装**皮肤管理器 + 两套皮肤**；两套皮肤默认**同时启用**。安装后必须立即执行下面任一步骤，只保留一套皮肤生效，否则就会出现互斥机制一节描述的症状。

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
2. 管理器不可用时（或配置已被写坏）：按上方方式 B 手动重写两个 patch 层的互斥行；
3. 也可以直接摘掉不用的包：`dsh plugin --profile web remove <包名>`，摘除后同样检查互斥行。

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

### 常见安装失败排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `ERR_PNPM_FETCH_404 ... <名字>` | 传了裸目录名（如 `add maid-atelier`），被当成 npm 包名 | 改为绝对路径或 `./`/`../` 前缀路径 |
| 命令成功但 `dsh plugin list` 没有该包 | 相对路径解析到了错误位置（clone 位置与假设不符） | 用绝对路径重新 add |
| `pnpm not found on PATH` | 环境缺少 pnpm | 安装 pnpm（`npm i -g pnpm`）后重试 |
| 包在列表里但页面无效果 | 皮肤被 `disabled`（多皮肤互斥开关）或浏览器未刷新 | `--dump-config` 核对 disabled；刷新页面 |

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
