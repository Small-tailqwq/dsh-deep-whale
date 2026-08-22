import { SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SkinAttributeProjector, exposeSkinCustomization } from "./protocol.js";
import { createRequire } from "node:module";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
//#region src/contract.ts
/** Same-origin host route used for catalog discovery and activation. */
const SKIN_MANAGER_ROUTE = "/api/dsh/skins";
//#endregion
//#region src/index.ts
const name = "ui-skin-deep-whale-manager";
const inject = ["webServer"];
const MANAGED_START = "# --- dsh-skin managed (auto-generated; do not edit) ---";
const MANAGED_END = "# --- end dsh-skin managed ---";
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
/** Both live user layers must agree because the home layer has higher priority. */
function resolvePatchTargets(env = process.env, cwd = process.cwd()) {
	const profilePatch = resolveProfilePatch(env, cwd);
	return [profilePatch, join(dirname(dirname(dirname(profilePatch))), "cordis.patch.yml")];
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
	try {
		return require.resolve(`${packageName}/skin.json`);
	} catch {
		try {
			const packageJson = require.resolve(`${packageName}/package.json`);
			const candidate = join(dirname(packageJson), "skin.json");
			return existsSync(candidate) ? candidate : null;
		} catch {
			const candidate = join(dirname(profileManifest), "node_modules", ...packageName.split("/"), "skin.json");
			return existsSync(candidate) ? candidate : null;
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
		package: packageName,
		wiringId,
		bodyAttr,
		order: typeof manifest.order === "number" && Number.isFinite(manifest.order) ? manifest.order : 100
	};
}
/** Discover every installed package that exposes a valid skin.json manifest. */
function discoverInstalledSkins(profilePatch = resolveProfilePatch()) {
	const profileManifest = join(dirname(profilePatch), "package.json");
	const found = [];
	const ids = /* @__PURE__ */ new Set();
	const wiringIds = /* @__PURE__ */ new Set();
	for (const packageName of packageNames(profileManifest)) {
		const path = skinManifestPath(profileManifest, packageName);
		if (path === null) continue;
		try {
			const entry = catalogEntry(JSON.parse(readFileSync(path, "utf8")), packageName);
			if (entry === null || ids.has(entry.id) || wiringIds.has(entry.wiringId)) continue;
			ids.add(entry.id);
			wiringIds.add(entry.wiringId);
			found.push(entry);
		} catch {}
	}
	return found.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}
/** Remove exactly one manager-owned block while preserving all user YAML. */
function stripManagedBlock(source) {
	const start = source.indexOf(MANAGED_START);
	if (start < 0) return source;
	const end = source.indexOf(MANAGED_END, start);
	if (end < 0) throw new Error("managed-section-is-incomplete");
	return [source.slice(0, start).replace(/[ \t]+$/gm, "").replace(/\s+$/, ""), source.slice(end + 30).replace(/^\s+/, "")].filter(Boolean).join("\n\n");
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
	const stripped = stripManagedBlock(source).replace(/\s+$/, "");
	const lines = stripped.split(/\r?\n/);
	const yamlLines = lines.filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"));
	const unmanaged = yamlLines.length === 1 && yamlLines[0].trim() === "[]" ? lines.filter((line) => line.trim() !== "[]").join("\n").replace(/\s+$/, "") : stripped;
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
function makeSkinManagerRoute(catalogProvider = () => discoverInstalledSkins(), applyTarget = (target, catalog) => useSkin(target, resolvePatchTargets(), catalog)) {
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
						skins: catalog
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
				const target = typeof body === "object" && body !== null ? body.target : void 0;
				if (target !== "official" && !catalog.some((skin) => skin.id === target)) throw new Error("invalid-skin-target");
				applyTarget(target, catalog);
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
	ctx.effect(() => {
		try {
			ensureSafeInitialState();
		} catch (error) {
			console.error("[skin-manager] failed to enforce startup mutual exclusion", error);
		}
		return ctx.webServer.register(makeSkinManagerRoute());
	}, "ui-skin-manager: startup guard and catalog/activation route");
}
//#endregion
export { MANAGED_END, MANAGED_START, SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SKIN_MANAGER_ROUTE, SkinAttributeProjector, apply, discoverInstalledSkins, enabledSkins, ensureSafeInitialState, exposeSkinCustomization, inject, makeSkinManagerRoute, name, readSkinStates, renderManagedBlock, resolvePatchTargets, resolveProfilePatch, stripManagedBlock, switchPatch, useSkin };
