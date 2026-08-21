# Agent Note: 女仆皮肤设置界面下拉框弹层定制

Status: implemented

## 背景

官方设置面板（设置 → 模型设置 → 添加提供方等）中的 `<select>`（`_input _selectInput`）闭合状态已由官方 `_input` 样式统一（32px 高、8px 圆角、`--dsw-alias-bg-layer-1` 底色、聚焦 `--dsw-alias-brand-primary` 蓝边），在 maid-atelier 的 dialog token 重置下与旁边的文本输入框风格一致；但**展开后的选项列表仍是操作系统原生弹层**（白底、系统灰色滚动条、选中项系统灰高亮），与皮肤的 porcelain/金色语言割裂。orca-link 已用 Chromium customizable-select（`appearance: base-select`）解决同类问题；maid-atelier 此前没有对任何 select 弹层做过处理。

## 结论

**在 `@supports (appearance: base-select)` 内定制弹层与箭头；闭合状态几何保持官方 `_input` 不变，因此与输入框同高同圆角同底色。** 作用域 `body[data-dsh-maid-atelier] [role='dialog'] select`：官方设置对话框与 body-portal 的编辑模态都带 `[role='dialog']`，皮肤本就在该作用域重置 token（3013 行），且该皮肤暴露的定制卡片（皮肤管理 → 深海女仆工坊）也渲染在对话框内，一个选择器同时覆盖官方 `_selectInput` 与卡片裸 select。

- 闭合：`appearance: base-select` + `background-image: none`（移除官方灰色 SVG 箭头，交给 `::picker-icon`）；`select[class$='_selectInput']` 显式 `display: flex; align-items: center; height: 32px; padding-inline: 10px`（覆盖官方 `padding-right: 32px` 的箭头占位）。
- 箭头：`::picker-icon` 金色三角（`#c5a468`，clip-path），`:open` 旋转 180°；`_selectInput` 上 `margin-left: auto` 靠右。
- 弹层：`::picker(select)` porcelain 渐变（`#fcfaf5 → #dee6f6`）+ 金色描边（`rgba(197,164,104,0.64)`）+ 10px 圆角 + `--maid-shadow` 系投影 + `scrollbar-color` 定制滚动条。
- 选项：`option` 30px 行高、2px 透明左边框、6px 圆角；hover/focus-visible 金边 + 淡蓝底；`:checked` 金边 + 金蓝渐变 + 加粗；`option::checkmark` 金色菱形（clip-path）。
- 深色主题：箭头/描边换亮金 `#d3b477`，弹层换藏蓝玻璃渐变（`#132652 → #071333`），选项文字 `#bdc9e3 → #e7ecf7`。
- 降级：不支持 base-select 的引擎整块不生效，保持官方 `appearance: none` + 内联 SVG 箭头（现状）。

未做：闭合态 hover/聚焦重绘（官方 `_input:focus` 蓝边已与输入框一致，保持一致优先）；非 dialog 作用域（composer 的模型选择是自定义菜单组件，非 `<select>`）。

## 追加修复：定制卡裸 select 的箭头居中与长文字

人工验收暴露两个问题,均**只出现在皮肤管理 → 深海女仆工坊定制卡片的裸 `<select>`**(无 `_selectInput` 类),官方皮肤/官方设置下拉无此问题,判定为皮肤 base-select 适配不完整而非 skin-manager UI 缺陷(skin-manager 的 select 遵循官方 `_input` 契约,官方皮肤下原生渲染正常):

1. **箭头未垂直居中**:裸 select 没有 `display: flex; align-items: center`,`::picker-icon` 以 inline 基线对齐 → 三角偏上。修复:把 `display: flex; align-items: center; text-align: left` 从 `_selectInput` 上移到**通用** `[role='dialog'] select`(裸 select 保持自身 30px 控制盒与 8px 内边距,只获得行布局);`::picker-icon` 加 `flex: none`。
2. **长选项文字换行**:`Georgia / Noto Serif 中文（#22）` 超出 240px 控制盒/弹层宽度。双管齐下:通用 select 与 option 均加 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`;选项 label 缩短为 `Georgia 衬线（#22）`(`customization.ts`,未破坏字体族信息,#22 设计编号保留)。

## 验证

- `maid-atelier/tests/apply.spec.ts` 新增用例 `dresses the settings select popup in the porcelain-and-gold language`：断言 base-select 门控、`background-image: none`、`_selectInput` 32px/10px 几何、箭头 clip-path 与旋转、弹层 porcelain/金边/圆角/滚动条、option hover/checked、深色变体，以及无 body 级 `select`/`:has` 泄漏。全套 100 用例通过。
- 追加修复后更新该用例断言(通用 select 的 flex/nowrap、`::picker-icon` 的 `flex: none`、option 的 `white-space: nowrap`)。全套 101 用例通过。
- 重新构建 `lib/client.js`（tsdown + lightningcss），压缩产物确认 `@supports (appearance:base-select)` 块完整（`::picker(select)`、`option::checkmark`、`:open`、深色变体均在），通用 select 规则含 `display:flex;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`，label 为新短文本。

## 关联

- orca-link `orca-link.module.css` 839–940 行（参考实现；本皮肤采用 porcelain/金色语汇与官方 `_input` 32px 几何，而非 orca 的 34px 与蓝色装备条）。
- 后续人工验收：新版 Chromium 下打开设置 → 模型设置 → 添加提供方，展开下拉确认弹层 porcelain/金色；深色主题复检；旧引擎降级为官方原生弹层；皮肤管理卡片的下拉箭头垂直居中、长文字单行截断。
