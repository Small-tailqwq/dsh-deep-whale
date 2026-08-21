# Agent Note: LINK 皮肤侧边栏 tooltip 被对话标题遮挡

Status: implemented

## 背景

LINK(orca-link)皮肤下,侧边栏按钮("打开/收起侧边栏"等)的 tooltip 被对话标题、轨迹界面等 UI 遮挡。maid-atelier 此前修过同机制缺陷,本笔记记录移植过程与两处坑。

## 根因(两层 stacking context)

1. **carrier 层**:侧边栏根的**所有直接子元素**被提升为 `position: relative; z-index: 1`(orca-link.module.css 1144 行附近),形成 stacking context;官方 rail tooltip 不走 portal,渲染在 anchor 旁的 carrier 内(`logoRow` 等),被该上下文困住。原有处理只覆盖折叠侧边栏(`:not([data-orca-sidebar-wide])` 的 overflow 释放与 `--orca-z-tooltip`),wide 侧边栏无任何处理。
2. **根层**(CDP 实测确认):侧边栏根 `:is([data-pane='sidebar'], [data-slot='sidebar'] > :first-child)` 本身是 **`isolation: isolate`**——自己就是 stacking context(与 z-index 无关),即使释放 carrier,气泡仍困在根内;官方对话标题位于**官方 frame 的 `z-index: 1` 上下文**(`pI_x6G_frame` 外层 div,CDP 实测),根整体低于它,气泡被盖。轨迹界面同理。

## 结论(与 maid 机制 + orca settings-open 先例一致)

```css
/* 1. 释放含 tooltip 的 carrier(maid 同款) */
[data-slot='sidebar'] > :first-child > :has([role='tooltip']) { z-index: auto; }

/* 2. 释放侧边栏根的 isolation(与 settings-open 块同机制) */
:is([data-pane='sidebar'], [data-slot='sidebar'] > :first-child):has([role='tooltip']) {
  z-index: auto;
  isolation: auto;
}
```

tooltip 出现时两层同时释放:carrier 不再困气泡,根不再是 stacking context,气泡的 `z-index: 950`(rail)/`100`(wide)回到官方 frame 级参与层叠,浮于标题/轨迹之上;tooltip 消失后自动恢复。根内其他元素均为侧边栏盒内 absolute 定位,不越界,无泄漏风险。

## 踩过的坑

- **首版只做 carrier 释放** → 根 `isolation: isolate` 仍在,修复无效。
- **根释放选择器写成 `:is(...) :has(...)`(空格 = 后代组合器)** → 匹配的是根的子元素(本就 `isolation: auto`),根未被释放;规则存在但完全无效(用户两次实测均失败,CDP 检查发现页面规则在、root 仍 isolate)。**`:has()` 必须与 `:is()` 挂在同一元素(`):has(`)**,且测试断言要防回归(不匹配 `) :has(`)。

## 验证

- `orca-link/tests/modal-scope.spec.ts` 新增用例 `releases the tooltip carrier so fixed bubbles clear the conversation header`:断言 carrier/root 两层释放规则、`position` 非 static、无 `z-index: 1`、无后代组合器版本。
- **无头 Chrome 实机验证**(加载 orca 皮肤、POST /api/dsh/skins 切换、CDP 模拟 hover 触发 tooltip):tooltip 出现时侧边栏根 computed `isolation: auto`,气泡祖先链无 `isolation: isolate` 阻塞,截图确认"打开侧边栏"完整浮出。
- 重建 `orca-link/lib/client.js`。

## 关联

- maid-atelier `maid-atelier.module.css` 509–530 行(参考实现);orca settings-open 释放块(445–448 行,同机制先例)。
- 后续人工验收:wide 与 rail 侧边栏悬停各按钮,tooltip 浮于对话标题/轨迹界面之上;tooltip 消失后侧边栏 chrome 恢复正常。
