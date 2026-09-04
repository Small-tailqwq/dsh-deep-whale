window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-client-ui-skin-deep-whale-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/contract.ts
		/** Same-origin host route used for catalog discovery and activation. */
		const SKIN_MANAGER_ROUTE = "/api/dsh/skins";
		//#endregion
		//#region src/client/locale.ts
		/**
		* Host-language following for the manager surface. Same heuristic as the
		* orca-link pricing light: `document.documentElement.lang` first (the host
		* repoints it on every locale switch), `navigator.language` as fallback,
		* and any `zh*` tag counts as Chinese. A single shared `lang` observer keeps
		* every subscribed component one mutation away from a re-render, and the
		* observer is dropped as soon as the last subscriber unmounts.
		*/
		function detectUiLang() {
			return (document.documentElement.lang || window.navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
		}
		const listeners = /* @__PURE__ */ new Set();
		let observer = null;
		let lastNotified;
		function refresh() {
			const next = detectUiLang();
			if (next === lastNotified) return;
			lastNotified = next;
			for (const listener of listeners) listener();
		}
		/**
		* getSnapshot for useSyncExternalStore. The value is a string primitive read
		* live from the document, so successive calls are `Object.is`-stable for as
		* long as the host locale has not actually changed.
		*/
		function uiLangSnapshot() {
			return detectUiLang();
		}
		/** Settings-section markup renders through getServerSnapshot; node-side calls have no DOM. */
		function serverUiLang() {
			try {
				return detectUiLang();
			} catch {
				return "zh";
			}
		}
		function subscribeUiLang(listener) {
			listeners.add(listener);
			if (observer === null) {
				lastNotified = detectUiLang();
				observer = new MutationObserver(refresh);
				observer.observe(document.documentElement, {
					attributes: true,
					attributeFilter: ["lang"]
				});
			}
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0 && observer !== null) {
					observer.disconnect();
					observer = null;
				}
			};
		}
		function useUiLang() {
			return (0, react.useSyncExternalStore)(subscribeUiLang, uiLangSnapshot, serverUiLang);
		}
		const zhCopy = {
			headerTitle: "皮肤管理",
			headerIntro: "这里会发现当前 Web profile 中已安装的皮肤。激活由管理器统一处理；详细配置由皮肤按通用协议自行声明并负责应用。每个皮肤下方显示本地提交或构建指纹；「检查更新」只比较官方仓库的构建结果，不会改动你的本地文件。",
			installedTitle: "已安装皮肤",
			checking: "检查中…",
			checkUpdates: "检查更新",
			officialName: "官方默认",
			officialDescription: "不启用任何皮肤",
			stateCurrent: "当前",
			stateSwitching: "切换中",
			stateSwitch: "切换",
			compatibility: (version) => `已适配 DSH ${version}`,
			versionUnread: "尚未读取",
			versionUnavailable: "版本信息不可用",
			localCommit: "本地提交",
			localBuild: "本地构建",
			gitHashTitle: (hash, date) => `完整提交 ${hash}\n日期 ${date ?? "未知"}`,
			buildHashTitle: (hash) => `完整构建指纹 ${hash}`,
			notCompared: "未对比",
			upToDate: (short) => `与远端一致（${short}）`,
			updateAvailable: (short, date, message) => `仓库有新构建：${short} · ${date} · ${message}`,
			localAhead: (short) => `本地领先（远端 ${short}）`,
			diverged: (short) => `与远端分叉（远端 ${short}）`,
			unknownUpdate: "无法判断更新",
			localDirty: "本地有未提交修改",
			noSkins: "当前 profile 未发现皮肤包；安装本仓库皮肤后可回到这里激活。",
			copiedOk: "完整版本标识已复制到剪贴板。",
			copyFailed: "复制失败：浏览器拒绝了剪贴板访问。",
			loadingSkins: "正在读取已安装皮肤…",
			actionFailed: (message) => `操作失败：${message}`,
			settingsTitle: "详细配置",
			noSettings: "当前皮肤尚未暴露可配置项；仍可在上方正常激活和切换。",
			schedulePolicy: "规则方式",
			policyHideInRanges: "这些时段隐藏，其余时间显示",
			policyShowInRanges: "这些时段显示，其余时间隐藏",
			rangeStartAria: (index) => `时段 ${index} 开始`,
			rangeEndAria: (index) => `时段 ${index} 结束`,
			hourAria: (label) => `${label} 时`,
			minuteAria: (label) => `${label} 分`,
			rangeTo: "至",
			removeRange: "删除",
			addRange: "添加时间段",
			scheduleHint: "使用本机时间；支持跨午夜，例如 22:00 至 07:00。时间段按“开始包含、结束不包含”计算。"
		};
		const enCopy = {
			headerTitle: "Skin Management",
			headerIntro: "This page discovers the skins installed in the current Web profile. Activation is handled by the manager; detailed options are declared and applied by each skin over a shared protocol. Every skin lists its local commit or build fingerprint below. \"Check updates\" only compares against the official repository's build results and never touches your local files.",
			installedTitle: "Installed Skins",
			checking: "Checking…",
			checkUpdates: "Check updates",
			officialName: "Official Default",
			officialDescription: "No skin applied",
			stateCurrent: "Current",
			stateSwitching: "Switching",
			stateSwitch: "Switch",
			compatibility: (version) => `Verified on DSH ${version}`,
			versionUnread: "Not read yet",
			versionUnavailable: "Version info unavailable",
			localCommit: "Local commit",
			localBuild: "Local build",
			gitHashTitle: (hash, date) => `Full commit ${hash}\nDate ${date ?? "unknown"}`,
			buildHashTitle: (hash) => `Full build fingerprint ${hash}`,
			notCompared: "Not compared",
			upToDate: (short) => `Up to date (${short})`,
			updateAvailable: (short, date, message) => `New build available: ${short} · ${date} · ${message}`,
			localAhead: (short) => `Local ahead (remote ${short})`,
			diverged: (short) => `Diverged (remote ${short})`,
			unknownUpdate: "Cannot determine updates",
			localDirty: "Local changes present",
			noSkins: "No skin packages found in this profile; install one of this repository's skins and return here to activate it.",
			copiedOk: "Full version identifier copied to the clipboard.",
			copyFailed: "Copy failed: the browser denied clipboard access.",
			loadingSkins: "Reading installed skins…",
			actionFailed: (message) => `Operation failed: ${message}`,
			settingsTitle: "Detailed Options",
			noSettings: "The active skin exposes no configurable options yet; activation and switching above still work normally.",
			schedulePolicy: "Rule mode",
			policyHideInRanges: "Hide during these periods, show otherwise",
			policyShowInRanges: "Show during these periods, hide otherwise",
			rangeStartAria: (index) => `Period ${index} start`,
			rangeEndAria: (index) => `Period ${index} end`,
			hourAria: (label) => `${label} hour`,
			minuteAria: (label) => `${label} minute`,
			rangeTo: "to",
			removeRange: "Remove",
			addRange: "Add period",
			scheduleHint: "Uses local time; crossing midnight is supported, e.g. 22:00 to 07:00. Periods are start-inclusive and end-exclusive."
		};
		function skinManagerCopy(lang) {
			return lang === "zh" ? zhCopy : enCopy;
		}
		function definitionTitle(definition, lang) {
			return lang === "en" ? definition.titleEn ?? definition.title : definition.title;
		}
		function settingLabel(setting, lang) {
			return lang === "en" ? setting.labelEn ?? setting.label : setting.label;
		}
		function settingDescription(setting, lang) {
			if (setting.description === void 0) return void 0;
			return lang === "en" ? setting.descriptionEn ?? setting.description : setting.description;
		}
		function optionLabel(option, lang) {
			return lang === "en" ? option.labelEn ?? option.label : option.label;
		}
		//#endregion
		//#region \0dsh-css:../skin-manager/src/client/skin-manager.module.css.mjs
		const css = ".orL4ja_section{color:var(--dsw-alias-label-primary);gap:14px;display:grid}.orL4ja_header h2,.orL4ja_card h3,.orL4ja_header p,.orL4ja_error{margin:0}.orL4ja_header{gap:6px;display:grid}.orL4ja_header p{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.6}.orL4ja_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:10px;gap:10px;padding:14px;display:grid}.orL4ja_card h3{font-size:14px}.orL4ja_cardHeader{justify-content:space-between;align-items:center;gap:10px;display:flex}.orL4ja_checkButton{min-height:28px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:6px;padding:4px 12px;font-size:12px}.orL4ja_checkButton:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}.orL4ja_checkButton:disabled{opacity:.55;cursor:default}.orL4ja_skinTile{align-self:start;gap:4px;min-width:0;display:grid}.orL4ja_skinGrid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));align-items:start;gap:8px;display:grid}.orL4ja_skinButton{width:100%}.orL4ja_defaultButton,.orL4ja_defaultActive{width:100%;min-height:44px;color:var(--dsw-alias-label-primary);border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:8px;justify-content:space-between;align-items:center;gap:12px;padding:8px 12px;display:flex}.orL4ja_defaultButton>span,.orL4ja_defaultActive>span{text-align:left;gap:2px;display:grid}.orL4ja_defaultButton small,.orL4ja_defaultActive small{color:var(--dsw-alias-label-tertiary)}.orL4ja_defaultButton:disabled,.orL4ja_defaultActive:disabled{opacity:.75;cursor:default}.orL4ja_defaultActive{border-style:solid;border-color:var(--dsw-alias-brand-primary);box-shadow:inset 3px 0 var(--dsw-alias-brand-primary)}.orL4ja_defaultState{flex:none;color:var(--dsw-alias-label-secondary)!important}.orL4ja_skinButton,.orL4ja_activeSkin{min-height:58px;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:8px;justify-items:start;gap:3px;padding:10px;display:grid}.orL4ja_activeSkin{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 3px 0 var(--dsw-alias-brand-primary)}.orL4ja_skinButton small,.orL4ja_activeSkin small{color:var(--dsw-alias-label-tertiary)}.orL4ja_versionRow{flex-wrap:wrap;align-items:center;gap:3px 8px;min-height:16px;padding-inline:2px;font-size:11px;line-height:1.5;display:flex}.orL4ja_compatibility{color:var(--dsw-alias-label-tertiary);padding-inline:2px;font-size:11px}.orL4ja_versionHash{appearance:none;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);font-size:inherit;line-height:inherit;cursor:pointer;white-space:nowrap;background:0 0;border:0;padding:0}.orL4ja_versionHash:hover{color:var(--dsw-alias-brand-primary)}.orL4ja_versionMuted{color:var(--dsw-alias-label-tertiary)}.orL4ja_versionOk{color:var(--dsw-alias-state-success-primary,#12a150)}.orL4ja_versionUpdate{color:var(--dsw-alias-state-warn-primary,#e08700)}.orL4ja_toggleRow,.orL4ja_selectRow,.orL4ja_sliderRow,.orL4ja_colorRow{justify-content:space-between;align-items:center;gap:12px;min-height:34px;display:flex}.orL4ja_toggleRow>span,.orL4ja_selectRow>span,.orL4ja_sliderRow>span,.orL4ja_colorRow>span{gap:2px;display:grid}.orL4ja_toggleRow small,.orL4ja_selectRow small,.orL4ja_sliderRow small,.orL4ja_colorRow small,.orL4ja_checkboxGroup small,.orL4ja_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}.orL4ja_toggleRow input{block-size:18px;inline-size:34px;accent-color:var(--dsw-alias-brand-primary)}.orL4ja_toggleSwitch{cursor:pointer;border-radius:999px;flex:none;justify-content:center;align-items:center;margin:-4px;padding:4px;display:inline-flex}.orL4ja_toggleSwitch input,.orL4ja_selectRow select,.orL4ja_rangeRow select{cursor:pointer}.orL4ja_selectRow select,.orL4ja_rangeRow input,.orL4ja_rangeRow select{box-sizing:border-box;min-height:30px;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);border-radius:6px}.orL4ja_selectRow select{max-width:240px;padding-inline:8px}.orL4ja_selectRow select:disabled,.orL4ja_sliderRow input:disabled,.orL4ja_colorRow input:disabled,.orL4ja_toggleRow input:disabled{opacity:.45;cursor:not-allowed}.orL4ja_colorControl{flex:none;grid-auto-flow:column;align-items:center;gap:8px!important;display:flex!important}.orL4ja_colorControl code{min-width:7ch;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,monospace;font-size:12px}.orL4ja_colorControl input[type=color]{appearance:none;box-sizing:border-box;cursor:pointer;background:0 0;border:0;border-radius:0;width:38px;height:24px;padding:0}.orL4ja_colorWell{border:1px solid var(--dsw-alias-brand-primary);background:var(--dsw-specific-input-major);border-radius:2px;padding:3px;display:inline-flex;box-shadow:inset 1px 1px #ffffffb3,inset -1px -1px #0000003d,2px 2px #5127ff47}.orL4ja_colorWell:focus-within{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}.orL4ja_colorControl input[type=color]::-webkit-color-swatch-wrapper{padding:2px}.orL4ja_colorControl input[type=color]::-webkit-color-swatch{border:1px solid #0000006b;border-radius:0}.orL4ja_colorControl input[type=color]::-moz-color-swatch{border:1px solid #0000006b;border-radius:0}.orL4ja_checkboxGroup{border-left:2px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);gap:8px;margin-left:12px;padding:10px 12px 12px;display:grid}.orL4ja_checkboxGroupHeading{gap:2px;display:grid}.orL4ja_checkboxGrid{grid-template-columns:repeat(auto-fit,minmax(72px,1fr));gap:6px 12px;display:grid}.orL4ja_checkboxOption{cursor:pointer;align-items:center;gap:6px;min-height:24px;display:inline-flex}.orL4ja_checkboxOption input{block-size:16px;inline-size:16px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;margin:0}.orL4ja_checkboxOption input:disabled{opacity:.45;cursor:not-allowed}.orL4ja_sliderRow{grid-template-columns:minmax(0,1fr) auto minmax(120px,220px);align-items:center;gap:10px;min-height:40px;display:grid}.orL4ja_sliderValue{min-width:3ch;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}.orL4ja_sliderRow input[type=range]{-webkit-appearance:none;appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);cursor:pointer;width:100%;height:20px;image-rendering:pixelated;border-radius:0;margin:0;padding:0}.orL4ja_sliderRow input[type=range]::-webkit-slider-runnable-track{border:1px solid var(--dsw-alias-brand-primary);background:linear-gradient(#bdf6ff,#52bce2 55%,#3716b1);border-radius:0;height:8px}.orL4ja_sliderRow input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;border:2px solid var(--dsw-alias-brand-primary);background:#ff70c8;border-radius:0;width:14px;height:22px;margin-top:-8px;box-shadow:2px 2px #5127ff59}.orL4ja_sliderRow input[type=range]::-moz-range-track{border:1px solid var(--dsw-alias-brand-primary);background:linear-gradient(#bdf6ff,#52bce2 55%,#3716b1);border-radius:0;height:8px}.orL4ja_sliderRow input[type=range]::-moz-range-thumb{border:2px solid var(--dsw-alias-brand-primary);background:#ff70c8;border-radius:0;width:10px;height:18px;box-shadow:2px 2px #5127ff59}.orL4ja_timeSelect{align-items:center;gap:4px;width:100%;min-width:0;display:inline-flex}.orL4ja_timeSelect select{text-align:center;width:100%;min-width:0;max-width:none;padding-inline:6px}.orL4ja_timeColon{color:var(--dsw-alias-label-tertiary);flex:none}.orL4ja_schedule{gap:8px;display:grid}.orL4ja_scheduleDetails{border-left:2px solid var(--dsw-alias-border-l2);gap:8px;margin-left:12px;padding:10px;display:grid}.orL4ja_rangeList{gap:6px;display:grid}.orL4ja_rangeRow{color:var(--dsw-alias-label-secondary);grid-template-columns:minmax(100px,1fr) auto minmax(100px,1fr) auto;align-items:center;gap:8px;font-size:12px;display:grid}.orL4ja_rangeRow input{width:100%;padding-inline:7px}.orL4ja_rangeRow button,.orL4ja_addRange{min-height:30px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:6px;padding:4px 9px}.orL4ja_addRange{justify-self:start}.orL4ja_error{color:var(--dsw-alias-state-danger,#c43d3d);font-size:12px}@media (width<=720px){.orL4ja_skinGrid{grid-template-columns:1fr}.orL4ja_rangeRow{grid-template-columns:1fr auto 1fr}.orL4ja_rangeRow button{grid-column:1/-1;justify-self:end}}";
		const tagId = "@dsh-external/dsh-client-ui-skin-deep-whale-manager/skin-manager.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-client-ui-skin-deep-whale-manager";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var skin_manager_module_css_default = {
			"activeSkin": "orL4ja_activeSkin",
			"addRange": "orL4ja_addRange",
			"card": "orL4ja_card",
			"cardHeader": "orL4ja_cardHeader",
			"checkButton": "orL4ja_checkButton",
			"checkboxGrid": "orL4ja_checkboxGrid",
			"checkboxGroup": "orL4ja_checkboxGroup",
			"checkboxGroupHeading": "orL4ja_checkboxGroupHeading",
			"checkboxOption": "orL4ja_checkboxOption",
			"colorControl": "orL4ja_colorControl",
			"colorRow": "orL4ja_colorRow",
			"colorWell": "orL4ja_colorWell",
			"compatibility": "orL4ja_compatibility",
			"defaultActive": "orL4ja_defaultActive",
			"defaultButton": "orL4ja_defaultButton",
			"defaultState": "orL4ja_defaultState",
			"error": "orL4ja_error",
			"header": "orL4ja_header",
			"hint": "orL4ja_hint",
			"rangeList": "orL4ja_rangeList",
			"rangeRow": "orL4ja_rangeRow",
			"schedule": "orL4ja_schedule",
			"scheduleDetails": "orL4ja_scheduleDetails",
			"section": "orL4ja_section",
			"selectRow": "orL4ja_selectRow",
			"skinButton": "orL4ja_skinButton",
			"skinGrid": "orL4ja_skinGrid",
			"skinTile": "orL4ja_skinTile",
			"sliderRow": "orL4ja_sliderRow",
			"sliderValue": "orL4ja_sliderValue",
			"timeColon": "orL4ja_timeColon",
			"timeSelect": "orL4ja_timeSelect",
			"toggleRow": "orL4ja_toggleRow",
			"toggleSwitch": "orL4ja_toggleSwitch",
			"versionHash": "orL4ja_versionHash",
			"versionMuted": "orL4ja_versionMuted",
			"versionOk": "orL4ja_versionOk",
			"versionRow": "orL4ja_versionRow",
			"versionUpdate": "orL4ja_versionUpdate"
		};
		//#endregion
		//#region src/client/SkinManager.tsx
		const shortDate = (iso) => iso === null ? "" : iso.slice(0, 10);
		const shortMessage = (message) => message.length > 42 ? `${message.slice(0, 42)}…` : message;
		function VersionRow({ info, onCopied }) {
			const copy = skinManagerCopy(useUiLang());
			const segment = (text, className) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: className ?? skin_manager_module_css_default.versionMuted,
				children: text
			});
			if (info.source === "none" || info.local === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: skin_manager_module_css_default.versionRow,
				children: segment(info.note ?? copy.versionUnavailable)
			});
			const copyHash = async () => {
				try {
					await navigator.clipboard?.writeText(info.local.hash);
					onCopied(true);
				} catch {
					onCopied(false);
				}
			};
			const remoteLatest = info.remote?.latest;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.versionRow,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: skin_manager_module_css_default.versionHash,
						title: info.source === "git" ? copy.gitHashTitle(info.local.hash, info.local.date) : copy.buildHashTitle(info.local.hash),
						onClick: () => void copyHash(),
						children: [
							info.source === "git" ? copy.localCommit : copy.localBuild,
							" ",
							info.local.short
						]
					}),
					info.remote === null && segment(info.note ?? copy.notCompared),
					info.remote !== null && info.remote.state === "up-to-date" && remoteLatest !== null && segment(copy.upToDate(remoteLatest.short), skin_manager_module_css_default.versionOk),
					info.remote !== null && info.remote.state === "update-available" && remoteLatest !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_manager_module_css_default.versionUpdate,
						children: copy.updateAvailable(remoteLatest.short, shortDate(remoteLatest.date), shortMessage(remoteLatest.message ?? ""))
					}) }),
					info.remote !== null && info.remote.state === "local-ahead" && remoteLatest !== null && segment(copy.localAhead(remoteLatest.short)),
					info.remote !== null && info.remote.state === "diverged" && remoteLatest !== null && segment(copy.diverged(remoteLatest.short)),
					info.remote !== null && info.remote.state === "unknown" && segment(copy.unknownUpdate),
					info.dirty && segment(copy.localDirty),
					info.note !== void 0 && segment(info.note)
				]
			});
		}
		function Toggle({ checked, label, description, disabled = false, onChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.toggleRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: description })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: skin_manager_module_css_default.toggleSwitch,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						role: "switch",
						checked,
						disabled,
						onChange: (event) => onChange(event.currentTarget.checked)
					})
				})]
			});
		}
		const padTime = (part) => String(part).padStart(2, "0");
		/**
		* Hour/minute pair picker. A native `input[type=time]` opens the
		* operating system's popup, which no stylesheet can reach; two hour/minute
		* selects keep the same "HH:MM" value contract while letting every skin
		* (and the generic --dsw-* theme) dress both the closed control and the open
		* list — the same customizable-select surface as the other setting rows.
		*/
		function TimeSelect({ label, value, onChange }) {
			const copy = skinManagerCopy(useUiLang());
			const [hour = "00", minute = "00"] = value.split(":");
			const setHour = (hour) => onChange(`${hour}:${minute}`);
			const setMinute = (minute) => onChange(`${hour}:${minute}`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: skin_manager_module_css_default.timeSelect,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
						"aria-label": copy.hourAria(label),
						value: hour,
						onChange: (event) => setHour(event.currentTarget.value),
						children: Array.from({ length: 24 }, (_, hour) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: padTime(hour),
							children: padTime(hour)
						}, hour))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_manager_module_css_default.timeColon,
						"aria-hidden": "true",
						children: ":"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
						"aria-label": copy.minuteAria(label),
						value: minute,
						onChange: (event) => setMinute(event.currentTarget.value),
						children: Array.from({ length: 60 }, (_, minute) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: padTime(minute),
							children: padTime(minute)
						}, minute))
					})
				]
			});
		}
		function ScheduleEditor({ setting, value, onChange }) {
			const lang = useUiLang();
			const copy = skinManagerCopy(lang);
			const updateRange = (index, patch) => onChange({
				...value,
				ranges: value.ranges.map((range, current) => current === index ? {
					...range,
					...patch
				} : range)
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.schedule,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
					checked: value.enabled,
					label: settingLabel(setting, lang),
					description: settingDescription(setting, lang),
					onChange: (enabled) => onChange({
						...value,
						enabled
					})
				}), value.enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.scheduleDetails,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: skin_manager_module_css_default.selectRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.schedulePolicy }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								value: value.outside,
								onChange: (event) => onChange({
									...value,
									outside: event.currentTarget.value
								}),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "visible",
									children: copy.policyHideInRanges
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "hidden",
									children: copy.policyShowInRanges
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.rangeList,
							children: value.ranges.map((range, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_manager_module_css_default.rangeRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimeSelect, {
										label: copy.rangeStartAria(index + 1),
										value: range.start,
										onChange: (start) => updateRange(index, { start })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.rangeTo }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TimeSelect, {
										label: copy.rangeEndAria(index + 1),
										value: range.end,
										onChange: (end) => updateRange(index, { end })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => onChange({
											...value,
											ranges: value.ranges.filter((_, current) => current !== index)
										}),
										children: copy.removeRange
									})
								]
							}, index))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: skin_manager_module_css_default.addRange,
							disabled: value.ranges.length >= 24,
							onClick: () => onChange({
								...value,
								ranges: [...value.ranges, {
									start: "09:00",
									end: "12:00"
								}]
							}),
							children: copy.addRange
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
							className: skin_manager_module_css_default.hint,
							children: copy.scheduleHint
						})
					]
				})]
			});
		}
		function RangeEditor({ setting, label, description, value, disabled = false, onChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: skin_manager_module_css_default.sliderRow,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: description })] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: skin_manager_module_css_default.sliderValue,
						children: [value, setting.unit ?? ""]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min: setting.min,
						max: setting.max,
						step: setting.step ?? 1,
						value,
						disabled,
						"aria-label": label,
						onChange: (event) => onChange(Number(event.currentTarget.value))
					})
				]
			});
		}
		function CheckboxGroupEditor({ setting, label, description, value, disabled = false, onChange }) {
			const lang = useUiLang();
			const selected = new Set(value);
			const update = (option, checked) => {
				if (checked) selected.add(option);
				else selected.delete(option);
				onChange(setting.options.map((item) => item.value).filter((item) => selected.has(item)));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.checkboxGroup,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: skin_manager_module_css_default.checkboxGroupHeading,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: description })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: skin_manager_module_css_default.checkboxGrid,
					role: "group",
					"aria-label": label,
					children: setting.options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: skin_manager_module_css_default.checkboxOption,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: selected.has(option.value),
							disabled,
							onChange: (event) => update(option.value, event.currentTarget.checked)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: optionLabel(option, lang) })]
					}, option.value))
				})]
			});
		}
		function SettingEditor({ setting, value, disabled = false, onChange }) {
			const lang = useUiLang();
			const label = settingLabel(setting, lang);
			const description = settingDescription(setting, lang);
			if (setting.type === "boolean") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
				checked: value,
				label,
				description,
				disabled,
				onChange
			});
			if (setting.type === "select") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: skin_manager_module_css_default.selectRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: description })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
					value,
					disabled,
					onChange: (event) => onChange(event.currentTarget.value),
					children: setting.options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: option.value,
						children: optionLabel(option, lang)
					}, option.value))
				})]
			});
			if (setting.type === "range") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeEditor, {
				setting,
				label,
				description,
				value,
				disabled,
				onChange
			});
			if (setting.type === "color") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: skin_manager_module_css_default.colorRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: description })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: skin_manager_module_css_default.colorControl,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: String(value).toUpperCase() }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_manager_module_css_default.colorWell,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "color",
							value,
							disabled,
							"aria-label": label,
							onChange: (event) => onChange(event.currentTarget.value)
						})
					})]
				})]
			});
			if (setting.type === "checkbox-group") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CheckboxGroupEditor, {
				setting,
				label,
				description,
				value,
				disabled,
				onChange
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScheduleEditor, {
				setting,
				value,
				onChange
			});
		}
		function settingVisible(setting, values) {
			const condition = setting.visibleWhen;
			if (condition === void 0) return true;
			const value = values[condition.key];
			return condition.values.some((candidate) => candidate === value);
		}
		function CustomizationCard({ definition, registry }) {
			const lang = useUiLang();
			const values = registry.values(definition);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skin_manager_module_css_default.card,
				"data-skin-customization": definition.skinId,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: definitionTitle(definition, lang) }), definition.settings.map((setting) => {
					if (!settingVisible(setting, values)) return null;
					const disabled = setting.disabledWhen !== void 0 && values[setting.disabledWhen] === true;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingEditor, {
						setting,
						value: values[setting.key],
						disabled,
						onChange: (value) => registry.set(definition, setting.key, value)
					}, setting.key);
				})]
			});
		}
		/** Generic settings surface: host-discovered activation plus skin-owned declarations. */
		function SkinManager({ registry, active, switchSkin }) {
			const { definitions } = (0, react.useSyncExternalStore)(registry.subscribe, registry.getSnapshot);
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [versions, setVersions] = (0, react.useState)(/* @__PURE__ */ new Map());
			const [loading, setLoading] = (0, react.useState)(true);
			const [checking, setChecking] = (0, react.useState)(false);
			const [switching, setSwitching] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			const copyTimer = (0, react.useRef)(void 0);
			const lang = useUiLang();
			const copy = skinManagerCopy(lang);
			const current = active(catalog);
			const currentDefinitions = definitions.filter((definition) => definition.skinId === current);
			(0, react.useEffect)(() => {
				live.current = true;
				setLoading(true);
				fetchSkinCatalog().then((skins) => {
					if (!live.current) return;
					setCatalog(skins);
				}).catch((reason) => {
					if (live.current) setError(reason instanceof Error ? reason.message : String(reason));
				}).finally(() => {
					if (live.current) setLoading(false);
				});
				fetchSkinLocalVersions().then((info) => {
					if (live.current) setVersions(info);
				}).catch(() => {});
				return () => {
					live.current = false;
					if (copyTimer.current !== void 0) window.clearTimeout(copyTimer.current);
				};
			}, []);
			const choose = (target) => {
				setSwitching(target);
				setError(null);
				switchSkin(target).catch((reason) => {
					setSwitching(null);
					setError(reason instanceof Error ? reason.message : String(reason));
				});
			};
			const checkVersions = () => {
				setChecking(true);
				setError(null);
				fetchSkinVersions().then((info) => {
					if (live.current) setVersions(info);
				}).catch((reason) => {
					if (live.current) setError(reason instanceof Error ? reason.message : String(reason));
				}).finally(() => {
					if (live.current) setChecking(false);
				});
			};
			const announceCopied = (ok) => {
				setCopied(ok ? "ok" : "fail");
				if (copyTimer.current !== void 0) window.clearTimeout(copyTimer.current);
				copyTimer.current = window.setTimeout(() => {
					if (live.current) setCopied(null);
				}, 1600);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.section,
				"data-dsh-skin-manager": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: skin_manager_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: copy.headerTitle }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: copy.headerIntro })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skin_manager_module_css_default.card,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_manager_module_css_default.cardHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: copy.installedTitle }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: skin_manager_module_css_default.checkButton,
									disabled: loading || checking,
									onClick: checkVersions,
									children: checking ? copy.checking : copy.checkUpdates
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: current === "official" ? skin_manager_module_css_default.defaultActive : skin_manager_module_css_default.defaultButton,
								disabled: loading || switching !== null || current === "official",
								onClick: () => choose("official"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.officialName }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: copy.officialDescription })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: skin_manager_module_css_default.defaultState,
									children: current === "official" ? copy.stateCurrent : switching === "official" ? copy.stateSwitching : copy.stateSwitch
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skin_manager_module_css_default.skinGrid,
								children: catalog.map((skin) => {
									const primaryName = lang === "en" && skin.nameEn !== void 0 ? skin.nameEn : skin.name;
									const secondaryName = lang === "en" ? skin.nameEn !== void 0 ? skin.name : void 0 : skin.nameEn;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skin_manager_module_css_default.skinTile,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: current === skin.id ? skin_manager_module_css_default.activeSkin : skin_manager_module_css_default.skinButton,
												disabled: loading || switching !== null || current === skin.id,
												onClick: () => choose(skin.id),
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: primaryName }),
													secondaryName !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: secondaryName }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: current === skin.id ? copy.stateCurrent : switching === skin.id ? copy.stateSwitching : copy.stateSwitch })
												]
											}),
											skin.dshCompatibility && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
												className: skin_manager_module_css_default.compatibility,
												children: copy.compatibility(skin.dshCompatibility)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(VersionRow, {
												info: versions.get(skin.id) ?? {
													id: skin.id,
													source: "none",
													local: null,
													remote: null,
													dirty: false,
													note: copy.versionUnread
												},
												onCopied: announceCopied
											})
										]
									}, skin.id);
								})
							}),
							catalog.length === 0 && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								children: copy.noSkins
							}),
							copied === "ok" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								children: copy.copiedOk
							}),
							copied === "fail" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.error,
								children: copy.copyFailed
							}),
							loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								children: copy.loadingSkins
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.error,
								children: copy.actionFailed(error)
							})
						]
					}),
					currentDefinitions.map((definition) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CustomizationCard, {
						definition,
						registry
					}, definition.skinId)),
					!loading && current !== "official" && current !== "unknown" && currentDefinitions.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skin_manager_module_css_default.card,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: copy.settingsTitle }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skin_manager_module_css_default.hint,
							children: copy.noSettings
						})]
					})
				]
			});
		}
		/** Installed skin catalog; never waits for optional version probes. */
		async function fetchSkinCatalog() {
			const response = await fetch(SKIN_MANAGER_ROUTE, { credentials: "same-origin" });
			const result = await response.json();
			if (!response.ok || result.ok !== true || !Array.isArray(result.skins)) throw new Error(result.error ?? `HTTP ${response.status}`);
			return result.skins;
		}
		/** Local-only version rows (git probes / build metadata, no network). */
		async function fetchSkinLocalVersions() {
			const response = await fetch(SKIN_MANAGER_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ action: "local-versions" })
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true || !Array.isArray(result.versions)) throw new Error(result.error ?? `HTTP ${response.status}`);
			return new Map(result.versions.map((version) => [version.id, version]));
		}
		/** Ask the host to compare every installed skin against its GitHub origin. */
		async function fetchSkinVersions() {
			const response = await fetch(SKIN_MANAGER_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ action: "versions" })
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true || !Array.isArray(result.versions)) throw new Error(result.error ?? `HTTP ${response.status}`);
			return new Map(result.versions.map((version) => [version.id, version]));
		}
		/** Same-origin host switch with a bounded refresh handoff. */
		async function requestSkinSwitch(target) {
			const response = await fetch(SKIN_MANAGER_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ target })
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true) throw new Error(result.error ?? `HTTP ${response.status}`);
			window.setTimeout(() => window.location.reload(), 1200);
		}
		//#endregion
		//#region src/client/schedule.ts
		const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
		const DEFAULT_VISIBILITY_SCHEDULE = {
			enabled: false,
			outside: "visible",
			ranges: []
		};
		function normalizeTimeRange(value) {
			if (typeof value !== "object" || value === null) return null;
			const { start, end } = value;
			if (typeof start !== "string" || typeof end !== "string") return null;
			if (!TIME.test(start) || !TIME.test(end) || start === end) return null;
			return {
				start,
				end
			};
		}
		function normalizeVisibilitySchedule(value, fallback = DEFAULT_VISIBILITY_SCHEDULE) {
			const source = typeof value === "object" && value !== null ? value : {};
			const ranges = Array.isArray(source.ranges) ? source.ranges.map(normalizeTimeRange).filter((range) => range !== null).slice(0, 24) : fallback.ranges;
			return {
				enabled: typeof source.enabled === "boolean" ? source.enabled : fallback.enabled,
				outside: source.outside === "hidden" ? "hidden" : source.outside === "visible" ? "visible" : fallback.outside,
				ranges
			};
		}
		const minutes = (time) => {
			const [hour = 0, minute = 0] = time.split(":").map(Number);
			return hour * 60 + minute;
		};
		function isInTimeRange(range, minuteOfDay) {
			const start = minutes(range.start);
			const end = minutes(range.end);
			return start < end ? minuteOfDay >= start && minuteOfDay < end : minuteOfDay >= start || minuteOfDay < end;
		}
		/** Resolve local-time visibility; ranges always invert the outside policy. */
		function scheduleVisibility(schedule, now = /* @__PURE__ */ new Date()) {
			if (!schedule.enabled) return true;
			const minuteOfDay = now.getHours() * 60 + now.getMinutes();
			const inside = schedule.ranges.some((range) => isInTimeRange(range, minuteOfDay));
			const outsideVisible = schedule.outside === "visible";
			return inside ? !outsideVisible : outsideVisible;
		}
		/** Wake at the next minute boundary; exact enough for minute-resolution rules. */
		function millisecondsToNextMinute(now = /* @__PURE__ */ new Date()) {
			return Math.max(50, 6e4 - now.getSeconds() * 1e3 - now.getMilliseconds() + 25);
		}
		//#endregion
		//#region src/client/preferences.ts
		const PREFERENCES_KEY = "dsh.skin-manager.preferences.v2";
		const LEGACY_PREFERENCES_KEY = "dsh-deep-whale.skin-manager.v1";
		function object(value) {
			return typeof value === "object" && value !== null ? value : {};
		}
		function readJson(storage, key) {
			try {
				const raw = storage.getItem(key);
				return raw === null ? void 0 : JSON.parse(raw);
			} catch {
				return;
			}
		}
		function migrateLegacy(value) {
			const root = object(value);
			const maid = object(root.maid);
			const orca = object(root.orca);
			return {
				"maid-atelier": {
					artwork: maid.artwork,
					font: maid.font,
					modelExit: maid.modelExit
				},
				"orca-link": {
					character: orca.character,
					background: orca.background,
					pricingLight: orca.pricingLight
				}
			};
		}
		function readPreferences(storage = localStorage) {
			const current = readJson(storage, PREFERENCES_KEY);
			if (typeof current === "object" && current !== null) return object(current);
			return migrateLegacy(readJson(storage, LEGACY_PREFERENCES_KEY));
		}
		function normalizeSetting(setting, value) {
			if (setting.type === "boolean") return typeof value === "boolean" ? value : setting.defaultValue;
			if (setting.type === "select") return typeof value === "string" && setting.options.some((option) => option.value === value) ? value : setting.defaultValue;
			if (setting.type === "range") {
				const numeric = typeof value === "number" && Number.isFinite(value) ? value : setting.defaultValue;
				const min = setting.min;
				const max = setting.max;
				return Math.min(max, Math.max(min, numeric));
			}
			if (setting.type === "color") return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : setting.defaultValue;
			if (setting.type === "checkbox-group") {
				const selected = new Set(Array.isArray(value) ? value : setting.defaultValue);
				return setting.options.map((option) => option.value).filter((option) => selected.has(option));
			}
			return normalizeVisibilitySchedule(value, setting.defaultValue);
		}
		function settingSourceValue(setting, source) {
			if (Object.hasOwn(source, setting.key)) return source[setting.key];
			const legacy = setting.legacyValue;
			if (legacy === void 0) return void 0;
			const legacyValue = source[legacy.key];
			if (typeof legacyValue !== "boolean" && typeof legacyValue !== "string" && typeof legacyValue !== "number") return;
			const key = String(legacyValue);
			return Object.hasOwn(legacy.map, key) ? legacy.map[key] : void 0;
		}
		function normalizeSkinValues(definition, value) {
			const source = object(value);
			return Object.fromEntries(definition.settings.map((setting) => [setting.key, normalizeSetting(setting, settingSourceValue(setting, source))]));
		}
		var PreferencesStore = class {
			storage;
			value;
			listeners = /* @__PURE__ */ new Set();
			onStorage = (event) => {
				if (event.key !== "dsh.skin-manager.preferences.v2") return;
				this.value = readPreferences(this.storage);
				this.listeners.forEach((listener) => listener());
			};
			dispose;
			constructor(storage = localStorage, target = window) {
				this.storage = storage;
				this.value = readPreferences(storage);
				target.addEventListener("storage", this.onStorage);
				this.dispose = () => target.removeEventListener("storage", this.onStorage);
			}
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			};
			values(definition) {
				return normalizeSkinValues(definition, this.value[definition.skinId]);
			}
			set(definition, key, value) {
				if (!definition.settings.some((setting) => setting.key === key)) return;
				this.value = {
					...this.value,
					[definition.skinId]: {
						...this.value[definition.skinId],
						[key]: value
					}
				};
				this.storage.setItem(PREFERENCES_KEY, JSON.stringify(this.value));
				this.listeners.forEach((listener) => listener());
			}
		};
		//#endregion
		//#region src/protocol.ts
		const SKIN_CUSTOMIZATION_REGISTER_EVENT = "dsh:skin-customization-register-v1";
		const SKIN_CUSTOMIZATION_UNREGISTER_EVENT = "dsh:skin-customization-unregister-v1";
		const SKIN_CUSTOMIZATION_READY_EVENT = "dsh:skin-customization-ready-v1";
		//#endregion
		//#region src/client/runtime.ts
		/** Owns discovery, persistence fan-out, and clock updates behind one registry interface. */
		var SkinCustomizationRegistry = class {
			store;
			target;
			now;
			definitions = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			snapshot = {
				definitions: [],
				revision: 0
			};
			timer;
			unsubscribeStore;
			constructor(store = new PreferencesStore(), target = window, now = () => /* @__PURE__ */ new Date()) {
				this.store = store;
				this.target = target;
				this.now = now;
				this.unsubscribeStore = store.subscribe(() => {
					this.applyAll();
					this.emit();
				});
				target.addEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, this.onRegister);
				target.addEventListener(SKIN_CUSTOMIZATION_UNREGISTER_EVENT, this.onUnregister);
				target.dispatchEvent(new Event(SKIN_CUSTOMIZATION_READY_EVENT));
			}
			getSnapshot = () => this.snapshot;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			};
			values(definition) {
				return this.store.values(definition);
			}
			set(definition, key, value) {
				this.store.set(definition, key, value);
			}
			dispose() {
				this.target.removeEventListener(SKIN_CUSTOMIZATION_REGISTER_EVENT, this.onRegister);
				this.target.removeEventListener(SKIN_CUSTOMIZATION_UNREGISTER_EVENT, this.onUnregister);
				this.unsubscribeStore();
				this.store.dispose();
				if (this.timer !== void 0) this.target.clearTimeout(this.timer);
				for (const definition of this.definitions.values()) definition.apply(null);
				this.definitions.clear();
			}
			onRegister = (event) => {
				const detail = event instanceof CustomEvent ? event.detail : void 0;
				if (!detail || !this.valid(detail.definition)) return;
				this.definitions.set(detail.token, detail.definition);
				this.rebuildSnapshot();
				this.applyAll();
			};
			onUnregister = (event) => {
				const detail = event instanceof CustomEvent ? event.detail : void 0;
				if (!detail || this.definitions.get(detail.token) !== detail.definition) return;
				detail.definition.apply(null);
				this.definitions.delete(detail.token);
				this.rebuildSnapshot();
				this.scheduleClock();
			};
			valid(definition) {
				if (definition?.protocol !== 1 || typeof definition.skinId !== "string" || typeof definition.apply !== "function") return false;
				const keys = definition.settings.map((setting) => setting.key);
				return keys.length === new Set(keys).size && keys.every((key) => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key));
			}
			rebuildSnapshot() {
				this.snapshot = {
					definitions: [...new Set(this.definitions.values())],
					revision: this.snapshot.revision + 1
				};
				this.listeners.forEach((listener) => listener());
			}
			emit() {
				this.snapshot = {
					...this.snapshot,
					revision: this.snapshot.revision + 1
				};
				this.listeners.forEach((listener) => listener());
			}
			applyAll() {
				const now = this.now();
				for (const definition of new Set(this.definitions.values())) {
					const values = this.store.values(definition);
					const visibility = Object.fromEntries(definition.settings.filter((setting) => setting.type === "visibility-schedule").map((setting) => [setting.key, scheduleVisibility(values[setting.key], now)]));
					try {
						definition.apply({
							values,
							visibility
						});
					} catch (error) {
						console.error(`[skin-manager] ${definition.skinId} customization failed`, error);
					}
				}
				this.scheduleClock();
			}
			scheduleClock() {
				if (this.timer !== void 0) this.target.clearTimeout(this.timer);
				const hasEnabledSchedule = [...new Set(this.definitions.values())].some((definition) => {
					const values = this.store.values(definition);
					return definition.settings.some((setting) => setting.type === "visibility-schedule" && values[setting.key].enabled);
				});
				this.timer = hasEnabledSchedule ? this.target.setTimeout(() => this.applyAll(), millisecondsToNextMinute(this.now())) : void 0;
			}
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots"];
		function activeSkin(catalog) {
			const active = catalog.find((skin) => document.body.hasAttribute(skin.bodyAttr));
			if (active !== void 0) return active.id;
			return "official";
		}
		/** Register settings and the generic customization registry with owned cleanup. */
		function apply(ctx) {
			const registry = new SkinCustomizationRegistry(new PreferencesStore());
			ctx.effect(() => () => registry.dispose(), "ui-skin-manager: customization registry");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-skins",
				order: 115,
				label: "皮肤管理",
				inject: () => ({
					registry,
					active: activeSkin,
					switchSkin: requestSkinSwitch
				})
			}, SkinManager));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map