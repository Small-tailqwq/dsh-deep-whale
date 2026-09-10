# maid-atelier · 深海女仆工坊

DeepSeek Harness Web GUI 的深海女仆工坊皮肤：双女仆背景、深海蓝蕾丝界面与 Q 版侧栏。纯展示层客户端插件——`apply()` 设置 `data-dsh-maid-atelier` 作用域、按亮/暗主题切换宫殿背景、以独立透明层挂载双女仆角色、装饰可折叠侧栏,并为加载/思考/工具运行状态预留稳定动画钩子。effect 销毁器还原全部 CSS/DOM 写入;不注入服务、不发出 Cordis 事件、不触达模型请求。

## 特性

- 双女仆工坊场景对话背景(亮/暗自动切换)
- 深海蓝、陶瓷白、长春花蓝、柔金构成的可热切换 UI 覆盖层
- Q 版侧栏角色与视口装饰、favicon
- 启动插件加载失败时，默认以左右独立的双女仆立绘装饰原生错误报告，支持窄屏重排，遵循现有立绘显示与时段设置。此效果依赖皮肤已成功执行；皮肤自身或内核尚未加载时保留原生页面。
- 双女仆与宫殿背景整层挂在**对话区(centerCol)内部**:随聊天区域尺寸自适应(右/下工作台推开聊天区时背景与女仆同步收缩,不再固定于视口),左女仆贴聊天区左下、右女仆贴右下,均位于聊天记录与输入器之下;聊天态与着陆页按比例切换构图
- 素材内嵌于 client bundle(数据 URI),激活不依赖任何临时文件/远程 URL/资源服务器

## 安装

推荐连同皮肤管理器一起，从仓库一行安装（需要 pnpm ≥ 9，`#path:` 子目录语法）：

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier'
```

PowerShell 版本（`#` 是注释起始，spec 必须单引号包裹）见仓库 README。首次安装后重启一次 DSH，然后在“设置 → 皮肤管理”中选择“深海女仆工坊”；之后切换走配置热重载。独立子包 link 仅用于本地开发。

加载即生效、卸载即复原(与皮肤中心/dsh-skin 的互斥切换兼容,`wiring.id` 为 `ui-skin-maid-atelier`)。

## 网页与应用图标

标签页在每次加载皮肤模块时从三种表情中随机选择图标，本次加载内保持不变。安装为 Web App 时固定使用托腮图，任务栏图标由浏览器和系统据此生成；已安装或已固定的应用可能需要重新安装或固定才能更新。关闭女仆皮肤时恢复宿主的 favicon 和 manifest 声明。

Windows 快捷方式可下载独立 ICO：[困困](assets/icons/sleepy.ico)、[托腮](assets/icons/delighted.ico)、[认真](assets/icons/determined.ico)。每份包含 16、24、32、48、64、128、256 像素尺寸。

## 素材来源与许可

本皮肤代码采用 **MIT**；全部美术资源（包括 AI 生成及加工的图片）**禁止商业性使用**，保留相应权利人的版权及既有 **CC BY-NC-SA 4.0** 授权（署名、非商业、相同方式共享）。内嵌于代码或构建产物中的图片同样遵守美术许可。

皮肤素材为衍生创作,署名链(详见 `NOTICE`):

1. **一创 上善**（[Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili：上善无形](https://b23.tv/8h5L4xz)）—— 鲸鱼娘角色形象原作者
2. **二创 ZipZipPipe**（[Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili：ZipZipPipe](https://b23.tv/Pnw6nG8)）—— 在其形象上加入 DeepSeek 元素的女仆鲸鱼娘二次设计(生成模型 GPT Image 2)
3. **三创(本皮肤)Small-tailqwq** —— DeepSeek 元素再设计

许可范围与 MIT 正文见 [LICENSE](LICENSE)，美术许可正文见 [LICENSE-ARTWORK](LICENSE-ARTWORK)，署名链见 [NOTICE](NOTICE)。

## 开发与构建

皮肤工程脚手架(目录模板、`tsdown.client.ts` 构建预设、`dsh-skin-new` 脚手架、皮肤中心与切换脚本)来自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)(作者:Solitude)——**本仓库只分发皮肤成品(含预构建 `lib/`),不包含脚手架**。开发构建请在该仓库的 `skins/maid-atelier/` 目录进行:

```sh
cd <dsh-web-ui>/skins/maid-atelier
pnpm build          # 重新生成素材嵌入 + tsdown 构建 lib/
pnpm test           # apply.spec.ts 行为测试
```

构建产物 `lib/` 提交回本仓库即完成一次皮肤更新。

## 许可

许可范围与 MIT 正文见 [LICENSE](LICENSE)，美术许可正文见 [LICENSE-ARTWORK](LICENSE-ARTWORK)，署名链见 [NOTICE](NOTICE)。
