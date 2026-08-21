# Agent Note: 女仆皮肤输入框图片预览被底板遮挡

Status: implemented

## 背景

hero/active composer 添加图片后,附件缩略图 rail 区域显示为空白;F12 中 `<img>` 元素存在、blob 源加载正常、呈现尺寸 62×62(正常布局),仅视觉不可见。排查确认是层叠问题,而非图片数据问题。

## 根因

官方 InputBar 的附件槽位容器是 `<div data-slot="conversation.input.attachments" style="display: contents">`(`ui-conversation` InputBar JSX + `slots` 渲染)。`display: contents` 元素**不产生盒子**,因此皮肤原有的内容提升规则:

```css
[data-composer-card] > * { position: relative; z-index: 2; }
```

对它**无效**(该规则提升的是 slot 容器,而它没有盒子;`position`/`z-index` 在 display: contents 上不生效)。附件 rail(`ComposerAttachments` 的 `div.rail`)因此停留在普通流绘制层。而皮肤的 `::after` 底板:

```css
[data-composer-card]::after { position: absolute; inset: 0 -0.52% -2%; z-index: 0; background: inherit; }
```

是 positioned + z-index: 0,在层叠上下文中**高于所有普通流内容**;其背景继承卡片的不透明 porcelain 渐变(α 0.88–0.76),把 rail 完全盖住 —— 与截图一致:rail 区域一片空白,只有 textarea(位于 z-index: 2 的 `scroll` 容器内)的占位文字可见。

## 修复(maid-atelier.module.css)

1. **底板降为负层**:`::after` 的 `z-index: 0 → -1`。语义更正确(它本来就是"底板",应绘制在卡片背景之上、所有内容之下;bleed 仍可见),并防御未来任何 display: contents 槽位内容。
2. **提升附件槽位的内容盒子**:新增规则

```css
[data-composer-card] > [data-slot='conversation.input.attachments'] > :not([class*='mask']) {
  position: relative;
  z-index: 2;
}
```

   rail 与 textarea/工具栏同级,完整绘制在装饰框架(`::before`, z-index: 1)之上。`:not([class*='mask'])` 排除拖拽遮罩 DropOverlay(`BInVoG_mask`,position: fixed;若被提升会破坏 fixed 坐标)。

未受影响:ImageLightbox 大图预览经 `createPortal` 到 body,不在槽位内;DropOverlay 保持 fixed。

## 验证

- `apply.spec.ts` 更新用例 `overlaps the composer backing plate beneath the hollow raster frame`(断言 `z-index: -1` 且非 0),新增用例 `lifts the attachments slot content above the composer decorations`(断言槽位提升规则与 mask 排除)。全套 101 用例通过。
- 重新构建 `lib/client.js`,压缩产物确认 `[data-composer-card]>[data-slot="conversation.input.attachments"]>:not([class*=mask]){z-index:2;position:relative}` 与底板 `z-index:-1` 均在。
- 无头 Chrome CDP 探测确认官方 DOM:`card > div[data-slot='conversation.input.attachments'][style='display: contents']`(headless profile 未加载皮肤,仅用于结构确认)。

## 关联

- 后续人工验收:hero 与对话中 composer 分别添加图片,确认缩略图显示、点击缩略图可打开大图、拖拽图片入窗时 DropOverlay 全屏遮罩仍正常。
