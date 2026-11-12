window.__ModuleLoader__.load({
	id: "@smalltailqwq/dsh-client-ui-skin-deep-whale-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/contract.ts
		/** Same-origin host route used for catalog discovery and activation. */
		const SKIN_MANAGER_ROUTE = "/api/dsh/skins";
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
			let ranges = fallback.ranges;
			if (Array.isArray(source.ranges)) {
				ranges = [];
				for (const entry of source.ranges) {
					const range = normalizeTimeRange(entry);
					if (range === null) continue;
					ranges.push(range);
					if (ranges.length === 24) break;
				}
			}
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
		/**
		* Store one skin block as an own data property. Plain assignment would invoke
		* the `__proto__` accessor inherited from `Object.prototype`, which rewrites the
		* target's prototype and stores no block at all.
		*/
		function assignBlock(target, skinId, block) {
			Object.defineProperty(target, skinId, {
				value: block,
				writable: true,
				enumerable: true,
				configurable: true
			});
		}
		/**
		* Preferences as {@link PreferencesStore.replace} leaves them: incoming blocks win
		* and blocks the import does not mention stay. Callers use this to inspect the
		* result of an import before it is committed.
		*/
		function mergePreferences(current, incoming) {
			const merged = { ...current };
			for (const [skinId, block] of Object.entries(incoming)) {
				if (block === void 0) continue;
				assignBlock(merged, skinId, block);
			}
			return merged;
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
				this.commit({
					...this.value,
					[definition.skinId]: {
						...this.value[definition.skinId],
						[key]: value
					}
				});
			}
			/**
			* Swap in `next` only after it has been serialized. Serializing first keeps
			* memory, storage and subscribers on the same value: a payload that overflows
			* `JSON.stringify` (a deeply nested imported block) or a storage write that
			* throws (quota exceeded) must not leave the in-memory store ahead of the
			* persisted one and silent for every later write.
			*/
			commit(next) {
				const serialized = JSON.stringify(next);
				const previous = this.value;
				this.value = next;
				try {
					this.storage.setItem(PREFERENCES_KEY, serialized);
				} catch (error) {
					this.value = previous;
					throw error;
				}
				this.listeners.forEach((listener) => listener());
			}
			/** Full raw preferences snapshot for export; never mutates store state. */
			snapshot() {
				return this.value;
			}
			/**
			* Replace every skin's preferences in one atomic write. A block whose skin is
			* registered right now is normalized against its live definition, so unknown
			* keys, removed settings and malformed values never reach the persisted store.
			* A block whose skin is not registered — the inactive half of a mutually
			* exclusive pair on a fresh browser — is stored verbatim and normalized when
			* {@link values} next reads it against that skin's definition. Returns the
			* number of skin blocks stored.
			*/
			replace(definitions, incoming) {
				const next = { ...this.value };
				const registered = /* @__PURE__ */ new Set();
				let written = 0;
				for (const definition of definitions) {
					registered.add(definition.skinId);
					const block = incoming[definition.skinId];
					if (block === void 0) continue;
					assignBlock(next, definition.skinId, normalizeSkinValues(definition, block));
					written += 1;
				}
				for (const [skinId, block] of Object.entries(incoming)) {
					if (registered.has(skinId)) continue;
					assignBlock(next, skinId, block);
					written += 1;
				}
				if (written === 0) return 0;
				this.commit(next);
				return written;
			}
			/**
			* Drop every stored block whose skin the registry does not hold, returning the
			* removed ids. Imports keep blocks for skins that are not loaded yet, so this
			* is the one explicit way to discard that kept data.
			*/
			removeUnregistered(registered) {
				const known = new Set(registered);
				const removed = Object.keys(this.value).filter((skinId) => !known.has(skinId));
				if (removed.length === 0) return [];
				const next = {};
				for (const [skinId, block] of Object.entries(this.value)) if (known.has(skinId)) assignBlock(next, skinId, block);
				this.commit(next);
				return removed;
			}
			/** Remove every setting under one skin id; used by per-skin reset flows. */
			clearSkin(skinId) {
				if (!Object.hasOwn(this.value, skinId)) return false;
				const next = { ...this.value };
				delete next[skinId];
				this.commit(next);
				return true;
			}
		};
		/** Stable source marker so importers can reject unrelated JSON early. */
		const PREFERENCES_EXPORT_SOURCE = "dsh-skin-manager";
		/** Maximum accepted configuration content for an import (256 KiB of UTF-8 bytes). Defends against accidents. */
		const PREFERENCES_IMPORT_MAX_BYTES = 262144;
		/** Error thrown when an import payload cannot be promoted to a live store. */
		var PreferencesImportError = class extends Error {
			code;
			constructor(code, message) {
				super(message);
				this.code = code;
				this.name = "PreferencesImportError";
			}
		};
		function isObject(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/**
		* Whether the text exceeds `limit` UTF-8 bytes. `String#length` counts UTF-16
		* units, so multi-byte text can pass a character check and still exceed the byte
		* budget; encoding the whole payload to measure it would allocate a second copy
		* of an arbitrarily large input, so count units and stop at the first overrun.
		* Unpaired surrogates count as the three-byte replacement character they encode
		* to, which keeps the count equal to the encoded length.
		*/
		function exceedsBytes(text, limit) {
			let bytes = 0;
			for (let index = 0; index < text.length; index += 1) {
				const code = text.charCodeAt(index);
				if (code < 128) bytes += 1;
				else if (code < 2048) bytes += 2;
				else if (code >= 55296 && code <= 56319) {
					const low = text.charCodeAt(index + 1);
					if (low >= 56320 && low <= 57343) {
						bytes += 4;
						index += 1;
					} else bytes += 3;
				} else bytes += 3;
				if (bytes > limit) return true;
			}
			return false;
		}
		/**
		* Whether a block may be keyed by this skin id. `__proto__` is the one name that
		* needs an own-property write at every assignment site and has no legitimate skin
		* behind it, so an envelope carrying it is rejected rather than stored.
		*/
		function isStorableSkinId(skinId) {
			return skinId !== "__proto__";
		}
		/**
		* Whether any value in the tree is nested deeper than `max`. Iterative on
		* purpose: the guard exists to reject deeply nested input, so it must not
		* recurse into it. Depth starts at the preferences root.
		*/
		function exceedsDepth(value, max) {
			const stack = [{
				node: value,
				depth: 0
			}];
			while (stack.length > 0) {
				const { node, depth } = stack.pop();
				if (depth > max) return true;
				if (typeof node !== "object" || node === null) continue;
				for (const child of Object.values(node)) stack.push({
					node: child,
					depth: depth + 1
				});
			}
			return false;
		}
		function isPreferences(value) {
			if (!isObject(value)) return false;
			for (const block of Object.values(value)) {
				if (block === void 0) continue;
				if (!isObject(block)) return false;
			}
			return true;
		}
		/**
		* Reject a preferences block the store could not hold or round-trip. Enforced on
		* every entrance — the parsed envelope and the projection — so no caller can
		* hand the store a structure that later breaks a write or an export.
		*/
		function assertStorablePreferences(preferences) {
			const skinIds = Object.keys(preferences);
			if (skinIds.length > 64) throw new PreferencesImportError("invalid-envelope", "too-many-skin-blocks");
			if (skinIds.some((skinId) => !isStorableSkinId(skinId))) throw new PreferencesImportError("invalid-envelope", "unstorable-skin-id");
			if (exceedsDepth(preferences, 32)) throw new PreferencesImportError("invalid-envelope", "preferences-too-deep");
		}
		/**
		* Reject a preference set the importer could not restore. The budget counts
		* configuration content — the same measure `parsePreferencesExport` applies — so a
		* set that passes here always exports to a file that passes. Imports keep blocks
		* for unloaded skins, so without this the store can accumulate past the budget and
		* answer with a backup nothing in the manager accepts.
		*/
		function assertPreferencesImportable(preferences) {
			if (!exceedsBytes(JSON.stringify(buildPreferencesExport(preferences)), 262144)) return;
			throw new PreferencesImportError("store-too-large", "stored-preferences-exceed-import-budget");
		}
		/** Build a versioned export envelope from a raw preferences snapshot. */
		function buildPreferencesExport(prefs, now = /* @__PURE__ */ new Date()) {
			const clean = {};
			for (const [skinId, block] of Object.entries(prefs)) {
				if (block === void 0) continue;
				assignBlock(clean, skinId, isObject(block) ? { ...block } : {});
			}
			return {
				schema: 1,
				source: PREFERENCES_EXPORT_SOURCE,
				exportedAt: now.toISOString(),
				preferences: clean
			};
		}
		/**
		* Pretty-print an export envelope for file download. The envelope is built
		* with a fixed key order (schema → source → exportedAt → preferences), so a
		* plain JSON.stringify preserves that order without a replacer array — a
		* replacer whitelist would recurse into nested preferences blocks and strip
		* every skin id and setting key.
		*
		* Deep nesting can pad a legal payload past the text ceiling the importer applies
		* before parsing, which would make the manager reject its own backup; the compact
		* form is used when that happens, and its size is what the content budget bounds.
		*/
		function serializePreferencesExport(exported) {
			const ordered = {
				schema: exported.schema,
				source: exported.source,
				exportedAt: exported.exportedAt,
				preferences: exported.preferences
			};
			const padded = `${JSON.stringify(ordered, null, 2)}\n`;
			return exceedsBytes(padded, 524288) ? `${JSON.stringify(ordered)}\n` : padded;
		}
		/**
		* Parse and structurally validate a raw JSON string. Throws
		* {@link PreferencesImportError} on any structural problem; never throws for
		* a network or DOM reason.
		*/
		function parsePreferencesExport(raw, maxBytes = PREFERENCES_IMPORT_MAX_BYTES) {
			if (raw === "" || raw === null) throw new PreferencesImportError("empty", "empty-payload");
			if (exceedsBytes(raw, maxBytes * 2)) throw new PreferencesImportError("too-large", "payload-exceeds-max-size");
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				throw new PreferencesImportError("invalid-json", "invalid-json-syntax");
			}
			if (!isObject(parsed)) throw new PreferencesImportError("invalid-envelope", "envelope-not-object");
			if (parsed.schema !== 1) throw new PreferencesImportError("invalid-envelope", "unsupported-schema");
			if (parsed.source !== "dsh-skin-manager") throw new PreferencesImportError("invalid-envelope", "unknown-source");
			if (typeof parsed.exportedAt !== "string" || parsed.exportedAt === "") throw new PreferencesImportError("invalid-envelope", "missing-exported-at");
			if (!isPreferences(parsed.preferences)) throw new PreferencesImportError("invalid-envelope", "preferences-not-object");
			assertStorablePreferences(parsed.preferences);
			if (exceedsBytes(JSON.stringify(parsed), maxBytes)) throw new PreferencesImportError("too-large", "payload-exceeds-max-size");
			return {
				schema: 1,
				source: PREFERENCES_EXPORT_SOURCE,
				exportedAt: parsed.exportedAt,
				preferences: parsed.preferences
			};
		}
		/**
		* Project an import envelope onto the currently-registered skin definitions.
		* Each registered skin block is normalized so that:
		*  - unknown setting keys are dropped,
		*  - removed settings fall back to their declared defaults,
		*  - malformed values fall back to their declared defaults.
		*
		* Skins the registry does not hold — mutual exclusion usually leaves the
		* inactive skins unloaded on a fresh browser, so a backup taken with both
		* installed arrives while only one is registered — keep their block verbatim in
		* `deferredSkins`. Nothing can reach a live skin unvalidated: every read
		* normalizes a block against its definition through
		* {@link normalizeSkinValues}, so a deferred block is normalized the moment its
		* skin registers. Dropping it here instead silently lost half of such a backup.
		*
		* Returns the projected preferences plus which skins matched and which are
		* deferred, so the UI can say what actually took effect. Throws
		* {@link PreferencesImportError} when the envelope carries no skin block at all
		* or when a block could not be stored (see {@link assertStorablePreferences}).
		*/
		function validatePreferencesExport(exported, definitions) {
			assertStorablePreferences(exported.preferences);
			const matched = [];
			const deferred = [];
			const normalized = {};
			const registered = /* @__PURE__ */ new Set();
			for (const definition of definitions) {
				registered.add(definition.skinId);
				const block = exported.preferences[definition.skinId];
				if (block === void 0) continue;
				assignBlock(normalized, definition.skinId, normalizeSkinValues(definition, block));
				matched.push(definition.skinId);
			}
			for (const [skinId, block] of Object.entries(exported.preferences)) {
				if (registered.has(skinId)) continue;
				assignBlock(normalized, skinId, block);
				deferred.push(skinId);
			}
			if (matched.length === 0 && deferred.length === 0) throw new PreferencesImportError("no-matching-skins", "no-skins-matched");
			return {
				preferences: normalized,
				matchedSkins: matched,
				deferredSkins: deferred
			};
		}
		/** Convenience: parse → validate in one call. See {@link parsePreferencesExport}. */
		function importPreferencesFromText(raw, definitions) {
			const exported = parsePreferencesExport(raw);
			return {
				...validatePreferencesExport(exported, definitions),
				exportedAt: exported.exportedAt
			};
		}
		/** Default download filename for an export, scoped to the export date. */
		function defaultExportFileName(now = /* @__PURE__ */ new Date()) {
			return `dsh-skin-preferences-${now.toISOString().slice(0, 10)}.json`;
		}
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
				for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
					target.addEventListener(events.register, this.onRegister);
					target.addEventListener(events.unregister, this.onUnregister);
					target.dispatchEvent(new Event(events.ready));
				}
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
			/** Manager-owned controls belong to this registry, without a skin discovery broadcast. */
			registerLocal(definition) {
				const token = {};
				this.definitions.set(token, definition);
				this.rebuildSnapshot();
				this.applyAll();
				return () => {
					if (!this.definitions.delete(token)) return;
					definition.apply(null);
					this.rebuildSnapshot();
					this.scheduleClock();
				};
			}
			/** Raw preferences snapshot for export; never mutates store state. */
			exportPreferences() {
				return this.store.snapshot();
			}
			/**
			* Replace every skin's preferences in one atomic write. Each block is
			* normalized against its live definition so unknown keys and malformed
			* values never reach the persisted store. Returns the number of skins
			* actually written. The store notifies its subscribers (including this
			* registry's re-apply pass) exactly once, so nothing applies twice.
			*
			* The import is rejected while the store is untouched when the merged result
			* could no longer be exported into a file this manager accepts: kept blocks for
			* unloaded skins accumulate, and an unrestorable backup is worse than a failed
			* import the user can retry after clearing them.
			*/
			importPreferences(incoming) {
				assertPreferencesImportable(mergePreferences(this.store.snapshot(), incoming));
				return this.store.replace(this.snapshot.definitions, incoming);
			}
			/** Remove every setting under one skin id; used by per-skin reset flows. */
			resetSkin(skinId) {
				return this.store.clearSkin(skinId);
			}
			/**
			* Drop stored blocks for skins the registry does not hold — data an import
			* kept for skins that are not loaded. Returns how many blocks were removed.
			*/
			removeUnregisteredSkins() {
				return this.store.removeUnregistered(this.snapshot.definitions.map((definition) => definition.skinId)).length;
			}
			dispose() {
				for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
					this.target.removeEventListener(events.register, this.onRegister);
					this.target.removeEventListener(events.unregister, this.onUnregister);
				}
				this.unsubscribeStore();
				this.store.dispose();
				if (this.timer !== void 0) this.target.clearTimeout(this.timer);
				for (const definition of this.definitions.values()) definition.apply(null);
				this.definitions.clear();
			}
			onRegister = (event) => {
				const detail = event instanceof CustomEvent ? event.detail : void 0;
				const protocol = this.eventProtocol(event.type, "register");
				if (!detail || protocol === void 0 || !this.valid(detail.definition, protocol)) return;
				this.definitions.set(detail.token, detail.definition);
				this.rebuildSnapshot();
				this.applyAll();
			};
			onUnregister = (event) => {
				const detail = event instanceof CustomEvent ? event.detail : void 0;
				const protocol = this.eventProtocol(event.type, "unregister");
				if (!detail || protocol !== detail.definition.protocol || this.definitions.get(detail.token) !== detail.definition) return;
				detail.definition.apply(null);
				this.definitions.delete(detail.token);
				this.rebuildSnapshot();
				this.scheduleClock();
			};
			eventProtocol(type, phase) {
				if (type === SKIN_CUSTOMIZATION_EVENTS[1][phase]) return 1;
				if (type === SKIN_CUSTOMIZATION_EVENTS[2][phase]) return 2;
			}
			valid(definition, protocol) {
				if (definition?.protocol !== protocol || typeof definition.skinId !== "string" || typeof definition.apply !== "function" || !Array.isArray(definition.settings)) return false;
				if (definition.skinId === "__proto__") return false;
				const settingTypes = /* @__PURE__ */ new Set([
					"boolean",
					"select",
					"range",
					"color",
					"checkbox-group",
					"visibility-schedule"
				]);
				if (!definition.settings.every((setting) => setting !== null && typeof setting === "object" && settingTypes.has(setting.type))) return false;
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
		/** Whether one single-key condition holds for the current values. */
		function conditionMatches(condition, values) {
			const value = values[condition.key];
			return condition.values.some((candidate) => candidate === value);
		}
		/** Every single-key condition a setting's visibility rests on. */
		function visibilityConditions(setting) {
			const condition = setting.visibleWhen;
			if (condition === void 0) return [];
			return "anyOf" in condition && Array.isArray(condition.anyOf) ? condition.anyOf : [condition];
		}
		/**
		* Whether a setting should render. `anyOf` is the family-of-switches form: the
		* control shows while any listed condition holds, and the top-level single-key
		* mirror keeps the declaration readable for a manager that predates `anyOf`.
		*
		* With the full `settings` list the check is transitive: a condition only
		* counts while the control it reads is itself shown, so the child of a hidden
		* switch hides with it instead of hanging under an unrelated row.
		*/
		function settingVisible(setting, values, settings, seen = /* @__PURE__ */ new Set()) {
			const conditions = visibilityConditions(setting);
			if (conditions.length === 0) return true;
			if (seen.has(setting.key)) return false;
			seen.add(setting.key);
			return conditions.some((condition) => {
				if (!conditionMatches(condition, values)) return false;
				const parent = settings?.find((candidate) => candidate.key === condition.key);
				return parent === void 0 || settingVisible(parent, values, settings, new Set(seen));
			});
		}
		/**
		* The `disabledWhen` state of a control: whether it is locked, and the visible
		* row that locks it (named in the row's caption). A lock from a control the
		* user cannot see still holds, because the skin applies that value anyway.
		*/
		function settingLock(setting, values, settings) {
			if (setting.disabledWhen === void 0 || values[setting.disabledWhen] !== true) return { locked: false };
			const parent = settings.find((candidate) => candidate.key === setting.disabledWhen);
			return parent !== void 0 && settingVisible(parent, values, settings) ? {
				locked: true,
				by: parent
			} : { locked: true };
		}
		/** Keys a setting depends on, through visibility or a lock. */
		function parentKeys(setting) {
			const keys = visibilityConditions(setting).map((condition) => condition.key);
			if (setting.disabledWhen !== void 0) keys.push(setting.disabledWhen);
			return keys.filter((key) => key !== setting.key);
		}
		/**
		* Arrange a definition for display. Settings land in their declared group
		* (groups in declaration order, unknown or missing groups in one untitled
		* block at the end), and inside a block every dependent setting sits under the
		* last control it depends on, whatever its position in the array. A skin can
		* therefore append a new option at the end of `settings` and still have it
		* shown with its topic and its parent switch.
		*/
		function layoutSettings(definition) {
			const sections = (Array.isArray(definition.groups) ? definition.groups.filter((group) => group !== null && typeof group === "object" && typeof group.key === "string" && typeof group.label === "string") : []).map((group) => ({
				key: group.key,
				label: group.label,
				labelEn: group.labelEn,
				nodes: []
			}));
			const sectionKeys = new Set(sections.map((section) => section.key));
			const rest = {
				key: "",
				nodes: []
			};
			const members = /* @__PURE__ */ new Map();
			for (const setting of definition.settings) {
				const section = typeof setting.group === "string" && sectionKeys.has(setting.group) ? sections.find((candidate) => candidate.key === setting.group) : rest;
				members.set(section, [...members.get(section) ?? [], setting]);
			}
			for (const section of [...sections, rest]) {
				const list = members.get(section) ?? [];
				const index = new Map(list.map((setting, position) => [setting.key, position]));
				const nodes = new Map(list.map((setting) => [setting.key, {
					setting,
					children: []
				}]));
				const parentOf = /* @__PURE__ */ new Map();
				const after = /* @__PURE__ */ new Map();
				const parentsOf = new Map(list.map((setting) => [setting.key, [...new Set(parentKeys(setting).filter((key) => index.has(key)))]]));
				for (const [key, parents] of parentsOf) if (parents.length === 1) parentOf.set(key, parents[0]);
				const chain = (key) => {
					const keys = [];
					for (let cursor = key; cursor !== void 0 && !keys.includes(cursor); cursor = parentOf.get(cursor)) keys.push(cursor);
					return keys;
				};
				for (const [key, parents] of parentsOf) {
					if (parents.length < 2) continue;
					const chains = parents.map(chain);
					const shared = chains[0].find((candidate) => chains.every((keys) => keys.includes(candidate)));
					if (shared !== void 0) parentOf.set(key, shared);
					after.set(key, parents.reduce((last, parent) => index.get(parent) > index.get(last) ? parent : last));
				}
				for (const key of [...parentOf.keys()]) {
					const path = /* @__PURE__ */ new Set([key]);
					let cursor = parentOf.get(key);
					while (cursor !== void 0 && !path.has(cursor)) {
						path.add(cursor);
						cursor = parentOf.get(cursor);
					}
					if (cursor !== void 0) parentOf.delete(key);
				}
				for (const setting of list) {
					const parent = parentOf.get(setting.key);
					const node = nodes.get(setting.key);
					if (parent === void 0) section.nodes.push(node);
					else nodes.get(parent).children.push(node);
				}
				const contains = (node, key) => node.setting.key === key || node.children.some((child) => contains(child, key));
				const place = (siblings) => {
					for (const node of [...siblings]) {
						const anchor = after.get(node.setting.key);
						if (anchor === void 0) continue;
						const from = siblings.indexOf(node);
						const target = siblings.findIndex((sibling) => sibling !== node && contains(sibling, anchor));
						if (target > from) siblings.splice(target, 0, ...siblings.splice(from, 1));
					}
					for (const node of siblings) place(node.children);
				};
				place(section.nodes);
			}
			return [...sections, rest].filter((section) => section.nodes.length > 0);
		}
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
		/**
		* Live read for every caller that is not a React render: the settings-section
		* server snapshot, and — the reason this is exported — slot labels. A
		* `settings.section` label is a plain function the host calls itself, so the
		* manager cannot subscribe for it the way `useUiLang` does; the host
		* recomputes labels on its own locale revision and this read then picks the
		* repointed `<html lang>` up. Node-side calls have no DOM and degrade to the
		* source language.
		*/
		function currentUiLang() {
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
			return (0, react.useSyncExternalStore)(subscribeUiLang, uiLangSnapshot, currentUiLang);
		}
		/**
		* Explain the backend's shortcut failure reasons: known codes become advice,
		* any other PowerShell message is shown as is and followed by the retry hint.
		*/
		function desktopIconReasons(errors, known, retry) {
			const reasons = errors.map((error) => Object.hasOwn(known, error) ? known[error] : error);
			return errors.every((error) => Object.hasOwn(known, error)) && errors.length > 0 ? reasons : [...reasons, retry];
		}
		const zhCopy = {
			headerTitle: "皮肤管理",
			increaseValue: (label) => `增大${label}`,
			decreaseValue: (label) => `减小${label}`,
			navLabel: "皮肤管理",
			installedTitle: "已安装",
			checking: "检查中…",
			checkUpdates: "检查更新",
			officialName: "官方默认",
			stateCurrent: "当前",
			stateSwitching: "切换中…",
			skinConflict: "检测到多套皮肤同时生效，请重新选择目标皮肤。",
			switchStateUnavailable: "无法读取宿主的皮肤运行状态。",
			switchChanged: "皮肤选择已被其他操作更改。",
			switchRestartRequired: "设置已保存，但当前窗口未完成皮肤切换。请重启桌面应用使其生效。",
			compatibility: (version) => `已适配 DSH ${version}`,
			incompatibleBlocked: (runtime) => `不支持 DSH ${runtime}，已停用`,
			incompatibleAllowed: (runtime) => `已允许在 DSH ${runtime} 上运行`,
			incompatibleConfirm: (runtime) => `这个皮肤没有声明支持 DSH ${runtime}，启用后界面可能错乱，例如输入框消失。\n\n仍要启用吗？之后可以随时切回「官方默认」。`,
			gitHashTitle: (hash, date) => `本地提交 ${hash}${date === null ? "" : `\n${date}`}\n点击复制`,
			buildHashTitle: (hash) => `本地构建 ${hash}\n点击复制`,
			upToDate: "已是最新",
			updateAvailable: (short, date) => date === "" ? `有更新 ${short}` : `有更新 ${short} · ${date}`,
			localAhead: "本地较新",
			diverged: "与远端分叉",
			unknownUpdate: "无法检查更新",
			localDirty: "有本地改动",
			noSkins: "未发现已安装的皮肤。",
			copiedOk: "已复制。",
			copyFailed: "复制失败：浏览器拒绝了剪贴板访问。",
			loadingSkins: "读取中…",
			actionFailed: (message) => `操作失败：${message}`,
			noSettings: "这个皮肤没有可调整的设置。",
			lockedBy: (label) => `「${label}」开启时不可用`,
			locked: "当前不可用",
			desktopIconTitle: "桌面",
			desktopIconLabel: "快捷方式图标跟随皮肤",
			desktopIconDescription: "替换桌面、开始菜单和任务栏中的图标；关闭或切回官方默认时还原。",
			desktopIconPending: "正在更新快捷方式…",
			desktopIconDone: (updated, failed, errors = []) => failed > 0 ? `已更新 ${updated} 个快捷方式，${failed} 个修改失败：${desktopIconReasons(errors, {
				"shared-denied": "所有用户共享的快捷方式需要以管理员身份运行 DeepSeek Harness",
				"save-blocked": "被安全软件（如 360、火绒）的快捷方式防护拦截，请把 DeepSeek Harness 加入其信任区后再切换一次开关"
			}, "可再切换一次开关重试").join("；")}。` : updated > 0 ? `已更新 ${updated} 个快捷方式，开始菜单稍后刷新。` : "快捷方式已是目标图标，或当前皮肤未提供桌面图标。",
			schedulePolicy: "规则",
			policyHideInRanges: "在这些时段隐藏",
			policyShowInRanges: "只在这些时段显示",
			rangeStartAria: (index) => `时段 ${index} 开始`,
			rangeEndAria: (index) => `时段 ${index} 结束`,
			hourAria: (label) => `${label} 时`,
			minuteAria: (label) => `${label} 分`,
			rangeTo: "至",
			removeRange: "删除",
			addRange: "添加时间段",
			scheduleHint: "按本机时间，可跨午夜，如 22:00 至 07:00。",
			backupTitle: "备份",
			backupLabel: "皮肤与管理器设置",
			backupDescription: "也可以把 JSON 文件拖到这里导入。",
			exportButton: "导出",
			importButton: "导入",
			dropActive: "松开以导入",
			exportOk: "已导出。",
			importOk: (count) => `已导入 ${count} 组设置。`,
			importOkDeferred: (active, deferred) => `已导入 ${active} 组设置；另有 ${deferred} 个皮肤未加载，加载后生效。`,
			importFail: (message) => `导入失败：${message}`,
			importErrorInvalidEnvelope: "文件不是有效的皮肤设置备份",
			importErrorTooLarge: "文件过大：设置内容超过 256 KiB 限制",
			resetSkinButton: "恢复默认",
			resetSkinConfirm: (title) => `将「${title}」的设置全部恢复为默认？`,
			clearKeptLabel: (count) => `${count} 个未加载皮肤的暂存设置`,
			clearKeptButton: "清理",
			clearKeptConfirm: (count) => `删除 ${count} 个未加载皮肤的暂存设置？这些设置只在对应皮肤加载后才会生效。`,
			clearKeptOk: (count) => `已清理 ${count} 个未加载皮肤的暂存设置。`,
			importErrorMessage: (code) => {
				switch (code) {
					case "empty": return "文件为空";
					case "invalid-json": return "文件不是有效的 JSON";
					case "invalid-envelope": return "文件不是有效的皮肤设置备份";
					case "no-matching-skins": return "备份里没有皮肤设置";
					case "too-large": return "文件过大：设置内容超过 256 KiB 限制";
					case "store-too-large": return "导入后的设置会超过 256 KiB 的可恢复上限，请先清理未加载皮肤的暂存设置";
				}
			}
		};
		const enCopy = {
			headerTitle: "Skin Management",
			increaseValue: (label) => `Increase ${label}`,
			decreaseValue: (label) => `Decrease ${label}`,
			navLabel: "Skins",
			installedTitle: "Installed",
			checking: "Checking…",
			checkUpdates: "Check for updates",
			officialName: "Official",
			stateCurrent: "Current",
			stateSwitching: "Switching…",
			skinConflict: "Multiple skins are active. Select the skin to use.",
			switchStateUnavailable: "The Host skin runtime state is unavailable.",
			switchChanged: "Another operation changed the selected skin.",
			switchRestartRequired: "Settings saved, but this window did not finish switching skins. Restart the desktop app to apply them.",
			compatibility: (version) => `Verified on DSH ${version}`,
			incompatibleBlocked: (runtime) => `Not supported on DSH ${runtime}; disabled`,
			incompatibleAllowed: (runtime) => `Allowed on DSH ${runtime}`,
			incompatibleConfirm: (runtime) => `This skin does not declare support for DSH ${runtime}. Enabling it may break the interface, for example hiding the composer.\n\nEnable it anyway? You can switch back to Official at any time.`,
			gitHashTitle: (hash, date) => `Local commit ${hash}${date === null ? "" : `\n${date}`}\nClick to copy`,
			buildHashTitle: (hash) => `Local build ${hash}\nClick to copy`,
			upToDate: "Up to date",
			updateAvailable: (short, date) => date === "" ? `Update ${short}` : `Update ${short} · ${date}`,
			localAhead: "Local is newer",
			diverged: "Diverged from remote",
			unknownUpdate: "Cannot check for updates",
			localDirty: "Local changes",
			noSkins: "No skins installed.",
			copiedOk: "Copied.",
			copyFailed: "Copy failed: the browser denied clipboard access.",
			loadingSkins: "Loading…",
			actionFailed: (message) => `Operation failed: ${message}`,
			noSettings: "This skin has no settings.",
			lockedBy: (label) => `Unavailable while “${label}” is on`,
			locked: "Currently unavailable",
			desktopIconTitle: "Desktop",
			desktopIconLabel: "Shortcut icon follows the skin",
			desktopIconDescription: "Replaces the icon on the desktop, Start menu and taskbar; turning this off or returning to Official restores it.",
			desktopIconPending: "Updating shortcuts…",
			desktopIconDone: (updated, failed, errors = []) => failed > 0 ? `Updated ${updated} shortcut(s); ${failed} could not be changed: ${desktopIconReasons(errors, {
				"shared-denied": "shortcuts shared by all users need DeepSeek Harness to run as administrator",
				"save-blocked": "a security suite's shortcut protection (such as 360 or Huorong) blocked the write; add DeepSeek Harness to its trusted list, then toggle the switch again"
			}, "toggle the switch again to retry").join("; ")}.` : updated > 0 ? `Updated ${updated} shortcut(s); the Start menu refreshes shortly.` : "Shortcuts already show the target icon, or the active skin ships no desktop icon.",
			schedulePolicy: "Rule",
			policyHideInRanges: "Hide during these periods",
			policyShowInRanges: "Show only during these periods",
			rangeStartAria: (index) => `Period ${index} start`,
			rangeEndAria: (index) => `Period ${index} end`,
			hourAria: (label) => `${label} hour`,
			minuteAria: (label) => `${label} minute`,
			rangeTo: "to",
			removeRange: "Remove",
			addRange: "Add period",
			scheduleHint: "Local time; periods may cross midnight, e.g. 22:00 to 07:00.",
			backupTitle: "Backup",
			backupLabel: "Skin and manager settings",
			backupDescription: "You can also drop a JSON file here to import it.",
			exportButton: "Export",
			importButton: "Import",
			dropActive: "Release to import",
			exportOk: "Exported.",
			importOk: (count) => `Imported ${count} settings group${count === 1 ? "" : "s"}.`,
			importOkDeferred: (active, deferred) => `Imported ${active} settings group${active === 1 ? "" : "s"}; ${deferred} more apply once those skins load.`,
			importFail: (message) => `Import failed: ${message}`,
			importErrorInvalidEnvelope: "The file is not a valid skin settings backup",
			importErrorTooLarge: "The file is too large: its settings exceed the 256 KiB limit",
			resetSkinButton: "Reset",
			resetSkinConfirm: (title) => `Reset every setting of “${title}” to its default?`,
			clearKeptLabel: (count) => `Stored settings for ${count} unloaded skin${count === 1 ? "" : "s"}`,
			clearKeptButton: "Clear",
			clearKeptConfirm: (count) => `Delete the stored settings for ${count} unloaded skin${count === 1 ? "" : "s"}? They only take effect once that skin is loaded.`,
			clearKeptOk: (count) => `Cleared stored settings for ${count} unloaded skin${count === 1 ? "" : "s"}.`,
			importErrorMessage: (code) => {
				switch (code) {
					case "empty": return "The file is empty";
					case "invalid-json": return "The file is not valid JSON";
					case "invalid-envelope": return "The file is not a valid skin settings backup";
					case "no-matching-skins": return "The backup contains no skin settings";
					case "too-large": return "The file is too large: its settings exceed the 256 KiB limit";
					case "store-too-large": return "The imported settings would exceed the 256 KiB restorable limit; clear the stored settings for unloaded skins first";
				}
			}
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
		function groupLabel(group, lang) {
			return lang === "en" ? group.labelEn ?? group.label : group.label;
		}
		//#endregion
		//#region src/client/switch-settle.ts
		/** Upper bound for the Host to start applying the patch. */
		const SWITCH_SETTLE_TIMEOUT_MS = 12e3;
		/** Desktop-shell pages receive their boot graph through this preload bridge. */
		function isDesktopShell(target = window) {
			return "dshDesktopBoot" in target;
		}
		/** Ids of the skins whose body attribute is currently present, in catalog order. */
		function activeSkins(catalog, body) {
			return catalog.filter((skin) => body.hasAttribute(skin.bodyAttr)).map((skin) => skin.id);
		}
		/**
		* Resolve once the mounted skins satisfy `done`, checked on every change of
		* a catalog body attribute.
		* @returns false when that did not happen within the timeout.
		*/
		function waitForSkins(catalog, done, doc = document, timeoutMs = SWITCH_SETTLE_TIMEOUT_MS, signal) {
			return new Promise((resolve) => {
				let timer;
				const observer = new MutationObserver(() => {
					if (done(activeSkins(catalog, doc.body))) finish(true);
				});
				const abort = () => {
					finish(false);
				};
				const finish = (settled) => {
					observer.disconnect();
					if (timer !== void 0) window.clearTimeout(timer);
					signal?.removeEventListener("abort", abort);
					resolve(settled);
				};
				if (signal?.aborted) {
					finish(false);
					return;
				}
				observer.observe(doc.body, {
					attributes: true,
					attributeFilter: catalog.map((skin) => skin.bodyAttr)
				});
				timer = window.setTimeout(() => finish(false), timeoutMs);
				signal?.addEventListener("abort", abort, { once: true });
			});
		}
		//#endregion
		//#region src/client/desktop-switch.ts
		var SelectionChanged = class extends Error {};
		function matches(active, target) {
			return target === "official" ? active.length === 0 : active.length === 1 && active[0] === target;
		}
		function pause(signal) {
			return new Promise((resolve, reject) => {
				signal.throwIfAborted();
				const finish = () => {
					signal.removeEventListener("abort", abort);
					resolve();
				};
				const timer = window.setTimeout(finish, 200);
				const abort = () => {
					window.clearTimeout(timer);
					signal.removeEventListener("abort", abort);
					reject(signal.reason);
				};
				signal.addEventListener("abort", abort, { once: true });
			});
		}
		/** Confirm the Host graph and page together, repairing one disposed skin retained by the Host. */
		async function switchDesktopSkin(catalog, target, request, readState, doc = document, signal) {
			const copy = skinManagerCopy(currentUiLang());
			const wait = async (next, repair) => {
				const timeout = new AbortController();
				let available = false;
				const timer = window.setTimeout(() => timeout.abort(new Error(available ? copy.switchRestartRequired : copy.switchStateUnavailable)), SWITCH_SETTLE_TIMEOUT_MS);
				const pending = signal === void 0 ? timeout.signal : AbortSignal.any([signal, timeout.signal]);
				try {
					for (;;) {
						pending.throwIfAborted();
						const state = await readState(pending);
						if (state === void 0) {
							await pause(pending);
							continue;
						}
						available = true;
						if (!matches(state.configured, next)) throw new SelectionChanged(copy.switchChanged);
						if (matches(state.active, next) && matches(activeSkins(catalog, doc.body), next)) return;
						const stale = state.stale.find((id) => id !== next);
						if (stale !== void 0) {
							const skin = catalog.find((skin) => skin.id === stale);
							if (!repair || skin === void 0 || skin.compatibility !== void 0 && !skin.compatibility.exempted) throw new Error(copy.skinConflict);
							return stale;
						}
						await pause(pending);
					}
				} finally {
					window.clearTimeout(timer);
					timeout.abort();
				}
			};
			signal?.throwIfAborted();
			await request(target, signal);
			const stale = await wait(target, true);
			if (stale === void 0) return;
			let restore = true;
			try {
				await request(stale, signal);
				await wait(stale, false);
			} catch (error) {
				if (error instanceof SelectionChanged) restore = false;
				throw error;
			} finally {
				if (restore) await request(target);
			}
			await wait(target, false);
		}
		//#endregion
		//#region \0dsh-css:../skin-manager/src/client/skin-manager.module.css.mjs
		const css = ".orL4ja_section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:24px;padding-bottom:8px;font-size:13px;line-height:22px;display:flex}.orL4ja_title,.orL4ja_blockHead h3,.orL4ja_groupTitle,.orL4ja_hint,.orL4ja_error{margin:0}.orL4ja_title{font-size:18px;font-weight:600;line-height:26px}.orL4ja_block{flex-direction:column;gap:10px;min-width:0;display:flex}.orL4ja_blockHead{justify-content:space-between;align-items:center;gap:12px;min-height:32px;display:flex}.orL4ja_blockHead h3{min-width:0;font-size:14px;font-weight:500;line-height:22px}.orL4ja_group{flex-direction:column;gap:6px;display:flex}.orL4ja_group+.orL4ja_group{margin-top:6px}.orL4ja_groupTitle{color:var(--dsw-alias-label-tertiary);padding-inline:4px;font-size:12px;font-weight:500;line-height:18px}.orL4ja_card{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);flex-direction:column;min-width:0;padding:2px 16px;display:flex}.orL4ja_card[data-dragging]{border-color:var(--dsw-alias-border-selected);background:var(--dsw-alias-bg-module-platform)}.orL4ja_skinGrid{grid-template-columns:repeat(auto-fill,minmax(164px,1fr));gap:10px;margin:0;padding:0;list-style:none;display:grid}.orL4ja_skinCard{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);flex-direction:column;min-width:0;transition:border-color .16s,background-color .16s;display:flex;overflow:hidden}.orL4ja_skinCard[data-active]{border-color:var(--dsw-alias-border-selected);background:var(--dsw-alias-bg-module-platform)}.orL4ja_skinMain{box-sizing:border-box;width:100%;min-height:48px;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;flex:1 0 auto;justify-content:space-between;align-items:flex-start;gap:8px;margin:0;padding:13px 14px;display:flex}.orL4ja_skinCard:has(>.orL4ja_skinMeta)>.orL4ja_skinMain{padding-bottom:4px}@media (hover:hover){.orL4ja_skinMain:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}.orL4ja_skinMain:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}.orL4ja_skinMain:disabled{cursor:default}.orL4ja_skinMain:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px;border-radius:var(--dsw-radius-xl)}.orL4ja_skinName{overflow-wrap:anywhere;min-width:0;font-size:14px;font-weight:500;line-height:22px}.orL4ja_skinState{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none;margin-top:2px;padding:1px 6px;font-size:11px;line-height:16px}.orL4ja_skinMeta{color:var(--dsw-alias-label-tertiary);flex-direction:column;gap:1px;padding:0 14px 12px;font-size:12px;line-height:18px;display:flex}.orL4ja_metaLine{overflow-wrap:anywhere}.orL4ja_incompatible{color:var(--dsw-alias-state-warn-label);overflow-wrap:anywhere}.orL4ja_versionRow{flex-wrap:wrap;align-items:baseline;gap:0 8px;display:flex}.orL4ja_versionRow:empty{display:none}.orL4ja_versionHash{appearance:none;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);font-size:11px;line-height:inherit;cursor:copy;white-space:nowrap;background:0 0;border:0;padding:0}@media (hover:hover){.orL4ja_versionHash:hover{color:var(--dsw-alias-label-primary)}}.orL4ja_versionHash:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px;border-radius:2px}.orL4ja_versionOk{color:var(--dsw-alias-state-success-primary)}.orL4ja_versionUpdate{color:var(--dsw-alias-state-warn-label)}.orL4ja_settingNode+.orL4ja_settingNode{border-top:.5px solid var(--dsw-alias-border-l2)}.orL4ja_toggleRow,.orL4ja_selectRow,.orL4ja_sliderRow,.orL4ja_colorRow,.orL4ja_actionRow{box-sizing:border-box;justify-content:space-between;align-items:center;gap:24px;min-height:60px;padding:12px 0;display:flex}.orL4ja_rowText{flex:auto;gap:2px;min-width:0;display:grid}.orL4ja_rowTitle{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;font-size:14px;line-height:22px}.orL4ja_rowDescription,.orL4ja_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.orL4ja_toggleRow>:last-child,.orL4ja_selectRow>:last-child,.orL4ja_colorRow>:last-child,.orL4ja_actionRow>:last-child{flex:none}.orL4ja_rowActions{flex:none;align-items:center;gap:8px;display:inline-flex}.orL4ja_children{border-left:2px solid var(--dsw-alias-border-l2);flex-direction:column;margin:-6px 0 12px 2px;padding-left:14px;display:flex}.orL4ja_children .orL4ja_settingNode+.orL4ja_settingNode{border-top:0}.orL4ja_children :is(.orL4ja_toggleRow,.orL4ja_selectRow,.orL4ja_sliderRow,.orL4ja_colorRow){min-height:44px;padding:6px 0}.orL4ja_settingNode[data-locked]>:is(.orL4ja_toggleRow,.orL4ja_selectRow,.orL4ja_sliderRow,.orL4ja_colorRow,.orL4ja_checkboxGroup) .orL4ja_rowTitle{color:var(--dsw-alias-label-tertiary)}.orL4ja_selectInput{box-sizing:border-box;width:240px;min-width:0;max-width:100%;height:32px;color:var(--dsw-alias-label-primary);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background-color:var(--dsw-alias-bg-layer-1);font:inherit;white-space:nowrap;text-overflow:ellipsis;appearance:none;cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 12px center;background-repeat:no-repeat;background-size:12px 12px;flex:none;padding:0 32px 0 10px;font-size:14px;line-height:22px;overflow:hidden}.orL4ja_selectInput:focus{border-color:var(--dsw-alias-state-business-primary);outline:none}.orL4ja_selectInput:disabled,.orL4ja_sliderRow input:disabled,.orL4ja_colorRow input:disabled{opacity:.5;cursor:default}.orL4ja_sliderControl{box-sizing:border-box;flex:none;align-items:center;gap:10px;width:240px;max-width:100%;display:inline-flex}.orL4ja_sliderValue{min-width:4ch;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right;flex:none;font-size:13px}.orL4ja_sliderControl input[type=range]{appearance:none;cursor:pointer;background:0 0;border:0;flex:auto;min-width:0;height:20px;margin:0;padding:0}.orL4ja_sliderControl input[type=range]::-webkit-slider-runnable-track{background:var(--dsw-alias-border-l3);border-radius:2px;height:4px}.orL4ja_sliderControl input[type=range]::-webkit-slider-thumb{background:var(--dsw-alias-button-primary-fill);appearance:none;border:0;border-radius:50%;width:16px;height:16px;margin-top:-6px}.orL4ja_sliderControl input[type=range]::-moz-range-track{background:var(--dsw-alias-border-l3);border-radius:2px;height:4px}.orL4ja_sliderControl input[type=range]::-moz-range-thumb{background:var(--dsw-alias-button-primary-fill);border:0;border-radius:50%;width:16px;height:16px}.orL4ja_sliderControl input[type=range]:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px;border-radius:4px}.orL4ja_colorControl{flex:none;align-items:center;gap:8px!important;display:flex!important}.orL4ja_colorControl code{min-width:7ch;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace, monospace);font-size:12px}.orL4ja_colorButton{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);cursor:pointer;width:48px;height:32px;padding:4px}.orL4ja_colorButton:hover:not(:disabled),.orL4ja_colorButton[aria-expanded=true]{border-color:var(--dsw-alias-border-selected)}.orL4ja_colorButton:disabled{opacity:.5;cursor:default}.orL4ja_colorSwatch{border-radius:4px;width:100%;height:100%;display:block;box-shadow:inset 0 0 0 .5px #0000003d}.orL4ja_colorPopover{box-sizing:border-box;width:264px;color:var(--dsw-alias-label-primary);border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1));box-shadow:var(--dsw-elevation-prominent);margin:0;padding:12px;display:none;position:fixed;inset:auto}.orL4ja_colorPopover:popover-open{gap:10px;display:grid}.orL4ja_colorPopover::backdrop{background:0 0}.orL4ja_colorPalette{border-radius:var(--dsw-radius-xs);cursor:crosshair;touch-action:none;background-image:linear-gradient(#0000,#000);height:136px;position:relative;overflow:hidden}.orL4ja_colorPalette:before{content:\"\";background:linear-gradient(90deg,#fff,#0000);position:absolute;inset:0}.orL4ja_colorPaletteMarker{z-index:1;pointer-events:none;border:2px solid #fff;border-radius:50%;width:12px;height:12px;position:absolute;transform:translate(-50%,-50%);box-shadow:0 0 0 1px #000000a6}.orL4ja_colorHueRow{grid-template-columns:28px minmax(0,1fr);align-items:center;gap:10px;display:grid}.orL4ja_colorPreview{border-radius:50%;width:28px;height:28px;box-shadow:inset 0 0 0 .5px #0000003d}.orL4ja_colorHueRow input[type=range]{appearance:none;cursor:pointer;background:linear-gradient(90deg,red,#ff0,#0f0,#0ff,#00f,#f0f,red);border:0;border-radius:7px;width:100%;height:14px;margin:0}.orL4ja_colorHueRow input[type=range]::-webkit-slider-thumb{appearance:none;background:0 0;border:2px solid #fff;border-radius:7px;width:14px;height:20px;box-shadow:0 0 0 1px #00000073}.orL4ja_colorHueRow input[type=range]::-moz-range-thumb{background:0 0;border:2px solid #fff;border-radius:7px;width:10px;height:16px;box-shadow:0 0 0 1px #00000073}.orL4ja_colorRgb{grid-template-columns:repeat(3,1fr);gap:8px;display:grid}.orL4ja_colorRgb label{color:var(--dsw-alias-label-tertiary);justify-items:center;gap:4px;font-size:11px;display:grid}.orL4ja_colorRgb input{box-sizing:border-box;width:100%;height:30px;color:var(--dsw-alias-label-primary);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);text-align:center;padding-inline:6px}.orL4ja_checkboxGroup{flex-direction:column;gap:8px;padding:10px 0 12px;display:flex}.orL4ja_children .orL4ja_checkboxGroup{padding:6px 0 8px}.orL4ja_checkboxGrid{flex-wrap:wrap;gap:6px 16px;display:flex}.orL4ja_checkboxOption{cursor:pointer;align-items:center;gap:6px;min-height:24px;font-size:14px;display:inline-flex}.orL4ja_checkboxOption input{block-size:16px;inline-size:16px;accent-color:var(--dsw-alias-button-primary-fill);cursor:pointer;margin:0}.orL4ja_checkboxOption input:disabled{opacity:.5;cursor:default}.orL4ja_numberControl{align-items:center;gap:8px;display:inline-flex}.orL4ja_stepper{background:var(--dsw-alias-bg-module-platform);border-radius:18px;justify-content:center;align-items:center;min-width:72px;height:36px;display:inline-flex;position:relative}.orL4ja_numberValue{text-align:center;font-variant-numeric:tabular-nums;min-width:18px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}.orL4ja_numberUnit{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}.orL4ja_stepperArrows{opacity:0;flex-direction:column;gap:2px;display:flex;position:absolute;right:8px}.orL4ja_stepper:hover .orL4ja_stepperArrows,.orL4ja_stepper:focus-within .orL4ja_stepperArrows{opacity:1}@media (hover:none){.orL4ja_stepperArrows{opacity:1}}.orL4ja_stepperArrow{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 75%, transparent);width:17px;height:12px;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:3px;justify-content:center;align-items:center;padding:0;display:inline-flex}.orL4ja_stepperArrow:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}.orL4ja_stepperArrow:disabled{color:var(--dsw-alias-label-caption);cursor:default}.orL4ja_timeSelect{align-items:center;gap:4px;width:100%;min-width:0;display:inline-flex}.orL4ja_timeSelect .orL4ja_selectInput{background-position:right 8px center;flex:1 1 0;width:auto;min-width:56px;max-width:none;padding:0 24px 0 8px}.orL4ja_timeColon{color:var(--dsw-alias-label-tertiary);flex:none}.orL4ja_schedule{flex-direction:column;display:flex}.orL4ja_rangeList{flex-direction:column;gap:6px;padding:2px 0 8px;display:flex}.orL4ja_rangeRow{color:var(--dsw-alias-label-secondary);grid-template-columns:minmax(128px,1fr) auto minmax(128px,1fr) auto;align-items:center;gap:8px;font-size:12px;display:grid}.orL4ja_rangeFooter{flex-wrap:wrap;align-items:center;gap:6px 12px;display:flex}.orL4ja_error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}@media (hover:hover){.orL4ja_resetButton:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}}.orL4ja_fileInput{clip:rect(0, 0, 0, 0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.orL4ja_introHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}@media (width<=720px){.orL4ja_selectRow,.orL4ja_colorRow,.orL4ja_sliderRow{flex-flow:column;align-items:stretch;gap:8px}.orL4ja_sliderControl{width:100%}.orL4ja_rangeRow{grid-template-columns:1fr auto 1fr}.orL4ja_rangeRow button{grid-column:1/-1;justify-self:end}}";
		const tagId = "@smalltailqwq/dsh-client-ui-skin-deep-whale-manager/skin-manager.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-deep-whale-manager";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var skin_manager_module_css_default = {
			"actionRow": "orL4ja_actionRow",
			"block": "orL4ja_block",
			"blockHead": "orL4ja_blockHead",
			"card": "orL4ja_card",
			"checkboxGrid": "orL4ja_checkboxGrid",
			"checkboxGroup": "orL4ja_checkboxGroup",
			"checkboxOption": "orL4ja_checkboxOption",
			"children": "orL4ja_children",
			"colorButton": "orL4ja_colorButton",
			"colorControl": "orL4ja_colorControl",
			"colorHueRow": "orL4ja_colorHueRow",
			"colorPalette": "orL4ja_colorPalette",
			"colorPaletteMarker": "orL4ja_colorPaletteMarker",
			"colorPopover": "orL4ja_colorPopover",
			"colorPreview": "orL4ja_colorPreview",
			"colorRgb": "orL4ja_colorRgb",
			"colorRow": "orL4ja_colorRow",
			"colorSwatch": "orL4ja_colorSwatch",
			"error": "orL4ja_error",
			"fileInput": "orL4ja_fileInput",
			"group": "orL4ja_group",
			"groupTitle": "orL4ja_groupTitle",
			"hint": "orL4ja_hint",
			"incompatible": "orL4ja_incompatible",
			"introHint": "orL4ja_introHint",
			"metaLine": "orL4ja_metaLine",
			"numberControl": "orL4ja_numberControl",
			"numberUnit": "orL4ja_numberUnit",
			"numberValue": "orL4ja_numberValue",
			"rangeFooter": "orL4ja_rangeFooter",
			"rangeList": "orL4ja_rangeList",
			"rangeRow": "orL4ja_rangeRow",
			"resetButton": "orL4ja_resetButton",
			"rowActions": "orL4ja_rowActions",
			"rowDescription": "orL4ja_rowDescription",
			"rowText": "orL4ja_rowText",
			"rowTitle": "orL4ja_rowTitle",
			"schedule": "orL4ja_schedule",
			"section": "orL4ja_section",
			"selectInput": "orL4ja_selectInput",
			"selectRow": "orL4ja_selectRow",
			"settingNode": "orL4ja_settingNode",
			"skinCard": "orL4ja_skinCard",
			"skinGrid": "orL4ja_skinGrid",
			"skinMain": "orL4ja_skinMain",
			"skinMeta": "orL4ja_skinMeta",
			"skinName": "orL4ja_skinName",
			"skinState": "orL4ja_skinState",
			"sliderControl": "orL4ja_sliderControl",
			"sliderRow": "orL4ja_sliderRow",
			"sliderValue": "orL4ja_sliderValue",
			"stepper": "orL4ja_stepper",
			"stepperArrow": "orL4ja_stepperArrow",
			"stepperArrows": "orL4ja_stepperArrows",
			"timeColon": "orL4ja_timeColon",
			"timeSelect": "orL4ja_timeSelect",
			"title": "orL4ja_title",
			"toggleRow": "orL4ja_toggleRow",
			"versionHash": "orL4ja_versionHash",
			"versionOk": "orL4ja_versionOk",
			"versionRow": "orL4ja_versionRow",
			"versionUpdate": "orL4ja_versionUpdate"
		};
		//#endregion
		//#region src/client/SkinManager.tsx
		const shortDate = (iso) => iso === null ? "" : iso.slice(0, 10);
		/**
		* Version facts under one skin card: the short local identity (click to copy
		* the full one), then the comparison once the user has asked for it. Nothing
		* is shown for a comparison that has not run.
		*/
		function VersionFacts({ info, onCopied }) {
			const copy = skinManagerCopy(useUiLang());
			if (info === void 0) return null;
			const local = info.local;
			const remote = info.remote;
			const latest = remote?.latest ?? null;
			const copyHash = async (hash) => {
				try {
					await navigator.clipboard?.writeText(hash);
					onCopied(true);
				} catch {
					onCopied(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				info.source !== "none" && local !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: skin_manager_module_css_default.versionHash,
					title: info.source === "git" ? copy.gitHashTitle(local.hash, local.date) : copy.buildHashTitle(local.hash),
					onClick: () => void copyHash(local.hash),
					children: local.short
				}),
				remote?.state === "up-to-date" && latest !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skin_manager_module_css_default.versionOk,
					children: copy.upToDate
				}),
				remote?.state === "update-available" && latest !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skin_manager_module_css_default.versionUpdate,
					title: latest.message,
					children: copy.updateAvailable(latest.short, shortDate(latest.date))
				}),
				remote?.state === "local-ahead" && latest !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					title: latest.short,
					children: copy.localAhead
				}),
				remote?.state === "diverged" && latest !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					title: latest.short,
					children: copy.diverged
				}),
				remote?.state === "unknown" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.unknownUpdate }),
				info.dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy.localDirty }),
				info.note !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: info.note })
			] });
		}
		/** Title plus optional description, in the host settings row typography. */
		function RowText({ label, description }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: skin_manager_module_css_default.rowText,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skin_manager_module_css_default.rowTitle,
					children: label
				}), description && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
					className: skin_manager_module_css_default.rowDescription,
					children: description
				})]
			});
		}
		/**
		* A boolean row drawn with the host's own Switch (ui-primitives, a platform
		* module), so it matches the Plugins page and follows whatever each skin does
		* to the product switch. Only the switch toggles; the row copy stays text.
		*/
		function Toggle({ checked, label, description, disabled = false, onChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.toggleRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
					label,
					description
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
					checked,
					label,
					disabled,
					onChange
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
						className: skin_manager_module_css_default.selectInput,
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
						className: skin_manager_module_css_default.selectInput,
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
		/**
		* A schedule is a switch with dependent rows: the rule and the periods sit in
		* the same indented block that every other dependent control uses, and only
		* while the schedule is on.
		*/
		function ScheduleEditor({ setting, value, description, onChange }) {
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
					description: description ?? settingDescription(setting, lang),
					onChange: (enabled) => onChange({
						...value,
						enabled
					})
				}), value.enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.children,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: skin_manager_module_css_default.selectRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, { label: copy.schedulePolicy }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							className: skin_manager_module_css_default.selectInput,
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
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_manager_module_css_default.rangeList,
						children: [value.ranges.map((range, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									onClick: () => onChange({
										...value,
										ranges: value.ranges.filter((_, current) => current !== index)
									}),
									children: copy.removeRange
								})
							]
						}, index)), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skin_manager_module_css_default.rangeFooter,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: value.ranges.length >= 24,
								onClick: () => onChange({
									...value,
									ranges: [...value.ranges, {
										start: "09:00",
										end: "12:00"
									}]
								}),
								children: copy.addRange
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
								className: skin_manager_module_css_default.hint,
								children: copy.scheduleHint
							})]
						})]
					})]
				})]
			});
		}
		/**
		* Numbers take one of two controls. The slider is for a continuous amount the
		* user judges by eye or ear (brightness, volume) and always shows its value;
		* the stepper is for a small exact quantity (a height in px, a count).
		*/
		function RangeEditor({ setting, label, description, value, disabled = false, onChange }) {
			const copy = skinManagerCopy(useUiLang());
			if (setting.control === "stepper") {
				const step = setting.step ?? 1;
				const change = (direction) => onChange(Math.min(setting.max, Math.max(setting.min, Number((value + direction * step).toPrecision(12)))));
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.selectRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
						label,
						description
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_manager_module_css_default.numberControl,
						role: "group",
						"aria-label": label,
						"aria-disabled": disabled || void 0,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skin_manager_module_css_default.stepper,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_manager_module_css_default.numberValue,
								children: value
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: skin_manager_module_css_default.stepperArrows,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: skin_manager_module_css_default.stepperArrow,
									"aria-label": copy.increaseValue(label),
									disabled: disabled || value >= setting.max,
									onClick: () => change(1),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										width: "9",
										height: "9",
										viewBox: "0 0 14 14",
										fill: "none",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "m3 9 4-4 4 4",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round",
											strokeLinejoin: "round"
										})
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: skin_manager_module_css_default.stepperArrow,
									"aria-label": copy.decreaseValue(label),
									disabled: disabled || value <= setting.min,
									onClick: () => change(-1),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										width: "9",
										height: "9",
										viewBox: "0 0 14 14",
										fill: "none",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "m3 5 4 4 4-4",
											stroke: "currentColor",
											strokeWidth: "1.5",
											strokeLinecap: "round",
											strokeLinejoin: "round"
										})
									})
								})]
							})]
						}), setting.unit && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skin_manager_module_css_default.numberUnit,
							children: setting.unit
						})]
					})]
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.sliderRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
					label,
					description
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: skin_manager_module_css_default.sliderControl,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min: setting.min,
						max: setting.max,
						step: setting.step ?? 1,
						value,
						disabled,
						"aria-label": label,
						"aria-valuetext": `${value}${setting.unit ?? ""}`,
						onChange: (event) => onChange(Number(event.currentTarget.value))
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: skin_manager_module_css_default.sliderValue,
						"aria-hidden": "true",
						children: [value, setting.unit ?? ""]
					})]
				})]
			});
		}
		const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
		function hexToRgb(value) {
			const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
			return match === null ? {
				r: 255,
				g: 83,
				b: 111
			} : {
				r: Number.parseInt(match[1], 16),
				g: Number.parseInt(match[2], 16),
				b: Number.parseInt(match[3], 16)
			};
		}
		function rgbToHex({ r, g, b }) {
			return `#${[
				r,
				g,
				b
			].map((part) => Math.round(clamp(part, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
		}
		function rgbToHsv({ r, g, b }) {
			const red = r / 255;
			const green = g / 255;
			const blue = b / 255;
			const max = Math.max(red, green, blue);
			const delta = max - Math.min(red, green, blue);
			let hue = 0;
			if (delta !== 0) {
				if (max === red) hue = 60 * ((green - blue) / delta % 6);
				else if (max === green) hue = 60 * ((blue - red) / delta + 2);
				else hue = 60 * ((red - green) / delta + 4);
			}
			return {
				h: hue < 0 ? hue + 360 : hue,
				s: max === 0 ? 0 : delta / max,
				v: max
			};
		}
		function hsvToRgb({ h, s, v }) {
			const chroma = v * s;
			const sector = (h % 360 + 360) % 360 / 60;
			const second = chroma * (1 - Math.abs(sector % 2 - 1));
			const [red, green, blue] = sector < 1 ? [
				chroma,
				second,
				0
			] : sector < 2 ? [
				second,
				chroma,
				0
			] : sector < 3 ? [
				0,
				chroma,
				second
			] : sector < 4 ? [
				0,
				second,
				chroma
			] : sector < 5 ? [
				second,
				0,
				chroma
			] : [
				chroma,
				0,
				second
			];
			const match = v - chroma;
			return {
				r: (red + match) * 255,
				g: (green + match) * 255,
				b: (blue + match) * 255
			};
		}
		function ColorEditor({ label, description, value, disabled = false, onChange }) {
			const button = (0, react.useRef)(null);
			const popover = (0, react.useRef)(null);
			const color = rgbToHsv(hexToRgb(value));
			const [hue, setHue] = (0, react.useState)(color.h);
			const [open, setOpen] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (color.s > 0) setHue(color.h);
			}, [color.h, color.s]);
			(0, react.useEffect)(() => {
				const panel = popover.current;
				if (panel === null) return;
				panel.setAttribute("popover", "auto");
				const onToggle = () => setOpen(panel.matches(":popover-open"));
				panel.addEventListener("toggle", onToggle);
				return () => panel.removeEventListener("toggle", onToggle);
			}, []);
			const positionPopover = () => {
				const trigger = button.current;
				const panel = popover.current;
				if (trigger === null || panel === null) return;
				const triggerRect = trigger.getBoundingClientRect();
				const gap = 8;
				const edge = 8;
				const left = clamp(triggerRect.right - panel.offsetWidth, edge, window.innerWidth - panel.offsetWidth - edge);
				const below = triggerRect.bottom + gap;
				const top = below + panel.offsetHeight <= window.innerHeight - edge ? below : Math.max(edge, triggerRect.top - panel.offsetHeight - gap);
				panel.style.left = `${left}px`;
				panel.style.top = `${top}px`;
			};
			const togglePopover = () => {
				const panel = popover.current;
				if (panel === null) return;
				if (panel.matches(":popover-open")) panel.hidePopover();
				else {
					panel.showPopover();
					positionPopover();
				}
			};
			const updateSaturationValue = (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				const saturation = clamp((event.clientX - rect.left) / rect.width, 0, 1);
				const brightness = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1);
				onChange(rgbToHex(hsvToRgb({
					h: hue,
					s: saturation,
					v: brightness
				})));
			};
			const rgb = hexToRgb(value);
			const updateRgb = (channel, raw) => {
				const numeric = Number.parseInt(raw, 10);
				onChange(rgbToHex({
					...rgb,
					[channel]: Number.isFinite(numeric) ? numeric : 0
				}));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.colorRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
					label,
					description
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.colorControl,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: value.toUpperCase() }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							ref: button,
							type: "button",
							className: skin_manager_module_css_default.colorButton,
							disabled,
							"aria-label": label,
							"aria-haspopup": "dialog",
							"aria-expanded": open,
							onClick: togglePopover,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_manager_module_css_default.colorSwatch,
								style: { backgroundColor: value }
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							ref: popover,
							className: skin_manager_module_css_default.colorPopover,
							role: "group",
							"aria-label": label,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: skin_manager_module_css_default.colorPalette,
									style: { backgroundColor: `hsl(${hue} 100% 50%)` },
									onPointerDown: (event) => {
										event.currentTarget.setPointerCapture(event.pointerId);
										updateSaturationValue(event);
									},
									onPointerMove: (event) => {
										if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSaturationValue(event);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_manager_module_css_default.colorPaletteMarker,
										style: {
											left: `${color.s * 100}%`,
											top: `${(1 - color.v) * 100}%`
										}
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_manager_module_css_default.colorHueRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_manager_module_css_default.colorPreview,
										style: { backgroundColor: value }
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "range",
										min: "0",
										max: "359",
										value: Math.round(hue),
										"aria-label": `${label} H`,
										onChange: (event) => {
											const nextHue = Number(event.currentTarget.value);
											setHue(nextHue);
											onChange(rgbToHex(hsvToRgb({
												...color,
												h: nextHue
											})));
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: skin_manager_module_css_default.colorRgb,
									children: [
										"r",
										"g",
										"b"
									].map((channel) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: "0",
										max: "255",
										value: Math.round(rgb[channel]),
										"aria-label": `${label} ${channel.toUpperCase()}`,
										onChange: (event) => updateRgb(channel, event.currentTarget.value)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: channel.toUpperCase() })] }, channel))
								})
							]
						})
					]
				})]
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
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
					label,
					description
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
		function SettingEditor({ setting, value, description, disabled = false, onChange }) {
			const lang = useUiLang();
			const label = settingLabel(setting, lang);
			if (setting.type === "boolean") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
				checked: value,
				label,
				description,
				disabled,
				onChange
			});
			if (setting.type === "select") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: skin_manager_module_css_default.selectRow,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
					label,
					description
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
					className: skin_manager_module_css_default.selectInput,
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
			if (setting.type === "color") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ColorEditor, {
				label,
				description,
				value,
				disabled,
				onChange
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
				description,
				onChange
			});
		}
		/**
		* One row and, indented under it, every visible row that depends on it. A
		* locked row (`disabledWhen`) names the control that locks it in place of
		* its description, so the reason sits where the user is looking.
		*/
		function SettingNodes({ nodes, definition, values, registry }) {
			const lang = useUiLang();
			const copy = skinManagerCopy(lang);
			const visible = nodes.filter((node) => settingVisible(node.setting, values, definition.settings));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: visible.map(({ setting, children }) => {
				const lock = settingLock(setting, values, definition.settings);
				const description = !lock.locked ? settingDescription(setting, lang) : lock.by !== void 0 ? copy.lockedBy(settingLabel(lock.by, lang)) : copy.locked;
				const shownChildren = children.filter((child) => settingVisible(child.setting, values, definition.settings));
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.settingNode,
					"data-setting-key": setting.key,
					"data-locked": lock.locked || void 0,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingEditor, {
						setting,
						value: values[setting.key],
						description,
						disabled: lock.locked,
						onChange: (value) => registry.set(definition, setting.key, value)
					}), shownChildren.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_manager_module_css_default.children,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingNodes, {
							nodes: shownChildren,
							definition,
							values,
							registry
						})
					})]
				}, setting.key);
			}) });
		}
		/** The active skin's controls: one titled card per declared group. */
		function CustomizationSection({ definition, registry }) {
			const lang = useUiLang();
			const copy = skinManagerCopy(lang);
			const values = registry.values(definition);
			const title = definitionTitle(definition, lang);
			const sections = layoutSettings(definition).filter((section) => section.nodes.some((node) => settingVisible(node.setting, values, definition.settings)));
			const onReset = () => {
				if (window.confirm(copy.resetSkinConfirm(title))) registry.resetSkin(definition.skinId);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skin_manager_module_css_default.block,
				"data-skin-customization": definition.skinId,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_manager_module_css_default.blockHead,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						size: "sm",
						className: skin_manager_module_css_default.resetButton,
						onClick: onReset,
						children: copy.resetSkinButton
					})]
				}), sections.map((section) => {
					const label = groupLabel(section, lang);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_manager_module_css_default.group,
						"data-setting-group": section.key || void 0,
						children: [label !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
							className: skin_manager_module_css_default.groupTitle,
							children: label
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.card,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingNodes, {
								nodes: section.nodes,
								definition,
								values,
								registry
							})
						})]
					}, section.key);
				})]
			});
		}
		/**
		* One choosable look. The card body is the button that switches to it; the
		* facts below it (verified host, version) stay outside the button so the
		* hash can be its own copy control.
		*/
		function SkinCard({ name, active, switching, disabled, onSelect, children }) {
			const copy = skinManagerCopy(useUiLang());
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: skin_manager_module_css_default.skinCard,
				"data-active": active || void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: skin_manager_module_css_default.skinMain,
					disabled,
					"aria-current": active || void 0,
					onClick: onSelect,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_manager_module_css_default.skinName,
						children: name
					}), (active || switching) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_manager_module_css_default.skinState,
						children: active ? copy.stateCurrent : copy.stateSwitching
					})]
				}), children !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: skin_manager_module_css_default.skinMeta,
					children
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
			const [desktopIcon, setDesktopIcon] = (0, react.useState)(void 0);
			const live = (0, react.useRef)(true);
			const copyTimer = (0, react.useRef)(void 0);
			const lang = useUiLang();
			const copy = skinManagerCopy(lang);
			const current = active(catalog);
			const currentDefinitions = definitions.filter((definition) => definition.skinId === current);
			const skinName = (skin) => lang === "en" && skin.nameEn !== void 0 ? skin.nameEn : skin.name;
			const currentSkin = catalog.find((skin) => skin.id === current);
			(0, react.useEffect)(() => {
				live.current = true;
				setLoading(true);
				fetchSkinCatalogState().then((state) => {
					if (!live.current) return;
					setCatalog(state.skins);
					setDesktopIcon(state.desktopIcon);
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
				const blocked = catalog.find((skin) => skin.id === target)?.compatibility;
				const acceptRisk = blocked !== void 0 && !blocked.exempted;
				if (acceptRisk && !window.confirm(copy.incompatibleConfirm(blocked.runtimeVersion))) return;
				setSwitching(target);
				setError(null);
				switchSkin(target, acceptRisk).then(() => {
					if (live.current) setSwitching(null);
				}, (reason) => {
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
			const busy = loading || switching !== null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_manager_module_css_default.section,
				"data-dsh-skin-manager": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: skin_manager_module_css_default.title,
						children: copy.headerTitle
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skin_manager_module_css_default.block,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_manager_module_css_default.blockHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: copy.installedTitle }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									disabled: loading || checking,
									onClick: checkVersions,
									children: checking ? copy.checking : copy.checkUpdates
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
								className: skin_manager_module_css_default.skinGrid,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkinCard, {
									name: copy.officialName,
									active: current === "official",
									switching: switching === "official",
									disabled: busy || current === "official",
									onSelect: () => choose("official")
								}), catalog.map((skin) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SkinCard, {
									name: skinName(skin),
									active: current === skin.id,
									switching: switching === skin.id,
									disabled: busy || current === skin.id,
									onSelect: () => choose(skin.id),
									children: [
										skin.compatibility !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skin.compatibility.exempted ? skin_manager_module_css_default.metaLine : skin_manager_module_css_default.incompatible,
											"data-skin-incompatible": skin.compatibility.exempted ? "allowed" : "blocked",
											children: skin.compatibility.exempted ? copy.incompatibleAllowed(skin.compatibility.runtimeVersion) : copy.incompatibleBlocked(skin.compatibility.runtimeVersion)
										}),
										skin.dshCompatibility && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skin_manager_module_css_default.metaLine,
											children: copy.compatibility(skin.dshCompatibility)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skin_manager_module_css_default.versionRow,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VersionFacts, {
												info: versions.get(skin.id),
												onCopied: announceCopied
											})
										})
									]
								}, skin.id))]
							}),
							catalog.length === 0 && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								children: copy.noSkins
							}),
							copied === "ok" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								role: "status",
								children: copy.copiedOk
							}),
							copied === "fail" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.error,
								role: "alert",
								children: copy.copyFailed
							}),
							loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.hint,
								children: copy.loadingSkins
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.error,
								role: "alert",
								children: copy.actionFailed(error)
							}),
							current === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_manager_module_css_default.error,
								role: "alert",
								children: copy.skinConflict
							})
						]
					}),
					currentDefinitions.map((definition) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CustomizationSection, {
						definition,
						registry
					}, definition.skinId)),
					!loading && currentSkin !== void 0 && currentDefinitions.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skin_manager_module_css_default.block,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.blockHead,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: skinName(currentSkin) })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skin_manager_module_css_default.hint,
							children: copy.noSettings
						})]
					}),
					desktopIcon !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DesktopIconCard, { initial: desktopIcon }),
					definitions.filter((definition) => definition.skinId === "dsh-skin-manager").map((definition) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: skin_manager_module_css_default.block,
						"data-dsh-skin-plugin-icons": true,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.blockHead,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: definitionTitle(definition, lang) })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.card,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingNodes, {
								nodes: layoutSettings(definition).flatMap((section) => section.nodes),
								definition,
								values: registry.values(definition),
								registry
							})
						})]
					}, definition.skinId)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackupCard, { registry })
				]
			});
		}
		/**
		* Opt-in Windows desktop shortcut icon. The host only reports the status on
		* the desktop shell, so the card never renders in a browser.
		*/
		function DesktopIconCard({ initial }) {
			const copy = skinManagerCopy(useUiLang());
			const [enabled, setEnabled] = (0, react.useState)(initial.enabled);
			const [pending, setPending] = (0, react.useState)(false);
			const [outcome, setOutcome] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				live.current = true;
				return () => {
					live.current = false;
				};
			}, []);
			const toggle = (next) => {
				setPending(true);
				setOutcome(null);
				setError(null);
				requestDesktopIcon(next).then((result) => {
					if (!live.current) return;
					setEnabled(result.enabled);
					setOutcome(result);
				}).catch((reason) => {
					if (live.current) setError(reason instanceof Error ? reason.message : String(reason));
				}).finally(() => {
					if (live.current) setPending(false);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skin_manager_module_css_default.block,
				"data-dsh-skin-desktop-icon": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_manager_module_css_default.blockHead,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: copy.desktopIconTitle })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_manager_module_css_default.card,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.settingNode,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
								checked: enabled,
								label: copy.desktopIconLabel,
								description: copy.desktopIconDescription,
								disabled: pending,
								onChange: toggle
							})
						})
					}),
					pending && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_manager_module_css_default.hint,
						role: "status",
						children: copy.desktopIconPending
					}),
					outcome !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: outcome.failed > 0 ? skin_manager_module_css_default.error : skin_manager_module_css_default.hint,
						role: "status",
						children: copy.desktopIconDone(outcome.updated, outcome.failed, outcome.errors)
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_manager_module_css_default.error,
						role: "alert",
						children: copy.actionFailed(error)
					})
				]
			});
		}
		/**
		* Backup & restore card: export the full preferences snapshot as a versioned
		* JSON file, import one back (file picker, or a file dropped anywhere on the
		* card), and surface the outcome through the same hint/error surface the rest
		* of the manager uses. Imports keep blocks for skins that are not loaded, so
		* the card also offers the one entry point that discards that kept data.
		*/
		function BackupCard({ registry }) {
			const copy = skinManagerCopy(useUiLang());
			const { definitions } = (0, react.useSyncExternalStore)(registry.subscribe, registry.getSnapshot);
			const fileInput = (0, react.useRef)(null);
			const [dragging, setDragging] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			const noticeTimer = (0, react.useRef)(void 0);
			const registered = new Set(definitions.map((definition) => definition.skinId));
			const keptSkins = Object.keys(registry.exportPreferences()).filter((skinId) => !registered.has(skinId));
			(0, react.useEffect)(() => {
				live.current = true;
				return () => {
					live.current = false;
					if (noticeTimer.current !== void 0) window.clearTimeout(noticeTimer.current);
				};
			}, []);
			const announce = (kind, text) => {
				if (!live.current) return;
				setNotice({
					kind,
					text
				});
				if (noticeTimer.current !== void 0) window.clearTimeout(noticeTimer.current);
				noticeTimer.current = window.setTimeout(() => {
					if (live.current) setNotice(null);
				}, 4e3);
			};
			const onExport = () => {
				try {
					const text = serializePreferencesExport(buildPreferencesExport(registry.exportPreferences()));
					const filename = defaultExportFileName();
					const blob = new Blob([text], { type: "application/json" });
					const url = URL.createObjectURL(blob);
					const anchor = document.createElement("a");
					anchor.href = url;
					anchor.download = filename;
					anchor.rel = "noopener";
					document.body.append(anchor);
					anchor.click();
					anchor.remove();
					URL.revokeObjectURL(url);
					announce("ok", copy.exportOk);
				} catch (error) {
					announce("fail", copy.importFail(error instanceof Error ? error.message : String(error)));
				}
			};
			const importText = (raw) => {
				try {
					const { preferences, matchedSkins, deferredSkins } = importPreferencesFromText(raw, registry.getSnapshot().definitions);
					const written = registry.importPreferences(preferences);
					announce("ok", deferredSkins.length === 0 ? copy.importOk(written === 0 ? matchedSkins.length : written) : copy.importOkDeferred(matchedSkins.length, deferredSkins.length));
				} catch (error) {
					const message = error instanceof PreferencesImportError ? copy.importErrorMessage(error.code) : error instanceof Error ? error.message : String(error);
					announce("fail", copy.importFail(message));
				}
			};
			const readFile = (file) => {
				if (!/\.json$/i.test(file.name) && file.type !== "application/json") {
					announce("fail", copy.importFail(copy.importErrorInvalidEnvelope));
					return;
				}
				if (file.size > 524288) {
					announce("fail", copy.importFail(copy.importErrorTooLarge));
					return;
				}
				file.text().then(importText).catch((error) => {
					announce("fail", copy.importFail(error instanceof Error ? error.message : String(error)));
				});
			};
			const onClearKept = () => {
				if (!window.confirm(copy.clearKeptConfirm(keptSkins.length))) return;
				announce("ok", copy.clearKeptOk(registry.removeUnregisteredSkins()));
			};
			const onImportClick = () => {
				fileInput.current?.click();
			};
			const onFileChange = (event) => {
				const file = event.currentTarget.files?.[0];
				event.currentTarget.value = "";
				if (file === void 0) return;
				readFile(file);
			};
			const onDragOver = (event) => {
				if (!event.dataTransfer.types.includes("Files")) return;
				event.preventDefault();
				event.stopPropagation();
				event.dataTransfer.dropEffect = "copy";
				setDragging(true);
			};
			const onDragLeave = (event) => {
				if (!event.dataTransfer.types.includes("Files")) return;
				event.preventDefault();
				event.stopPropagation();
				if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
				setDragging(false);
			};
			const onDrop = (event) => {
				if (!event.dataTransfer.types.includes("Files")) return;
				event.preventDefault();
				event.stopPropagation();
				setDragging(false);
				const file = event.dataTransfer.files?.[0];
				if (file === void 0) return;
				readFile(file);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: skin_manager_module_css_default.block,
				"data-dsh-skin-backup": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_manager_module_css_default.blockHead,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: copy.backupTitle })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_manager_module_css_default.card,
						"data-dragging": dragging || void 0,
						onDragEnter: onDragOver,
						onDragOver,
						onDragLeave,
						onDrop,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.settingNode,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_manager_module_css_default.actionRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, {
										label: copy.backupLabel,
										description: dragging ? copy.dropActive : copy.backupDescription
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: skin_manager_module_css_default.rowActions,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											onClick: onExport,
											children: copy.exportButton
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											onClick: onImportClick,
											children: copy.importButton
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										ref: fileInput,
										type: "file",
										accept: "application/json,.json",
										className: skin_manager_module_css_default.fileInput,
										onChange: onFileChange
									})
								]
							})
						}), keptSkins.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: skin_manager_module_css_default.settingNode,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_manager_module_css_default.actionRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RowText, { label: copy.clearKeptLabel(keptSkins.length) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_manager_module_css_default.rowActions,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										className: skin_manager_module_css_default.resetButton,
										onClick: onClearKept,
										children: copy.clearKeptButton
									})
								})]
							})
						})]
					}),
					notice !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: notice.kind === "ok" ? skin_manager_module_css_default.hint : skin_manager_module_css_default.error,
						role: notice.kind === "ok" ? "status" : "alert",
						children: notice.text
					})
				]
			});
		}
		/** Installed skin catalog plus host capabilities; never waits for optional version probes. */
		async function fetchSkinCatalogState(signal) {
			const response = await fetch(SKIN_MANAGER_ROUTE, {
				credentials: "same-origin",
				signal
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true || !Array.isArray(result.skins)) throw new Error(result.error ?? `HTTP ${response.status}`);
			return {
				skins: result.skins,
				runtime: result.runtime,
				...typeof result.desktopIcon?.enabled === "boolean" ? { desktopIcon: { enabled: result.desktopIcon.enabled } } : {}
			};
		}
		/** Installed skin catalog; never waits for optional version probes. */
		async function fetchSkinCatalog() {
			return (await fetchSkinCatalogState()).skins;
		}
		/** Turn the desktop shortcut icon sync on or off and report how many shortcuts changed. */
		async function requestDesktopIcon(enabled) {
			const response = await fetch(SKIN_MANAGER_ROUTE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					action: "desktop-icon",
					enabled
				})
			});
			const result = await response.json();
			if (!response.ok || result.ok !== true || result.desktopIcon === void 0) throw new Error(result.error ?? `HTTP ${response.status}`);
			return result.desktopIcon;
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
		/**
		* Web reloads at the first skin change; desktop confirms the graph and page
		* in place and repairs a disposed skin retained by the Host once.
		*/
		async function requestSkinSwitch(target, acceptRisk = false, signal) {
			const { skins: catalog } = await fetchSkinCatalogState(signal);
			const desktop = isDesktopShell();
			const request = async (next, pending) => {
				const response = await fetch(SKIN_MANAGER_ROUTE, {
					method: "POST",
					credentials: "same-origin",
					signal: pending,
					headers: { "content-type": "application/json" },
					body: JSON.stringify(next === target && acceptRisk ? {
						target: next,
						acceptRisk: true
					} : { target: next })
				});
				const result = await response.json();
				if (!response.ok || result.ok !== true) throw new Error(result.error ?? `HTTP ${response.status}`);
			};
			if (desktop) {
				await switchDesktopSkin(catalog, target, request, async (pending) => {
					return (await fetchSkinCatalogState(pending)).runtime;
				}, document, signal);
				return;
			}
			const before = activeSkins(catalog, document.body).join(",");
			const cancel = new AbortController();
			const pending = signal === void 0 ? cancel.signal : AbortSignal.any([signal, cancel.signal]);
			const settled = waitForSkins(catalog, (active) => active.join(",") !== before, document, void 0, pending);
			try {
				await request(target, pending);
			} catch (error) {
				cancel.abort();
				throw error;
			}
			await settled;
			signal?.throwIfAborted();
			window.location.reload();
		}
		//#endregion
		//#region src/client/bundle-intro.tsx
		/** The Plugins page slot a bundle's own content registers into, keyed by package name. */
		const BUNDLE_CONFIG_SLOT = "plugins.bundle.config";
		/** The skin's catalog row as an entry source, or none when it declares no verified host. */
		function skinIntroSource(skin) {
			return skin.dshCompatibility === void 0 ? void 0 : {
				key: skin.package,
				dshCompatibility: skin.dshCompatibility
			};
		}
		/** The verified-host line, in the reader's language. */
		function BundleIntro({ intro }) {
			const copy = skinManagerCopy(useUiLang());
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: skin_manager_module_css_default.introHint,
				"data-skin-intro": intro.key,
				children: copy.compatibility(intro.dshCompatibility)
			});
		}
		/**
		* Register one entry per installed skin that declares a verified host.
		* @param slots - the plugin's slot registry.
		* @param loadCatalog - catalog reader, injected so tests can drive it without a route.
		* @returns the disposer retracting every registration made by this call.
		*/
		function installBundleIntros(slots, loadCatalog) {
			let active = true;
			const disposers = [];
			loadCatalog().then((skins) => {
				for (const skin of skins) {
					const intro = skinIntroSource(skin);
					if (!active || intro === void 0) continue;
					const disposer = slots.inject(BUNDLE_CONFIG_SLOT, () => slots.register({
						name: BUNDLE_CONFIG_SLOT,
						key: intro.key,
						inject: () => ({ intro })
					}, BundleIntro));
					if (typeof disposer === "function") disposers.push(disposer);
				}
			}, () => {});
			return () => {
				active = false;
				for (const dispose of disposers.splice(0)) dispose();
			};
		}
		//#endregion
		//#region src/client/panel-toggle.ts
		/**
		* Tap the active sidebar panel entry again to return to the conversation.
		*
		* On a narrow frame the host shows a global panel (Plugins) in place of the
		* conversation with no close control, and the session list sits in the
		* collapsed drawer, so getting back to the same conversation takes three taps.
		* The host's own `layout.selectPanel(null)` returns to the current session
		* without changing it; this module only calls it when the tapped entry was
		* already the active one. Wide frames keep the host's behaviour untouched.
		*/
		/** The host's narrow-frame breakpoint (ui-layout `SIDEBAR_AUTO_COLLAPSE`). */
		const NARROW_FRAME_WIDTH = 1024;
		/** The sidebar entry of a global panel: the button wrapping its `sidebar.panellist` glyph. */
		function panelEntry(target) {
			const button = target instanceof Element ? target.closest("button") : null;
			return button?.querySelector("[data-slot='sidebar.panellist']") ? button : null;
		}
		/**
		* @param doc - the page document.
		* @param layout - reads the host layout service at tap time; undefined leaves the tap to the host.
		* @returns the disposer removing both listeners.
		*/
		function installPanelToggle(doc, layout) {
			let reopened = null;
			const capture = (event) => {
				const entry = panelEntry(event.target);
				const narrow = (doc.defaultView?.innerWidth ?? Infinity) < NARROW_FRAME_WIDTH;
				reopened = entry !== null && narrow && entry.getAttribute("aria-current") === "page" ? entry : null;
			};
			const bubble = (event) => {
				const entry = reopened;
				reopened = null;
				if (entry === null || panelEntry(event.target) !== entry) return;
				layout()?.selectPanel(null);
			};
			doc.addEventListener("click", capture, true);
			doc.addEventListener("click", bubble);
			return () => {
				doc.removeEventListener("click", capture, true);
				doc.removeEventListener("click", bubble);
			};
		}
		//#endregion
		//#region src/client/preset-plugin-icons.ts
		/** The active skin supplies its artwork; the manager owns only the opt-in. */
		function createPresetPluginIcons(doc = document) {
			let style;
			return {
				protocol: 2,
				skinId: "dsh-skin-manager",
				title: "插件图标",
				titleEn: "Plugin icons",
				settings: [{
					key: "presetPluginIcons",
					type: "boolean",
					label: "使用皮肤预设图标",
					labelEn: "Use skin preset icons",
					defaultValue: false
				}],
				apply(state) {
					if (state?.values.presetPluginIcons !== true) {
						style?.remove();
						style = void 0;
					} else if (style === void 0) {
						style = doc.createElement("style");
						style.setAttribute("data-plugin", "@smalltailqwq/dsh-client-ui-skin-deep-whale-manager");
						style.setAttribute("data-skin-manager-preset-icons", "");
						style.textContent = ":root{--dsh-preset-plugin-native:hidden;--dsh-preset-plugin-display:block}";
						doc.head.append(style);
					}
				}
			};
		}
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots"];
		function activeSkin(catalog) {
			const active = activeSkins(catalog, document.body);
			return active.length > 1 ? null : active[0] ?? "official";
		}
		/** Register settings and the generic customization registry with owned cleanup. */
		function apply(ctx) {
			const registry = new SkinCustomizationRegistry(new PreferencesStore());
			const switching = new AbortController();
			ctx.effect(() => () => switching.abort(), "ui-skin-manager: skin switching");
			ctx.effect(() => () => {
				registry.dispose();
			}, "ui-skin-manager: customization registry");
			ctx.effect(() => registry.registerLocal(createPresetPluginIcons()), "ui-skin-manager: preset plugin icons");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-skins",
				order: 115,
				label: () => skinManagerCopy(currentUiLang()).navLabel,
				inject: () => ({
					registry,
					active: activeSkin,
					switchSkin: (target, acceptRisk) => requestSkinSwitch(target, acceptRisk, switching.signal)
				})
			}, SkinManager));
			ctx.effect(() => installBundleIntros(ctx.slots, fetchSkinCatalog), "ui-skin-manager: bundle introductions");
			ctx.effect(() => installPanelToggle(document, () => ctx.get("layout")), "ui-skin-manager: narrow panel toggle");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map