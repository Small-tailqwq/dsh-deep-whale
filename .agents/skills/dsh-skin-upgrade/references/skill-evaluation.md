# DSH 皮肤升级技能评测

本参考只在用户明确要求回归评测或比较 `dsh-skin-upgrade` 技能效果时使用；纯措辞、链接或配置维护不触发配对评测。日常皮肤升级不运行
benchmark；真实浏览器、宿主或性能评测仍遵守仓库授权边界。

## 评测单位

每个 case 来自一次已确认的真实皮肤升级事故，并至少固定：

- base/target DSH 完整 SHA、皮肤基线 SHA 与支持范围；
- 最小但保真的输入仓库或 fixture，以及来源和文件 hash；
- 用户请求，不泄露预期补丁、可疑文件或结论；
- 可独立执行的 verifier、计分项和通过门槛；
- oracle 或目标契约，只供 verifier/维护者使用，不进入被测 agent 上下文。

优先积累能稳定自动判定的皮肤专科陷阱：新增 wrapper 导致直属 selector 失配、portal/stacking
所有权、部分 apply 失败与重复激活清理、stale served bundle、提交型 `lib`/fingerprint 漂移、
CSS Module 或本地化 ARIA 误绑。视觉美感、IME、拖拽和真实性能不得伪装成纯 DOM 单测；没有
稳定自动 oracle 时保留为获准后的人机验收项。

## 配对协议

1. 同一模型、推理档位、输入 fixture、工具权限和 verifier 下，分别运行 `with-skill` 与
   `no-target-skill`；至少固定 skill commit，不能用运行期间变化的工作树。
2. 验证 skill 真正被读取。目录存在、出现在 catalog 或提示词里都不算激活；记录对目标
   `SKILL.md` 和相关 reference 的内容读取证据。
3. verifier 从外部世界复核结果：重新构建、读取文件、执行 fixture 或检查打包产物，不能只匹配
   agent 自述。额外改动、删除测试或绕过宿主 owner 应降低得分或直接失败。
4. 分开报告 agent 完成、verifier 得分、超时/基础设施失败与未授权验证。无得分任务不能根据候选
   产物估分，也不能从单次成功推出稳定提升。
5. 报告逐 case 结果和总体分布，同时保留 skill 使个别任务退步的证据；根据失败根因做窄修订，
   不把每个题目的答案继续堆进正文。

## 成熟度阶梯

1. **契约可加载**：frontmatter、名称、按需 reference 和 UI prompt 无漂移；由
   `pnpm skills:validate` 机械检查。
2. **过程可执行**：Host Delta Card、索引、查询、source verify 与皮肤构建/产物门禁可重复运行。
3. **事故可判分**：真实事故被压成隔离 fixture，至少覆盖一个皮肤专科失败面。
4. **效果可比较**：有固定 commit 的配对运行、激活审计和逐题报告。
5. **跨版本走廊**：多个连续 exact-SHA edge 与不同皮肤 case 能证明泛化，而不是只记住单一补丁。

达到较高层级不替代当前任务的证据矩阵。benchmark 衡量技能在固定分布上的帮助，不能自动证明
一款新皮肤在新宿主上兼容。
