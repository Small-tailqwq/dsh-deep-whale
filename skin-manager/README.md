# DSH Skin Manager

`skin-manager` 是常驻的通用皮肤管理模块。它在 DSH 设置页注册“皮肤管理”一级页面，并提供：

- 从当前 Web profile 的依赖中发现所有带有效 `skin.json` 的皮肤；
- 在官方默认与任意已安装皮肤之间互斥切换；
- 启动时兜底检测 profile→home 两层的有效启停状态；若两套及以上皮肤会同时启用，原子回退到官方默认；
- 渲染活动皮肤通过 v1 协议主动暴露的开关、下拉、复选组、滑杆、颜色与可见时段配置项；
- 通用的“不那么二次元模式”：按本机时间设置多个显示或隐藏时段。

与皮肤一起，从仓库一行安装（需要 pnpm ≥ 9，`#path:` 子目录语法）：

```sh
dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/skin-manager' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/maid-atelier' && dsh plugin --profile web add 'github:Small-tailqwq/dsh-deep-whale#path:/orca-link'
```

PowerShell 版本（`#` 是注释起始，spec 必须单引号包裹）见仓库 README。首次安装后重启一次 DSH；首次重启时管理器兜底检测到两套及以上皮肤同时启用会原子回退官方默认，之后在“设置 → 皮肤管理”切换。本地开发时对 skin-manager 与皮肤目录分别以绝对路径 link，不要与 GitHub 安装混跑（同一包名，后 add 覆盖）。

切换与启动兜底都会同步改写当前 Web profile 与优先级更高的 home patch 中的标准 `dsh-skin managed` 区段；区段外的用户 YAML 保持不变。已有零套或一套皮肤启用时，启动兜底不写文件。自定义配置按 `skinId` 保存在浏览器 `localStorage`，不会修改模型请求或 DSH 服务。

## 皮肤接入

激活管理只要求皮肤包导出有效的 `skin.json`，其中 `package` 必须等于实际包名，且包含 `id`、`bodyAttr` 和 `wiring.id`。需要详细配置的皮肤再从自己的 client 入口调用 `exposeSkinCustomization()`：

```ts
import { exposeSkinCustomization } from '@dsh-external/dsh-client-ui-skin-deep-whale-manager/protocol'

const dispose = exposeSkinCustomization({
  protocol: 1,
  skinId: 'deepcel',
  title: 'Deepcel',
  settings: [
    { key: 'artwork', type: 'boolean', label: '显示立绘', defaultValue: true },
    { key: 'accent', type: 'color', label: '强调色', defaultValue: '#ff536f' },
    {
      key: 'accentTargets',
      type: 'checkbox-group',
      label: '强调目标',
      defaultValue: [],
      visibleWhen: { key: 'artwork', values: [true] },
      options: [{ value: 'title', label: '标题' }, { value: 'frame', label: '边框' }],
    },
    {
      key: 'sfwMode',
      type: 'visibility-schedule',
      label: '不那么二次元模式',
      defaultValue: { enabled: false, outside: 'visible', ranges: [] },
    },
  ],
  apply(state) {
    // state === null 时恢复本皮肤拥有的 DOM/CSS 状态。
    // state.visibility.sfwMode 是管理器按时间规则算出的当前可见性。
  },
})
```

`visibleWhen` 按另一设置的当前值决定是否渲染依赖项；`legacyValue` 可在新键尚未写入时把旧键值映射为新默认值，用于无损拆分已有设置。复选组的值按声明中的 option 顺序保存为字符串数组。

皮肤必须持有并清理自己的 DOM、CSS、observer、listener 与 timer；管理器只处理声明、持久化和时间规则，不了解皮肤内部选择器。`exposeSkinCustomization()` 的返回值应注册到皮肤的 Cordis effect disposer。
