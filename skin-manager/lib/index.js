import { SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SkinAttributeProjector, exposeSkinCustomization } from "./protocol.js";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
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
		...typeof manifest.dshCompatibility === "string" && /^\d+\.\d+\.\d+rc\d+$/.test(manifest.dshCompatibility) ? { dshCompatibility: manifest.dshCompatibility } : {},
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
/** Same validation walk as {@link discoverInstalledSkins}, mapped to package directories. */
function discoverSkinDirectories(profilePatch = resolveProfilePatch()) {
	const profileManifest = join(dirname(profilePatch), "package.json");
	const dirs = /* @__PURE__ */ new Map();
	const wiringIds = /* @__PURE__ */ new Set();
	for (const packageName of packageNames(profileManifest)) {
		const path = skinManifestPath(profileManifest, packageName);
		if (path === null) continue;
		try {
			const entry = catalogEntry(JSON.parse(readFileSync(path, "utf8")), packageName);
			if (entry === null || dirs.has(entry.id) || wiringIds.has(entry.wiringId)) continue;
			wiringIds.add(entry.wiringId);
			dirs.set(entry.id, dirname(path));
		} catch {}
	}
	return dirs;
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
	const repository = typeof meta.repository === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(meta.repository) ? meta.repository : null;
	const path = typeof meta.path === "string" && /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/.test(meta.path) ? meta.path.replaceAll("\\", "/").replace(/^\.\//, "") : null;
	if (meta.schema !== 1 || fingerprint === null || repository === null || path === null || path === "") return null;
	return {
		fingerprint,
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
		baseRef: null,
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
		case "behind": return "update-available";
		case "ahead": return "local-ahead";
		case "diverged": return "diverged";
		case "identical": return "up-to-date";
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
	else if (installed.source === "build") state = buildSame ? "up-to-date" : "update-available";
	else try {
		const status = await deps.compareCommit(repo, installed.baseRef, branch);
		state = classifyUpdate(status, buildSame);
		if (state === "unknown" && status !== "identical") note = "远端提交无法证明是已安装版本的后继（远端状态 unknown），不判定为更新";
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
function makeSkinManagerRoute(catalogProvider = () => discoverInstalledSkins(), applyTarget = (target, catalog) => useSkin(target, resolvePatchTargets(), catalog), dirProvider = () => /* @__PURE__ */ new Map()) {
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
				if (action === "versions") {
					json(res, 200, {
						ok: true,
						versions: await rows(dirProvider(), cachedCheck)
					});
					return;
				}
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
		return ctx.webServer.register(makeSkinManagerRoute(void 0, void 0, () => discoverSkinDirectories()));
	}, "ui-skin-manager: startup guard and catalog/activation route");
}
//#endregion
export { MANAGED_END, MANAGED_START, SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SKIN_MANAGER_ROUTE, SkinAttributeProjector, apply, classifyUpdate, computeSkinFingerprint, discoverInstalledSkins, discoverSkinDirectories, enabledSkins, ensureSafeInitialState, exposeSkinCustomization, inject, inspectInstalledVersion, inspectSkinVersion, makeSkinManagerRoute, name, parseGitHubRemote, readSkinBuildMeta, readSkinStates, renderManagedBlock, repositoryRelativePath, resolvePatchTargets, resolveProfilePatch, stripManagedBlock, switchPatch, useSkin };
