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
	"06eaf23edd8d5efcf8dfd2ff573307d92ad4422f4a5c022064e9659d34258b8d.png",
	"1183d4d3a2b122078d09b1d9c97e085696ae214694399f14ce407fc21d8f1ec1.webp",
	"24f2fb04ce2d38574a3817f6d675b8c1ee5d9322588eec651271f67aabfcb48d.webp",
	"2789906568a926c4cf8c4a5639b1566e0eaf55ab947756839bdfd6a8d6354d92.png",
	"2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp",
	"3135deb5d14d3ea44940edcf296ba2ffa14e242d5342a1a94618df0c57979482.webp",
	"3d2b126caf0549c2e86684dcbc0ff4443b887e5e1684190710d2df7940466d98.webp",
	"3d7e6d87938275bb735ecf980c2bbc3392893131e3b5aa594cf96f98cb00703e.webp",
	"405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp",
	"4386aee80ebaa41f926096ae9e0378b08dbd3eaaa2ad6646ff8f50a3f480a7a9.webp",
	"47072d2d652f09e857dbc8555ff5c1917c926ef5d4581641f7018b1607c42fda.webp",
	"52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp",
	"55f08096101b735ac656bcc4776dac8fb225f4b43bbc35b82aeda2cb33218355.webp",
	"70152698b4ffa11ce3d5ebb11373cb86222a68971222baf917f45f7ae2da9ef4.webp",
	"707f05bf4abed25405ca45c5c32bcf95ab7cb3a6dae3e53da29f814a8495665c.webp",
	"7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp",
	"944d281c6d6bb8e3b92ef682b95e107093bb8c4ba2c63e247dd615750d613ed1.webp",
	"98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp",
	"98f0e13da2ecb0913739d6fbe83026b66746263a9c1dab006ef1b73279b7d8de.png",
	"ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp",
	"b59aa9d4ecfbbae6e62d872c964bce8ec870ed500e7cbc7a7f02bbdd0b93e87e.webp",
	"c033e0ef8cca6b516489f4e2aab05dac758c54ea3cf20f246412f08735c2d7fc.png",
	"c433e0bc2e5a36cc0022eb05150691986b5086b749ceacc556ab71359438d5c4.png",
	"cbc563ce4d9d0c299eda0acce30ba34b811cc4ac6d4abcf0e2ea066e69278ff5.webp",
	"cd728ce5c1794ec4958ef75c4cdd60a3d513b871bea99e3b526656f14089fd74.webp",
	"dcf64a43ad6b9e71c24c91fb9b1d7fe8af534497fd421213472bea96e6bc04b5.webp",
	"e2b04c3eca1871c5e73417674582a09b13de60119ca9bb9c112317232c5049fa.webp",
	"e49115f3942ea5c5034c81016c61944b5261c8ea410318cb0419b445c990b063.webp",
	"fa6d49a717c04651fd7d1afb30b853f63cbaa5bf483e58cb4bfe5ef69fc6ff50.webp",
	"fc8e6b17bad9088221f79733bd9da97a2ca78387bac1132518f4408dbca43f34.webp",
	"fe8e1db21924622a0a3a38bd8fde3197d0f0ef2ba2b48c4665f5569013cd4f1d.png"
];
//#endregion
//#region src/index.ts
/** Serve only this package's immutable presentation assets while the skin is enabled. */
function apply(ctx) {
	installSkinAssets(ctx, "maid-atelier", new URL("../assets/runtime/", import.meta.url), manifest_default);
}
//#endregion
export { apply };
