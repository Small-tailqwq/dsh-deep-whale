# 皮肤静态图片

两套皮肤的 PNG/WebP 放在各自的 `assets/runtime/`，文件名为完整 SHA-256 加扩展名。图片保持原始字节，运行时不依赖外部 CDN。SVG 图标仍使用代码内的小型矢量图形。

浏览器通过相对于宿主 `<base>` 的 `skin-assets/<skin-id>/<hash>.<ext>` 请求图片。node 半边借助 `webServer` 的可释放路由提供清单内资源；只允许 GET/HEAD，使用正确的图片 Content-Type、ETag 和一年 immutable 缓存。文件均为公开的许可美术资源，不包含用户数据。关闭皮肤时路由随注入上下文释放，不清除浏览器公共缓存。

桌面宿主将 `dsh-app://app/skin-assets/...` 转发给本地 Host。反向代理部署沿用宿主的子路径规则；资源地址不硬编码端口或根路径。复制升级包时必须同时保留 node 半边 `lib/index.js`、客户端、`assets/runtime/` 和构建指纹，不能仅覆盖 `client.js`。

## 修改素材

1. 将最终图片原字节写入 `assets/runtime/<sha256>.png` 或 `.webp`，保留对应许可和署名。
2. 在相应 `src/client/*art*.ts` 中通过 `skinAssetUrl('<sha256>.<ext>')` 引用它。不要重新嵌入 base64。女仆图标生成器 `scripts/build-maid-icons.py` 已采用此方式。
3. 在皮肤目录运行 `npm run build`：先从源码生成并校验 `manifest.json`，再构建两端 JS，最后生成包含图片字节的 `skin.build.json`。缺图或内容与文件名哈希不符会失败。
4. 将源码、图片、清单、`lib/` 和构建指纹一起纳入更新。替换图片后可移除已无任何引用的旧文件；构建不会自动删除资产。

skin-manager 使用同一图片指纹逻辑，需与新版皮肤一起更新。没有静态图片清单的旧皮肤仍保持原来的指纹算法。首次迁移后，已缓存旧 node 半边的宿主进程需要重启，再刷新页面；仅刷新不能保证新的图片路由已经注册。

## 验证范围

现有 apply 测试验证 DOM 声明与释放；ORCA 的 `tests/static-assets.spec.ts` 同时验证两套皮肤的资源请求、原字节、缓存、方法限制、非法路径、路由释放和资源完整性。测试中的 HTTP 服务只监听本机临时端口。

资源拆分降低 JS、source map 和 Elements 中的大字符串负担，不改变图片解码后的像素尺寸，也不等于保证消除所有 F12 卡顿。全屏合成、滤镜、动画和 DevTools 停靠导致的布局变化需要独立的运行证据。
