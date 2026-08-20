# Agent Note: 皮肤热加载与重启前 profile 一致性闸门

Status: implemented

## 背景

运行中的 DSH Web 会继续使用内存中的旧插件图。若 profile 后续出现 dependency key、bundle 名与 link 目标 `package.json.name` 不一致，页面仍可能暂时可用；盲目重启才会暴露错误并导致服务无法启动。递归搜索缓存和触碰未变化配置既不能证明冷启动安全，也会让排查表现为卡死。

## 结论

- 已安装 link 的源码/bundle 更新优先热加载，不重启。
- 重启前核对 manifest、profile dependency、bundle 和 link 目标的包身份，随后执行 `plugin list`、`--dump-config`。
- 必须冷启动时先用 `--port 0 --no-open` 启动并终止独立探针；探针失败时保留原服务。
- 指定提交使用临时 detached worktree，禁止 `git restore --source` 覆盖用户的活动工作区。
- 排查限定为 link、bundle 哈希、boot entry 和组合配置，不递归扫描整个 DSH home/global node_modules。

## 验证

本规则已写入 `dsh-skin-install` 场景路由、重启闸门与开发版本验证流程。

## 关联

- 2026-08-20 orca-link PR #58 本地验证事故：错误 scope 的 profile 被旧进程掩盖，重启后无法导入插件。
- `2026-08-20-plugin-add-path-resolution.md`。
