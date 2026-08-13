# maid-atelier · 深海女仆工坊

DeepSeek Harness Web GUI 的深海女仆工坊皮肤：双女仆背景、深海蓝蕾丝界面与 Q 版侧栏。纯展示层客户端插件——`apply()` 设置 `data-dsh-maid-atelier` 作用域、按亮/暗主题切换宫殿背景、以独立透明层挂载双女仆角色、装饰可折叠侧栏,并为加载/思考/工具运行状态预留稳定动画钩子。effect 销毁器还原全部 CSS/DOM 写入;不注入服务、不发出 Cordis 事件、不触达模型请求。

## 特性

- 双女仆工坊场景对话背景(亮/暗自动切换)
- 深海蓝、陶瓷白、长春花蓝、柔金构成的可热切换 UI 覆盖层
- Q 版侧栏角色与视口装饰、favicon
- 着陆页角色随响应式输入框缩放;对话页移向安全边缘;轨迹/检查视图保持着陆构图
- 素材内嵌于 client bundle(数据 URI),激活不依赖任何临时文件/远程 URL/资源服务器

## 安装

```sh
git clone https://github.com/dsh-external/dsh-deep-whale
cd <harness>
dsh plugin --profile web add ../dsh-deep-whale/maid-atelier
```

加载即生效、卸载即复原(与皮肤中心/dsh-skin 的互斥切换兼容,`wiring.id` 为 `ui-skin-maid-atelier`)。

## 素材来源与许可

本皮肤整体以 **CC BY-NC-SA 4.0**(署名-非商业性使用-相同方式共享)发布,**禁止任何商业性使用**。

皮肤素材为衍生创作,署名链(详见 `NOTICE`):

1. **一创 上善**（[Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili：上善无形](https://b23.tv/8h5L4xz)）—— 鲸鱼娘角色形象原作者
2. **二创 zipzip**（[Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili：ZipZipPipe](https://b23.tv/Pnw6nG8)）—— 在其形象上加入 DeepSeek 元素的女仆鲸鱼娘二次设计(生成模型 GPT Image 2)
3. **三创(本皮肤)Small-tailqwq** —— DeepSeek 元素再设计

完整许可文本见 `LICENSE`;素材源文件在 `assets/`。

## 开发与构建

皮肤工程脚手架(目录模板、`tsdown.client.ts` 构建预设、`dsh-skin-new` 脚手架、皮肤中心与切换脚本)来自 [dsh-external/dsh-web-ui](https://github.com/dsh-external/dsh-web-ui)(作者:那位兄弟)——**本仓库只分发皮肤成品(含预构建 `lib/`),不包含脚手架**。开发构建请在该仓库的 `skins/maid-atelier/` 目录进行:

```sh
cd <dsh-web-ui>/skins/maid-atelier
pnpm build          # 重新生成素材嵌入 + tsdown 构建 lib/
pnpm test           # apply.spec.ts 行为测试
```

构建产物 `lib/` 提交回本仓库即完成一次皮肤更新。

## 许可

CC BY-NC-SA 4.0。见 `LICENSE` 与 `NOTICE`。
