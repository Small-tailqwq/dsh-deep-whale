# 安全政策 · Security Policy

## 支持范围 · Supported Versions

本仓库分发预构建皮肤包（`maid-atelier/lib`、`orca-link/lib`）。安全修复只保证合入最新的 `main` 分支；请优先使用最新提交对应的构建产物。

| 版本 | 支持状态 |
|---|---|
| `main` 分支最新提交 | ✅ 支持 |
| 旧提交 / 历史版本 | ❌ 不再支持 |

## 报告漏洞 · Reporting a Vulnerability

皮肤是**纯展示层**（presentation-only）客户端插件：不注入服务、不发 Cordis 事件、不触达模型请求、不访问本地存储、素材全部内联（无远程资源依赖）。

如发现安全问题，请**不要公开提交 issue**，按以下渠道私密上报：

1. **首选**：GitHub 私有安全通告 —— 仓库页面 → Security → *Report a vulnerability*（或直接访问 <https://github.com/Small-tailqwq/dsh-deep-whale/security/advisories/new>），填写漏洞描述、影响范围与复现步骤。
2. **备选**：在公开 issue 中**不要**贴出漏洞细节；可只发一条不含细节的占位说明（例如 "[安全] 发现隐私/供应链问题，已走私密上报"），待修复合入后再公开细节。

## 响应预期 · What to Expect

- 维护者会在 **7 个自然日内** 确认收到报告并评估影响。
- 高危问题（隐私泄露、供应链投毒、任意代码执行）优先处理，修复合入后公开披露（标准 90 天披露窗口，可协商）。
- 低危 / 中危问题（依赖漂移、CI 加固等）按正常维护节奏处理。

## 已落地的加固 · Hardening in place

- 素材全部以 base64 data URI 内联进 bundle，激活不依赖远程资源。
- 构建期「纯度门禁」拒绝跨插件 value import（`build/tsdown.client.ts`）。
- CI 工作流按提交 SHA 固定第三方 Action，并最小化 `permissions`。
- 本仓库启用 Dependabot 跟踪依赖更新。
