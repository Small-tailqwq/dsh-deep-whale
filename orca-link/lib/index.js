import { readFile } from "node:fs/promises";
//#region ../shared/skin-assets.ts
/** Public, immutable artwork only. Paths come from the shipped allowlist, never from disk traversal. */
function installSkinAssets(ctx, id, directory, files) {
	const prefix = `/skin-assets/${id}`;
	const allowed = new Set(files);
	ctx.inject(["webServer"], (webCtx) => {
		const server = webCtx.get("webServer");
		webCtx.effect(() => server.register({
			kind: "prefix",
			path: prefix,
			handler: async (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405, { Allow: "GET, HEAD" }).end();
					return;
				}
				const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
				const file = pathname.slice(prefix.length + 1);
				if (!pathname.startsWith(`${prefix}/`) || !allowed.has(file) || !/^[a-f0-9]{64}\.(png|webp)$/.test(file)) {
					res.writeHead(404).end();
					return;
				}
				let bytes;
				try {
					bytes = await readFile(new URL(file, directory));
				} catch (error) {
					if (error.code !== "ENOENT") throw error;
					res.writeHead(404).end();
					return;
				}
				const etag = `"${file.split(".")[0]}"`;
				const headers = {
					"Content-Type": file.endsWith(".webp") ? "image/webp" : "image/png",
					"Cache-Control": "public, max-age=31536000, immutable",
					"X-Content-Type-Options": "nosniff",
					ETag: etag
				};
				if (req.headers["if-none-match"]?.split(",").some((value) => value.trim().replace(/^W\//, "") === etag || value.trim() === "*")) {
					res.writeHead(304, headers).end();
					return;
				}
				res.writeHead(200, {
					...headers,
					"Content-Length": bytes.length
				});
				res.end(req.method === "HEAD" ? void 0 : bytes);
			}
		}), `${id}: packaged artwork`);
	});
}
//#endregion
//#region assets/runtime/manifest.json
var manifest_default = [
	"06b4f9ef930386c38d4daa2c264d600bec188f58199b5b34002ecb30c7cd1962.png",
	"0ba862962a5560db2691e9bfb2a925be549f2c23c88c660769bd9d867189f0f2.webp",
	"1d63b2ee2d7e70678527d58d65ae382d41b2af878886e97f86002c57e313e416.png",
	"3605bdd7ccfcc75ca78558f2c958bb3bb35e544cc705f5c15c3653ca21a274d5.webp",
	"5affe6ca90a22227bc020914e4b9d4dc8913a336ffc4a76e17f5b715fa2e0086.webp",
	"6c4d6705e9fca5ac1f0d7a6b3b113dab157e8123d21cea53a2c399106b4f0239.webp",
	"8e35ddb65f30bb23fcc7752cf5b92b2a1d958b93779eb607f878e0510e1affd9.webp",
	"905f86159587cb4f168fdc78dac8ac8b53e3271d829f78878ddb0c81d0e33747.webp",
	"9527647570513378137c59775582e9c26ffe15c128b76886fcd21bfddb6f60a2.webp",
	"a0779005d2d849767e22ba4eef0c76e6b16dbf9a49a55b0114d4f7af35f48c7d.webp",
	"d5fdfd91306d2f3aaa766674d5994be4a014c4dd083d6afd7f90b4947bba6802.webp"
];
//#endregion
//#region src/index.ts
/** Serve only this package's immutable presentation assets while the skin is enabled. */
function apply(ctx) {
	installSkinAssets(ctx, "orca-link", new URL("../assets/runtime/", import.meta.url), manifest_default);
}
//#endregion
export { apply };
