# 内置插件图标

两套皮肤直接使用各自 `assets/plugin-icons/` 中的 SVG。管理器末尾的「插件图标 → 使用皮肤预设图标」控制替换，默认关闭，与桌面图标设置同级。开关保存在管理器的本地偏好中，随设置备份导入导出。

`npm run build` 通过 `scripts/prepare-skin-assets.mjs` 与 `scripts/preset-plugin-icons.mjs` 读取原 SVG，生成各皮肤的 `src/client/plugin-icons.generated.module.css`。SVG 原文编码为本地 data URL，嵌入客户端样式并计入 `lib/client.js` 的构建指纹；原素材文件保持不变。`NOTICE` 声明这些素材沿用美术许可。小型 SVG 不进入 PNG/WebP 运行时资源清单。

当前绑定核对官方 `0.2.2-rc.1 @ fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159` 的 `PluginManagerPage.tsx`：按 `data-plugin-item` / `data-plugin-package` 及各自详情标记定位，原图节点保留，图框伪元素用独立图片显示 SVG。皮肤样式限定在自己的 body 标记下，管理器只控制显示变量；切换皮肤后自动采用新皮肤的素材。无映射的插件、官方默认界面及未提供该样式的皮肤显示原图。

替换覆盖插件列表和详情页的图标，不改变插件开关、状态与控件。右栏引导与 Agent 团队的素材仍保留在素材目录。

## 宿主图标清单（DSH 0.2.1-rc.2）

宿主有两类图标，均为 `width="36" height="36" viewBox="0 0 36 36"`，在插件页 48px 卡片框内渲染 36px、40px 行框内渲染 30px：

- **代码内 artwork**：`@deepseek-ai/dsh-client-ui-primitives` 的 `src/plugin-artwork.tsx` 与 `src/guide-artwork.tsx`，React 组件，经 `useId` 生成渐变 id。插件管理器按设置注册 id 用 `ITEM_ARTWORK` 选图，未登记的回退 `PluginArtworkDefault`；`PackageArtwork` 在包无图标或解码失败时，卡片回退 `Default`、组件行回退 `Subagent`。
- **包图标**：官方包的 `package.json#icon`（均为 `./icon.svg`），宿主读成 data URI，经 `<img>` 渲染。

| 文件名 key | 宿主来源 | 使用位置 |
| --- | --- | --- |
| `default` | `PluginArtworkDefault` | 无专属图的官方设置项、无图标第三方包卡片、插件市场 Discover 占位 |
| `terminal` | `PluginArtworkTerminal`；`dsh-experimental-terminal-bundle/icon.svg`（同图） | 设置项 `shell`、右侧栏终端引导、终端扩展包 |
| `loop` | `PluginArtworkLoop`；`dsh-experimental-ralph-bundle/icon.svg`（同图） | 设置项 `agent-loop`、Ralph 包 |
| `subagent` | `PluginArtworkSubagent`；`dsh-subagent-codex`、`dsh-subagent-claude-code` 的 `icon.svg`（同图） | 设置项 `subagent`、组件行回退、两个外部子代理包 |
| `search` | `PluginArtworkSearch` | 设置项 `web-search` |
| `session-search` | `dsh-experimental-session-search` | 会话搜索 |
| `guide-browser` | `GuideArtworkBrowser` | 右侧栏浏览器引导 |
| `guide-files` | `GuideArtworkFiles` | 右侧栏文件引导 |
| `agent-team` | `dsh-experimental-agent-team-profile` | Agent 团队 |
| `auto-review` | `dsh-experimental-auto-review` | 自动授权审查 |
| `skill-badge` | `dsh-skill-badge`、`dsh-experimental-badge-skill-bundle`（同图） | 徽章技能 |
| `cot-translation` | `dsh-experimental-cot-translation-bundle` | 思维链翻译 |
| `inspector` | `dsh-experimental-inspector`、`dsh-experimental-inspector-profile`（同图） | 检查器 |
| `plugin-market` | `dsh-experimental-plugin-market-bundle` | 自定义插件市场 |
| `session-titles` | `dsh-experimental-session-titles-bundle` | 会话标题 |
| `tool-worktree` | `dsh-experimental-tool-worktree` | Worktree 工具 |
| `voice-input` | `dsh-experimental-voice-input-bundle` | 语音输入 |

宿主升级时用 `PluginArtwork` / `GuideArtwork` 导出名与官方仓库 `git ls-files '*icon.svg'` 复核此表；新增图形需两套皮肤同时补齐同名文件。

## 风格

- **深海女仆工坊**：圆角实心造型，长春花蓝 `#8ea5da` → 深海蓝 `#31498f` 渐变，金色 `#c5a468` 描边与点缀，瓷白 `#fffaf0` 内部笔画，部分图形带一颗金色四角星。
- **ORCA LINK**：沿用皮肤图标重绘的直角语言——方头端点、斜接拐角、只用直线（方向记号允许 45°），链路蓝 `#2f7dff` + 石墨 `#7a8699`，一枚青色 `#20c7e8` 信号方块。

图标以独立图片渲染，使用素材中的预设颜色，因此颜色取亮暗卡片底上都可辨的中间调。遵守官方 `dsh-official-plugin-artwork` 的导出约束：不内置外框底板，主体约 18–22 单位居中；只用几何，不含脚本、`<style>`、文字、图片或 `foreignObject`；渐变和遮罩 id 以 `maid-` 前缀局部唯一。
