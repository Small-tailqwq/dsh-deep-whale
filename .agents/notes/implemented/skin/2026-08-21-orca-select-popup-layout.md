# Agent Note: LINK 皮肤裸下拉框箭头居中与长选项截断

Status: implemented

## 背景

皮肤管理 → 深海女仆工坊定制卡片的时/分时间选择器(本次会话由 skin-manager 的 `TimeSelect` 提供,两个裸 `<select>`)在 orca-link(LINK)皮肤下箭头仍偏下不居中。根因与 maid-atelier 此前的裸 select 问题相同:orca-link 的 base-select 定制只给官方 `_selectInput` 设置了 flex 行布局,裸 select 的 `::picker-icon` 按文本基线对齐下沉。

## 结论

在 orca-link `@supports (appearance: base-select)` 块内补齐与 maid-atelier 一致的通用规则:

- 通用 `[data-slot='sidebar.settings'] [role='dialog'] select` 加 `display: flex; align-items: center; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`(裸 select 与 `_selectInput` 同享行布局与单行截断);
- `::picker-icon` 加 `flex: none`(不被 flex 压缩、垂直居中);
- `option` 加 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`(长选项不再换行)。

## 验证

- `orca-link/tests/modal-scope.spec.ts` 新增用例 `lifts every settings select into a flex row so bare picker icons center`,断言通用 select 的 flex/nowrap、`::picker-icon` 的 `flex: none`、option 的 nowrap。该文件 5 用例通过(工作区其余测试因含未提交改动需在完整工作区运行,全套 81 用例此前已通过)。
- 重建 `orca-link/lib/client.js`,产物包含以上规则。

## 关联

- maid-atelier `maid-atelier.module.css` 3224 行起 base-select 定制(同机制参考)。
- 后续人工验收:orca-link 皮肤下打开皮肤管理 → 定制卡片,展开时/分下拉,箭头垂直居中、选项单行。
