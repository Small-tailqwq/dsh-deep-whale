# Agent Note: 皮肤管理时间选择器替换为可皮肤化的时/分下拉

Status: implemented

## 背景

皮肤管理 → 深海女仆工坊定制卡片(不那么二次元模式展开后)的时间段编辑使用 `<input type="time">`。其闭合样式可皮肤化,但**点击弹出的时间选择器是 Chromium 操作系统级 UI**(双列滚动数字、灰色高亮),任何 CSS 都无法触及 —— 与皮肤的 porcelain/金色弹层风格割裂,人工验收判定"好丑"。同类问题的先例:官方设置的下拉框也曾用系统弹层,已被 base-select 定制解决。

## 结论

**把 `input[type=time]` 替换为"时/分两个 `<select>`"** —— 弹层即现有可皮肤化的 customizable-select 表面(maid 下自动获得 porcelain/金色弹层,官方皮肤下保持原生 select),`"HH:MM"` 值契约不变(schedule.ts 的 `^(?:[01]\d|2[0-3]):[0-5]\d$` 校验、跨午夜逻辑、24 段上限全部无需改动)。

### skin-manager(ScheduleEditor 改造)

- 新增 `TimeSelect` 组件:时 select(00–23,24 项)+ 冒号 + 分 select(00–59,60 项);`aria-label` 分别为 `<label> 时` / `<label> 分`;onChange 重新组合 `"HH:MM"` 后交给上层 updateRange。
- `rangeRow` 用 `TimeSelect` 替换两个 time input。
- `skin-manager.module.css`:`.rangeRow input` 规则扩展为 `.rangeRow :is(input, select)`(兼容保留 input);新增 `.timeSelect`(inline-flex,两控件各占 50%、居中文本)与 `.timeColon`(`:`,tertiary 色)。
- 取舍:失去原生 picker 的键盘直接输入,换取弹层完全皮肤化;时/分两步选择与系统 picker 的两列滚轮交互等价。

### maid-atelier(弹层宽度)

- `::picker(select)` 增加 `min-width: min(200px, calc(100vw - 24px))`:时/分下拉控件宽度仅约 100–140px,60 项滚动列表在这么窄的弹层里不成比例;官方 240px 下拉不受影响(该值是 min)。

### 顺带修复:skin-manager 本地测试环境

- `vitest.config.ts` 引用未声明的 `vite-tsconfig-paths`(tsconfig 无 paths 别名,测试全为相对导入)→ 移除该插件。
- `package.json` devDeps 补 `react-dom@^18.2.0`(与 react 18 peer 匹配;测试用 `react-dom/server` 渲染断言)。

## 验证

- `skin-manager/tests/schedule-editor.spec.ts` 新增 2 用例:SSR 渲染断言 4 个 aria-label select、无 `type="time"`、option 总数(2×(24+60)+2);HH:MM 值正确拆分/回填到时/分 select。skin-manager 全套 15 用例通过。
- `maid-atelier/tests/apply.spec.ts` 的 select 弹层用例补充 `min-width: min(200px, calc(100vw - 24px))` 断言。maid 全套 101 用例通过。
- 重新构建两个 `lib/client.js`:skin-manager 产物确认 `aria-label: ${label} 时/分` 与 `type: "time"` 消失;maid 产物确认 picker `min-width`。

## 关联

- maid-atelier `maid-atelier.module.css` 3224–3380 行 base-select 弹层定制(时间下拉复用同一表面)。
- 后续人工验收:展开"不那么二次元模式",打开时/分下拉确认 porcelain/金色弹层、60 项滚动条定制、深色主题;删除/添加时间段与跨午夜规则(22:00–07:00)行为不变;官方皮肤下为原生 select 弹层。
