# orca-link · ORCA LINK 虎鲸链路

DeepSeek Harness Web GUI 的黑白机械链路皮肤：珍珠白机械舱、黑曜虎鲸操作员与电蓝链路信号。纯展示层客户端插件——整套 UI 执行全局直角契约（按钮、输入框、卡片、菜单、弹窗、提示、标签、头像、滚动条及伪元素统一归零圆角，状态信号与 favicon 正方形化），官方图标库全部图形在运行时重绘为仅由水平线、垂直线、45 度折线与实心方块构成的直线图形；亮色空态由坐在方形悬臂椅上的眨眼角色迎接用户，任务开始后交叉淡化为工作姿势；暗色场景按同一房间、同一机位切换；侧边栏顶部常驻面向会话区的状态角色（待机/同步/工作/授权/输入/审阅/完成/失败/离线/就绪，透明 WebP 图集内嵌）；侧栏词标旁常驻 LINK ACTIVE 方形信号点与峰谷定价红绿灯（北京时间）。`apply()` 设置 `data-dsh-orca-link` 作用域并管理可回收装饰层、动效监听、图标重绘层、favicon 和标题；effect 销毁器还原全部 CSS/DOM 写入；不注入服务、不发出 Cordis 事件、不触达模型请求。

## 特性

- 全局直角契约：圆角归零、状态信号与 favicon 正方形化
- 运行时图标重绘：命中宿主 SVG 仅隐藏原图形并追加直线图形层，卸载即整体还原
- 亮/暗各两组 16:9 场景（空态与工作态），640ms 交叉淡化，素材以数据 URI 内嵌于 client bundle
- 左上角状态角色：十状态、多帧连续动作，直接复用 LINK 状态推导
- 峰谷定价红绿灯：按北京时间实时显色，工作日高峰前 20 分钟黄灯预警、整点即转红，周末全天按低谷价亮绿，展开侧栏可悬浮查看详情卡（中英双语，语言热切换）
- 移动端自动隐藏大幅场景与舞台装饰

## 安装

推荐通过仓库根 bundle 一次安装管理器和全部皮肤：

```sh
dsh plugin --profile web add "github:Small-tailqwq/dsh-deep-whale"
```

重启后在“设置 → 皮肤管理”中选择“虎鲸链路”。独立子包 link 仅用于本地开发。

加载即生效、卸载即复原（与皮肤中心/dsh-skin 的互斥切换兼容，`wiring.id` 为 `ui-skin-orca-link`）。

## 素材来源与许可

本皮肤整体以 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）发布，**禁止任何商业性使用**。

皮肤素材为衍生创作，署名链（详见 `NOTICE`）：

1. **一创 上善**（[Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili：上善无形](https://b23.tv/8h5L4xz)）—— 鲸鱼娘角色形象原作者
2. **二创（本皮肤）Small-tailqwq** —— 基于上善原作角色身份的 ORCA LINK 皮肤场景、状态角色图集与 UI 素材衍生设计

完整许可文本见 `LICENSE`；素材源文件在 `assets/`。

## 开发与构建

皮肤工程脚手架（目录模板、`tsdown.client.ts` 构建预设、`dsh-skin-new` 脚手架、皮肤中心与切换脚本）来自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)——**本仓库只分发皮肤成品（含预构建 `lib/`），不包含脚手架**。开发构建请在该仓库的 `packages/skins/orca-link/` 目录进行：

```sh
cd <dsh-web-ui>/packages/skins/orca-link
pnpm build          # tsdown 构建 lib/
pnpm test           # vitest 行为测试
```

构建产物 `lib/` 提交回本仓库即完成一次皮肤更新。

## 许可

CC BY-NC-SA 4.0。见 `LICENSE` 与 `NOTICE`。
