# DSH Skin Manager

`skin-manager` 是常驻的通用皮肤管理模块。它在 DSH 设置页注册“皮肤管理”一级页面，并提供：

- 从当前 Web profile 的依赖中发现所有带有效 `skin.json` 的皮肤；
- 在官方默认与任意已安装皮肤之间互斥切换；
- 启动时兜底检测 profile→home 两层的有效启停状态；若两套及以上皮肤会同时启用，原子回退到官方默认；
- 渲染活动皮肤通过版本化协议主动暴露的开关、下拉、复选组、滑杆、颜色与可见时段配置项；当前声明使用 v2，manager 仍兼容已发布的完整 v1 声明，包括颜色、复选组、条件显示与旧值映射；
- 通用的“不那么二次元模式”：按本机时间设置多个显示或隐藏时段。
- DSH 0.1.7+ 会自动停用未声明支持当前版本的皮肤；管理页会标出这类皮肤，点「切换」并确认后，通过 DSH 自己的放行接口只放行"这个皮肤版本 + 这个 DSH 版本"，不会自动放行；
- 窄屏（宽度小于 1024px，与 DSH 自身的侧栏折叠断点一致）下，再点一次已打开的「插件」等全局面板入口即可回到原来的对话。
- Windows 桌面端可选开启「桌面快捷方式跟随皮肤」（默认关闭），见下方「桌面图标」。

> 若已安装 `@linxin666/dsh-web-all`（dsh-web），请使用 dsh-web 自带的皮肤中心/安装入口及其 `maid-atelier`、`orca-link` 适配版，不要安装本管理器或执行下面的 standalone 安装命令。两种发行方式不能在同一 profile 中叠装。

与皮肤一起，从 npm 安装稳定版：

```sh
dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-maid-atelier' && dsh plugin --profile web add '@smalltailqwq/dsh-client-ui-skin-orca-link'
```

PowerShell 版本见仓库 README。未指定 dist-tag 时 npm 使用 `latest`。首次安装后重启一次 DSH；首次重启时管理器兜底检测到两套及以上皮肤同时启用会原子回退官方默认，之后在“设置 → 皮肤管理”切换。本地开发时对 skin-manager 与皮肤目录分别以绝对路径 link，不要与 npm 安装混跑（同一包名，后 add 覆盖）。

切换与启动兜底都会同步改写当前 Web profile 与优先级更高的 home patch 中的标准 `dsh-skin managed` 区段；区段外的用户 YAML 保持不变。区段只拥有已发现皮肤与 `ui-skin-*` 的行：DSH 0.1.7+ 把设置（如 `ui-theme`）追加到 patch 末尾而落进区段时，这些非皮肤行在重建时会原样移到区段之前。已有零套或一套皮肤启用时，启动兜底不写文件。自定义配置按 `skinId` 保存在浏览器 `localStorage`，不会修改模型请求或 DSH 服务。

## 皮肤接入

激活管理只要求皮肤包导出有效的 `skin.json`，其中 `package` 必须等于实际包名，且包含 `id`、`bodyAttr` 和 `wiring.id`。需要详细配置的皮肤再从自己的 client 入口调用 `exposeSkinCustomization()`：

```ts
import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
} from '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager/protocol'

const dispose = exposeSkinCustomization({
  protocol: SKIN_CUSTOMIZATION_PROTOCOL,
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

`visibleWhen` 按另一设置的当前值决定是否渲染依赖项；需要「同族开关任一开启即可」时用 `visibleWhen: { key, values, anyOf: [{ key, values }, …] }`，任一条目成立就渲染。`anyOf` 声明**必须**同时保留顶层的 `key`/`values`：只认识单键形式的管理器会直接读这两个字段，缺失时会读到 `undefined` 并在渲染卡片时抛错，而不是降级为常显。`legacyValue` 可在新键尚未写入时把旧键值映射为新默认值，用于无损拆分已有设置。复选组的值按声明中的 option 顺序保存为字符串数组。颜色设置由 manager 自绘带完整边框的色域、色相与 RGB 弹层，不依赖无法被页面样式控制的浏览器原生取色弹窗。

皮肤必须持有并清理自己的 DOM、CSS、observer、listener 与 timer；管理器只处理声明、持久化和时间规则，不了解皮肤内部选择器。`exposeSkinCustomization()` 的返回值应注册到皮肤的 Cordis effect disposer。

## 桌面图标

Windows 桌面端（DSH 0.1.7+）的设置页会多出「桌面图标」卡片，默认关闭。开启后，管理器把目标为当前 `DeepSeek Harness.exe` 的桌面、开始菜单和任务栏固定快捷方式的 `IconLocation` 指向当前皮肤的 ICO；运行中的任务栏按钮经开始菜单快捷方式解析图标，因此会一并刷新。开始菜单有自己的图标缓存，只会重新读取它看到被移除再加回的快捷方式，所以改写后会把开始菜单快捷方式短暂改名再改回；中途中断时，下次扫描会自动恢复。

任务栏缩略图和 Alt+Tab 显示的是窗口自身的图标。插件运行在桌面宿主的 Node 子进程里，调不到 Electron 主进程，所以开关打开且当前是皮肤时，会常驻一个隐藏的 PowerShell 小进程：它通过 `WM_SETICON` 给桌面主进程的顶层窗口设置图标，后来新开的窗口也会补上。以下情况它会还原原图标并退出：关闭开关、切回官方默认、管理器插件被释放。宿主进程异常退出时它会被一起结束，窗口图标可能暂时显示为空，宿主重启后会重新设置。

- 皮肤在 `skin.json` 中用包内相对路径声明 `desktopIcon`（如 `"assets/icons/delighted.ico"`）。没有声明的皮肤和「官方默认」都会还原快捷方式。
- ICO 会先复制到 `<DSH_HOME>/skin-manager/desktop-icons/`，按内容哈希命名，卸载皮肤不会留下指向缺失文件的快捷方式。每个快捷方式改写前的图标记在 `<DSH_HOME>/skin-manager/desktop-icon.json`；还原只作用于仍显示本管理器所写图标的快捷方式，已被他人改过的保持原样。
- 退出 DSH 不会还原，桌面图标会保留皮肤外观。DSH 更新重装快捷方式后，下次启动会自动再次套用。要彻底还原，请先在此关闭开关，再卸载管理器。
- 所有用户共享的快捷方式（`C:\ProgramData\...`、公共桌面）需要管理员权限，改写失败时会在卡片中提示，不影响其他快捷方式。
- 快捷方式通过系统自带的 Windows PowerShell 5.1（`WScript.Shell` 与 `SHChangeNotify`）读写；开关关闭且没有待还原记录时，启动不会调用 PowerShell。
