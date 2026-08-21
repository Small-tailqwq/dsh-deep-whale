# Agent Note: LINK 皮肤 rail 状态 DSH 标识居中与裁剪

Status: implemented

## 背景

收起(rail)侧边栏时,DSH 标识(替换 wordmark)未居中:字符靠右,字母 H 右缘被 logo 行裁剪。用户实测截图 + CDP 实机定位。

## 根因

rail 状态 logo 行收缩到约 35px 宽(`hHd-Xa_logoRow`,overflow: hidden),而 wordmark 缩放盒为 33×8.4px(`scale(0.28)`)。定位仍沿用 wide 状态的锚点 `left: 4px; top: 15px`:

- wordmark 视觉区域 x=14~47,logo 行 x=10~45 → 中心偏右 3px;
- 右边缘超出 2px,被 `overflow: hidden` 裁掉(H 被切)。

## 结论

新增 rail 专用规则,按容器实际尺寸把缩放盒居中(不依赖固定容器宽度):

```css
body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) .dshWordmark {
  left: calc((100% - 33px) / 2);
  top: calc((100% - 8.4px) / 2);
}
```

33px / 8.4px 即 scale(0.28) 后的视觉尺寸;`transform-origin: left top` 不变,wide 状态锚点不变。

## 验证

- 无头 Chrome 实机(加载 orca、rail 状态):wordmark 中心与 logo 行中心偏差 x=0/y=0,右边缘溢出 0px,截图确认 DSH 完整居中。
- `orca-link/tests/sidebar-motion.spec.ts` 新增用例断言居中 calc 规则,4 用例通过。
- 重建 `orca-link/lib/client.js`。

## 关联

- orca-link.module.css `.dshWordmark` 基础规则(scale(0.28) + transform-origin: left top)。
- 后续人工验收:rail 状态 DSH 居中完整;展开(wide)后标识仍从左上锚点展开,扫描动画正常。
