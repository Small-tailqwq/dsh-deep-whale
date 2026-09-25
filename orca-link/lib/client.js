window.__ModuleLoader__.load({
	id: "@smalltailqwq/dsh-client-ui-skin-orca-link",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/asset-url.ts
		/** Resolve against the host base, including reverse-proxy mounts and dsh-app desktop forwarding. */
		function skinAssetUrl(file) {
			return new URL(`skin-assets/orca-link/${file}`, document.baseURI).href;
		}
		//#endregion
		//#region src/client/art.ts
		/**
		* Independent ORCA LINK artwork layers generated for this skin. Neither has
		* lettering or fake controls: live DSH content owns the readable layer.
		* Re-embed from a source image with:
		*   node scripts/embed-skin-art orca-link ORCA_LINK_CHARACTER_ART <imagePath> 0
		*   node scripts/embed-skin-art orca-link ORCA_LINK_ART <imagePath> 1920
		*   node scripts/embed-skin-art orca-link ORCA_LINK_DARK_HERO_ART <imagePath> 1920
		*   node scripts/embed-skin-art orca-link ORCA_LINK_DARK_ACTIVE_ART <imagePath> 1920
		*   node scripts/embed-skin-art orca-link ORCA_LINK_LIGHT_HERO_ART <imagePath> 1920
		*   node scripts/embed-skin-art orca-link ORCA_LINK_LIGHT_ACTIVE_ART <imagePath> 1920
		*   node scripts/embed-skin-art orca-link ORCA_LINK_STATUS_ATLAS <imagePath> 2048
		*/
		const ORCA_LINK_STATUS_ATLAS = skinAssetUrl("a0779005d2d849767e22ba4eef0c76e6b16dbf9a49a55b0114d4f7af35f48c7d.webp");
		const ORCA_LINK_LIGHT_HERO_ART = skinAssetUrl("d5fdfd91306d2f3aaa766674d5994be4a014c4dd083d6afd7f90b4947bba6802.webp");
		const ORCA_LINK_LIGHT_ACTIVE_ART = skinAssetUrl("3605bdd7ccfcc75ca78558f2c958bb3bb35e544cc705f5c15c3653ca21a274d5.webp");
		const ORCA_LINK_DARK_HERO_ART = skinAssetUrl("5affe6ca90a22227bc020914e4b9d4dc8913a336ffc4a76e17f5b715fa2e0086.webp");
		const ORCA_LINK_DARK_ACTIVE_ART = skinAssetUrl("905f86159587cb4f168fdc78dac8ac8b53e3271d829f78878ddb0c81d0e33747.webp");
		skinAssetUrl("6c4d6705e9fca5ac1f0d7a6b3b113dab157e8123d21cea53a2c399106b4f0239.webp");
		skinAssetUrl("0ba862962a5560db2691e9bfb2a925be549f2c23c88c660769bd9d867189f0f2.webp");
		skinAssetUrl("8e35ddb65f30bb23fcc7752cf5b92b2a1d958b93779eb607f878e0510e1affd9.webp");
		const SKIN_CUSTOMIZATION_EVENTS = {
			[1]: {
				register: "dsh:skin-customization-register-v1",
				unregister: "dsh:skin-customization-unregister-v1",
				ready: "dsh:skin-customization-ready-v1"
			},
			[2]: {
				register: "dsh:skin-customization-register-v2",
				unregister: "dsh:skin-customization-unregister-v2",
				ready: "dsh:skin-customization-ready-v2"
			}
		};
		SKIN_CUSTOMIZATION_EVENTS[2].register;
		SKIN_CUSTOMIZATION_EVENTS[2].unregister;
		SKIN_CUSTOMIZATION_EVENTS[2].ready;
		/**
		* Expose one skin definition without a runtime dependency on the manager.
		* The ready handshake makes load order and manager hot reload irrelevant.
		*/
		function exposeSkinCustomization(definition, target = window) {
			const token = {};
			const events = SKIN_CUSTOMIZATION_EVENTS[definition.protocol];
			const register = () => {
				target.dispatchEvent(new CustomEvent(events.register, { detail: {
					token,
					definition
				} }));
			};
			target.addEventListener(events.ready, register);
			register();
			return () => {
				target.removeEventListener(events.ready, register);
				target.dispatchEvent(new CustomEvent(events.unregister, { detail: {
					token,
					definition
				} }));
				definition.apply(null);
			};
		}
		/** Attribute projection helper for skins; it restores only values it still owns. */
		var SkinAttributeProjector = class {
			root;
			originals = /* @__PURE__ */ new Map();
			owned = /* @__PURE__ */ new Map();
			constructor(root = document.documentElement) {
				this.root = root;
			}
			set(attribute, value) {
				if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute));
				this.root.setAttribute(attribute, value);
				this.owned.set(attribute, value);
			}
			unset(attribute) {
				if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute));
				this.root.removeAttribute(attribute);
				this.owned.set(attribute, null);
			}
			release(attribute) {
				const attributes = attribute === void 0 ? [...this.originals.keys()] : [attribute];
				for (const name of attributes) {
					if (!this.originals.has(name)) continue;
					const original = this.originals.get(name) ?? null;
					if (this.root.getAttribute(name) === this.owned.get(name)) {
						if (original === null) this.root.removeAttribute(name);
						else this.root.setAttribute(name, original);
					}
					this.originals.delete(name);
					this.owned.delete(name);
				}
			}
		};
		//#endregion
		//#region src/client/customization.ts
		const COMPOSER_SCROLL_HIDE_ATTRIBUTE = "data-dsh-whale-orca-composer-scroll-hide";
		const COMPOSER_HANDLES_ATTRIBUTE = "data-dsh-whale-orca-composer-handles";
		const HEADLINE_TYPEWRITER_ATTRIBUTE = "data-dsh-whale-orca-headline-typewriter";
		/** A declared behaviour switch reads as enabled until the manager says 'off'. */
		function orcaFeatureEnabled(doc, attribute) {
			return doc.documentElement.getAttribute(attribute) !== "off";
		}
		/** Re-run `callback` whenever the manager flips one of the given switches. */
		function observeOrcaFeature(doc, attributes, callback) {
			const observer = new MutationObserver(callback);
			observer.observe(doc.documentElement, {
				attributes: true,
				attributeFilter: attributes
			});
			return () => {
				observer.disconnect();
			};
		}
		/** ORCA LINK owns the attributes produced from its declared controls. */
		function installOrcaCustomization(root = document.documentElement) {
			const projector = new SkinAttributeProjector(root);
			const apply = (state) => {
				if (state === null) {
					projector.release();
					return;
				}
				const scheduleVisible = state.visibility.sfwMode !== false;
				projector.set("data-dsh-whale-orca-background", state.values.background === true ? "visible" : "hidden");
				projector.set("data-dsh-whale-orca-pricing", state.values.pricingLight === true ? "visible" : "hidden");
				projector.set("data-dsh-whale-orca-art", scheduleVisible ? "visible" : "hidden");
				projector.set("data-dsh-whale-orca-character", state.values.character === true && scheduleVisible ? "visible" : "hidden");
				projector.set("data-dsh-whale-orca-character-mirror", state.values.mirrorCharacter === true ? "mirrored" : "original");
				projector.set("data-dsh-whale-orca-settings-layout", state.values.centerSettings === true ? "centered" : "docked");
				projector.set(COMPOSER_SCROLL_HIDE_ATTRIBUTE, state.values.scrollHideComposer === false ? "off" : "on");
				projector.set(COMPOSER_HANDLES_ATTRIBUTE, state.values.composerHandles === false ? "off" : "on");
				projector.set(HEADLINE_TYPEWRITER_ATTRIBUTE, state.values.headlineTypewriter === false ? "off" : "on");
			};
			return exposeSkinCustomization({
				protocol: 2,
				skinId: "orca-link",
				title: "ORCA LINK",
				settings: [
					{
						key: "character",
						type: "boolean",
						label: "显示左上角状态小人",
						labelEn: "Show the corner status character",
						defaultValue: true
					},
					{
						key: "mirrorCharacter",
						type: "boolean",
						label: "镜像左上角状态小人",
						labelEn: "Mirror the corner status character",
						description: "左右翻转角色动画，方便调整鼠标与键盘手位。",
						descriptionEn: "Flip the character animation horizontally to match your mouse and keyboard hand position.",
						defaultValue: false
					},
					{
						key: "background",
						type: "boolean",
						label: "显示背景",
						labelEn: "Show the background",
						defaultValue: true
					},
					{
						key: "pricingLight",
						type: "boolean",
						label: "显示红绿灯定价指示",
						labelEn: "Show the pricing traffic light",
						defaultValue: true
					},
					{
						key: "centerSettings",
						type: "boolean",
						label: "设置界面居中",
						labelEn: "Center the settings panel",
						description: "在宽阔视口中将设置面板放在屏幕中央；窄视口仍使用全屏布局。",
						descriptionEn: "Place the settings panel in the center on large viewports; constrained viewports remain full-screen.",
						defaultValue: false
					},
					{
						key: "scrollHideComposer",
						type: "boolean",
						label: "上滚时隐藏输入框",
						labelEn: "Hide the composer while scrolling up",
						description: "向上翻阅对话时收起输入框，向下滚动或回到底部时再显示。",
						descriptionEn: "Tuck the composer away while reading back through the conversation; it returns when scrolling down or reaching the bottom.",
						defaultValue: true
					},
					{
						key: "composerHandles",
						type: "boolean",
						label: "输入框拖拽收起手柄",
						labelEn: "Composer drag-to-hide handles",
						description: "在输入框两侧的括号上显示拖拽手柄，向内拖动即可手动收起输入框。",
						descriptionEn: "Turn the brackets beside the composer into handles that hide it when dragged inward.",
						defaultValue: true
					},
					{
						key: "headlineTypewriter",
						type: "boolean",
						label: "首页标题打字机动画",
						labelEn: "Home headline typewriter",
						description: "在新会话首页轮播打字机标语；关闭后保留宿主原始标题。",
						descriptionEn: "Cycle typewriter slogans on the new-session headline; when off, the host headline stays as is.",
						defaultValue: true
					},
					{
						key: "sfwMode",
						type: "visibility-schedule",
						label: "不那么二次元模式",
						labelEn: "Not-so-anime mode",
						description: "按本机时间控制场景立绘与左上角小人的显示与隐藏。",
						descriptionEn: "Control the scene artwork and the corner character by local time.",
						defaultValue: {
							enabled: false,
							outside: "visible",
							ranges: []
						}
					}
				],
				apply
			});
		}
		//#endregion
		//#region src/client/mutation-filter.ts
		/**
		* Skin controllers watch the document because DSH can replace their owning
		* surfaces during navigation. Two high-churn sources are excluded from the
		* reconciliation path because none of their mutations can affect ORCA chrome:
		*
		* - xterm, which mutates thousands of internal row nodes while replaying a
		*   terminal;
		* - the alpha composer's Lexical surface (`[data-composer-input]`), whose
		*   child nodes are maintained by the editor while typing.
		*/
		const HIGH_CHURN_SELECTOR = ".xterm";
		const COMPOSER_INPUT_SELECTOR = "[data-composer-input]";
		function belongsToHighChurnSubtree(node) {
			if (node instanceof Element) return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null;
			return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null;
		}
		function isHighChurnOnly(record) {
			if (belongsToHighChurnSubtree(record.target)) return true;
			if (record.type !== "childList") return false;
			if (record.target instanceof Element && record.target.closest(COMPOSER_INPUT_SELECTOR) !== null) return true;
			const changed = [...record.addedNodes, ...record.removedNodes];
			return changed.length > 0 && changed.every(belongsToHighChurnSubtree);
		}
		function hasMutationOutsideTerminal(records) {
			return records.some((record) => !isHighChurnOnly(record));
		}
		const TRANSCRIPT_SELECTOR = "[data-chat-flow]";
		function insideTranscript(node) {
			return ((node instanceof Element ? node : node.parentElement)?.closest(TRANSCRIPT_SELECTOR) ?? null) !== null;
		}
		/**
		* For controllers that only follow the conversation's frame (phase, scrollport,
		* composer seat, sidebar chrome): streaming replies rewrite the transcript
		* (`[data-chat-flow]`) on every batch, and none of those edits can move the
		* frame, so they are skipped along with the terminal and editor churn above.
		* Mounting or replacing the transcript itself targets its parent and still
		* counts. The composer seat and the approval/question cards sit outside it.
		*/
		function hasMutationOutsideTranscript(records) {
			return records.some((record) => !isHighChurnOnly(record) && !insideTranscript(record.target));
		}
		//#endregion
		//#region src/client/composer-collapse.ts
		const COMPOSER_SEAT_SELECTOR$1 = "[data-composer-seat]";
		const COMPOSER_CARD_SELECTOR$1 = "[data-composer-card]:not([class*='cardWorkspaceTrigger'])";
		const CHAT_FLOW_SELECTOR$1 = "[data-chat-flow]";
		const MANUAL_HIDDEN_ATTRIBUTE = "data-orca-composer-manual-hidden";
		const DRAGGING_ATTRIBUTE = "data-orca-composer-collapse-dragging";
		const REBOUNDING_ATTRIBUTE = "data-orca-composer-collapse-rebounding";
		const COLLAPSING_ATTRIBUTE = "data-orca-composer-collapsing";
		const RESTORING_ATTRIBUTE = "data-orca-composer-restoring";
		const OWNED_INERT_ATTRIBUTE = "data-orca-composer-owned-inert";
		const BODY_DRAGGING_ATTRIBUTE = "data-orca-composer-handle-dragging";
		const HANDLE_ATTRIBUTE = "data-orca-composer-handle";
		const RESTORE_ATTRIBUTE = "data-orca-composer-restore";
		const RESTORE_EXIT_ATTRIBUTE = "data-orca-composer-restore-exiting";
		const ACTIVATION_DEAD_ZONE = 8;
		const COMMIT_THRESHOLD = .56;
		const REBOUND_LIFETIME_MS = 420;
		const COLLAPSE_LIFETIME_MS = 440;
		const RESTORE_LIFETIME_MS = 520;
		const RESTORE_SIZE = 28;
		const RESTORE_ORNAMENT = 6;
		const RESTORE_CLEARANCE = 8;
		const TO_BOTTOM_SELECTOR = "button[class*='toBottom']";
		const TO_BOTTOM_CENTER_INSET = 33;
		function clamp(value, min, max) {
			return Math.min(max, Math.max(min, value));
		}
		function phaseRootOf$1(element) {
			let candidate = element;
			while (candidate !== null) {
				if (candidate instanceof HTMLElement && candidate.hasAttribute("data-phase")) {
					if (candidate.querySelector("[data-conversation-scroll]")?.closest("[data-phase]") === candidate) return candidate;
				}
				candidate = candidate.parentElement;
			}
			return null;
		}
		function composerBelongsToConversation$1(root) {
			return (root.dataset.phase ?? "") === "active" && root.querySelector(CHAT_FLOW_SELECTOR$1) !== null;
		}
		function isPrimaryPointer(event) {
			return event.button === 0 && event.isPrimary !== false;
		}
		/**
		* Upgrade the decorative ORCA composer brackets into inward drag handles.
		* The host keeps ownership of the editor, draft and submit path; this
		* module only presents a reversible, manually locked visibility state.
		*/
		function installOrcaComposerCollapse(body) {
			const doc = body.ownerDocument;
			const view = doc.defaultView;
			const bindings = /* @__PURE__ */ new Map();
			const timers = /* @__PURE__ */ new Set();
			let activeDrag = null;
			const prefersChinese = () => (doc.documentElement.lang || view?.navigator.language || "en").toLowerCase().startsWith("zh");
			const handleLabel = (side) => prefersChinese() ? `${side === "left" ? "向右" : "向左"}拖动以收起输入框` : `Drag ${side === "left" ? "right" : "left"} to hide composer`;
			const restoreLabel = () => prefersChinese() ? "显示输入框" : "Show composer";
			const schedule = (callback, delay) => {
				const timer = setTimeout(() => {
					timers.delete(timer);
					callback();
				}, delay);
				timers.add(timer);
			};
			const clearDragProperties = (seat) => {
				for (const property of [
					"scale",
					"dock-x",
					"dock-y",
					"dock-scale"
				]) seat.style.removeProperty(`--orca-composer-${property}`);
				const binding = bindings.get(seat);
				if (binding !== void 0) binding.cardRect = null;
			};
			const blurSeat = (seat) => {
				const active = doc.activeElement;
				if (active instanceof HTMLElement && seat.contains(active)) active.blur();
			};
			const setOwnedInert = (seat, inert) => {
				if (inert) {
					if (!seat.hasAttribute("inert")) {
						seat.setAttribute("inert", "");
						seat.setAttribute(OWNED_INERT_ATTRIBUTE, "");
					}
					return;
				}
				if (seat.hasAttribute(OWNED_INERT_ATTRIBUTE)) {
					seat.removeAttribute("inert");
					seat.removeAttribute(OWNED_INERT_ATTRIBUTE);
				}
			};
			const applyDragProgress = (binding, progress) => {
				binding.seat.style.setProperty("--orca-composer-scale", `${1 - progress * .58}`);
			};
			const anchorRestore = (binding, cardRect) => {
				const rootRect = binding.root.getBoundingClientRect();
				const rect = cardRect ?? binding.card.getBoundingClientRect();
				if (rootRect.width <= 0 || rootRect.height <= 0 || rect.width <= 0 || rect.height <= 0) return;
				const left = clamp(rect.right - TO_BOTTOM_CENTER_INSET - RESTORE_SIZE / 2, rootRect.left + 8, rootRect.right - RESTORE_SIZE - 8);
				const top = clamp(rect.top + 12, rootRect.top + 8, rootRect.bottom - RESTORE_SIZE - 8);
				binding.anchor = {
					leftRatio: (left - rootRect.left) / rootRect.width,
					topRatio: (top - rootRect.top) / rootRect.height
				};
				positionRestore(binding, rect);
			};
			const positionRestore = (binding, sourceRect) => {
				const button = binding.restore;
				const anchor = binding.anchor;
				if (button === null || anchor === null) return;
				const rootRect = binding.root.getBoundingClientRect();
				let left = clamp(rootRect.left + rootRect.width * anchor.leftRatio, rootRect.left + 8, rootRect.right - RESTORE_SIZE - 8);
				let top = clamp(rootRect.top + rootRect.height * anchor.topRatio, rootRect.top + 8, rootRect.bottom - RESTORE_SIZE - 8);
				const toBottom = binding.root.querySelector(TO_BOTTOM_SELECTOR)?.getBoundingClientRect();
				const hasToBottom = toBottom !== void 0 && toBottom.width > 0 && toBottom.height > 0;
				if (hasToBottom) left = clamp(toBottom.left + toBottom.width / 2 - RESTORE_SIZE / 2, rootRect.left + 8, rootRect.right - RESTORE_SIZE - 8);
				if (hasToBottom && left - RESTORE_ORNAMENT < toBottom.right + RESTORE_CLEARANCE && left + RESTORE_SIZE + RESTORE_ORNAMENT > toBottom.left - RESTORE_CLEARANCE && top < toBottom.bottom + RESTORE_CLEARANCE && top + RESTORE_SIZE > toBottom.top - RESTORE_CLEARANCE) top = clamp(toBottom.bottom + RESTORE_CLEARANCE, rootRect.top + 8, rootRect.bottom - RESTORE_SIZE - 8);
				button.style.left = `${left}px`;
				button.style.top = `${top}px`;
				if (sourceRect !== void 0) {
					const sourceX = sourceRect.left + sourceRect.width / 2;
					const sourceY = sourceRect.top + sourceRect.height / 2;
					binding.seat.style.setProperty("--orca-composer-dock-x", `${left + RESTORE_SIZE / 2 - sourceX}px`);
					binding.seat.style.setProperty("--orca-composer-dock-y", `${top + RESTORE_SIZE / 2 - sourceY}px`);
					binding.seat.style.setProperty("--orca-composer-dock-scale", `${RESTORE_SIZE / sourceRect.width}`);
				}
			};
			const removeRestore = (binding) => {
				binding.restore?.remove();
				binding.restore = null;
			};
			const restoreComposer = (binding) => {
				const seat = binding.seat;
				if (!seat.hasAttribute("data-orca-composer-manual-hidden")) return;
				const version = ++binding.transitionVersion;
				const rect = seat.hasAttribute(COLLAPSING_ATTRIBUTE) ? binding.cardRect ?? binding.card.getBoundingClientRect() : binding.card.getBoundingClientRect();
				positionRestore(binding, rect);
				binding.restore?.setAttribute(RESTORE_EXIT_ATTRIBUTE, "");
				seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE);
				seat.removeAttribute("data-orca-composer-hidden");
				seat.removeAttribute(COLLAPSING_ATTRIBUTE);
				seat.removeAttribute(REBOUNDING_ATTRIBUTE);
				seat.setAttribute(RESTORING_ATTRIBUTE, "");
				setOwnedInert(seat, false);
				schedule(() => {
					if (version !== binding.transitionVersion) return;
					seat.removeAttribute(RESTORING_ATTRIBUTE);
					clearDragProperties(seat);
					removeRestore(binding);
				}, RESTORE_LIFETIME_MS);
			};
			const mountRestore = (binding, cardRect) => {
				removeRestore(binding);
				const button = doc.createElement("button");
				button.type = "button";
				button.setAttribute(RESTORE_ATTRIBUTE, "");
				button.setAttribute("aria-label", restoreLabel());
				const core = doc.createElement("span");
				core.setAttribute("data-orca-composer-restore-core", "");
				core.setAttribute("aria-hidden", "true");
				button.append(core);
				button.addEventListener("click", () => {
					restoreComposer(binding);
				});
				body.append(button);
				binding.restore = button;
				anchorRestore(binding, cardRect);
			};
			const commitCollapse = (binding) => {
				const seat = binding.seat;
				if (seat.hasAttribute("data-orca-composer-manual-hidden")) return;
				const version = ++binding.transitionVersion;
				const cardRect = binding.cardRect ?? binding.card.getBoundingClientRect();
				binding.cardRect = cardRect;
				blurSeat(seat);
				seat.removeAttribute(DRAGGING_ATTRIBUTE);
				seat.removeAttribute(REBOUNDING_ATTRIBUTE);
				seat.removeAttribute(RESTORING_ATTRIBUTE);
				seat.removeAttribute("data-orca-composer-entering");
				seat.removeAttribute("data-orca-composer-interactive");
				seat.removeAttribute("data-orca-composer-hidden");
				seat.setAttribute(MANUAL_HIDDEN_ATTRIBUTE, "");
				seat.setAttribute(COLLAPSING_ATTRIBUTE, "");
				setOwnedInert(seat, true);
				body.removeAttribute(BODY_DRAGGING_ATTRIBUTE);
				mountRestore(binding, cardRect);
				schedule(() => {
					if (version !== binding.transitionVersion) return;
					seat.removeAttribute(COLLAPSING_ATTRIBUTE);
					seat.style.removeProperty("--orca-composer-scale");
				}, COLLAPSE_LIFETIME_MS);
			};
			const reboundComposer = (binding) => {
				const seat = binding.seat;
				seat.removeAttribute(DRAGGING_ATTRIBUTE);
				const version = ++binding.transitionVersion;
				seat.setAttribute(REBOUNDING_ATTRIBUTE, "");
				body.removeAttribute(BODY_DRAGGING_ATTRIBUTE);
				schedule(() => {
					if (version !== binding.transitionVersion) return;
					seat.removeAttribute(REBOUNDING_ATTRIBUTE);
					clearDragProperties(seat);
				}, REBOUND_LIFETIME_MS);
			};
			const finishDrag = (commit) => {
				const drag = activeDrag;
				if (drag === null) return;
				activeDrag = null;
				drag.binding.suppressClickUntil = Date.now() + 420;
				if (drag.handle.hasPointerCapture?.(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
				if (!drag.activated) {
					body.removeAttribute(BODY_DRAGGING_ATTRIBUTE);
					clearDragProperties(drag.binding.seat);
					return;
				}
				if (commit) commitCollapse(drag.binding);
				else reboundComposer(drag.binding);
			};
			const onPointerMove = (event) => {
				const drag = activeDrag;
				if (drag === null || event.pointerId !== drag.pointerId) return;
				if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
					finishDrag(false);
					return;
				}
				const inward = drag.side === "left" ? event.clientX - drag.startX : drag.startX - event.clientX;
				if (!drag.activated) {
					if (inward <= ACTIVATION_DEAD_ZONE) return;
					drag.activated = true;
					drag.binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE);
					drag.binding.seat.removeAttribute("data-orca-composer-entering");
					drag.binding.seat.removeAttribute("data-orca-composer-hidden");
					drag.binding.seat.setAttribute(DRAGGING_ATTRIBUTE, "");
					body.setAttribute(BODY_DRAGGING_ATTRIBUTE, drag.side);
				}
				drag.progress = clamp(drag.startProgress + (inward - ACTIVATION_DEAD_ZONE) / (drag.distance - ACTIVATION_DEAD_ZONE), 0, 1);
				applyDragProgress(drag.binding, drag.progress);
				event.preventDefault();
			};
			const onPointerUp = (event) => {
				const drag = activeDrag;
				if (drag === null || event.pointerId !== drag.pointerId) return;
				finishDrag(drag.progress >= COMMIT_THRESHOLD);
			};
			const onPointerCancel = (event) => {
				if (activeDrag === null || event.pointerId !== activeDrag.pointerId) return;
				finishDrag(false);
			};
			const onWindowBlur = () => {
				if (activeDrag !== null) finishDrag(false);
			};
			const onVisibilityChange = () => {
				if (doc.visibilityState === "hidden" && activeDrag !== null) finishDrag(false);
			};
			const beginDrag = (event, binding, side, handle) => {
				if (!isPrimaryPointer(event) || activeDrag !== null) return;
				if (binding.seat.hasAttribute("data-orca-composer-manual-hidden") || binding.seat.hasAttribute(RESTORING_ATTRIBUTE)) return;
				if ((binding.root.dataset.phase ?? "") !== "active" || binding.root.querySelector(CHAT_FLOW_SELECTOR$1) === null) return;
				const rebounding = binding.seat.hasAttribute(REBOUNDING_ATTRIBUTE);
				const transform = rebounding ? view?.getComputedStyle(binding.card).transform : void 0;
				const startProgress = clamp((1 - ((transform?.startsWith("matrix(") ? Number.parseFloat(transform.slice(7)) : 1) ?? 1)) / .58, 0, 1);
				const rect = rebounding && binding.cardRect !== null ? binding.cardRect : binding.card.getBoundingClientRect();
				++binding.transitionVersion;
				binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE);
				clearDragProperties(binding.seat);
				const width = rect.width;
				binding.cardRect = rect;
				if (rebounding) {
					applyDragProgress(binding, startProgress);
					binding.seat.setAttribute(DRAGGING_ATTRIBUTE, "");
					body.setAttribute(BODY_DRAGGING_ATTRIBUTE, side);
				}
				activeDrag = {
					binding,
					handle,
					pointerId: event.pointerId,
					side,
					startX: event.clientX,
					startProgress,
					distance: clamp(width * .34, 88, 168),
					progress: startProgress,
					activated: rebounding
				};
				handle.setPointerCapture?.(event.pointerId);
				event.preventDefault();
			};
			const createHandle = (binding, side) => {
				const handle = doc.createElement("button");
				handle.type = "button";
				handle.setAttribute(HANDLE_ATTRIBUTE, side);
				handle.setAttribute("aria-label", handleLabel(side));
				handle.addEventListener("pointerdown", (event) => {
					beginDrag(event, binding, side, handle);
				});
				handle.addEventListener("lostpointercapture", (event) => {
					if (activeDrag === null || event.pointerId !== activeDrag.pointerId) return;
					finishDrag(false);
				});
				handle.addEventListener("keydown", (event) => {
					if (event.key !== "Enter" && event.key !== " ") return;
					event.preventDefault();
					commitCollapse(binding);
				});
				handle.addEventListener("click", (event) => {
					if (Date.now() < binding.suppressClickUntil) return;
					if (event.detail === 0) commitCollapse(binding);
				});
				return handle;
			};
			const mountBinding = (seat) => {
				const root = phaseRootOf$1(seat);
				const card = seat.querySelector(COMPOSER_CARD_SELECTOR$1);
				if (root === null || card === null) return;
				let binding = bindings.get(seat);
				if (binding === void 0) {
					binding = {
						seat,
						card,
						root,
						handles: [],
						restore: null,
						anchor: null,
						suppressClickUntil: 0,
						cardRect: null,
						transitionVersion: 0
					};
					bindings.set(seat, binding);
				} else {
					binding.root = root;
					if (binding.card !== card) {
						binding.handles.forEach((handle) => {
							handle.remove();
						});
						binding.handles = [];
						binding.card = card;
					}
				}
				if (!composerBelongsToConversation$1(root) || !orcaFeatureEnabled(doc, "data-dsh-whale-orca-composer-handles")) {
					if (activeDrag?.binding === binding) finishDrag(false);
					++binding.transitionVersion;
					binding.handles.forEach((handle) => {
						handle.remove();
					});
					binding.handles = [];
					removeRestore(binding);
					setOwnedInert(seat, false);
					seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE);
					seat.removeAttribute(DRAGGING_ATTRIBUTE);
					seat.removeAttribute(REBOUNDING_ATTRIBUTE);
					seat.removeAttribute(COLLAPSING_ATTRIBUTE);
					seat.removeAttribute(RESTORING_ATTRIBUTE);
					clearDragProperties(seat);
					return;
				}
				if (binding.handles.length === 0) {
					const left = createHandle(binding, "left");
					const right = createHandle(binding, "right");
					card.append(left, right);
					binding.handles = [left, right];
				}
				if (binding.restore !== null) positionRestore(binding);
			};
			const removeBinding = (binding) => {
				if (activeDrag?.binding === binding) finishDrag(false);
				++binding.transitionVersion;
				binding.handles.forEach((handle) => {
					handle.remove();
				});
				binding.handles = [];
				removeRestore(binding);
				setOwnedInert(binding.seat, false);
				binding.seat.removeAttribute(MANUAL_HIDDEN_ATTRIBUTE);
				binding.seat.removeAttribute(DRAGGING_ATTRIBUTE);
				binding.seat.removeAttribute(REBOUNDING_ATTRIBUTE);
				binding.seat.removeAttribute(COLLAPSING_ATTRIBUTE);
				binding.seat.removeAttribute(RESTORING_ATTRIBUTE);
				clearDragProperties(binding.seat);
			};
			const synchronize = () => {
				doc.querySelectorAll(COMPOSER_SEAT_SELECTOR$1).forEach(mountBinding);
				bindings.forEach((binding, seat) => {
					if (seat.isConnected) return;
					removeBinding(binding);
					bindings.delete(seat);
				});
			};
			const onKeyDown = (event) => {
				if (event.key !== "Escape" || activeDrag === null) return;
				event.preventDefault();
				finishDrag(false);
			};
			const onResize = () => {
				bindings.forEach((binding) => {
					positionRestore(binding);
				});
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) synchronize();
			});
			observer.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-phase"]
			});
			const langObserver = new MutationObserver(() => {
				bindings.forEach((binding) => {
					for (const handle of binding.handles) handle.setAttribute("aria-label", handleLabel(handle.getAttribute(HANDLE_ATTRIBUTE)));
					binding.restore?.setAttribute("aria-label", restoreLabel());
				});
			});
			langObserver.observe(doc.documentElement, {
				attributes: true,
				attributeFilter: ["lang"]
			});
			const disposeHandlesSwitch = observeOrcaFeature(doc, [COMPOSER_HANDLES_ATTRIBUTE], synchronize);
			doc.addEventListener("pointermove", onPointerMove, { passive: false });
			doc.addEventListener("pointerup", onPointerUp, true);
			doc.addEventListener("pointercancel", onPointerCancel, true);
			doc.addEventListener("keydown", onKeyDown, true);
			doc.addEventListener("visibilitychange", onVisibilityChange);
			view?.addEventListener("blur", onWindowBlur);
			view?.addEventListener("resize", onResize);
			synchronize();
			return () => {
				observer.disconnect();
				langObserver.disconnect();
				disposeHandlesSwitch();
				doc.removeEventListener("pointermove", onPointerMove);
				doc.removeEventListener("pointerup", onPointerUp, true);
				doc.removeEventListener("pointercancel", onPointerCancel, true);
				doc.removeEventListener("keydown", onKeyDown, true);
				doc.removeEventListener("visibilitychange", onVisibilityChange);
				view?.removeEventListener("blur", onWindowBlur);
				view?.removeEventListener("resize", onResize);
				if (activeDrag !== null) finishDrag(false);
				body.removeAttribute(BODY_DRAGGING_ATTRIBUTE);
				bindings.forEach(removeBinding);
				bindings.clear();
				timers.forEach((timer) => {
					clearTimeout(timer);
				});
				timers.clear();
				doc.querySelectorAll(`[${RESTORE_ATTRIBUTE}], [${HANDLE_ATTRIBUTE}]`).forEach((element) => {
					element.remove();
				});
			};
		}
		//#endregion
		//#region src/client/composer-motion.ts
		const COMPOSER_SEAT_SELECTOR = "[data-composer-seat]";
		const COMPOSER_CARD_SELECTOR = "[data-composer-card]";
		const SCROLLPORT_SELECTOR = "[data-conversation-scroll]";
		const CHAT_FLOW_SELECTOR = "[data-chat-flow]";
		const NESTED_SCROLL_SURFACE_SELECTOR = [
			"[role=\"menu\"]",
			"[role=\"listbox\"]",
			"[role=\"dialog\"]",
			"[aria-modal=\"true\"]",
			"[data-radix-popper-content-wrapper]",
			"[data-floating-ui-portal]"
		].join(",");
		const ENTER_ATTRIBUTE = "data-orca-composer-entering";
		const HIDDEN_ATTRIBUTE = "data-orca-composer-hidden";
		const INTERACTIVE_ATTRIBUTE = "data-orca-composer-interactive";
		const MOTION_ATTRIBUTE = "data-orca-composer-motion";
		const GHOST_ATTRIBUTE = "data-orca-composer-ghost";
		const OUTSIDE_CHAT_ATTRIBUTE = "data-orca-composer-outside-chat";
		const SCROLL_THRESHOLD = 10;
		const BOTTOM_THRESHOLD = 24;
		const GHOST_LIFETIME_MS = 260;
		const ENTER_LIFETIME_MS = 820;
		const EXIT_SNAPSHOT_LIFETIME_MS = 800;
		const MOTION_LIFETIME_MS = 360;
		const SEAT_GESTURE_WINDOW_MS = 200;
		function phaseRootOf(element) {
			let candidate = element;
			while (candidate !== null) {
				if (candidate instanceof HTMLElement && candidate.hasAttribute("data-phase")) {
					if (candidate.querySelector(SCROLLPORT_SELECTOR)?.closest("[data-phase]") === candidate) return candidate;
				}
				candidate = candidate.parentElement;
			}
			return null;
		}
		function seatOf(element) {
			if (element.matches(COMPOSER_SEAT_SELECTOR)) return element;
			return element.querySelector(COMPOSER_SEAT_SELECTOR);
		}
		function activeSeatOf(scrollport) {
			if (phaseRootOf(scrollport)?.dataset.phase !== "active") return null;
			const seat = scrollport.querySelector(COMPOSER_SEAT_SELECTOR);
			if (seat?.hasAttribute(OUTSIDE_CHAT_ATTRIBUTE)) return null;
			return seat;
		}
		function composerBelongsToConversation(root) {
			const phase = root.dataset.phase ?? "";
			if (phase === "hero" || phase === "settling") return true;
			return phase === "active" && root.querySelector(CHAT_FLOW_SELECTOR) !== null;
		}
		function wheelBelongsToNestedSurface(event, scrollport) {
			for (const candidate of event.composedPath()) {
				if (candidate === scrollport) break;
				if (!(candidate instanceof HTMLElement)) continue;
				if (candidate.matches(NESTED_SCROLL_SURFACE_SELECTOR)) return true;
				const style = getComputedStyle(candidate);
				if (!/(auto|scroll)/.test(style.overflowY) || candidate.scrollHeight <= candidate.clientHeight) continue;
				if (event.deltaY < 0 && candidate.scrollTop > 0) return true;
				if (event.deltaY > 0 && candidate.scrollTop + candidate.clientHeight < candidate.scrollHeight) return true;
			}
			return false;
		}
		/**
		* The host composer renders the draft in a capped scroll box
		* (`overflow-y: auto` with `max-height`) inside the seat. A wheel gesture on
		* that box belongs to the draft outright — including once it reaches its edge,
		* where the host forwards the delta to the transcript. Driving the hide state
		* from that forwarded scroll would hide (and blur) the composer whose long
		* draft the user is reading, so such gestures never steer the seat.
		*/
		function wheelTargetsSeatDraft(event) {
			const target = event.target;
			if (!(target instanceof Element)) return false;
			const seat = target.closest(COMPOSER_SEAT_SELECTOR);
			if (seat === null) return false;
			for (const candidate of event.composedPath()) {
				if (candidate === seat) break;
				if (!(candidate instanceof HTMLElement)) continue;
				const style = getComputedStyle(candidate);
				if (!/(auto|scroll)/.test(style.overflowY)) continue;
				if (candidate.scrollHeight > candidate.clientHeight + 1) return true;
			}
			return false;
		}
		/**
		* Own the ORCA composer transition and scroll-intent presentation. This
		* module observes the host's stable data hooks; it never submits prompts or
		* creates sessions itself. The hero exit is driven by the host's own phase
		* change: a press only snapshots the card, and the ghost plays once the host
		* confirms the submit by leaving the hero phase.
		*/
		function installOrcaComposerMotion(body) {
			const doc = body.ownerDocument;
			const timers = /* @__PURE__ */ new Set();
			const phases = /* @__PURE__ */ new WeakMap();
			const scrollBindings = /* @__PURE__ */ new Map();
			let seatGestureUntil = 0;
			let hasSeenHero = false;
			let exitSnapshot = null;
			let exitSnapshotTimer;
			const schedule = (callback, delay) => {
				const timer = setTimeout(() => {
					timers.delete(timer);
					callback();
				}, delay);
				timers.add(timer);
			};
			const motionTimers = /* @__PURE__ */ new WeakMap();
			const markMotion = (seat) => {
				const previous = motionTimers.get(seat);
				if (previous !== void 0) {
					clearTimeout(previous);
					timers.delete(previous);
				}
				seat.setAttribute(MOTION_ATTRIBUTE, "");
				const timer = setTimeout(() => {
					timers.delete(timer);
					motionTimers.delete(seat);
					seat.removeAttribute(MOTION_ATTRIBUTE);
				}, MOTION_LIFETIME_MS);
				timers.add(timer);
				motionTimers.set(seat, timer);
			};
			const removeMotionAttributes = (seat) => {
				seat.removeAttribute(ENTER_ATTRIBUTE);
				seat.removeAttribute(HIDDEN_ATTRIBUTE);
				seat.removeAttribute(INTERACTIVE_ATTRIBUTE);
				seat.removeAttribute(MOTION_ATTRIBUTE);
				seat.removeAttribute(OUTSIDE_CHAT_ATTRIBUTE);
				seat.style.removeProperty("--orca-composer-enter-distance");
			};
			const scrollHideEnabled = () => orcaFeatureEnabled(doc, COMPOSER_SCROLL_HIDE_ATTRIBUTE);
			const blurSeat = (seat) => {
				const active = doc.activeElement;
				if (active instanceof HTMLElement && seat.contains(active)) active.blur();
			};
			const isManualMotion = (seat) => seat.matches("[data-orca-composer-manual-hidden], [data-orca-composer-collapse-dragging], [data-orca-composer-collapse-rebounding], [data-orca-composer-restoring]");
			const showSeat = (seat) => {
				if (isManualMotion(seat)) return;
				if (!seat.hasAttribute(HIDDEN_ATTRIBUTE)) return;
				markMotion(seat);
				seat.removeAttribute(HIDDEN_ATTRIBUTE);
			};
			const hideSeat = (seat) => {
				if (isManualMotion(seat)) return;
				if (!seat.hasAttribute(HIDDEN_ATTRIBUTE)) markMotion(seat);
				seat.removeAttribute(INTERACTIVE_ATTRIBUTE);
				blurSeat(seat);
				seat.removeAttribute(ENTER_ATTRIBUTE);
				seat.setAttribute(HIDDEN_ATTRIBUTE, "");
			};
			const activateSeat = (seat, interruptEntry = false) => {
				if (isManualMotion(seat)) return;
				showSeat(seat);
				if (interruptEntry) seat.removeAttribute(ENTER_ATTRIBUTE);
				seat.setAttribute(INTERACTIVE_ATTRIBUTE, "");
			};
			const enterSeat = (seat) => {
				if (isManualMotion(seat)) return;
				seat.removeAttribute(HIDDEN_ATTRIBUTE);
				const card = seat.querySelector(COMPOSER_CARD_SELECTOR);
				if (card === null) return;
				const top = card.getBoundingClientRect().top;
				seat.style.setProperty("--orca-composer-enter-distance", `${Math.max(0, (doc.defaultView?.innerHeight ?? 0) - top) + 32}px`);
				seat.setAttribute(ENTER_ATTRIBUTE, "");
				schedule(() => {
					seat.removeAttribute(ENTER_ATTRIBUTE);
					seat.style.removeProperty("--orca-composer-enter-distance");
				}, ENTER_LIFETIME_MS);
			};
			const copyLiveFieldValues = (source, clone) => {
				const sourceFields = source.querySelectorAll("input, textarea");
				const cloneFields = clone.querySelectorAll("input, textarea");
				sourceFields.forEach((field, index) => {
					const clonedField = cloneFields.item(index);
					if (clonedField !== null) clonedField.value = field.value;
				});
			};
			const discardExitSnapshot = () => {
				if (exitSnapshotTimer !== void 0) {
					clearTimeout(exitSnapshotTimer);
					timers.delete(exitSnapshotTimer);
					exitSnapshotTimer = void 0;
				}
				exitSnapshot = null;
			};
			/**
			* Snapshot the hero card while it is still on screen. Nothing is hidden and
			* nothing is mounted yet: the snapshot only becomes a ghost once the host
			* actually leaves the hero phase, and it is dropped untouched when the press
			* turned out not to be a submit.
			*/
			const prepareExitGhost = (seat, card) => {
				const rect = card.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) {
					discardExitSnapshot();
					return;
				}
				const ghost = card.cloneNode(true);
				if (!(ghost instanceof HTMLElement)) return;
				copyLiveFieldValues(card, ghost);
				ghost.setAttribute(GHOST_ATTRIBUTE, "");
				ghost.setAttribute("aria-hidden", "true");
				ghost.setAttribute("inert", "");
				ghost.querySelectorAll("[id]").forEach((element) => {
					element.removeAttribute("id");
				});
				ghost.querySelectorAll("button, input, textarea, select, [contenteditable], [tabindex]").forEach((element) => {
					element.tabIndex = -1;
				});
				ghost.style.left = `${rect.left}px`;
				ghost.style.top = `${rect.top}px`;
				ghost.style.width = `${rect.width}px`;
				ghost.style.height = `${rect.height}px`;
				discardExitSnapshot();
				exitSnapshot = {
					seat,
					ghost
				};
				const timer = setTimeout(() => {
					timers.delete(timer);
					exitSnapshotTimer = void 0;
					exitSnapshot = null;
				}, EXIT_SNAPSHOT_LIFETIME_MS);
				exitSnapshotTimer = timer;
				timers.add(timer);
			};
			/**
			* The seat is leaving the hero phase for the active conversation: mount the
			* snapshot where the old card stood so it fades out there while the seat runs
			* its own dock-in animation. Without a snapshot (a phase change nobody
			* pressed for) this is a no-op.
			*/
			const playExitGhost = (seat) => {
				const snapshot = exitSnapshot;
				if (snapshot === null) return;
				if (snapshot.seat !== seat) {
					discardExitSnapshot();
					return;
				}
				const ghost = snapshot.ghost;
				discardExitSnapshot();
				body.append(ghost);
				ghost.addEventListener("animationend", (event) => {
					if (event.target === ghost) ghost.remove();
				});
				schedule(() => {
					ghost.remove();
				}, GHOST_LIFETIME_MS);
			};
			const primaryButtonOf = (card) => {
				const buttons = card.querySelectorAll("button");
				return buttons.item(buttons.length - 1);
			};
			const onKeyDown = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const input = target.closest("[data-composer-input]");
				if (input === null) return;
				const root = phaseRootOf(input);
				if (root?.dataset.phase === "active") {
					const seat = input.closest(COMPOSER_SEAT_SELECTOR);
					if (seat !== null) activateSeat(seat, true);
					return;
				}
				if (root?.dataset.phase !== "hero") return;
				if (event.key !== "Enter" || event.shiftKey || event.repeat || event.isComposing || event.keyCode === 229) return;
				const card = input.closest(COMPOSER_CARD_SELECTOR);
				if (card === null || card.matches("[class*='cardWorkspaceTrigger']")) return;
				const primary = primaryButtonOf(card);
				if (primary === null || primary.disabled) return;
				const seat = input.closest(COMPOSER_SEAT_SELECTOR);
				if (seat !== null) prepareExitGhost(seat, card);
			};
			const onFocusIn = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const seat = target.closest(COMPOSER_SEAT_SELECTOR);
				if (seat !== null && phaseRootOf(seat)?.dataset.phase === "active") activateSeat(seat);
			};
			const onFocusOut = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const seat = target.closest(COMPOSER_SEAT_SELECTOR);
				if (seat === null) return;
				queueMicrotask(() => {
					if (!seat.contains(doc.activeElement)) seat.removeAttribute(INTERACTIVE_ATTRIBUTE);
				});
			};
			const onClick = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const button = target.closest("button");
				const card = button?.closest(COMPOSER_CARD_SELECTOR);
				const root = card === null || card === void 0 ? null : phaseRootOf(card);
				if (button === null || card === null || card === void 0 || root?.dataset.phase !== "hero") return;
				if (button.disabled || primaryButtonOf(card) !== button) return;
				const seat = card.closest(COMPOSER_SEAT_SELECTOR);
				if (seat !== null) prepareExitGhost(seat, card);
			};
			const bindScrollport = (scrollport) => {
				if (scrollBindings.has(scrollport)) return;
				const binding = {
					lastTop: null,
					dispose: () => {}
				};
				const onWheel = (event) => {
					if (!scrollHideEnabled()) return;
					if (wheelTargetsSeatDraft(event)) {
						seatGestureUntil = Date.now() + SEAT_GESTURE_WINDOW_MS;
						return;
					}
					if (wheelBelongsToNestedSurface(event, scrollport)) return;
					if (binding.lastTop === null) binding.lastTop = scrollport.scrollTop;
					const seat = activeSeatOf(scrollport);
					if (seat === null || Math.abs(event.deltaY) <= SCROLL_THRESHOLD) return;
					if (event.deltaY < 0) hideSeat(seat);
					else showSeat(seat);
				};
				const onScroll = () => {
					const top = scrollport.scrollTop;
					const previousTop = binding.lastTop;
					binding.lastTop = top;
					if (!scrollHideEnabled()) return;
					const seat = activeSeatOf(scrollport);
					if (seat !== null) {
						if (Date.now() < seatGestureUntil) return;
						if (scrollport.scrollHeight - top - scrollport.clientHeight <= BOTTOM_THRESHOLD) showSeat(seat);
						else if (previousTop !== null && top > previousTop + SCROLL_THRESHOLD) showSeat(seat);
						else if (previousTop !== null && top < previousTop - SCROLL_THRESHOLD) hideSeat(seat);
					}
				};
				scrollport.addEventListener("wheel", onWheel, { passive: true });
				scrollport.addEventListener("scroll", onScroll, { passive: true });
				binding.dispose = () => {
					scrollport.removeEventListener("wheel", onWheel);
					scrollport.removeEventListener("scroll", onScroll);
				};
				scrollBindings.set(scrollport, binding);
			};
			const synchronize = () => {
				doc.querySelectorAll(SCROLLPORT_SELECTOR).forEach((scrollport) => {
					bindScrollport(scrollport);
					const root = phaseRootOf(scrollport);
					if (root === null) return;
					const phase = root.dataset.phase ?? "";
					const previous = phases.get(root);
					phases.set(root, phase);
					if (phase === "hero") hasSeenHero = true;
					const seat = seatOf(root);
					if (seat === null) return;
					if (previous === "hero" && phase !== "hero" || previous === void 0 && hasSeenHero && phase !== "hero") playExitGhost(seat);
					const wasOutsideChat = seat.hasAttribute(OUTSIDE_CHAT_ATTRIBUTE);
					const belongsToConversation = composerBelongsToConversation(root);
					seat.toggleAttribute(OUTSIDE_CHAT_ATTRIBUTE, !belongsToConversation);
					if (!belongsToConversation) {
						seat.removeAttribute(ENTER_ATTRIBUTE);
						seat.removeAttribute(INTERACTIVE_ATTRIBUTE);
						blurSeat(seat);
						return;
					}
					if (phase === "active") {
						if (wasOutsideChat || previous === "hero" || previous === "settling" || previous === void 0 && hasSeenHero) enterSeat(seat);
					} else {
						if (!seat.hasAttribute("data-orca-composer-manual-hidden")) seat.removeAttribute(HIDDEN_ATTRIBUTE);
						if (phase === "hero") seat.removeAttribute(ENTER_ATTRIBUTE);
					}
				});
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) synchronize();
			});
			observer.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-phase"]
			});
			const disposeScrollHideSwitch = observeOrcaFeature(doc, [COMPOSER_SCROLL_HIDE_ATTRIBUTE], () => {
				if (scrollHideEnabled()) return;
				scrollBindings.forEach((_, scrollport) => {
					const seat = activeSeatOf(scrollport);
					if (seat !== null) showSeat(seat);
				});
			});
			doc.addEventListener("keydown", onKeyDown, true);
			doc.addEventListener("click", onClick, true);
			doc.addEventListener("focusin", onFocusIn, true);
			doc.addEventListener("focusout", onFocusOut, true);
			synchronize();
			return () => {
				observer.disconnect();
				disposeScrollHideSwitch();
				doc.removeEventListener("keydown", onKeyDown, true);
				doc.removeEventListener("click", onClick, true);
				doc.removeEventListener("focusin", onFocusIn, true);
				doc.removeEventListener("focusout", onFocusOut, true);
				scrollBindings.forEach((binding) => {
					binding.dispose();
				});
				scrollBindings.clear();
				discardExitSnapshot();
				timers.forEach((timer) => {
					clearTimeout(timer);
				});
				timers.clear();
				doc.querySelectorAll(COMPOSER_SEAT_SELECTOR).forEach(removeMotionAttributes);
				doc.querySelectorAll(`[${GHOST_ATTRIBUTE}]`).forEach((ghost) => {
					ghost.remove();
				});
			};
		}
		//#endregion
		//#region src/client/headline-typewriter.ts
		const HEADLINE_SELECTOR = "[data-phase='hero'] [class*='titleGroup'] > span:not([class*='previewBadge'])";
		const TYPE_DELAY_MS = 105;
		const DELETE_DELAY_MS = 55;
		const OPEN_DELAY_MS = 320;
		const SEGMENT_GAP_MS = 420;
		const GROUP_GAP_MS = 640;
		const GROUP_HOLD_MS = 2e4;
		const HEADLINE_GROUPS = [["如切如磋，如琢如磨"], ["不诱于誉，不恐于诽", "率道而行，端然正己"]];
		function splitGraphemes(value) {
			if (typeof Intl.Segmenter === "function") {
				const segmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
				return Array.from(segmenter.segment(value), ({ segment }) => segment);
			}
			return Array.from(value);
		}
		function shuffledGroupOrder(previousGroup, groupCount) {
			const order = Array.from({ length: groupCount }, (_, index) => index);
			for (let index = order.length - 1; index > 0; index -= 1) {
				const target = Math.floor(Math.random() * (index + 1));
				[order[index], order[target]] = [order[target], order[index]];
			}
			if (order.length > 1 && order[0] === previousGroup) [order[0], order[1]] = [order[1], order[0]];
			return order;
		}
		function installOrcaHeadlineTypewriter(body) {
			const timers = /* @__PURE__ */ new Set();
			const reducedMotion = body.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
			let headline = null;
			let originalText = "";
			let renderedText = "";
			let generation = 0;
			let headlineGroups = HEADLINE_GROUPS;
			let groupOrder = [];
			let previousGroup = -1;
			const clearTimers = () => {
				timers.forEach((timer) => clearTimeout(timer));
				timers.clear();
			};
			const schedule = (callback, delay, token = generation) => {
				const timer = setTimeout(() => {
					timers.delete(timer);
					if (token === generation && headline?.isConnected) callback();
				}, delay);
				timers.add(timer);
			};
			const render = (value) => {
				renderedText = value;
				if (headline) headline.textContent = value;
			};
			const typeText = (value, complete) => {
				if (reducedMotion) {
					render(value);
					complete();
					return;
				}
				const graphemes = splitGraphemes(value);
				let length = 0;
				const typeNext = () => {
					length += 1;
					render(graphemes.slice(0, length).join(""));
					if (length < graphemes.length) schedule(typeNext, TYPE_DELAY_MS);
					else complete();
				};
				typeNext();
			};
			const deleteText = (complete) => {
				if (reducedMotion) {
					render("");
					complete();
					return;
				}
				const graphemes = splitGraphemes(renderedText);
				let length = graphemes.length;
				const deleteNext = () => {
					length -= 1;
					render(graphemes.slice(0, length).join(""));
					if (length > 0) schedule(deleteNext, DELETE_DELAY_MS);
					else complete();
				};
				schedule(deleteNext, DELETE_DELAY_MS);
			};
			const takeNextGroup = () => {
				if (groupOrder.length === 0) groupOrder = shuffledGroupOrder(previousGroup, headlineGroups.length);
				return groupOrder.shift() ?? 0;
			};
			const playNextGroup = () => {
				const groupIndex = takeNextGroup();
				const group = headlineGroups[groupIndex];
				const segmentHold = GROUP_HOLD_MS / group.length;
				const playSegment = (segmentIndex) => {
					typeText(group[segmentIndex], () => {
						schedule(() => {
							deleteText(() => {
								if (segmentIndex + 1 < group.length) {
									schedule(() => playSegment(segmentIndex + 1), SEGMENT_GAP_MS);
									return;
								}
								previousGroup = groupIndex;
								schedule(playNextGroup, GROUP_GAP_MS);
							});
						}, segmentHold);
					});
				};
				playSegment(0);
			};
			const start = (element) => {
				clearTimers();
				generation += 1;
				headline = element;
				originalText = element.textContent ?? "";
				headlineGroups = originalText === "" ? HEADLINE_GROUPS : [[originalText], ...HEADLINE_GROUPS];
				groupOrder = [];
				previousGroup = -1;
				element.dataset.orcaHeadlineTypewriter = "";
				render("");
				schedule(playNextGroup, OPEN_DELAY_MS);
			};
			const stop = (restore) => {
				clearTimers();
				generation += 1;
				if (headline) {
					headline.removeAttribute("data-orca-headline-typewriter");
					if (restore && headline.isConnected) headline.textContent = originalText;
				}
				headline = null;
				renderedText = "";
			};
			const sync = () => {
				const found = orcaFeatureEnabled(body.ownerDocument, "data-dsh-whale-orca-headline-typewriter") ? body.querySelector(HEADLINE_SELECTOR) : null;
				if (found !== headline) {
					stop(true);
					if (found) start(found);
					return;
				}
				if (headline && headline.textContent !== renderedText) {
					const externalText = headline.textContent ?? "";
					if (externalText !== "") {
						originalText = externalText;
						headlineGroups = [[originalText], ...HEADLINE_GROUPS];
					}
					clearTimers();
					generation += 1;
					render("");
					schedule(playNextGroup, OPEN_DELAY_MS);
				}
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) sync();
			});
			observer.observe(body, {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true
			});
			const disposeSwitch = observeOrcaFeature(body.ownerDocument, [HEADLINE_TYPEWRITER_ATTRIBUTE], sync);
			sync();
			return () => {
				observer.disconnect();
				disposeSwitch();
				stop(true);
			};
		}
		//#endregion
		//#region src/client/icons.ts
		/**
		* ORCA LINK icon redraw: every host UI glyph is redrawn in the skin's
		* rectilinear line language — square outlines, mitre joins, square caps,
		* straight segments only (45-degree chevrons are the sole concession to
		* direction marks). Host SVG nodes are never destroyed: the matching icon
		* keeps its element, sizing, attributes and React ownership, gains a
		* `data-orca-link-icon` marker, and receives one appended
		* `data-orca-link-icon-art` group drawn in a 16-unit design grid fitted
		* (uniform scale, centered) to the host viewBox. The stylesheet hides the
		* original children while the skin is active, so teardown is just removing
		* the art groups.
		*
		* Keys are distinctive fragments of the host path data as rendered by
		* @deepseek-ai/dsh-client-ui-primitives (verified against that package's
		* icons/index.tsx at c36a83ff6bb9, including its Regular/Medium variants).
		* Unmatched drawings, such as the brand wordmark and hero artwork, keep
		* their host geometry.
		*/
		const SVG_NS = "http://www.w3.org/2000/svg";
		const ICON_ATTRIBUTE = "data-orca-link-icon";
		const ICON_ART_ATTRIBUTE = "data-orca-link-icon-art";
		/**
		* Rectilinear icon art on a 16x16 design grid. Group defaults: stroke
		* currentColor, square caps, mitre joins; filled shapes opt out explicitly.
		*/
		const ICON_ART = {
			"panel-collapse": [
				"<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>",
				"<path d=\"M2.25 2.25h3.75v11.5H2.25z\" fill=\"currentColor\" stroke=\"none\"/>",
				"<path d=\"M11.75 8H7.75M9.75 5.5 7.25 8l2.5 2.5\"/>"
			].join(""),
			"new-session": ["<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>", "<path d=\"M8 5.25v5.5M5.25 8h5.5\"/>"].join(""),
			search: ["<path d=\"M2.25 2.25h7.5v7.5h-7.5z\"/>", "<path d=\"M10.25 10.25 13.75 13.75\"/>"].join(""),
			sliders: ["<path d=\"M2 4.75h12M2 8h12M2 11.25h12\"/>", "<path d=\"M4.75 4h2.5v1.5h-2.5zM8.75 7.25h2.5v1.5h-2.5zM6.25 10.5h2.5v1.5h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			"folder-closed": ["<path d=\"M2 3.5h4.25L8 5.25h6v8.25H2z\"/>", "<path d=\"M4 8h8\"/>"].join(""),
			"folder-open": [
				"<path d=\"M2 6V3.5h4.25L8 5.25h6V7\"/>",
				"<path d=\"M2.5 7h11.75l-2 6.5H1.75z\"/>",
				"<path d=\"M5 10.25h6\"/>"
			].join(""),
			"add-workspace": ["<path d=\"M2 3.5h4.25L8 5.25h6V13.5H2z\"/>", "<path d=\"M12.5 1.5v2.25M11.375 2.625h2.25\"/>"].join(""),
			gear: [
				"<path d=\"M4.75 4.75h6.5v6.5h-6.5z\"/>",
				"<path d=\"M6.5 2.25h3v2.5h-3zM6.5 11.25h3v2.5h-3zM2.25 6.5h2.5v3h-2.5zM11.25 6.5h2.5v3h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>",
				"<path d=\"M7 7h2v2H7z\" fill=\"currentColor\" stroke=\"none\"/>"
			].join(""),
			sparkle: ["<path d=\"M8 1.5v3.25M8 11.25v3.25M1.5 8h3.25M11.25 8h3.25\"/>", "<path d=\"M6.5 6.5h3v3h-3z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			wrench: [
				"<g transform=\"rotate(-45 8 8)\">",
				"<path d=\"M8 4.75v6.5\"/>",
				"<path d=\"M6 2.5v2.25h4V2.5\"/>",
				"<path d=\"M6 13.5v-2.25h4V13.5\"/>",
				"</g>"
			].join(""),
			data: ["<rect x=\"2.5\" y=\"2.5\" width=\"11\" height=\"4\"/>", "<rect x=\"2.5\" y=\"9\" width=\"11\" height=\"4\"/>"].join(""),
			database: ["<path d=\"M3.5 2h9v12h-9z\"/>", "<path d=\"M3.5 6h9M3.5 10h9\"/>"].join(""),
			gauge: [
				"<path d=\"M2.5 12.25V2.75h11v9.5\"/>",
				"<path d=\"M8 9 11.25 5.75\"/>",
				"<path d=\"M7 8h2v2H7z\" fill=\"currentColor\" stroke=\"none\"/>"
			].join(""),
			clock: ["<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>", "<path d=\"M8 8V4.5M8 8h3.5\"/>"].join(""),
			sun: ["<path d=\"M6.5 1.5h3v2h3v3h2v3h-2v3h-3v2h-3v-2h-3v-3h-2v-3h2v-3h3z\"/>"].join(""),
			moon: ["<path fill-rule=\"evenodd\" d=\"M2.5 2.5h11v11h-11zM8.75 2.5h4.75v4.75z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			monitor: ["<path d=\"M1.75 2.75h12.5v8.75H1.75z\"/>", "<path d=\"M8 11.5v1.5M5.25 13.25h5.5\"/>"].join(""),
			"agent-preset": ["<path d=\"M6.75 1.75h2.5v2.5h-2.5zM1.75 11.75h2.5v2.5h-2.5zM11.75 11.75h2.5v2.5h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>", "<path d=\"M8 4.25 3 11.75M8 4.25l5 7.5\"/>"].join(""),
			plus: ["<path d=\"M8 1.75v12.5M1.75 8h12.5\"/>"].join(""),
			check: ["<path d=\"M3 8.5 6.5 12 13 4.5\"/>"].join(""),
			shield: ["<path d=\"M8 1.75 13.75 3.6v3.65c0 4.1-2.9 5.9-5.75 7-2.85-1.1-5.75-2.9-5.75-7V3.6z\"/>", "<path d=\"M5.6 7.9l1.7 1.7 3.1-3.4\"/>"].join(""),
			"permission-read": [
				"<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>",
				"<path d=\"M4.5 5.25h7M4.5 8h7M4.5 10.75h4.25\"/>",
				"<path d=\"M10.25 10.25h1.5v1.5h-1.5z\" fill=\"currentColor\" stroke=\"none\"/>"
			].join(""),
			"permission-write": [
				"<path d=\"M2.25 3.25h4.25L8 4.75h5.75v4.5\"/>",
				"<path d=\"M2.25 3.25v10.5h6\"/>",
				"<path d=\"M8.25 12.5 12 8.75l1.75 1.75L10 14.25H8.25z\"/>",
				"<path d=\"m11.75 9 1.75 1.75\"/>"
			].join(""),
			"permission-full": ["<path d=\"M2.25 6V2.25H6M10 2.25h3.75V6M13.75 10v3.75H10M6 13.75H2.25V10\"/>", "<path d=\"M5.75 5.75h4.5v4.5h-4.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			send: ["<path d=\"M8 12.5V2.75M3.75 7 8 2.75 12.25 7\"/>", "<path d=\"M4 13.75h8\"/>"].join(""),
			close: ["<path d=\"M3.75 3.75l8.5 8.5M12.25 3.75l-8.5 8.5\"/>"].join(""),
			"chevron-down": ["<path d=\"M3.75 5.5 8 9.75 12.25 5.5\"/>"].join(""),
			"chevron-up": ["<path d=\"M3.75 10.25 8 6l4.25 4.25\"/>"].join(""),
			"chevron-left": ["<path d=\"M10.25 3.75 5.75 8l4.5 4.25\"/>"].join(""),
			"chevron-right": ["<path d=\"M5.75 3.75 10.25 8l-4.5 4.25\"/>"].join(""),
			"caret-right": ["<path d=\"M4.5 3 11.75 8 4.5 13z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			ellipsis: ["<path d=\"M2.25 6.5h3v3h-3zM6.5 6.5h3v3h-3zM10.75 6.5h3v3h-3z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			think: ["<path d=\"M2.25 2.75h11.5v8.25H6.75L4 13.75V11H2.25z\"/>", "<path d=\"M4 6h2v2H4zM7 6h2v2H7zM10 6h2v2h-2z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			"context-injection": [
				"<path d=\"M5.25 2.5h5.5\"/>",
				"<path d=\"M8 2.5v2.25\"/>",
				"<path d=\"M5 4.75h6v7.5H5z\"/>",
				"<path d=\"M6.25 10.5h3.5v1.75h-3.5z\" fill=\"currentColor\" stroke=\"none\"/>",
				"<path d=\"M8 12.25v2.25\"/>"
			].join(""),
			terminal: ["<path d=\"M1.75 2.5h12.5v11H1.75z\"/>", "<path d=\"M4 6.5 6.25 8.75 4 11M8.75 11h3.5\"/>"].join(""),
			globe: ["<path d=\"M2.5 2.5h11v11h-11z\"/>", "<path d=\"M2.5 8h11M8 2.5v11\"/>"].join(""),
			copy: ["<path d=\"M5.5 5.5h8v8h-8z\"/>", "<path d=\"M10.5 2.5h-8v8\"/>"].join(""),
			edit: ["<path d=\"M2.5 13.5l.8-3.2 7.3-7.3 2.4 2.4-7.3 7.3z\"/>", "<path d=\"M2.5 13.5l.8-3.2 2.4 2.4z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			"thumb-up": ["<path d=\"M2.25 6.75h2.5v7h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>", "<path d=\"M6 13.75V7.6L8.7 3.2l1.8 1-1.6 3.4h4.35v3.15l-1.2 3z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			"thumb-down": [
				"<g transform=\"rotate(180 8 8)\">",
				"<path d=\"M2.25 6.75h2.5v7h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>",
				"<path d=\"M6 13.75V7.6L8.7 3.2l1.8 1-1.6 3.4h4.35v3.15l-1.2 3z\" fill=\"currentColor\" stroke=\"none\"/>",
				"</g>"
			].join(""),
			branch: ["<path d=\"M4.5 3.75v8.5M4.5 8h7v4.25\"/>", "<path d=\"M3.25 1.25h2.5v2.5h-2.5zM3.25 12.25h2.5v2.5h-2.5zM10.25 12.25h2.5v2.5h-2.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			refresh: ["<path d=\"M2.5 13.25V4.5L4.75 2.25h6.5L13.5 4.5v4\"/>", "<path d=\"M12.25 7.25 13.5 8.5 14.75 7.25\"/>"].join(""),
			loading: ["<path d=\"M8 2.25H2.25v11.5h11.5V8\"/>"].join(""),
			code: ["<path d=\"M6.5 2.5 5 13.5M11.5 2.5 10 13.5M2.5 6.25h11M2 10h11\"/>"].join(""),
			browse: ["<path d=\"M2.25 2.5h11.5v11H2.25z\"/>", "<path d=\"M4.75 5.75h6.5M4.75 8.75h4.5\"/>"].join(""),
			queue: ["<path d=\"M2.25 2.5h11.5v8.25H8.6l-3.1 2.75v-2.75H2.25z\"/>", "<path d=\"M5 5.25h6M5 7.75h6\"/>"].join(""),
			trash: ["<path d=\"M2.25 3.75h11.5M6.25 3.5V2.25h3.5V3.5\"/>", "<path d=\"M4 3.75v10.25h8V3.75M6.75 6.75v4.5M9.25 6.75v4.5\"/>"].join(""),
			warning: [
				"<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>",
				"<path d=\"M8 5v3.5\"/>",
				"<path d=\"M7.375 10h1.25v1.25h-1.25z\" fill=\"currentColor\" stroke=\"none\"/>"
			].join(""),
			user: ["<path d=\"M6.25 2.25h3.5v3.5h-3.5z\" fill=\"currentColor\" stroke=\"none\"/>", "<path d=\"M2.5 13.75v-2l1.75-2.5h7.5l1.75 2.5v2\"/>"].join(""),
			users: [
				"<path d=\"M4.25 2.75h3.5v3.5h-3.5z\" fill=\"currentColor\" stroke=\"none\"/>",
				"<path d=\"M1.25 13.75v-2l1.5-2.25h6.5l1.5 2.25v2\"/>",
				"<path d=\"M10.25 3h3v3h-3M12 9.5l1.25 2v2.25\"/>"
			].join(""),
			stop: ["<path d=\"M3.75 3.75h8.5v8.5h-8.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			paperclip: ["<path d=\"M12 4.25v6.5a2.75 2.75 0 0 1-5.5 0V4.25a1.5 1.5 0 0 1 3 0v6.5\" transform=\"rotate(-45 8 8)\"/>"].join(""),
			command: ["<path d=\"M4.5 4.5 8 8l-3.5 3.5M8.75 11.5h4\"/>"].join(""),
			download: ["<path d=\"M8 2.25v7.5M5.25 7 8 9.75 10.75 7\"/>", "<path d=\"M2.5 11.25v2.5h11v-2.5\"/>"].join(""),
			share: ["<path d=\"M2.5 8h9.75M9 4.75 12.75 8 9 11.25\"/>"].join(""),
			"right-up": ["<path d=\"M3 13.25 13.25 3M6.5 3h6.75v6.75\"/>"].join(""),
			enhance: ["<path d=\"M2 2.75h12M2 6.75h12M2 10.75h12M2 14h8.5\"/>"].join(""),
			link: ["<path d=\"M5.25 5.25h5.5v5.5h-5.5z\"/>", "<path d=\"M2.5 8.25V2.5h5.75M7.75 13.5h5.75V7.75\"/>"].join(""),
			play: ["<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>", "<path d=\"M6.75 5.5 10.75 8l-4 2.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			pause: ["<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>", "<path d=\"M5.75 5h1.5v6h-1.5zM8.75 5h1.5v6h-1.5z\" fill=\"currentColor\" stroke=\"none\"/>"].join(""),
			fullscreen: ["<path d=\"M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4\"/>"].join(""),
			checklist: ["<path d=\"M2 2h3.5v3.5H2zM2 10h3.5v3.5H2z\"/>", "<path d=\"M7.5 3.75h6M7.5 11.75h6\"/>"].join(""),
			"list-pen": [
				"<path d=\"M2.25 2h8L13.5 5.25V7.5\"/>",
				"<path d=\"M4.75 5.5h6M4.75 9h4.5\"/>",
				"<path d=\"M8.5 13.75 12.75 9.5l1.5 1.5-4.25 4.25H8.5z\"/>"
			].join(""),
			goal: [
				"<path d=\"M2.5 2.5h11v11h-11z\"/>",
				"<path d=\"M6 6h4v4H6z\"/>",
				"<path d=\"M13.75 2.25 8.5 7M11 7.5H8.5V5\"/>"
			].join(""),
			inspect: ["<path d=\"M6.25 4.75 2.75 8l3.5 3.25M9.75 4.75 13.25 8l-3.5 3.25M10 2.5 6 13.5\"/>"].join(""),
			skill: [
				"<path d=\"M2.25 1.75h8L13.5 5v9.25H2.25z\"/>",
				"<path d=\"M4.75 5.75h5.5M4.75 8.75h5.5\"/>",
				"<path d=\"M9.75 10.75v3M8.25 12.25h3\"/>"
			].join(""),
			question: [
				"<path d=\"M2.25 2.25h11.5v11.5H2.25z\"/>",
				"<path d=\"M5.25 4.75h5.5v3H8.5v1.5\"/>",
				"<path d=\"M7.375 10.75h1.25v1.25h-1.25z\" fill=\"currentColor\" stroke=\"none\"/>"
			].join(""),
			archive: ["<path d=\"M1.75 1.75h12.5V5H1.75zM2.75 5v9.25h10.5V5\"/>", "<path d=\"M5.75 8h4.5v2.5h-4.5z\"/>"].join(""),
			"alarm-clock": ["<path d=\"M3.5 4h9v9h-9zM2 3l2-2M12 1l2 2M5 13l-1 2M11 13l1 2M8 6v3h2\"/>"].join(""),
			"archive-check": ["<path d=\"M1.75 2h12.5v3H1.75zM2.75 5v9h10.5V5M5 9l2 2 4-4\"/>"].join(""),
			"check-circle": ["<path d=\"M2.25 2.25h11.5v11.5H2.25zM4.5 8l2.5 2.5 4.5-5\"/>"].join(""),
			"chevrons-up-down": ["<path d=\"M4.5 6 8 2.5 11.5 6M4.5 10 8 13.5 11.5 10\"/>"].join(""),
			"close-circle": ["<path d=\"M2.25 2.25h11.5v11.5H2.25zM5.5 5.5l5 5M10.5 5.5l-5 5\"/>"].join(""),
			compact: ["<path d=\"M2 2.5h12v11H2zM4 5l3 3-3 3M12 5 9 8l3 3\"/>"].join(""),
			"compare-split": ["<path d=\"M1.75 2.25h4.5v11.5h-4.5zM9.75 2.25h4.5v11.5h-4.5z\"/>"].join(""),
			plugin: ["<path d=\"M4.75 4.75h6.5v6.5h-6.5zM6.5 1.5v3.25M9.5 1.5v3.25M6.5 11.25v3.25M9.5 11.25v3.25M1.5 6.5h3.25M1.5 9.5h3.25M11.25 6.5h3.25M11.25 9.5h3.25\"/>"].join(""),
			"deliver-doc": ["<path d=\"M3 1.75h7L13 4.75v9.5H3zM9.5 1.75V5H13M5 7h4M5 10l2 2 4-4\"/>"].join(""),
			"flat-list": ["<path d=\"M6 3.5h8M6 8h8M6 12.5h8M2 2.5h2v2H2zM2 7h2v2H2zM2 11.5h2v2H2z\"/>"].join(""),
			info: ["<path d=\"M2.25 2.25h11.5v11.5H2.25zM8 7v4M7 4.5h2\"/>"].join(""),
			microphone: ["<path d=\"M5.5 1.75h5v8h-5zM2.5 7.5v4h11v-4M8 11.5v3M5.5 14.5h5\"/>"].join(""),
			nowrap: ["<path d=\"M2 2v12M14 2v12M4 5h6M4 8h8M9.5 5.5 12 8l-2.5 2.5M4 11h3\"/>"].join(""),
			"paper-plane": ["<path d=\"M1.75 6.75 14.25 1.75 9.25 14.25 6.75 9.25zM6.75 9.25l7.5-7.5\"/>"].join(""),
			pin: ["<path d=\"M5 1.75h6V4l-1 1v3l2.5 2v1H3.5v-1L6 8V5L5 4zM8 11v3.5\"/>"].join(""),
			"pin-filled": ["<path d=\"M5 1.75h6V4l-1 1v3l2.5 2v1H3.5v-1L6 8V5L5 4z\" fill=\"currentColor\"/>", "<path d=\"M8 11v3.5\"/>"].join(""),
			"plugin-pinwheel": ["<path d=\"M6.5 6.5h3v3h-3zM6.5 6.5V2h6v4.5h-3M9.5 9.5V14h-6V9.5h3M6.5 9.5H2v-6h4.5M9.5 6.5H14v6H9.5\"/>"].join(""),
			"sliders-two": ["<path d=\"M2 5h5M10 5h4M2 11h3M8 11h6M7 3.5h3v3H7zM5 9.5h3v3H5z\"/>"].join(""),
			"tree-corner": ["<path d=\"M.5 0V10h8\"/>"].join(""),
			unarchive: ["<path d=\"M1.75 2h12.5v3H1.75zM2.75 5v9h10.5V5M8 12V7M5.5 9.5 8 7l2.5 2.5\"/>"].join(""),
			"warning-triangle": ["<path d=\"M8 1.75 14.25 13.5H1.75zM8 6v3M8 10.5v1\"/>"].join(""),
			"workspace-tree": ["<path d=\"M1.75 2.25h12.5v11.5H1.75zM4.5 5v6h7M4.5 8h7M8 8v3\"/>"].join(""),
			wrap: ["<path d=\"M2 2v12M14 2v12M4 5h6v5H6M8 8l-2 2 2 2\"/>"].join(""),
			"wrap-lines": ["<path d=\"M2 3h12M2 7h12v5H8M10 10l-2 2 2 2M2 11h3\"/>"].join(""),
			"dock-center": ["<path d=\"M1.75 2.25h12.5v11.5H1.75z\"/><path d=\"M4 4.5h8v7H4z\" fill=\"currentColor\"/>"].join(""),
			"dock-left": ["<path d=\"M1.75 2.25h12.5v11.5H1.75z\"/><path d=\"M1.75 2.25H8v11.5H1.75z\" fill=\"currentColor\"/>"].join(""),
			"dock-right": ["<path d=\"M1.75 2.25h12.5v11.5H1.75z\"/><path d=\"M8 2.25h6.25v11.5H8z\" fill=\"currentColor\"/>"].join(""),
			"dock-top": ["<path d=\"M1.75 2.25h12.5v11.5H1.75z\"/><path d=\"M1.75 2.25h12.5V8H1.75z\" fill=\"currentColor\"/>"].join(""),
			"dock-bottom": ["<path d=\"M1.75 2.25h12.5v11.5H1.75z\"/><path d=\"M1.75 8h12.5v5.75H1.75z\" fill=\"currentColor\"/>"].join(""),
			"sandbox-on": ["<path d=\"M2.5 2.5h11v8L8 14l-5.5-3.5zM5 7.5l2 2 4-4\"/>"].join(""),
			"sandbox-off": ["<path d=\"M2.5 2.5h11v8L8 14l-5.5-3.5zM5.5 5.5l5 5M10.5 5.5l-5 5\"/>"].join(""),
			usage: ["<rect x=\"2.5\" y=\"2.5\" width=\"11\" height=\"11\"/>"].join("")
		};
		/**
		* Context-usage gauge: a 6x6 pixel field inside the frame. Cells light up
		* one by one from the bottom-left, left to right per row, row by row
		* upward — solid blue for filled levels, the boundary cell fading in with
		* the fractional remainder, empties kept as a faint grid.
		*/
		const USAGE_CELLS = 36;
		const USAGE_COLS = 6;
		const USAGE_CELL_SIZE = 1;
		const USAGE_PITCH = 1.5;
		const USAGE_X0 = 3.75;
		const USAGE_EMPTY_OPACITY = .12;
		const USAGE_MIN_PARTIAL = .28;
		function buildUsageCells() {
			const cells = document.createElementNS(SVG_NS, "g");
			for (let index = 0; index < USAGE_CELLS; index++) {
				const rect = document.createElementNS(SVG_NS, "rect");
				const col = index % USAGE_COLS;
				const row = Math.floor(index / USAGE_COLS);
				rect.setAttribute("data-orca-link-usage-cell", String(index));
				rect.setAttribute("x", String(USAGE_X0 + col * USAGE_PITCH));
				rect.setAttribute("y", String(11.25 - row * USAGE_PITCH));
				rect.setAttribute("width", String(USAGE_CELL_SIZE));
				rect.setAttribute("height", String(USAGE_CELL_SIZE));
				rect.setAttribute("fill", "var(--orca-blue, currentColor)");
				rect.setAttribute("stroke", "none");
				rect.setAttribute("opacity", String(USAGE_EMPTY_OPACITY));
				cells.append(rect);
			}
			return cells;
		}
		/** Target glyph fragments from DSH 0.1.7-alpha.1 (c36a83ff6bb9), plus the
		* keys marked "(0.1.7)" taken from the 0.1.7-rc.2 ui-primitives icons (the
		* clock, user and users artwork changed or first appeared there; the
		* tests/fixtures alpha.1 set still holds their older drawings, kept as the
		* "(<= 0.1.6)" keys).
		* Shared contours are keyed by their distinguishing drawing, not the frame.
		* Full alpha.1 target SVGs, including inline controls, live in tests/fixtures. */
		const ICON_KEYS = [
			["d=\"M6.51867 12.3282C7.29816", "agent-preset"],
			["d=\"M4.09372 11.9895L3.11865", "alarm-clock"],
			["d=\"M9 12H13\"", "terminal"],
			["d=\"M2.95 5.7v4.8a2.9 2.9 0 ", "archive-check"],
			["d=\"M6.5 9.5H9.5\"", "archive"],
			["d=\"M1.01503 8.0001L5.6964 8", "branch"],
			["d=\"M12.5 1.32617C13.3039 1.32617 14 1.95171 14 2.77637V13.2246C13.9", "browse"],
			["d=\"M28.1936 14.6936L19.8066", "check-circle"],
			["d=\"M12.5303 6.53027L8.80273", "check-circle"],
			["d=\"M2.25 8.5L5.49732 11.747", "check"],
			["d=\"M7.5 4.5H13.5\"", "checklist"],
			["d=\"M4 6L7.29289 9.29289C7.6", "chevron-down"],
			["d=\"M10 4L6.70711 7.29289C6.", "chevron-left"],
			["d=\"M6 12L9.29289 8.70711C9.", "chevron-right"],
			["d=\"M12 10L8.70711 6.70711C8", "chevron-up"],
			["d=\"m5.1 6 2.9-2.9L10.9 6\"", "chevrons-up-down"],
			["d=\"M8 4V8.5L11.25 10.25\"", "clock"],
			["d=\"M8 4.31V8.46L11 10.08", "clock"],
			["d=\"M15 8A7 7 0 1 1 1 8A7 7 ", "close-circle"],
			["d=\"M3.5 3.5L12.5 12.5\"", "close"],
			["d=\"M2.5 2.5L13.5 13.5\"", "close"],
			["d=\"M2.39868 5.5H14.0681\"", "code"],
			["d=\"M8 1.5C8.85359 1.5 9.698", "compact"],
			["d=\"M6 1.5H2.5C1.94772 1.5 1", "compare-split"],
			["d=\"M8 0.5V7.5\"", "context-injection"],
			["d=\"M11.9792 1.53296C13.36 1", "copy"],
			["d=\"M3.16143 6.59068L1.75205", "plugin"],
			["d=\"M14.1127 8.70663C14.2576", "moon"],
			["d=\"M7.8667 0.349609C8.96906", "data"],
			["d=\"M2 3.80371V11.7848\"", "database"],
			["d=\"M11.8798 9.55347V2.71525", "deliver-doc"],
			["d=\"M2.46302 8.06749L3.60171", "thumb-down"],
			["d=\"M8 1.95317V10.0469\"", "download"],
			["d=\"M8.85596 2.69971H4.19971", "edit"],
			["d=\"M3 9C3.55228 9 4 8.55228", "ellipsis"],
			["d=\"M1.98486 13.0463H8.4627\"", "enhance"],
			["d=\"M6 3.5h7.5M6 8h7.5M6 12.", "flat-list"],
			["d=\"M1.50439 3.11059C1.50439", "folder-closed"],
			["d=\"M2.55912 7.93683C2.67584", "folder-open"],
			["d=\"M12.3994 13.5986H2.04956", "folder-open"],
			["d=\"M5 14.5H11\"", "monitor"],
			["d=\"M2.33154 9.40576V13.1685", "fullscreen"],
			["d=\"M3.4041 13.096C2.49514 1", "gauge"],
			["d=\"M2.34619 8H13.6538\"", "globe"],
			["d=\"M11.5 8C11.5001 8.69227 ", "goal"],
			["d=\"M12.5757 7.00012C12.5757", "info"],
			["d=\"M4.67398 4.25061L1.36094", "inspect"],
			["d=\"M13.3899 8H15.1499\"", "sun"],
			["d=\"M13.537 8.12098L12.3983 ", "thumb-up"],
			["d=\"M6.59961 9.40051C6.82779", "link"],
			["d=\"M8.97212 14.3693C9.17511", "list-pen"],
			["d=\"M12.596 12.596C11.687 13", "loading"],
			["d=\"M2.35 8.675C3.075 11.3 5", "microphone"],
			["d=\"M8 5V11\"", "new-session"],
			["d=\"M12.3535 7.64645C12.5487", "nowrap"],
			["d=\"M5.5 1.5V14.5\"", "panel-collapse"],
			["d=\"M4.74024 9.11029L1.82882", "paper-plane"],
			["d=\"M12.75 4.5V9.5C12.75 10.", "paperclip"],
			["d=\"M6.5 5V11\"", "pause"],
			["d=\"M3.25 7.16357C3.20417 7.", "sliders"],
			["d=\"M9.96976 1.70572L13.1554", "pin"],
			["d=\"M10.3329 7.91346C10.3996", "play"],
			["d=\"M7.84457 5.06199C11.6605", "plugin-pinwheel"],
			["d=\"M8 2V14\"", "plus"],
			["d=\"M5.54492 2.06738C5.91034", "add-workspace"],
			["d=\"M8 10.7416V11.7416\"", "question"],
			["d=\"M5 9H8\"", "queue"],
			["d=\"M14.4999 1.5V5.1H10.8999\"", "refresh"],
			["d=\"M11.7256 2.77441C12.5538", "right-up"],
			["d=\"M6.58727 11.8586C9.55061", "search"],
			["d=\"M6.97211 1.94476C7.55785", "send"],
			["d=\"M8 9.75012C8.9665 9.7501", "gear"],
			["d=\"M14.1256 7.58723C14.3483", "share"],
			["<path d=\"M6.80132 2.14853C7.70663 1.80917 8.70422 1.80919 9.60952 2.14859L14.1296 3.84317V7.11961C14.1296 11.6089 10.7615 13.5975 8.20543 14.5779C5.64931 13.5975 2.28052 11.6089 2.28052 7.11961V3.84317L6.80132 2.14853Z\" stroke=\"currentColor\" stroke-linejoin=\"round\">", "shield"],
			["d=\"M12.1404 1.19446C12.9442", "skill"],
			["d=\"M2.3 11h1.65M7.85 11h5.8", "sliders-two"],
			["d=\"M5.875 3C5.875 6.33333 7", "sparkle"],
			["d=\"M12.5 2.5H3.5C2.94772 2.", "stop"],
			["d=\"M10.7554 5.24466C13.9891", "think"],
			["d=\"M5.41602 3.88833V2.47962", "trash"],
			["d=\"M0.5 0V7C0.5 7.79565 0.8", "tree-corner"],
			["d=\"M5.5 4.5C5.5 4.40714 5.5", "caret-right"],
			["d=\"M15.8659 2.05975C17.2603", "unarchive"],
			["d=\"M8 8.5C9.65685 8.5 11 7.", "user"],
			["d=\"M8 8.25C9.51878 8.25 10.75 7.01878 10.75", "user"],
			["d=\"M6 8.25C7.51878 8.25 8.75 7.01878 8.75", "users"],
			["d=\"M8 10.708V11.708\"", "warning"],
			["d=\"M8 6v3m0 2.33h.01\"", "warning-triangle"],
			["d=\"M8.7 8.1v3M11.2 8.1v3\"", "workspace-tree"],
			["d=\"M10.9999 8C10.9999 6.895", "wrap"],
			["d=\"M2.3457 11.7369H6.4849\"", "wrap-lines"],
			["d=\"M8 4.39209V9.89209\"", "permission-full"],
			["d=\"M5.08545 8.13775L7.18455", "permission-read"],
			["d=\"M6.4209 1.68067C7.43922 ", "permission-write"],
			["d=\"M8.3125 0.980183C8.66767", "send"],
			["<rect x=\"3\" y=\"3\" width=\"10\" height=\"10\" rx=\"3\" fill=\"currentColor\">", "stop"],
			["d=\"M8 1.5V14.5\"", "compare-split"],
			["d=\"M4.56 3.48H11.44A1.6 1.6", "dock-center"],
			["d=\"M4 0.523H8V15.477H4A4 4 ", "dock-left"],
			["d=\"M8 0.523H12A4 4 0 0 1 16", "dock-right"],
			["d=\"M0 8V4.523A4 4 0 0 1 4 0", "dock-top"],
			["d=\"M0 8H16V11.477A4 4 0 0 1", "dock-bottom"],
			["d=\"M12.1654 5.7552L8.9447 9", "sandbox-on"],
			["d=\"M10.6074 4.40278L8.00975", "sandbox-off"]
		];
		function normalizeHtml(html) {
			return html.replace(/\s+/g, " ").trim();
		}
		/** Serialize only React-owned host drawing, excluding our appended art. */
		function hostHtml(svg) {
			const clone = svg.cloneNode(true);
			clone.querySelectorAll(`[${ICON_ART_ATTRIBUTE}]`).forEach((node) => node.remove());
			return normalizeHtml(clone.innerHTML);
		}
		function matchIcon(html) {
			for (const [key, name] of ICON_KEYS) if (html.includes(key)) return name;
			return null;
		}
		/**
		* A glyph can mean different things by position. The composer's command button
		* draws the generic plus, which reads as an add/attach affordance next to the
		* paperclip, so it becomes the command prompt while every other plus keeps its
		* meaning. The sparkle is the same story: the trajectory view uses it for
		* assistant messages, but every tool row (`dsh-client-ui-tool`'s ToolRow, marked
		* with `data-tool`) borrows it for its icon, and those rows become the wrench
		* the host itself draws for tools.
		*/
		function contextualName(svg, name) {
			if (name === "pin") return svg.querySelector(":scope > path")?.getAttribute("fill") === "currentColor" ? "pin-filled" : name;
			if (name === "sparkle") return svg.closest("[data-tool]") !== null ? "wrench" : name;
			if (name !== "plus") return name;
			const trigger = svg.closest("button[aria-haspopup='listbox']");
			return trigger !== null && trigger.closest("[data-composer-seat]") !== null ? "command" : name;
		}
		/**
		* The context meter's ring: a track circle plus a dashed progress circle. Its
		* class name is a CSS-module hash that moves with the host's build (path,
		* toolchain and content all feed it), so the drawing — not the class — is the
		* identity. StateDot also has two circles, but drives its arc from CSS rather
		* than the progress circle's stroke-dasharray attribute.
		*/
		function isUsageRing(svg) {
			return svg.querySelectorAll("circle").length === 2 && svg.querySelector("circle[stroke-dasharray]") !== null;
		}
		/** Resolve the ORCA art name for one host SVG, or null when nothing matches. */
		function resolveIconName(svg) {
			if (isUsageRing(svg)) return "usage";
			const matched = matchIcon(hostHtml(svg));
			return matched === null ? null : contextualName(svg, matched);
		}
		/**
		* Fit the 16-unit design grid onto the host viewBox: uniform scale to the
		* smaller axis, centered on the other (icons with portrait/landscape
		* viewBoxes stay centered like the host's own meet-fit).
		*/
		function artTransform(svg) {
			const viewBox = svg.getAttribute("viewBox");
			if (!viewBox) return "";
			const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat);
			const [x, y, width, height] = [
				parts[0] ?? 0,
				parts[1] ?? 0,
				parts[2] ?? 0,
				parts[3] ?? 0
			];
			if (!(width > 0) || !(height > 0)) return "";
			const scale = Math.min(width, height) / 16;
			const offsetX = x + (width - 16 * scale) / 2;
			const offsetY = y + (height - 16 * scale) / 2;
			if (scale === 1 && offsetX === 0 && offsetY === 0) return "";
			return `translate(${offsetX} ${offsetY}) scale(${scale})`;
		}
		function buildArt(name, svg) {
			const art = document.createElementNS(SVG_NS, "g");
			const transform = name === "tree-corner" ? "" : artTransform(svg);
			art.setAttribute(ICON_ART_ATTRIBUTE, "");
			art.setAttribute("fill", "none");
			art.setAttribute("stroke", "currentColor");
			art.setAttribute("stroke-width", /scale\(0\.[0-7]/.test(transform) ? "1.7" : "1.5");
			art.setAttribute("stroke-linejoin", "miter");
			art.setAttribute("stroke-linecap", "square");
			if (transform) art.setAttribute("transform", transform);
			art.innerHTML = ICON_ART[name] ?? "";
			if (name === "usage") art.append(buildUsageCells());
			return art;
		}
		function usageCircle(svg) {
			return Array.from(svg.querySelectorAll("circle")).find((circle) => circle.hasAttribute("stroke-dasharray")) ?? null;
		}
		/** ContextMeter emits the filled arc followed by the full circumference. */
		function usageFraction(circle) {
			const parts = (circle.getAttribute("stroke-dasharray") ?? "").match(/[\d.]+/g);
			if (!parts || parts.length < 2) return null;
			const dash = Number.parseFloat(parts[0] ?? "0");
			const total = Number.parseFloat(parts[1] ?? "0");
			if (!Number.isFinite(total) || total <= 0) return null;
			return Math.min(Math.max(dash / total, 0), 1);
		}
		/** Mirror the host ring's dash fraction onto the pixel cell field. */
		function syncUsageFill(svg, art) {
			const cells = art.querySelectorAll("rect[data-orca-link-usage-cell]");
			const circle = usageCircle(svg);
			if (cells.length === 0 || !circle) return;
			const fraction = usageFraction(circle);
			if (fraction === null) return;
			const level = fraction * USAGE_CELLS;
			const solid = Math.floor(level + 1e-9);
			const partial = level - solid;
			cells.forEach((cell, index) => {
				let opacity = USAGE_EMPTY_OPACITY;
				if (index < solid) opacity = 1;
				else if (index === solid && partial > 0) opacity = Math.max(partial, USAGE_MIN_PARTIAL);
				cell.setAttribute("opacity", String(Math.round(opacity * 100) / 100));
			});
		}
		/**
		* Install the icon redraw: an initial pass plus a subtree observer that
		* re-skins icons React (re)mounts. Returns a disposer that removes every
		* art group and marker attribute.
		*/
		function installOrcaIcons(body) {
			const usageObservers = /* @__PURE__ */ new Map();
			const observeUsage = (svg, art) => {
				syncUsageFill(svg, art);
				const circle = usageCircle(svg);
				if (circle === null || usageObservers.has(circle)) return;
				const observer = new MutationObserver(() => syncUsageFill(svg, art));
				observer.observe(circle, {
					attributes: true,
					attributeFilter: ["stroke-dasharray"]
				});
				usageObservers.set(circle, observer);
			};
			const syncPermissionHost = (svg, name) => {
				if (!name.startsWith("permission-")) return;
				const host = svg.closest("button, [role=\"menuitem\"]");
				if (host instanceof HTMLElement) host.dataset.orcaPermission = name.slice(11);
			};
			const applyToSvg = (svg) => {
				const name = resolveIconName(svg);
				if (name === null) return false;
				svg.setAttribute(ICON_ATTRIBUTE, name);
				const art = buildArt(name, svg);
				if (name === "usage") observeUsage(svg, art);
				svg.append(art);
				syncPermissionHost(svg, name);
				return true;
			};
			const reconcileSvg = (svg) => {
				if (!svg.isConnected) return;
				const art = svg.querySelector(`[${ICON_ART_ATTRIBUTE}]`);
				if (!(art instanceof SVGGElement)) {
					applyToSvg(svg);
					return;
				}
				const currentName = svg.getAttribute(ICON_ATTRIBUTE);
				const nextName = resolveIconName(svg);
				if (nextName !== currentName) {
					if (currentName?.startsWith("permission-") && !nextName?.startsWith("permission-")) svg.closest("button, [role=\"menuitem\"]")?.removeAttribute("data-orca-permission");
					art.remove();
					svg.removeAttribute(ICON_ATTRIBUTE);
					if (nextName !== null) applyToSvg(svg);
					return;
				}
				const transform = currentName === "tree-corner" ? "" : artTransform(svg);
				if (transform) {
					if (art.getAttribute("transform") !== transform) art.setAttribute("transform", transform);
				} else art.removeAttribute("transform");
				if (currentName === "usage") observeUsage(svg, art);
			};
			const collectContainingSvg = (node, found) => {
				if (!(node instanceof Element)) return;
				const containing = node.closest("svg");
				if (containing instanceof SVGElement) found.add(containing);
			};
			const collectSvgSubtree = (node, found) => {
				if (!(node instanceof Element)) return;
				collectContainingSvg(node, found);
				node.querySelectorAll("svg").forEach((svg) => {
					if (svg instanceof SVGElement) found.add(svg);
				});
			};
			const belongsToArt = (node) => node instanceof Element && node.closest(`[${ICON_ART_ATTRIBUTE}]`) !== null;
			const pruneUsageObservers = () => {
				for (const [circle, observer] of usageObservers) {
					if (circle.isConnected) continue;
					observer.disconnect();
					usageObservers.delete(circle);
				}
			};
			body.querySelectorAll("svg").forEach((svg) => {
				if (svg instanceof SVGElement) reconcileSvg(svg);
			});
			const mountObserver = new MutationObserver((records) => {
				if (!hasMutationOutsideTerminal(records)) return;
				const changed = /* @__PURE__ */ new Set();
				for (const record of records) {
					if (belongsToArt(record.target)) continue;
					const nodes = [...record.addedNodes, ...record.removedNodes];
					if (nodes.length > 0 && nodes.every(belongsToArt)) continue;
					collectContainingSvg(record.target, changed);
					record.addedNodes.forEach((node) => collectSvgSubtree(node, changed));
				}
				changed.forEach(reconcileSvg);
				pruneUsageObservers();
			});
			mountObserver.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: [
					"d",
					"fill",
					"stroke",
					"viewBox"
				]
			});
			return () => {
				mountObserver.disconnect();
				for (const observer of usageObservers.values()) observer.disconnect();
				usageObservers.clear();
				body.querySelectorAll(`[${ICON_ART_ATTRIBUTE}]`).forEach((node) => node.remove());
				body.querySelectorAll(`[${ICON_ATTRIBUTE}]`).forEach((node) => node.removeAttribute(ICON_ATTRIBUTE));
				body.querySelectorAll("[data-orca-permission]").forEach((node) => node.removeAttribute("data-orca-permission"));
			};
		}
		//#endregion
		//#region src/client/link-status.ts
		const STATUS_LABELS = {
			standby: "LINK ACTIVE",
			syncing: "LINK SYNC",
			working: "TASK RUNNING",
			approval: "AUTH REQUEST",
			input: "INPUT REQUIRED",
			review: "PLAN REVIEW",
			complete: "TASK COMPLETE",
			fault: "LINK FAULT",
			offline: "LINK OFFLINE",
			ready: "SESSION READY"
		};
		const SIGNAL_SELECTOR = "[data-orca-link-signal]";
		const TRANSCRIPT_COALESCE_MS = 120;
		const SIGNAL_LABEL_SELECTOR = "[data-orca-link-signal-label]";
		function conversationRoot$1(body) {
			for (const candidate of body.querySelectorAll("[data-phase]")) if (candidate.querySelector("[data-conversation-scroll]")?.closest("[data-phase]") === candidate) return candidate;
			return null;
		}
		function lastFlowRow(flow, skipTail = false) {
			for (let index = flow.children.length - 1; index >= 0; index -= 1) {
				const child = flow.children[index];
				if (!(child instanceof HTMLElement)) continue;
				if (child.hasAttribute("data-chat-flow-kind")) {
					if (!skipTail || child.dataset.chatFlowKind !== "turn-tail") return child;
				} else if (child.hasAttribute("data-step-process")) {
					const content = child.querySelector(":scope > [data-step-process-body] > [data-step-process-content][data-chat-flow]");
					const row = content === null ? null : lastFlowRow(content, skipTail);
					if (row !== null) return row;
				}
			}
			return null;
		}
		function resolveStatus(root) {
			if (root === null) return "standby";
			const phase = root.dataset.phase ?? "";
			if (phase === "hero") return "standby";
			if (phase === "settling") return "syncing";
			if (phase !== "active") return "ready";
			if (root.querySelector("[data-approval-key]") !== null) return "approval";
			if (root.querySelector("[data-plan-review-key]") !== null) return "review";
			if (root.querySelector("[data-question-key]") !== null) return "input";
			const input = root.querySelector("[data-composer-input][data-phase]");
			if (input?.dataset.phase === "submitting" || input?.dataset.phase === "adjudicating") return "syncing";
			if (root.querySelector("svg[data-orca-link-icon='stop']") !== null || root.querySelector("[data-state='running']") !== null) return "working";
			if (input?.getAttribute("aria-disabled") === "true") return "offline";
			const flow = root.querySelector("[data-chat-flow]");
			if (flow === null) return "ready";
			const tail = lastFlowRow(flow);
			const meaningful = lastFlowRow(flow, true);
			if (meaningful !== null && meaningful.querySelector("[data-state='error'], [data-state='interrupted']") !== null) return "fault";
			if (tail?.dataset.chatFlowKind === "turn-tail") return "complete";
			return "ready";
		}
		/**
		* Project the currently mounted conversation's state onto the sidebar signal.
		* Background sessions are intentionally ignored: switching sessions replaces
		* the central conversation root and therefore recomputes the label naturally.
		*/
		function installOrcaLinkStatus(body) {
			const originalBodyStatus = body.getAttribute("data-orca-link-status");
			const synchronize = () => {
				const status = resolveStatus(conversationRoot$1(body));
				if (body.dataset.orcaLinkStatus !== status) body.dataset.orcaLinkStatus = status;
				const chip = body.querySelector(SIGNAL_SELECTOR);
				if (chip === null) return;
				const label = chip.querySelector(SIGNAL_LABEL_SELECTOR);
				if (chip.dataset.orcaLinkStatus !== status) chip.dataset.orcaLinkStatus = status;
				if (label !== null && label.textContent !== STATUS_LABELS[status]) label.textContent = STATUS_LABELS[status];
			};
			let transcriptTimer;
			const flushTranscript = () => {
				transcriptTimer = void 0;
				synchronize();
			};
			const observer = new MutationObserver((records) => {
				if (!hasMutationOutsideTerminal(records)) return;
				if (hasMutationOutsideTranscript(records)) {
					if (transcriptTimer !== void 0) clearTimeout(transcriptTimer);
					transcriptTimer = void 0;
					synchronize();
					return;
				}
				transcriptTimer ??= setTimeout(flushTranscript, TRANSCRIPT_COALESCE_MS);
			});
			observer.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: [
					"aria-selected",
					"data-phase",
					"data-state",
					"data-orca-link-icon",
					"aria-disabled"
				]
			});
			synchronize();
			return () => {
				observer.disconnect();
				if (transcriptTimer !== void 0) clearTimeout(transcriptTimer);
				if (originalBodyStatus === null) body.removeAttribute("data-orca-link-status");
				else body.setAttribute("data-orca-link-status", originalBodyStatus);
				const chip = body.querySelector(SIGNAL_SELECTOR);
				chip?.removeAttribute("data-orca-link-status");
				const label = chip?.querySelector(SIGNAL_LABEL_SELECTOR);
				if (label !== null && label !== void 0) label.textContent = STATUS_LABELS.standby;
			};
		}
		//#endregion
		//#region src/client/page-icon-art.generated.ts
		/**
		* Generated web app manifest icons. The artwork is the skin's own
		* `PAGE_ICON_SVG` from `page-icons.ts` rasterised at 192 and 512 px, then
		* served from the package. Absolute same-origin URLs remain valid when the
		* manifest itself travels as a data: URL.
		*
		* Raster copies exist because Windows builds the installed app, taskbar and
		* start-menu icons from bitmap manifest icons. A manifest that declares only
		* `sizes: "any"` SVG leaves Edge with nothing to rasterise, and the installed
		* app falls back to the site's initial letter.
		*
		* Regenerate: rasterise that SVG at 192 and 512 px with any SVG renderer
		* (fit the 64-unit square viewBox into the square canvas) and replace the two
		* content-hashed PNG files and references below, then run the skin build.
		*/
		const PAGE_ICON_192 = skinAssetUrl("06b4f9ef930386c38d4daa2c264d600bec188f58199b5b34002ecb30c7cd1962.png");
		const PAGE_ICON_512 = skinAssetUrl("1d63b2ee2d7e70678527d58d65ae382d41b2af878886e97f86002c57e313e416.png");
		//#endregion
		//#region src/client/page-icons.ts
		/**
		* Page icons — the tab favicon and the web app manifest that names the icon of
		* the installed app (taskbar, start menu, pinned shortcut). The host declares
		* both as static head links (`link[rel="icon"]` → /favicon.svg,
		* `link[rel="manifest"]` → /manifest.webmanifest) and a browser honours the
		* first usable declaration, so appending a skin link would leave the host icons
		* in charge. Both host nodes are replaced instead, each pinned to a comment
		* anchor so disposal puts the original back where it was.
		*
		* The replacement manifest travels as a data: URL, where relative paths cannot
		* resolve: the identity fields reuse the host values and start_url/scope are
		* made absolute against the runtime origin.
		*
		* The manifest declares bitmap icons only. Windows builds the installed app,
		* taskbar and start-menu icons from bitmap manifest icons, and a `sizes: "any"`
		* SVG entry — which matches every size — makes Edge's icon-update path pick an
		* icon it cannot rasterise, so the app falls back to the site's initial letter
		* or a stale site icon. The SVG stays as the tab favicon, where arbitrary size
		* is an advantage and no rasterisation is needed.
		*/
		const PAGE_ICON_SVG = [
			"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\">",
			"<rect width=\"64\" height=\"64\" fill=\"#f7f9fc\"/>",
			"<path d=\"M8 18c9 1 15 7 18 16 2-11 8-19 18-24-2 9 1 15 7 19 2-3 4-5 7-6-2 16-12 26-28 27-10 0-18-7-22-18-2-6-5-11-10-14Z\" fill=\"#11151b\"/>",
			"<rect x=\"43\" y=\"26\" width=\"4\" height=\"4\" fill=\"#086cff\"/>",
			"</svg>"
		].join("");
		/** The skin's web icon, shared by the tab favicon and the web app manifest. */
		const PAGE_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(PAGE_ICON_SVG)}`;
		const MANIFEST_NAME = "DeepSeek Harness";
		const MANIFEST_SHORT_NAME = "DSH";
		const MANIFEST_DISPLAY = "fullscreen";
		const HOST_PAGE_ICON_SELECTOR = "link[rel~=\"icon\"], link[rel=\"manifest\"]";
		const HOST_PAGE_ICON_ANCHOR = "orca-link: host page icon";
		/**
		* One installation per document, reference counted: a second activation must
		* not capture the first activation's links as if they were the host's, or the
		* last disposal would leave a skin link behind.
		*/
		const installations$1 = /* @__PURE__ */ new WeakMap();
		function mountPageIcons(doc) {
			const replaced = [];
			const owned = [];
			const restore = () => {
				for (const node of owned) node.remove();
				for (const { node, anchor } of replaced) if (anchor.parentNode !== null && !node.isConnected) anchor.replaceWith(node);
				else anchor.remove();
			};
			try {
				for (const node of doc.head.querySelectorAll(HOST_PAGE_ICON_SELECTOR)) {
					const anchor = doc.createComment(HOST_PAGE_ICON_ANCHOR);
					replaced.push({
						node,
						anchor
					});
					node.before(anchor);
					node.remove();
				}
				const favicon = doc.createElement("link");
				favicon.rel = "icon";
				favicon.type = "image/svg+xml";
				favicon.href = PAGE_ICON;
				favicon.dataset.skinChrome = "favicon";
				doc.head.append(favicon);
				owned.push(favicon);
				const root = new URL("/", doc.location.href).href;
				const manifest = {
					id: root,
					name: MANIFEST_NAME,
					short_name: MANIFEST_SHORT_NAME,
					start_url: root,
					scope: root,
					display: MANIFEST_DISPLAY,
					icons: [{
						src: PAGE_ICON_192,
						sizes: "192x192",
						type: "image/png",
						purpose: "any"
					}, {
						src: PAGE_ICON_512,
						sizes: "512x512",
						type: "image/png",
						purpose: "any"
					}]
				};
				const manifestLink = doc.createElement("link");
				manifestLink.rel = "manifest";
				manifestLink.type = "application/manifest+json";
				manifestLink.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;
				manifestLink.dataset.skinChrome = "manifest";
				doc.head.append(manifestLink);
				owned.push(manifestLink);
			} catch (error) {
				restore();
				throw error;
			}
			return restore;
		}
		/** Replace the host page icons with the skin's; returns a counted disposer. */
		function installOrcaPageIcons() {
			const doc = document;
			let installation = installations$1.get(doc);
			if (installation === void 0) {
				installation = {
					users: 0,
					restore: mountPageIcons(doc)
				};
				installations$1.set(doc, installation);
			}
			const current = installation;
			current.users += 1;
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				if (--current.users > 0) return;
				current.restore();
				installations$1.delete(doc);
			};
		}
		//#endregion
		//#region src/client/pricing-light.ts
		const BEIJING_OFFSET_MS = 288e5;
		const HOUR_MS = 36e5;
		const DAY_MS = 24 * HOUR_MS;
		/** DeepSeek peak windows in Beijing minutes-of-day. */
		const PEAK_WINDOWS = [[540, 720], [840, 1080]];
		/** Amber early-warning window right before each valley-to-peak switch. */
		const TRANSITION_MINUTES = 20;
		/**
		* Statutory holidays that fall on a weekday, as Beijing MM-DD per year. Holiday
		* days on a weekend are valley already. Source: State Council notices, cross-
		* checked against the `chinese-days` dataset. The next year's schedule is
		* published around November; add it here when it is.
		*/
		const WEEKDAY_HOLIDAYS = { 2026: /* @__PURE__ */ new Set([
			"01-01",
			"01-02",
			"02-16",
			"02-17",
			"02-18",
			"02-19",
			"02-20",
			"02-23",
			"04-06",
			"05-01",
			"05-04",
			"05-05",
			"06-19",
			"09-25",
			"10-01",
			"10-02",
			"10-05",
			"10-06",
			"10-07"
		]) };
		/** Last year with holiday data; later dates fall back to the weekend rule only. */
		const HOLIDAY_DATA_LAST_YEAR = Math.max(...Object.keys(WEEKDAY_HOLIDAYS).map(Number));
		/** Longest valley run a scan must cross: the National Day week plus adjoining weekends. */
		const NEXT_CHANGE_SCAN_DAYS = 31;
		/** Beijing wall-clock minutes of day for any instant, host-timezone independent. */
		function beijingMinutesOfDay(date) {
			const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
			return beijing.getUTCHours() * 60 + beijing.getUTCMinutes();
		}
		/** Beijing wall-clock HH:MM for any instant. */
		function formatBeijingTime(date) {
			const beijing = new Date(date.getTime() + BEIJING_OFFSET_MS);
			return `${String(beijing.getUTCHours()).padStart(2, "0")}:${String(beijing.getUTCMinutes()).padStart(2, "0")}`;
		}
		function beijingDayNumber(date) {
			return Math.floor((date.getTime() + BEIJING_OFFSET_MS) / DAY_MS);
		}
		/** Beijing weekday (0 = Sunday ... 6 = Saturday), host-timezone independent. */
		function beijingWeekday(date) {
			return new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCDay();
		}
		/** Weekends run at the flat valley rate all day, no peak windows at all. */
		function isBeijingWeekend(date) {
			const weekday = beijingWeekday(date);
			return weekday === 0 || weekday === 6;
		}
		/** Whether a UTC+8-shifted day-start epoch is a weekday statutory holiday. */
		function isHolidayDayStart(dayStart) {
			const day = new Date(dayStart);
			const monthDay = `${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
			return WEEKDAY_HOLIDAYS[day.getUTCFullYear()]?.has(monthDay) === true;
		}
		/** Beijing midnight of the instant's day, in the UTC+8-shifted epoch. */
		function beijingDayStart(date) {
			return Math.floor((date.getTime() + BEIJING_OFFSET_MS) / DAY_MS) * DAY_MS;
		}
		/** Statutory holidays run at the valley rate all day, like weekends. */
		function isChinaHoliday(date) {
			return isHolidayDayStart(beijingDayStart(date));
		}
		/** Whole-day valley: weekends (make-up workdays included) and statutory holidays. */
		function isValleyDay(date) {
			return isBeijingWeekend(date) || isChinaHoliday(date);
		}
		function priceBandAt(date) {
			if (isValleyDay(date)) return "low";
			const minutes = beijingMinutesOfDay(date);
			if (PEAK_WINDOWS.some(([start]) => minutes >= start - TRANSITION_MINUTES && minutes < start)) return "transition";
			if (PEAK_WINDOWS.some(([start, end]) => minutes >= start && minutes < end)) return "high";
			return "low";
		}
		/** Beijing weekday of a day-start epoch (still unit-aligned to DAY_MS). */
		function beijingWeekdayOfDayStart(dayStart) {
			return (Math.round(dayStart / DAY_MS) + 4) % 7;
		}
		/**
		* Next pricing switch instant. Workdays change at the four Beijing boundaries
		* 09:00 / 12:00 / 14:00 / 18:00; weekends and statutory holidays stay flat at
		* valley price all day, so the next switch after Friday 18:00 or during any
		* such day is the next workday's 09:00. The per-day scan is exact because
		* every candidate boundary is visited in order and valley days emit none; its
		* horizon covers the longest holiday run (National Day plus weekends).
		*/
		function nextPriceChangeAt(date) {
			const beijingEpoch = date.getTime() + BEIJING_OFFSET_MS;
			let dayStart = beijingDayStart(date);
			for (let day = 0; day <= NEXT_CHANGE_SCAN_DAYS; day += 1) {
				const weekday = beijingWeekdayOfDayStart(dayStart);
				if (weekday === 0 || weekday === 6 || isHolidayDayStart(dayStart)) {
					dayStart += DAY_MS;
					continue;
				}
				const nextHour = [
					9,
					12,
					14,
					18
				].find((hour) => dayStart + hour * HOUR_MS > beijingEpoch);
				if (nextHour === void 0) {
					dayStart += DAY_MS;
					continue;
				}
				return /* @__PURE__ */ new Date(dayStart + nextHour * HOUR_MS - BEIJING_OFFSET_MS);
			}
			return /* @__PURE__ */ new Date(dayStart + 9 * HOUR_MS - BEIJING_OFFSET_MS);
		}
		const BAND_COPY = {
			low: {
				zh: {
					status: "空闲时段 OFF-PEAK",
					price: "高峰价的 50% (半价)",
					next: "-> 高峰 100%"
				},
				en: {
					status: "OFF-PEAK",
					price: "50% of peak price (half price)",
					next: "-> Peak 100%"
				}
			},
			transition: {
				zh: {
					status: "提前告警",
					price: "高峰价的 50% (半价)",
					next: "-> 高峰 100%"
				},
				en: {
					status: "Early warning",
					price: "50% of peak price (half price)",
					next: "-> Peak 100%"
				}
			},
			high: {
				zh: {
					status: "高峰时段 PEAK",
					price: "标准价格 100%",
					next: "-> 空闲 50%"
				},
				en: {
					status: "PEAK HOURS",
					price: "Standard price 100%",
					next: "-> Off-peak 50%"
				}
			}
		};
		const VALLEY_WINDOWS_LINE = {
			zh: "周末、法定节假日全天及非高峰时段, 价格为高峰的一半",
			en: "Weekends, public holidays and off-peak hours at half peak price"
		};
		const PEAK_WINDOWS_LINE = {
			zh: "工作日 09:00-12:00 / 14:00-18:00",
			en: "Workdays 09:00-12:00 / 14:00-18:00"
		};
		/** Valley row suffix once the clock passes the bundled holiday data. */
		function holidayCoverageNote(date, chinese) {
			if (new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCFullYear() <= HOLIDAY_DATA_LAST_YEAR) return "";
			return chinese ? ` (节假日数据仅到 ${HOLIDAY_DATA_LAST_YEAR} 年)` : ` (holiday data ends in ${HOLIDAY_DATA_LAST_YEAR})`;
		}
		/** Beijing weekday labels for the "next change" line, indexed by 0 = Sunday. */
		const WEEKDAY_LABELS = {
			zh: [
				"周日",
				"周一",
				"周二",
				"周三",
				"周四",
				"周五",
				"周六"
			],
			en: [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat"
			]
		};
		/** Match the host UI language, same heuristic as the composer collapse. */
		function detectChinese() {
			return (document.documentElement.lang || window.navigator.language || "en").toLowerCase().startsWith("zh");
		}
		/** Minutes until the next peak window start; meaningful during the amber
		* warning, where one is always upcoming. */
		function minutesUntilNextPeak(date) {
			const minutes = beijingMinutesOfDay(date);
			const upcoming = PEAK_WINDOWS.find(([start]) => minutes < start);
			return upcoming === void 0 ? TRANSITION_MINUTES : upcoming[0] - minutes;
		}
		function priceScheduleAt(date, chinese = detectChinese()) {
			const band = priceBandAt(date);
			const copy = chinese ? BAND_COPY[band].zh : BAND_COPY[band].en;
			const next = nextPriceChangeAt(date);
			let nextTime = formatBeijingTime(next);
			const dayGap = beijingDayNumber(next) - beijingDayNumber(date);
			if (dayGap === 1) nextTime = chinese ? `${nextTime} 明日` : `${nextTime} tomorrow`;
			else if (dayGap > 1) nextTime = `${chinese ? WEEKDAY_LABELS.zh[beijingWeekday(next)] : WEEKDAY_LABELS.en[beijingWeekday(next)]} ${nextTime}`;
			const statusLine = isBeijingWeekend(date) ? chinese ? "周末全天半价" : "Weekend half price all day" : isChinaHoliday(date) ? chinese ? "法定节假日全天半价" : "Public holiday half price all day" : band === "transition" ? chinese ? `提前告警 · ${minutesUntilNextPeak(date)} 分钟后进入高峰` : `Early warning: peak in ${minutesUntilNextPeak(date)} min` : copy.status;
			return {
				band,
				label: band === "low" ? "LOW" : "HIGH",
				statusLine,
				priceLine: copy.price,
				nextChangeLine: `${nextTime} ${copy.next}`,
				valleyWindowsLine: (chinese ? VALLEY_WINDOWS_LINE.zh : VALLEY_WINDOWS_LINE.en) + holidayCoverageNote(date, chinese)
			};
		}
		const PRICE_LIGHT_SELECTOR = "[data-orca-link-price-light]";
		const SIDEBAR_PANE_SELECTOR$1 = "[data-slot='sidebar'] > :first-child";
		/** The composer's model trigger label (ui-model-selection ModelSelect). */
		const MODEL_LABEL_SELECTOR = "[data-composer-card] button[aria-haspopup='menu'] [class*='triggerLabel']";
		/** Set on the light while the selected model is not a DeepSeek model. */
		const OTHER_MODEL_ATTRIBUTE = "data-orca-link-price-other-model";
		/**
		* Projected on body while the light sits in the Windows caption row, so the
		* caption menubar (a body-level shadow host) can step aside for it.
		*/
		const CAPTION_ATTRIBUTE = "data-orca-price-caption";
		const COLLAPSED_FRAME_SELECTOR = "[data-sidebar-collapsed]";
		/** Host placeholders shown before a model resolves; they say nothing about it. */
		const UNRESOLVED_MODEL_LABELS = /* @__PURE__ */ new Set([
			"正在加载模型…",
			"请选择模型",
			"Loading models…",
			"Select model"
		]);
		const POLL_INTERVAL_MS = 15e3;
		/** Tooltip row keys: [Chinese key, English key, row slot]. */
		const TOOLTIP_ROWS = [
			[
				"状态",
				"Status",
				"status"
			],
			[
				"当前",
				"Price",
				"price"
			],
			[
				"下次",
				"Next",
				"next"
			],
			[
				"高峰",
				"Peak",
				"peak-windows"
			],
			[
				"空闲",
				"Valley",
				"valley-windows"
			]
		];
		function text$1(tag, className, value) {
			const element = document.createElement(tag);
			element.className = className;
			element.textContent = value;
			return element;
		}
		function createLight(classes) {
			const light = document.createElement("div");
			light.className = classes.light;
			light.dataset.orcaLinkPriceLight = "";
			light.dataset.skinChrome = "pricing-light";
			const housing = document.createElement("div");
			housing.className = classes.housing;
			housing.setAttribute("aria-hidden", "true");
			housing.append(text$1("span", `${classes.lamp} ${classes.lampRed}`, ""), text$1("span", `${classes.lamp} ${classes.lampAmber}`, ""), text$1("span", `${classes.lamp} ${classes.lampGreen}`, ""));
			const label = text$1("span", classes.label, "LOW");
			label.dataset.orcaLinkPriceLabel = "";
			const tooltip = document.createElement("div");
			tooltip.className = classes.tooltip;
			tooltip.dataset.orcaLinkPriceTooltip = "";
			const title = text$1("div", classes.tooltipTitle, "");
			title.dataset.orcaLinkPriceTooltipTitle = "";
			tooltip.append(title);
			for (const [keyZh, , slot] of TOOLTIP_ROWS) {
				const row = text$1("div", classes.tooltipRow, "");
				row.dataset.orcaLinkPriceRow = slot;
				const key = text$1("span", classes.tooltipKey, keyZh);
				key.dataset.orcaLinkPriceKey = slot;
				const value = text$1("strong", classes.tooltipValue, "");
				value.dataset.orcaLinkPriceValue = slot;
				row.append(key, value);
				tooltip.append(row);
			}
			light.append(housing, label, tooltip);
			return light;
		}
		/**
		* DeepSeek's peak/valley schedule only prices DeepSeek models. The picker shows
		* a display name (or `provider/model` when the catalog lacks it), so any label
		* naming DeepSeek counts; placeholders keep the previous verdict.
		* @returns true / false for a resolved label, undefined when unknown.
		*/
		function isDeepSeekModelLabel(label) {
			const text = label.trim();
			if (text === "" || UNRESOLVED_MODEL_LABELS.has(text)) return void 0;
			return /deepseek/i.test(text);
		}
		/**
		* Mount the pricing traffic light under the sidebar's DSH wordmark. The light
		* stays visible on both the collapsed rail and the expanded sidebar, so the
		* current pricing band is always glanceable. Hovering it opens a detail card
		* with the band, the effective price, the next switch, and the full schedule.
		*
		* The light shows only while the composer's selected model is a DeepSeek
		* model. On the Windows desktop a collapsed sidebar is zero wide, so the light
		* moves into the caption row beside the host's pinned controls.
		*
		* The copy follows the host UI language on every render: when no `chinese`
		* override is given the document/navigator heuristic is re-read, and a
		* `lang` attribute observer on <html> re-renders immediately when the host
		* switches locale, so the hover card relocalizes without a reload.
		*
		* @param now - clock provider, injectable for deterministic tests.
		* @param chinese - explicit language override for tests; when omitted the
		* language is detected live on every render.
		*/
		function installOrcaPricingLight(body, classes, now = () => /* @__PURE__ */ new Date(), chinese) {
			const chineseOverride = chinese;
			let light = null;
			let label = null;
			let tooltip = null;
			let deepSeekModel = true;
			let observedModelLabel = null;
			const doc = body.ownerDocument;
			const syncCaption = () => {
				const inCaption = light !== null && light.isConnected && deepSeekModel && doc.documentElement.hasAttribute("data-windows-titlebar") && body.querySelector(COLLAPSED_FRAME_SELECTOR) !== null;
				if (body.hasAttribute(CAPTION_ATTRIBUTE) !== inCaption) body.toggleAttribute(CAPTION_ATTRIBUTE, inCaption);
			};
			const syncModel = () => {
				const modelLabel = body.querySelector(MODEL_LABEL_SELECTOR);
				if (modelLabel !== observedModelLabel) {
					modelObserver.disconnect();
					observedModelLabel = modelLabel;
					if (modelLabel !== null) modelObserver.observe(modelLabel, {
						characterData: true,
						childList: true,
						subtree: true
					});
				}
				const verdict = modelLabel === null ? void 0 : isDeepSeekModelLabel(modelLabel.textContent ?? "");
				if (verdict !== void 0) deepSeekModel = verdict;
				if (light !== null && light.hasAttribute(OTHER_MODEL_ATTRIBUTE) === deepSeekModel) light.toggleAttribute(OTHER_MODEL_ATTRIBUTE, !deepSeekModel);
				syncCaption();
			};
			const modelObserver = new MutationObserver(syncModel);
			const mount = () => {
				const pane = body.querySelector(SIDEBAR_PANE_SELECTOR$1);
				if (pane === null) return;
				const existing = pane.querySelector(`:scope > ${PRICE_LIGHT_SELECTOR}`);
				if (existing !== null) {
					light = existing;
					label = existing.querySelector("[data-orca-link-price-label]");
					tooltip = existing.querySelector("[data-orca-link-price-tooltip]");
					return;
				}
				const created = createLight(classes);
				pane.append(created);
				light = created;
				label = created.querySelector("[data-orca-link-price-label]");
				tooltip = created.querySelector("[data-orca-link-price-tooltip]");
			};
			const render = () => {
				mount();
				syncModel();
				if (light === null) return;
				const zh = chineseOverride ?? detectChinese();
				const schedule = priceScheduleAt(now(), zh);
				if (light.dataset.orcaLinkPrice !== schedule.band) light.dataset.orcaLinkPrice = schedule.band;
				if (label !== null && label.textContent !== schedule.label) label.textContent = schedule.label;
				light.setAttribute("aria-label", zh ? `定价状态：${schedule.statusLine}` : `Pricing status: ${schedule.statusLine}`);
				if (tooltip !== null) {
					const titleElement = tooltip.querySelector("[data-orca-link-price-tooltip-title]");
					if (titleElement !== null) {
						const titleCopy = zh ? "定价信号 · 北京时区 UTC+8" : "PRICING SIGNAL · BEIJING TZ UTC+8";
						if (titleElement.textContent !== titleCopy) titleElement.textContent = titleCopy;
					}
					for (const [keyZh, keyEn, slot] of TOOLTIP_ROWS) {
						const keyElement = tooltip.querySelector(`[data-orca-link-price-key='${slot}']`);
						if (keyElement === null) continue;
						const keyCopy = zh ? keyZh : keyEn;
						if (keyElement.textContent !== keyCopy) keyElement.textContent = keyCopy;
					}
					const lines = {
						status: schedule.statusLine,
						price: schedule.priceLine,
						next: schedule.nextChangeLine,
						"peak-windows": zh ? PEAK_WINDOWS_LINE.zh : PEAK_WINDOWS_LINE.en,
						"valley-windows": schedule.valleyWindowsLine
					};
					for (const [slot, value] of Object.entries(lines)) {
						const element = tooltip.querySelector(`[data-orca-link-price-value='${slot}']`);
						if (element !== null && element.textContent !== value) element.textContent = value;
					}
				}
			};
			const observer = new MutationObserver((records) => {
				if (!hasMutationOutsideTranscript(records)) return;
				if (light !== null && light.isConnected) {
					syncModel();
					return;
				}
				render();
			});
			observer.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-sidebar-collapsed"]
			});
			const langObserver = new MutationObserver(() => {
				if (light !== null && light.isConnected) render();
			});
			langObserver.observe(body.ownerDocument.documentElement, {
				attributes: true,
				attributeFilter: ["lang"]
			});
			const interval = window.setInterval(render, POLL_INTERVAL_MS);
			render();
			return () => {
				window.clearInterval(interval);
				observer.disconnect();
				modelObserver.disconnect();
				langObserver.disconnect();
				body.querySelectorAll(PRICE_LIGHT_SELECTOR).forEach((element) => element.remove());
				body.removeAttribute(CAPTION_ATTRIBUTE);
			};
		}
		//#endregion
		//#region src/client/rail-search.ts
		/**
		* Rail search completion: clicking the search control in the collapsed
		* rail expands the sidebar and focuses the search input, but the search
		* row's own open state is lost across the rail-to-wide remount — the input
		* ends up focused at its 4px collapsed width and the row needs a second
		* click. When the input lands focused while its row button still reports
		* aria-expanded="false", wait out the sidebar expansion, re-check, and
		* finish the interaction with one click on the row button. Rows that
		* opened normally (aria-expanded="true" before focus) are never touched.
		*/
		const SEARCH_INPUT_SELECTOR = "[data-slot='sidebar'] input[class*='searchInput']";
		const SEARCH_BUTTON_SELECTOR = "button[class*='searchButton']";
		const RECHECK_DELAY_MS = 320;
		/**
		* Resolve the search row for a focused input. The input's own class already
		* contains "search", so closest() would match the input itself; climb the
		* ancestors instead until the element that owns the search button is found.
		*/
		function searchContextOf(target) {
			if (!(target instanceof HTMLInputElement)) return null;
			if (!target.matches(SEARCH_INPUT_SELECTOR)) return null;
			let node = target.parentElement;
			for (let depth = 0; depth < 3 && node instanceof HTMLElement; depth++) {
				if (node.querySelector(SEARCH_BUTTON_SELECTOR)) return {
					row: node,
					input: target
				};
				node = node.parentElement;
			}
			return null;
		}
		/**
		* Install the rail search completion. Returns a disposer that removes the
		* listener and cancels any pending completion.
		*/
		function installOrcaRailSearch(body) {
			const pending = /* @__PURE__ */ new Map();
			const onFocusIn = (event) => {
				const context = searchContextOf(event.target);
				if (!context) return;
				const { row, input } = context;
				const previous = pending.get(input);
				if (previous !== void 0) clearTimeout(previous);
				const timer = setTimeout(() => {
					pending.delete(input);
					if (document.activeElement !== input) return;
					const button = row.querySelector(SEARCH_BUTTON_SELECTOR);
					if (!button || button.getAttribute("aria-expanded") !== "false") return;
					if (!body.hasAttribute("data-orca-sidebar-wide")) return;
					button.click();
				}, RECHECK_DELAY_MS);
				pending.set(input, timer);
			};
			body.addEventListener("focusin", onFocusIn);
			body.addEventListener("focus", onFocusIn, true);
			return () => {
				body.removeEventListener("focusin", onFocusIn);
				body.removeEventListener("focus", onFocusIn, true);
				for (const timer of pending.values()) clearTimeout(timer);
				pending.clear();
			};
		}
		//#endregion
		//#region src/client/scene.ts
		/**
		* ORCA LINK scene controller.
		*
		* The hero/active background crossfade in the stylesheet is driven by a stable
		* body-level attribute. DSH may replace the conversation root node when a
		* session starts, so relying on `:has([data-phase=...])` alone can skip the
		* transition. This controller watches for the conversation root and mirrors its
		* phase onto `body[data-orca-scene]`, which survives node replacement.
		* @module @deepseek-ai/dsh-client-ui-skin-orca-link/client/scene
		*/
		const CONVERSATION_SCROLL_SELECTOR = "[data-conversation-scroll]";
		function conversationRoot(body) {
			for (const candidate of body.querySelectorAll("[data-phase]")) if (candidate.querySelector(CONVERSATION_SCROLL_SELECTOR)?.closest("[data-phase]") === candidate) return candidate;
			return null;
		}
		/** Install the body-level scene marker used by the background crossfade. */
		function installOrcaScene(body) {
			const sync = () => {
				const phase = conversationRoot(body)?.dataset.phase;
				const scene = phase === "settling" || phase === "active" ? "active" : "hero";
				if (body.dataset.orcaScene !== scene) body.dataset.orcaScene = scene;
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) sync();
			});
			observer.observe(body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-phase"]
			});
			sync();
			return () => {
				observer.disconnect();
				delete body.dataset.orcaScene;
			};
		}
		//#endregion
		//#region src/client/settings-navigation.ts
		const NAV_SELECTOR = "[data-slot='sidebar.settings'] > [role='presentation'] > [role='dialog'] > nav, body > [role='presentation'] > [role='dialog'][data-shortcut-modal='settings'] > nav";
		const MORE_ATTRIBUTE = "data-orca-settings-more";
		const installations = /* @__PURE__ */ new WeakMap();
		/** The existing settings observer calls synchronize when the host replaces its navigation. */
		function createOrcaSettingsNavigation(body) {
			const doc = body.ownerDocument;
			let installation = installations.get(doc);
			if (installation === void 0) {
				installation = {
					users: 0,
					controller: createNavigation(body)
				};
				installations.set(doc, installation);
			}
			const current = installation;
			current.users += 1;
			let active = true;
			return {
				synchronize: () => {
					if (active) current.controller.synchronize();
				},
				dispose: () => {
					if (!active) return;
					active = false;
					if (--current.users > 0) return;
					current.controller.dispose();
					installations.delete(doc);
				}
			};
		}
		function createNavigation(body) {
			let active = true;
			let nav = null;
			let list = null;
			let originalMore = null;
			let writtenMore = null;
			let resizeObserver;
			const update = () => {
				if (!active || nav === null || list === null) return;
				writtenMore = list.scrollHeight - list.clientHeight - Math.max(0, list.scrollTop) > 1 ? "" : null;
				if (nav.getAttribute(MORE_ATTRIBUTE) === writtenMore) return;
				if (writtenMore === null) nav.removeAttribute(MORE_ATTRIBUTE);
				else nav.setAttribute(MORE_ATTRIBUTE, writtenMore);
			};
			const detach = () => {
				resizeObserver?.disconnect();
				resizeObserver = void 0;
				list?.removeEventListener("scroll", update);
				if (nav !== null && nav.getAttribute(MORE_ATTRIBUTE) === writtenMore) {
					if (originalMore === null) nav.removeAttribute(MORE_ATTRIBUTE);
					else nav.setAttribute(MORE_ATTRIBUTE, originalMore);
				}
				nav = null;
				list = null;
			};
			const synchronize = () => {
				if (!active) return;
				const nextNav = body.querySelector(NAV_SELECTOR);
				const nextList = nextNav?.querySelector(":scope > :last-child") ?? null;
				if (nav !== nextNav || list !== nextList) {
					detach();
					nav = nextNav;
					list = nextList;
					originalMore = nav?.getAttribute(MORE_ATTRIBUTE) ?? null;
					writtenMore = originalMore;
					if (list !== null) try {
						list.addEventListener("scroll", update, { passive: true });
						if (typeof ResizeObserver !== "undefined") {
							resizeObserver = new ResizeObserver(update);
							resizeObserver.observe(list);
						}
					} catch (error) {
						detach();
						throw error;
					}
				}
				update();
			};
			const dispose = () => {
				if (!active) return;
				active = false;
				detach();
			};
			return {
				synchronize,
				dispose
			};
		}
		//#endregion
		//#region src/client/settings-overlay.ts
		const SETTINGS_SLOT_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog']";
		const SETTINGS_DIALOG_SELECTOR = `${SETTINGS_SLOT_DIALOG_SELECTOR}, [role='dialog'][data-shortcut-modal='settings']`;
		const SETTINGS_OWNER_SELECTOR = "[data-slot='sidebar.settings'], [role='dialog'][data-shortcut-modal='settings']";
		const SETTINGS_OPEN_ATTRIBUTE = "data-orca-settings-open";
		const SETTINGS_IN_SIDEBAR_ATTRIBUTE = "data-orca-settings-in-sidebar";
		const CORDIS_PANEL_SELECTOR = "[data-slot='sidebar.footer.action'] [data-cordis-panel]";
		const CORDIS_OPEN_ATTRIBUTE = "data-orca-cordis-panel-open";
		const LAMP_ATTRIBUTE = "data-orca-lamp";
		const LAMP_FLICKER_MS = 1e3;
		/** Keep the root stacking context above body-level plugin panels while the settings dialog owns the viewport. */
		function installOrcaSettingsOverlay(body) {
			const originallyOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE);
			const originallyInSidebar = body.hasAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE);
			const originallyCordisOpen = body.hasAttribute(CORDIS_OPEN_ATTRIBUTE);
			const originalLamp = body.getAttribute(LAMP_ATTRIBUTE);
			let lampTimer;
			let wasDark = body.hasAttribute("data-ds-dark-theme");
			const navigation = createOrcaSettingsNavigation(body);
			const triggerLamp = () => {
				if (body.hasAttribute("data-ds-dark-theme") !== true) return;
				body.setAttribute(LAMP_ATTRIBUTE, "flicker");
				if (lampTimer !== void 0) clearTimeout(lampTimer);
				lampTimer = setTimeout(() => {
					if (body.getAttribute(LAMP_ATTRIBUTE) === "flicker") body.removeAttribute(LAMP_ATTRIBUTE);
				}, LAMP_FLICKER_MS);
			};
			const synchronizeTheme = () => {
				const isDark = body.hasAttribute("data-ds-dark-theme");
				if (wasDark && !isDark) {
					if (lampTimer !== void 0) clearTimeout(lampTimer);
					body.removeAttribute(LAMP_ATTRIBUTE);
				}
				wasDark = isDark;
			};
			const synchronize = (navigationChanged) => {
				const wasOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE);
				body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, body.querySelector(SETTINGS_DIALOG_SELECTOR) !== null);
				const inSidebar = body.querySelector(SETTINGS_SLOT_DIALOG_SELECTOR) !== null;
				if (body.hasAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE) !== inSidebar) body.toggleAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE, inSidebar);
				const isOpen = body.hasAttribute(SETTINGS_OPEN_ATTRIBUTE);
				if (navigationChanged || wasOpen !== isOpen) navigation.synchronize();
				if (wasOpen && !isOpen) triggerLamp();
				body.toggleAttribute(CORDIS_OPEN_ATTRIBUTE, body.querySelector(CORDIS_PANEL_SELECTOR) !== null);
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) synchronize(records.some((record) => record.type === "childList" && record.target instanceof Element && record.target.closest(SETTINGS_OWNER_SELECTOR) !== null));
				synchronizeTheme();
			});
			const dispose = () => {
				observer.disconnect();
				navigation.dispose();
				if (lampTimer !== void 0) clearTimeout(lampTimer);
				body.toggleAttribute(SETTINGS_OPEN_ATTRIBUTE, originallyOpen);
				body.toggleAttribute(SETTINGS_IN_SIDEBAR_ATTRIBUTE, originallyInSidebar);
				body.toggleAttribute(CORDIS_OPEN_ATTRIBUTE, originallyCordisOpen);
				if (originalLamp === null) body.removeAttribute(LAMP_ATTRIBUTE);
				else body.setAttribute(LAMP_ATTRIBUTE, originalLamp);
			};
			try {
				observer.observe(body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				synchronize(true);
				synchronizeTheme();
			} catch (error) {
				dispose();
				throw error;
			}
			return dispose;
		}
		//#endregion
		//#region \0dsh-css:src/client/work-light.module.css.mjs
		const css$2 = "body[data-dsh-orca-link] [data-orca-work-light]{z-index:1;pointer-events:none;contain:layout paint;display:none;position:absolute;inset:0;overflow:clip}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-work-light]{display:block}body[data-dsh-orca-link] [data-orca-light-rig]{transform-origin:18% 10%;position:absolute;inset:0}body[data-dsh-orca-link] [data-orca-light-housing]{background:linear-gradient(#69717b,#242b34 42%,#121923);border:1px solid #69717b;width:68%;height:4%;position:absolute;top:8%;left:16%}body[data-dsh-orca-link] [data-orca-light-illumination]{opacity:.85;position:absolute;inset:0}body[data-dsh-orca-link] [data-orca-light-part=tube]{background:#fff3ca;width:64%;height:1.5%;position:absolute;top:11%;left:18%;box-shadow:0 0 7px 2px #ffd68b70,0 2px 18px 5px #ffe5aa24}body[data-dsh-orca-link] [data-orca-light-part=beam]{background:radial-gradient(at 50% 0,#fff0c83b,#ffe0a317 42%,#0000 73%),conic-gradient(from 152deg at 50% -12%,#0000,#ffe2a611 10deg 44deg,#0000 56deg);position:absolute;inset:10% 2% 0;mask-image:radial-gradient(at 50% 8%,#000 12%,#0009 46%,#0000 72%)}body[data-dsh-orca-link] [data-orca-light-part^=dust-]{background:radial-gradient(circle at 18% 21%,#fff4dba6 0 .8px,#0000 1.6px),radial-gradient(circle at 62% 12%,#fff4db75 0 .7px,#0000 1.4px),radial-gradient(circle at 37% 58%,#fff4db9c 0 1px,#0000 1.8px),radial-gradient(circle at 82% 39%,#fff4db73 0 .8px,#0000 1.7px),radial-gradient(circle at 53% 81%,#fff4db70 0 .6px,#0000 1.3px),radial-gradient(circle at 24% 91%,#fff4db66 0 .7px,#0000 1.5px);animation:13s ease-in-out infinite alternate W6tQOa_orcaWorkDust;position:absolute;inset:13% 15% 9%}body[data-dsh-orca-link] [data-orca-light-part=dust-far]{opacity:.4;animation:19s ease-in-out -7s infinite alternate W6tQOa_orcaWorkDustFar;inset:10% 22% 15%}body[data-dsh-orca-link] [data-orca-work-light=sidebar] [data-orca-light-housing],body[data-dsh-orca-link] [data-orca-work-light=sidebar] [data-orca-light-part=tube]{display:none}body[data-dsh-orca-link] [data-orca-work-light=sidebar] [data-orca-light-part=beam]{background:radial-gradient(at 46% 5%,#fff0c84a,#ffdfad1c 42%,#0000 76%);inset:0}body[data-dsh-orca-link][data-orca-lamp=flicker] [data-orca-work-light=sidebar] [data-orca-light-illumination]{animation:1s ease-out both W6tQOa_orcaWorkIgnition}body[data-dsh-orca-link] [data-orca-work-light=repair] [data-orca-light-suspension]{width:64%;height:10%;position:absolute;top:0;left:18%}body[data-dsh-orca-link] [data-orca-light-suspension]:before,body[data-dsh-orca-link] [data-orca-light-suspension]:after{content:\"\";background:#78838c;width:1px;height:100%;position:absolute;top:0;left:0}body[data-dsh-orca-link] [data-orca-light-suspension]:after{transform-origin:top;left:auto;right:0}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-work-light=repair] [data-orca-light-suspension]:after{animation:1s 2.2s both W6tQOa_orcaRepairCable}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-work-light=repair] [data-orca-light-rig]{animation:3.8s 1.4s both W6tQOa_orcaRepairDrop}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-work-light=repair] [data-orca-light-illumination]{animation:1.4s both W6tQOa_orcaWorkIgnition,17s 5.2s infinite W6tQOa_orcaRepairFlicker}@keyframes W6tQOa_orcaWorkDust{0%{opacity:.24;transform:translate(-5px,7px)}to{opacity:.66;transform:translate(8px,-9px)}}@keyframes W6tQOa_orcaWorkDustFar{0%{opacity:.15;transform:translate(7px,10px)}to{opacity:.38;transform:translate(-6px,-8px)}}@keyframes W6tQOa_orcaWorkIgnition{0%,18%{opacity:.06}28%{opacity:.9}44%{opacity:.15}70%,to{opacity:.85}}@keyframes W6tQOa_orcaRepairDrop{0%,20%{transform:rotate(0)}38%{transform:rotate(24deg)}55%{transform:rotate(12deg)}73%{transform:rotate(20deg)}88%{transform:rotate(16deg)}to{transform:rotate(18deg)}}@keyframes W6tQOa_orcaRepairCable{0%{transform:scaleY(1)}to{transform:rotate(-12deg)scaleY(.38)}}@keyframes W6tQOa_orcaRepairFlicker{0%,64%,70%,to{opacity:.85}65%,67%{opacity:.22}66%{opacity:.68}68%{opacity:.4}}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-orca-work-light=sidebar],body[data-dsh-orca-link][data-orca-settings-open] [data-orca-work-light=sidebar],html[data-dsh-whale-orca-character=hidden] body[data-dsh-orca-link] [data-orca-work-light=sidebar]{display:none}body[data-dsh-orca-link][data-orca-lights-paused] [data-orca-work-light] *,body[data-dsh-orca-link][data-orca-lights-paused] [data-orca-work-light] :before,body[data-dsh-orca-link][data-orca-lights-paused] [data-orca-work-light] :after{animation-play-state:paused!important}@media (prefers-reduced-motion:reduce){body[data-dsh-orca-link] [data-orca-work-light] *,body[data-dsh-orca-link] [data-orca-work-light] :after{animation:none!important}body[data-dsh-orca-link] [data-orca-work-light=repair] [data-orca-light-rig]{transform:rotate(18deg)}body[data-dsh-orca-link] [data-orca-work-light=repair] [data-orca-light-suspension]:after{transform:rotate(-12deg)scaleY(.38)}}";
		const tagId$2 = "@smalltailqwq/dsh-client-ui-skin-orca-link/work-light.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-orca-link";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/work-light.ts
		/** A bounded light rig: its gradients stay still while two dust layers drift. */
		function createOrcaWorkLight(mode) {
			const light = document.createElement("div");
			light.dataset.orcaWorkLight = mode;
			light.setAttribute("aria-hidden", "true");
			const suspension = document.createElement("span");
			suspension.dataset.orcaLightSuspension = "";
			const rig = document.createElement("div");
			rig.dataset.orcaLightRig = "";
			const housing = document.createElement("span");
			housing.dataset.orcaLightHousing = "";
			const illumination = document.createElement("div");
			illumination.dataset.orcaLightIllumination = "";
			for (const part of ["tube", "beam"]) {
				const node = document.createElement("span");
				node.dataset.orcaLightPart = part;
				illumination.append(node);
			}
			rig.append(housing, illumination);
			light.append(suspension, rig);
			for (const part of ["dust-near", "dust-far"]) {
				const dust = document.createElement("span");
				dust.dataset.orcaLightPart = part;
				light.append(dust);
			}
			return light;
		}
		const visibilityLeases = /* @__PURE__ */ new WeakMap();
		/** Pause the decorative compositor animations while this document is hidden. */
		function installOrcaLightVisibility(body) {
			let lease = visibilityLeases.get(body);
			if (!lease) {
				const attribute = "data-orca-lights-paused";
				const original = body.getAttribute(attribute);
				let written = null;
				const sync = () => {
					written = document.hidden ? "" : null;
					if (written === null) body.removeAttribute(attribute);
					else body.setAttribute(attribute, written);
				};
				lease = {
					count: 0,
					dispose: () => {
						document.removeEventListener("visibilitychange", sync);
						if (body.getAttribute(attribute) !== written) return;
						if (original === null) body.removeAttribute(attribute);
						else body.setAttribute(attribute, original);
					}
				};
				visibilityLeases.set(body, lease);
				document.addEventListener("visibilitychange", sync);
				sync();
			}
			lease.count += 1;
			let released = false;
			return () => {
				if (released) return;
				released = true;
				if (--lease.count !== 0) return;
				lease.dispose();
				visibilityLeases.delete(body);
			};
		}
		//#endregion
		//#region src/client/status-character.ts
		const CHARACTER_SELECTOR = "[data-orca-link-character]";
		const SIDEBAR_PANE_SELECTOR = "[data-slot='sidebar'] > :first-child";
		/** Projected by customization.ts from the character switch and the SFW schedule. */
		const CHARACTER_VISIBILITY_ATTRIBUTE = "data-dsh-whale-orca-character";
		const FRAME_INTERVAL_MS_BY_STATUS = {
			standby: 240,
			syncing: 83,
			working: 83,
			approval: 83,
			input: 83,
			review: 83,
			complete: 83,
			fault: 83,
			offline: 83,
			ready: 83
		};
		const STATUS_ROWS = {
			standby: 0,
			syncing: 1,
			working: 2,
			approval: 3,
			input: 4,
			review: 5,
			complete: 6,
			fault: 7,
			offline: 8,
			ready: 9
		};
		const FRAME_SEQUENCES = {
			standby: [
				0,
				0,
				0,
				0,
				1,
				2,
				3,
				2,
				1
			],
			syncing: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			working: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			approval: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			input: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			review: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			complete: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			fault: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			offline: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			],
			ready: [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7
			]
		};
		/**
		* Per-frame durations for statuses that need a non-uniform cadence. Array
		* length matches the status's FRAME_SEQUENCES entry; statuses without an
		* entry keep the fixed statusFrameInterval cadence. Standby holds the
		* open-eye cells long and plays the blink cells quickly, so blink frequency
		* drops without making the blink itself look slow.
		*/
		const FRAME_DURATIONS_MS_BY_STATUS = { standby: [
			700,
			700,
			700,
			700,
			130,
			90,
			110,
			90,
			130
		] };
		const ONE_SHOT_STATUSES = /* @__PURE__ */ new Set([
			"approval",
			"input",
			"complete",
			"fault",
			"ready"
		]);
		/** Atlas cell size in px for the inline ORCA LINK status atlas (8×10 grid). */
		const STATUS_ATLAS_CELL = 236;
		/**
		* Per-frame alignment compensation for every status row.
		*
		* The atlas rows were assembled from source poses whose whole-body centroid
		* drifts between frames (and between different status rows). Without
		* compensation, both an individual animation loop and a status transition can
		* visibly jump at small UI sizes. Values are source-pixel offsets (standby
		* frame 0 centroid minus this frame's centroid) applied as a translate on the
		* sprite layer, so every status and every frame shares one stable anchor while
		* the pose changes. Recompute these from the inline atlas whenever the artwork
		* is re-embedded.
		*/
		const STATUS_FRAME_ALIGNMENT = {
			standby: [
				[0, 0],
				[5, -.2],
				[2.6, .1],
				[.8, -.2],
				[.9, 2.2],
				[2.6, 2.1],
				[2.9, 1.9],
				[0, 0]
			],
			syncing: [
				[-3.5, 1],
				[-2.9, .8],
				[.4, .6],
				[1.3, .4],
				[-1.1, 3.9],
				[-2, 4.2],
				[.8, 3.4],
				[-3.5, 1]
			],
			working: [
				[5.4, -1.6],
				[5, -1.8],
				[5.5, -1.6],
				[6.2, -1.7],
				[5.2, .9],
				[4.5, .6],
				[6.3, .4],
				[5.4, -1.6]
			],
			approval: [
				[3.2, -1.8],
				[2.6, -1.6],
				[3.3, -.1],
				[4.2, 1.3],
				[4.2, 1.1],
				[3, 1.1],
				[3.3, .6],
				[5.3, 1]
			],
			input: [
				[9.6, 9.8],
				[8.8, 9.7],
				[8.5, 10.7],
				[8.7, 12.5],
				[7.3, 12.6],
				[7.3, 12.4],
				[8.1, 12.5],
				[7.3, 12.4]
			],
			review: [
				[11.8, -2.5],
				[5.8, 2],
				[8.4, 2.1],
				[9.1, -.1],
				[6.4, 1.1],
				[13.7, 1.8],
				[10.8, -.2],
				[11.8, -2.5]
			],
			complete: [
				[1.8, -2.3],
				[-.1, -2.7],
				[-.9, -2.7],
				[.8, -1.3],
				[10, -2.4],
				[-1.3, -1.1],
				[-.8, -.8],
				[8.1, -.2]
			],
			fault: [
				[9.7, -.8],
				[10.2, -.8],
				[9.7, -.4],
				[16.6, -.2],
				[12.4, -.1],
				[12.8, .7],
				[14.3, -.7],
				[11.8, 1.4]
			],
			offline: [
				[10.4, -1.8],
				[9.7, -2],
				[10, -2],
				[11.7, -2],
				[11.1, -1.5],
				[9.5, -1.5],
				[10.8, -1.9],
				[10.4, -1.8]
			],
			ready: [
				[6.1, -.1],
				[5.7, -.4],
				[5.2, -1.1],
				[7.1, -1.2],
				[5.9, .9],
				[5.7, .8],
				[5.6, .6],
				[7.1, .6]
			]
		};
		function sequenceOffset(status, sequenceIndex, sequenceLength) {
			if (ONE_SHOT_STATUSES.has(status)) return Math.min(sequenceIndex, sequenceLength - 1);
			return sequenceIndex % sequenceLength;
		}
		function isLinkStatus(value) {
			return value !== void 0 && Object.hasOwn(STATUS_ROWS, value);
		}
		function statusFrame(status, sequenceIndex) {
			const sequence = FRAME_SEQUENCES[status];
			return {
				frame: sequence[sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)] ?? 0,
				row: STATUS_ROWS[status]
			};
		}
		function statusFrameInterval(status) {
			return FRAME_INTERVAL_MS_BY_STATUS[status];
		}
		/** Duration of the frame shown at one sequence index (per-frame cadence). */
		function statusFrameDuration(status, sequenceIndex) {
			const sequence = FRAME_SEQUENCES[status];
			const durations = FRAME_DURATIONS_MS_BY_STATUS[status];
			if (durations === void 0) return statusFrameInterval(status);
			return durations[sequenceOffset(status, Math.max(0, sequenceIndex), sequence.length)] ?? statusFrameInterval(status);
		}
		function createBubble(className) {
			const bubble = document.createElement("span");
			bubble.className = className;
			bubble.dataset.orcaLinkCharacterBubble = "";
			const glyph = document.createElement("span");
			glyph.dataset.orcaLinkCharacterBubbleGlyph = "";
			glyph.setAttribute("aria-hidden", "true");
			bubble.append(glyph);
			return bubble;
		}
		function createCharacter(classes) {
			const character = document.createElement("div");
			character.className = classes.character;
			character.dataset.orcaLinkCharacter = "";
			character.dataset.skinChrome = "status-character";
			character.setAttribute("aria-hidden", "true");
			const frame = document.createElement("div");
			frame.className = classes.characterFrame;
			const sprite = document.createElement("div");
			sprite.className = classes.characterSprite;
			sprite.dataset.orcaLinkCharacterSprite = "";
			character.style.setProperty("--orca-link-status-atlas", `url("${ORCA_LINK_STATUS_ATLAS}")`);
			sprite.style.setProperty("--orca-link-status-atlas", `url("${ORCA_LINK_STATUS_ATLAS}")`);
			frame.append(sprite);
			character.append(frame, createOrcaWorkLight("sidebar"), createBubble(classes.characterBubble));
			return character;
		}
		/** Mount the ORCA-specific state actor in the sidebar's existing art stage. */
		function installOrcaStatusCharacter(body, classes) {
			let character = null;
			let sprite = null;
			let status = "standby";
			let sequenceIndex = 0;
			let timeout;
			const mount = () => {
				const pane = body.querySelector(SIDEBAR_PANE_SELECTOR);
				if (pane === null) return;
				const existing = pane.querySelector(CHARACTER_SELECTOR);
				if (existing !== null) {
					character = existing;
					sprite = existing.querySelector("[data-orca-link-character-sprite]");
					return;
				}
				character = createCharacter(classes);
				sprite = character.querySelector("[data-orca-link-character-sprite]");
				pane.append(character);
			};
			const render = () => {
				mount();
				const nextStatus = isLinkStatus(body.dataset.orcaLinkStatus) ? body.dataset.orcaLinkStatus : "standby";
				if (nextStatus !== status) {
					status = nextStatus;
					sequenceIndex = 0;
				}
				const current = statusFrame(status, sequenceIndex);
				if (character !== null) {
					if (character.dataset.orcaLinkStatus !== status) character.dataset.orcaLinkStatus = status;
					if (character.dataset.orcaLinkFrame !== String(current.frame)) character.dataset.orcaLinkFrame = String(current.frame);
					character.style.setProperty("--orca-status-column", String(current.frame));
					character.style.setProperty("--orca-status-row", String(current.row));
					character.style.setProperty("--orca-status-x", `${current.frame / 7 * 100}%`);
					character.style.setProperty("--orca-status-y", `${current.row / 9 * 100}%`);
				}
				if (sprite !== null) {
					sprite.style.setProperty("--orca-status-column", String(current.frame));
					sprite.style.setProperty("--orca-status-row", String(current.row));
					sprite.style.setProperty("--orca-status-x", `${current.frame / 7 * 100}%`);
					sprite.style.setProperty("--orca-status-y", `${current.row / 9 * 100}%`);
					const alignment = STATUS_FRAME_ALIGNMENT[status]?.[current.frame];
					if (alignment !== void 0) sprite.style.transform = `translate(${alignment[0] / STATUS_ATLAS_CELL * 100}%, ${alignment[1] / STATUS_ATLAS_CELL * 100}%)`;
					else sprite.style.transform = "";
				}
			};
			const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
			const doc = body.ownerDocument;
			const animating = () => doc.visibilityState !== "hidden" && doc.documentElement.getAttribute(CHARACTER_VISIBILITY_ATTRIBUTE) !== "hidden" && prefersReducedMotion?.matches !== true && !(ONE_SHOT_STATUSES.has(status) && sequenceIndex >= FRAME_SEQUENCES[status].length - 1);
			const tick = () => {
				timeout = void 0;
				sequenceIndex += 1;
				render();
				scheduleTick();
			};
			const scheduleTick = () => {
				if (timeout !== void 0) window.clearTimeout(timeout);
				timeout = void 0;
				if (!animating()) return;
				timeout = window.setTimeout(tick, statusFrameDuration(status, sequenceIndex));
			};
			const resume = () => {
				if (timeout === void 0) scheduleTick();
			};
			const visibilityObserver = new MutationObserver(resume);
			visibilityObserver.observe(doc.documentElement, {
				attributes: true,
				attributeFilter: [CHARACTER_VISIBILITY_ATTRIBUTE]
			});
			doc.addEventListener("visibilitychange", resume);
			prefersReducedMotion?.addEventListener?.("change", resume);
			const observer = new MutationObserver((records) => {
				if (!hasMutationOutsideTranscript(records)) return;
				const previousStatus = status;
				render();
				if (status !== previousStatus) scheduleTick();
			});
			observer.observe(body, {
				attributes: true,
				attributeFilter: ["data-orca-link-status"],
				childList: true,
				subtree: true
			});
			render();
			scheduleTick();
			return () => {
				if (timeout !== void 0) window.clearTimeout(timeout);
				observer.disconnect();
				visibilityObserver.disconnect();
				doc.removeEventListener("visibilitychange", resume);
				prefersReducedMotion?.removeEventListener?.("change", resume);
				body.querySelectorAll(CHARACTER_SELECTOR).forEach((element) => element.remove());
			};
		}
		//#endregion
		//#region src/client/terminal-performance.ts
		const TERMINAL_SELECTOR = "[data-dsh-better-sidebar] .xterm";
		const TERMINAL_WIDTH_LOCK_ATTRIBUTE = "data-orca-terminal-width-locked";
		const TERMINAL_WIDTH_PROPERTY = "--orca-terminal-locked-width";
		const RESPONSIVE_SURFACE_SELECTOR = "[data-produced-files-row]";
		const RESPONSIVE_WIDTH_LOCK_ATTRIBUTE = "data-orca-responsive-width-locked";
		const RESPONSIVE_WIDTH_PROPERTY = "--orca-responsive-locked-width";
		const APP_FRAME_SELECTOR$1 = "[id='root'] > div[data-slot='root'] > div";
		const TRANSITION_FALLBACK_MS = 380;
		/**
		* During an AppFrame track transition, hold resize-sensitive surfaces at their
		* current width and release them at transition end. Locking produced-file rows
		* individually avoids invalidating the entire AppFrame subtree before its
		* first animated frame can paint.
		*/
		function installOrcaTerminalPerformance(body) {
			const view = body.ownerDocument.defaultView;
			let frame = null;
			let lockedHost = null;
			let responsiveSurfaceLocks = [];
			let unlockTimer;
			const unlockTerminal = () => {
				if (unlockTimer !== void 0) view?.clearTimeout(unlockTimer);
				unlockTimer = void 0;
				lockedHost?.removeAttribute(TERMINAL_WIDTH_LOCK_ATTRIBUTE);
				lockedHost?.style.removeProperty(TERMINAL_WIDTH_PROPERTY);
				lockedHost = null;
			};
			const unlockResponsiveSurfaces = () => {
				const locks = responsiveSurfaceLocks;
				responsiveSurfaceLocks = [];
				for (const { surface, hadAttribute, originalWidth, lockedWidth } of locks) {
					if (surface.style.getPropertyValue(RESPONSIVE_WIDTH_PROPERTY) !== lockedWidth) continue;
					if (originalWidth === "") surface.style.removeProperty(RESPONSIVE_WIDTH_PROPERTY);
					else surface.style.setProperty(RESPONSIVE_WIDTH_PROPERTY, originalWidth);
					if (!hadAttribute && surface.hasAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE)) surface.removeAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE);
				}
			};
			const unlockTransitionSurfaces = () => {
				unlockTerminal();
				unlockResponsiveSurfaces();
			};
			const scheduleUnlock = () => {
				if (unlockTimer !== void 0) view?.clearTimeout(unlockTimer);
				unlockTimer = view?.setTimeout(unlockTransitionSurfaces, TRANSITION_FALLBACK_MS);
			};
			const lockTerminal = () => {
				if (frame?.hasAttribute("data-dragging") === true) {
					unlockTransitionSurfaces();
					return;
				}
				const host = body.querySelector(TERMINAL_SELECTOR)?.parentElement;
				if (!(host instanceof HTMLElement)) return;
				if (host !== lockedHost) {
					unlockTerminal();
					const width = host.getBoundingClientRect().width;
					if (width <= 0) return;
					lockedHost = host;
					host.style.setProperty(TERMINAL_WIDTH_PROPERTY, `${width}px`);
					host.setAttribute(TERMINAL_WIDTH_LOCK_ATTRIBUTE, "");
				}
			};
			const lockResponsiveSurfaces = () => {
				if (responsiveSurfaceLocks.length > 0) return;
				for (const surface of body.querySelectorAll(RESPONSIVE_SURFACE_SELECTOR)) {
					const width = surface.getBoundingClientRect().width;
					if (width <= 0) continue;
					const lockedWidth = `${width}px`;
					responsiveSurfaceLocks.push({
						surface,
						hadAttribute: surface.hasAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE),
						originalWidth: surface.style.getPropertyValue(RESPONSIVE_WIDTH_PROPERTY),
						lockedWidth
					});
					surface.style.setProperty(RESPONSIVE_WIDTH_PROPERTY, lockedWidth);
					surface.setAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE, "");
				}
			};
			const lockTransitionSurfaces = () => {
				if (frame?.hasAttribute("data-dragging") === true) {
					unlockTransitionSurfaces();
					return;
				}
				lockTerminal();
				lockResponsiveSurfaces();
				scheduleUnlock();
			};
			const onTransitionEnd = (event) => {
				if (event.target === frame && event.propertyName === "grid-template-columns") unlockTransitionSurfaces();
			};
			const frameObserver = new MutationObserver((records) => {
				if (frame?.hasAttribute("data-dragging") === true) {
					unlockTransitionSurfaces();
					return;
				}
				if (records.some((record) => record.attributeName !== "data-dragging")) lockTransitionSurfaces();
			});
			const mountFrame = () => {
				const next = body.querySelector(APP_FRAME_SELECTOR$1);
				if (next === frame) return;
				frameObserver.disconnect();
				frame?.removeEventListener("transitionend", onTransitionEnd);
				unlockTransitionSurfaces();
				frame = next;
				frame?.addEventListener("transitionend", onTransitionEnd);
				if (frame !== null) frameObserver.observe(frame, {
					attributes: true,
					attributeFilter: [
						"style",
						"data-sidebar-collapsed",
						"data-rightbar-collapsed",
						"data-dragging"
					]
				});
			};
			const synchronize = () => {
				mountFrame();
			};
			const observer = new MutationObserver((records) => {
				if (hasMutationOutsideTranscript(records)) synchronize();
			});
			observer.observe(body, {
				childList: true,
				subtree: true
			});
			synchronize();
			return () => {
				observer.disconnect();
				frameObserver.disconnect();
				frame?.removeEventListener("transitionend", onTransitionEnd);
				unlockTransitionSurfaces();
			};
		}
		//#endregion
		//#region src/client/window-resume.ts
		const WINDOW_RESUMING_ATTRIBUTE = "data-orca-window-resuming";
		const POINTER_RELEASE_DISTANCE_PX = 2;
		/**
		* Suppress sidebar tooltips restored by WebApp window activation until a new
		* user gesture proves that the pointer or keyboard focus is intentional.
		*/
		function installOrcaWindowResume(body) {
			const doc = body.ownerDocument;
			const view = doc.defaultView;
			const originallyResuming = body.hasAttribute(WINDOW_RESUMING_ATTRIBUTE);
			let lastPointer = null;
			const suppress = () => {
				body.setAttribute(WINDOW_RESUMING_ATTRIBUTE, "");
			};
			const release = () => {
				body.removeAttribute(WINDOW_RESUMING_ATTRIBUTE);
			};
			const onPointerMove = (event) => {
				const previous = lastPointer;
				lastPointer = {
					x: event.clientX,
					y: event.clientY
				};
				if (!body.hasAttribute(WINDOW_RESUMING_ATTRIBUTE) || previous === null) return;
				if (Math.abs(event.clientX - previous.x) + Math.abs(event.clientY - previous.y) >= POINTER_RELEASE_DISTANCE_PX) release();
			};
			const onVisibilityChange = () => {
				suppress();
			};
			doc.addEventListener("pointermove", onPointerMove, {
				capture: true,
				passive: true
			});
			doc.addEventListener("pointerdown", release, true);
			doc.addEventListener("keydown", release, true);
			doc.addEventListener("visibilitychange", onVisibilityChange);
			view?.addEventListener("blur", suppress);
			view?.addEventListener("focus", suppress);
			return () => {
				doc.removeEventListener("pointermove", onPointerMove, true);
				doc.removeEventListener("pointerdown", release, true);
				doc.removeEventListener("keydown", release, true);
				doc.removeEventListener("visibilitychange", onVisibilityChange);
				view?.removeEventListener("blur", suppress);
				view?.removeEventListener("focus", suppress);
				body.toggleAttribute(WINDOW_RESUMING_ATTRIBUTE, originallyResuming);
			};
		}
		//#endregion
		//#region src/client/windows-menu.ts
		const MENU_HOST_SELECTOR = ":scope > [data-windows-menu]";
		const OWNED_STYLE_ATTRIBUTE = "data-orca-windows-menu";
		const MENU_CSS = `
  button { border-radius: 0; corner-shape: square; }
`;
		/**
		* Square the Windows caption menubar so it hovers like the neighbouring
		* caption toggle. Only the <style> node this activation appended is removed on
		* disposal; the shell's own menubar, shadow root and styles are never touched.
		*/
		function installOrcaWindowsMenu(body) {
			const doc = body.ownerDocument;
			const owned = /* @__PURE__ */ new Set();
			const decorate = () => {
				const shadow = body.querySelector(MENU_HOST_SELECTOR)?.shadowRoot;
				if (shadow == null) return;
				for (const style of owned) if (style.parentNode === shadow) return;
				const style = doc.createElement("style");
				style.setAttribute(OWNED_STYLE_ATTRIBUTE, "");
				style.textContent = MENU_CSS;
				shadow.append(style);
				owned.add(style);
			};
			const observer = new MutationObserver(decorate);
			observer.observe(body, { childList: true });
			decorate();
			return () => {
				observer.disconnect();
				owned.forEach((style) => {
					style.remove();
				});
				owned.clear();
			};
		}
		//#endregion
		//#region src/client/boot-error-art.generated.ts
		/** Embedded from assets/boot-repair.webp; original: assets/boot-repair-source.png. Artwork terms: LICENSE-ARTWORK and NOTICE. */
		const ORCA_BOOT_REPAIR_ART = skinAssetUrl("9527647570513378137c59775582e9c26ffe15c128b76886fcd21bfddb6f60a2.webp");
		//#endregion
		//#region \0dsh-css:src/client/boot-error.module.css.mjs
		const css$1 = "body[data-dsh-orca-link] [data-dsh-boot][data-orca-boot-error]{box-sizing:border-box;height:auto;min-height:100dvh;color:var(--orca-ink);background:#f6f1e7;grid-template-columns:minmax(220px,440px) minmax(0,620px);grid-template-areas:\"RN379q_scene RN379q_report\";place-content:safe center center;align-items:center;gap:clamp(24px,4vw,72px);padding:clamp(24px,5vw,72px);display:grid;position:relative;overflow:auto}body[data-dsh-orca-link][data-ds-dark-theme] [data-dsh-boot][data-orca-boot-error]{background:#090f18}body[data-dsh-orca-link] [data-orca-boot-error]>div{box-sizing:border-box;border:1px solid var(--orca-line);border-top:3px solid var(--orca-blue);background:var(--dsw-input-solid);overflow-wrap:anywhere;scrollbar-gutter:stable;border-radius:0;grid-area:RN379q_report;align-items:stretch;width:100%;min-width:0;max-height:min(76dvh,800px);padding:clamp(22px,3vw,40px);overflow:auto;box-shadow:0 12px 40px #141d2b0c}body[data-dsh-orca-link] [data-orca-boot-error]>div>div{width:100%;min-width:0;max-width:none}body[data-dsh-orca-link] [data-orca-boot-error]>div>div:first-child{border-bottom:1px solid var(--orca-line);color:var(--orca-muted);letter-spacing:.16em;padding-bottom:18px;font-size:12px}body[data-dsh-orca-link] [data-orca-boot-error]>div>div+div>div:first-child{color:var(--orca-ink);margin-bottom:12px;font-size:clamp(20px,2.2vw,26px);line-height:1.4}body[data-dsh-orca-link] [data-orca-boot-scene]{aspect-ratio:1;pointer-events:none;isolation:isolate;grid-area:RN379q_scene;place-self:center;width:100%;max-width:440px;margin:0;position:relative}body[data-dsh-orca-link] [data-orca-boot-figure]{object-fit:contain;object-position:center bottom;width:94%;height:78%;position:absolute;bottom:5%;left:3%}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-boot-figure]{filter:brightness(.77)saturate(.78)}body[data-dsh-orca-link] [data-orca-boot-scene] [data-orca-work-light=repair]{top:-10%;bottom:10%}body[data-dsh-orca-link] [data-orca-boot-floor]{background:radial-gradient(#50463522,#0000 70%);height:9%;position:absolute;inset:auto 7% 1%}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-boot-floor]{background:radial-gradient(#edc78818,#0000 70%)}html[data-dsh-whale-orca-art=hidden] body[data-dsh-orca-link] [data-dsh-boot][data-orca-boot-error]{grid-template-columns:minmax(0,620px);grid-template-areas:\"RN379q_report\"}html[data-dsh-whale-orca-art=hidden] body[data-dsh-orca-link] [data-orca-boot-scene]{display:none}@media (width<=760px){body[data-dsh-orca-link] [data-dsh-boot][data-orca-boot-error]{grid-template-columns:minmax(0,620px);grid-template-areas:\"RN379q_scene\"\"RN379q_report\";align-content:start;gap:16px;padding:20px}body[data-dsh-orca-link] [data-orca-boot-scene]{width:min(72vw,300px)}body[data-dsh-orca-link] [data-orca-boot-error]>div{max-height:none}}";
		const tagId$1 = "@smalltailqwq/dsh-client-ui-skin-orca-link/boot-error.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-orca-link";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/boot-error.ts
		const BOOT_SELECTOR = "[data-dsh-boot]";
		const ERROR_ATTRIBUTE = "data-orca-boot-error";
		const leases = /* @__PURE__ */ new WeakMap();
		function createRepairScene() {
			const scene = document.createElement("aside");
			scene.dataset.orcaBootScene = "";
			scene.dataset.skinChrome = "boot-repair";
			scene.setAttribute("aria-hidden", "true");
			const figure = document.createElement("img");
			figure.dataset.orcaBootFigure = "";
			figure.src = ORCA_BOOT_REPAIR_ART;
			figure.alt = "";
			figure.draggable = false;
			const floor = document.createElement("span");
			floor.dataset.orcaBootFloor = "";
			scene.append(floor, figure, createOrcaWorkLight("repair"));
			return scene;
		}
		/** The kernel owns the report; this lease owns only its sibling illustration. */
		function installOrcaBootError() {
			const owner = Symbol("orca-boot-error");
			const owned = /* @__PURE__ */ new Set();
			let observer;
			const release = (boot) => {
				owned.delete(boot);
				const lease = leases.get(boot);
				if (!lease || !lease.owners.delete(owner) || lease.owners.size > 0) return;
				leases.delete(boot);
				lease.scene.remove();
				if (boot.getAttribute(ERROR_ATTRIBUTE) !== "") return;
				if (lease.original === null) boot.removeAttribute(ERROR_ATTRIBUTE);
				else boot.setAttribute(ERROR_ATTRIBUTE, lease.original);
			};
			const synchronize = () => {
				const failed = /* @__PURE__ */ new Set();
				for (const boot of document.querySelectorAll(BOOT_SELECTOR)) {
					const card = [...boot.children].find((element) => !element.hasAttribute("data-orca-boot-scene"));
					if (!(card && [...card.querySelectorAll("div")].some((element) => element.childElementCount === 0 && element.textContent === "Failed to load plugins"))) continue;
					failed.add(boot);
					if (owned.has(boot)) continue;
					let lease = leases.get(boot);
					if (!lease) {
						lease = {
							original: boot.getAttribute(ERROR_ATTRIBUTE),
							owners: /* @__PURE__ */ new Set(),
							scene: createRepairScene()
						};
						leases.set(boot, lease);
					}
					lease.owners.add(owner);
					owned.add(boot);
					boot.setAttribute(ERROR_ATTRIBUTE, "");
					if (lease.scene.parentElement !== boot) boot.append(lease.scene);
				}
				for (const boot of owned) if (!failed.has(boot)) release(boot);
			};
			const dispose = () => {
				observer?.disconnect();
				for (const boot of owned) release(boot);
			};
			try {
				observer = new MutationObserver((records) => {
					if (records.some((record) => {
						const target = record.target instanceof Element ? record.target : record.target.parentElement;
						if (target?.closest("[data-orca-boot-scene]")) return false;
						if (target?.closest(BOOT_SELECTOR)) return true;
						return [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element && (node.matches(BOOT_SELECTOR) || node.querySelector(BOOT_SELECTOR)));
					})) synchronize();
				});
				observer.observe(document.documentElement, {
					childList: true,
					subtree: true,
					characterData: true
				});
				synchronize();
				return dispose;
			} catch (error) {
				dispose();
				throw error;
			}
		}
		//#endregion
		//#region \0dsh-css:src/client/orca-link.module.css.mjs
		const css = "body[data-dsh-orca-link]{--orca-sidebar-width:clamp(258px, 20.2vw, 326px);--orca-stage:clamp(240px, 34vh, 320px);--orca-blue:#4b483f;--orca-cyan:#20c7e8;--orca-ink:#11151b;--orca-graphite:#343b47;--orca-muted:#778399;--orca-question-focus:#4a473f;--orca-question-focus-wash:#4b483f1c;--orca-line:#2b374824;--orca-surface:#fdfaf4c7;--orca-surface-strong:#fffcf6eb;--orca-shadow:0 18px 55px #1b273a1f, 0 2px 5px #1b273a1a;--orca-z-seam:850;--orca-z-standby:900;--orca-z-tooltip:950;--orca-z-restore:955;--orca-z-ghost:965;--orca-z-cordis:975;--orca-z-settings:980;--orca-settings-overlay-z:980;isolation:isolate;color:var(--orca-ink);background-color:#f6f1e7;background-image:none;--dsw-static-blue-50:#ebe7de!important;--dsw-static-blue-100:#ddd8cc!important;--dsw-static-blue-300:#a89f8e!important;--dsw-static-blue-400:#6a655a!important;--dsw-static-blue-500:#4b483f!important;--dsw-static-blue-600:#3a372f!important;--dsw-static-blue-800:#2e2c26!important;--dsw-static-blue-950:#1f1d18!important;--dsw-static-deepseek-50:#ebe7de!important;--dsw-static-deepseek-100:#ddd8cc!important;--dsw-static-deepseek-300:#a89f8e!important;--dsw-static-deepseek-400:#6a655a!important;--dsw-static-deepseek-500:#4b483f!important;--dsw-static-deepseek-600:#3a372f!important;--dsw-static-deepseek-800:#2e2c26!important;--dsw-static-deepseek-900:#26241f!important;--dsw-alias-bg-base:#faf7f13d!important;--dsw-alias-bg-layer-1:#fffcf69e!important;--dsw-alias-bg-layer-2:#f7f4eebd!important;--dsw-alias-bg-layer-3:#f0ece5d1!important;--dsw-alias-bg-module-platform:#f7f4eec7!important;--dsw-alias-bg-overlay:#fdfaf4f5!important;--dsw-alias-border-l1:#2b37481a!important;--dsw-alias-border-l2:#2b374829!important;--dsw-alias-border-l3:#2b374840!important;--dsw-alias-border-l4:#2b37485c!important;--dsw-alias-brand-primary:#4b483f!important;--dsw-alias-brand-primary-invert:#fff!important;--dsw-alias-brand-text:#3a372f!important;--dsw-alias-button-primary-fill:#4b483f!important;--dsw-alias-button-primary-hover:#3a372f!important;--dsw-alias-button-floating-fill:#fffcf6eb!important;--dsw-alias-button-floating-hover:#e8e4da!important;--dsw-alias-button-tool-bar-fill:#fffcf6a3!important;--dsw-alias-button-tool-bar-hover:#d8d2c6e6!important;--dsw-alias-interactive-bg-active:color-mix(in srgb, var(--orca-blue) 14%, transparent)!important;--dsw-alias-interactive-bg-hover:color-mix(in srgb, var(--orca-blue) 7%, transparent)!important;--dsw-alias-interactive-bg-hover-solid:#e8e4da!important;--dsw-alias-label-primary:#11151b!important;--dsw-alias-label-secondary:#343b47!important;--dsw-alias-label-tertiary:#778399!important;--dsw-alias-label-caption:#8d98aa!important;--dsw-alias-state-business-primary:#4b483f!important;--dsw-alias-state-business-tertiary:#ddd8cc!important;--dsw-specific-bubble:#e8e4dad6!important;--dsw-specific-bubble-highlight:#d8d2c6f0!important;--dsw-specific-input-major:#fdfaf4b8!important;--dsw-specific-menu:#fdfaf4f5!important;--dsw-specific-selector:#f6f3ece6!important;--dsw-specific-sidebar-fill:#faf7f194!important;--dsw-specific-sidebar-nav-item-active:#d8d2c6d1!important;--dsw-specific-sidebar-nav-item-active-accent:#a89f8e!important;--dsw-specific-sidebar-nav-item-hover:#e8e4dadb!important;--dsw-input-solid:#fbf7ef!important}html[data-platform=darwin] body[data-dsh-orca-link]>:is([data-skin-chrome=light-scene],[data-skin-chrome=dark-scene],[data-skin-chrome=spine],[data-skin-chrome=standby]){-webkit-app-region:initial!important}body[data-dsh-orca-link] [data-turn-trigger]{border-color:var(--orca-line);background:var(--orca-surface-strong);border-radius:0}body[data-dsh-orca-link] [data-turn-trigger]:hover{border-color:var(--orca-blue)}body[data-dsh-orca-link],body[data-dsh-orca-link] :where(button,input,textarea,select,[role=button],[role=checkbox],[role=combobox],[role=dialog],[role=listbox],[role=menu],[role=menuitem],[role=menuitemradio],[role=option],[role=radio],[role=switch],[role=tab],[role=tooltip],[role=treeitem],[data-composer-card],[data-composer-input],[data-skin-chrome]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *),body[data-dsh-orca-link] :where(button,[role=button],[role=dialog],[role=menu],[role=menuitem],[role=menuitemradio],[role=tooltip],[data-composer-card],[data-skin-chrome]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *):before,body[data-dsh-orca-link] :where(button,[role=button],[role=dialog],[role=menu],[role=menuitem],[role=menuitemradio],[role=tooltip],[data-composer-card],[data-skin-chrome]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *):after{border-radius:0!important}body[data-dsh-orca-link]{--dsw-radius-xs:0px;--dsw-radius-sm:0px;--dsw-radius-md:0px;--dsw-radius-lg:0px;--dsw-radius-xl:0px;--dsw-radius-panel:0px}body[data-dsh-orca-link] :is([data-slot=\"conversation.input.left\"],[data-slot=\"conversation.input.right\"],[data-slot=\"sidebar.footer.action\"],[data-slot=settings\\.section]){--dsw-radius-xs:4px;--dsw-radius-sm:8px;--dsw-radius-md:12px;--dsw-radius-lg:16px;--dsw-radius-xl:20px;--dsw-radius-panel:28px}body[data-dsh-orca-link] [data-chat-flow] *,body[data-dsh-orca-link] [data-chat-flow] :before,body[data-dsh-orca-link] [data-chat-flow] :after{border-radius:0!important}body[data-dsh-orca-link] :where([role=switch]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *){box-sizing:border-box;border:1px solid var(--orca-line);background:color-mix(in srgb, var(--orca-ink) 7%, var(--dsw-input-solid));width:36px;height:20px;padding:1px;transition:background-color .14s,border-color .14s;border-radius:0!important}body[data-dsh-orca-link] :where([role=switch][aria-checked=true]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *){border-color:color-mix(in srgb, var(--orca-blue) 62%, transparent);background:color-mix(in srgb, var(--orca-blue) 18%, var(--dsw-input-solid))}body[data-dsh-orca-link] :where([role=switch]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *)>[class*=thumb]{box-sizing:border-box;border:1px solid var(--orca-muted);background:var(--orca-surface-strong);width:16px;height:16px;transition:transform .14s,background-color .14s,border-color .14s;display:block;border-radius:0!important}body[data-dsh-orca-link] :where([role=switch][aria-checked=true]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *)>[class*=thumb]{border-color:var(--orca-blue);background:var(--orca-blue);transform:translate(16px)}body[data-dsh-orca-link]>[role=alert][style*=--dsh-toast-hold]{border:1px solid var(--orca-line);color:var(--orca-ink);box-shadow:inset 2px 0 var(--orca-blue), var(--orca-shadow);background:#fbf7ef;border-radius:0!important}body[data-dsh-orca-link][data-ds-dark-theme]>[role=alert][style*=--dsh-toast-hold]{background:#0f151f}body[data-dsh-orca-link]>[role=alert][style*=--dsh-toast-hold] button{color:var(--orca-blue)}body[data-dsh-orca-link]>[style*=--dsh-hover-preview-fade]{border:1px solid var(--orca-line);border-radius:0!important}body[data-dsh-orca-link] [data-tone],body[data-dsh-orca-link] [data-plugin-panel] *,body[data-dsh-orca-link] [data-plugin-panel] :before,body[data-dsh-orca-link] [data-plugin-panel] :after{border-radius:0!important}body[data-dsh-orca-link] [data-trigger-menu],body[data-dsh-orca-link] [data-slot=\"conversation.input.overlay\"] div[aria-label]:has(>input):has(>[role=listbox]){box-sizing:border-box;border:1px solid var(--orca-line);background:var(--dsw-input-solid);box-shadow:var(--orca-shadow);color:var(--orca-ink);border-radius:0!important}body[data-dsh-orca-link] [data-slot=\"conversation.input.overlay\"] [role=option][aria-selected=true]{box-shadow:inset 2px 0 var(--orca-blue)}body[data-dsh-orca-link] [data-slot=\"conversation.session.header.utilities\"] div[class$=_split]:has(>button[aria-haspopup=menu]){border-color:var(--orca-line);background:var(--orca-surface-strong);border-radius:0!important}body[data-dsh-orca-link] [data-sidebar-right-panel][data-sidebar-right-open],body[data-dsh-orca-link] [data-sidebar-right-panel] [data-dockkit-float]{background:var(--dsw-input-solid);color:var(--orca-ink);border-color:var(--orca-line);border-radius:0!important}body[data-dsh-orca-link] [data-sidebar-right-panel] [data-dockkit-float]{box-shadow:var(--orca-shadow)}body[data-dsh-orca-link] [data-sidebar-right-panel] [data-dockkit-strip],body[data-dsh-orca-link] [data-sidebar-right-panel] [data-dockkit-float-grip]{background:color-mix(in srgb, var(--orca-blue) 5%, var(--dsw-input-solid));border-bottom-color:var(--orca-line)}body[data-dsh-orca-link] [data-sidebar-right-panel] [data-dockkit-tab][aria-selected=true]{box-shadow:inset 0 -2px var(--orca-blue)}body[data-dsh-orca-link] [data-dockkit-tab-menu]{background:var(--dsw-input-solid);border-color:var(--orca-line);box-shadow:var(--orca-shadow)}body[data-dsh-orca-link] [data-plugin-panel]{background:var(--dsw-input-solid);color:var(--orca-ink)}body[data-dsh-orca-link] [data-step-process]>div>button[data-process-activity]{border-left:2px solid var(--orca-line);background:var(--orca-surface-strong);color:var(--orca-graphite);padding:5px 8px}body[data-dsh-orca-link] [data-step-process]>div>button[data-process-activity]:is(:hover,:focus-visible,[aria-expanded=true]){border-left-color:var(--orca-blue);color:var(--orca-ink)}body[data-dsh-orca-link] [data-slot=settings\\.launcher] button[data-collapsed][aria-haspopup=menu]{border:1px solid var(--orca-line);background:var(--orca-surface-strong)}body[data-dsh-orca-link] [data-slot=settings\\.launcher] button[data-collapsed][aria-haspopup=menu]:is(:hover,:focus-visible,[aria-expanded=true]){border-color:var(--orca-blue);background:var(--dsw-input-solid)}body[data-dsh-orca-link] [data-composer-stats] [class$=_pill]{background:var(--dsw-input-solid);color:var(--orca-graphite);border-radius:0!important}body[data-dsh-orca-link] [data-composer-stats] button[class$=_pill]:is(:hover,[aria-expanded=true]){background:color-mix(in srgb, var(--orca-blue) 10%, var(--dsw-input-solid));color:var(--orca-ink)}body[data-dsh-orca-link] [role=dialog]:has(>[data-session-stats-details]),body[data-dsh-orca-link] [role=dialog]:has(>[data-session-stats-usage]){background:var(--dsw-input-solid);border-color:var(--orca-line);box-shadow:var(--orca-shadow)}body[data-dsh-orca-link] [data-chat-flow-kind=assistant-step] .md-table-wide{padding-bottom:var(--dsh-scrollbar-width,8px)}body[data-dsh-orca-link] [data-dsh-better-sidebar] .xterm{contain:layout paint style}body[data-dsh-orca-link] [data-dsh-better-sidebar] [class*=_bottomPanel],body[data-dsh-orca-link] [data-dsh-better-sidebar] [class*=_terminalWrap],body[data-dsh-orca-link] [data-dsh-better-sidebar] [class$=_terminal]{overflow:clip}body[data-dsh-orca-link] [data-orca-terminal-width-locked]{box-sizing:border-box;align-self:flex-start;overflow:clip;width:var(--orca-terminal-locked-width)!important;min-width:var(--orca-terminal-locked-width)!important;max-width:var(--orca-terminal-locked-width)!important}body[data-dsh-orca-link] [data-produced-files-row][data-orca-responsive-width-locked]{box-sizing:border-box;flex:0 0 var(--orca-responsive-locked-width)!important;width:var(--orca-responsive-locked-width)!important;min-width:var(--orca-responsive-locked-width)!important;max-width:var(--orca-responsive-locked-width)!important}body[data-dsh-orca-link][data-ds-dark-theme]{--orca-blue:#4d91ff;--orca-cyan:#45d9f4;--orca-ink:#eef4ff;--orca-graphite:#c8d2e2;--orca-muted:#8998af;--orca-question-focus:#78a8ef;--orca-question-focus-wash:#78a8ef24;--orca-line:#b4c7e229;--orca-surface:#0c111ad1;--orca-surface-strong:#0f151ff0;--orca-shadow:0 18px 55px #0000006b, 0 2px 5px #00000052;color:var(--orca-ink);background-color:#090d14;background-image:none;--dsw-alias-bg-base:#080c1338!important;--dsw-alias-bg-layer-1:#0e141ed6!important;--dsw-alias-bg-layer-2:#131b28e0!important;--dsw-alias-bg-layer-3:#1a2332eb!important;--dsw-alias-bg-module-platform:#131b28e0!important;--dsw-alias-bg-overlay:#0f151ff7!important;--dsw-alias-border-l1:#b4c7e21a!important;--dsw-alias-border-l2:#b4c7e229!important;--dsw-alias-border-l3:#b4c7e23d!important;--dsw-alias-border-l4:#b4c7e257!important;--dsw-alias-brand-primary:#4d91ff!important;--dsw-alias-brand-primary-invert:#07101f!important;--dsw-alias-brand-text:#a9c9ff!important;--dsw-alias-button-primary-fill:var(--orca-blue)!important;--dsw-alias-button-primary-hover:#2e81ff!important;--dsw-alias-button-info-fill:#4d91ff!important;--dsw-alias-button-info-hover:#2e81ff!important;--dsw-static-deepseek-500:#4d91ff!important;--dsw-static-deepseek-200:#a9c9ff!important;--dsw-alias-button-floating-fill:#131b28f2!important;--dsw-alias-button-floating-hover:#202c40!important;--dsw-alias-button-tool-bar-fill:#182232e0!important;--dsw-alias-button-tool-bar-hover:#21314af2!important;--dsw-alias-interactive-bg-active:#4d91ff33!important;--dsw-alias-interactive-bg-hover:#4d91ff1c!important;--dsw-alias-interactive-bg-hover-solid:#1d2a3f!important;--dsw-alias-label-primary:#eef4ff!important;--dsw-alias-label-secondary:#c8d2e2!important;--dsw-alias-label-tertiary:#8998af!important;--dsw-alias-label-caption:#718198!important;--dsw-alias-state-business-primary:#4d91ff!important;--dsw-alias-state-business-tertiary:#183459!important;--dsw-specific-bubble:#182a42e6!important;--dsw-specific-bubble-highlight:#1e3858f0!important;--dsw-specific-input-major:#0e141edb!important;--dsw-specific-menu:#0f151ff7!important;--dsw-specific-selector:#141d2bf0!important;--dsw-specific-sidebar-fill:#080c13cc!important;--dsw-specific-sidebar-nav-item-active:#1d3658e0!important;--dsw-specific-sidebar-nav-item-active-accent:#4d91ff!important;--dsw-specific-sidebar-nav-item-hover:#19263ae6!important;--dsw-input-solid:#0e141e!important}body[data-dsh-orca-link] [id=root]{z-index:1;background:0 0;position:relative}body[data-dsh-orca-link] ._0cMdVG_lightScene{z-index:0;pointer-events:none;background:#f6f1e7;display:block;position:fixed;inset:0;overflow:hidden}body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_lightScene{display:none}body[data-dsh-orca-link] ._0cMdVG_lightScene:after{content:\"\";z-index:2;background:linear-gradient(90deg,#f8fafd57 0%,#f8fafd2e 46%,#f8fafd05 72%),linear-gradient(#f8fafd08,#0000 68%,#eff3f829);position:absolute;inset:0}body[data-dsh-orca-link] ._0cMdVG_lightSceneLayer{z-index:1;opacity:0;filter:saturate(.9)contrast(.98)blur();will-change:opacity, transform, filter;background-position:50%;background-repeat:no-repeat;background-size:cover;transition:opacity .64s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1),filter .64s cubic-bezier(.22,1,.36,1);position:absolute;inset:0;transform:scale(1.008)}body[data-dsh-orca-link] ._0cMdVG_lightSceneHero{opacity:.94;filter:saturate(.9)contrast(.98)blur();background-image:var(--orca-link-light-hero-art);transform:scale(1)translateY(0)}body[data-dsh-orca-link] ._0cMdVG_lightSceneActive{opacity:0;filter:saturate(.9)contrast(.98)blur(2px);background-image:var(--orca-link-light-active-art);transform:scale(1.015)translateY(6px)}body[data-dsh-orca-link]:not([data-ds-dark-theme])[data-orca-scene=active] ._0cMdVG_lightSceneHero{opacity:0;filter:saturate(.9)contrast(.98)blur(2px);transform:scale(1.02)translateY(-8px)}body[data-dsh-orca-link]:not([data-ds-dark-theme])[data-orca-scene=active] ._0cMdVG_lightSceneActive{opacity:.94;filter:saturate(.9)contrast(.98)blur();transform:scale(1)translateY(0)}body[data-dsh-orca-link] ._0cMdVG_darkScene{z-index:0;pointer-events:none;background:#090d14;display:none;position:fixed;inset:0;overflow:hidden}body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_darkScene{display:block}body[data-dsh-orca-link] ._0cMdVG_darkScene:after{content:\"\";z-index:2;background:linear-gradient(90deg,#060a1094 0%,#060a1061 38%,#060a101f 68%,#060a102e 100%),linear-gradient(#05090f14,#070b121f 58%,#05090f57);position:absolute;inset:0}body[data-dsh-orca-link] ._0cMdVG_darkSceneLayer{z-index:1;opacity:0;filter:brightness(.88)saturate(.74)contrast(1.05)blur();will-change:opacity, transform, filter;background-position:50%;background-repeat:no-repeat;background-size:cover;transition:opacity .64s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1),filter .64s cubic-bezier(.22,1,.36,1);position:absolute;inset:0;transform:scale(1.01)}body[data-dsh-orca-link] ._0cMdVG_darkSceneHero{opacity:.94;filter:brightness(.88)saturate(.74)contrast(1.05)blur();background-image:var(--orca-link-dark-hero-art);transform:scale(1)translateY(0)}body[data-dsh-orca-link] ._0cMdVG_darkSceneActive{opacity:0;filter:brightness(.88)saturate(.74)contrast(1.05)blur(2px);background-image:var(--orca-link-dark-active-art);transform:scale(1.015)translateY(6px)}body[data-dsh-orca-link][data-ds-dark-theme][data-orca-scene=active] ._0cMdVG_darkSceneHero{opacity:0;filter:brightness(.88)saturate(.74)contrast(1.05)blur(2px);transform:scale(1.02)translateY(-8px)}body[data-dsh-orca-link][data-ds-dark-theme][data-orca-scene=active] ._0cMdVG_darkSceneActive{opacity:.94;filter:brightness(.88)saturate(.74)contrast(1.05)blur();transform:scale(1)translateY(0)}html[data-dsh-whale-orca-background=hidden] body[data-dsh-orca-link] :is(._0cMdVG_lightScene,._0cMdVG_darkScene){display:none!important}html[data-dsh-whale-orca-art=hidden] body[data-dsh-orca-link] :is(._0cMdVG_lightSceneLayer,._0cMdVG_darkSceneLayer){visibility:hidden;opacity:0!important}html[data-dsh-whale-orca-character=hidden] body[data-dsh-orca-link] [data-skin-chrome=status-character],html[data-dsh-whale-orca-pricing=hidden] body[data-dsh-orca-link] [data-skin-chrome=pricing-light]{display:none!important}html[data-dsh-whale-orca-character=hidden] body[data-dsh-orca-link]{--orca-stage:120px}html[data-dsh-whale-orca-character=hidden] body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):after{content:none}body[data-dsh-orca-link][data-orca-settings-open] [id=root]{z-index:var(--orca-settings-overlay-z)!important}body[data-dsh-orca-link][data-orca-cordis-panel-open] [id=root]{z-index:var(--orca-z-cordis)!important}body[data-dsh-orca-link][data-orca-settings-in-sidebar] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child){z-index:auto;isolation:auto}body[data-dsh-orca-link][data-orca-settings-in-sidebar] [class*=sidebarCol]{z-index:auto;position:relative;overflow:visible}body[data-dsh-orca-link][data-orca-settings-open] [class*=toggleCluster],body[data-dsh-orca-link][data-orca-settings-open] :is(._0cMdVG_spine,._0cMdVG_signalChip,._0cMdVG_standby,._0cMdVG_statusCharacter,._0cMdVG_pricingLight){opacity:0;visibility:hidden;pointer-events:none}body[data-dsh-orca-link][data-orca-settings-open] [data-slot=sidebar]>:first-child>:has([role=dialog]){z-index:auto;position:relative;opacity:1!important;transition:none!important;animation:none!important}body[data-dsh-orca-link] [role=dialog]{--orca-dialog-bg:#fbf7ef;background:var(--orca-dialog-bg)}body[data-dsh-orca-link][data-ds-dark-theme] [role=dialog]{--orca-dialog-bg:#0f151f}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){z-index:var(--orca-settings-overlay-z);isolation:isolate;box-sizing:border-box;pointer-events:auto;padding:24px;position:fixed;inset:0}body[data-dsh-orca-link][data-orca-settings-open]>[role=presentation]:has(>[role=dialog][data-shortcut-modal=settings]){z-index:calc(var(--orca-settings-overlay-z) + 1)}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>:first-child{z-index:0;animation:.17s ease-out both _0cMdVG_orcaSettingsMaskIn}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{z-index:1;border:1px solid var(--orca-line);width:min(800px,100vw - 48px);max-width:none;height:min(760px,100vh - 48px);box-shadow:var(--orca-shadow);transform-origin:0 100%;animation:.2s ease-out both _0cMdVG_orcaSettingsPanelIn;position:relative}body[data-dsh-orca-link][data-orca-cordis-panel-open] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child){z-index:auto;isolation:auto}body[data-dsh-orca-link][data-orca-cordis-panel-open] [data-slot=sidebar]>:first-child>:has([data-cordis-panel]){z-index:auto;position:relative}body[data-dsh-orca-link][data-orca-cordis-panel-open] [data-cordis-panel]{z-index:var(--orca-z-cordis)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) *,body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) :before,body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) :after{border-radius:0!important}@keyframes _0cMdVG_orcaSettingsMaskIn{0%{opacity:0}to{opacity:1}}@keyframes _0cMdVG_orcaSettingsPanelIn{0%{opacity:0;box-shadow:none}to{opacity:1;box-shadow:var(--orca-shadow)}}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav{min-height:0;padding-bottom:24px;position:relative;overflow:hidden}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:first-child{flex-shrink:0}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:last-child{scrollbar-width:none;flex:0 auto;min-width:0;min-height:0;overflow-y:auto}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:last-child>button{flex-shrink:0}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:last-child::-webkit-scrollbar{display:none}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav[data-orca-settings-more]:after{content:\"\";box-sizing:border-box;border:solid var(--orca-blue);pointer-events:none;border-width:0 2px 2px 0;width:10px;height:10px;position:absolute;bottom:9px;left:calc(50% - 5px);transform:rotate(45deg)}@media (width>=1100px) and (height>=681px){body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){justify-content:flex-start;align-items:flex-end;padding:18px 18px 18px 72px}body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){padding-left:calc(var(--orca-sidebar-width) + 16px)}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{width:min(760px,100vw - 108px);height:min(680px,100vh - 36px)}body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{width:min(760px, calc(100vw - var(--orca-sidebar-width) - 34px))}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav{border-right:1px solid var(--orca-line);justify-content:safe flex-end;padding-bottom:24px}body[data-dsh-orca-link][data-orca-settings-open] ._0cMdVG_statusCharacter{opacity:1;visibility:visible;pointer-events:none}html[data-dsh-whale-orca-settings-layout=centered] body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){justify-content:center;align-items:center;padding:24px}html[data-dsh-whale-orca-settings-layout=centered] body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){padding-left:24px}html[data-dsh-whale-orca-settings-layout=centered] body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog],html[data-dsh-whale-orca-settings-layout=centered] body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{transform-origin:50%;width:min(800px,100vw - 48px);height:min(760px,100vh - 48px)}html[data-dsh-whale-orca-settings-layout=centered] body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav{justify-content:flex-start;padding-bottom:24px}}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings])>nav button[aria-current=true]{background:color-mix(in srgb, var(--orca-blue) 18%, transparent);color:var(--orca-ink)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings])>nav button+button{border-top:2px solid color-mix(in srgb, var(--orca-blue) 28%, transparent);border-radius:0}@media (width<=1099px),(height<=680px){body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings]))){padding:0}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{width:100vw;max-width:none;height:100dvh;max-height:none;box-shadow:none;border:0}}@media (width<=640px){body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]{flex-direction:column}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav{box-sizing:border-box;border-bottom:1px solid var(--orca-line);gap:8px;width:100%;max-height:40%;padding:10px 12px 24px}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:last-child{grid-template-columns:repeat(3,minmax(0,1fr));align-content:start;gap:4px;display:grid}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:first-child{padding:0 4px}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav button{min-width:0;height:36px;padding:7px 8px}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div{min-height:0}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:first-child{height:auto;min-height:46px;padding:8px 10px}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child{padding:0 14px 16px}}@media (width<=420px){body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav>:last-child{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=520px){body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child [class$=_row]:has(>[class$=_rowText]){flex-direction:column;align-items:stretch}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child [class$=_rowText]{width:100%;padding-right:0}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child [class$=_row]:has(>[class$=_rowText])>:last-child,body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child [class$=_row]:has(>[class$=_rowText]) [class$=_selector]{box-sizing:border-box;width:100%;max-width:none}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]>nav+div>:last-child [class$=_selector]{justify-content:space-between}}body[data-dsh-orca-link] [role=menu]{pointer-events:auto;background:#fbf7ef}body[data-dsh-orca-link][data-ds-dark-theme] [role=menu]{background:#0f151f}body[data-dsh-orca-link]{--orca-permission-read:#168aa6;--orca-permission-write:#b8780c;--orca-permission-full:#c74440}body[data-dsh-orca-link][data-ds-dark-theme]{--orca-permission-read:#45c7df;--orca-permission-write:#e5ad45;--orca-permission-full:#ff7771}body[data-dsh-orca-link] :is([data-composer-seat] button,[role=menuitem])[data-orca-permission=read]{color:var(--orca-permission-read)}body[data-dsh-orca-link] :is([data-composer-seat] button,[role=menuitem])[data-orca-permission=write]{color:var(--orca-permission-write)}body[data-dsh-orca-link] :is([data-composer-seat] button,[role=menuitem])[data-orca-permission=full]{color:var(--orca-permission-full)}body[data-dsh-orca-link] [data-composer-seat] button:not([role=menuitem])[data-orca-permission]{border-left:1px solid color-mix(in srgb, currentColor 34%, transparent);background:color-mix(in srgb, currentColor 5%, transparent)}body[data-dsh-orca-link] [role=menuitem][data-orca-permission]{border-left:2px solid #0000}body[data-dsh-orca-link] [role=menuitem][data-orca-permission]:hover,body[data-dsh-orca-link] [role=menuitem][data-orca-permission]:has(>svg[data-orca-link-icon=check]){border-left-color:color-mix(in srgb, currentColor 64%, transparent);background:color-mix(in srgb, currentColor 7%, transparent)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) [class$=_cubeRow]>button[class*=_themeCube]{flex-direction:row;justify-content:center;align-items:center;gap:8px;min-height:64px;padding-block:0;line-height:22px;position:relative}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) [class$=_cubeRow]>button[class*=_themeCube]>svg{flex:none}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) [class$=_cubeRow]>button[class*=_themeCube][aria-pressed=true]:after{content:\"\";border:1px solid var(--orca-blue);background:var(--orca-blue);clip-path:polygon(0 0,100% 0,100% 100%,58% 100%,58% 42%,0 42%);width:7px;height:7px;position:absolute;top:10px;right:10px}@supports (appearance:base-select){body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select{appearance:base-select;border:1px solid var(--orca-line);background:color-mix(in srgb, var(--orca-surface-strong) 94%, transparent);min-height:34px;box-shadow:inset 3px 0 0 color-mix(in srgb, var(--orca-blue) 24%, transparent);text-align:left;white-space:nowrap;text-overflow:ellipsis;align-items:center;display:flex;overflow:hidden}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select[class$=_selectInput]{box-sizing:border-box;text-align:left;align-items:center;height:34px;padding-block:0;padding-inline:10px;line-height:22px;display:flex}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select:hover{border-color:color-mix(in srgb, var(--orca-blue) 42%, var(--orca-line));box-shadow:inset 3px 0 0 color-mix(in srgb, var(--orca-blue) 58%, transparent)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select::picker-icon{content:\"\";clip-path:polygon(0 0,100% 0,50% 100%);background:currentColor;flex:none;width:8px;height:6px;margin-left:10px;transition:transform .14s}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select[class$=_selectInput]::picker-icon{flex:none;margin-left:auto}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select:open::picker-icon{transform:rotate(180deg)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select::picker(select){appearance:base-select;border:1px solid color-mix(in srgb, var(--orca-graphite) 34%, transparent);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 7%, transparent), transparent 42%), color-mix(in srgb, var(--orca-surface-strong) 98%, transparent);max-height:min(420px,62vh);color:var(--orca-ink);scrollbar-color:color-mix(in srgb, var(--orca-graphite) 42%, transparent) transparent;margin-block:4px;padding:4px;box-shadow:8px 10px #1b273a14,0 18px 42px #1b273a29}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select option{min-height:30px;color:var(--orca-graphite);letter-spacing:.01em;white-space:nowrap;text-overflow:ellipsis;background:0 0;border-left:2px solid #0000;align-items:center;padding:7px 30px 7px 10px;font:500 12px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select option:hover,body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select option:focus-visible{border-left-color:color-mix(in srgb, var(--orca-blue) 48%, transparent);background:color-mix(in srgb, var(--orca-blue) 7%, transparent);color:var(--orca-ink)}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select option:checked{border-left-color:var(--orca-blue);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 16%, transparent), transparent 74%);color:var(--orca-blue);font-weight:700}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings] [role=dialog],[role=dialog][data-shortcut-modal=settings]) select option::checkmark{content:\"\";clip-path:polygon(0 0,100% 0,100% 100%,58% 100%,58% 42%,0 42%);background:currentColor;border:1px solid;width:7px;height:7px;margin-left:auto}}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_cell],[class$=_groupTitle],[role=menuitemradio] [class$=_modelName]){border:1px solid color-mix(in srgb, var(--orca-graphite) 34%, transparent);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 7%, transparent), transparent 42%), #fbf7ef;border-radius:0;width:min(276px,100vw - 32px);padding:4px;box-shadow:8px 10px #1b273a14,0 18px 42px #1b273a29}body[data-dsh-orca-link][data-ds-dark-theme] [role=menu][class$=_menu]:has([class$=_cell],[class$=_groupTitle],[role=menuitemradio] [class$=_modelName]){background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 10%, transparent), transparent 42%), #0f151f}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_groupTitle]) [class$=_groupTitle]{border-bottom:1px solid color-mix(in srgb, var(--orca-graphite) 16%, transparent);color:var(--orca-graphite-soft);letter-spacing:.08em;background:#fbf7ef;align-items:center;gap:6px;padding:7px 8px 5px;font:600 10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;display:flex}body[data-dsh-orca-link][data-ds-dark-theme] [role=menu][class$=_menu]:has([class$=_groupTitle]) [class$=_groupTitle]{background:#0f151f}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_groupTitle]) [class$=_groupTitle]:before{content:\"\";border:1px solid;width:4px;height:4px}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio]{background:0 0;border:0;border-left:2px solid #0000;border-radius:0;min-height:38px;padding:6px 8px}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio]:is(:hover,:focus-visible){border-left-color:color-mix(in srgb, var(--orca-blue) 48%, transparent);background:color-mix(in srgb, var(--orca-blue) 7%, transparent)}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio][aria-checked=true]{border-left-color:var(--orca-blue);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 16%, transparent), transparent 74%);color:var(--orca-blue)}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio] [class$=_modelName]{letter-spacing:.01em;font:600 12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio] [class$=_description]{margin-top:2px;font-size:11px}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio][aria-checked=true] [class$=_check]>svg{display:none}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([role=menuitemradio] [class$=_modelName]) [role=menuitemradio][aria-checked=true] [class$=_check]:before{content:\"\";clip-path:polygon(0 0,100% 0,100% 100%,58% 100%,58% 42%,0 42%);background:currentColor;border:1px solid;width:7px;height:7px}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_cell]) [role=menuitem]{border-radius:0}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_cell]) [class$=_cell]{border-left:2px solid #0000;min-height:40px}body[data-dsh-orca-link] [role=menu][class$=_menu]:has([class$=_cell]) [class$=_cell]:hover{border-left-color:color-mix(in srgb, var(--orca-blue) 48%, transparent);background:color-mix(in srgb, var(--orca-blue) 7%, transparent)}body[data-dsh-orca-link] [data-orca-link-brand]>svg,body[data-dsh-orca-link] [data-orca-link-brand] [data-slot=\"sidebar.brand.mark\"] svg{display:none}body[data-dsh-orca-link] [data-orca-link-brand] [data-slot=\"sidebar.brand.name\"]{display:none!important}body[data-dsh-orca-link] [data-orca-link-brand]{align-self:center;height:30px}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>:first-child{position:relative}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>:first-child:after{content:\"\";z-index:2;opacity:0;pointer-events:none;will-change:transform, opacity;background:linear-gradient(#0000,#007effe6 24%,#c9f5ff 52%,#007effd1 76%,#0000);border-radius:0;width:2px;height:30px;position:absolute;top:15px;left:4px;transform:translate(0)scaleY(.72);box-shadow:0 0 5px #007eff8c,0 0 12px #007eff47}body[data-dsh-orca-link] ._0cMdVG_dshWordmark{z-index:1;color:#11151b;opacity:.82;pointer-events:none;width:118px;min-width:118px;max-width:none;height:30px;transform:translateX(calc((var(--orca-sidebar-width,56px) - 118px) / 2)) scale(.28);transform-origin:50%;transition:opacity .22s,transform .26s cubic-bezier(.22,1,.36,1);display:block;position:absolute;top:21px;left:0}body[data-dsh-orca-link][data-orca-sidebar-wide] ._0cMdVG_dshWordmark{opacity:1;transform:translate(16px)scale(1)}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>:first-child:after{animation:.36s cubic-bezier(.22,1,.36,1) both _0cMdVG_orcaWordmarkScan}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child>:first-child>button:first-of-type>svg,body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child>:first-child>button:first-of-type [data-slot=\"sidebar.brand.mark\"] svg{opacity:0}body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_dshWordmark{color:#eef4ff}@keyframes _0cMdVG_orcaWordmarkScan{0%{opacity:0;transform:translate(0)scaleY(.72)}18%{opacity:.92}72%{opacity:.58}to{opacity:0;transform:translate(116px)scaleY(1)}}body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child){isolation:isolate;background-color:#faf7f1a3;position:relative;overflow:hidden}body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):before{z-index:0;width:var(--orca-sidebar-art-width,280px);content:\"\";pointer-events:none;background-image:linear-gradient(180deg, #faf7f18c 0%, #faf7f100 76px), linear-gradient(180deg, #faf7f100 0, #faf7f100 calc(var(--orca-stage,300px) - 1px), #faf7f1e6 var(--orca-stage,300px), #faf7f1f0 100%), repeating-linear-gradient(90deg, #2b374838 0 1px, transparent 1px 7px);background-position:0 0, 0 0, 0 calc(var(--orca-stage,300px) - 10px);opacity:0;transition:opacity .15s var(--ds-ease-in-out,ease-in-out);will-change:opacity;background-repeat:no-repeat;background-size:100% 100%,100% 100%,100% 8px;position:absolute;inset:0 auto 0 0}body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child)>:not([role=tooltip],[data-orca-link-wordmark],[data-plugin-entry]){z-index:1;position:relative}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry],nav[class*=panelList]){z-index:3;margin-top:calc(var(--orca-stage,300px) - 116px);position:relative}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child:has(>:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry],nav[class*=panelList])) [class*=regionArea],body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry])~:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry]),body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>nav[class*=panelList]~:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry]){margin-top:0}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>:has([role=tooltip]){z-index:auto}body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):has([role=tooltip]){z-index:auto;isolation:auto}body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):before{opacity:1;transition-duration:.2s}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_statusCharacter{--orca-character-signal:var(--orca-cyan);z-index:1;width:calc(var(--orca-sidebar-art-width,280px) - 30px);height:calc(var(--orca-stage,300px) - 66px);pointer-events:none;opacity:0;clip-path:inset(0 100% 0 0);will-change:clip-path, transform, opacity;transition:opacity .1s ease-in,clip-path .18s cubic-bezier(.4,0,1,1),transform .18s cubic-bezier(.4,0,1,1);position:absolute;top:58px;left:22px;overflow:visible;transform:translate(-8px)}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>._0cMdVG_statusCharacter{opacity:1;clip-path:inset(0);transition-timing-function:ease-out,cubic-bezier(.16,1,.3,1),cubic-bezier(.16,1,.3,1);transform:translate(0)}body[data-dsh-orca-link] ._0cMdVG_statusCharacterFrame{--orca-character-mirror:1;width:calc(var(--orca-stage,300px) - 66px);height:100%;transform:scaleX(var(--orca-character-mirror));will-change:transform;margin-inline:auto;animation:1.06s steps(8,end) infinite _0cMdVG_orcaGateWeave;position:absolute;inset:0;overflow:hidden}html[data-dsh-whale-orca-character-mirror=mirrored] body[data-dsh-orca-link] ._0cMdVG_statusCharacterFrame{--orca-character-mirror:-1}body[data-dsh-orca-link] ._0cMdVG_statusCharacterSprite{background-image:var(--orca-link-status-atlas);background-position:var(--orca-status-x,0%) var(--orca-status-y,0%);image-rendering:auto;filter:sepia(.124)saturate(.945)contrast(1.112)brightness(.988)drop-shadow(.45px .65px #4c2f1638);background-repeat:no-repeat;background-size:800% 1000%;position:absolute;inset:0}body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_statusCharacterSprite{filter:sepia(.08)saturate(.78)contrast(.96)brightness(.78)drop-shadow(.45px .65px #00000059)}body[data-dsh-orca-link] ._0cMdVG_statusCharacterBubble{z-index:2;box-sizing:border-box;border:1px solid color-mix(in srgb, var(--orca-character-signal) 66%, transparent);background:color-mix(in srgb, var(--orca-character-signal) 8%, #fffcf6f5);width:44px;height:35px;color:var(--orca-character-signal);opacity:0;transform-origin:30% 100%;place-items:center;font:700 16px/1 ui-monospace,SFMono-Regular,Consolas,monospace;transition:opacity .12s,transform .16s cubic-bezier(.16,1,.3,1);display:grid;position:absolute;top:2px;right:2px;transform:translateY(4px)scale(.94);box-shadow:0 8px 18px #1a26371f}body[data-dsh-orca-link] ._0cMdVG_statusCharacterBubble:after{content:\"\";border-left:1px solid color-mix(in srgb, var(--orca-character-signal) 66%, transparent);border-bottom:1px solid color-mix(in srgb, var(--orca-character-signal) 66%, transparent);background:inherit;width:9px;height:9px;position:absolute;bottom:-6px;left:8px;right:auto;transform:skewY(-45deg)}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=input],body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=review]{--orca-character-signal:#8859d6}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=approval]{--orca-character-signal:var(--orca-permission-write)}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=fault]{--orca-character-signal:#d14343}body[data-dsh-orca-link] ._0cMdVG_statusCharacter:is([data-orca-link-status=approval],[data-orca-link-status=input],[data-orca-link-status=review],[data-orca-link-status=fault]) ._0cMdVG_statusCharacterBubble{opacity:1;transform:translateY(0)scale(1)}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=input] [data-orca-link-character-bubble-glyph]:before{content:\"...\";letter-spacing:.08em}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=fault] [data-orca-link-character-bubble-glyph]:before{content:\"?\"}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=approval] [data-orca-link-character-bubble-glyph]{clip-path:polygon(50% 0,100% 18%,86% 76%,50% 100%,14% 76%,0 18%);border:2px solid;width:15px;height:17px;display:block;position:relative}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=approval] [data-orca-link-character-bubble-glyph]:before{content:\"\";background:currentColor;width:3px;height:6px;position:absolute;top:7px;left:6px}body[data-dsh-orca-link] ._0cMdVG_statusCharacter[data-orca-link-status=review] [data-orca-link-character-bubble-glyph]{box-sizing:border-box;background:linear-gradient(currentColor,currentColor) 3px 5px/7px 1px no-repeat,linear-gradient(currentColor,currentColor) 3px 9px/7px 1px no-repeat;border:2px solid;width:15px;height:18px}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-orca-link-brand]{pointer-events:none}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *){z-index:2;box-shadow:none;color:#0000;background:0 0;border-color:#0000;position:relative;overflow:visible}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *)>*{opacity:0;pointer-events:none}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):before{height:calc(var(--orca-stage,300px) - 60px);content:\"\";cursor:pointer;opacity:0;background:linear-gradient(var(--orca-blue), var(--orca-blue)) left top / 18px 1px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) left top / 1px 18px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) right top / 18px 1px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) right top / 1px 18px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) left bottom / 18px 1px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) left bottom / 1px 18px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) right bottom / 18px 1px no-repeat, linear-gradient(var(--orca-blue), var(--orca-blue)) right bottom / 1px 18px no-repeat;box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--orca-blue) 12%, transparent);transition:opacity .16s;position:absolute;top:-14px;left:-14px;right:-14px}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):after{top:calc(var(--orca-stage,300px) - 86px);content:\"\";background:var(--orca-blue);clip-path:polygon(100% 0,100% 100%,0 100%);opacity:.36;width:9px;height:9px;transition:opacity .16s,transform .16s;position:absolute;right:-10px}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):hover:before,html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):focus-visible:before{opacity:.62}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):hover:after,html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):focus-visible:after{opacity:.92;transform:translate(-2px,-2px)}html:not([data-dsh-whale-orca-character=hidden]) body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry],[data-plugin-entry] *):focus-visible{outline:none}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry]){clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%);border-radius:0;position:relative}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry])>svg{opacity:0}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry]):before{box-sizing:border-box;content:\"\";background:linear-gradient(currentColor,currentColor) 0 0/11.4px 1.3px no-repeat,linear-gradient(currentColor,currentColor) 0 100%/11.4px 1.3px no-repeat,linear-gradient(currentColor,currentColor) 0 0/1.3px 11.4px no-repeat,linear-gradient(currentColor,currentColor) 100% 0/1.3px 11.4px no-repeat,linear-gradient(currentColor,currentColor) 50%/6.15px 1.3px no-repeat,linear-gradient(currentColor,currentColor) 50%/1.3px 6.15px no-repeat;width:11.4px;height:11.4px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession]{z-index:30;clip-path:none;color:var(--dsw-alias-label-secondary);position:fixed}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession]>*{opacity:1}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession]:before,html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession]:after{content:none}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>[class*=logoRow]>button[class*=toggle]>svg,html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession] svg{color:currentColor;opacity:1}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>[class*=logoRow]>button[class*=toggle]:is(:hover,:focus-visible),html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>button[class*=newSession]:is(:hover,:focus-visible){background:color-mix(in srgb, var(--dsw-alias-label-secondary) 14%, transparent)}html[data-windows-titlebar] body[data-dsh-orca-link]>[data-windows-menu]{--dsw-alias-interactive-bg-hover:color-mix(in srgb, var(--dsw-alias-label-secondary) 14%, transparent)}html[data-windows-titlebar] body[data-dsh-orca-link] [data-slot=sidebar]>[class*=root]:not([class*=collapsed])>[class*=logoRow]>button[class*=toggle]:is(:hover,:focus-visible){background:color-mix(in srgb, var(--dsw-alias-label-secondary) 14%, transparent)}html[data-windows-titlebar] body[data-dsh-orca-link] :is([data-pane=conversation],[class*=centerCol]){border-radius:0}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar]>:first-child,body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar] [class*=regionArea],body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar] [class*=sectionHeader],body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar] [class*=headerActions]{overflow:visible}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar] [role=tooltip]{z-index:var(--orca-z-tooltip)}body[data-dsh-orca-link][data-orca-window-resuming] [data-slot=sidebar] [role=tooltip]{display:none}body[data-dsh-orca-link][data-orca-sidebar-wide] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):after{content:\"ORCA LINK\";z-index:1;top:calc(76px + (var(--orca-stage,300px) - 76px) / 2);writing-mode:vertical-rl;letter-spacing:.42em;color:var(--orca-muted);text-shadow:0 1px #ffffffb8;pointer-events:none;font:600 8px/1 ui-monospace,SFMono-Regular,Consolas,monospace;position:absolute;left:9px;transform:translateY(-50%)}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar] [class*=regionArea]{isolation:isolate;margin-top:calc(var(--orca-stage,300px) - 120px);border-top:1px solid var(--orca-line);backdrop-filter:none;background:0 0}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar] [class*=regionArea]:before{z-index:-1;content:\"\";pointer-events:none;backdrop-filter:blur(10px)saturate(1.03);background:#fdfaf4e6;position:absolute;inset:0}body[data-dsh-orca-link][data-ds-dark-theme] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child){background-color:#080c13e0}body[data-dsh-orca-link][data-ds-dark-theme] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):before{background-image:linear-gradient(180deg, #080c13ad 0%, #080c1314 76px), linear-gradient(180deg, #080c1347 0, #080c1357 calc(var(--orca-stage,300px) - 1px), #080c13eb var(--orca-stage,300px), #080c13f2 100%), repeating-linear-gradient(90deg, #b4c7e233 0 1px, transparent 1px 7px)}body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_statusCharacterBubble{background:color-mix(in srgb, var(--orca-character-signal) 12%, #0c121bf5);box-shadow:0 8px 18px #00000047}body[data-dsh-orca-link][data-ds-dark-theme][data-orca-sidebar-wide] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):after{text-shadow:0 1px 1px #0009}body[data-dsh-orca-link][data-ds-dark-theme][data-orca-sidebar-wide] [data-slot=sidebar] [class*=regionArea]:before{background:#0a0f17e0}body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]{clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);border:1px solid #0000;border-radius:0;position:relative}body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]:after{content:\"\";border-top:1px solid var(--orca-blue);border-right:1px solid var(--orca-blue);opacity:0;width:7px;height:7px;transition:opacity .14s,transform .14s;position:absolute;top:7px;right:7px;transform:translate(-3px,3px)}body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]:hover{border-color:color-mix(in srgb, var(--orca-blue) 28%, transparent);background:color-mix(in srgb, var(--orca-blue) 5.5%, transparent);box-shadow:inset 2px 0 0 var(--orca-blue)}body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]:hover:after,body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]:focus-visible:after{opacity:.72;transform:translate(0)}body[data-dsh-orca-link]:not([data-orca-sidebar-wide]) [data-slot=sidebar] button[aria-haspopup=dialog]:after{background:var(--orca-blue);clip-path:polygon(100% 0,100% 100%,0 100%);border:none;width:6px;height:6px;top:auto;bottom:3px;right:3px}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]{--orca-tree-guide:#2b374829}body[data-dsh-orca-link][data-ds-dark-theme] [data-slot=sidebar] [role=tree]{--orca-tree-guide:#b4c7e22e}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-expanded]){padding:3px 0 5px;position:relative}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-expanded])+div:has([role=treeitem][aria-expanded]){border-top:1px solid color-mix(in srgb, var(--orca-tree-guide) 72%, transparent);margin-top:2px}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected]):before{z-index:0;content:\"\";background:var(--orca-tree-guide);pointer-events:none;width:1px;position:absolute;top:41px;bottom:7px;left:11px}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem]{text-shadow:none}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]{box-sizing:border-box;background:0 0;border-radius:0;align-items:center;height:38px;min-height:38px;padding:0 8px;position:relative}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]:before{content:\"\";pointer-events:none;position:absolute;left:0}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=true]{border-left:2px solid color-mix(in srgb, var(--orca-graphite) 34%, transparent);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-graphite) 6%, transparent), transparent 68%);color:var(--orca-ink);box-shadow:inset 0 -1px 0 color-mix(in srgb, var(--orca-graphite) 10%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=true]:before{background:color-mix(in srgb, var(--orca-graphite) 48%, transparent);width:2px;box-shadow:3px 0 0 color-mix(in srgb, var(--orca-graphite) 12%, transparent);top:6px;bottom:6px}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=false]{border-left:1px solid color-mix(in srgb, var(--orca-graphite) 18%, transparent);color:color-mix(in srgb, var(--orca-graphite) 76%, var(--orca-muted));background:linear-gradient(90deg, color-mix(in srgb, var(--orca-graphite) 3%, transparent), transparent 58%)}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=false]:before{border:1px solid color-mix(in srgb, var(--orca-muted) 58%, transparent);background:var(--orca-surface-strong);width:5px;height:5px;top:16px;transform:translate(-3px)}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=true] svg[data-orca-link-icon=folder-open]{color:color-mix(in srgb, var(--orca-graphite) 82%, var(--orca-muted))}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=false] svg[data-orca-link-icon=folder-closed]{color:var(--orca-muted)}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]>span:nth-child(3){flex-direction:row;align-items:center;gap:8px}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]>span:nth-child(3)>span:first-child{font-weight:600}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=true]>span:nth-child(3)>span:first-child{letter-spacing:.015em;font-weight:700}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded=false]>span:nth-child(3)>span:first-child{font-weight:500}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]>span:nth-child(3)>span:nth-child(2){letter-spacing:.04em;color:var(--orca-muted);flex:none;margin-left:auto;font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}body[data-dsh-orca-link] [data-slot=sidebar] [role=treeitem][aria-expanded]:hover{background:color-mix(in srgb, var(--orca-blue) 5.5%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected=true]) [role=treeitem][aria-expanded]{border-left-color:var(--orca-blue);background:linear-gradient(90deg, color-mix(in srgb, var(--orca-blue) 15%, transparent), color-mix(in srgb, var(--orca-blue) 3.5%, transparent) 72%, transparent);box-shadow:inset 0 -1px 0 color-mix(in srgb, var(--orca-blue) 20%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected=true]) [role=treeitem][aria-expanded]:before{background:var(--orca-blue);box-shadow:3px 0 0 color-mix(in srgb, var(--orca-blue) 20%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected=true]) [role=treeitem][aria-expanded]:after{content:\"\";background:var(--orca-blue);width:5px;height:5px;box-shadow:3px 0 0 color-mix(in srgb, var(--orca-blue) 22%, transparent);pointer-events:none;position:absolute;top:16px;left:-1px}body[data-dsh-orca-link] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected=true]) [role=treeitem][aria-expanded] svg[data-orca-link-icon^=folder-]{color:var(--orca-blue)}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected]{z-index:1;box-sizing:border-box;backdrop-filter:none;width:calc(100% - 18px);height:34px;box-shadow:none;background:0 0;border-radius:0;margin-left:18px;padding:0 7px 0 9px;position:relative}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected]:before{content:\"\";background:var(--orca-tree-guide);pointer-events:none;width:7px;height:1px;position:absolute;top:50%;left:-7px}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected]>span:nth-child(2){text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px;overflow:hidden}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected]>span:nth-child(3):not(:has(button)){text-align:right;flex:0 0 44px;margin-left:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected]:hover{background:color-mix(in srgb, var(--orca-blue) 5.5%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected=true]{background:color-mix(in srgb, var(--orca-blue) 10%, transparent)}body[data-dsh-orca-link] [data-slot=sidebar] div[role=treeitem][aria-selected=true]:after{content:\"\";background:var(--orca-blue);pointer-events:none;width:2px;position:absolute;top:6px;bottom:6px;left:0}body[data-dsh-orca-link][data-ds-dark-theme] [data-slot=sidebar] [role=treeitem][aria-expanded]:hover{background:#4d91ff17}body[data-dsh-orca-link][data-ds-dark-theme] [data-slot=sidebar] [role=tree]>div:has([role=treeitem][aria-selected=true]) [role=treeitem][aria-expanded]{background:linear-gradient(90deg,#4d91ff33,#4d91ff0f 72%,#0000)}body[data-dsh-orca-link][data-ds-dark-theme] [data-slot=sidebar] div[role=treeitem][aria-selected]:hover{background:#4d91ff17}body[data-dsh-orca-link][data-ds-dark-theme] [data-slot=sidebar] div[role=treeitem][aria-selected=true]{background:#4d91ff29}body[data-dsh-orca-link] :where(button,input,textarea,select,[role=dialog],[role=menu]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *){border-color:var(--orca-line)}body[data-dsh-orca-link] :where(input,textarea,select):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *){background-color:var(--dsw-specific-input-major);color:var(--orca-ink);-webkit-text-fill-color:var(--orca-ink);caret-color:var(--orca-blue)}body[data-dsh-orca-link] [data-composer-card] :is(input,textarea,[data-composer-input]){background-color:#0000}body[data-dsh-orca-link] [data-composer-card] [data-composer-input]{color:var(--orca-ink);caret-color:var(--orca-blue)}body[data-dsh-orca-link] :where(input,textarea):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *)::placeholder{color:color-mix(in srgb, var(--orca-muted) 62%, var(--orca-surface-strong));-webkit-text-fill-color:color-mix(in srgb, var(--orca-muted) 62%, var(--orca-surface-strong));opacity:1}body[data-dsh-orca-link] :where(input,textarea,select):focus:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *),body[data-dsh-orca-link] [data-composer-card]:focus-within{background-color:var(--dsw-input-solid)}body[data-dsh-orca-link] :where(button,[role=button]):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *){transition:border-color .14s,background-color .14s,box-shadow .14s,transform .14s}body[data-dsh-orca-link] :where(button:hover:not(:disabled),[role=button]:hover):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *){border-color:color-mix(in srgb, var(--orca-blue) 34%, transparent)}body[data-dsh-orca-link] :focus-visible:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *,[data-slot=\"sidebar.footer.action\"] *,[data-slot=settings\\.section] *){outline:2px solid var(--orca-blue);outline-offset:2px}body[data-dsh-orca-link] [data-question-key] :is(input,textarea):focus-visible{outline:none}body[data-dsh-orca-link] [data-question-key] :has(>input:focus){border-color:var(--orca-question-focus);box-shadow:inset 3px 0 0 var(--orca-question-focus), inset 0 0 0 1px var(--orca-question-focus-wash)}body[data-dsh-orca-link] [data-question-key] textarea:focus{border-color:var(--orca-question-focus);box-shadow:inset 3px 0 0 var(--orca-question-focus), inset 0 0 0 1px var(--orca-question-focus-wash);caret-color:var(--orca-question-focus)}body[data-dsh-orca-link] [data-question-key] [class*=_card],body[data-dsh-orca-link] [data-plan-review-key] [class*=_card],body[data-dsh-orca-link] [data-approval-key] [class*=_card],body[data-dsh-orca-link] [data-testid=todo-panel],body[data-dsh-orca-link] [data-question-key] [class*=_number],body[data-dsh-orca-link] [data-question-key] [class*=_customRow],body[data-dsh-orca-link] [data-question-key] [class*=_badge],body[data-dsh-orca-link] [data-plan-review-key] [class*=_dot],body[data-dsh-orca-link] [data-approval-key] [class*=_dot],body[data-dsh-orca-link] [data-queue-dock] [class*=_panel],body[data-dsh-orca-link] [data-queue-dock] [class*=_row],body[data-dsh-orca-link] [data-composer-card] [class*=_notice]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_chip]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_hlSegment]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_pending]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_panel]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_bar]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_segment]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-composer-card] [class*=_swatch]:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *),body[data-dsh-orca-link] [data-question-key] [class*=_checkbox]:before{border-radius:0!important}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status]>[class*=_glyph]{color:var(--dsw-alias-label-tertiary);position:relative}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status]>[class*=_glyph]>*{display:none}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status]>[class*=_glyph]:before{content:\"\";background:currentColor;width:16px;height:16px;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 6V2.25H6M10 2.25h3.75V6M13.75 10v3.75H10M6 13.75H2.25V10'/%3E%3C/svg%3E\") 50%/16px 16px no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 6V2.25H6M10 2.25h3.75V6M13.75 10v3.75H10M6 13.75H2.25V10'/%3E%3C/svg%3E\") 50%/16px 16px no-repeat}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=completed]>[class*=_glyph]{color:var(--dsw-alias-label-secondary)}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=completed]>[class*=_glyph]:before{-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 2.25h11.5v11.5H2.25z'/%3E%3Cpath d='M4.75 8.25 7 10.5l4.5-5'/%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 2.25h11.5v11.5H2.25z'/%3E%3Cpath d='M4.75 8.25 7 10.5l4.5-5'/%3E%3C/svg%3E\")}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=in_progress]>[class*=_glyph]{color:var(--orca-blue)}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=in_progress]>[class*=_glyph]:before{-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 2.25h11.5v11.5H2.25z'/%3E%3Crect x='4' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='4' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='4' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='M2.25 2.25h11.5v11.5H2.25z'/%3E%3Crect x='4' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='10' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='4' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='7' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='4' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='7' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3Crect x='10' y='4' width='2' height='2' fill='black' fill-opacity='0.12' stroke='none'/%3E%3C/svg%3E\")}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=in_progress]>[class*=_glyph]:after{content:\"\";clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,3.5px 12.5px,3.5px 9.5px,3.5px 9.5px);background:currentColor;animation:2.4s step-end infinite _0cMdVG_orcaTodoFill;position:absolute;inset:0;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Crect x='4' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='4' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='4' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3C/svg%3E\") 50%/16px 16px no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Crect x='4' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='10' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='4' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='7' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='4' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='7' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3Crect x='10' y='4' width='2' height='2' fill='black' stroke='none'/%3E%3C/svg%3E\") 50%/16px 16px no-repeat}@keyframes _0cMdVG_orcaTodoFill{0%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,3.5px 12.5px,3.5px 9.5px,3.5px 9.5px)}8%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,6.5px 12.5px,6.5px 9.5px,3.5px 9.5px)}16%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,9.5px 12.5px,9.5px 9.5px,3.5px 9.5px)}24%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 9.5px,3.5px 9.5px,3.5px 6.5px,3.5px 6.5px)}32%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 9.5px,6.5px 9.5px,6.5px 6.5px,3.5px 6.5px)}40%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 9.5px,9.5px 9.5px,9.5px 6.5px,3.5px 6.5px)}48%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 6.5px,3.5px 6.5px,3.5px 3.5px,3.5px 3.5px)}56%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 6.5px,6.5px 6.5px,6.5px 3.5px,3.5px 3.5px)}64%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 6.5px,9.5px 6.5px,9.5px 3.5px,3.5px 3.5px)}72%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 3.5px,3.5px 3.5px,3.5px .5px,3.5px .5px)}90%{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,3.5px 12.5px,3.5px 9.5px,3.5px 9.5px)}to{clip-path:polygon(3.5px 12.5px,12.5px 12.5px,12.5px 12.5px,3.5px 12.5px,3.5px 9.5px,3.5px 9.5px)}}body[data-dsh-orca-link][data-ds-dark-theme] [data-question-key] [class*=_badge]{background:var(--dsw-specific-sidebar-nav-item-active-accent);color:var(--dsw-alias-brand-primary-invert)}body[data-dsh-orca-link] ::selection{color:#fff;background:var(--orca-blue)}body[data-dsh-orca-link] ::-webkit-scrollbar{width:9px;height:9px}body[data-dsh-orca-link] ::-webkit-scrollbar-track{background:0 0}body[data-dsh-orca-link] ::-webkit-scrollbar-thumb{background:#57657959 padding-box padding-box;border:2px solid #0000;border-radius:0}body[data-dsh-orca-link] ::-webkit-scrollbar-thumb:hover{background-color:var(--orca-blue)}body[data-dsh-orca-link] ._0cMdVG_signalChip{--orca-signal-color:var(--orca-cyan);--orca-signal-wash:color-mix(in srgb, var(--orca-signal-color) 8%, transparent);z-index:1;box-sizing:border-box;border-left:1px solid color-mix(in srgb, var(--orca-signal-color) 52%, transparent);background:linear-gradient(90deg, var(--orca-signal-wash), transparent 90%);min-height:18px;color:color-mix(in srgb, var(--orca-signal-color) 70%, var(--orca-graphite));white-space:nowrap;pointer-events:none;letter-spacing:.2em;opacity:0;align-items:center;gap:7px;padding:4px 7px 4px 6px;font:600 8px/1 ui-monospace,SFMono-Regular,Consolas,monospace;transition:opacity .22s 90ms,color .16s,border-color .16s,background-color .16s;display:flex;position:absolute;top:50%;left:136px;transform:translateY(-50%)}body[data-dsh-orca-link][data-orca-sidebar-wide] ._0cMdVG_signalChip{opacity:1}body[data-dsh-orca-link] ._0cMdVG_signalDot{background:var(--orca-signal-color);width:6px;height:6px;box-shadow:0 0 10px color-mix(in srgb, var(--orca-signal-color) 70%, transparent);border-radius:0;flex:0 0 6px;animation:2.6s ease-in-out infinite _0cMdVG_orcaSignalPulse}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=syncing],body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=working]{--orca-signal-color:var(--orca-blue)}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=approval]{--orca-signal-color:var(--orca-permission-write)}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=input],body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=review]{--orca-signal-color:#8859d6}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=complete]{--orca-signal-color:#238a58}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=fault]{--orca-signal-color:#d14343}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=offline]{--orca-signal-color:#798394}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=ready]{--orca-signal-color:#5483a8}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=working] ._0cMdVG_signalDot{animation:.92s steps(2,end) infinite _0cMdVG_orcaSignalWork}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=approval] ._0cMdVG_signalDot,body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=input] ._0cMdVG_signalDot,body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=review] ._0cMdVG_signalDot{animation-duration:.74s}body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=complete] ._0cMdVG_signalDot,body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=fault] ._0cMdVG_signalDot,body[data-dsh-orca-link] ._0cMdVG_signalChip[data-orca-link-status=offline] ._0cMdVG_signalDot{animation:none}@keyframes _0cMdVG_orcaSignalWork{0%,to{opacity:1;transform:scaleX(1)}50%{opacity:.38;transform:scaleX(.5)}}@keyframes _0cMdVG_orcaSignalPulse{0%,to{opacity:1}50%{opacity:.45}}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight{--orca-price-signal:#238a58;--orca-price-glow:#238a58b8;z-index:2;box-sizing:border-box;border:1px solid color-mix(in srgb, var(--orca-price-signal) 42%, var(--orca-line));background:color-mix(in srgb, var(--orca-price-signal) 7%, var(--orca-surface-strong));width:auto;color:var(--orca-price-signal);letter-spacing:.04em;text-align:center;cursor:default;will-change:transform, opacity;flex-direction:row;align-items:center;gap:3px;padding:1px 4px;font:700 6px/1 ui-monospace,SFMono-Regular,Consolas,monospace;transition:top .18s cubic-bezier(.16,1,.3,1),border-color .16s,background-color .16s,color .16s,box-shadow .16s;display:flex;position:absolute;top:55px;left:50%;transform:translate(-50%);box-shadow:0 5px 12px #1b273a24}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight{letter-spacing:.08em;cursor:help;gap:4px;padding:1px 5px;font-size:7px;top:46px;left:4px;transform:none}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight[data-orca-link-price=high]{--orca-price-signal:#d14343;--orca-price-glow:#d14343b8}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight[data-orca-link-price=transition]{--orca-price-signal:#dfa02b;--orca-price-glow:#dfa02bcc}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight[data-orca-link-price=low]{--orca-price-signal:#238a58;--orca-price-glow:#238a58b8}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>._0cMdVG_pricingLight[data-orca-link-price-other-model]{display:none}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>._0cMdVG_pricingLight{z-index:30;top:calc((var(--dsh-windows-titlebar-height,40px) - 20px) / 2);letter-spacing:.08em;pointer-events:none;justify-content:center;gap:4px;width:52px;height:20px;padding:0 5px;font-size:7px;transition:none;position:fixed;left:84px;transform:none}html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed] [data-slot=sidebar]>[class*=root][class*=collapsed]>._0cMdVG_pricingLight ._0cMdVG_pricingLamp{width:5px;height:5px}html[data-windows-titlebar] body[data-dsh-orca-link][data-orca-price-caption]>[data-windows-menu]{margin-left:60px}body[data-dsh-orca-link] ._0cMdVG_pricingHousing{flex-direction:row;align-items:center;gap:2px;display:flex}body[data-dsh-orca-link] ._0cMdVG_pricingLamp{box-sizing:border-box;border:1px solid var(--orca-line);opacity:.3;background:0 0;border-radius:0;width:4px;height:4px;transition:opacity .16s,background-color .16s,border-color .16s,box-shadow .16s}body[data-dsh-orca-link][data-orca-sidebar-wide] ._0cMdVG_pricingLamp{width:5px;height:5px}body[data-dsh-orca-link] ._0cMdVG_pricingLampRed{--orca-lamp-color:#d14343}body[data-dsh-orca-link] ._0cMdVG_pricingLampAmber{--orca-lamp-color:#dfa02b}body[data-dsh-orca-link] ._0cMdVG_pricingLampGreen{--orca-lamp-color:#238a58}body[data-dsh-orca-link] ._0cMdVG_pricingLight[data-orca-link-price=high] ._0cMdVG_pricingLampRed,body[data-dsh-orca-link] ._0cMdVG_pricingLight[data-orca-link-price=transition] ._0cMdVG_pricingLampAmber,body[data-dsh-orca-link] ._0cMdVG_pricingLight[data-orca-link-price=low] ._0cMdVG_pricingLampGreen{border-color:var(--orca-lamp-color);background:var(--orca-lamp-color);box-shadow:0 0 8px var(--orca-price-glow);opacity:1}body[data-dsh-orca-link] ._0cMdVG_pricingLight[data-orca-link-price=transition] ._0cMdVG_pricingLampAmber{animation:1.3s ease-in-out infinite _0cMdVG_orcaPricePulse}@keyframes _0cMdVG_orcaPricePulse{0%,to{opacity:1}50%{opacity:.35}}body[data-dsh-orca-link] ._0cMdVG_pricingLabel{white-space:nowrap;max-width:100%;display:block;overflow:hidden}body[data-dsh-orca-link] ._0cMdVG_pricingTooltip{z-index:4;box-sizing:border-box;border:1px solid var(--orca-line);background:var(--orca-surface-strong);width:226px;box-shadow:var(--orca-shadow);color:var(--orca-graphite);letter-spacing:.02em;text-align:left;white-space:normal;cursor:default;opacity:0;visibility:hidden;border-radius:0;gap:4px;padding:9px;font:600 9px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;transition:opacity .14s,transform .14s,visibility 0s linear .14s;display:grid;position:absolute;top:100%;left:0;transform:translateY(4px)}body[data-dsh-orca-link][data-orca-sidebar-wide] ._0cMdVG_pricingLight:hover ._0cMdVG_pricingTooltip{opacity:1;visibility:visible;transition:opacity .14s 70ms,transform .14s 70ms,visibility linear;transform:translateY(0)}body[data-dsh-orca-link] ._0cMdVG_pricingTooltipTitle{border-bottom:1px solid var(--orca-line);color:var(--orca-muted);letter-spacing:.2em;padding-bottom:4px;font-size:8px;font-weight:600}body[data-dsh-orca-link] ._0cMdVG_pricingTooltipRow{grid-template-columns:30px 1fr;gap:8px;display:grid}body[data-dsh-orca-link] ._0cMdVG_pricingTooltipKey{color:var(--orca-muted);font-weight:600}body[data-dsh-orca-link] ._0cMdVG_pricingTooltipValue{color:var(--orca-ink);font-weight:700}body[data-dsh-orca-link] ._0cMdVG_spine{top:0;bottom:0;left:var(--orca-sidebar-width);z-index:850;pointer-events:none;background:repeating-linear-gradient(180deg, var(--orca-line) 0 1px, transparent 1px 56px);width:9px;position:fixed;transform:translate(-4px);-webkit-mask-image:linear-gradient(#0000,#000 56px calc(100% - 56px),#0000);mask-image:linear-gradient(#0000,#000 56px calc(100% - 56px),#0000)}@media (width<=1099px){body[data-dsh-orca-link] ._0cMdVG_spine{display:none}}body[data-dsh-orca-link] [data-phase=hero] [class*=titleGroup]>span:not([class*=previewBadge]){min-width:8.2em;color:var(--orca-ink);letter-spacing:.04em;text-align:left;white-space:nowrap;font-size:30px;font-weight:700;display:inline-block}body[data-dsh-orca-link] [data-phase=hero] [class*=titleGroup]>span:not([class*=previewBadge]):after{content:\"\";background:var(--orca-blue);width:9px;height:9px;box-shadow:0 0 8px color-mix(in srgb, var(--orca-blue) 50%, transparent);margin-left:10px;animation:1.05s step-end infinite _0cMdVG_orca-terminal-caret;display:inline-block}@keyframes _0cMdVG_orca-terminal-caret{0%,48%{opacity:1}49%,to{opacity:0}}body[data-dsh-orca-link] [data-phase=hero] [class*=previewBadge]{border:1px solid var(--orca-line);color:var(--orca-muted);background:var(--orca-surface);letter-spacing:.22em;border-radius:0;padding:3px 8px 2px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:9px}body[data-dsh-orca-link] [data-phase=hero] [class*=heroGlow] ellipse{fill:var(--orca-blue);fill-opacity:.06}body[data-dsh-orca-link] [data-composer-card]{border-style:solid;border-color:var(--orca-line);background-color:var(--dsw-specific-input-major);box-shadow:var(--orca-shadow);border-radius:0;position:relative;container:_0cMdVG_orca-composer/inline-size}body[data-dsh-orca-link] [data-composer-card][class*=cardWorkspaceTrigger]:after{content:none;-webkit-mask:none;mask:none}body[data-dsh-orca-link] :is([role=menu],[role=listbox]){overscroll-behavior:contain}body[data-dsh-orca-link] [data-composer-card]:focus-within{border-color:color-mix(in srgb, var(--orca-blue) 45%, transparent);box-shadow:var(--orca-shadow), 0 0 0 3px color-mix(in srgb, var(--orca-blue) 10%, transparent)}body[data-dsh-orca-link] [data-composer-card]:not([class*=cardWorkspaceTrigger]):before,body[data-dsh-orca-link] [data-composer-card]:not([class*=cardWorkspaceTrigger]):after{z-index:5;content:\"\";border:1px solid color-mix(in srgb, var(--orca-graphite) 46%, transparent);pointer-events:none;width:7px;position:absolute;top:22%;bottom:22%}body[data-dsh-orca-link] [data-composer-card]:not([class*=cardWorkspaceTrigger]):before{border-right:0;left:-10px}body[data-dsh-orca-link] [data-composer-card]:not([class*=cardWorkspaceTrigger]):after{border-left:0;right:-10px}body[data-dsh-orca-link] [data-orca-composer-handle]{z-index:6;color:#0000;cursor:ew-resize;touch-action:none;background:0 0;border:0;outline:0;width:20px;height:64px;margin:0;padding:0;position:absolute;top:50%;transform:translateY(-50%)}body[data-dsh-orca-link] [data-orca-composer-handle=left]{left:-16px}body[data-dsh-orca-link] [data-orca-composer-handle=right]{right:-16px}body[data-dsh-orca-link][data-ds-dark-theme] [data-composer-card]:not([class*=cardWorkspaceTrigger]):before,body[data-dsh-orca-link][data-ds-dark-theme] [data-composer-card]:not([class*=cardWorkspaceTrigger]):after{border-color:color-mix(in srgb, var(--orca-graphite) 34%, transparent)}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat]{transition:opacity .3s,transform .34s cubic-bezier(.22,1,.36,1)}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat]:is([data-orca-composer-motion],[data-orca-composer-collapsing],[data-orca-composer-collapse-rebounding],[data-orca-composer-restoring]){will-change:opacity, transform}body[data-dsh-orca-link][data-orca-composer-handle-dragging]{cursor:ew-resize;user-select:none}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapse-dragging]{transition:none!important}body[data-dsh-orca-link] [data-composer-seat]:is([data-orca-composer-collapse-dragging],[data-orca-composer-collapse-rebounding],[data-orca-composer-collapsing],[data-orca-composer-restoring]) [data-composer-card]{transform-origin:50%;will-change:transform, opacity;transition:none!important}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapse-dragging] [data-composer-card]{transform:scale(var(--orca-composer-scale,1))}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapse-rebounding] [data-composer-card]{animation:.4s linear both _0cMdVG_orcaComposerRebound}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-manual-hidden]{pointer-events:none}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-manual-hidden]:not([data-orca-composer-collapsing]){opacity:0;transition:none}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapsing] [data-composer-card]{animation:.42s cubic-bezier(.32,0,.2,1) both _0cMdVG_orcaComposerFold}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-restoring] [data-composer-card]{animation:.5s linear both _0cMdVG_orcaComposerManualRestore}@keyframes _0cMdVG_orcaComposerRebound{0%{transform:scale(var(--orca-composer-scale,1));animation-timing-function:cubic-bezier(.16,1,.3,1)}65%{transform:scale(1.018)}82%{transform:scale(.996)}to{transform:none}}@keyframes _0cMdVG_orcaComposerFold{0%{opacity:1;transform:scale(var(--orca-composer-scale,1))}75%{opacity:.85}to{opacity:0;transform:translate(var(--orca-composer-dock-x,0px), var(--orca-composer-dock-y,0px)) scale(var(--orca-composer-dock-scale,.05))}}body[data-dsh-orca-link] [data-composer-card] :is([class*=triggerLabel],[class*=triggerEffort]){display:block!important}@container _0cMdVG_orca-composer (width<=260px){body[data-dsh-orca-link] [data-composer-card] :is([class*=triggerLabel],[class*=triggerEffort]){display:none!important}body[data-dsh-orca-link] [data-composer-card] :is([class*=_row],[class*=_tools],[class*=_modes],[class*=_trailing]){gap:2px}}@container _0cMdVG_orca-composer (width<=200px){body[data-dsh-orca-link] [data-composer-card] [class*=_row]{justify-content:center;padding-inline:4px}body[data-dsh-orca-link] [data-composer-card] :is(button[aria-haspopup=listbox],button[aria-label*=上下文],button[aria-label*=Context]){display:none}}body[data-dsh-orca-link] [data-orca-composer-restore]{z-index:var(--orca-z-restore);border:1px solid color-mix(in srgb, var(--orca-graphite) 46%, transparent);background:color-mix(in srgb, var(--orca-surface-strong) 96%, transparent);width:28px;height:28px;color:var(--orca-graphite);cursor:pointer;place-items:center;margin:0;padding:0;animation:.24s linear .26s both _0cMdVG_orcaComposerRestoreControlIn;display:grid;position:fixed;box-shadow:5px 7px #1b273a14,0 10px 28px #1b273a24}body[data-dsh-orca-link] [data-orca-composer-restore][hidden]{display:none}body[data-dsh-orca-link] [data-orca-composer-restore]:before,body[data-dsh-orca-link] [data-orca-composer-restore]:after{content:\"\";border:1px solid;width:4px;position:absolute;top:4px;bottom:4px}body[data-dsh-orca-link] [data-orca-composer-restore]:before{border-right:0;left:-6px}body[data-dsh-orca-link] [data-orca-composer-restore]:after{border-left:0;right:-6px}body[data-dsh-orca-link] [data-orca-composer-restore-core]{background:color-mix(in srgb, var(--orca-blue) 10%, transparent);width:10px;height:10px;box-shadow:inset 3px 0 0 var(--orca-blue);border:1px solid}body[data-dsh-orca-link] [data-orca-composer-restore]:is(:hover,:focus-visible){border-color:var(--orca-blue);color:var(--orca-blue);outline:1px solid color-mix(in srgb, var(--orca-blue) 40%, transparent);outline-offset:2px;transform:translateY(-1px)}body[data-dsh-orca-link] [data-orca-composer-restore][data-orca-composer-restore-exiting]{pointer-events:none;animation:.16s ease-out both _0cMdVG_orcaComposerRestoreControlOut}body[data-dsh-orca-link][data-ds-dark-theme] [data-orca-composer-restore]{border-color:color-mix(in srgb, var(--orca-graphite) 34%, transparent);background:#111925;box-shadow:5px 7px #0003,0 12px 30px #00000057}@keyframes _0cMdVG_orcaComposerRestoreControlIn{0%{opacity:0;transform:scale(.65)}65%{opacity:1;transform:scale(1.12)}82%{transform:scale(.97)}to{opacity:1;transform:none}}@keyframes _0cMdVG_orcaComposerRestoreControlOut{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.65)}}@keyframes _0cMdVG_orcaComposerManualRestore{0%{opacity:0;transform:translate(var(--orca-composer-dock-x,0px), var(--orca-composer-dock-y,0px)) scale(var(--orca-composer-dock-scale,.05));animation-timing-function:cubic-bezier(.16,1,.3,1)}68%{opacity:1;transform:translateY(-3px)scale(1.012)}82%{transform:translateY(1.5px)scale(.997)}92%{transform:translateY(-.6px)scale(1)}to{opacity:1;transform:none}}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat][data-orca-composer-interactive]{opacity:1;transition:none;transform:none}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat][data-orca-composer-interactive] [data-composer-card],body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active] [data-composer-seat][data-orca-composer-interactive] [data-composer-card]{background-color:var(--dsw-specific-input-major)}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat][data-orca-composer-interactive] [data-composer-card]:focus-within,body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active] [data-composer-seat][data-orca-composer-interactive] [data-composer-card]:focus-within{background-color:var(--dsw-input-solid)}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-hidden]{opacity:0;pointer-events:none;transform:translateY(28px)}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-outside-chat]{display:none!important}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-entering]{overflow-clip-margin:12px;overflow:clip}body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-entering] [data-composer-card]{will-change:transform, opacity;animation:.7s linear .1s both _0cMdVG_orcaComposerDockIn}body[data-dsh-orca-link] [data-orca-composer-ghost]{z-index:var(--orca-z-ghost);box-sizing:border-box;pointer-events:none;margin:0;animation:.18s ease-out both _0cMdVG_orcaComposerGhostOut;position:fixed}@keyframes _0cMdVG_orcaComposerGhostOut{0%{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(0)}}@keyframes _0cMdVG_orcaComposerDockIn{0%{opacity:0;transform:translateY(var(--orca-composer-enter-distance,100vh));animation-timing-function:cubic-bezier(.22,.78,.2,1)}18%{opacity:1}74.286%{opacity:1;transform:translateY(-6px)}84%{transform:translateY(2.5px)}92%{transform:translateY(-1px)}96%{transform:translateY(.4px)}to{opacity:1;transform:none}}body[data-dsh-orca-link] ._0cMdVG_standby{z-index:900;width:min(420px,38vw);color:var(--orca-muted);letter-spacing:.2em;pointer-events:none;align-items:center;gap:14px;font:500 8px/1 ui-monospace,SFMono-Regular,Consolas,monospace;display:none;position:fixed;bottom:18px;left:calc(50% + 9vw);transform:translate(-50%)}body[data-dsh-orca-link][data-orca-scene=hero] ._0cMdVG_standby{display:flex}body[data-dsh-orca-link] ._0cMdVG_standbyLine{background:linear-gradient(90deg, transparent, var(--orca-line));flex:1;height:1px}body[data-dsh-orca-link] ._0cMdVG_standbyLine:last-child{background:linear-gradient(90deg, var(--orca-line), transparent)}body[data-dsh-orca-link] [data-aionui-explorer-col],body[data-dsh-orca-link] [data-aionui-preview-col],body[data-dsh-orca-link] [data-gitgraph-dialog]{border-color:var(--orca-line);background:var(--orca-surface);box-shadow:var(--orca-shadow)}body[data-dsh-orca-link] [data-orca-link-icon]>:not([data-orca-link-icon-art]){display:none}body[data-dsh-orca-link]{--aion-bg-base:var(--orca-surface-strong);--aion-bg-1:var(--orca-surface);--aion-bg-2:#f0ece5b8;--aion-bg-hover:color-mix(in srgb, var(--orca-blue) 8%, transparent);--aion-bg-active:color-mix(in srgb, var(--orca-blue) 14%, transparent);--aion-text-primary:var(--orca-ink);--aion-text-secondary:var(--orca-graphite);--aion-text-tertiary:var(--orca-muted);--aion-primary:var(--orca-blue);--aion-brand:var(--orca-cyan);--aion-border-base:var(--orca-line);--aion-overlay-shadow:var(--orca-shadow)}@media (width<=900px){body[data-dsh-orca-link] ._0cMdVG_lightScene,body[data-dsh-orca-link][data-ds-dark-theme] ._0cMdVG_darkScene,body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):before,body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):after{display:none}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar] [class*=regionArea]{backdrop-filter:none;background:0 0;border-top:none;margin-top:0}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar]>:first-child>:is(button[data-dsh-part=sidebar-entry],[data-plugin-entry],nav[class*=panelList]){margin-top:0}body[data-dsh-orca-link][data-orca-sidebar-wide] [data-slot=sidebar] [class*=regionArea]:before,body[data-dsh-orca-link] ._0cMdVG_spine,body[data-dsh-orca-link] ._0cMdVG_signalChip,body[data-dsh-orca-link] ._0cMdVG_statusCharacter,body[data-dsh-orca-link] ._0cMdVG_pricingLight,body[data-dsh-orca-link][data-orca-scene=hero] ._0cMdVG_standby{display:none}}@media (prefers-reduced-motion:reduce){body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-manual-hidden]{opacity:0}body[data-dsh-orca-link] button,body[data-dsh-orca-link] [role=button],body[data-dsh-orca-link] ._0cMdVG_dshWordmark,body[data-dsh-orca-link] ._0cMdVG_statusCharacter,body[data-dsh-orca-link] ._0cMdVG_statusCharacterBubble,body[data-dsh-orca-link] ._0cMdVG_pricingLight,body[data-dsh-orca-link] ._0cMdVG_pricingLamp,body[data-dsh-orca-link] ._0cMdVG_pricingTooltip,body[data-dsh-orca-link] :is([data-pane=sidebar],[data-slot=sidebar]>:first-child):before{transition:none}body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>:first-child:after,body[data-dsh-orca-link] ._0cMdVG_signalDot,body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>:first-child,body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog],body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]:before,body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]:after,body[data-dsh-orca-link] [data-phase=hero] [class*=titleGroup]>span:not([class*=previewBadge]):after,body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-entering] [data-composer-card],body[data-dsh-orca-link] [data-orca-composer-ghost],body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-restoring] [data-composer-card],body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapse-rebounding] [data-composer-card],body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapsing] [data-composer-card],body[data-dsh-orca-link] [data-orca-composer-restore]{animation:none}body[data-dsh-orca-link] [data-phase=active] [data-composer-seat],body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapse-rebounding],body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-collapsing],body[data-dsh-orca-link] [data-orca-composer-restore],body[data-dsh-orca-link] ._0cMdVG_lightSceneLayer,body[data-dsh-orca-link] ._0cMdVG_darkSceneLayer,body[data-dsh-orca-link] [data-slot=sidebar]>:first-child>button:not([data-dsh-part=sidebar-entry]):before,body[data-dsh-orca-link] [role=switch]>[class*=thumb],body[data-dsh-orca-link] [data-slot=sidebar] button[aria-haspopup=dialog]:after,body[data-dsh-orca-link] ._0cMdVG_statusCharacterBubble{transition:none}body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]:before,body[data-dsh-orca-link][data-orca-settings-open] :is([data-slot=sidebar\\.settings]>[role=presentation],:where(body)>[role=presentation]:where(:has(>[role=dialog][data-shortcut-modal=settings])))>[role=dialog]:after{display:none}body[data-dsh-orca-link] ._0cMdVG_statusCharacterFrame,body[data-dsh-orca-link] ._0cMdVG_pricingLight[data-orca-link-price=transition] ._0cMdVG_pricingLampAmber{animation:none}}@keyframes _0cMdVG_orcaGateWeave{0%{transform:translate(-.09px, .062px) scaleX(var(--orca-character-mirror))}14%{transform:translate(.09px, -.062px) scaleX(var(--orca-character-mirror))}29%{transform:translate(.032px, .062px) scaleX(var(--orca-character-mirror))}43%{transform:translate(-.041px, -.016px) scaleX(var(--orca-character-mirror))}58%{transform:translate(.059px, .011px) scaleX(var(--orca-character-mirror))}72%{transform:translate(-.018px, -.062px) scaleX(var(--orca-character-mirror))}86%{transform:translate(.09px, .034px) scaleX(var(--orca-character-mirror))}to{transform:translate(-.09px, .062px) scaleX(var(--orca-character-mirror))}}@keyframes _0cMdVG_orcaFilmGrainShift{0%{transform:translate(-7%,-8%)rotate(.01deg)}25%{transform:translate(5%,-3%)rotate(-.02deg)}50%{transform:translate(-3%,7%)rotate(.02deg)}75%{transform:translate(8%,3%)rotate(-.01deg)}to{transform:translate(-7%,-8%)rotate(.01deg)}}body[data-dsh-orca-link] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle][data-side]:after{background:linear-gradient(to bottom, transparent calc(var(--dsh-width-handle-pointer-y,50%) - 50px), #73583f2e calc(var(--dsh-width-handle-pointer-y,50%) - 40px), #9b8061 calc(var(--dsh-width-handle-pointer-y,50%) - 24px), #73583f calc(var(--dsh-width-handle-pointer-y,50%) - 6px), #73583f calc(var(--dsh-width-handle-pointer-y,50%) + 6px), #9b8061 calc(var(--dsh-width-handle-pointer-y,50%) + 24px), #73583f2e calc(var(--dsh-width-handle-pointer-y,50%) + 40px), transparent calc(var(--dsh-width-handle-pointer-y,50%) + 50px));filter:drop-shadow(0 0 1px #fffcf6e6)drop-shadow(0 0 3px #73583f6b);width:3px}body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle][data-side]:after{background:linear-gradient(to bottom, transparent calc(var(--dsh-width-handle-pointer-y,50%) - 52px), var(--orca-blue) calc(var(--dsh-width-handle-pointer-y,50%) - 36px), var(--orca-cyan) calc(var(--dsh-width-handle-pointer-y,50%) - 10px), #f7fbff var(--dsh-width-handle-pointer-y,50%), var(--orca-cyan) calc(var(--dsh-width-handle-pointer-y,50%) + 10px), var(--orca-blue) calc(var(--dsh-width-handle-pointer-y,50%) + 36px), transparent calc(var(--dsh-width-handle-pointer-y,50%) + 52px));filter:drop-shadow(0 0 1px #07101ffa)drop-shadow(0 0 6px #45d9f4c7)}body[data-dsh-orca-link] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle][data-side]:is(:hover,[data-dragging]):after{transform-origin:50%;animation:.92s steps(4,end) infinite _0cMdVG_orcaLinkWidthHandleSignal}body[data-dsh-orca-link]:not([data-ds-dark-theme]) [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:before{background:#73583f8f;border-radius:0}body[data-dsh-orca-link]:not([data-ds-dark-theme]) [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:is(:hover,:focus-visible):before{background:#9b8061;box-shadow:0 0 5px #73583f75}body[data-dsh-orca-link]:not([data-ds-dark-theme]) [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label][aria-current=true]:before{background:#73583f;box-shadow:0 0 0 1px #fffcf6eb,0 0 5px #73583f61}body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:before{background:color-mix(in srgb, var(--orca-muted) 74%, transparent)}body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:is(:hover,:focus-visible):before{background:var(--orca-cyan);box-shadow:0 0 6px color-mix(in srgb, var(--orca-cyan) 72%, transparent)}body[data-dsh-orca-link][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label][aria-current=true]:before{background:var(--orca-cyan);box-shadow:0 0 0 1px #f7fbff, 0 0 7px color-mix(in srgb, var(--orca-cyan) 76%, transparent)}@keyframes _0cMdVG_orcaLinkWidthHandleSignal{0%,to{opacity:.72;transform:scaleX(.76)}50%{opacity:1;transform:scaleX(1.24)}}@media (prefers-reduced-motion:reduce){body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-manual-hidden]{opacity:0}body[data-dsh-orca-link] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle][data-side]:after{animation:none}body[data-dsh-orca-link] [data-testid=todo-panel] li[data-status=in_progress]>[class*=_glyph]:after{clip-path:none;opacity:.55;animation:none}}body[data-dsh-orca-link] :is([data-slot=sidebar\\.settings],[role=dialog]:where([data-shortcut-modal=settings])) [class$=_cardId]{color:var(--orca-graphite)}body[data-dsh-orca-link][data-ds-dark-theme] :is([data-slot=sidebar\\.settings],[role=dialog]:where([data-shortcut-modal=settings])) [class$=_cardId]{color:var(--orca-muted)}";
		const tagId = "@smalltailqwq/dsh-client-ui-skin-orca-link/orca-link.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-orca-link";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var orca_link_module_css_default = {
			"darkScene": "_0cMdVG_darkScene",
			"darkSceneActive": "_0cMdVG_darkSceneActive",
			"darkSceneHero": "_0cMdVG_darkSceneHero",
			"darkSceneLayer": "_0cMdVG_darkSceneLayer",
			"dshWordmark": "_0cMdVG_dshWordmark",
			"lightScene": "_0cMdVG_lightScene",
			"lightSceneActive": "_0cMdVG_lightSceneActive",
			"lightSceneHero": "_0cMdVG_lightSceneHero",
			"lightSceneLayer": "_0cMdVG_lightSceneLayer",
			"orca-composer": "_0cMdVG_orca-composer",
			"orca-terminal-caret": "_0cMdVG_orca-terminal-caret",
			"orcaComposerDockIn": "_0cMdVG_orcaComposerDockIn",
			"orcaComposerFold": "_0cMdVG_orcaComposerFold",
			"orcaComposerGhostOut": "_0cMdVG_orcaComposerGhostOut",
			"orcaComposerManualRestore": "_0cMdVG_orcaComposerManualRestore",
			"orcaComposerRebound": "_0cMdVG_orcaComposerRebound",
			"orcaComposerRestoreControlIn": "_0cMdVG_orcaComposerRestoreControlIn",
			"orcaComposerRestoreControlOut": "_0cMdVG_orcaComposerRestoreControlOut",
			"orcaFilmGrainShift": "_0cMdVG_orcaFilmGrainShift",
			"orcaGateWeave": "_0cMdVG_orcaGateWeave",
			"orcaLinkWidthHandleSignal": "_0cMdVG_orcaLinkWidthHandleSignal",
			"orcaPricePulse": "_0cMdVG_orcaPricePulse",
			"orcaSettingsMaskIn": "_0cMdVG_orcaSettingsMaskIn",
			"orcaSettingsPanelIn": "_0cMdVG_orcaSettingsPanelIn",
			"orcaSignalPulse": "_0cMdVG_orcaSignalPulse",
			"orcaSignalWork": "_0cMdVG_orcaSignalWork",
			"orcaTodoFill": "_0cMdVG_orcaTodoFill",
			"orcaWordmarkScan": "_0cMdVG_orcaWordmarkScan",
			"pricingHousing": "_0cMdVG_pricingHousing",
			"pricingLabel": "_0cMdVG_pricingLabel",
			"pricingLamp": "_0cMdVG_pricingLamp",
			"pricingLampAmber": "_0cMdVG_pricingLampAmber",
			"pricingLampGreen": "_0cMdVG_pricingLampGreen",
			"pricingLampRed": "_0cMdVG_pricingLampRed",
			"pricingLight": "_0cMdVG_pricingLight",
			"pricingTooltip": "_0cMdVG_pricingTooltip",
			"pricingTooltipKey": "_0cMdVG_pricingTooltipKey",
			"pricingTooltipRow": "_0cMdVG_pricingTooltipRow",
			"pricingTooltipTitle": "_0cMdVG_pricingTooltipTitle",
			"pricingTooltipValue": "_0cMdVG_pricingTooltipValue",
			"signalChip": "_0cMdVG_signalChip",
			"signalDot": "_0cMdVG_signalDot",
			"spine": "_0cMdVG_spine",
			"standby": "_0cMdVG_standby",
			"standbyLine": "_0cMdVG_standbyLine",
			"statusCharacter": "_0cMdVG_statusCharacter",
			"statusCharacterBubble": "_0cMdVG_statusCharacterBubble",
			"statusCharacterFrame": "_0cMdVG_statusCharacterFrame",
			"statusCharacterSprite": "_0cMdVG_statusCharacterSprite"
		};
		//#endregion
		//#region src/client/index.ts
		const SKIN_TITLE = "ORCA LINK · DSH";
		const LIGHT_HERO_ART_PROPERTY = "--orca-link-light-hero-art";
		const LIGHT_ACTIVE_ART_PROPERTY = "--orca-link-light-active-art";
		const DARK_HERO_ART_PROPERTY = "--orca-link-dark-hero-art";
		const DARK_ACTIVE_ART_PROPERTY = "--orca-link-dark-active-art";
		const SIDEBAR_WIDTH_PROPERTY = "--orca-sidebar-width";
		const SIDEBAR_ART_WIDTH_PROPERTY = "--orca-sidebar-art-width";
		const SIDEBAR_WIDE_ATTRIBUTE = "data-orca-sidebar-wide";
		const APP_FRAME_SELECTOR = "[id='root'] > div[data-slot='root'] > div";
		const cls = (name) => orca_link_module_css_default[name] ?? "";
		const DSH_WORDMARK = [
			"<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M4 5H44L57 17V28L44 39H4V5ZM16 14V30H40L46 25V20L40 14H16Z\" fill=\"currentColor\"/>",
			"<path d=\"M70 5H119L110 14H80L76 18H108L118 27L106 39H59L68 30H101L105 26H72L62 17L70 5Z\" fill=\"currentColor\"/>",
			"<path d=\"M125 5H137V18H163V5H175V39H163V27H137V39H125V5Z\" fill=\"currentColor\"/>"
		].join("");
		const SIDEBAR_LOGO_ROW_SELECTOR = "[data-slot='sidebar'] > :first-child > :first-child";
		function text(tag, className, value) {
			const element = document.createElement(tag);
			element.className = className;
			element.textContent = value;
			return element;
		}
		function mountDshWordmark() {
			const row = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR);
			if (!(row instanceof HTMLElement)) return false;
			const buttons = Array.from(row.querySelectorAll(":scope > button"));
			const brand = buttons.find((button, index) => {
				const label = button.getAttribute("aria-label") ?? "";
				return index === 0 && (buttons.length > 1 || !/sidebar|侧边栏/i.test(label));
			});
			if (brand) brand.dataset.orcaLinkBrand = "";
			const sidebar = row.parentElement;
			if (!sidebar.querySelector(":scope > [data-orca-link-wordmark]")) {
				const wordmark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				wordmark.classList.add(cls("dshWordmark"));
				wordmark.dataset.orcaLinkWordmark = "";
				wordmark.dataset.skinChrome = "wordmark";
				wordmark.setAttribute("viewBox", "0 0 180 44");
				wordmark.setAttribute("aria-hidden", "true");
				wordmark.innerHTML = DSH_WORDMARK;
				sidebar.append(wordmark);
			}
			if (!row.querySelector(":scope > [data-orca-link-signal]")) {
				const chip = document.createElement("span");
				chip.className = cls("signalChip");
				chip.dataset.orcaLinkSignal = "";
				chip.dataset.skinChrome = "signal";
				chip.setAttribute("aria-hidden", "true");
				const dot = document.createElement("span");
				dot.className = cls("signalDot");
				const label = text("span", cls("signalChipLabel"), "LINK ACTIVE");
				label.dataset.orcaLinkSignalLabel = "";
				chip.append(dot, label);
				row.append(chip);
			}
			return true;
		}
		function syncSidebarWidth(body, pane) {
			const measuredWidth = pane.getBoundingClientRect().width;
			if (measuredWidth <= 0) return 0;
			const firstTrack = body.querySelector(APP_FRAME_SELECTOR)?.style.gridTemplateColumns.trim().match(/^(-?(?:\d+|\d*\.\d+))px(?:\s|$)/)?.[1];
			const targetWidth = firstTrack === void 0 ? measuredWidth : Number.parseFloat(firstTrack);
			const width = Number.isFinite(targetWidth) && targetWidth > 0 ? targetWidth : measuredWidth;
			const serializedWidth = `${width}px`;
			if (body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY) !== serializedWidth) body.style.setProperty(SIDEBAR_WIDTH_PROPERTY, serializedWidth);
			const wide = width > 96;
			if (body.hasAttribute(SIDEBAR_WIDE_ATTRIBUTE) !== wide) body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, wide);
			return width;
		}
		function apply(ctx) {
			const body = document.body;
			ctx.effect(() => installOrcaCustomization(), "ui-skin-orca-link: customization declaration");
			ctx.effect(() => installOrcaLightVisibility(body), "ui-skin-orca-link: decorative light visibility");
			ctx.effect(() => installOrcaBootError(), "ui-skin-orca-link: boot failure presentation");
			ctx.effect(() => installOrcaPageIcons(), "ui-skin-orca-link: page icons");
			ctx.effect(() => installOrcaWindowsMenu(body), "ui-skin-orca-link: windows caption menubar");
			const originalTitle = document.title;
			const originalLightHeroArt = body.style.getPropertyValue(LIGHT_HERO_ART_PROPERTY);
			const originalLightActiveArt = body.style.getPropertyValue(LIGHT_ACTIVE_ART_PROPERTY);
			const originalDarkHeroArt = body.style.getPropertyValue(DARK_HERO_ART_PROPERTY);
			const originalDarkActiveArt = body.style.getPropertyValue(DARK_ACTIVE_ART_PROPERTY);
			const originalSidebarWidth = body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY);
			const originalSidebarArtWidth = body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY);
			const originalSidebarWide = body.hasAttribute(SIDEBAR_WIDE_ATTRIBUTE);
			body.dataset.dshOrcaLink = "";
			body.style.setProperty(LIGHT_HERO_ART_PROPERTY, `url("${ORCA_LINK_LIGHT_HERO_ART}")`);
			body.style.setProperty(LIGHT_ACTIVE_ART_PROPERTY, `url("${ORCA_LINK_LIGHT_ACTIVE_ART}")`);
			body.style.setProperty(DARK_HERO_ART_PROPERTY, `url("${ORCA_LINK_DARK_HERO_ART}")`);
			body.style.setProperty(DARK_ACTIVE_ART_PROPERTY, `url("${ORCA_LINK_DARK_ACTIVE_ART}")`);
			const disposeScene = installOrcaScene(body);
			const disposeComposerMotion = installOrcaComposerMotion(body);
			const disposeComposerCollapse = installOrcaComposerCollapse(body);
			const disposeHeadlineTypewriter = installOrcaHeadlineTypewriter(body);
			const disposeIcons = installOrcaIcons(body);
			const disposeRailSearch = installOrcaRailSearch(body);
			const disposeWindowResume = installOrcaWindowResume(body);
			const disposeTerminalPerformance = installOrcaTerminalPerformance(body);
			const disposeSettingsOverlay = installOrcaSettingsOverlay(body);
			let wordmarkRow = null;
			const wordmarkObserver = new MutationObserver((records) => {
				if (!hasMutationOutsideTranscript(records)) return;
				if (wordmarkRow?.isConnected && !records.some((record) => wordmarkRow.contains(record.target))) return;
				mountDshWordmark();
				wordmarkRow = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR);
			});
			mountDshWordmark();
			wordmarkRow = document.querySelector(SIDEBAR_LOGO_ROW_SELECTOR);
			const disposeLinkStatus = installOrcaLinkStatus(body);
			const disposeStatusCharacter = installOrcaStatusCharacter(body, {
				character: cls("statusCharacter"),
				characterBubble: cls("statusCharacterBubble"),
				characterFrame: cls("statusCharacterFrame"),
				characterSprite: cls("statusCharacterSprite")
			});
			const disposePricingLight = installOrcaPricingLight(body, {
				light: cls("pricingLight"),
				housing: cls("pricingHousing"),
				lamp: cls("pricingLamp"),
				lampRed: cls("pricingLampRed"),
				lampAmber: cls("pricingLampAmber"),
				lampGreen: cls("pricingLampGreen"),
				label: cls("pricingLabel"),
				tooltip: cls("pricingTooltip"),
				tooltipTitle: cls("pricingTooltipTitle"),
				tooltipRow: cls("pricingTooltipRow"),
				tooltipKey: cls("pricingTooltipKey"),
				tooltipValue: cls("pricingTooltipValue")
			});
			wordmarkObserver.observe(body, {
				childList: true,
				subtree: true
			});
			let observedSidebar = null;
			let sidebarArtWidthTimer;
			const syncObservedSidebar = (pane) => {
				const width = syncSidebarWidth(body, pane);
				if (sidebarArtWidthTimer !== void 0) clearTimeout(sidebarArtWidthTimer);
				sidebarArtWidthTimer = void 0;
				if (width <= 96) return;
				if (body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) === "") {
					body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, `${width}px`);
					return;
				}
				if (body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) === `${width}px`) return;
				sidebarArtWidthTimer = setTimeout(() => {
					const stableWidth = Number.parseFloat(body.style.getPropertyValue(SIDEBAR_WIDTH_PROPERTY));
					if (stableWidth > 96 && body.style.getPropertyValue(SIDEBAR_ART_WIDTH_PROPERTY) !== `${stableWidth}px`) body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, `${stableWidth}px`);
					sidebarArtWidthTimer = void 0;
				}, 180);
			};
			const sidebarResizeObserver = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(() => {
				if (observedSidebar) syncObservedSidebar(observedSidebar);
			});
			const mountSidebarObserver = () => {
				const pane = document.querySelector("[data-slot='sidebar'] > :first-child");
				if (!pane) return false;
				if (pane !== observedSidebar) {
					sidebarResizeObserver?.disconnect();
					observedSidebar = pane;
					sidebarResizeObserver?.observe(pane);
				}
				syncObservedSidebar(pane);
				return true;
			};
			const sidebarMountObserver = new MutationObserver(() => {
				if (mountSidebarObserver()) sidebarMountObserver.disconnect();
			});
			if (!mountSidebarObserver()) sidebarMountObserver.observe(body, {
				childList: true,
				subtree: true
			});
			const spine = document.createElement("div");
			spine.className = cls("spine");
			spine.dataset.skinChrome = "spine";
			spine.setAttribute("aria-hidden", "true");
			const lightScene = document.createElement("div");
			lightScene.className = cls("lightScene");
			lightScene.dataset.skinChrome = "light-scene";
			lightScene.setAttribute("aria-hidden", "true");
			const lightHeroScene = document.createElement("div");
			lightHeroScene.className = `${cls("lightSceneLayer")} ${cls("lightSceneHero")}`;
			const lightActiveScene = document.createElement("div");
			lightActiveScene.className = `${cls("lightSceneLayer")} ${cls("lightSceneActive")}`;
			lightScene.append(lightHeroScene, lightActiveScene);
			const darkScene = document.createElement("div");
			darkScene.className = cls("darkScene");
			darkScene.dataset.skinChrome = "dark-scene";
			darkScene.setAttribute("aria-hidden", "true");
			const darkHeroScene = document.createElement("div");
			darkHeroScene.className = `${cls("darkSceneLayer")} ${cls("darkSceneHero")}`;
			const darkActiveScene = document.createElement("div");
			darkActiveScene.className = `${cls("darkSceneLayer")} ${cls("darkSceneActive")}`;
			darkScene.append(darkHeroScene, darkActiveScene);
			const standby = document.createElement("div");
			standby.className = cls("standby");
			standby.dataset.skinChrome = "standby";
			standby.setAttribute("aria-hidden", "true");
			standby.append(text("span", cls("standbyLine"), ""));
			standby.append(text("span", cls("standbyCopy"), "ORCA LINK STANDBY"));
			standby.append(text("span", cls("standbyLine"), ""));
			document.title = SKIN_TITLE;
			body.append(lightScene, darkScene, spine, standby);
			ctx.effect(() => () => {
				disposeScene();
				disposeLinkStatus();
				disposeStatusCharacter();
				disposePricingLight();
				disposeHeadlineTypewriter();
				disposeComposerCollapse();
				disposeComposerMotion();
				disposeIcons();
				disposeRailSearch();
				disposeWindowResume();
				disposeTerminalPerformance();
				disposeSettingsOverlay();
				delete body.dataset.dshOrcaLink;
				if (originalLightHeroArt === "") body.style.removeProperty(LIGHT_HERO_ART_PROPERTY);
				else body.style.setProperty(LIGHT_HERO_ART_PROPERTY, originalLightHeroArt);
				if (originalLightActiveArt === "") body.style.removeProperty(LIGHT_ACTIVE_ART_PROPERTY);
				else body.style.setProperty(LIGHT_ACTIVE_ART_PROPERTY, originalLightActiveArt);
				if (originalDarkHeroArt === "") body.style.removeProperty(DARK_HERO_ART_PROPERTY);
				else body.style.setProperty(DARK_HERO_ART_PROPERTY, originalDarkHeroArt);
				if (originalDarkActiveArt === "") body.style.removeProperty(DARK_ACTIVE_ART_PROPERTY);
				else body.style.setProperty(DARK_ACTIVE_ART_PROPERTY, originalDarkActiveArt);
				if (originalSidebarWidth === "") body.style.removeProperty(SIDEBAR_WIDTH_PROPERTY);
				else body.style.setProperty(SIDEBAR_WIDTH_PROPERTY, originalSidebarWidth);
				if (originalSidebarArtWidth === "") body.style.removeProperty(SIDEBAR_ART_WIDTH_PROPERTY);
				else body.style.setProperty(SIDEBAR_ART_WIDTH_PROPERTY, originalSidebarArtWidth);
				body.toggleAttribute(SIDEBAR_WIDE_ATTRIBUTE, originalSidebarWide);
				lightScene.remove();
				darkScene.remove();
				spine.remove();
				standby.remove();
				wordmarkObserver.disconnect();
				sidebarMountObserver.disconnect();
				sidebarResizeObserver?.disconnect();
				if (sidebarArtWidthTimer !== void 0) clearTimeout(sidebarArtWidthTimer);
				document.querySelectorAll("[data-orca-link-wordmark]").forEach((wordmark) => wordmark.remove());
				document.querySelectorAll("[data-orca-link-signal]").forEach((chip) => chip.remove());
				document.querySelectorAll("[data-orca-link-brand]").forEach((brandButton) => {
					brandButton.removeAttribute("data-orca-link-brand");
				});
				if (document.title === SKIN_TITLE) document.title = originalTitle;
			}, "ui-skin-orca-link: technical chrome");
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map