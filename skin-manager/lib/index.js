import { LEGACY_SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_EVENTS, SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SkinAttributeProjector, exposeSkinCustomization } from "./protocol.js";
import { createRequire } from "node:module";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, copyFileSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
//#region ../scripts/skin-asset-inputs.mjs
/** Extend the original fingerprint without changing skins that have no static artwork. */
function hashSkinAssets(hash, skinRoot) {
	const manifest = "assets/runtime/manifest.json";
	if (!existsSync(join(skinRoot, manifest))) return;
	const text = readFileSync(join(skinRoot, manifest), "utf8").replaceAll("\r\n", "\n");
	const files = JSON.parse(text);
	if (!Array.isArray(files) || files.some((file) => typeof file !== "string" || !/^[a-f0-9]{64}\.(webp|png)$/.test(file))) throw new Error("Invalid skin artwork manifest");
	hash.update(`${manifest}\0${Buffer.byteLength(text)}\0`).update(text);
	for (const file of [...new Set(files)].sort()) {
		const input = `assets/runtime/${file}`;
		const bytes = readFileSync(join(skinRoot, input));
		if (createHash("sha256").update(bytes).digest("hex") !== file.split(".")[0]) throw new Error(`Artwork content hash mismatch: ${file}`);
		hash.update(`${input}\0${bytes.length}\0`).update(bytes);
	}
}
//#endregion
//#region node_modules/semver/internal/lrucache.js
var require_lrucache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var LRUCache = class {
		constructor() {
			this.max = 1e3;
			this.map = /* @__PURE__ */ new Map();
		}
		get(key) {
			const value = this.map.get(key);
			if (value === void 0) return;
			else {
				this.map.delete(key);
				this.map.set(key, value);
				return value;
			}
		}
		delete(key) {
			return this.map.delete(key);
		}
		set(key, value) {
			if (!this.delete(key) && value !== void 0) {
				if (this.map.size >= this.max) {
					const firstKey = this.map.keys().next().value;
					this.delete(firstKey);
				}
				this.map.set(key, value);
			}
			return this;
		}
	};
	module.exports = LRUCache;
}));
//#endregion
//#region node_modules/semver/internal/parse-options.js
var require_parse_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({});
	const parseOptions = (options) => {
		if (!options) return emptyOpts;
		if (typeof options !== "object") return looseOption;
		return options;
	};
	module.exports = parseOptions;
}));
//#endregion
//#region node_modules/semver/internal/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		MAX_LENGTH: 256,
		MAX_SAFE_COMPONENT_LENGTH: 16,
		MAX_SAFE_BUILD_LENGTH: 250,
		MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER || 
		/* istanbul ignore next */ 9007199254740991,
		RELEASE_TYPES: [
			"major",
			"premajor",
			"minor",
			"preminor",
			"patch",
			"prepatch",
			"prerelease"
		],
		SEMVER_SPEC_VERSION: "2.0.0",
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2
	};
}));
//#endregion
//#region node_modules/semver/internal/debug.js
var require_debug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
}));
//#endregion
//#region node_modules/semver/internal/re.js
var require_re = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = require_constants();
	const debug = require_debug();
	exports = module.exports = {};
	const re = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const safeSrc = exports.safeSrc = [];
	const t = exports.t = {};
	let R = 0;
	const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
	const safeRegexReplacements = [
		["\\s", 1],
		["\\d", MAX_LENGTH],
		[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
	];
	const makeSafeRegex = (value) => {
		for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
		return value;
	};
	const createToken = (name, value, isGlobal) => {
		const safe = makeSafeRegex(value);
		const index = R++;
		debug(name, index, value);
		t[name] = index;
		src[index] = value;
		safeSrc[index] = safe;
		re[index] = new RegExp(value, isGlobal ? "g" : void 0);
		safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
	};
	createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
	createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
	createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
	createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
	createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
	createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
	createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
	createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
	createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
	createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
	createToken("FULL", `^${src[t.FULLPLAIN]}$`);
	createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
	createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
	createToken("GTLT", "((?:<|>)?=?)");
	createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
	createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
	createToken("COERCERTL", src[t.COERCE], true);
	createToken("COERCERTLFULL", src[t.COERCEFULL], true);
	createToken("LONETILDE", "(?:~>?)");
	createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = "$1~";
	createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("LONECARET", "(?:\\^)");
	createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = "$1^";
	createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
	createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = "$1$2$3";
	createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
	createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
	createToken("STAR", "(<|>)?=?\\s*\\*");
	createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
	createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
}));
//#endregion
//#region node_modules/semver/internal/identifiers.js
var require_identifiers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const numeric = /^[0-9]+$/;
	const compareIdentifiers = (a, b) => {
		if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
		const anum = numeric.test(a);
		const bnum = numeric.test(b);
		if (anum && bnum) {
			a = +a;
			b = +b;
		}
		return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
	};
	const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
	module.exports = {
		compareIdentifiers,
		rcompareIdentifiers
	};
}));
//#endregion
//#region node_modules/semver/classes/semver.js
var require_semver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const debug = require_debug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
	const { safeRe: re, t } = require_re();
	const parseOptions = require_parse_options();
	const { compareIdentifiers } = require_identifiers();
	const isPrereleaseIdentifier = (prerelease, identifier) => {
		const identifiers = identifier.split(".");
		if (identifiers.length > prerelease.length) return false;
		for (let i = 0; i < identifiers.length; i++) if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) return false;
		return true;
	};
	module.exports = class SemVer {
		constructor(version, options) {
			options = parseOptions(options);
			if (version instanceof SemVer) {
				if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
				else version = version.version;
			} else if (typeof version !== "string") throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
			if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
			debug("SemVer", version, options);
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
			if (!m) throw new TypeError(`Invalid Version: ${version}`);
			this.raw = version;
			this.major = +m[1];
			this.minor = +m[2];
			this.patch = +m[3];
			if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
			if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
			if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
			if (!m[4]) this.prerelease = [];
			else this.prerelease = m[4].split(".").map((id) => {
				if (/^[0-9]+$/.test(id)) {
					const num = +id;
					if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
				}
				return id;
			});
			this.build = m[5] ? m[5].split(".") : [];
			this.format();
		}
		format() {
			this.version = `${this.major}.${this.minor}.${this.patch}`;
			if (this.prerelease.length) this.version += `-${this.prerelease.join(".")}`;
			return this.version;
		}
		toString() {
			return this.version;
		}
		compare(other) {
			debug("SemVer.compare", this.version, this.options, other);
			if (!(other instanceof SemVer)) {
				if (typeof other === "string" && other === this.version) return 0;
				other = new SemVer(other, this.options);
			}
			if (other.version === this.version) return 0;
			return this.compareMain(other) || this.comparePre(other);
		}
		compareMain(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.major < other.major) return -1;
			if (this.major > other.major) return 1;
			if (this.minor < other.minor) return -1;
			if (this.minor > other.minor) return 1;
			if (this.patch < other.patch) return -1;
			if (this.patch > other.patch) return 1;
			return 0;
		}
		comparePre(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.prerelease.length && !other.prerelease.length) return -1;
			else if (!this.prerelease.length && other.prerelease.length) return 1;
			else if (!this.prerelease.length && !other.prerelease.length) return 0;
			let i = 0;
			do {
				const a = this.prerelease[i];
				const b = other.prerelease[i];
				debug("prerelease compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		compareBuild(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			let i = 0;
			do {
				const a = this.build[i];
				const b = other.build[i];
				debug("build compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		inc(release, identifier, identifierBase) {
			if (release.startsWith("pre")) {
				if (!identifier && identifierBase === false) throw new Error("invalid increment argument: identifier is empty");
				if (identifier) {
					const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
					if (!match || match[1] !== identifier) throw new Error(`invalid identifier: ${identifier}`);
				}
			}
			switch (release) {
				case "premajor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor = 0;
					this.major++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "preminor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "prepatch":
					this.prerelease.length = 0;
					this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "prerelease":
					if (this.prerelease.length === 0) this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "release":
					if (this.prerelease.length === 0) throw new Error(`version ${this.raw} is not a prerelease`);
					this.prerelease.length = 0;
					break;
				case "major":
					if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
					this.minor = 0;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "minor":
					if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "patch":
					if (this.prerelease.length === 0) this.patch++;
					this.prerelease = [];
					break;
				case "pre": {
					const base = Number(identifierBase) ? 1 : 0;
					if (this.prerelease.length === 0) this.prerelease = [base];
					else {
						let i = this.prerelease.length;
						while (--i >= 0) if (typeof this.prerelease[i] === "number") {
							this.prerelease[i]++;
							i = -2;
						}
						if (i === -1) {
							if (identifier === this.prerelease.join(".") && identifierBase === false) throw new Error("invalid increment argument: identifier already exists");
							this.prerelease.push(base);
						}
					}
					if (identifier) {
						let prerelease = [identifier, base];
						if (identifierBase === false) prerelease = [identifier];
						if (isPrereleaseIdentifier(this.prerelease, identifier)) {
							const prereleaseBase = this.prerelease[identifier.split(".").length];
							if (isNaN(prereleaseBase)) this.prerelease = prerelease;
						} else this.prerelease = prerelease;
					}
					break;
				}
				default: throw new Error(`invalid increment argument: ${release}`);
			}
			this.raw = this.format();
			if (this.build.length) this.raw += `+${this.build.join(".")}`;
			return this;
		}
	};
}));
//#endregion
//#region node_modules/semver/functions/compare.js
var require_compare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const SemVer = require_semver();
	const compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
	module.exports = compare;
}));
//#endregion
//#region node_modules/semver/functions/eq.js
var require_eq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const eq = (a, b, loose) => compare(a, b, loose) === 0;
	module.exports = eq;
}));
//#endregion
//#region node_modules/semver/functions/neq.js
var require_neq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const neq = (a, b, loose) => compare(a, b, loose) !== 0;
	module.exports = neq;
}));
//#endregion
//#region node_modules/semver/functions/gt.js
var require_gt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const gt = (a, b, loose) => compare(a, b, loose) > 0;
	module.exports = gt;
}));
//#endregion
//#region node_modules/semver/functions/gte.js
var require_gte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const gte = (a, b, loose) => compare(a, b, loose) >= 0;
	module.exports = gte;
}));
//#endregion
//#region node_modules/semver/functions/lt.js
var require_lt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const lt = (a, b, loose) => compare(a, b, loose) < 0;
	module.exports = lt;
}));
//#endregion
//#region node_modules/semver/functions/lte.js
var require_lte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const compare = require_compare();
	const lte = (a, b, loose) => compare(a, b, loose) <= 0;
	module.exports = lte;
}));
//#endregion
//#region node_modules/semver/functions/cmp.js
var require_cmp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const eq = require_eq();
	const neq = require_neq();
	const gt = require_gt();
	const gte = require_gte();
	const lt = require_lt();
	const lte = require_lte();
	const cmp = (a, op, b, loose) => {
		switch (op) {
			case "===":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a === b;
			case "!==":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a !== b;
			case "":
			case "=":
			case "==": return eq(a, b, loose);
			case "!=": return neq(a, b, loose);
			case ">": return gt(a, b, loose);
			case ">=": return gte(a, b, loose);
			case "<": return lt(a, b, loose);
			case "<=": return lte(a, b, loose);
			default: throw new TypeError(`Invalid operator: ${op}`);
		}
	};
	module.exports = cmp;
}));
//#endregion
//#region node_modules/semver/classes/comparator.js
var require_comparator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const ANY = Symbol("SemVer ANY");
	module.exports = class Comparator {
		static get ANY() {
			return ANY;
		}
		constructor(comp, options) {
			options = parseOptions(options);
			if (comp instanceof Comparator) {
				if (comp.loose === !!options.loose) return comp;
				else comp = comp.value;
			}
			comp = comp.trim().split(/\s+/).join(" ");
			debug("comparator", comp, options);
			this.options = options;
			this.loose = !!options.loose;
			this.parse(comp);
			if (this.semver === ANY) this.value = "";
			else this.value = this.operator + this.semver.version;
			debug("comp", this);
		}
		parse(comp) {
			const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
			const m = comp.match(r);
			if (!m) throw new TypeError(`Invalid comparator: ${comp}`);
			this.operator = m[1] !== void 0 ? m[1] : "";
			if (this.operator === "=") this.operator = "";
			if (!m[2]) this.semver = ANY;
			else this.semver = new SemVer(m[2], this.options.loose);
		}
		toString() {
			return this.value;
		}
		test(version) {
			debug("Comparator.test", version, this.options.loose);
			if (this.semver === ANY || version === ANY) return true;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			return cmp(version, this.operator, this.semver, this.options);
		}
		intersects(comp, options) {
			if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
			if (this.operator === "") {
				if (this.value === "") return true;
				return new Range(comp.value, options).test(this.value);
			} else if (comp.operator === "") {
				if (comp.value === "") return true;
				return new Range(this.value, options).test(comp.semver);
			}
			options = parseOptions(options);
			if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) return false;
			if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) return false;
			if (this.operator.startsWith(">") && comp.operator.startsWith(">")) return true;
			if (this.operator.startsWith("<") && comp.operator.startsWith("<")) return true;
			if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) return true;
			if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) return true;
			if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) return true;
			return false;
		}
	};
	const parseOptions = require_parse_options();
	const { safeRe: re, t } = require_re();
	const cmp = require_cmp();
	const debug = require_debug();
	const SemVer = require_semver();
	const Range = require_range();
}));
//#endregion
//#region node_modules/semver/classes/range.js
var require_range = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const SPACE_CHARACTERS = /\s+/g;
	module.exports = class Range {
		constructor(range, options) {
			options = parseOptions(options);
			if (range instanceof Range) {
				if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) return range;
				else return new Range(range.raw, options);
			}
			if (range instanceof Comparator) {
				this.raw = range.value;
				this.set = [[range]];
				this.formatted = void 0;
				return this;
			}
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
			this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
			if (!this.set.length) throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
			if (this.set.length > 1) {
				const first = this.set[0];
				this.set = this.set.filter((c) => !isNullSet(c[0]));
				if (this.set.length === 0) this.set = [first];
				else if (this.set.length > 1) {
					for (const c of this.set) if (c.length === 1 && isAny(c[0])) {
						this.set = [c];
						break;
					}
				}
			}
			this.formatted = void 0;
		}
		get range() {
			if (this.formatted === void 0) {
				this.formatted = "";
				for (let i = 0; i < this.set.length; i++) {
					if (i > 0) this.formatted += "||";
					const comps = this.set[i];
					for (let k = 0; k < comps.length; k++) {
						if (k > 0) this.formatted += " ";
						this.formatted += comps[k].toString().trim();
					}
				}
			}
			return this.formatted;
		}
		format() {
			return this.range;
		}
		toString() {
			return this.range;
		}
		parseRange(range) {
			range = range.replace(BUILDSTRIPRE, "");
			const memoKey = ((this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE)) + ":" + range;
			const cached = cache.get(memoKey);
			if (cached) return cached;
			const loose = this.options.loose;
			const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
			range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
			debug("hyphen replace", range);
			range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
			debug("comparator trim", range);
			range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
			debug("tilde trim", range);
			range = range.replace(re[t.CARETTRIM], caretTrimReplace);
			debug("caret trim", range);
			let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
			if (loose) rangeList = rangeList.filter((comp) => {
				debug("loose invalid filter", comp, this.options);
				return !!comp.match(re[t.COMPARATORLOOSE]);
			});
			debug("range list", rangeList);
			const rangeMap = /* @__PURE__ */ new Map();
			const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
			for (const comp of comparators) {
				if (isNullSet(comp)) return [comp];
				rangeMap.set(comp.value, comp);
			}
			if (rangeMap.size > 1 && rangeMap.has("")) rangeMap.delete("");
			const result = [...rangeMap.values()];
			cache.set(memoKey, result);
			return result;
		}
		intersects(range, options) {
			if (!(range instanceof Range)) throw new TypeError("a Range is required");
			return this.set.some((thisComparators) => {
				return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
					return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
						return rangeComparators.every((rangeComparator) => {
							return thisComparator.intersects(rangeComparator, options);
						});
					});
				});
			});
		}
		test(version) {
			if (!version) return false;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			for (let i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
			return false;
		}
	};
	const cache = new (require_lrucache())();
	const parseOptions = require_parse_options();
	const Comparator = require_comparator();
	const debug = require_debug();
	const SemVer = require_semver();
	const { safeRe: re, src, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = require_re();
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
	const BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
	const isNullSet = (c) => c.value === "<0.0.0-0";
	const isAny = (c) => c.value === "";
	const isSatisfiable = (comparators, options) => {
		let result = true;
		const remainingComparators = comparators.slice();
		let testComparator = remainingComparators.pop();
		while (result && remainingComparators.length) {
			result = remainingComparators.every((otherComparator) => {
				return testComparator.intersects(otherComparator, options);
			});
			testComparator = remainingComparators.pop();
		}
		return result;
	};
	const parseComparator = (comp, options) => {
		comp = comp.replace(re[t.BUILD], "");
		debug("comp", comp, options);
		comp = replaceCarets(comp, options);
		debug("caret", comp);
		comp = replaceTildes(comp, options);
		debug("tildes", comp);
		comp = replaceXRanges(comp, options);
		debug("xrange", comp);
		comp = replaceStars(comp, options);
		debug("stars", comp);
		return comp;
	};
	const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
	const invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
	const replaceTildes = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
	};
	const replaceTilde = (comp, options) => {
		const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
		const z = options.includePrerelease ? "-0" : "";
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("tilde", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
			else if (isX(p)) ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
			else if (pr) {
				debug("replaceTilde pr", pr);
				ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
			} else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
			debug("tilde return", ret);
			return ret;
		});
	};
	const replaceCarets = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
	};
	const replaceCaret = (comp, options) => {
		debug("caret", comp, options);
		const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
		const z = options.includePrerelease ? "-0" : "";
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("caret", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
			else if (isX(p)) {
				if (M === "0") ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
				else ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
			} else if (pr) {
				debug("replaceCaret pr", pr);
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
			} else {
				debug("no pr");
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
			}
			debug("caret return", ret);
			return ret;
		});
	};
	const replaceXRanges = (comp, options) => {
		debug("replaceXRanges", comp, options);
		return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
	};
	const replaceXRange = (comp, options) => {
		comp = comp.trim();
		const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
		return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
			debug("xRange", comp, ret, gtlt, M, m, p, pr);
			if (invalidXRangeOrder(M, m, p)) return comp;
			const xM = isX(M);
			const xm = xM || isX(m);
			const xp = xm || isX(p);
			const anyX = xp;
			if (gtlt === "=" && anyX) gtlt = "";
			pr = options.includePrerelease ? "-0" : "";
			if (xM) {
				if (gtlt === ">" || gtlt === "<") ret = "<0.0.0-0";
				else ret = "*";
			} else if (gtlt && anyX) {
				if (xm) m = 0;
				p = 0;
				if (gtlt === ">") {
					gtlt = ">=";
					if (xm) {
						M = +M + 1;
						m = 0;
						p = 0;
					} else {
						m = +m + 1;
						p = 0;
					}
				} else if (gtlt === "<=") {
					gtlt = "<";
					if (xm) M = +M + 1;
					else m = +m + 1;
				}
				if (gtlt === "<") pr = "-0";
				ret = `${gtlt + M}.${m}.${p}${pr}`;
			} else if (xm) ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
			else if (xp) ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
			debug("xRange return", ret);
			return ret;
		});
	};
	const replaceStars = (comp, options) => {
		debug("replaceStars", comp, options);
		return comp.trim().replace(re[t.STAR], "");
	};
	const replaceGTE0 = (comp, options) => {
		debug("replaceGTE0", comp, options);
		return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
	};
	const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
		if (isX(fM)) from = "";
		else if (isX(fm)) from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
		else if (isX(fp)) from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
		else if (fpr) from = `>=${from}`;
		else from = `>=${from}${incPr ? "-0" : ""}`;
		if (isX(tM)) to = "";
		else if (isX(tm)) to = `<${+tM + 1}.0.0-0`;
		else if (isX(tp)) to = `<${tM}.${+tm + 1}.0-0`;
		else if (tpr) to = `<=${tM}.${tm}.${tp}-${tpr}`;
		else if (incPr) to = `<${tM}.${tm}.${+tp + 1}-0`;
		else to = `<=${to}`;
		return `${from} ${to}`.trim();
	};
	const testSet = (set, version, options) => {
		for (let i = 0; i < set.length; i++) if (!set[i].test(version)) return false;
		if (version.prerelease.length && !options.includePrerelease) {
			for (let i = 0; i < set.length; i++) {
				debug(set[i].semver);
				if (set[i].semver === Comparator.ANY) continue;
				if (set[i].semver.prerelease.length > 0) {
					const allowed = set[i].semver;
					if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
				}
			}
			return false;
		}
		return true;
	};
}));
//#endregion
//#region node_modules/semver/functions/satisfies.js
var require_satisfies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Range = require_range();
	const satisfies = (version, range, options) => {
		try {
			range = new Range(range, options);
		} catch (er) {
			return false;
		}
		return range.test(version);
	};
	module.exports = satisfies;
}));
//#endregion
//#region node_modules/semver/functions/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const SemVer = require_semver();
	const parse = (version, options, throwErrors = false) => {
		if (version instanceof SemVer) return version;
		try {
			return new SemVer(version, options);
		} catch (er) {
			if (!throwErrors) return null;
			throw er;
		}
	};
	module.exports = parse;
}));
//#endregion
//#region node_modules/semver/functions/valid.js
var require_valid = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const parse = require_parse();
	const valid = (version, options) => {
		const v = parse(version, options);
		return v ? v.version : null;
	};
	module.exports = valid;
}));
//#endregion
//#region src/compatibility.ts
/**
* Mirror of DSH 0.1.7's plugin admission for installed skins.
*
* The host denies a row whose `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` peer
* ranges exclude the running version, unless the profile's
* `compatibility.json` holds an exact `package@version → [runtime]` grant. The
* denial lives only in the composed tree: the patch still says "enabled", so
* without this mirror the manager would show a skin it cannot start as
* switchable and a click would silently do nothing. Grants are never written
* here; they go through the host's own `pluginManager.setVersionExemption`.
*/
var import_satisfies = /* @__PURE__ */ __toESM(require_satisfies(), 1);
var import_valid = /* @__PURE__ */ __toESM(require_valid(), 1);
/** The host's own profile-local grant file. */
const PROFILE_COMPATIBILITY_FILENAME = "compatibility.json";
let cachedRuntime;
/**
* The running DSH version, read from the launcher's own `dsh-app-boot`
* manifest, which is what the host compares against. Resolved from the
* process entry, so it holds for npm and linked installations; hosts laid out
* differently (for example a packaged desktop runtime) yield undefined, and
* callers then make no compatibility claim.
*/
function readDshRuntimeVersion(entry = process.argv[1]) {
	if (cachedRuntime !== void 0 && cachedRuntime.entry === entry) return cachedRuntime.version;
	let version;
	try {
		if (entry !== void 0 && entry !== "") {
			const manifest = createRequire(entry).resolve("@deepseek-ai/dsh-app-boot/package.json");
			const value = JSON.parse(readFileSync(manifest, "utf8")).version;
			if (typeof value === "string" && (0, import_valid.default)(value) !== null) version = value;
		}
	} catch {}
	cachedRuntime = {
		entry,
		version
	};
	return version;
}
/** Accepted exact grants of one profile; an unreadable file grants nothing, as in the host. */
function readProfileExemptions(profileDir) {
	try {
		const value = JSON.parse(readFileSync(join(profileDir, PROFILE_COMPATIBILITY_FILENAME), "utf8"));
		if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
		const out = {};
		for (const [key, versions] of Object.entries(value)) if (Array.isArray(versions) && versions.every((version) => typeof version === "string")) out[key] = versions;
		return out;
	} catch {
		return {};
	}
}
/**
* Judge one skin package the way the host does.
* @param manifest - the skin's parsed package.json.
* @param runtimeVersion - the running DSH version.
* @param exemptions - the profile's exact grants.
* @returns the unsatisfied dsh peers, or undefined when the host admits the package unconditionally.
*/
function evaluateSkinCompatibility(manifest, runtimeVersion, exemptions) {
	if (manifest === null || typeof manifest !== "object") return void 0;
	const { name, version, peerDependencies } = manifest;
	if (peerDependencies === null || typeof peerDependencies !== "object" || Array.isArray(peerDependencies)) return void 0;
	const peers = {};
	for (const [peer, range] of Object.entries(peerDependencies)) {
		if (peer !== "@deepseek-ai/dsh" && !peer.startsWith("@deepseek-ai/dsh-")) continue;
		if (typeof range !== "string") {
			peers[peer] = String(range);
			continue;
		}
		const requirement = [
			"workspace:^",
			"workspace:~",
			"workspace:*"
		].includes(range) ? runtimeVersion : range;
		if (requirement.trim() === "" || !(0, import_satisfies.default)(runtimeVersion, requirement, { includePrerelease: true })) peers[peer] = range;
	}
	if (Object.keys(peers).length === 0 || typeof name !== "string" || typeof version !== "string") return void 0;
	const key = `${name}@${version}`;
	return {
		package: key,
		runtimeVersion,
		peers,
		exempted: exemptions[key]?.includes(runtimeVersion) === true
	};
}
//#endregion
//#region src/desktop-icon.ts
/**
* Opt-in desktop icon sync for the Windows DSH desktop shell.
*
* Plugins run inside the desktop host's Node child, which cannot reach the
* Electron main process, so the window icon itself is out of reach. Windows
* resolves the running taskbar button, the Start menu entry and the desktop
* icon through the shortcuts that launch `DeepSeek Harness.exe`, so the sync
* points those shortcuts' IconLocation at the active skin's ICO and puts back
* exactly what it replaced when the user turns it off or returns to the
* official look.
*
* Only shortcuts whose target is the running executable are touched, the
* previous IconLocation of each one is recorded before the first write, and a
* restore only reverts a shortcut that still shows an icon this module wrote.
* The ICO is copied out of the skin package first, so uninstalling a skin never
* leaves a shortcut pointing at a missing file.
*
* The taskbar thumbnail and Alt+Tab read the window's own icon instead, which
* only a live process can hold: {@link WindowIconHolder} keeps one hidden
* PowerShell helper that sets it and puts the previous icon back on stop.
*/
/** Largest ICO accepted from a skin manifest; real multi-size icons stay well below it. */
const MAX_ICON_BYTES = 2097152;
const POWERSHELL_TIMEOUT_MS = 2e4;
/** The Windows desktop host runs plugins in `DeepSeek Harness.exe` with ELECTRON_RUN_AS_NODE. */
function detectDesktopShell(platform = process.platform, env = process.env, execPath = process.execPath) {
	if (platform !== "win32" || env.ELECTRON_RUN_AS_NODE !== "1") return null;
	if (!/\.exe$/i.test(execPath) || /^node\.exe$/i.test(basename(execPath))) return null;
	return { execPath };
}
const emptyState = () => ({
	version: 1,
	enabled: false,
	shortcuts: {}
});
const pathKey = (path) => resolve(path).replaceAll("/", "\\").toLowerCase();
/** IconLocation path without its `,index` suffix. */
function iconFile(icon) {
	const match = icon.match(/^(.*),-?\d+$/);
	return (match === null ? icon : match[1]).trim().replace(/^"|"$/g, "");
}
/** Whether an IconLocation points into the managed icon directory. */
function isManagedIcon(icon, managedDir) {
	const file = iconFile(icon);
	if (file === "" || !isAbsolute(file)) return false;
	const rel = relative(pathKey(managedDir), pathKey(file));
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
/**
* Decide which shortcuts to rewrite for one desired IconLocation (`null`
* restores). Pure: the caller commits a record only after its write succeeded.
*/
function planDesktopIcon(state, shortcuts, desired, managedDir) {
	const changes = [];
	const records = {};
	const byKey = new Map(Object.entries(state.shortcuts).map(([path, record]) => [pathKey(path), record]));
	const seen = /* @__PURE__ */ new Set();
	for (const shortcut of shortcuts) {
		const key = pathKey(shortcut.path);
		seen.add(key);
		const record = byKey.get(key);
		const ours = record !== void 0 && shortcut.icon === record.applied || isManagedIcon(shortcut.icon, managedDir);
		const original = ours ? record?.original ?? `${shortcut.target},0` : shortcut.icon;
		if (desired === null) {
			if (ours) changes.push({
				path: shortcut.path,
				icon: original
			});
			if (record !== void 0 || ours) records[shortcut.path] = null;
			continue;
		}
		if (shortcut.icon !== desired) changes.push({
			path: shortcut.path,
			icon: desired
		});
		records[shortcut.path] = {
			original,
			applied: desired
		};
	}
	for (const path of Object.keys(state.shortcuts)) if (!seen.has(pathKey(path))) records[path] = null;
	return {
		changes,
		records
	};
}
/** Validate a skin manifest's `desktopIcon` and resolve it inside the package directory. */
function resolveSkinDesktopIcon(skinDir, declared) {
	if (typeof declared !== "string" || !/\.ico$/i.test(declared) || isAbsolute(declared)) return null;
	const file = resolve(skinDir, declared);
	const rel = relative(resolve(skinDir), file);
	if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
	try {
		const stat = statSync(file);
		return stat.isFile() && stat.size > 0 && stat.size <= MAX_ICON_BYTES ? file : null;
	} catch {
		return null;
	}
}
/** Keeps the shortcut state for one DSH home and serializes every pass. */
var DesktopIconSync = class {
	statePath;
	managedDir;
	shell;
	io;
	onIcon;
	queue = Promise.resolve();
	/** @param onIcon - receives the managed ICO after every pass, or null when the official icon applies. */
	constructor(home, shell, io = powershellShortcutIo, onIcon = () => {}) {
		this.shell = shell;
		this.io = io;
		this.onIcon = onIcon;
		this.statePath = join(home, "skin-manager", "desktop-icon.json");
		this.managedDir = join(home, "skin-manager", "desktop-icons");
	}
	get enabled() {
		return this.read().enabled;
	}
	/** Persist the switch, then apply (`source` set) or restore. */
	setEnabled(enabled, source) {
		return this.serial(async () => {
			this.write({
				...this.read(),
				enabled
			});
			return this.pass(enabled ? source : null);
		});
	}
	/** Bring the shortcuts in line with the active skin; a no-op until the user opts in, except for leftovers. */
	reconcile(source) {
		return this.serial(() => this.pass(this.read().enabled ? source : null));
	}
	serial(task) {
		const run = this.queue.then(task, task);
		this.queue = run.catch(() => void 0);
		return run;
	}
	async pass(source) {
		const state = this.read();
		const file = source === null ? null : this.install(source);
		this.onIcon(file);
		if (file === null && Object.keys(state.shortcuts).length === 0) return {
			enabled: state.enabled,
			updated: 0,
			failed: 0
		};
		const desired = file === null ? null : `${file},0`;
		const plan = planDesktopIcon(state, await this.io.scan(this.shell.execPath), desired, this.managedDir);
		const results = plan.changes.length === 0 ? [] : await this.io.write(plan.changes);
		const failed = new Set(results.filter((result) => !result.ok).map((result) => pathKey(result.path)));
		const next = {
			...state,
			shortcuts: { ...state.shortcuts }
		};
		for (const [path, record] of Object.entries(plan.records)) {
			if (failed.has(pathKey(path))) continue;
			if (record === null) delete next.shortcuts[path];
			else next.shortcuts[path] = record;
		}
		this.write(next);
		this.prune(desired, next);
		return {
			enabled: state.enabled,
			updated: results.length - failed.size,
			failed: failed.size
		};
	}
	/** Copy the ICO under a content-addressed name so the shortcut never points into a package. */
	install(source) {
		const bytes = readFileSync(source.file);
		const safeId = source.skinId.replace(/[^a-z0-9._-]/gi, "_");
		const target = join(this.managedDir, `${safeId}-${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.ico`);
		if (!existsSync(target)) {
			mkdirSync(this.managedDir, { recursive: true });
			const temporary = `${target}.${process.pid}.tmp`;
			copyFileSync(source.file, temporary);
			renameSync(temporary, target);
		}
		return target;
	}
	/** Remove managed ICOs no shortcut record still refers to. */
	prune(desired, state) {
		const keep = new Set(Object.values(state.shortcuts).map((record) => pathKey(iconFile(record.applied))));
		if (desired !== null) keep.add(pathKey(iconFile(desired)));
		let files;
		try {
			files = readdirSync(this.managedDir);
		} catch {
			return;
		}
		for (const file of files) {
			const full = join(this.managedDir, file);
			if (/\.ico$/i.test(file) && !keep.has(pathKey(full))) rmSync(full, { force: true });
		}
	}
	read() {
		try {
			const raw = JSON.parse(readFileSync(this.statePath, "utf8"));
			const shortcuts = {};
			for (const [path, record] of Object.entries(raw.shortcuts ?? {})) if (typeof record?.original === "string" && typeof record.applied === "string") shortcuts[path] = {
				original: record.original,
				applied: record.applied
			};
			return {
				version: 1,
				enabled: raw.enabled === true,
				shortcuts
			};
		} catch {
			return emptyState();
		}
	}
	write(state) {
		mkdirSync(dirname(this.statePath), { recursive: true });
		const temporary = `${this.statePath}.${process.pid}.tmp`;
		writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
		renameSync(temporary, this.statePath);
	}
};
const SCAN_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$exe = [IO.Path]::GetFullPath($env:DSH_SKIN_ICON_EXE)
$roots = @(
  @{ path = [Environment]::GetFolderPath('Desktop'); deep = $false },
  @{ path = [Environment]::GetFolderPath('CommonDesktopDirectory'); deep = $false },
  @{ path = [Environment]::GetFolderPath('Programs'); deep = $true },
  @{ path = [Environment]::GetFolderPath('CommonPrograms'); deep = $true },
  @{ path = (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'); deep = $false }
)
# Put back any Start menu shortcut an interrupted refresh left renamed.
foreach ($root in $roots) {
  if (-not $root.deep -or -not $root.path -or -not (Test-Path -LiteralPath $root.path)) { continue }
  foreach ($parked in @(Get-ChildItem -LiteralPath $root.path -Filter '*.lnk.dsh-refresh' -File -Recurse -ErrorAction SilentlyContinue)) {
    $restored = $parked.FullName.Substring(0, $parked.FullName.Length - '.dsh-refresh'.Length)
    try {
      if (Test-Path -LiteralPath $restored) { Remove-Item -LiteralPath $parked.FullName -Force }
      else { Move-Item -LiteralPath $parked.FullName -Destination $restored }
    } catch {}
  }
}
$shell = New-Object -ComObject WScript.Shell
$found = @()
foreach ($root in $roots) {
  if (-not $root.path -or -not (Test-Path -LiteralPath $root.path)) { continue }
  foreach ($file in @(Get-ChildItem -LiteralPath $root.path -Filter *.lnk -File -Recurse:$root.deep -ErrorAction SilentlyContinue)) {
    try {
      $link = $shell.CreateShortcut($file.FullName)
      if ($link.TargetPath -and [string]::Equals([IO.Path]::GetFullPath($link.TargetPath), $exe, [StringComparison]::OrdinalIgnoreCase)) {
        $found += [pscustomobject]@{ path = $file.FullName; target = $link.TargetPath; icon = $link.IconLocation }
      }
    } catch {}
  }
}
ConvertTo-Json -InputObject @($found) -Compress
`;
const WRITE_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$changes = ConvertFrom-Json -InputObject $env:DSH_SKIN_ICON_CHANGES
$shell = New-Object -ComObject WScript.Shell
$results = @()
foreach ($change in $changes) {
  try {
    if (-not (Test-Path -LiteralPath $change.path)) { throw 'shortcut-missing' }
    $link = $shell.CreateShortcut($change.path)
    $link.IconLocation = $change.icon
    $link.Save()
    $results += [pscustomobject]@{ path = $change.path; ok = $true }
  } catch {
    $results += [pscustomobject]@{ path = $change.path; ok = $false; error = [string]$_.Exception.Message }
  }
}
# Start keeps its own app icon cache and only re-reads a shortcut it sees
# leave and return, so each rewritten Start menu shortcut is parked briefly
# under a non-.lnk name. The scan above recovers one an interruption strands.
$programs = @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('CommonPrograms')) | Where-Object { $_ } | ForEach-Object { $_.TrimEnd('\') + '\' }
$parked = @()
foreach ($result in $results) {
  if (-not $result.ok) { continue }
  foreach ($prefix in $programs) {
    if ($result.path.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
      try {
        Move-Item -LiteralPath $result.path -Destination ($result.path + '.dsh-refresh')
        $parked += $result.path
      } catch {}
      break
    }
  }
}
if ($parked.Count -gt 0) {
  Start-Sleep -Seconds 3
  foreach ($path in $parked) { try { Move-Item -LiteralPath ($path + '.dsh-refresh') -Destination $path } catch {} }
}
try {
  Add-Type -Namespace DshSkin -Name Shell -MemberDefinition '[DllImport("shell32.dll", CharSet = CharSet.Unicode)] public static extern void SHChangeNotify(int eventId, uint flags, string item1, System.IntPtr item2);'
  foreach ($result in $results) { if ($result.ok) { [DshSkin.Shell]::SHChangeNotify(0x2000, 0x0005, $result.path, [IntPtr]::Zero) } }
  [DshSkin.Shell]::SHChangeNotify(0x08000000, 0, $null, [IntPtr]::Zero)
} catch {}
ConvertTo-Json -InputObject @($results) -Compress
`;
function runPowerShell(script, env) {
	return new Promise((resolve, reject) => {
		execFile("powershell.exe", [
			"-NoLogo",
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-EncodedCommand",
			Buffer.from(script, "utf16le").toString("base64")
		], {
			env: {
				...process.env,
				...env
			},
			timeout: POWERSHELL_TIMEOUT_MS,
			windowsHide: true,
			maxBuffer: 4194304,
			encoding: "utf8"
		}, (error, stdout, stderr) => {
			if (error !== null) {
				reject(/* @__PURE__ */ new Error(`desktop-icon-powershell: ${stderr.trim() || error.message}`));
				return;
			}
			try {
				const text = stdout.replace(/^﻿/, "").trim();
				resolve(text === "" ? [] : JSON.parse(text));
			} catch {
				reject(/* @__PURE__ */ new Error("desktop-icon-powershell: invalid output"));
			}
		});
	});
}
const powershellShortcutIo = {
	async scan(execPath) {
		const rows = await runPowerShell(SCAN_SCRIPT, { DSH_SKIN_ICON_EXE: execPath });
		if (!Array.isArray(rows)) return [];
		return rows.filter((row) => typeof row?.path === "string" && typeof row.target === "string" && typeof row.icon === "string");
	},
	async write(changes) {
		const rows = await runPowerShell(WRITE_SCRIPT, { DSH_SKIN_ICON_CHANGES: JSON.stringify(changes) });
		if (!Array.isArray(rows)) return changes.map((change) => ({
			path: change.path,
			ok: false,
			error: "invalid-output"
		}));
		return rows.map((row) => ({
			path: String(row?.path),
			ok: row?.ok === true,
			...typeof row?.error === "string" ? { error: row.error } : {}
		}));
	}
};
const WINDOW_ICON_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace DshSkin -Name Window -MemberDefinition @'
public delegate bool EnumProc(System.IntPtr hwnd, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr hwnd, out uint pid);
[DllImport("user32.dll")] public static extern System.IntPtr GetWindow(System.IntPtr hwnd, uint cmd);
[DllImport("user32.dll")] public static extern bool IsWindow(System.IntPtr hwnd);
[DllImport("user32.dll")] public static extern System.IntPtr SendMessage(System.IntPtr hwnd, uint msg, System.IntPtr wParam, System.IntPtr lParam);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
'@
[void][DshSkin.Window]::SetProcessDPIAware()
$target = [int]$env:DSH_SKIN_ICON_PID
$big = New-Object System.Drawing.Icon($env:DSH_SKIN_ICON_FILE, [DshSkin.Window]::GetSystemMetrics(11), [DshSkin.Window]::GetSystemMetrics(12))
$small = New-Object System.Drawing.Icon($env:DSH_SKIN_ICON_FILE, [DshSkin.Window]::GetSystemMetrics(49), [DshSkin.Window]::GetSystemMetrics(50))
$replaced = @{}
# Console.In.ReadLineAsync is synchronous on Windows PowerShell 5.1; the raw
# stream's ReadAsync completes on the thread pool with a line or at EOF.
$command = [Console]::OpenStandardInput().ReadAsync((New-Object byte[] 16), 0, 16)
function Set-OwnedIcons {
  $windows = New-Object System.Collections.Generic.List[System.IntPtr]
  $callback = [DshSkin.Window+EnumProc]{
    param($hwnd, $lParam)
    $owner = [uint32]0
    [void][DshSkin.Window]::GetWindowThreadProcessId($hwnd, [ref]$owner)
    if ($owner -eq $target -and [DshSkin.Window]::GetWindow($hwnd, 4) -eq [IntPtr]::Zero) { $windows.Add($hwnd) }
    return $true
  }
  [void][DshSkin.Window]::EnumWindows($callback, [IntPtr]::Zero)
  foreach ($hwnd in $windows) {
    if ($replaced.ContainsKey($hwnd)) { continue }
    $previousSmall = [DshSkin.Window]::SendMessage($hwnd, 0x80, [IntPtr]0, $small.Handle)
    $previousBig = [DshSkin.Window]::SendMessage($hwnd, 0x80, [IntPtr]1, $big.Handle)
    $replaced[$hwnd] = @($previousSmall, $previousBig)
  }
}
try {
  while ($true) {
    if ($null -eq (Get-Process -Id $target -ErrorAction SilentlyContinue)) { exit 0 }
    Set-OwnedIcons
    if ($command.Wait(2000)) { break }
  }
} finally {
  foreach ($entry in $replaced.GetEnumerator()) {
    if ([DshSkin.Window]::IsWindow($entry.Key)) {
      [void][DshSkin.Window]::SendMessage($entry.Key, 0x80, [IntPtr]0, $entry.Value[0])
      [void][DshSkin.Window]::SendMessage($entry.Key, 0x80, [IntPtr]1, $entry.Value[1])
    }
  }
}
`;
/** Owns at most one window-icon helper; `set` is idempotent per file. */
var WindowIconHolder = class {
	child;
	file = null;
	targetPid;
	/** @param targetPid - the desktop main process, the parent of the host child. */
	constructor(targetPid = process.ppid) {
		this.targetPid = targetPid;
	}
	set(file) {
		if (file === this.file && (file === null || this.child !== void 0)) return;
		this.stop();
		this.file = file;
		if (file === null) return;
		const child = spawn("powershell.exe", [
			"-NoLogo",
			"-NoProfile",
			"-NonInteractive",
			"-ExecutionPolicy",
			"Bypass",
			"-EncodedCommand",
			Buffer.from(WINDOW_ICON_SCRIPT, "utf16le").toString("base64")
		], {
			env: {
				...process.env,
				DSH_SKIN_ICON_FILE: file,
				DSH_SKIN_ICON_PID: String(this.targetPid)
			},
			stdio: [
				"pipe",
				"ignore",
				"pipe"
			],
			windowsHide: true
		});
		let stderr = "";
		child.stderr?.setEncoding("utf8");
		child.stderr?.on("data", (chunk) => {
			stderr = (stderr + chunk).slice(-4096);
		});
		child.on("error", (error) => {
			console.error("[skin-manager] window icon helper failed to start", error);
		});
		child.on("exit", (code) => {
			if (this.child === child) this.child = void 0;
			if (code !== 0 && code !== null) console.error(`[skin-manager] window icon helper exited with ${code}`, stderr.trim());
		});
		this.child = child;
	}
	/** Ask the helper to restore the previous icons and exit; kill it if it lingers. */
	stop() {
		const child = this.child;
		this.child = void 0;
		this.file = null;
		if (child === void 0) return;
		try {
			child.stdin?.end("stop\n");
		} catch {}
		setTimeout(() => {
			if (child.exitCode === null && child.signalCode === null) child.kill();
		}, 5e3).unref();
	}
};
//#endregion
//#region src/contract.ts
/** Same-origin host route used for catalog discovery and activation. */
const SKIN_MANAGER_ROUTE = "/api/dsh/skins";
//#endregion
//#region src/index.ts
const name = "ui-skin-deep-whale-manager";
const inject = ["webServer"];
const MANAGED_START = "# --- dsh-skin managed (auto-generated; do not edit) ---";
const MANAGED_END = "# --- end dsh-skin managed ---";
/**
* Grant through the host so its file lock, validation and reload apply; the
* manager never writes `compatibility.json` itself.
*/
async function grantThroughHost(ctx, compatibility) {
	const service = ctx.get("pluginManager");
	if (service === void 0 || typeof service.setVersionExemption !== "function") throw new Error("exemption-unavailable");
	const result = await service.setVersionExemption(compatibility.package, compatibility.runtimeVersion, true, true);
	if (result.error !== void 0) throw new Error(result.error.diagnostic || result.error.code);
	if (result.application === "failed") throw new Error("exemption-failed");
}
/** Resolve the profile patch without inspecting credentials or unrelated files. */
function resolveProfilePatch(env = process.env, cwd = process.cwd()) {
	const configuredHome = env.DSH_HOME?.trim();
	const harnessHome = configuredHome !== void 0 && configuredHome !== "" ? resolve(configuredHome) : join(homedir(), ".dsh");
	const explicitProfile = env.DSH_SKIN_PROFILE?.trim() || env.DSH_PROFILE?.trim();
	const profilesDir = join(harnessHome, "profiles");
	const inferredProfile = dirname(resolve(cwd)) === resolve(profilesDir) ? basename(resolve(cwd)) : void 0;
	const profile = explicitProfile || inferredProfile || "web";
	if (!/^[a-zA-Z0-9._-]+$/.test(profile)) throw new Error("invalid-profile-name");
	return join(profilesDir, profile, "cordis.patch.yml");
}
/** Resolve the running profile from the root Loader base before using process-level fallbacks. */
function resolveRuntimeProfilePatch(baseUrl, env = process.env, cwd = process.cwd()) {
	if (baseUrl !== void 0) try {
		const baseDir = resolve(fileURLToPath(baseUrl));
		if (basename(dirname(baseDir)) === "profiles") {
			const profile = basename(baseDir);
			if (!/^[a-zA-Z0-9._-]+$/.test(profile)) throw new Error("invalid-profile-name");
			return join(baseDir, "cordis.patch.yml");
		}
	} catch (error) {
		if (error instanceof Error && error.message === "invalid-profile-name") throw error;
	}
	return resolveProfilePatch(env, cwd);
}
function patchTargetsForProfile(profilePatch) {
	return [profilePatch, join(dirname(dirname(dirname(profilePatch))), "cordis.patch.yml")];
}
/** Both live user layers must agree because the home layer has higher priority. */
function resolvePatchTargets(env = process.env, cwd = process.cwd()) {
	return patchTargetsForProfile(resolveProfilePatch(env, cwd));
}
function packageNames(manifestPath) {
	try {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
		const names = new Set(Object.keys(manifest.dependencies ?? {}));
		for (const value of manifest.dsh?.profile?.bundles ?? []) if (typeof value === "string") names.add(value);
		return [...names];
	} catch {
		return [];
	}
}
function skinManifestPath(profileManifest, packageName) {
	const require = createRequire(profileManifest);
	const located = (manifestPath) => {
		try {
			const own = JSON.parse(readFileSync(join(dirname(manifestPath), "package.json"), "utf8"));
			if (typeof own.name === "string" && own.name !== "") return {
				manifestPath,
				packageName: own.name
			};
		} catch {}
		return {
			manifestPath,
			packageName
		};
	};
	try {
		return located(require.resolve(`${packageName}/skin.json`));
	} catch {
		try {
			const candidate = join(dirname(require.resolve(`${packageName}/package.json`)), "skin.json");
			return existsSync(candidate) ? located(candidate) : null;
		} catch {
			const candidate = join(dirname(profileManifest), "node_modules", ...packageName.split("/"), "skin.json");
			return existsSync(candidate) ? located(candidate) : null;
		}
	}
}
function catalogEntry(manifest, installedPackage) {
	const id = manifest.id;
	const name = manifest.name;
	const packageName = manifest.package;
	const wiringId = manifest.wiring?.id;
	const bodyAttr = manifest.bodyAttr;
	if (typeof id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(id)) return null;
	if (typeof name !== "string" || name.trim() === "") return null;
	if (packageName !== installedPackage) return null;
	if (typeof wiringId !== "string" || !/^[a-zA-Z0-9@/_.:-]+$/.test(wiringId)) return null;
	if (typeof bodyAttr !== "string" || !/^data-[a-z0-9_.:-]+$/.test(bodyAttr)) return null;
	return {
		id,
		name,
		...typeof manifest.nameEn === "string" ? { nameEn: manifest.nameEn } : {},
		...typeof manifest.tagline === "string" ? { tagline: manifest.tagline } : {},
		...typeof manifest.taglineEn === "string" ? { taglineEn: manifest.taglineEn } : {},
		package: packageName,
		wiringId,
		bodyAttr,
		...typeof manifest.dshCompatibility === "string" && /^\d+\.\d+\.\d+rc\d+$/.test(manifest.dshCompatibility) ? { dshCompatibility: manifest.dshCompatibility } : {},
		order: typeof manifest.order === "number" && Number.isFinite(manifest.order) ? manifest.order : 100
	};
}
/**
* Discover every installed package that exposes a valid skin.json manifest.
* @param runtimeVersion - the running DSH version; when known, entries the
* host's admission check refuses carry `compatibility`.
*/
function discoverInstalledSkins(profilePatch = resolveProfilePatch(), runtimeVersion = readDshRuntimeVersion()) {
	const profileManifest = join(dirname(profilePatch), "package.json");
	const exemptions = runtimeVersion === void 0 ? {} : readProfileExemptions(dirname(profilePatch));
	const found = [];
	const ids = /* @__PURE__ */ new Set();
	const wiringIds = /* @__PURE__ */ new Set();
	for (const packageName of packageNames(profileManifest)) {
		const skin = skinManifestPath(profileManifest, packageName);
		if (skin === null) continue;
		try {
			const entry = catalogEntry(JSON.parse(readFileSync(skin.manifestPath, "utf8")), skin.packageName);
			if (entry === null || ids.has(entry.id) || wiringIds.has(entry.wiringId)) continue;
			ids.add(entry.id);
			wiringIds.add(entry.wiringId);
			if (runtimeVersion !== void 0) {
				let manifest;
				try {
					manifest = JSON.parse(readFileSync(join(dirname(skin.manifestPath), "package.json"), "utf8"));
				} catch {}
				const compatibility = evaluateSkinCompatibility(manifest, runtimeVersion, exemptions);
				if (compatibility !== void 0) entry.compatibility = compatibility;
			}
			found.push(entry);
		} catch {}
	}
	return found.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}
/** Same validation walk as {@link discoverInstalledSkins}, mapped to package directories. */
function discoverSkinDirectories(profilePatch = resolveProfilePatch()) {
	const profileManifest = join(dirname(profilePatch), "package.json");
	const dirs = /* @__PURE__ */ new Map();
	const wiringIds = /* @__PURE__ */ new Set();
	for (const packageName of packageNames(profileManifest)) {
		const skin = skinManifestPath(profileManifest, packageName);
		if (skin === null) continue;
		try {
			const entry = catalogEntry(JSON.parse(readFileSync(skin.manifestPath, "utf8")), skin.packageName);
			if (entry === null || dirs.has(entry.id) || wiringIds.has(entry.wiringId)) continue;
			wiringIds.add(entry.wiringId);
			dirs.set(entry.id, dirname(skin.manifestPath));
		} catch {}
	}
	return dirs;
}
/** Package ICO files that installed skins declare through `skin.json#desktopIcon`. */
function discoverSkinDesktopIcons(profilePatch = resolveProfilePatch()) {
	const icons = /* @__PURE__ */ new Map();
	for (const [id, dir] of discoverSkinDirectories(profilePatch)) try {
		const file = resolveSkinDesktopIcon(dir, JSON.parse(readFileSync(join(dir, "skin.json"), "utf8")).desktopIcon);
		if (file !== null) icons.set(id, file);
	} catch {}
	return icons;
}
/** The one skin the host will actually load after profile then home overrides, else official. */
function activeSkinTarget(sources, catalog) {
	const enabled = enabledSkins(sources, catalog).filter((skin) => skin.compatibility === void 0 || skin.compatibility.exempted);
	return enabled.length === 1 ? enabled[0].id : "official";
}
const execFileAsync = promisify(execFile);
const GIT_OP_TIMEOUT_MS = 5e3;
const GITHUB_OP_TIMEOUT_MS = 8e3;
const BRANCH_CACHE_TTL_MS = 864e5;
const VERSION_CACHE_TTL_MS = 3e4;
/** Parse `owner/repo` out of a GitHub remote URL (https, ssh, git@, git://). */
function parseGitHubRemote(remoteUrl) {
	const match = /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?\/?$/.exec(remoteUrl.trim());
	if (match === null) return null;
	const owner = match[1];
	const repo = match[2];
	if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
	return {
		owner,
		repo
	};
}
/** The skin directory as a slash-separated path relative to its git repository root. */
function repositoryRelativePath(dir, repoRoot) {
	const resolvedDir = resolve(dir);
	const resolvedRoot = resolve(repoRoot);
	if (resolvedDir === resolvedRoot) return "";
	return relative(resolvedRoot, resolvedDir).replaceAll("\\", "/").replace(/^\.\//, "");
}
async function runGit(cwd, args) {
	try {
		const { stdout } = await execFileAsync("git", args, {
			cwd,
			timeout: GIT_OP_TIMEOUT_MS,
			windowsHide: true,
			encoding: "utf8"
		});
		return stdout.trim();
	} catch {
		return null;
	}
}
function parseSkinBuildMeta(raw) {
	if (typeof raw !== "object" || raw === null) return null;
	const meta = raw;
	const fingerprint = typeof meta.fingerprint === "string" && /^[0-9a-f]{64}$/.test(meta.fingerprint) ? meta.fingerprint : null;
	const sourceCommit = typeof meta.sourceCommit === "string" && /^[0-9a-f]{40}$/.test(meta.sourceCommit) ? meta.sourceCommit : null;
	const repository = typeof meta.repository === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(meta.repository) ? meta.repository : null;
	const path = typeof meta.path === "string" && /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/.test(meta.path) ? meta.path.replaceAll("\\", "/").replace(/^\.\//, "") : null;
	if (meta.schema !== 1 || fingerprint === null || repository === null || path === null || path === "") return null;
	return {
		fingerprint,
		sourceCommit,
		repository,
		path
	};
}
function readSkinBuildMeta(dir) {
	const file = join(dir, "skin.build.json");
	if (!existsSync(file)) return null;
	try {
		return parseSkinBuildMeta(JSON.parse(readFileSync(file, "utf8")));
	} catch {
		return null;
	}
}
const SKIN_FINGERPRINT_INPUTS = [
	"lib/client.js",
	"lib/index.js",
	"cordis.patch.yml",
	"skin.json"
];
/** Recalculate the same cross-platform fingerprint emitted after a skin build. */
function computeSkinFingerprint(dir) {
	try {
		const hash = createHash("sha256");
		for (const input of SKIN_FINGERPRINT_INPUTS) {
			const normalized = readFileSync(join(dir, input), "utf8").replaceAll("\r\n", "\n");
			hash.update(`${input}\0${Buffer.byteLength(normalized)}\0`);
			hash.update(normalized);
		}
		hashSkinAssets(hash, dir);
		return hash.digest("hex");
	} catch {
		return null;
	}
}
/**
* Local-only identity of the installed skin: git HEAD when the installed
* directory lives in a git repository (development / link / clone installs),
* build-time metadata otherwise (marketplace / archive installs). The remote
* half never touches this function.
*/
async function inspectInstalledVersion(dir, git = runGit) {
	const meta = readSkinBuildMeta(dir);
	const actualFingerprint = meta === null ? null : computeSkinFingerprint(dir);
	const buildDirty = meta !== null && actualFingerprint !== meta.fingerprint;
	const hash = await git(dir, ["rev-parse", "HEAD"]);
	if (hash !== null) {
		const repoRoot = await git(dir, ["rev-parse", "--show-toplevel"]);
		const relPath = repoRoot === null ? "" : repositoryRelativePath(dir, repoRoot);
		const base = repoRoot ?? dir;
		const [short, date, baseRef, baseDate] = await Promise.all([
			git(dir, [
				"rev-parse",
				"--short",
				"HEAD"
			]),
			git(dir, [
				"log",
				"-1",
				"--format=%cI"
			]),
			git(base, [
				"log",
				"-1",
				"--format=%H",
				...relPath === "" ? [] : ["--", relPath]
			]),
			git(base, [
				"log",
				"-1",
				"--format=%cI",
				...relPath === "" ? [] : ["--", relPath]
			])
		]);
		const dirtyOut = await git(base, [
			"status",
			"--porcelain",
			...relPath === "" ? [] : ["--", relPath]
		]);
		return {
			source: "git",
			local: {
				hash,
				short: short ?? hash.slice(0, 7),
				date
			},
			repository: meta?.repository ?? null,
			relPath: meta?.path ?? relPath,
			baseRef: baseRef ?? hash,
			baseDate: relPath !== "" && baseDate !== null ? baseDate : date,
			fingerprint: actualFingerprint,
			buildDirty,
			dirty: buildDirty || dirtyOut !== null && dirtyOut.trim() !== ""
		};
	}
	if (meta !== null) return {
		source: "build",
		local: {
			hash: meta.fingerprint,
			short: meta.fingerprint.slice(0, 12),
			date: null
		},
		repository: meta.repository,
		relPath: meta.path,
		baseRef: meta.sourceCommit,
		baseDate: null,
		fingerprint: actualFingerprint,
		buildDirty,
		dirty: buildDirty
	};
	return {
		source: "none",
		local: null,
		repository: null,
		relPath: null,
		baseRef: null,
		baseDate: null,
		fingerprint: null,
		buildDirty: false,
		dirty: false
	};
}
var GitHubHttpError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
async function githubJson(path, params) {
	const url = new URL(`https://api.github.com${path}`);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), GITHUB_OP_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				accept: "application/vnd.github+json",
				"user-agent": "dsh-skin-manager"
			}
		});
		if (response.status === 404) throw new GitHubHttpError(404, "not-found");
		if (response.status === 422) throw new GitHubHttpError(422, "unprocessable");
		if (!response.ok) throw new GitHubHttpError(response.status, `http-${response.status}`);
		return await response.json();
	} catch (error) {
		if (error instanceof GitHubHttpError) throw error;
		throw new GitHubHttpError(0, "network-error");
	} finally {
		clearTimeout(timer);
	}
}
function commitIdentity(raw) {
	if (typeof raw !== "object" || raw === null) return null;
	const payload = raw;
	if (typeof payload.sha !== "string" || payload.sha === "") return null;
	const date = typeof payload.commit?.author?.date === "string" ? payload.commit.author.date : null;
	const message = typeof payload.commit?.message === "string" ? payload.commit.message.split("\n")[0].trim() : "";
	return {
		hash: payload.sha,
		short: payload.sha.slice(0, 7),
		date,
		...message === "" ? {} : { message }
	};
}
/** Latest commit touching `relPath` ('' = whole repository) under `ref`. */
async function directoryCommit(ownerRepo, ref, relPath) {
	const params = {
		sha: ref,
		per_page: "1"
	};
	if (relPath !== "") params.path = relPath;
	const body = await githubJson(`/repos/${ownerRepo}/commits`, params);
	if (!Array.isArray(body) || body.length === 0) return null;
	return commitIdentity(body[0]);
}
/** Read the deterministic build manifest at one repository ref. */
async function repositoryBuildMeta(ownerRepo, ref, relPath) {
	const body = await githubJson(`/repos/${ownerRepo}/contents/${relPath === "" ? "skin.build.json" : `${relPath}/skin.build.json`}`, { ref });
	if (typeof body !== "object" || body === null) return null;
	const payload = body;
	if (payload.encoding !== "base64" || typeof payload.content !== "string") return null;
	try {
		const decoded = Buffer.from(payload.content.replaceAll("\n", ""), "base64").toString("utf8");
		return parseSkinBuildMeta(JSON.parse(decoded));
	} catch {
		return null;
	}
}
/** GitHub compare status (`identical|ahead|behind|diverged`) between two refs. */
async function compareCommits(ownerRepo, base, head) {
	const body = await githubJson(`/repos/${ownerRepo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`, {});
	return typeof body?.status === "string" ? body.status : null;
}
/**
* A hash difference alone proves nothing: remote-side commits may be anything
* between a true update and a local lead. The state comes from the compare
* status (ancestry) combined with whether the directory moves at all.
* @param status - compare status between the installed side and the remote branch.
* @param dirSame - true when the skin directory head is identical on both sides.
*/
function classifyUpdate(status, dirSame) {
	if (dirSame) return "up-to-date";
	switch (status) {
		case "ahead": return "update-available";
		case "behind": return "local-ahead";
		case "diverged": return "diverged";
		case "identical": return "unknown";
		default: return "unknown";
	}
}
const defaultDeps = {
	git: runGit,
	githubJson,
	directoryCommit,
	buildMeta: repositoryBuildMeta,
	compareCommit: compareCommits,
	defaultBranch: async (ownerRepo) => {
		const repository = await githubJson(`/repos/${ownerRepo}`, {});
		return typeof repository.default_branch === "string" && repository.default_branch !== "" ? repository.default_branch : "main";
	}
};
/**
* Read-only version row for one installed skin package: installed identity
* (git head or deterministic build fingerprint) plus the canonical build
* manifest on GitHub. Only shipped runtime inputs change the fingerprint;
* docs/tests/source-only commits therefore never become user-facing updates.
*/
async function inspectSkinVersion(id, dir, deps = defaultDeps) {
	const installed = await inspectInstalledVersion(dir, deps.git);
	if (installed.source === "none" || installed.local === null) return {
		id,
		source: "none",
		local: null,
		remote: null,
		dirty: false,
		note: "安装目录既不是 Git 仓库，也没有构建指纹（skin.build.json）"
	};
	let repository = installed.repository;
	if (repository === null) {
		const repoRoot = await deps.git(dir, ["rev-parse", "--show-toplevel"]);
		const remoteUrl = repoRoot === null ? null : await deps.git(repoRoot, [
			"remote",
			"get-url",
			"origin"
		]);
		const parsed = remoteUrl === null ? null : parseGitHubRemote(remoteUrl);
		repository = parsed === null ? null : `${parsed.owner}/${parsed.repo}`;
	}
	if (repository === null) return {
		id,
		source: installed.source,
		local: installed.local,
		remote: null,
		dirty: installed.dirty,
		note: installed.source === "git" ? "未声明官方 GitHub 更新源，无法对比更新" : "构建指纹缺少 GitHub 仓库信息"
	};
	const repo = repository;
	const relPath = installed.relPath ?? "";
	const localView = installed.source === "build" ? installed.local : {
		hash: installed.baseRef,
		short: installed.baseRef.slice(0, 7),
		date: installed.baseDate
	};
	let branch = "main";
	try {
		branch = await deps.defaultBranch(repo);
	} catch {}
	const remoteMeta = await (async () => {
		try {
			return await deps.buildMeta(repo, branch, relPath);
		} catch {
			return null;
		}
	})();
	const latest = await (async () => {
		try {
			const trackedPath = installed.fingerprint === null ? relPath : relPath === "" ? "skin.build.json" : `${relPath}/skin.build.json`;
			return await deps.directoryCommit(repo, branch, trackedPath);
		} catch {
			return null;
		}
	})() ?? (remoteMeta === null ? null : {
		hash: remoteMeta.fingerprint,
		short: remoteMeta.fingerprint.slice(0, 12),
		date: null
	});
	let state = "unknown";
	let note;
	const buildSame = installed.fingerprint !== null && remoteMeta !== null ? installed.fingerprint === remoteMeta.fingerprint : installed.baseRef !== null && latest !== null && installed.baseRef === latest.hash;
	if (installed.buildDirty) note = "已安装运行文件与构建指纹不一致（本地有修改），不判定为远端更新";
	else if (remoteMeta === null && installed.fingerprint !== null) note = "远端缺少有效构建指纹，无法判断更新";
	else if (buildSame) state = "up-to-date";
	else if (installed.dirty) note = "本地有未提交修改，无法用提交祖先关系判断当前运行文件是否需要更新";
	else if (installed.baseRef === null) note = "构建指纹不同，但已安装包缺少可比较的源码提交，无法判断先后";
	else try {
		const remoteRef = remoteMeta?.sourceCommit ?? branch;
		const status = await deps.compareCommit(repo, installed.baseRef, remoteRef);
		state = classifyUpdate(status, false);
		if (state === "unknown" && status !== "identical") note = "远端提交无法证明是已安装版本的后继（远端状态 unknown），不判定为更新";
		else if (state === "unknown") note = "构建指纹不同，但源码提交相同，无法判断先后";
	} catch (error) {
		const status = typeof error === "object" && error !== null ? error.status : void 0;
		if (status === 404 || status === 422) {
			state = buildSame ? "up-to-date" : "unknown";
			if (!buildSame) note = "已安装提交不在远端历史中（本地有未推送或分叉提交），无法判断更新";
		} else note = "远端查询失败（网络不可用或请求受限），稍后再试";
	}
	return {
		id,
		source: installed.source,
		local: installed.local,
		remote: {
			repo,
			branch,
			latest,
			localView,
			state
		},
		dirty: installed.dirty,
		...note !== void 0 ? { note } : {}
	};
}
/** Read the direct `id` of one top-level patch record (`- id: x` or a later `id:` property). */
function recordId(record) {
	const head = record.find((line) => /^-(\s|$)/.test(line));
	if (head === void 0) return void 0;
	const idValue = /^id:\s*(['"]?)([^'"#\s]+)\1\s*(?:#.*)?$/;
	const first = head.replace(/^-\s*/, "").match(idValue);
	if (first !== null) return first[2];
	const propertyIndent = head.length - head.replace(/^-\s*/, "").length;
	for (const line of record.slice(record.indexOf(head) + 1)) {
		if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
		if (line.length - line.trimStart().length !== propertyIndent) continue;
		const property = line.trimStart().match(idValue);
		if (property !== null) return property[2];
	}
}
/**
* Split the managed block body into top-level records and keep those the
* manager does not own. DSH 0.1.7+ appends settings rows (`ui-theme`, ...) to
* the end of the profile patch, which lands them inside this block; they must
* survive a switch.
*/
function foreignRecords(body, isOwned) {
	const records = [];
	let current = [];
	for (const line of body.split(/\r?\n/).map((line) => line.replace(/[ \t]+$/, ""))) if (/^-(\s|$)/.test(line)) {
		let lead = current.length;
		while (lead > 0 && (current[lead - 1] === "" || current[lead - 1].startsWith("#"))) lead--;
		const intro = current.splice(lead).filter((text) => text !== "");
		if (current.length > 0) records.push(current);
		current = [...intro, line];
	} else current.push(line);
	if (current.length > 0) records.push(current);
	return records.filter((record) => {
		if (!record.some((line) => /^-(\s|$)/.test(line))) return false;
		const id = recordId(record);
		return id === void 0 || !isOwned(id);
	}).map((record) => record.join("\n").replace(/\s+$/, ""));
}
/** A manager-owned row is any discovered skin wiring id or a `ui-skin-*` row. */
function ownsRecord(ownedIds) {
	return (id) => ownedIds.has(id) || id.startsWith("ui-skin-") && id !== "ui-skin-deep-whale-manager";
}
/**
* Remove exactly one manager-owned block while preserving all user YAML.
* Records inside the block that belong to someone else (for example settings
* rows DSH appended to the end of the file) are moved in front of it.
*/
function stripManagedBlock(source, ownedIds = /* @__PURE__ */ new Set()) {
	const start = source.indexOf(MANAGED_START);
	if (start < 0) return source;
	const end = source.indexOf(MANAGED_END, start);
	if (end < 0) throw new Error("managed-section-is-incomplete");
	return [
		source.slice(0, start).replace(/[ \t]+$/gm, "").replace(/\s+$/, ""),
		foreignRecords(source.slice(start + 56, end), ownsRecord(ownedIds)).join("\n"),
		source.slice(end + 30).replace(/^\s+/, "")
	].filter(Boolean).join("\n\n");
}
/** Render mutual exclusion for all discovered skins; official disables all. */
function renderManagedBlock(target, catalog) {
	const lines = [MANAGED_START];
	for (const skin of catalog) lines.push(`- id: ${skin.wiringId}`, `  disabled: ${skin.id === target ? "false" : "true"}`);
	lines.push(MANAGED_END);
	return lines.join("\n");
}
/** Compose a new patch without touching content outside the managed block. */
function switchPatch(source, target, catalog) {
	const stripped = stripManagedBlock(source, new Set(catalog.map((skin) => skin.wiringId))).replace(/\s+$/, "");
	const emptySequence = /^\[\]\s*(?:#.*)?$/;
	const lines = stripped.split(/\r?\n/);
	const unmanaged = lines.some((line) => emptySequence.test(line)) ? lines.filter((line) => !emptySequence.test(line)).join("\n").replace(/\s+$/, "") : stripped;
	return `${unmanaged === "" ? "" : `${unmanaged}\n\n`}${renderManagedBlock(target, catalog)}\n`;
}
/** Atomically replace a single profile patch, leaving the original intact on failure. */
function atomicWrite(path, text) {
	mkdirSync(dirname(path), { recursive: true });
	const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
	let fd;
	try {
		fd = openSync(temporary, "wx", 384);
		writeFileSync(fd, text, "utf8");
		fsyncSync(fd);
		closeSync(fd);
		fd = void 0;
		renameSync(temporary, path);
	} finally {
		if (fd !== void 0) closeSync(fd);
		if (existsSync(temporary)) rmSync(temporary, { force: true });
	}
}
/** Persist one discovered target in both live layers. */
function useSkin(target, patchPaths = resolvePatchTargets(), catalog = discoverInstalledSkins(patchPaths[0])) {
	if (target !== "official" && !catalog.some((skin) => skin.id === target)) throw new Error(`skin-not-installed: ${target}`);
	const originals = patchPaths.map((path) => ({
		path,
		existed: existsSync(path),
		source: existsSync(path) ? readFileSync(path, "utf8") : ""
	}));
	const next = originals.map((original) => switchPatch(original.source, target, catalog));
	const written = [];
	try {
		originals.forEach((original, index) => {
			atomicWrite(original.path, next[index]);
			written.push(original);
		});
	} catch (error) {
		for (const original of written.reverse()) if (original.existed) atomicWrite(original.path, original.source);
		else rmSync(original.path, { force: true });
		throw error;
	}
}
/** Read the last explicit disabled value for each installed skin in one patch layer. */
function readSkinStates(source, catalog) {
	const known = new Set(catalog.map((skin) => skin.wiringId));
	const states = /* @__PURE__ */ new Map();
	let currentId;
	let currentIndent = -1;
	let propertyIndent;
	for (const line of source.split(/\r?\n/)) {
		const entry = line.match(/^(\s*)-\s+id:\s*(['"]?)([^'"#\s]+)\2\s*(?:#.*)?$/);
		if (entry !== null) {
			if (entry[1].length !== 0) continue;
			currentId = known.has(entry[3]) ? entry[3] : void 0;
			currentIndent = entry[1].length;
			propertyIndent = void 0;
			continue;
		}
		if (currentId === void 0) continue;
		const trimmed = line.trim();
		if (trimmed === "" || trimmed.startsWith("#")) continue;
		const indent = line.length - line.trimStart().length;
		if (indent <= currentIndent) {
			currentId = void 0;
			continue;
		}
		propertyIndent = propertyIndent === void 0 ? indent : Math.min(propertyIndent, indent);
		const disabled = line.match(/^\s*disabled:\s*(true|false)\s*(?:#.*)?$/);
		if (disabled !== null && indent === propertyIndent) states.set(currentId, disabled[1] === "true");
	}
	return states;
}
/** Return installed skins that are effectively enabled after profile then home overrides. */
function enabledSkins(sources, catalog) {
	const states = /* @__PURE__ */ new Map();
	for (const source of sources) for (const [id, disabled] of readSkinStates(source, catalog)) states.set(id, disabled);
	return catalog.filter((skin) => states.get(skin.wiringId) !== true);
}
/** Fail safe when a direct marketplace install would otherwise activate multiple skins. */
function ensureSafeInitialState(patchPaths = resolvePatchTargets(), catalog = discoverInstalledSkins(patchPaths[0])) {
	if (catalog.length < 2) return false;
	if (enabledSkins(patchPaths.map((path) => existsSync(path) ? readFileSync(path, "utf8") : ""), catalog).length < 2) return false;
	useSkin("official", patchPaths, catalog);
	return true;
}
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function sameOrigin(req) {
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = req.headers.origin;
	if (typeof origin !== "string" || origin === "" || origin === "null") return true;
	const host = req.headers.host;
	if (typeof host !== "string" || host === "") return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 16384) {
				reject(/* @__PURE__ */ new Error("body-too-large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			try {
				resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch {
				reject(/* @__PURE__ */ new Error("invalid-json"));
			}
		});
		req.on("error", reject);
	});
}
/** Create the local catalog/activation route; POST targets are catalog-validated. */
function makeSkinManagerRoute(catalogProvider = () => discoverInstalledSkins(), applyTarget = (target, catalog) => useSkin(target, resolvePatchTargets(), catalog), dirProvider = () => /* @__PURE__ */ new Map(), grantExemption = async () => {
	throw new Error("exemption-unavailable");
}, desktopIcon) {
	const versionCache = /* @__PURE__ */ new Map();
	const branchCache = /* @__PURE__ */ new Map();
	const deps = {
		...defaultDeps,
		defaultBranch: async (ownerRepo) => {
			const hit = branchCache.get(ownerRepo);
			if (hit !== void 0 && Date.now() - hit.at < BRANCH_CACHE_TTL_MS) return hit.value;
			const value = await defaultDeps.defaultBranch(ownerRepo);
			branchCache.set(ownerRepo, {
				at: Date.now(),
				value
			});
			return value;
		}
	};
	const cachedCheck = async (id, dir) => {
		const now = Date.now();
		const hit = versionCache.get(id);
		if (hit !== void 0 && now - hit.at < VERSION_CACHE_TTL_MS) return hit.value;
		const value = await inspectSkinVersion(id, dir, deps);
		versionCache.set(id, {
			at: now,
			value
		});
		return value;
	};
	const rows = (dirs, check) => Promise.all([...dirs].map(async ([id, dir]) => {
		try {
			return await check(id, dir);
		} catch (error) {
			return {
				id,
				source: "none",
				local: null,
				remote: null,
				dirty: false,
				note: error instanceof Error ? error.message : String(error)
			};
		}
	}));
	return {
		kind: "exact",
		path: SKIN_MANAGER_ROUTE,
		async handler(req, res) {
			if (!sameOrigin(req)) {
				json(res, 403, {
					ok: false,
					error: "cross-site-request-rejected"
				});
				return;
			}
			try {
				const catalog = catalogProvider();
				if (req.method === "GET") {
					json(res, 200, {
						ok: true,
						skins: catalog,
						...desktopIcon === void 0 ? {} : { desktopIcon: { enabled: desktopIcon.enabled() } }
					});
					return;
				}
				if (req.method !== "POST") {
					json(res, 405, {
						ok: false,
						error: "method-not-allowed"
					});
					return;
				}
				const body = await readBody(req);
				const action = typeof body === "object" && body !== null ? body.action : void 0;
				if (action === "local-versions") {
					json(res, 200, {
						ok: true,
						versions: await rows(dirProvider(), (id, dir) => inspectInstalledVersion(dir).then((installed) => ({
							id,
							source: installed.source,
							local: installed.local,
							remote: null,
							dirty: installed.dirty,
							...installed.source === "none" ? { note: "安装目录既不是 Git 仓库，也没有构建指纹（skin.build.json）" } : {}
						})))
					});
					return;
				}
				if (action === "desktop-icon") {
					const enabled = body.enabled;
					if (desktopIcon === void 0) throw new Error("desktop-icon-unavailable");
					if (typeof enabled !== "boolean") throw new Error("invalid-desktop-icon-request");
					json(res, 200, {
						ok: true,
						desktopIcon: await desktopIcon.setEnabled(enabled)
					});
					return;
				}
				if (action === "versions") {
					json(res, 200, {
						ok: true,
						versions: await rows(dirProvider(), cachedCheck)
					});
					return;
				}
				const target = typeof body === "object" && body !== null ? body.target : void 0;
				if (target !== "official" && !catalog.some((skin) => skin.id === target)) throw new Error("invalid-skin-target");
				const compatibility = catalog.find((skin) => skin.id === target)?.compatibility;
				if (compatibility !== void 0 && !compatibility.exempted) {
					if (body.acceptRisk !== true) {
						json(res, 409, {
							ok: false,
							error: "incompatible-version",
							compatibility
						});
						return;
					}
					await grantExemption(compatibility);
				}
				applyTarget(target, catalog);
				desktopIcon?.follow(target);
				json(res, 200, {
					ok: true,
					target
				});
			} catch (error) {
				json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	};
}
/** Register the switching route with lifecycle-owned cleanup. */
function apply(ctx) {
	const profilePatch = resolveRuntimeProfilePatch(ctx.baseUrl);
	const patchPaths = patchTargetsForProfile(profilePatch);
	const catalog = () => discoverInstalledSkins(profilePatch);
	ctx.effect(() => {
		try {
			ensureSafeInitialState(patchPaths, catalog());
		} catch (error) {
			console.error("[skin-manager] failed to enforce startup mutual exclusion", error);
		}
		const desktopIcon = desktopIconControl(profilePatch, patchPaths, catalog);
		const unregister = ctx.webServer.register(makeSkinManagerRoute(catalog, (target, installed) => useSkin(target, patchPaths, installed), () => discoverSkinDirectories(profilePatch), (compatibility) => grantThroughHost(ctx, compatibility), desktopIcon?.control));
		return () => {
			unregister();
			desktopIcon?.dispose();
		};
	}, "ui-skin-manager: startup guard, catalog/activation route and desktop icon");
}
/**
* Windows desktop shell only: the shortcut icon follows the active skin once
* the user opts in. Shortcuts deliberately keep the skin icon across restarts;
* only the switch, a return to the official look, or a skin without an icon
* restores them. Startup reconciles, which also repairs a reset by a DSH update.
* The window icon (taskbar thumbnail, Alt+Tab) lives only as long as this
* plugin: disposing stops the helper, which restores the previous icon.
*/
function desktopIconControl(profilePatch, patchPaths, catalog) {
	const shell = detectDesktopShell();
	if (shell === null) return void 0;
	const windowIcon = new WindowIconHolder();
	let disposed = false;
	const sync = new DesktopIconSync(dirname(dirname(dirname(profilePatch))), shell, void 0, (file) => {
		if (!disposed) windowIcon.set(file);
	});
	const source = (target) => {
		if (target === "official") return null;
		const file = discoverSkinDesktopIcons(profilePatch).get(target);
		return file === void 0 ? null : {
			skinId: target,
			file
		};
	};
	const current = () => activeSkinTarget(patchPaths.map((path) => existsSync(path) ? readFileSync(path, "utf8") : ""), catalog());
	const report = (error) => {
		console.error("[skin-manager] desktop icon sync failed", error);
	};
	Promise.resolve().then(() => sync.reconcile(source(current()))).catch(report);
	return {
		control: {
			enabled: () => sync.enabled,
			setEnabled: (enabled) => sync.setEnabled(enabled, source(current())),
			follow: (target) => {
				Promise.resolve().then(() => sync.reconcile(source(target))).catch(report);
			}
		},
		dispose: () => {
			disposed = true;
			windowIcon.stop();
		}
	};
}
//#endregion
export { LEGACY_SKIN_CUSTOMIZATION_PROTOCOL, MANAGED_END, MANAGED_START, SKIN_CUSTOMIZATION_EVENTS, SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SKIN_MANAGER_ROUTE, SkinAttributeProjector, activeSkinTarget, apply, classifyUpdate, computeSkinFingerprint, discoverInstalledSkins, discoverSkinDesktopIcons, discoverSkinDirectories, enabledSkins, ensureSafeInitialState, exposeSkinCustomization, inject, inspectInstalledVersion, inspectSkinVersion, makeSkinManagerRoute, name, parseGitHubRemote, readSkinBuildMeta, readSkinStates, renderManagedBlock, repositoryRelativePath, resolvePatchTargets, resolveProfilePatch, resolveRuntimeProfilePatch, stripManagedBlock, switchPatch, useSkin };
