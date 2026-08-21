# Agent Note: DSH rc8 客户端适配——幽灵文本、内联 token、品牌 slot 与构建管道陷阱

Status: implemented

## Problem

DSH `0.1.0-rc.7 → 0.1.0-rc.8` 重构了 client 层：`web-react` 删除、渲染迁入动态插件
`ui-renderer`，模块表基座变化，composer 改为「幽灵文本」渲染。orca-link 在 rc8 下出现
三处可见回归：输入文字不可见、左上角官方品牌恢复显示、皮肤 token 覆盖失效。
后续给 composer 启用可选衬线字体时还会出现 selection/caret 与实际文字错位：textarea
已经切到 Georgia，而 rc8 的 backdrop 与 mirror 仍沿用系统无衬线，连续窄字符会累积字宽差。
会话记录：2026-08-20、2026-08-21；PR：`Small-tailqwq/dsh-deep-whale#58`。

## Decision

1. **幽灵文本（输入文字不可见）**：rc8 的 composer textarea 本体
   `-webkit-text-fill-color: transparent`，可见草稿渲染在 `[data-input-backdrop]` 层；
   中文 IME 输入与光标邻接文字渲染在 textarea 本体 → 透明不可见。
   修复：皮肤对 `input/textarea` 补 `-webkit-text-fill-color: var(--orca-ink)`
   （含 `::placeholder`）。
2. **输入层度量一致性**：textarea、`[data-input-backdrop]` 和 `[data-input-mirror]`
   是同一份草稿的真实输入、可见回显与布局测量三层。任何可选字体必须同时覆盖三层的
   `font-family`，并保持 font-size、font-weight、line-height、letter-spacing 与 padding 一致；
   只改 textarea 会让选择高亮、光标和自动换行逐字符漂移。
3. **内联 token 压制**：rc8 把主题 token 写入 body 内联样式（优先级高于 CSS 规则），
   皮肤的 `--dsw-*` 变量覆盖全部失效。修复：浅色/暗色变量块的 `--dsw-*` 声明统一
   `!important`（orca 96 个变量实测）。
4. **品牌 slot 嵌套**：品牌结构从 `button > svg` 变为
   `button > span > span > div[data-slot='sidebar.brand.mark'] > svg`，旧 `> svg` 隐藏规则
   失配。修复：隐藏规则同时匹配嵌套路径；`sidebar.brand.name` 槽位有 React 内联
   `display: contents`，需 `!important` 才能隐藏。
5. **构建管道陷阱**：
   - lightningcss 会把源码 `2147483000` 静默改写为 `2147480000`（魔法数字不可靠）。
   - CSS Modules 处理会把 `#root` ID 选择器哈希成 `#eq53Ga_root`，规则失配。
   - 官方 trajectory 插件有 `#root { z-index: 1 }`（ID 选择器，(1,0,0)），压过皮肤用
     属性选择器 `[id='root']` 的提升规则——必须 `[id='root']` + `!important`。

## Verification

- Playwright 实测：textarea `-webkit-text-fill-color` 由透明恢复为 `rgb(17,21,27)`；
  品牌 mark/name `display: none`；`--dsw-specific-input-major` computed 恢复皮肤值；
  零控制台错误。
- maid-atelier #22 模式输入并全选 20 个连续数字：textarea、backdrop、mirror 的 computed
  font-family/font-size/font-weight/line-height/letter-spacing/padding 完全相同，selection 为
  `[0, 20]`，回显与 mirror 文本同步。
- `#root` 提升修复前后：settings 打开时 `#root` z-index 1 → 980（详见 stacking note）。

## Alternatives considered

- **只覆盖 `color` 而不动 `-webkit-text-fill-color`**：实测无效——`text-fill-color`
  优先于 `color`，textarea 文字仍透明；必须显式覆盖 fill。
- **隐藏官方 backdrop、自绘输入层**：改动面大、与官方装饰（token/chip 高亮）冲突，
  放弃；text-fill 覆盖即可恢复可见性且保留官方渲染。
- **衬线字体只作用于 textarea**：视觉文字会变化，但 backdrop 与 mirror 仍用另一套字宽，
  连续数字和窄拉丁字符会稳定复现错位；必须三层一起覆盖。
- **用 `#root`（ID 选择器）做提升**：被 CSS Modules 哈希为 `#eq53Ga_root` 导致失配；
  属性选择器 `[id='root']` + `!important` 同时绕开哈希与 trajectory 特异性压制。
- **接受官方 token 不覆盖**：皮肤整体配色偏离设计（石墨 vs 官方蓝），不可接受。

## Consequences

- 皮肤获得 rc8 完整兼容，但 `--dsw-*` 覆盖依赖 `!important`，官方 token 机制再变时
  需重审；构建管道对魔法数字与 ID 选择器不可信任，新皮肤应默认走 z 阶梯与属性选择器。
- 后续任何 composer 字体、字号、字重、行高或字距定制都必须把 textarea/backdrop/mirror
  视为一个不可拆分的度量组。

## Related

- 提交：`1024f0a`（fix/orca-link-rc8-compat）
- PR：#58；issue：#56（见 stacking note）
- 会话：2026-08-20 rc7→rc8 升级与皮肤兼容性排查
- 会话：2026-08-21 maid-atelier #22 连续数字 selection/caret 错位修复

