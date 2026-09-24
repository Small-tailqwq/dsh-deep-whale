window.__ModuleLoader__.load({
	id: "@smalltailqwq/dsh-client-ui-skin-maid-atelier",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/asset-url.ts
		/** Resolve against the host base, including reverse-proxy mounts and dsh-app desktop forwarding. */
		function skinAssetUrl(file) {
			return new URL(`skin-assets/maid-atelier/${file}`, document.baseURI).href;
		}
		//#endregion
		//#region src/client/art.ts
		/**
		* Generated sidebar and ornamental raster assets. The full-viewport day and
		* night backgrounds are generated separately from the source PNG files.
		*/
		const MAID_ATELIER_CHIBI = skinAssetUrl("405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp");
		skinAssetUrl("fc8e6b17bad9088221f79733bd9da97a2ca78387bac1132518f4408dbca43f34.webp");
		const MAID_ATELIER_BOW_CLEAN = skinAssetUrl("dcf64a43ad6b9e71c24c91fb9b1d7fe8af534497fd421213472bea96e6bc04b5.webp");
		/** Raster porcelain-and-filigree plate for the live new-session control. */
		const MAID_ATELIER_NEW_SESSION = skinAssetUrl("fa6d49a717c04651fd7d1afb30b853f63cbaa5bf483e58cb4bfe5ef69fc6ff50.webp");
		/** Raster lower-sidebar panel framing the live Plan control. */
		/** Hollow raster frame laid over the live composer controls. */
		/** Transparent U-shaped lace-and-bow ornament above the live Plan button. */
		const MAID_ATELIER_SIDEBAR_SWAG = skinAssetUrl("cd728ce5c1794ec4958ef75c4cdd60a3d513b871bea99e3b526656f14089fd74.webp");
		/** Continuous navy, gold, and lace strip for the global top edge. */
		const MAID_ATELIER_TOP_TRIM_TILE = skinAssetUrl("e49115f3942ea5c5034c81016c61944b5261c8ea410318cb0419b445c990b063.webp");
		/** Raster whale crop used as the skin favicon. */
		//#endregion
		//#region src/client/background-art.generated.ts
		/**
		* Generated palace backdrops and independent character layers. Run
		* `pnpm run generate:backgrounds` after replacing any source PNG.
		*/
		const MAID_ATELIER_PALACE_LIGHT = skinAssetUrl("52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp");
		const MAID_ATELIER_PALACE_DARK = skinAssetUrl("ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp");
		const MAID_ATELIER_MAID_LEFT = skinAssetUrl("2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp");
		const MAID_ATELIER_MAID_RIGHT = skinAssetUrl("7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp");
		//#endregion
		//#region src/client/composer-art.generated.ts
		/**
		* Generated composer chrome artwork shipped in the skin package.
		*/
		const MAID_ATELIER_COMPOSER_FRAME_SHELL = skinAssetUrl("cbc563ce4d9d0c299eda0acce30ba34b811cc4ac6d4abcf0e2ea066e69278ff5.webp");
		const MAID_ATELIER_COMPOSER_RIBBON_LEFT_CAP = skinAssetUrl("70152698b4ffa11ce3d5ebb11373cb86222a68971222baf917f45f7ae2da9ef4.webp");
		const MAID_ATELIER_COMPOSER_RIBBON_LEFT_FILL = skinAssetUrl("3d7e6d87938275bb735ecf980c2bbc3392893131e3b5aa594cf96f98cb00703e.webp");
		const MAID_ATELIER_COMPOSER_RIBBON_RIGHT_FILL = skinAssetUrl("55f08096101b735ac656bcc4776dac8fb225f4b43bbc35b82aeda2cb33218355.webp");
		const MAID_ATELIER_COMPOSER_RIBBON_RIGHT_CAP = skinAssetUrl("944d281c6d6bb8e3b92ef682b95e107093bb8c4ba2c63e247dd615750d613ed1.webp");
		const MAID_ATELIER_COMPOSER_LACE_TILE = skinAssetUrl("2789906568a926c4cf8c4a5639b1566e0eaf55ab947756839bdfd6a8d6354d92.png");
		//#endregion
		//#region src/client/vision-art.generated.ts
		/**
		* Generated V4 Flash Vision character layer. Rebuild from the committed WebP asset.
		*/
		const MAID_ATELIER_MAID_RIGHT_VISION = skinAssetUrl("98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp");
		//#endregion
		//#region src/client/chrome-art.generated.ts
		/**
		* Generated viewport chrome artwork. Run
		* `pnpm run generate:backgrounds` after replacing either source PNG.
		*/
		const MAID_ATELIER_BOTTOM_TRIM_TILE = skinAssetUrl("47072d2d652f09e857dbc8555ff5c1917c926ef5d4581641f7018b1607c42fda.webp");
		const MAID_ATELIER_BOTTOM_CREST = skinAssetUrl("24f2fb04ce2d38574a3817f6d675b8c1ee5d9322588eec651271f67aabfcb48d.webp");
		const MAID_ATELIER_SIDEBAR_CORNER = skinAssetUrl("707f05bf4abed25405ca45c5c32bcf95ab7cb3a6dae3e53da29f814a8495665c.webp");
		skinAssetUrl("3135deb5d14d3ea44940edcf296ba2ffa14e242d5342a1a94618df0c57979482.webp");
		const MAID_ATELIER_SETTINGS_FRAME = skinAssetUrl("3d2b126caf0549c2e86684dcbc0ff4443b887e5e1684190710d2df7940466d98.webp");
		//#endregion
		//#region src/client/workspace-art.generated.ts
		/**
		* Generated workspace navigation artwork. Run
		* `pnpm run generate:backgrounds` after replacing either source PNG.
		*/
		const MAID_ATELIER_WORKSPACE_SHIELD = skinAssetUrl("b59aa9d4ecfbbae6e62d872c964bce8ec870ed500e7cbc7a7f02bbdd0b93e87e.webp");
		const MAID_ATELIER_WORKSPACE_RIBBON = skinAssetUrl("e2b04c3eca1871c5e73417674582a09b13de60119ca9bb9c112317232c5049fa.webp");
		//#endregion
		//#region \0dsh-css:src/client/maid-atelier.module.css.mjs
		const css$1 = "body[data-dsh-maid-atelier]{color:#172347;--maid-navy-950:#091333;--maid-navy-900:#10204d;--maid-navy-800:#1c326b;--maid-indigo:#526aa8;--maid-periwinkle:#8ea5da;--maid-porcelain:#f8f6f0;--maid-gold:#c5a468;--maid-gold-soft:#e2cfaa;--maid-ink:#172347;--maid-glass:#f8faffad;--maid-shadow:0 18px 54px #0f1e4833, 0 2px 8px #0f1e481f;--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:#f8faffb8;--dsw-alias-bg-layer-2:#ebf0fad6;--dsw-alias-bg-layer-3:#e0e7f6e0;--dsw-alias-bg-overlay:#f8fafff5;--dsw-alias-border-l1:#475b912e;--dsw-alias-border-l2-darkmode-thin:#475b9140;--dsw-alias-border-l2:#475b914d;--dsw-alias-border-l3:#c5a468a3;--dsw-alias-brand-primary:#526aa8;--dsw-alias-brand-text:#172347;--dsw-alias-button-elevated-fill:#fffdf8e0;--dsw-alias-button-floating-fill:#fffdf8f0;--dsw-alias-button-floating-hover:#ece6d8;--dsw-alias-button-info-fill:#536eae;--dsw-alias-button-info-hover:#405a99;--dsw-alias-interactive-bg-active:#c5a4683d;--dsw-alias-interactive-bg-hover:#677eb71f;--dsw-alias-interactive-bg-hover-solid:#e2e8f5;--dsw-alias-label-primary:#172347;--dsw-alias-label-primary-bluish:#243866;--dsw-alias-label-secondary:#4d5d7f;--dsw-alias-label-tertiary:#6f7c99;--dsw-alias-label-caption:#8a94aa;--dsw-alias-state-business-primary:#536eae;--dsw-alias-state-business-tertiary:#e1e7f5;--dsw-shadow-lv2:var(--maid-shadow);--dsw-specific-input-major:#fffdf8d1;--dsw-specific-selector:#e2e8f6e6;--dsw-specific-sidebar-fill:#0b1942e0;background-color:#dce6f5}body[data-dsh-maid-atelier][data-ds-dark-theme]{color:#e5eaf6;--maid-glass:#0d193bbd;--maid-shadow:0 18px 58px #00000061, 0 2px 10px #0000004d;--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:#121f43e6;--dsw-alias-bg-layer-2:#182850eb;--dsw-alias-bg-layer-3:#20315bf0;--dsw-alias-bg-overlay:#0d193bf7;--dsw-alias-border-l1:#97a9d833;--dsw-alias-border-l2-darkmode-thin:#97a9d84d;--dsw-alias-border-l2:#97a9d857;--dsw-alias-border-l3:#d3b477a8;--dsw-alias-brand-primary:#9bb0e1;--dsw-alias-brand-text:#e7ecf7;--dsw-alias-button-elevated-fill:#1c2c54f0;--dsw-alias-button-floating-fill:#1f315cf5;--dsw-alias-button-floating-hover:#354d88;--dsw-alias-button-info-fill:#8ca4dc;--dsw-alias-button-info-hover:#a3b7e5;--dsw-alias-interactive-bg-active:#d3b4773d;--dsw-alias-interactive-bg-hover:#a4b7e524;--dsw-alias-interactive-bg-hover-solid:#293f78;--dsw-alias-label-primary:#e7ecf7;--dsw-alias-label-primary-bluish:#d5dff3;--dsw-alias-label-secondary:#bdc9e3;--dsw-alias-label-tertiary:#96a6c9;--dsw-alias-label-caption:#7f90b4;--dsw-alias-state-business-primary:#9bb0e1;--dsw-alias-state-business-tertiary:#293d73;--dsw-specific-input-major:#111e42e0;--dsw-specific-selector:#2d406fe6;--dsw-specific-sidebar-fill:#050d28e6;background-color:#080f27}body[data-dsh-maid-atelier] [id=root]{background:0 0;position:relative}body[data-dsh-maid-atelier] [data-shell-overlay]{z-index:1000}body[data-dsh-maid-atelier] [data-shell-leading]{z-index:22}body[data-dsh-maid-atelier] [data-skin-chrome=character-stage]{z-index:0;pointer-events:none;contain:strict;background:var(--maid-palace-art) center / cover no-repeat;position:absolute;inset:0;overflow:hidden}body[data-dsh-maid-atelier] :is([data-pane=conversation],[class*=centerCol]),body[data-dsh-maid-atelier] :is([data-pane=conversation],[class*=centerCol]) :is([data-phase=hero],[data-phase=active],[data-phase=settling]){position:relative}body[data-dsh-maid-atelier] [data-maid-character]{z-index:1;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 20px 24px #1b2c5b24);width:auto;max-width:none;transition:translate .62s cubic-bezier(.22,.78,.2,1),bottom .62s cubic-bezier(.22,.78,.2,1),height .62s cubic-bezier(.22,.78,.2,1),opacity .42s;display:block;position:absolute}body[data-dsh-maid-atelier] [data-maid-character=left]{height:96%;bottom:0;left:clamp(8px,1.5%,24px)}body[data-dsh-maid-atelier] :is([data-maid-character=right],[data-maid-character=vision]){height:92%;bottom:0;right:clamp(8px,1.5%,24px)}body[data-dsh-maid-atelier] [data-maid-character=vision]{opacity:0;visibility:hidden}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-character]{filter:brightness(.84)saturate(.92)drop-shadow(0 22px 28px #0000004d)}body[data-dsh-maid-atelier][data-maid-chat-active] [data-maid-character=left]{opacity:.9;height:64%}body[data-dsh-maid-atelier][data-maid-chat-active] :is([data-maid-character=right],[data-maid-character=vision]){opacity:.9;height:62%}@media (width<=1080px){body[data-dsh-maid-atelier] [data-maid-character]{opacity:.74}}@media (width<=700px){html[data-dsh-whale-maid-model-exit=enabled] body[data-dsh-maid-atelier] [data-maid-character]{max-width:calc(100% - 48px)}body[data-dsh-maid-atelier][data-maid-chat-active] [data-maid-character=left]{height:46%}body[data-dsh-maid-atelier][data-maid-chat-active] :is([data-maid-character=right],[data-maid-character=vision]){height:44%}}@media (width<=700px) and (orientation:portrait){body[data-dsh-maid-atelier]:not([data-maid-conversation-active]) [data-maid-character]{opacity:.66;height:62%}}body[data-dsh-maid-atelier][data-maid-layout-resizing] [data-maid-character]{filter:none;transition:none}body[data-dsh-maid-atelier][data-maid-low-power] [data-maid-character]{filter:none;transition:opacity .18s}html[data-dsh-whale-maid-art=hidden] body[data-dsh-maid-atelier] [data-maid-character]{visibility:hidden;opacity:0!important}html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=pro] body[data-dsh-maid-atelier] :is([data-maid-character=right],[data-maid-character=vision]){opacity:0;translate:100vw}html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash] body[data-dsh-maid-atelier] [data-maid-character=left]{opacity:0;translate:-100vw}html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash][data-dsh-whale-maid-flash-glasses=on] body[data-dsh-maid-atelier] :is([data-maid-character=left],[data-maid-character=right]){opacity:0;visibility:hidden}html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash][data-dsh-whale-maid-flash-glasses=on] body[data-dsh-maid-atelier] [data-maid-character=vision]{opacity:1;visibility:visible}@media (width<=700px){html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model] body[data-dsh-maid-atelier] [data-maid-character]{opacity:0;visibility:hidden;transition:opacity .24s,visibility 0s linear .24s;translate:none}html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=pro] body[data-dsh-maid-atelier] [data-maid-character=left],html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash] body[data-dsh-maid-atelier] [data-maid-character=right],html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash][data-dsh-whale-maid-flash-glasses=on] body[data-dsh-maid-atelier] [data-maid-character=vision]{opacity:1;visibility:visible;transition-delay:0s}}@media (width<=700px) and (prefers-reduced-motion:reduce){html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model] body[data-dsh-maid-atelier] [data-maid-character]{transition:none}}body[data-dsh-maid-atelier] [data-skin-chrome=top-trim]{z-index:1;pointer-events:none;contain:paint;height:76px;position:absolute;inset:0 0 auto;overflow:hidden}body[data-dsh-maid-atelier] [data-skin-trim-layer]{transition:transform .52s cubic-bezier(.4,0,.2,1);position:absolute;inset:0}body[data-dsh-maid-atelier] [data-skin-trim-layer=landing]{background:var(--maid-top-trim-art) left -2px / auto 51px repeat-x;height:48px;transform:translateY(0)}body[data-dsh-maid-atelier] [data-skin-trim-layer=workspace]{background:var(--maid-top-trim-art) left -4px / auto 149px repeat-x;height:76px;transform:translateY(-100%)}body[data-dsh-maid-atelier][data-maid-workspace] [data-skin-trim-layer=landing]{transform:translateY(-100%)}body[data-dsh-maid-atelier][data-maid-workspace] [data-skin-trim-layer=workspace]{transform:translateY(0)}body[data-dsh-maid-atelier][data-maid-composer-motion] [data-skin-trim-layer]{will-change:transform}body[data-dsh-maid-atelier] [data-skin-trim-layer=landing]:after{content:\"\";background:var(--maid-bow-art) center / contain no-repeat;filter:drop-shadow(0 3px 6px #040b2352);width:80px;height:42px;position:absolute;top:-1px;left:calc(50% - 4px);transform:translate(-50%)}body[data-dsh-maid-atelier] [data-skin-chrome=bottom-trim]{opacity:1;z-index:1;pointer-events:none;background:var(--maid-bottom-trim-art) left bottom / auto 30px repeat-x;contain:paint;height:60px;transition:transform .52s cubic-bezier(.22,.78,.2,1),opacity .16s ease-out;position:absolute;inset:auto 0 0;transform:translateY(0)}body[data-dsh-maid-atelier][data-maid-conversation-active] [data-skin-chrome=bottom-trim]{opacity:0;transform:translateY(100%)}body[data-dsh-maid-atelier][data-maid-composer-motion] [data-skin-chrome=bottom-trim]{will-change:transform}body[data-dsh-maid-atelier] [data-skin-chrome=bottom-trim]:after{content:\"\";background:var(--maid-bottom-crest-art) center / contain no-repeat;filter:drop-shadow(0 3px 6px #040b2357);width:94px;height:54px;position:absolute;bottom:0;left:calc(50% - 4px);transform:translate(-50%)}body[data-dsh-maid-atelier] header:has([role=tablist]){z-index:21;border-bottom:0;animation:.32s .11s backwards ahFhLW_maidAtelierWorkspaceHeaderEnter;position:relative}@keyframes ahFhLW_maidAtelierWorkspaceHeaderEnter{0%{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){body[data-dsh-maid-atelier] [data-skin-trim-layer],body[data-dsh-maid-atelier] [data-skin-chrome=top-trim],body[data-dsh-maid-atelier] [data-skin-chrome=bottom-trim]{transition:none}body[data-dsh-maid-atelier] header:has([role=tablist]),body[data-dsh-maid-atelier] [data-maid-workspace-active]:before,body[data-dsh-maid-atelier] [data-maid-workspace-active]>[class*=folder],body[data-dsh-maid-atelier] [data-maid-workspace-active] [class*=projectText]{animation:none}}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header{z-index:21;color:#f8f3e8;text-shadow:0 1px 3px #040b238c;position:relative}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header button:not(:where([role=dialog] *,[role=menu] *,[data-radix-popper-content-wrapper] *)){text-shadow:inherit}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header button:not(:where([role=dialog] *,[role=menu] *,[data-radix-popper-content-wrapper] *)):not([role=tab]):hover{color:var(--maid-gold-soft)}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header button:not(:where([role=dialog] *,[role=menu] *,[data-radix-popper-content-wrapper] *)):not([role=tab]):focus-visible{outline-offset:2px;border-radius:4px;outline:1px solid #ebcc8fdb;box-shadow:0 0 0 2px #061130ad}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header>[data-slot=\"conversation.session.header\"]>[role=tablist]>button[role=tab]{color:#d7def0}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header>[data-slot=\"conversation.session.header\"]>[role=tablist]>button[role=tab][aria-selected=true]{color:#fff7e6}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header>[data-slot=\"conversation.session.header\"]>[role=tablist]>button[role=tab][aria-selected=true]:after{background:var(--maid-gold);box-shadow:0 0 8px #ebcc8f73}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header [class*=reroll]:not(:where([role=dialog] *,[role=menu] *,[data-radix-popper-content-wrapper] *)){background:#fffcf314;border-color:#e1bf7c8c}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]){--dsw-alias-label-primary:#f8f3e8;--dsw-alias-label-secondary:#d7def0;--dsw-alias-label-tertiary:#b5c1dd;--dsw-alias-label-caption:#96a8ce;--dsw-alias-border-l1:#e1cfaa33;--dsw-alias-border-l2:#e1cfaa52;--dsw-alias-button-elevated-fill:#fffcf321;--dsw-alias-button-floating-hover:#fffcf32e;--dsw-alias-scrollbar-bg-l2:#cdae6f94;--dsw-alias-scrollbar-hover-l2:#e8c77f;--dsw-alias-interactive-bg-hover:#fffcf31a;--dsw-alias-interactive-bg-active:#c5a4684d;z-index:auto;background:#0a173b;border-right:0;position:relative;box-shadow:8px 0 34px #08113038,inset -1px 0 #fff5d7d1,inset -3px 0 #e2cfa6b8}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div{isolation:auto;background:radial-gradient(circle at 50% 14%,#5b77bc3b,#0000 31%),linear-gradient(#102456f7,#050e2bf5),repeating-linear-gradient(135deg,#ffffff07 0 1px,#0000 1px 7px);position:relative;overflow:hidden;box-shadow:inset 9px 0 16px #ffffff05,inset -8px 0 18px #00000042}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div:before{content:\"\";z-index:0;pointer-events:none;background:0 0;border:0;position:absolute;inset:9px 7px 0}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div>:not([data-skin-chrome=sidebar-mascot],[data-skin-chrome=sidebar-corners],[role=tooltip]){z-index:2;position:relative}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div>:has([role=tooltip]){z-index:auto}body[data-dsh-maid-atelier] [data-skin-chrome=sidebar-corners]{--maid-sidebar-frame-line-x:1.35px;--maid-sidebar-frame-line-y:1.25px;z-index:4;background:linear-gradient(90deg, #eed299f0, #be914bf5, #eed299f0) left 62px top 8.875px / calc(100% - 124px) var(--maid-sidebar-frame-line-y) no-repeat, linear-gradient(90deg, #eed299f0, #be914bf5, #eed299f0) left 62px bottom 8.875px / calc(100% - 124px) var(--maid-sidebar-frame-line-y) no-repeat, linear-gradient(180deg, #eed299f0, #be914bf5, #eed299f0) left 8.05px top 62px / var(--maid-sidebar-frame-line-x) calc(100% - 124px) no-repeat, linear-gradient(180deg, #eed299f0, #be914bf5, #eed299f0) right 8.05px top 62px / var(--maid-sidebar-frame-line-x) calc(100% - 124px) no-repeat;pointer-events:none;position:absolute;inset:0}body[data-dsh-maid-atelier] [data-skin-chrome=sidebar-corners]>[data-skin-corner]{background:var(--maid-sidebar-corner-art) top right / 130px 130px no-repeat;filter:drop-shadow(0 1px 1px #0207186b);transform-origin:50%;width:62px;height:62px;position:absolute}body[data-dsh-maid-atelier] [data-skin-corner=top-left]{top:1px;left:1px;transform:scaleX(-1)}body[data-dsh-maid-atelier] [data-skin-corner=top-right]{top:1px;right:1px}body[data-dsh-maid-atelier] [data-skin-corner=bottom-right]{bottom:1px;right:1px;transform:scaleY(-1)}body[data-dsh-maid-atelier] [data-skin-corner=bottom-left]{bottom:1px;left:1px;transform:scale(-1)}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=fade]{background:0 0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.workspaces] [class*=treeBody]>[class*=list]{padding-bottom:var(--maid-sidebar-swag-height);mask-image:linear-gradient(#000,#000),radial-gradient(75% 100% at 50% 0,#000 70%,#0000 100%);mask-size:100% max(0px, calc(100% - var(--maid-sidebar-swag-height))), 100% min(100%, var(--maid-sidebar-swag-height));mask-position:top,bottom;mask-repeat:no-repeat}body[data-dsh-maid-atelier] [data-skin-chrome=sidebar-mascot]{left:52%;bottom:calc(var(--maid-sidebar-swag-height) + 94px);z-index:0;width:var(--maid-sidebar-mascot-width);object-fit:contain;object-position:center bottom;pointer-events:none;opacity:.92;filter:saturate()brightness(1.08)contrast(1.04)drop-shadow(0 5px 12px #0207183d);height:auto;max-height:38%;position:absolute;transform:translate(-50%)translateZ(0)}body[data-dsh-maid-atelier] :is([data-pane=conversation],[class*=centerCol]){background:0 0}body[data-dsh-maid-atelier] :is([data-pane=details],[class*=detailsCol]){background:#f2f6fdd1;border-left-color:#c5a46885}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-pane=details],[class*=detailsCol]){background:#0b1737e6}body[data-dsh-maid-atelier] [class*=logoRow]{background:linear-gradient(135deg,#5c77bb42,#0000 44%),linear-gradient(#12285cfa,#071236fa);border:1px solid #e2cfaab8;border-radius:8px;min-height:60px;margin:8px 8px 0;padding:8px 8px 10px;box-shadow:inset 0 0 0 2px #081233e0,inset 0 0 0 3px #c5a46833,0 7px 18px #02071947}body[data-dsh-maid-atelier] button[class*=brand]{color:#f3e3c0;--dsw-alias-label-primary-inverted:#10204d}body[data-dsh-maid-atelier] button[class*=brand]>svg{filter:drop-shadow(0 1px 2px #02081cb8);flex:none;width:min(182px,100%);height:auto;transition:color .15s,filter .15s;display:block;overflow:visible}body[data-dsh-maid-atelier] button[class*=brand]>svg>rect{fill:#d7b46a;transition:fill .15s}body[data-dsh-maid-atelier] button[class*=brand]:is(:hover,:focus-visible)>svg{color:#fff4d9;filter:drop-shadow(0 1px 3px #02081cd1)}body[data-dsh-maid-atelier] button[class*=brand]:is(:hover,:focus-visible)>svg>rect{fill:#e6c77e}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-skin-chrome=sidebar-corners],body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-skin-chrome=sidebar-mascot]{display:none}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [class*=logoRow]{min-height:54px;box-shadow:none;background:0 0;border:0;border-radius:0;justify-content:center;align-items:center;margin:0;padding:7px;display:flex}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [class*=logoRow] [class*=toggle]{corner-shape:round;color:#ebd29e;background:linear-gradient(145deg,#4d67a97a,#071234d1);border:1px solid #e1bf7cc2;border-radius:50%;width:38px;height:38px;box-shadow:inset 0 0 0 2px #050f2dc2,0 3px 10px #01071847}@media (hover:none){body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=root][class*=collapsed] [class*=logoRow] [class*=toggle]:hover [class*=panelIcon]{display:none}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=root][class*=collapsed] [class*=logoRow] [class*=toggle]:hover [class*=railMark]{display:inline-flex}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=root][class*=collapsed] [class*=logoRow] [class*=toggle]:hover{background:0 0}}body[data-dsh-maid-atelier] button[class*=newSession]{box-sizing:border-box;color:#152246;border-style:solid;border-width:0 40px;border-image-source:var(--maid-new-session-art);letter-spacing:.01em;min-height:58px;box-shadow:none;filter:drop-shadow(0 5px 9px #02081c38);background:0 0;border-image-slice:0 210 fill;border-image-width:0 40px;border-image-repeat:stretch;border-radius:0;margin-block:4px 8px;font-family:Georgia,Times New Roman,serif;font-size:16px;font-weight:600;transition:filter .15s,transform .15s}body[data-dsh-maid-atelier] button[class*=newSession]:hover{filter:brightness(1.06)drop-shadow(0 7px 12px #02081c47);transform:translateY(-1px)}body[data-dsh-maid-atelier] button[class*=newSession] svg{color:#24345c;stroke-width:1.8px}body[data-dsh-maid-atelier] [data-maid-sidebar-footer]{box-sizing:border-box;isolation:auto;min-height:calc(var(--maid-sidebar-swag-height) + 82px);padding:calc(var(--maid-sidebar-swag-height) + 2px) 18px 22px;box-shadow:none;background:0 0;border:0;flex:none;position:relative}body[data-dsh-maid-atelier] [data-maid-sidebar-footer]:before{content:\"\";z-index:0;height:var(--maid-sidebar-swag-height);background:var(--maid-sidebar-swag-art) center top / 100% 100% no-repeat;pointer-events:none;filter:brightness(1.1)saturate(1.04)contrast(1.04)drop-shadow(0 4px 9px #02081c42);position:absolute;inset:0 0 auto}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]){z-index:1;color:#f2dfba;border-style:solid;border-width:0 34px;border-image-source:var(--maid-settings-frame-art);letter-spacing:.02em;width:100%;min-height:50px;box-shadow:none;filter:drop-shadow(0 4px 10px #02081c42);background:0 0;border-image-slice:0 220 fill;border-image-width:0 34px;border-image-repeat:stretch;border-radius:0;padding-inline:34px;font-family:Georgia,Times New Roman,serif;transition:color .15s,filter .15s,transform .15s;position:relative}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]){flex:auto;justify-content:center;gap:8px;width:100%;margin-inline:0;position:relative}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]) [data-slot=settings\\.trigger]{line-height:normal}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher]):has(>:is(button[data-phase],[role=status]))>[data-slot=settings\\.launcher]>button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]){border-width:0 28px;border-image-width:0 28px;flex:112px;gap:4px;width:auto;padding-inline:8px}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher])>:is(button[data-phase],[role=status]){box-sizing:border-box;color:#f2d59b;background:linear-gradient(145deg,#4b65a6bd,#071234f0);border:1px solid #e1bf7cc2;border-radius:10px;flex:0 96px;grid-template-columns:14px minmax(0,1fr);min-width:72px;max-width:96px;height:36px;padding-inline:8px;box-shadow:inset 0 0 0 2px #050f2dad,0 3px 9px #0107183d}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher])>:is(button[data-phase],[role=status])>span[aria-hidden=true]+span{min-width:0;overflow:hidden}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher])>:is(button[data-phase],[role=status])>span[aria-hidden=true]+span>span{text-overflow:ellipsis;max-width:100%;overflow:hidden}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher])>button[data-phase]:is(:hover,:focus-visible){color:#fff1ce;outline-offset:2px;background:linear-gradient(145deg,#6281cdd1,#0b1b46fa);border-color:#f4daa4f0;outline:2px solid #f4daa4b8}body[data-dsh-maid-atelier]:not([data-maid-sidebar-size=rail]) [data-maid-sidebar-footer] [data-slot=sidebar\\.settings]>:has(>[data-slot=settings\\.launcher])>[role=status]{color:#c8e4c7;background:linear-gradient(145deg,#336962c7,#072730f0);border-color:#a7d3a7b8}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]):before{content:none}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]):is(:hover,:focus-visible){color:#fff8e8;filter:brightness(1.1)drop-shadow(0 5px 12px #02081c4d);background:0 0;outline:none;transform:translateY(-1px)}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]) svg{color:#e8c77f;filter:drop-shadow(0 1px 2px #0207189e)}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=settings\\.launcher] button[data-collapsed][aria-haspopup=menu]{box-sizing:border-box;color:#f2dfba;background:linear-gradient(145deg,#2c4484bd,#08173beb);border:1px solid #e1bf7c94;border-radius:12px;min-width:0;min-height:42px;box-shadow:inset 0 0 0 2px #050f2da3}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=settings\\.launcher] button[data-collapsed][aria-haspopup=menu]:is(:hover,:focus-visible,[aria-expanded=true]){color:#fff8e8;background:linear-gradient(145deg,#5b77bcb8,#0d1f4cf5);border-color:#f4daa4eb}body[data-dsh-maid-atelier] [data-maid-sidebar-footer] [data-slot=settings\\.launcher] button[data-collapsed=true][aria-haspopup=menu]{corner-shape:round;border-radius:50%;width:36px;height:36px;min-height:36px;padding:0}body[data-dsh-maid-atelier]:is([data-maid-sidebar-size=rail],[data-maid-sidebar-size=narrow]) button[class*=newSession]{border-width:0 32px;letter-spacing:0;border-image-width:0 32px;padding-inline:0;font-size:14px}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] button[class*=newSession]{corner-shape:round;color:#ebd29e;filter:drop-shadow(0 3px 7px #01071842);background:linear-gradient(145deg,#4d67a966,#071234c7);border:1px solid #e1cfaab8;border-image:;border-radius:50%;align-self:center;width:38px;min-width:38px;min-height:38px;margin:6px 0 10px;padding:0;box-shadow:inset 0 0 0 2px #050f2db3}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] button[class*=newSession] svg{color:#efd7a1;stroke-width:1.9px;filter:drop-shadow(0 1px 2px #0107187a)}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=iconButton],[class*=searchButton]):not([class*=toggle]):not([role=dialog] *){corner-shape:round;color:#dfbf7c;background:0 0;border:1px solid #0000;border-radius:50%;width:38px;min-width:38px;height:38px;margin-inline:0}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=iconButton],[class*=searchButton]):not([class*=toggle]):not([role=dialog] *):is(:hover,:focus-visible){color:#fff1ce;background:#5775be47;border-color:#e1bf7cad;outline:none}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-maid-sidebar-footer]{min-height:54px;padding:5px 5px max(12px, env(safe-area-inset-bottom,0px));box-shadow:none;background:0 0;flex-direction:column;flex-basis:auto;justify-content:center;align-items:center;gap:2px;display:flex}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-maid-sidebar-footer]:before{display:none}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]){corner-shape:round;background:linear-gradient(145deg,#4d67a97a,#071234d1);border:1px solid #e1bf7cc2;border-image:;border-radius:50%;width:38px;min-width:38px;min-height:38px;margin:0;padding:0;box-shadow:inset 0 0 0 2px #050f2dc2,0 3px 9px #0107183d}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger]):before{display:none}body[data-dsh-maid-atelier][data-maid-cordis-panel-open] :is([data-pane=sidebar],[class*=sidebarCol])>div>:has([data-cordis-panel]){z-index:40}body[data-dsh-maid-atelier] [data-slot=\"sidebar.footer.action\"]>:has([data-cordis-badge]){width:100%;margin-top:0}body[data-dsh-maid-atelier] [data-slot=conversation\\.header]>header,body[data-dsh-maid-atelier] [data-shell-leading],body[data-dsh-maid-atelier] [data-slot=\"sidebar.footer.action\"]{--dsw-alias-bg-base:#050e2bf5;--dsw-alias-bg-layer-1:#102456f0;--dsw-alias-bg-layer-2:#0b1942f7;--dsw-alias-bg-layer-3:#182850fa;--dsw-alias-bg-overlay:#0d193bfa;--dsw-specific-menu:var(--dsw-alias-bg-layer-3);--dsw-alias-label-primary:#f8f3e8;--dsw-alias-label-primary-bluish:#d5dff3;--dsw-alias-label-secondary:#d7def0;--dsw-alias-label-tertiary:#b5c1dd;--dsw-alias-label-caption:#96a8ce;--dsw-alias-border-l1:#e1cfaa33;--dsw-alias-border-l2:#e1cfaa52;--dsw-alias-interactive-bg-hover:#fffcf31a;--dsw-alias-interactive-bg-active:#c5a4684d;color:var(--dsw-alias-label-primary)}body[data-dsh-maid-atelier] [data-cordis-badge]{color:#f4e3bf;background:linear-gradient(145deg,#2c4484bd,#08173beb);border:1px solid #e1bf7c94;min-height:49px;box-shadow:inset 0 0 0 2px #050f2da3,0 4px 11px #0107183d}body[data-dsh-maid-atelier] [data-cordis-badge]:is(:hover,:focus-visible,[data-active]){color:#fff8e8;background:linear-gradient(145deg,#5b77bcb8,#0d1f4cf5);border-color:#f4daa4eb;outline:none}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [data-cordis-badge]{box-sizing:border-box;corner-shape:round;border-radius:50%;width:36px;min-width:36px;height:36px;min-height:36px;padding:0}body[data-dsh-maid-atelier] [data-cordis-panel]{left:calc(var(--maid-sidebar-width) + 12px);width:min(420px, calc(100vw - var(--maid-sidebar-width) - 24px));min-width:min(300px, calc(100vw - var(--maid-sidebar-width) - 24px));--dsw-alias-bg-base:#e6edfaf5;--dsw-alias-label-primary:#17284f;--dsw-alias-label-secondary:#304875;--dsw-alias-label-tertiary:#526789;--dsw-alias-label-caption:#6a7895;--dsw-alias-border-l1:#be9952b8;--dsw-alias-border-l2:#53699e57;--dsw-alias-interactive-bg-hover:#5670ae29;--dsw-alias-state-warn-tertiary:#dab46833;--dsw-alias-state-warn-label:#815c18;color:#17284f;backdrop-filter:blur(16px)saturate(.9);background:linear-gradient(145deg,#eff4fdf7,#cfdcf4f0);border-color:#be9952c7;box-shadow:0 18px 44px #0d1d444d,inset 0 0 0 1px #ffffff85}body[data-dsh-maid-atelier] [data-cordis-panel]>header{background:#e2ebfae0}body[data-dsh-maid-atelier] [data-cordis-row]{background:#f7f9feb8;box-shadow:inset 0 1px #ffffff80}body[data-dsh-maid-atelier] [data-cordis-row][data-cordis-awaiting]{border-color:#be9952b8;box-shadow:inset 0 0 0 1px #fff8e275,0 4px 12px #1f34631a}body[data-dsh-maid-atelier] [data-cordis-panel] :is([data-cordis-approve],[data-cordis-approve-plugin],[data-cordis-decline]){color:#334d7d;background:#eff4fdd1;border:1px solid #5b70a657}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-cordis-panel]{--dsw-alias-bg-base:#0a1636f5;--dsw-alias-label-primary:#f3e8cf;--dsw-alias-label-secondary:#d6def1;--dsw-alias-label-tertiary:#afbddc;--dsw-alias-label-caption:#95a6cb;--dsw-alias-border-l1:#d3b477ad;--dsw-alias-border-l2:#8fa3d352;--dsw-alias-interactive-bg-hover:#97abda29;--dsw-alias-state-warn-tertiary:#d3a4482e;--dsw-alias-state-warn-label:#f0cf8c;color:#f3e8cf;background:linear-gradient(145deg,#132652f7,#071333f5);border-color:#d3b477b3;box-shadow:0 20px 48px #0000006b,inset 0 0 0 1px #ffffff14}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-cordis-panel]>header{background:#10224be6}body[data-dsh-maid-atelier] [data-sidebar-right-panel=fullscreen][data-sidebar-right-open]{background:#ebf0fa}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-sidebar-right-panel=fullscreen][data-sidebar-right-open]{background:#182850}body[data-dsh-maid-atelier] [data-sidebar-right-panel] :is([data-dockkit-pane],[data-dockkit-empty],[data-dockkit-float]){--dsw-alias-bg-base:#ebf0fa;background:var(--dsw-alias-bg-base)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-sidebar-right-panel] :is([data-dockkit-pane],[data-dockkit-empty],[data-dockkit-float]){--dsw-alias-bg-base:#182850}body[data-dsh-maid-atelier] [data-plugin-panel]{z-index:2;--dsw-alias-label-primary:#172347;--dsw-alias-label-secondary:#4d5d7f;--dsw-alias-label-tertiary:#52658c;--dsw-alias-label-caption:#55688c;background:#f2f6fdf0;position:relative}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-plugin-panel]{--dsw-alias-label-primary:#e7ecf7;--dsw-alias-label-secondary:#bdc9e3;--dsw-alias-label-tertiary:#96a6c9;--dsw-alias-label-caption:#8b9bbd;background:#0b1737f0}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-cordis-row]{background:#12244dc7;box-shadow:inset 0 1px #ffffff0f}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-cordis-panel] :is([data-cordis-approve],[data-cordis-approve-plugin],[data-cordis-decline]){color:#d6def1;background:#1d3363d1;border-color:#8fa3d357}body[data-dsh-maid-atelier] [data-dsh-better-sidebar]{--dsw-specific-sidebar-fill:#e6edfaf5;--dsw-alias-bg-base:#f8fafff5;--dsw-alias-bg-layer-1:#ebf0faeb;--dsw-alias-bg-layer-2:#e0e7f6f0;--dsw-alias-bg-layer-3:#d6dff2f5;--dsw-alias-bg-overlay:#f8fafffa;--dsw-alias-label-primary:#172347;--dsw-alias-label-primary-bluish:#243866;--dsw-alias-label-secondary:#4d5d7f;--dsw-alias-label-tertiary:#6f7c99;--dsw-alias-label-caption:#8a94aa;--dsw-alias-border-l1:#475b912e;--dsw-alias-border-l2-darkmode-thin:#475b9140;--dsw-alias-border-l2:#475b914d;--dsw-alias-border-l3:#c5a468a3;--dsw-alias-brand-primary:#526aa8;--dsw-alias-brand-text:#172347;--dsw-alias-button-elevated-fill:#fffdf8e6;--dsw-alias-button-floating-fill:#fffdf8f0;--dsw-alias-button-floating-hover:#ece6d8;--dsw-alias-button-info-fill:#536eae;--dsw-alias-button-info-hover:#405a99;--dsw-alias-interactive-bg-active:#c5a4683d;--dsw-alias-interactive-bg-hover:#677eb71f;--dsw-alias-interactive-bg-hover-solid:#e2e8f5;--dsw-alias-state-business-primary:#536eae;--dsw-alias-state-business-tertiary:#e1e7f5;--dsw-alias-state-warn-tertiary:#dab46833;--dsw-alias-state-warn-label:#815c18;--dsw-specific-input-major:#fffdf8db;--dsw-specific-selector:#e2e8f6e6;color:#172347}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-dsh-better-sidebar]{--dsw-specific-sidebar-fill:#0a1636f5;--dsw-alias-bg-base:#0d193bf5;--dsw-alias-bg-layer-1:#121f43f0;--dsw-alias-bg-layer-2:#182850f2;--dsw-alias-bg-layer-3:#20315bf5;--dsw-alias-bg-overlay:#0d193bfa;--dsw-alias-label-primary:#e7ecf7;--dsw-alias-label-primary-bluish:#d5dff3;--dsw-alias-label-secondary:#bdc9e3;--dsw-alias-label-tertiary:#96a6c9;--dsw-alias-label-caption:#7f90b4;--dsw-alias-border-l1:#97a9d833;--dsw-alias-border-l2-darkmode-thin:#97a9d84d;--dsw-alias-border-l2:#97a9d857;--dsw-alias-border-l3:#d3b477a8;--dsw-alias-brand-primary:#9bb0e1;--dsw-alias-brand-text:#e7ecf7;--dsw-alias-button-elevated-fill:#1c2c54f0;--dsw-alias-button-floating-fill:#1f315cf5;--dsw-alias-button-floating-hover:#354d88;--dsw-alias-button-info-fill:#8ca4dc;--dsw-alias-button-info-hover:#a3b7e5;--dsw-alias-interactive-bg-active:#d3b4773d;--dsw-alias-interactive-bg-hover:#a4b7e524;--dsw-alias-interactive-bg-hover-solid:#293f78;--dsw-alias-state-business-primary:#9bb0e1;--dsw-alias-state-business-tertiary:#293d73;--dsw-alias-state-warn-tertiary:#d3a4482e;--dsw-alias-state-warn-label:#f0cf8c;--dsw-specific-input-major:#111e42e6;--dsw-specific-selector:#2d406feb;color:#e7ecf7}body[data-dsh-maid-atelier] [class*=sectionHeader]{color:#d9bd83;letter-spacing:.025em;text-shadow:0 1px 2px #0207189e;font-family:Georgia,Times New Roman,serif}body[data-dsh-maid-atelier] [class*=sectionHeader] [class*=sectionLabel]{color:#d9bd83;font-size:15px;font-weight:500}body[data-dsh-maid-atelier] [class*=sectionHeader] [class*=iconButton]{color:#d9bd83;background:0 0;border:1px solid #0000;transition:color .15s,border-color .15s,background .15s;position:relative}body[data-dsh-maid-atelier] [class*=sectionHeader] [class*=iconButton]:is(:hover,:focus-visible){color:#fff1cf;background:#5b77bc33;border-color:#e1bf7c8f;outline:none;box-shadow:inset 0 0 0 2px #0712328a}body[data-dsh-maid-atelier] [class*=sectionHeader] [class*=iconButton] svg{color:inherit;filter:drop-shadow(0 1px 2px #020718ad)}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=sectionHeader]:has([class*=searchSlotExpanded]){height:46px;overflow:visible}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=search][class*=searchExpanded]:has(>input[class*=searchInput]){--dsh-search-input-fill:transparent;color:#d8bc80;background:linear-gradient(#07143780,#09193f52);border:1px solid #e1bf7cb8;height:42px;margin:0 2px;padding-inline:14px;transition:border-color .15s,background .15s,box-shadow .15s;box-shadow:inset 0 0 0 1px #06102cb3,0 3px 9px #02071824}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=search][class*=searchExpanded]:has(>input[class*=searchInput]):focus-within{background:linear-gradient(#112755ad,#08173b85);border-color:#f4daa4f0;box-shadow:inset 0 0 0 1px #06102cb8,0 0 0 2px #e1bf7c1f,0 4px 12px #02071833}body[data-dsh-maid-atelier] [class*=searchInput]{color:#f8f3e8;font-family:Georgia,Times New Roman,serif}body[data-dsh-maid-atelier] [class*=searchInput]::placeholder{color:#aeb9d3;opacity:1}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=searchButton],[class*=clearButton]){color:#d8bc80}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] [class*=sectionHeader],body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=search]:has(>[class*=searchButton]){justify-content:center}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]){--maid-rail-control-size:36px}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=logoRow] [class*=toggle],button[class*=newSession],[class*=sectionHeader] [class*=iconButton],[class*=search] [class*=searchButton],[data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger])){box-sizing:border-box;width:var(--maid-rail-control-size);min-width:var(--maid-rail-control-size);height:var(--maid-rail-control-size);min-height:var(--maid-rail-control-size);flex:0 0 var(--maid-rail-control-size);corner-shape:round;color:#ebd29e;filter:none;background:linear-gradient(145deg,#4d67a97a,#071234d1);border:1px solid #e1bf7cc2;border-image:;border-radius:50%;margin-inline:0;padding:0;transition:color .15s,border-color .15s,background .15s,box-shadow .15s;overflow:visible;transform:none;box-shadow:inset 0 0 0 2px #050f2dc2,0 3px 9px #0107183d}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=logoRow] [class*=toggle],button[class*=newSession],[class*=sectionHeader] [class*=iconButton],[class*=search] [class*=searchButton],[data-maid-sidebar-footer] [data-slot=sidebar\\.settings] button[aria-haspopup=dialog]:has(>[data-slot=settings\\.trigger])):is(:hover,:focus-visible){color:#fff1ce;filter:none;background:linear-gradient(145deg,#6281cd94,#0b1b46e6);border-color:#f4daa4f0;outline:none;transform:none;box-shadow:inset 0 0 0 2px #050f2db3,0 0 0 2px #e1bf7c1f,0 4px 11px #0107184d}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=logoRow],[class*=sectionHeader],[class*=search]:has(>[class*=searchButton]),[class*=regionArea]){overflow:visible}body[data-dsh-maid-atelier][data-maid-sidebar-size=rail] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=search]:has(>[class*=searchButton]){box-shadow:none;background:0 0;border:0}@media (width<=700px){body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key]){padding:6px 10px 10px!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key])>section{max-height:min(calc(var(--maid-vv-height,100dvh) - 96px), 520px)!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key])>section>:is(footer,div:last-child){flex-wrap:wrap!important;align-items:center!important;gap:8px!important;padding:0 10px!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key])>section>:is(footer,div:last-child)>:last-child{flex-wrap:wrap!important;flex:100%!important;justify-content:stretch!important;gap:8px!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key])>section>:is(footer,div:last-child)>:last-child>button{flex:1 1 0!important;min-height:44px!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key]) button[aria-label]{min-width:36px!important;min-height:36px!important}body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key]) :is([role=radio],[role=checkbox]){min-height:44px!important}@media (pointer:coarse){body[data-dsh-maid-atelier] :is([data-question-key],[data-plan-review-key]) button[aria-label]{min-width:44px!important;min-height:44px!important}}}@media (pointer:coarse){html[data-maid-keyboard=open] body[data-dsh-maid-atelier] [id=root]{top:var(--maid-vv-top,0px)!important;width:100%!important;height:var(--maid-vv-height,100dvh)!important;overscroll-behavior:none!important;max-height:none!important;position:fixed!important;bottom:auto!important;left:0!important;right:0!important}}@media (width<=700px) and (orientation:portrait){html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed],html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])){flex-direction:column!important;grid-template-rows:none!important;grid-template-columns:none!important;height:100%!important;min-height:0!important;display:flex!important}html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed]>:is([class*=centerCol],[data-pane=conversation]),html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol]))>:is([class*=centerCol],[data-pane=conversation]){flex:auto!important;width:100%!important;min-height:0!important}html[data-maid-nav-mode=rail] body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])){flex-direction:column!important;grid-template-rows:none!important;grid-template-columns:none!important;height:100%!important;min-height:0!important;display:flex!important}html[data-maid-nav-mode=rail] body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol]))>:is([class*=centerCol],[data-pane=conversation]){flex:auto!important;width:100%!important;min-height:0!important}html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])) :is([data-pane=sidebar],[class*=sidebarCol]){animation:.22s cubic-bezier(.22,.78,.2,1) backwards ahFhLW_maidAtelierPhoneDrawerIn}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]){animation:none}html[data-maid-nav-mode=rail] body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])) :is([data-pane=sidebar],[class*=sidebarCol]){animation:.22s cubic-bezier(.22,.78,.2,1) backwards ahFhLW_maidAtelierPhoneDrawerIn}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]){top:calc(env(safe-area-inset-top,0px) + 6px)!important;box-sizing:border-box!important;width:48px!important;min-width:48px!important;max-width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important;box-shadow:none!important;pointer-events:none!important;z-index:40!important;background:0 0!important;border:0!important;flex:none!important;order:0!important;margin:0!important;padding:0!important;position:fixed!important;bottom:auto!important;left:10px!important;right:auto!important;overflow:visible!important}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) :is(div:has(>[class*=logoRow]),[class*=logoRow]){box-sizing:border-box!important;width:48px!important;min-width:0!important;height:48px!important;min-height:48px!important;max-height:48px!important;box-shadow:none!important;pointer-events:none!important;background:0 0!important;border:0!important;flex-direction:row!important;flex:none!important;justify-content:center!important;align-items:center!important;gap:0!important;margin:0!important;padding:0!important;display:flex!important;overflow:visible!important}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) div:has(>[class*=logoRow])>:not([class*=logoRow]){display:none!important}@supports not selector(:has(*)){html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div{box-sizing:border-box!important;pointer-events:none!important;flex-direction:row!important;justify-content:center!important;align-items:center!important;width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important;margin:0!important;padding:0!important;display:flex!important;overflow:visible!important}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div>:not([class*=logoRow]){display:none!important}}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=logoRow] button[class*=toggle]{box-sizing:border-box!important;pointer-events:auto!important;cursor:pointer!important;justify-content:center!important;place-items:center!important;width:48px!important;min-width:48px!important;height:48px!important;min-height:48px!important;margin:0!important;padding:0!important}html:not([data-maid-nav-mode=topbar]):not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=conversation],[class*=centerCol]) header[class*=header]{padding-left:64px!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]){width:100%!important;height:calc(48px + env(safe-area-inset-top,0px))!important;min-height:calc(48px + env(safe-area-inset-top,0px))!important;max-height:calc(48px + env(safe-area-inset-top,0px))!important;padding-top:env(safe-area-inset-top,0px)!important;border-right:none!important;border-bottom:.5px solid var(--dsw-alias-border-l3)!important;flex:none!important;order:-1!important;overflow:visible!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) div:has(>[class*=logoRow]){flex-direction:row!important;align-items:center!important;gap:4px!important;width:100%!important;height:48px!important;min-height:48px!important;max-height:48px!important;padding:0 8px!important;overflow:visible!important}@supports not selector(:has(*)){html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div{flex-direction:row!important;align-items:center!important;gap:4px!important;height:48px!important;min-height:48px!important;padding:0 8px!important;display:flex!important;overflow:visible!important}}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=logoRow]{height:48px!important;min-height:48px!important;box-shadow:none!important;background:0 0!important;border:0!important;flex:none!important;margin:0!important;padding:0!important}@media (hover:none){html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=logoRow]>button[class*=toggle]:not(:focus-visible)+[role=tooltip]{display:none!important}}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=panelList]{flex-direction:row!important;flex:none!important;align-items:center!important;gap:2px!important;margin:0!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=panelRow]{justify-content:center!important;width:36px!important;height:36px!important;min-height:36px!important;padding:0!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) button[class*=newSession]{box-sizing:border-box!important;color:#ebd29e!important;filter:none!important;background:linear-gradient(145deg,#4d67a966,#071234c7)!important;border:1px solid #e1cfaab8!important;border-image:!important;border-radius:50%!important;justify-content:center!important;align-self:center!important;width:36px!important;min-width:36px!important;height:36px!important;min-height:36px!important;margin:0!important;padding:0!important;box-shadow:inset 0 0 0 2px #050f2db3!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) button[class*=newSession] svg{stroke-width:1.9px;filter:drop-shadow(0 1px 2px #01071880);color:#f4dfa8!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=newSessionLabel],html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [class*=panelTitle]{display:none!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] [class*=settingsArea] button[aria-haspopup=dialog]{box-sizing:border-box!important;color:#dfbf7c!important;filter:none!important;background:linear-gradient(145deg,#4d67a97a,#071234d1)!important;border:1px solid #e1bf7cc2!important;border-image:!important;border-radius:50%!important;justify-content:center!important;align-items:center!important;gap:0!important;width:36px!important;min-width:36px!important;max-width:36px!important;height:36px!important;min-height:36px!important;max-height:36px!important;margin:0!important;padding:0!important;overflow:visible!important;box-shadow:inset 0 0 0 2px #050f2dc2,0 3px 9px #0107183d!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] [class*=settingsArea] button[aria-haspopup=dialog] [class*=triggerLabel],html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=regionArea],[class*=searchExpanded],[class*=sectionHeader],[data-skin-chrome=sidebar-mascot],[data-skin-chrome=sidebar-corners]){display:none!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=footArea],[class*=settingsArea],[class*=footerActions]){flex-direction:row!important;align-items:center!important;margin:0 0 0 auto!important;padding:0!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [data-maid-sidebar-footer]{min-height:0!important;box-shadow:none!important;background:0 0!important;flex-direction:row!important;padding:0!important}html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) [data-maid-sidebar-footer]:before{display:none!important}body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])) :is([data-pane=sidebar],[class*=sidebarCol]){z-index:60!important;border-right:.5px solid var(--dsw-alias-border-l3)!important;overscroll-behavior:contain!important;width:min(300px,84vw)!important;height:100dvh!important;max-height:100dvh!important;position:fixed!important;top:0!important;bottom:0!important;left:0!important;overflow-y:auto!important;box-shadow:24px 0 64px #08113059!important}body[data-dsh-maid-atelier] div:has(>:is([data-pane=sidebar],[class*=sidebarCol]))>[class*=handle]{display:none!important}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol]):has([class*=regionArea]:not([style*=\"display: none\"])){overscroll-behavior:contain!important}html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div>div:not([class*=collapsed])>:not([class*=logoRow],[class*=newSession],[class*=regionArea],[class*=footArea]),html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div>div:not([class*=collapsed])>[class*=logoRow]>:not([class*=toggle]),html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div>div:not([class*=collapsed]) :is([data-plugin-entry],button[data-dsh-part=sidebar-entry]),html:not([data-maid-nav-mode=rail]) body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol])>div>div:not([class*=collapsed])>[class*=footArea]>[class*=footerActions]{display:none!important}}@keyframes ahFhLW_maidAtelierPhoneDrawerIn{0%{transform:translate(-100%)}to{transform:none}}@media (width<=420px) and (orientation:portrait){html[data-maid-nav-mode=topbar] body[data-dsh-maid-atelier] div[data-sidebar-collapsed] :is([data-pane=sidebar],[class*=sidebarCol]) :is([class*=brandName],[class*=fallbackBrandName],[class*=localBuildBrand],[class*=buildVersion]){display:none!important}}body[data-dsh-maid-atelier] [data-slot=sidebar\\.workspaces] ::-webkit-scrollbar-thumb{corner-shape:round;background-clip:padding-box;border:2px solid #0000;border-radius:8px}body[data-dsh-maid-atelier] [data-maid-workspace-row]{isolation:isolate;color:#f4ead5;background:0 0;border:0;border-radius:0;height:54px;padding:7px 10px 7px 7px;font-family:Georgia,Times New Roman,serif;position:relative;overflow:visible}body[data-dsh-maid-atelier] [data-maid-workspace-row]:hover{background:#5b77bc1f}body[data-dsh-maid-atelier] [data-maid-workspace-row]>*{z-index:2;position:relative}body[data-dsh-maid-atelier] [data-maid-workspace-row]>[class*=folder]{background:var(--maid-workspace-crest-art) center / contain no-repeat;color:#0000;filter:drop-shadow(0 2px 3px #02081c7a);width:28px;height:34px;margin:4px 0 0 -7px;display:inline-flex}body[data-dsh-maid-atelier] [data-maid-workspace-row]>[class*=folder] svg{display:none}body[data-dsh-maid-atelier] [data-maid-workspace-row]:hover>[class*=folder]{display:inline-flex}body[data-dsh-maid-atelier] [data-maid-workspace-row]:hover>[class*=chevron]{display:none}body[data-dsh-maid-atelier] [data-maid-workspace-row] [class*=title]{font-size:15px;font-weight:500;line-height:20px}body[data-dsh-maid-atelier] [data-maid-workspace-row] [class*=meta]{color:#d9bd83;font-size:12px}body[data-dsh-maid-atelier] [data-maid-workspace-row][aria-expanded=true]:not([data-maid-workspace-active]){color:#f6e5c1;background:linear-gradient(100deg,#4862a152,#192e5f29);border-radius:6px;box-shadow:inset 2px 0 #d8b877c7,inset 0 1px #e1cfaa2e,inset 0 -1px #e1cfaa1f}body[data-dsh-maid-atelier] [data-maid-workspace-row][aria-expanded=true]:not([data-maid-workspace-active]):hover{background:linear-gradient(100deg,#536fb26b,#20376c3d)}body[data-dsh-maid-atelier] [data-maid-workspace-active]{isolation:isolate;color:#fff8e8;text-shadow:0 1px 2px #02081c8a;background:0 0}body[data-dsh-maid-atelier] [data-maid-workspace-active]>[class*=folder]{width:30px;height:38px;margin-block-start:0}body[data-dsh-maid-atelier] [data-maid-workspace-active] [class*=projectText]{margin-inline-start:-4px}body[data-dsh-maid-atelier] [data-maid-workspace-active]:hover{background:0 0}body[data-dsh-maid-atelier] [data-maid-workspace-active]:before{content:\"\";box-sizing:border-box;z-index:0;border-style:solid;border-width:0 36px 0 35px;border-image-source:var(--maid-workspace-ribbon-art);filter:drop-shadow(0 5px 8px #02081c66);pointer-events:none;border-image-slice:0 145 0 140 fill;border-image-width:0 36px 0 35px;border-image-repeat:stretch;animation:.42s cubic-bezier(.2,.74,.22,1) both ahFhLW_maidAtelierWorkspaceRibbonEnter;position:absolute;inset:-3px 0 -3px -12px}body[data-dsh-maid-atelier] [data-maid-workspace-active]>[class*=folder],body[data-dsh-maid-atelier] [data-maid-workspace-active] [class*=projectText]{animation:.26s cubic-bezier(.2,.74,.22,1) 90ms backwards ahFhLW_maidAtelierWorkspaceRibbonContentEnter}@keyframes ahFhLW_maidAtelierWorkspaceRibbonEnter{0%{opacity:0;clip-path:inset(0 100% 0 0);transform:translate(-8px)}60%{opacity:1}70%{clip-path:inset(0 12% 0 0);transform:translate(0)}92%{clip-path:inset(0);transform:translate(2px)}to{opacity:1;clip-path:inset(0);transform:translate(0)}}@keyframes ahFhLW_maidAtelierWorkspaceRibbonContentEnter{0%{opacity:.32;transform:translate(-4px)}to{opacity:1;transform:none}}body[data-dsh-maid-atelier] [data-maid-session-row]{box-sizing:border-box;color:#d7c8a8;width:100%;min-width:0;height:32px;box-shadow:none;background:0 0;border:0;border-radius:0;padding:0 8px 0 24px;font-family:Georgia,Times New Roman,serif;position:relative}body[data-dsh-maid-atelier] [data-maid-session-row][aria-selected=true]{color:#fff8e8;box-shadow:none;background:0 0}body[data-dsh-maid-atelier] [data-maid-session-row][aria-selected=true] [class*=title]{color:#fffaf0;text-shadow:0 1px 3px #02081cb8}body[data-dsh-maid-atelier] [data-maid-session-row][aria-selected=true] [class*=time]{color:#ead29c}body[data-dsh-maid-atelier] [data-maid-session-row]:hover:not([aria-selected=true]){box-shadow:none;background:#617ab71a}body[data-dsh-maid-atelier] [data-maid-session-row]>[class*=slot]{z-index:2;position:absolute;left:6px}body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]{color:#e2bd6e;corner-shape:round;filter:drop-shadow(0 0 2px #e7c7809e);shape-rendering:geometricprecision;background:radial-gradient(circle at 44% 40%,#fffffff5 0 .55px,#0000 .7px),radial-gradient(circle,#a9bce8 0 1.15px,#5e79b9 1.3px 2px,#1a356f 2.15px 3px,#0000 3.15px);border-radius:50%;width:12px;height:12px;overflow:visible}@media (width<=700px){body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]>g,body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]>g>circle{animation:none}body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]{will-change:opacity;animation:1.6s ease-in-out infinite ahFhLW_maidAtelierSessionJewelPulse}}@keyframes ahFhLW_maidAtelierSessionJewelPulse{0%,to{opacity:1}50%{opacity:.35}}body[data-dsh-maid-atelier] [data-maid-session-row]:before{content:\"\";z-index:1;pointer-events:none;background:repeating-linear-gradient(90deg,#e0be78c2 0 3px,#0000 3px 5px) 0/100% 1px no-repeat,repeating-linear-gradient(#e0be78c7 0 3px,#0000 3px 7px) 0 0/1px 100% no-repeat;width:10px;position:absolute;top:0;bottom:0;left:8px}body[data-dsh-maid-atelier] [data-maid-session-last]:before{background:repeating-linear-gradient(90deg,#e0be78c2 0 3px,#0000 3px 5px) 0/100% 1px no-repeat,repeating-linear-gradient(#e0be78c7 0 3px,#0000 3px 7px) 0 0/1px 50% no-repeat}body[data-dsh-maid-atelier] [data-maid-session-row]:not(:last-child):after{content:\"\";pointer-events:none;background:#b7c4e252;height:1px;position:absolute;bottom:0;left:28px;right:8px}body[data-dsh-maid-atelier] [data-maid-session-row]:not([data-maid-session-flat])[aria-selected=true]:after{content:\"\";z-index:0;pointer-events:none;background:linear-gradient(90deg,#526fb8bd,#2b468b9e 72%,#142a5e80);border:1px solid #e2be70b8;border-radius:8px;width:auto;height:auto;position:absolute;inset:0 0 0 18px;box-shadow:inset 0 1px #fff4d72e,inset 0 -1px #0713373d}body[data-dsh-maid-atelier] [data-maid-session-row]:not([data-maid-session-flat])[aria-selected=true]>:is([class*=title],[class*=time],[class*=rowActions],[class*=pinIndicator],[class*=scheduleIndicator]){z-index:2;position:relative}body[data-dsh-maid-atelier] [data-maid-session-row] [class*=title]{font-size:13px;font-weight:400}body[data-dsh-maid-atelier] [data-maid-session-row] [class*=time]{color:#c8b891;font-size:12px}body[data-dsh-maid-atelier] [data-maid-session-row][class*=archived]>:is([class*=title],[class*=time]){color:var(--dsw-alias-label-caption);text-shadow:none}body[data-dsh-maid-atelier] [data-maid-session-flat]{box-sizing:border-box;border-radius:7px;height:36px;margin-inline:2px;padding-inline:26px 9px}body[data-dsh-maid-atelier] [data-maid-session-flat]:before{content:none}body[data-dsh-maid-atelier] [data-maid-session-flat]:not(:last-child):after{background:linear-gradient(90deg,#b7c4e242,#b7c4e214);left:26px;right:9px}body[data-dsh-maid-atelier] [data-maid-session-flat][aria-selected=true]{background:linear-gradient(90deg,#526fb8bd,#2b468b9e 72%,#142a5e80);border:1px solid #e2be70b8;box-shadow:inset 0 1px #fff4d733,inset 0 -1px #07133747,0 3px 9px #02081c4d}body[data-dsh-maid-atelier] [data-maid-session-flat][aria-selected=true]:before{content:\"\";corner-shape:round;background:linear-gradient(#fff0c5,#d4a951);border-radius:999px;width:3px;display:block;position:absolute;inset:7px auto 7px 5px;box-shadow:0 0 5px #e7c780b8}body[data-dsh-maid-atelier] [data-maid-session-flat][aria-selected=true]:after{content:none}body[data-dsh-maid-atelier] [data-maid-session-flat]:hover:not([aria-selected=true]){background:linear-gradient(90deg,#617ab729,#617ab70f);border-radius:7px}body[data-dsh-maid-atelier] [data-phase=hero]{--dsh-chat-content-width:clamp(560px, 41vw, 740px);--dsh-composer-card-max-width:calc(var(--dsh-chat-content-width) + 32px)}body[data-dsh-maid-atelier] [class*=headline]{color:var(--maid-ink);letter-spacing:.01em;text-shadow:0 1px #fffc,0 5px 18px #20316029;font-family:Georgia,Times New Roman,serif;font-weight:600}body[data-dsh-maid-atelier] [data-phase=hero] [class*=headline]:has(>[class*=fish]){grid-template-rows:auto auto;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);justify-content:center;align-items:center;gap:13px 9px;min-width:min(560px,72vw);min-height:120px;margin-bottom:24px;font-size:clamp(27px,2vw,36px);line-height:1.16;position:relative;transform:translateY(clamp(-34px,80px - 11.4vh,-2px));display:grid!important}body[data-dsh-maid-atelier] [data-phase=hero] [class*=headline]:has(>[class*=fish]):before{content:\"\";z-index:-1;background:radial-gradient(circle,#d9b76f 0 2px,#0000 2.5px) 0/8px 8px no-repeat,radial-gradient(circle,#d9b76f 0 2px,#0000 2.5px) 100%/8px 8px no-repeat,linear-gradient(90deg,#0000,#c5a468d1 16% 84%,#0000);height:1px;position:absolute;top:34px;left:13%;right:13%}body[data-dsh-maid-atelier] [data-phase=hero] [class*=headline]:has(>[class*=fish]):after{content:\"\";background:linear-gradient(45deg,#0000 42%,#c5a468 43% 57%,#0000 58%) 50%/10px 10px no-repeat,linear-gradient(135deg,#0000 42%,#c5a468 43% 57%,#0000 58%) 50%/10px 10px no-repeat,linear-gradient(90deg,#0000,#c5a468bd 10% 47%,#0000 47% 53%,#c5a468bd 53% 90%,#0000) 50% 3px/100% 1px no-repeat,linear-gradient(90deg,#0000,#e2cfaabd 18% 46%,#0000 46% 54%,#e2cfaabd 54% 82%,#0000) 50% 7px/100% 1px no-repeat;height:12px;position:absolute;bottom:-10px;left:8%;right:8%}body[data-dsh-maid-atelier] [data-phase=hero] [class*=headline]:has(>[class*=fish])>[class*=fish]{box-sizing:border-box;corner-shape:round;outline-offset:4px;width:70px;height:70px;color:var(--maid-indigo);filter:drop-shadow(0 2px 3px #c5a46842);background:#fffdf8b8;border:1px solid #c5a468eb;border-radius:50%;outline:1px solid #e2cfaac2;grid-area:1/1/auto/-1;justify-self:center;margin:0;padding:15px;inset:auto;box-shadow:0 0 0 8px #fffdf83d,0 5px 16px #21336029,inset 0 0 0 2px #ffffffb8;position:static!important;transform:none!important}body[data-dsh-maid-atelier] [data-phase=hero] [class*=headline]:has(>[class*=fish])>[class*=titleGroup]{grid-area:2/2;align-self:center;display:contents!important}body[data-dsh-maid-atelier] [data-phase=hero] [class*=titleGroup]>span:not([class*=previewBadge]){letter-spacing:.012em;grid-area:2/2;align-self:center;font-weight:600;position:static!important}body[data-dsh-maid-atelier] [data-phase=hero] [class*=previewBadge]{color:#526487;background:#fffdf87a;border-color:#c5a4687a;grid-area:2/3;place-self:center start;position:static!important}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=hero] [class*=headline]:has(>[class*=fish])>[class*=fish]{color:#6f86be;background:#eef2fbc2}body[data-dsh-maid-atelier][data-ds-dark-theme] [class*=headline]{color:#f6eedf;text-shadow:0 2px 5px #03091cd1,0 0 20px #748ecd42}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=hero] [class*=titleGroup]>span:not([class*=previewBadge]){color:#fffaf0;letter-spacing:.02em;-webkit-text-stroke:.35px #040b22e6;text-shadow:0 1px #040b22f5,0 3px 7px #000000db,0 0 18px #ffebbe3d;font-weight:650}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=hero] [class*=previewBadge]{color:#f0dfba;background:#07123494;border-color:#e2cfaa94;box-shadow:0 2px 7px #00000047}body[data-dsh-maid-atelier][data-ds-dark-theme] [class*=headline] [class*=fish]{color:var(--maid-indigo);filter:drop-shadow(0 2px 4px #ffffff6b)}body[data-dsh-maid-atelier] button[class*=workspace][aria-expanded],body[data-dsh-maid-atelier] button[class*=workspace]:hover,body[data-dsh-maid-atelier] button[class*=seat][aria-expanded],body[data-dsh-maid-atelier] button[class*=seat]:hover{background:#fffdf88a}body[data-dsh-maid-atelier][data-ds-dark-theme] button[class*=workspace][aria-expanded],body[data-dsh-maid-atelier][data-ds-dark-theme] button[class*=workspace]:hover,body[data-dsh-maid-atelier][data-ds-dark-theme] button[class*=seat][aria-expanded],body[data-dsh-maid-atelier][data-ds-dark-theme] button[class*=seat]:hover{background:#1e2e57ad}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat]{--dsw-alias-bg-base:transparent;background:0 0;transition:opacity .26s cubic-bezier(.22,.78,.2,1),transform .26s cubic-bezier(.22,.78,.2,1)}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-hidden]{opacity:0;pointer-events:none;transform:translateY(26px)}body[data-dsh-maid-atelier] [data-composer-card]{z-index:21;isolation:isolate;--maid-composer-surface:linear-gradient(180deg, #fffefae0, #f4f7fdc2), var(--dsw-specific-input-major);--maid-composer-shadow:var(--maid-shadow);--maid-composer-backdrop-filter:none;min-height:0;box-shadow:none;background:0 0;border:0;border-radius:34px;padding-top:34px;position:relative;overflow:visible}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card]{max-width:min(100%, max(720px, var(--dsh-composer-card-max-width)))}body[data-dsh-maid-atelier] [data-composer-input]{min-height:0;transition:min-height .52s cubic-bezier(.22,.78,.2,1)}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-input]{min-height:clamp(72px,9vh,118px)}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card]{--maid-composer-surface:linear-gradient(180deg, #fffefa8a, #f1f5fd66), #fffdf82e;--maid-composer-shadow:0 18px 52px #1d305e2e, inset 0 1px #ffffffc2;--maid-composer-backdrop-filter:blur(2.5px) saturate(.94);border-radius:clamp(26px,2vw,34px)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=hero] [data-composer-card]{--maid-composer-surface:linear-gradient(180deg, #1b2c549e, #0a173a85), #0d193b38;--maid-composer-backdrop-filter:blur(3px) saturate(.88)}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card]:has([data-slot=\"conversation.input.model\"] [class$=_root]>button[class$=_trigger][aria-haspopup=menu][aria-expanded=true]+[role=menu][class$=_menu]){--maid-composer-backdrop-filter:none}body[data-dsh-maid-atelier] [data-composer-card] [data-slot=\"conversation.input.model\"] [class$=_root]:has(>button[class$=_trigger][aria-haspopup=menu])>[role=menu][class$=_menu]{backdrop-filter:none;background:#e8eef9fa}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] [data-slot=\"conversation.input.model\"] [class$=_root]:has(>button[class$=_trigger][aria-haspopup=menu])>[role=menu][class$=_menu]{background:#182850fa}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card]>[class*=row]{align-items:flex-end;min-height:50px;padding:2px clamp(10px,1vw,18px) 10px}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] button[class*=add]{corner-shape:round;color:#405a99;background:#fffdf89e;border:1px solid #c5a468b8;border-radius:50%;width:42px;height:42px;box-shadow:0 3px 10px #2536631f,inset 0 0 0 3px #ffffff75}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] [class*=modes] button[class*=trigger]{box-sizing:border-box;corner-shape:round;color:#405a99;background:#fffdf885;border:1px solid #c5a468ad;border-radius:50%;justify-content:center;gap:0;width:42px;min-width:42px;height:42px;padding:0;box-shadow:inset 0 0 0 3px #fff6}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] [class*=modes] :is([class*=triggerLabel],[class*=chevron]){display:none}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] [class*=trailing] button[class*=trigger]{color:#ad894b;width:auto;min-width:0;max-width:220px;height:38px;box-shadow:none;background:0 0;border:0;padding:0 4px 0 8px}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div>[data-maid-sidebar-footer]{z-index:auto}body[data-dsh-maid-atelier][data-maid-settings-open] :is([data-pane=sidebar],[class*=sidebarCol])>div>:not([data-skin-chrome=sidebar-mascot],[data-skin-chrome=sidebar-corners],[role=tooltip]),body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div>:has([role=dialog][aria-modal=true]){z-index:auto!important}body[data-dsh-maid-atelier] :is([data-pane=sidebar],[class*=sidebarCol])>div>:not([data-skin-chrome=sidebar-mascot],[data-skin-chrome=sidebar-corners],[role=tooltip])>:has([role=dialog][aria-modal=true]){opacity:1!important;transition:none!important;animation:none!important}body[data-dsh-maid-atelier] [data-maid-settings-backdrop-frame]{width:var(--maid-sidebar-width);z-index:0;height:100%;inset:0 auto 0 0}body[data-dsh-maid-atelier][data-maid-settings-open] [data-composer-card]{z-index:0;opacity:.75;pointer-events:none;animation:none}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] button[class*=primary]{corner-shape:round;color:#fffaf0;background:linear-gradient(145deg,#6079b5,#294587);border:1px solid #d8bd82;border-radius:50%;width:44px;height:44px;box-shadow:0 4px 12px #1a326c47,inset 0 0 0 3px #ffffff1f}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-card] button[class*=primary]:disabled{opacity:.78}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card]{--maid-composer-surface:linear-gradient(180deg, #192a53eb, #0c193ce6);--maid-composer-shadow:var(--maid-shadow), inset 0 1px #ffffff14}body[data-dsh-maid-atelier] [data-composer-card]:before{content:\"\";box-sizing:border-box;z-index:1;background-image:var(--maid-bow-art), var(--maid-composer-ribbon-left-cap-art), var(--maid-composer-ribbon-right-cap-art), var(--maid-composer-ribbon-left-fill-art), var(--maid-composer-ribbon-right-fill-art);border-style:solid;border-width:72px 54px 52px;border-image-source:var(--maid-composer-frame-art);pointer-events:none;background-position:top,54px 0,right 54px top,156px 0,right 156px top;background-repeat:no-repeat;background-size:auto 69px,102px 32px,102px 32px,max(0px,50% - 186px) 32px,max(0px,50% - 186px) 32px;background-origin:border-box;background-clip:border-box;border-image-slice:170 120 115;border-image-width:72px 54px 52px;border-image-repeat:stretch;position:absolute;inset:-20px -14px -18px}body[data-dsh-maid-atelier][data-maid-composer-motion=dock] [data-phase=active] [data-composer-card]{animation:.52s cubic-bezier(.22,.78,.2,1) both ahFhLW_maidAtelierComposerDock}body[data-dsh-maid-atelier][data-maid-composer-motion=rise] [data-phase=hero] [data-composer-card]{animation:.52s cubic-bezier(.22,.78,.2,1) both ahFhLW_maidAtelierComposerRise}body[data-dsh-maid-atelier][data-maid-composer-motion] [data-composer-card]{will-change:transform, opacity}@keyframes ahFhLW_maidAtelierComposerDock{0%{opacity:.94;transform:translateY(clamp(-240px,-26vh,-150px))}to{opacity:1;transform:none}}@keyframes ahFhLW_maidAtelierComposerRise{0%{opacity:.94;transform:translateY(clamp(150px,26vh,240px))}to{opacity:1;transform:none}}body[data-dsh-maid-atelier] [data-composer-card]:after{content:\"\";z-index:-1;corner-shape:round;background:var(--maid-composer-surface);box-shadow:var(--maid-composer-shadow);backdrop-filter:var(--maid-composer-backdrop-filter);pointer-events:none;border-radius:40px;position:absolute;inset:4px -8px -10px;-webkit-mask:none;mask:none}body[data-dsh-maid-atelier] [data-composer-card]>*{z-index:2;position:relative}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]{z-index:0;pointer-events:none;height:63px;position:absolute;inset:-20px -14px auto}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:before,body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:after,body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]>[data-maid-composer-lace-center]{content:\"\";background-repeat:repeat-x;background-size:54px 33px;height:33px;position:absolute;top:30px}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:before,body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:after{width:max(0px,50% - 81px)}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:before{background-image:var(--maid-composer-lace-art);background-position:0 0;left:54px}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:after{background-image:var(--maid-composer-lace-art);background-position:100% 0;right:54px}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]>[data-maid-composer-lace-center]{background-image:var(--maid-composer-lace-art);background-position:top;background-repeat:no-repeat;width:54px;left:calc(50% - 27px)}body[data-dsh-maid-atelier] [data-composer-card]>[data-slot=\"conversation.input.attachments\"]>:not([class*=mask]){z-index:2;position:relative}body[data-dsh-maid-atelier] [data-composer-card] [data-composer-input]{caret-color:#405a99}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] [data-composer-input]{caret-color:#bcd2ff}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card]:has(+*){margin-block-end:12px}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-composer-card]+div[class*=dock]{color:#4a5d82;backdrop-filter:blur(2px);background:linear-gradient(90deg,#0000,#f8faff4d 10% 90%,#0000)}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-slot=\"conversation.composer.dock\"]>* [class*=sep]{color:#4a5d828c}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card]+div[class*=dock]{color:#aebdde;backdrop-filter:blur(2px);background:linear-gradient(90deg,#0000,#0a14307a 10% 90%,#0000)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=\"conversation.composer.dock\"]>* [class*=sep]{color:#aebdde80}body[data-dsh-maid-atelier] [data-composer-card]+div[class*=dock] [data-slot=\"conversation.composer.dock\"]>*{backdrop-filter:none;background:0 0}body[data-dsh-maid-atelier] [data-phase=active] [data-conversation-scroll]:not(:has([data-chat-flow],[data-dsh-better-display]))>[data-composer-seat]{display:none}body[data-dsh-maid-atelier] [data-composer-card] button:not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *){transition:transform .14s,background-color .14s,box-shadow .14s}body[data-dsh-maid-atelier] [data-composer-card] button:hover:not(:disabled):not([data-slot=\"conversation.input.left\"] *,[data-slot=\"conversation.input.right\"] *){transform:translateY(-1px)}body[data-dsh-maid-atelier] [data-composer-card] button[class*=primary]{background:linear-gradient(145deg,#6680bd,#304a91);border:1px solid #e1cfaad1;box-shadow:0 4px 12px #1a326c47}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card]>[class*=row]{min-height:48px;padding:2px 14px 10px}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] [class*=tools]{gap:9px}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] [class*=modes],body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] [class*=trailing]{gap:8px}body[data-dsh-maid-atelier] [data-composer-card]>[class*=row]>[class*=trailing]>[class*=standardControls]{gap:inherit;flex:auto;min-width:0}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] button[class*=add],body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] [class*=modes] button[class*=trigger]:has([class*=triggerIcon]){box-sizing:border-box;corner-shape:round;color:#405a99;background:#fffdf8ad;border:1px solid #c5a468ad;border-radius:50%;place-items:center;width:38px;min-width:38px;height:38px;padding:0;display:grid;box-shadow:0 3px 10px #2536631f,inset 0 0 0 3px #ffffff6b}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] [class*=modes] button[class*=trigger]:has([class*=triggerIcon]) :is([class*=triggerLabel],[class*=chevron]){display:none}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active] [data-composer-card] :is(button[class*=add],[class*=modes] button[class*=trigger]:has([class*=triggerIcon])){color:#ead39f;background:#1c2d58d1;border-color:#d3b477b8;box-shadow:0 3px 12px #00000042,inset 0 0 0 3px #ffffff0d}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] button[class*=primary]{width:38px;height:38px;transform:none}body[data-dsh-maid-atelier] [data-composer-card] [class*=trailing] button[aria-haspopup=menu]{color:#314979;max-width:min(240px,38vw);height:32px;font-family:Georgia, \"Times New Roman\", var(--dsw-font-family);letter-spacing:.01em;border-radius:10px;padding:0 5px 0 8px;font-size:12px;font-weight:600}body[data-dsh-maid-atelier] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerLabel]{color:#314979}body[data-dsh-maid-atelier] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerEffort]{color:#a77c36;font-family:var(--dsw-font-family);font-size:11px;font-weight:650}body[data-dsh-maid-atelier] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerEffort]:before{content:\"·\";color:#576994b8;margin-right:4px}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] [class*=trailing] button[aria-haspopup=menu],body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerLabel]{color:#e7ecf7}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerEffort]{color:#e1c17d}body[data-dsh-maid-atelier] [data-composer-card] button[class$=_trigger][aria-haspopup=dialog]:has(>svg circle[class$=_track]):has(>svg circle[class$=_fill]){background:#e1e9fb80;border:1px solid #455e9938;width:30px;height:30px}body[data-dsh-maid-atelier] [data-composer-card] button[class$=_trigger][aria-haspopup=dialog]:has(>svg circle[class$=_fill]) circle[class$=_track]{stroke:#4d6bab;stroke-width:2.2px}body[data-dsh-maid-atelier] [data-composer-card] button[class$=_trigger][aria-haspopup=dialog]:has(>svg circle[class$=_track]) circle[class$=_fill]{stroke:#d3a957;stroke-width:2.4px;filter:drop-shadow(0 0 2px #d3a9575c)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] button[class$=_trigger][aria-haspopup=dialog]:has(>svg circle[class$=_track]):has(>svg circle[class$=_fill]){background:#273c708f;border-color:#7d99d83d}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] button[class$=_trigger][aria-haspopup=dialog]:has(>svg circle[class$=_fill]) circle[class$=_track]{stroke:#7896d4}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_bar]{background:#4767aead}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_segment]{background:var(--meter-tint,#d3a957)}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_header],body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_header] :is(span,div){color:#172347;text-shadow:none}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_headline]{color:#56678c}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_header],body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_header] :is(span,div){color:#f2e7cf}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [role=dialog] [class$=_headline]{color:#afbddb}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [class$=_colorSystem]{--meter-tint:#f0d99f}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [class$=_colorTools]{--meter-tint:#dfbd73}body[data-dsh-maid-atelier] [data-composer-card] span:has(>button[class$=_trigger][aria-haspopup=dialog]>svg circle[class$=_track]) [class$=_colorMessages]{--meter-tint:#c99a43}@container (width<=560px){body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card]>[class*=row]{padding-inline:10px}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-card] :is(button[class*=add],[class*=modes] button[class*=trigger]:has([class*=triggerIcon])){width:34px;min-width:34px;height:34px}body[data-dsh-maid-atelier] [data-composer-card] [class*=trailing] button[aria-haspopup=menu] [class*=triggerEffort]{display:none}}@media (width<=700px){body[data-dsh-maid-atelier] [data-composer-card]{gap:8px;padding-top:26px}body[data-dsh-maid-atelier] [data-phase=hero] [data-composer-input]{min-height:52px}body[data-dsh-maid-atelier] [data-composer-card]:before{background-position:50% 4px,54px 8px,right 54px top 8px,118px 8px,right 118px top 8px;background-size:auto 54px,64px 20px,64px 20px,max(0px,50% - 148px) 20px,max(0px,50% - 148px) 20px}body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:before,body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]:after,body[data-dsh-maid-atelier] [data-composer-card]>[data-skin-chrome=composer-lace]>[data-maid-composer-lace-center]{top:28px}body[data-dsh-maid-atelier] :is([data-phase=hero],[data-phase=active]) [data-composer-card]>[class*=row]{flex-wrap:nowrap;align-items:center;gap:4px;min-height:40px;padding:0 8px 6px}body[data-dsh-maid-atelier] :is([data-phase=hero],[data-phase=active]) [data-composer-card] :is([class*=tools],[class*=modes],[class*=trailing],[class*=standardControls]){gap:4px}body[data-dsh-maid-atelier] [data-composer-card]>[class*=row]>[class*=tools]{flex:none}body[data-dsh-maid-atelier] [data-composer-card]>[class*=row]>[class*=trailing]{flex:1 1 0;min-width:0}body[data-dsh-maid-atelier] :is([data-phase=hero],[data-phase=active]) [data-composer-card] :is(button[class*=add],button[class*=primary],[class*=modes] button[class*=trigger]){box-sizing:border-box;flex:0 0 32px;width:32px;min-width:32px;height:32px;padding:0;transform:none}body[data-dsh-maid-atelier] [data-composer-card] [data-slot=\"conversation.input.model\"]>[class$=_root]{flex:1 1 0;min-width:0}body[data-dsh-maid-atelier] :is([data-phase=hero],[data-phase=active]) [data-composer-card] [data-slot=\"conversation.input.model\"]>[class$=_root]>button[aria-haspopup=menu]{gap:2px;width:100%;max-width:100%;padding:0 2px;font-size:11px}body[data-dsh-maid-atelier] [data-composer-card] [data-slot=\"conversation.input.model\"]>[class$=_root]>button[aria-haspopup=menu]>[class*=triggerLabel]{text-overflow:clip;scrollbar-width:none;flex:auto;overflow-x:auto}body[data-dsh-maid-atelier] [data-composer-card] [data-slot=\"conversation.input.model\"]>[class$=_root]>button[aria-haspopup=menu]>[class*=triggerLabel]::-webkit-scrollbar{display:none}}body[data-dsh-maid-atelier] [data-composer-card]>[data-model-compact] [data-slot=\"conversation.input.model\"]>[class$=_root]{flex:0 auto}body[data-dsh-maid-atelier] [data-composer-card]>[data-model-compact] [data-slot=\"conversation.input.model\"]>[class$=_root]>button[aria-haspopup=menu]{width:auto;max-width:100%;padding:0 4px 0 8px}body[data-dsh-maid-atelier] [data-composer-card]>[data-model-compact]>[class*=trailing]>[class*=standardControls]{flex:0 auto;margin-left:auto}body[data-dsh-maid-atelier] [class*=ConversationRoot]{background:0 0}body[data-dsh-maid-atelier] header[class*=header]{border-bottom-color:#c5a46847}body[data-dsh-maid-atelier] :is([data-read],[data-diff],[class~=md-code-block]),body[data-dsh-maid-atelier] [data-terminal]{--dsw-alias-markdown-code-block:#f9fafdf7;--dsw-alias-label-primary:#172347;--dsw-alias-label-secondary:#4d5d7f;--dsw-alias-label-tertiary:#6f7c99;color:#172347;text-shadow:none}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-read],[data-diff],[class~=md-code-block]),body[data-dsh-maid-atelier][data-ds-dark-theme] [data-terminal]{--dsw-alias-markdown-code-block:#0a1430f7;--dsw-alias-label-primary:#edf1fa;--dsw-alias-label-secondary:#bdc9e3;--dsw-alias-label-tertiary:#96a6c9;color:#edf1fa}body[data-dsh-maid-atelier] :is([data-read],[data-diff],[class~=md-code-block]){--dsl-code-block-background:var(--dsw-alias-markdown-code-block)}body[data-dsh-maid-atelier] [data-turn-trigger]{background:#e8edf9f2;border-color:#c5a4687a;box-shadow:0 6px 20px #1326571a}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-turn-trigger]{background:#1e2f5af7}body[data-dsh-maid-atelier] [data-turn-trigger]:hover{border-color:var(--maid-gold)}body[data-dsh-maid-atelier] [class*=userRow] [class*=bubble]:not([role=tooltip]){background:#e8edf9f2;border:1px solid #c5a4687a;box-shadow:0 6px 20px #1326571a}body[data-dsh-maid-atelier][data-ds-dark-theme] [class*=userRow] [class*=bubble]:not([role=tooltip]){background:#1e2f5af7}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step]>*>*>*>div[class*=markdown]{box-sizing:border-box;width:fit-content;max-width:min(100%, calc(var(--dsh-chat-content-width,680px) - 32px));background:#f8fafff0;border:1px solid #c5a4686b;border-radius:18px 18px 18px 7px;align-self:flex-start;padding:14px 18px;box-shadow:0 4px 14px #13265714}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-chat-flow-kind=assistant-step]>*>*>*>div[class*=markdown]{background:#121f43f0;border-color:#d3b47766;box-shadow:0 4px 16px #00000038}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] .md-table-wide:not([data-maid-table-frame]){width:100%;max-width:100%;margin-inline:0;padding-inline:0}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]{box-sizing:border-box;scrollbar-color:#475b9159 transparent;background:#f8faff94;border:1px solid #c5a46842;border-radius:8px;width:max-content;max-width:100%;margin-block:10px 14px;margin-inline:auto;padding:3px 4px 4px 8px;transition:border-color .16s,box-shadow .16s;position:relative;overflow:auto hidden;box-shadow:inset 0 1px #ffffff94}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]{background:#121f43a3;border-color:#d3b47747;box-shadow:inset 0 1px #ffffff14}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]:not([data-maid-table-scroll-suppressed]):hover,body[data-dsh-maid-atelier][data-ds-dark-theme] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]:has(>[data-maid-table-expand]:focus-visible){border-color:#d3b4778a;box-shadow:0 0 0 1px #5bd6db2e,0 8px 28px #00000038,inset 0 1px #ffffff1a}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>table{margin-inline:auto}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand]{z-index:3;box-sizing:border-box;color:#172347;cursor:zoom-in;opacity:0;background:#fcfaf5f5;border:1px solid #c5a4689e;border-radius:7px;place-items:center;width:32px;height:32px;font-size:19px;line-height:1;transition:opacity .15s,transform .22s cubic-bezier(.22,.78,.2,1),background .15s,border-color .15s;display:grid;position:absolute;top:8px;right:8px;transform:translateY(-3px)scale(.92);box-shadow:0 0 0 1px #5bd6db2e,0 8px 22px #13265729,inset 0 1px #ffffffd1}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand]:before{content:\"⤢\"}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand][hidden]{display:none}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]:not([data-maid-table-scroll-suppressed]):hover,body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]:has(>[data-maid-table-expand]:focus-visible){border-color:#c5a4687a;box-shadow:0 0 0 1px #5bd6db38,0 8px 26px #1326571a,inset 0 1px #ffffffbd}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame][data-maid-table-expandable]:not([data-maid-table-scroll-suppressed]):hover>[data-maid-table-expand],body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame][data-maid-table-expandable]:has(>[data-maid-table-expand]:focus-visible)>[data-maid-table-expand]{opacity:1;transform:none}@media (hover:none),(pointer:coarse){body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand]{display:none}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]{overscroll-behavior-x:contain}}body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] .md-table-wide table{margin-inline:auto}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand]{color:#f3e8cf;background:#132652eb;border-color:#d3b4778a;box-shadow:0 10px 24px #00000047,inset 0 1px #ffffff1a}body[data-dsh-maid-atelier] [data-maid-table-lightbox]{z-index:940;inset:var(--maid-titlebar-height,0px) 0 0 var(--maid-sidebar-width,0px);place-items:center;padding:clamp(14px,3vw,28px);animation:.17s both ahFhLW_maidAtelierTableOverlayIn;display:grid;position:fixed}body[data-dsh-maid-atelier] [data-maid-table-lightbox][data-maid-table-closing]{pointer-events:none;animation:.16s both ahFhLW_maidAtelierTableOverlayOut}body[data-dsh-maid-atelier] [data-maid-table-backdrop]{backdrop-filter:blur(8px)saturate(.94);background:#08122d3d;position:absolute;inset:0}body[data-dsh-maid-atelier] [data-maid-table-panel]{box-sizing:border-box;width:min(var(--maid-table-expanded-width,1180px), 100%);max-height:min(820px, calc(100dvh - var(--maid-titlebar-height,0px) - 28px));transform-origin:50%;background:#f8fafff5;border:1px solid #c5a46880;border-radius:14px;grid-template-rows:minmax(0,1fr);animation:.26s cubic-bezier(.22,.78,.2,1) both ahFhLW_maidAtelierTablePanelIn;display:grid;position:relative;overflow:hidden;box-shadow:0 24px 80px #08122d57,inset 0 1px #ffffffc2}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-table-panel]{background:#121f43f7;border-color:#d3b4778c;box-shadow:0 28px 88px #00000094,inset 0 1px #ffffff1a}body[data-dsh-maid-atelier] [data-maid-table-expanded-scroller]{scrollbar-color:#475b9173 transparent;min-width:0;min-height:0;padding:16px 18px;overflow:auto}body[data-dsh-maid-atelier] [data-maid-table-expanded]{width:100%;min-width:0;max-width:none;box-shadow:none;background:0 0;border:0;border-radius:0;margin:0;padding:0;overflow:visible}body[data-dsh-maid-atelier] [data-maid-table-expanded]:after{display:none}body[data-dsh-maid-atelier] [data-maid-table-expanded] table{width:100%;min-width:0}body[data-dsh-maid-atelier] [data-maid-table-expanded] :is(th,td){white-space:normal}body[data-dsh-maid-atelier] [data-maid-table-close]{z-index:3;corner-shape:round;cursor:pointer;background:#fcfaf5f0;border:1px solid #c5a4687a;border-radius:999px;width:30px;height:30px;position:absolute;top:10px;right:10px;box-shadow:0 8px 20px #1326571f}body[data-dsh-maid-atelier] [data-maid-table-close]:before,body[data-dsh-maid-atelier] [data-maid-table-close]:after{content:\"\";border-top:2px solid #172347;width:14px;position:absolute;top:14px;left:8px}body[data-dsh-maid-atelier] [data-maid-table-close]:before{transform:rotate(45deg)}body[data-dsh-maid-atelier] [data-maid-table-close]:after{transform:rotate(-45deg)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-table-close]{background:#132652f0;border-color:#d3b4778a}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-table-close]:before,body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-table-close]:after{border-top-color:#f3e8cf}@keyframes ahFhLW_maidAtelierTableOverlayIn{0%{opacity:0}to{opacity:1}}@keyframes ahFhLW_maidAtelierTableOverlayOut{0%{opacity:1}to{opacity:0}}@keyframes ahFhLW_maidAtelierTablePanelIn{0%{opacity:0;filter:blur(8px);transform:translateY(12px)scale(.94)}to{opacity:1;filter:none;transform:none}}@media (width<=700px){body[data-dsh-maid-atelier] [data-maid-table-lightbox]{left:0}body[data-dsh-maid-atelier] [data-maid-table-expanded]{width:max-content;min-width:100%}body[data-dsh-maid-atelier] [data-maid-table-expanded] table{width:max-content;min-width:0}}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) :is([data-variant],[data-chat-flow-kind=context]){--dsw-alias-label-secondary:#2f4778;--dsw-alias-label-tertiary:#405273}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-variant],[data-chat-flow-kind=context]){--dsw-alias-label-secondary:#d3ddf2;--dsw-alias-label-tertiary:#b8c5e1}body[data-dsh-maid-atelier] [data-step-process]>div>button[data-process-activity]{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:1px solid #c5a46847;border-radius:7px;padding:5px 8px}body[data-dsh-maid-atelier] [data-step-process]>div>button[data-process-activity]:is(:hover,:focus-visible,[aria-expanded=true]){color:var(--dsw-alias-label-primary);border-color:var(--maid-gold)}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) :is([data-variant],[data-chat-flow-kind=context]) [data-disclosure-row]{background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14);border-radius:7px}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-variant],[data-chat-flow-kind=context]) [data-disclosure-row]{background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29);border-radius:7px}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-workflow-run]>:not([data-open=true])>[data-disclosure-row]{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-workflow-run]>:not([data-open=true])>[data-disclosure-row]{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29)}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) :is([data-variant]:not([data-variant=think])>[data-open=true],[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>[data-open=true],[data-workflow-run]>[data-open=true]){background:linear-gradient(135deg,#f8faff80,#f8faff4d);border-radius:10px;overflow:hidden;box-shadow:inset 0 0 0 1px #ffffff57}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-variant]:not([data-variant=think])>[data-open=true],[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>[data-open=true],[data-workflow-run]>[data-open=true]){background:linear-gradient(135deg,#0a1430c2,#121f438a);border-radius:10px;overflow:hidden;box-shadow:inset 0 0 0 1px #97a9d82e}body[data-dsh-maid-atelier] :is([data-variant]:not([data-variant=think])>[data-open=true],[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>[data-open=true],[data-workflow-run]>[data-open=true]){backdrop-filter:blur(12px)saturate(.92)}body[data-dsh-maid-atelier] :is([data-variant]>:not([data-open=true]),[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>:not([data-open=true]))>[data-disclosure-row]{backdrop-filter:blur(8px)saturate(.92);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) :is([data-variant=bash]:not(:has([data-disclosure-row])),[data-chat-flow-kind=system-prompt] [data-disclosure-row],[data-tool=present]>:not([data-open=true])>[data-disclosure-row]){backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-variant=bash]:not(:has([data-disclosure-row])),[data-chat-flow-kind=system-prompt] [data-disclosure-row],[data-tool=present]>:not([data-open=true])>[data-disclosure-row]){backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-tool=skill]>:first-child{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-tool=skill]>:first-child{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) :is([data-variant]:not([data-variant=think])>[data-open=true],[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>[data-open=true],[data-workflow-run]>[data-open=true])>[data-disclosure-row],body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-variant]:not([data-variant=think])>[data-open=true],[data-chat-flow-kind=context]>[data-slot=\"conversation.chat.node\"]>[data-open=true],[data-workflow-run]>[data-open=true])>[data-disclosure-row]{backdrop-filter:none;background:0 0}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-variant=think]>[data-open=true]>[data-disclosure-row]{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%;display:inline-flex}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-variant=think]>[data-open=true]>[data-disclosure-row]{backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%;display:inline-flex}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-variant=think]>[data-open=true]>[data-disclosure-row]+*{backdrop-filter:blur(8px)saturate(.92);color:#34486f;background:linear-gradient(90deg,#f8faff52,#f8faff33 72%,#f8faff14);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%;padding:8px 12px;line-height:1.65;display:inline-block}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-variant=think]>[data-open=true]>[data-disclosure-row]+*{backdrop-filter:blur(8px)saturate(.92);color:#c7d2e9;background:linear-gradient(90deg,#0a143094,#0d193b66 72%,#0d193b29);border-radius:8px;align-self:flex-start;width:max-content;max-width:100%;padding:8px 12px;line-height:1.65;display:inline-block}body[data-dsh-maid-atelier] :is([data-tool=present]>[data-open=true],[data-changed-files]){backdrop-filter:blur(8px)saturate(.92);--dsw-alias-label-secondary:#2f4778;--dsw-alias-label-tertiary:#405273;background:linear-gradient(135deg,#f8faffa3,#f8faff70)}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-tool=present]>[data-open=true],[data-changed-files]){--dsw-alias-label-secondary:#d3ddf2;--dsw-alias-label-tertiary:#b8c5e1;background:linear-gradient(135deg,#0a1430c2,#121f438a)}body[data-dsh-maid-atelier] [data-tool=present]>:not([data-open=true])>[data-disclosure-row]{border-radius:8px;width:max-content;max-width:100%}body[data-dsh-maid-atelier] [data-tool=present]>[data-open=true]{border-radius:10px}body[data-dsh-maid-atelier] [data-variant=think][data-state=running] [class*=row]:after{will-change:transform, opacity;background:linear-gradient(90deg,#0000,#e1cfaa4d 46%,#8ea5da3d 62%,#0000);width:240px;animation:2.8s ease-in-out infinite ahFhLW_maid-atelier-reasoning-sweep;left:-240px}@keyframes ahFhLW_maid-atelier-reasoning-sweep{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}88%{opacity:1}to{opacity:0;transform:translate(calc(100vw + 240px))}}body[data-dsh-maid-atelier] [data-state=running] :is([class*=runState],[class*=stateDot]){filter:drop-shadow(0 0 6px #c5a468b3)}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-slot=\"conversation.session.header.actions\"] [role=tree]{--dsw-alias-label-primary:#233763;--dsw-alias-label-secondary:#40557f;--dsw-alias-label-tertiary:#596b8e;--dsw-alias-label-dimmed:#8995ad;--dsw-alias-border-l2:#5f75a966;--dsw-alias-interactive-bg-hover:#677eb724;color:#233763;text-shadow:none;backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(145deg,#f8faffed,#e8eefae3);border:1px solid #5f75a942;box-shadow:0 16px 36px #13265733}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-slot=\"conversation.session.header.actions\"] [role=tree] :is([role=treeitem],[class*=label]){color:#233763;text-shadow:none}body[data-dsh-maid-atelier]:not([data-ds-dark-theme]) [data-slot=\"conversation.session.header.actions\"] [role=tree] :is([class*=summary],[class*=metrics],[class*=notice]){color:#596b8e;text-shadow:none}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=\"conversation.session.header.actions\"] [role=tree]{--dsw-alias-label-primary:#edf1fa;--dsw-alias-label-secondary:#d3ddf2;--dsw-alias-label-tertiary:#b8c5e1;--dsw-alias-label-dimmed:#7f90b4;--dsw-alias-border-l2:#97a9d866;--dsw-alias-interactive-bg-hover:#a4b7e524;color:#edf1fa;text-shadow:none;backdrop-filter:blur(8px)saturate(.92);background:linear-gradient(145deg,#0a1430ed,#121f43e3);border:1px solid #97a9d842;box-shadow:0 16px 36px #00000052}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=\"conversation.session.header.actions\"] [role=tree] :is([role=treeitem],[class*=label]){color:#edf1fa;text-shadow:none}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=\"conversation.session.header.actions\"] [role=tree] :is([class*=summary],[class*=metrics],[class*=notice]){color:#b8c5e1;text-shadow:none}body[data-dsh-maid-atelier] [data-question-key]{--dsw-alias-label-primary:#142044;--dsw-alias-label-primary-bluish:#233663;--dsw-alias-label-secondary:#344a75;--dsw-alias-label-tertiary:#50638c;--dsw-alias-label-caption:#6d7994;--dsw-alias-label-dimmed:#a1a8b8;--dsw-alias-label-primary-foreground:#fffaf0;--dsw-alias-border-l1:#745b2f38;--dsw-alias-border-l2:#916e327a;--dsw-alias-border-l2-darkmode-thin:#916e3261;--dsw-alias-border-l4:#495b85a3;--dsw-alias-bg-overlay:#2f457717;--dsw-alias-bg-module-platform:#fffdf8b3;--dsw-alias-interactive-bg-hover:#3e58961c;--dsw-alias-state-business-primary:#385a9e;--dsw-specific-sidebar-nav-item-active-accent:#dbbe7c42;--dsw-alias-button-info-fill:#29477f;--dsw-specific-input-major:transparent;color:#142044;text-shadow:none}body[data-dsh-maid-atelier] [data-question-key]>section{backdrop-filter:blur(16px)saturate(.9);background:linear-gradient(145deg,#fffefaf7,#f4f7ffed);border-color:#be9952a8;box-shadow:0 16px 42px #0d1d4638,inset 0 0 0 1px #ffffffbd}body[data-dsh-maid-atelier] [data-question-key] [class*=header],body[data-dsh-maid-atelier] [data-question-key] [class*=header] :is(div,h2,span,button){color:#142044;text-shadow:none}body[data-dsh-maid-atelier] [data-question-key] [class*=header] [class*=eyebrow]{color:#50638c}body[data-dsh-maid-atelier] [data-question-key] :is(h2,button,input,textarea){color:inherit;text-shadow:none}body[data-dsh-maid-atelier] [data-question-key] [role=radio],body[data-dsh-maid-atelier] [data-question-key] [role=checkbox]{border-color:#0000}body[data-dsh-maid-atelier] [data-question-key] [role=radio]:is(:hover,:focus-visible),body[data-dsh-maid-atelier] [data-question-key] [role=checkbox]:is(:hover,:focus-visible),body[data-dsh-maid-atelier] [data-question-key] [aria-checked=true]{background:linear-gradient(90deg,#dce7ffc2,#faf4e5bd);border-color:#ae88427a;outline:none}body[data-dsh-maid-atelier] [data-question-key] [class*=description]{color:#4e638f}body[data-dsh-maid-atelier] [data-question-key] [class*=badge]{color:#29477f;background:#e5d3a661;border:1px solid #ae884247}body[data-dsh-maid-atelier] [data-question-key] footer>:last-child button:last-child{color:#fffaf0;background:linear-gradient(145deg,#4264a9,#29477f);border-color:#2f4f91;box-shadow:0 4px 12px #19306033}body[data-dsh-maid-atelier] [data-question-key] footer>:last-child button:first-child{color:#243966;background:#fffdf8bd;border-color:#4b608f57}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key]{--dsw-alias-label-primary:#edf1fa;--dsw-alias-label-primary-bluish:#dbe4f7;--dsw-alias-label-secondary:#c6d1e9;--dsw-alias-label-tertiary:#a2b1d0;--dsw-alias-label-caption:#8798bd;--dsw-alias-label-dimmed:#66769a;--dsw-alias-label-primary-foreground:#15234a;--dsw-alias-border-l1:#aabbe233;--dsw-alias-border-l2:#c1a26585;--dsw-alias-border-l2-darkmode-thin:#c1a26570;--dsw-alias-border-l4:#a4b5dd94;--dsw-alias-bg-overlay:#879ed324;--dsw-alias-bg-module-platform:#071230ad;--dsw-alias-interactive-bg-hover:#8ea5da29;--dsw-alias-state-business-primary:#9bb0e1;--dsw-specific-sidebar-nav-item-active-accent:#dbbe7c33;--dsw-alias-button-info-fill:#e7d19e;color:#edf1fa}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key]>section{background:linear-gradient(145deg,#13234cfa,#081330f5);border-color:#d3b477b3;box-shadow:0 18px 46px #0006,inset 0 0 0 1px #ffffff14}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [class*=header],body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [class*=header] :is(div,h2,span,button){color:#edf1fa}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [class*=header] [class*=eyebrow]{color:#a2b1d0}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [role=radio]:is(:hover,:focus-visible),body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [role=checkbox]:is(:hover,:focus-visible),body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [aria-checked=true]{background:linear-gradient(90deg,#4a63a380,#4c391e61);border-color:#d3b47780}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [class*=description]{color:#aab8d6}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] [class*=badge]{color:#efd79e;background:#d3b4772e;border-color:#dbbe7c57}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] footer>:last-child button:last-child{color:#fffaf0;background:linear-gradient(145deg,#6680bd,#405d9e);border-color:#8299d0;box-shadow:0 5px 14px #00000047}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-question-key] footer>:last-child button:first-child{color:#e7ecf7;background:#16264ee6;border-color:#aec0e657}body[data-dsh-maid-atelier] [data-composer-seat]:not([data-maid-composer-capsule]):has([data-goal-bar],[data-queue-dock],[data-testid=todo-panel]) [data-composer-card]{margin-top:20px}body[data-dsh-maid-atelier] [data-queue-dock]{margin-bottom:0}body[data-dsh-maid-atelier] [data-queue-dock]>div{border:.5px solid;border-radius:12px}body[data-dsh-maid-atelier] [data-queue-dock]>div:after{border:none}body[data-dsh-maid-atelier] :is([data-goal-bar],[data-queue-dock]){--dsw-alias-label-primary-dimmed:#344b78}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-goal-bar],[data-queue-dock]){--dsw-alias-label-primary-dimmed:#d7dfef}body[data-dsh-maid-atelier] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div){--dsw-alias-label-primary:#172347;--dsw-alias-label-secondary:#344b78;--dsw-alias-label-tertiary:#52658c;--dsw-alias-label-caption:#74809a;color:#172347;backdrop-filter:blur(14px)saturate(.9);background:#fcfaf5f0;border-color:#be99528f;box-shadow:0 8px 24px #0c1b4129}body[data-dsh-maid-atelier] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) button,body[data-dsh-maid-atelier] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header],body[data-dsh-maid-atelier] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header] :is(span,button){color:#172347;text-shadow:none}body[data-dsh-maid-atelier] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header]:focus-visible{outline-offset:2px;border-radius:6px;outline:1px solid #be9952c7;box-shadow:0 0 0 2px #fffdf8c2}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div){--dsw-alias-label-primary:#f4ead3;--dsw-alias-label-secondary:#d7dfef;--dsw-alias-label-tertiary:#afbddb;--dsw-alias-label-caption:#8f9fc2;color:#f4ead3;background:#0f1d41f2;border-color:#d3b477a8;box-shadow:0 8px 26px #0000004d,inset 0 1px #ffffff12}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) button,body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header],body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header] :is(span,button){color:#f4ead3}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([data-testid=todo-panel],[data-goal-bar]>div,[data-queue-dock]>div) [class*=header]:focus-visible{box-shadow:0 0 0 2px #071230b8}body[data-dsh-maid-atelier] :is([role=dialog],[role=menu],[data-radix-popper-content-wrapper]>*){color:var(--dsw-alias-label-primary,#172347);text-shadow:none;--dsw-alias-bg-base:#f8faff;--dsw-alias-bg-layer-1:#f8faff;--dsw-alias-bg-layer-2:#ebf0fa;--dsw-alias-bg-layer-3:#e0e7f6;--dsw-alias-bg-overlay:#f8faff;--dsw-specific-menu:var(--dsw-alias-bg-layer-3);--dsw-alias-label-primary:#172347;--dsw-alias-label-primary-bluish:#243866;--dsw-alias-label-secondary:#4d5d7f;--dsw-alias-label-tertiary:#52658c;--dsw-alias-label-caption:#55688c;--dsw-alias-border-l1:#475b912e;--dsw-alias-border-l2-darkmode-thin:#475b9140;--dsw-alias-border-l2:#475b914d;--dsw-alias-button-elevated-fill:#fffdf8e0;--dsw-alias-button-floating-fill:#fffdf8f0;--dsw-alias-button-floating-hover:#ece6d8;--dsw-alias-interactive-bg-hover:#677eb71f;--dsw-alias-interactive-bg-hover-solid:#e2e8f5;--dsw-alias-interactive-bg-active:#c5a4683d;--dsw-specific-input-major:#fffdf8d1;box-shadow:var(--maid-shadow);border-color:#c5a46885}body[data-dsh-maid-atelier][data-ds-dark-theme] :is([role=dialog],[role=menu],[data-radix-popper-content-wrapper]>*){color:var(--dsw-alias-label-primary,#e7ecf7);--dsw-alias-bg-base:#0d193b;--dsw-alias-bg-layer-1:#121f43;--dsw-alias-bg-layer-2:#182850;--dsw-alias-bg-layer-3:#20315b;--dsw-alias-bg-overlay:#0d193b;--dsw-specific-menu:var(--dsw-alias-bg-layer-3);--dsw-alias-label-primary:#e7ecf7;--dsw-alias-label-primary-bluish:#d5dff3;--dsw-alias-label-secondary:#bdc9e3;--dsw-alias-label-tertiary:#96a6c9;--dsw-alias-label-caption:#8b9bbd;--dsw-alias-border-l1:#97a9d833;--dsw-alias-border-l2-darkmode-thin:#97a9d84d;--dsw-alias-border-l2:#97a9d857;--dsw-alias-button-elevated-fill:#1c2c54f0;--dsw-alias-button-floating-fill:#1f315cf5;--dsw-alias-button-floating-hover:#354d88;--dsw-alias-interactive-bg-hover:#a4b7e524;--dsw-alias-interactive-bg-hover-solid:#293f78;--dsw-alias-interactive-bg-active:#d3b4773d;--dsw-specific-input-major:#111e42e0;box-shadow:var(--maid-shadow), inset 0 1px #ffffff14;border-color:#d3b477a8}body[data-dsh-maid-atelier] [class*=bubble][role=tooltip][data-side],body[data-dsh-maid-atelier] [role=tooltip][data-side]{background:var(--dsw-alias-tooltip-bg,#2c2c2e);box-shadow:none;color:var(--dsw-static-neutral-bluish-00,#fff);text-shadow:none;border:0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings] [role=presentation]>[role=dialog][aria-modal=true]{--dsw-alias-bg-layer-2:#ebf0faad;isolation:isolate;background:0 0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings] [role=presentation]>[role=dialog][aria-modal=true]:before{content:\"\";z-index:-1;pointer-events:none;background:var(--dsw-alias-bg-layer-2);backdrop-filter:blur(6px)saturate(.9);position:absolute;inset:0}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=sidebar\\.settings] [role=presentation]>[role=dialog][aria-modal=true]{--dsw-alias-bg-layer-2:#182850d1}@media (width<=1099px),(height<=680px){body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]{width:100dvw;max-width:none;height:100dvh;max-height:none;box-shadow:none;border:0;border-radius:0}}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav{min-height:0;padding-bottom:28px;position:relative;overflow:hidden}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:first-child{flex-shrink:0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:last-child{scrollbar-width:none;flex:auto;min-width:0;min-height:0;overflow-y:auto}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:last-child::-webkit-scrollbar{display:none}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:last-child>button{flex-shrink:0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav[data-maid-settings-more]:before{content:\"\";box-sizing:border-box;-webkit-backdrop-filter:blur(8px);pointer-events:none;background:#f7f9ff94;border:1px solid #c5a4687a;border-radius:10px;width:34px;height:20px;position:absolute;bottom:4px;left:calc(50% - 17px);box-shadow:0 2px 6px #0f1e481f,inset 0 1px #ffffff80}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav[data-maid-settings-more]:after{content:\"\";box-sizing:border-box;pointer-events:none;border:1.5px solid #52699c;border-width:0 1.5px 1.5px 0;width:8px;height:8px;position:absolute;bottom:12px;left:calc(50% - 4px);transform:rotate(45deg)}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav[data-maid-settings-more]:before{background:#182850a6;border-color:#d3b4777a;box-shadow:0 2px 6px #0000003d,inset 0 1px #ffffff14}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav[data-maid-settings-more]:after{border-color:#d3b477}@media (width<=640px){body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]{flex-direction:column}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav{box-sizing:border-box;border-bottom:1px solid #c5a4686b;flex-direction:row;align-items:stretch;gap:8px;width:100%;max-height:40%;padding:10px 12px 28px}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:last-child{flex:1;grid-template-columns:repeat(3,minmax(0,1fr));align-content:start;gap:4px;width:auto;display:grid}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:first-child{align-self:flex-start;padding:0 4px}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav button{min-width:0;height:36px;padding:7px 8px}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div{min-height:0}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:first-child{height:auto;min-height:46px;padding:8px 10px}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child{padding:0 14px 16px}}@media (width<=420px){body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav>:last-child{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=520px){body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_row]:has(>[class$=_rowText]){flex-direction:column;align-items:stretch}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_rowText]{width:100%;padding-right:0}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_row]:has(>[class$=_rowText])>:last-child,body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_selector]{box-sizing:border-box;width:100%;max-width:none}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_selector]{justify-content:space-between}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child :is([class$=_toggleRow],[class$=_selectRow]){flex-direction:column;align-items:stretch;gap:6px}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child :is([class$=_toggleRow],[class$=_selectRow])>span{width:100%}body[data-dsh-maid-atelier] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:last-child [class$=_selectRow] select{box-sizing:border-box;width:100%;max-width:none}}@supports (appearance:base-select){body[data-dsh-maid-atelier] [role=dialog] select{appearance:base-select;text-align:left;white-space:nowrap;text-overflow:ellipsis;background-image:none;align-items:center;display:flex;overflow:hidden}body[data-dsh-maid-atelier] [role=dialog] select[class$=_selectInput]{box-sizing:border-box;text-align:left;align-items:center;height:32px;padding-block:0;padding-inline:10px;line-height:22px;display:flex}body[data-dsh-maid-atelier] [role=dialog] select::picker-icon{content:\"\";clip-path:polygon(0 0,100% 0,50% 100%);background:#c5a468;flex:none;width:8px;height:6px;margin-left:10px;transition:transform .14s}body[data-dsh-maid-atelier] [role=dialog] select[class$=_selectInput]::picker-icon{flex:none;margin-left:auto}body[data-dsh-maid-atelier] [role=dialog] select:open::picker-icon{transform:rotate(180deg)}body[data-dsh-maid-atelier] [role=dialog] select::picker(select){appearance:base-select;color:#172347;scrollbar-color:#475b914d transparent;background:linear-gradient(145deg,#fcfaf5fa,#dee6f6f5);border:1px solid #c5a468a3;border-radius:10px;min-width:min(200px,100vw - 24px);max-height:min(420px,62vh);margin-block:4px;padding:4px;box-shadow:0 18px 44px #0d1d443d,inset 0 0 0 1px #ffffff85}body[data-dsh-maid-atelier] [role=dialog] select option{color:#4d5d7f;white-space:nowrap;text-overflow:ellipsis;background:0 0;border-left:2px solid #0000;border-radius:6px;align-items:center;min-height:30px;padding:7px 30px 7px 10px;overflow:hidden}body[data-dsh-maid-atelier] [role=dialog] select option:hover,body[data-dsh-maid-atelier] [role=dialog] select option:focus-visible{color:#172347;background:#677eb71f;border-left-color:#c5a468b8}body[data-dsh-maid-atelier] [role=dialog] select option:checked{color:#10204d;background:linear-gradient(90deg,#c5a46838,#0000 74%);border-left-color:#c5a468;font-weight:600}body[data-dsh-maid-atelier] [role=dialog] select option::checkmark{content:\"\";clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:currentColor;border:1px solid;width:7px;height:7px;margin-left:auto}body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select::picker-icon{background:#d3b477}body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select::picker(select){color:#e7ecf7;scrollbar-color:#8fa3d357 transparent;background:linear-gradient(145deg,#132652fa,#071333f7);border-color:#d3b477a8;box-shadow:0 20px 48px #0000006b,inset 0 0 0 1px #ffffff14}body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select option{color:#bdc9e3}body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select option:hover,body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select option:focus-visible{color:#e7ecf7;background:#a4b7e524;border-left-color:#d3b477c7}body[data-dsh-maid-atelier][data-ds-dark-theme] [role=dialog] select option:checked{color:#f3e8cf;background:linear-gradient(90deg,#d3b47733,#0000 74%);border-left-color:#d3b477}}body[data-dsh-maid-atelier] [class*=titlebar]>[class*=button]:first-of-type{display:none}body[data-dsh-maid-atelier] [data-skin-chrome=titlebar-brand]{color:#f3e3c0;--dsw-alias-label-primary-inverted:#10204d;pointer-events:none;justify-content:center;align-items:center;display:inline-flex;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}body[data-dsh-maid-atelier] [data-skin-chrome=titlebar-brand] svg{filter:drop-shadow(0 1px 2px #02081c9e);flex:none;width:auto;height:18px;display:block}@media (width<=700px){body[data-dsh-maid-atelier] [data-conversation-scroll]{scrollbar-width:none;margin-right:0}body[data-dsh-maid-atelier] [data-conversation-scroll]::-webkit-scrollbar{display:none}body[data-dsh-maid-atelier] [data-conversation-scroll]:has([data-conversation-composer-overlay])>[data-composer-seat]{right:0}}html[data-dsh-whale-maid-font=serif] body[data-dsh-maid-atelier] :is([data-chat-flow],[class*=userRow] [class*=bubble]:not([role=tooltip])){--dsw-font-family:Georgia, \"Times New Roman\", \"Songti SC\", \"Noto Serif SC\", \"Noto Serif CJK SC\", STSong, SimSun, serif;font-family:var(--dsw-font-family)}html[data-dsh-whale-maid-font=serif] body[data-dsh-maid-atelier] [data-chat-flow] div[class*=markdown],html[data-dsh-whale-maid-font=serif] body[data-dsh-maid-atelier] [data-chat-flow] div[class*=markdown] :is(h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th),html[data-dsh-whale-maid-font=serif] body[data-dsh-maid-atelier] [data-composer-card] :is([data-composer-input],textarea,button,[class*=triggerLabel]){font-family:Georgia,Times New Roman,Songti SC,Noto Serif SC,Noto Serif CJK SC,STSong,SimSun,serif}html[data-dsh-whale-maid-font=serif] body[data-dsh-maid-atelier] [data-chat-flow] div[class*=markdown] :is(code,pre,kbd,samp){font-family:var(--ds-font-family-code,ui-monospace, \"SF Mono\", Menlo, Consolas, monospace)}body[data-dsh-maid-atelier] [data-skin-chrome=top-trim]{top:0}body[data-dsh-maid-atelier] [class*=titlebar]{background:linear-gradient(#1f3876e6 0%,#162b61ed 25%,#0d1d46f5 55%,#091333fa 100%);border-bottom:1px solid #c5a4686b;position:relative}body[data-dsh-maid-atelier][data-ds-dark-theme] [class*=titlebar]{background:linear-gradient(#17295ce6 0%,#0f1e48ed 25%,#081334f5 55%,#040b26fa 100%);border-bottom-color:#d3b47780}body[data-dsh-maid-atelier] [class*=titlebar] [class*=button]{color:#d9bd83}body[data-dsh-maid-atelier] [class*=titlebar] [class*=button]:hover{color:#f3e3c0;background:#5775be47}@media (width<=700px){body[data-dsh-maid-atelier] [data-conversation-scroll] [class*=viewArea]{--dsh-composer-side-clearance:0px}}@media (pointer:coarse){body[data-dsh-maid-atelier]{-webkit-tap-highlight-color:transparent}body[data-dsh-maid-atelier] :is(button,[role=button],select,input){touch-action:manipulation}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav button{height:auto;min-height:44px}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div>:first-child>:last-child{min-width:44px;min-height:44px}body[data-dsh-maid-atelier] [data-maid-table-close]{width:44px;height:44px}body[data-dsh-maid-atelier] [data-maid-table-close]:before,body[data-dsh-maid-atelier] [data-maid-table-close]:after{width:20px;top:21px;left:12px}body[data-dsh-maid-atelier] [data-composer-seat]{padding-bottom:max(0px, env(safe-area-inset-bottom,0px))}body[data-dsh-maid-atelier][data-maid-settings-open] [data-slot=sidebar\\.settings]>[role=presentation]>[role=dialog]>nav+div{padding-bottom:max(12px, env(safe-area-inset-bottom,0px))}}@media (prefers-reduced-motion:reduce){body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]{will-change:auto;animation:none}body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]>g,body[data-dsh-maid-atelier] [data-maid-session-row] svg[data-state=ongoing]>g>circle{animation:none}body[data-dsh-maid-atelier] [data-variant=think][data-state=running] [class*=row]:after,body[data-dsh-maid-atelier] [data-composer-card] button,body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame],body[data-dsh-maid-atelier] [data-chat-flow-kind=assistant-step] [data-maid-table-frame]>[data-maid-table-expand],body[data-dsh-maid-atelier] [data-maid-table-lightbox],body[data-dsh-maid-atelier] [data-maid-table-panel],body[data-dsh-maid-atelier] [data-composer-card],body[data-dsh-maid-atelier] [data-composer-input]{transition:none;animation:none}}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]{corner-shape:round;background:var(--maid-composer-surface);border:1px solid #c5a46880;border-radius:999px;gap:0;max-width:320px;min-height:34px;padding:0;transition:border-color .15s,box-shadow .15s,transform .15s;animation:.22s cubic-bezier(.22,.78,.2,1) both ahFhLW_maidAtelierCapsuleIn;overflow:hidden;box-shadow:0 4px 14px #0f1e4824,inset 0 1px #fff9}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]{box-shadow:0 4px 14px #0000006b,inset 0 1px #ffffff12}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] :is([data-input-scroll],[data-composer-card]>[class*=row]){display:none!important}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-slot=\"conversation.composer.dock\"]{display:none}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]:before{content:none;filter:none;border-image-source:none;display:none}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]>[data-skin-chrome=composer-lace]{display:none}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]:after{content:\"✎ 给智能体发消息\";z-index:1;border-radius:inherit;box-shadow:none;backdrop-filter:none;color:var(--dsw-alias-label-caption);font-family:Georgia, \"Times New Roman\", var(--dsw-font-family);letter-spacing:.02em;cursor:text;pointer-events:none;background:0 0;justify-content:center;align-items:center;font-size:13px;display:flex;inset:0}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-capsule] [data-composer-card]:hover{border-color:#e1bf7cd9;transform:translateY(-1px);box-shadow:0 6px 18px #0f1e4833,inset 0 1px #ffffffb3}body[data-dsh-maid-atelier] [data-phase=active] [data-composer-seat][data-maid-composer-expanding] [data-composer-card]{animation:.26s cubic-bezier(.22,.78,.2,1) both ahFhLW_maidAtelierCapsuleOut}body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=left][data-side=left]:after,body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=right][data-side=right]:after{background:linear-gradient(to bottom, transparent calc(var(--dsh-width-handle-pointer-y,50%) - 56px), #4b95ba38 calc(var(--dsh-width-handle-pointer-y,50%) - 46px), #4b95ba calc(var(--dsh-width-handle-pointer-y,50%) - 30px), #accfe0 calc(var(--dsh-width-handle-pointer-y,50%) - 14px), #fbfdff var(--dsh-width-handle-pointer-y,50%), #accfe0 calc(var(--dsh-width-handle-pointer-y,50%) + 14px), #4b95ba calc(var(--dsh-width-handle-pointer-y,50%) + 30px), #4b95ba38 calc(var(--dsh-width-handle-pointer-y,50%) + 46px), transparent calc(var(--dsh-width-handle-pointer-y,50%) + 56px));filter:drop-shadow(0 0 1px #fbfdfff5)drop-shadow(0 0 4px #4b95ba80);width:3px}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=left][data-side=left]:after,body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=right][data-side=right]:after{background:linear-gradient(to bottom, transparent calc(var(--dsh-width-handle-pointer-y,50%) - 54px), var(--maid-periwinkle) calc(var(--dsh-width-handle-pointer-y,50%) - 36px), var(--maid-gold-soft) calc(var(--dsh-width-handle-pointer-y,50%) - 12px), var(--maid-porcelain) var(--dsh-width-handle-pointer-y,50%), var(--maid-gold-soft) calc(var(--dsh-width-handle-pointer-y,50%) + 12px), var(--maid-periwinkle) calc(var(--dsh-width-handle-pointer-y,50%) + 36px), transparent calc(var(--dsh-width-handle-pointer-y,50%) + 54px));filter:drop-shadow(0 0 1px #091333fa)drop-shadow(0 0 6px #e2cfaad1)}body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=left][data-side=left]:is(:hover,[data-dragging]):after,body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=right][data-side=right]:is(:hover,[data-dragging]):after{transform-origin:50%;animation:1.15s ease-in-out infinite ahFhLW_maidAtelierWidthHandlePulse}body[data-dsh-maid-atelier] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:before{background:#526aa8b8;box-shadow:0 0 0 1px #f8f6f08a}body[data-dsh-maid-atelier] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:is(:hover,:focus-visible):before{background:var(--maid-gold);box-shadow:0 0 0 1px var(--maid-porcelain), 0 0 7px #c5a468b8}body[data-dsh-maid-atelier] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label][aria-current=true]:before{background:var(--maid-ink);box-shadow:0 0 0 1px var(--maid-gold-soft), 0 0 7px #17234780}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:before{background:#8ea5dab8;box-shadow:0 0 0 1px #091333e6}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label]:is(:hover,:focus-visible):before,body[data-dsh-maid-atelier][data-ds-dark-theme] [data-phase=active] :has(+*>*>[data-chat-flow])>nav button[type=button][aria-label][aria-current=true]:before{background:var(--maid-gold-soft);box-shadow:0 0 0 1px var(--maid-porcelain), 0 0 8px #e2cfaac2}@keyframes ahFhLW_maidAtelierWidthHandlePulse{0%,to{opacity:.78;transform:scaleX(.82)}50%{opacity:1;transform:scaleX(1.2)}}@media (prefers-reduced-motion:reduce){body[data-dsh-maid-atelier] div:not([data-sidebar-collapsed]):has(>:is([data-pane=sidebar],[class*=sidebarCol])) :is([data-pane=sidebar],[class*=sidebarCol]),body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=left][data-side=left]:after,body[data-dsh-maid-atelier] [data-phase=active]>:has(>[data-conversation-scroll])>[data-width-handle=right][data-side=right]:after{animation:none}}@keyframes ahFhLW_maidAtelierCapsuleIn{0%{opacity:0;transform:translateY(10px)scale(.94)}to{opacity:1;transform:none}}@keyframes ahFhLW_maidAtelierCapsuleOut{0%{opacity:.35;transform:translateY(8px)}to{opacity:1;transform:none}}";
		const tagId$1 = "@smalltailqwq/dsh-client-ui-skin-maid-atelier/maid-atelier.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-maid-atelier";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region \0dsh-css:src/client/boot-error.module.css.mjs
		const css = "body[data-dsh-maid-atelier] [data-dsh-boot][data-maid-boot-error]{box-sizing:border-box;background:radial-gradient(#edf2fb,#d5e1f2);grid-template-columns:minmax(0,480px);grid-template-areas:\"RN379q_report\";place-content:center;align-items:center;gap:24px;padding:clamp(20px,3vw,48px);display:grid;overflow:auto}body[data-dsh-maid-atelier][data-ds-dark-theme] [data-dsh-boot][data-maid-boot-error]{background:radial-gradient(#1b3057,#080f25)}body[data-dsh-maid-atelier] [data-maid-boot-error]>div{box-sizing:border-box;border:1px solid var(--maid-gold);background:var(--maid-glass);width:100%;min-width:0;max-height:calc(100dvh - 96px);box-shadow:var(--maid-shadow);overflow-wrap:anywhere;border-radius:20px;grid-area:RN379q_report;padding:clamp(20px,3vw,36px);overflow:auto}body[data-dsh-maid-atelier] [data-maid-boot-error]>div>div{min-width:0;max-width:100%}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]{--maid-boot-figure-height:min(76dvh, 700px, calc((100vw - 580px) * 1.4));grid-template-areas:\"RN379q_left RN379q_report RN379q_right\";grid-template-columns:calc(var(--maid-boot-figure-height) * .29) minmax(280px, 480px) calc(var(--maid-boot-figure-height) * .33);align-items:start;gap:0}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]>div{z-index:1;margin-top:calc(var(--maid-boot-figure-height) * .4);max-height:calc(100dvh - 96px - var(--maid-boot-figure-height) * .4);background:#f4f7fc}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-boot-error]>div{background:#182a49}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:before,html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:after{content:\"\";width:calc(var(--maid-boot-figure-height) * .5);height:var(--maid-boot-figure-height);pointer-events:none;background:50%/contain no-repeat;justify-self:start;display:block}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:before{background-image:var(--maid-boot-error-left-art);grid-area:RN379q_left}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:after{margin-left:calc(var(--maid-boot-figure-height) * -.175);background-image:var(--maid-boot-error-right-art);grid-area:RN379q_right}@media (width<=860px){html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]{--maid-boot-figure-height:min(34dvh, 260px);grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:\"RN379q_left RN379q_right\"\"RN379q_report RN379q_report\";align-content:start;gap:12px 24px}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:before,html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:after{width:100%;margin-left:0}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]>div{max-height:none;margin-top:0}}@media (width<=420px){html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]{--maid-boot-figure-height:min(22dvh, 150px);grid-template-columns:minmax(0,1fr);grid-template-areas:\"RN379q_report\"\"RN379q_left\"\"RN379q_right\";row-gap:8px}html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:before,html:not([data-dsh-whale-maid-art=hidden]) body[data-dsh-maid-atelier] [data-maid-boot-error]:after{width:min(100%,200px);height:var(--maid-boot-figure-height);justify-self:center}}";
		const tagId = "@smalltailqwq/dsh-client-ui-skin-maid-atelier/boot-error.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@smalltailqwq/dsh-client-ui-skin-maid-atelier";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/titlebar-brand.ts
		/**
		* Whale-free DeepSeek Harness wordmark for the frameless title bar.
		* Extracted from the official BrandWordmark (ui-primitives): the whale clip
		* group is dropped and the viewBox is re-cropped to the letterforms and the
		* HARNESS badge. Ink rides currentColor; the badge text knocks out in
		* --dsw-alias-label-primary-inverted, exactly like the sidebar brand.
		*/
		const MAID_ATELIER_TITLEBAR_BRAND = `<svg viewBox="26 4.2 155.6 17.6" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M68.416 18.2447H67.0501V16.1272H68.416C69.2619 16.1272 70.1166 15.9163 70.6671 15.3304C71.2181 14.7444 71.426 13.8455 71.426 12.9471C71.426 12.0487 71.2268 11.1498 70.6671 10.5643C70.1083 9.97831 69.2619 9.76744 68.416 9.76744C67.5701 9.76744 66.7154 9.97831 66.1639 10.5643C65.6129 11.1503 65.4049 12.0487 65.4049 12.9471V21.6435H63.009V7.6582H65.4049V8.54883H65.8442C65.8918 8.49393 65.9394 8.44728 65.9875 8.40064C66.5871 7.85353 67.5049 7.6582 68.4072 7.6582C69.8212 7.6582 71.2341 8.00998 72.1607 8.98662C73.0868 9.96325 73.4143 11.4632 73.4143 12.9558C73.4143 14.4485 73.0785 15.9406 72.1607 16.925C71.2424 17.9094 69.8212 18.2457 68.416 18.2457V18.2447Z" fill="currentColor"/> <path d="M31.9551 8.03497H33.3204V10.1525H31.9551C31.1087 10.1525 30.2545 10.3633 29.7035 10.9493C29.1525 11.5353 28.945 12.4342 28.945 13.3326C28.945 14.231 29.1447 15.1294 29.7035 15.7154C30.2623 16.3014 31.1087 16.5122 31.9551 16.5122C32.8015 16.5122 33.6562 16.3014 34.2072 15.7154C34.7582 15.1294 34.9657 14.231 34.9657 13.3326V4.62842H37.3611V18.6219H34.9657V17.7313H34.5264C34.4783 17.7857 34.4307 17.8329 34.3826 17.8795C33.7835 18.4261 32.8652 18.6219 31.9629 18.6219C30.5494 18.6219 29.136 18.2707 28.2099 17.294C27.2838 16.3174 26.9563 14.817 26.9563 13.3248C26.9563 11.8327 27.2916 10.34 28.2099 9.35561C29.136 8.37898 30.5494 8.03497 31.9551 8.03497Z" fill="currentColor"/> <path d="M49.3786 13.1431V13.9948H42.9984V12.2996H47.2305C47.1348 11.6825 46.9113 11.1043 46.5119 10.682C45.9371 10.0727 45.0503 9.85409 44.1723 9.85409C43.2943 9.85409 42.4076 10.0727 41.8328 10.682C41.258 11.2913 41.05 12.2213 41.05 13.1435C41.05 14.0658 41.2575 15.003 41.8328 15.6046C42.4076 16.2061 43.2939 16.433 44.1723 16.433C45.0508 16.433 45.9371 16.2143 46.5119 15.6046C46.5916 15.5186 46.6635 15.4248 46.7354 15.331H49.0992C48.8918 16.0657 48.5643 16.7299 48.0691 17.2454C47.111 18.2531 45.6339 18.6205 44.1723 18.6205C42.7108 18.6205 41.2337 18.2609 40.2755 17.2454C39.3174 16.2299 38.9661 14.6828 38.9661 13.1435C38.9661 11.6043 39.3096 10.0494 40.2755 9.04168C41.242 8.03396 42.7108 7.66663 44.1723 7.66663C45.6339 7.66663 47.111 8.02618 48.0691 9.04168C49.0351 10.0572 49.3786 11.6043 49.3786 13.1435V13.1431Z" fill="currentColor"/> <path d="M61.4045 13.1431V13.9948H55.0243V12.2996H59.2564C59.1602 11.6825 58.9372 11.1043 58.5378 10.682C57.963 10.0727 57.0762 9.85409 56.1982 9.85409C55.3202 9.85409 54.4335 10.0727 53.8587 10.682C53.2839 11.2913 53.0759 12.2213 53.0759 13.1435C53.0759 14.0658 53.2834 15.003 53.8587 15.6046C54.4335 16.2061 55.3202 16.433 56.1982 16.433C57.0762 16.433 57.963 16.2143 58.5378 15.6046C58.6179 15.5186 58.6894 15.4248 58.7608 15.331H61.1251C60.9171 16.0657 60.5897 16.7299 60.0945 17.2454C59.1364 18.2531 57.6593 18.6205 56.1982 18.6205C54.7372 18.6205 53.2596 18.2609 52.3014 17.2454C51.3432 16.2299 50.9919 14.6828 50.9919 13.1435C50.9919 11.6043 51.3355 10.0494 52.3014 9.04168C53.2678 8.03396 54.7367 7.66663 56.1982 7.66663C57.6598 7.66663 59.1364 8.02618 60.0945 9.04168C61.061 10.0572 61.4045 11.6043 61.4045 13.1435V13.1431Z" fill="currentColor"/> <path d="M80.242 18.6214C81.7035 18.6214 83.1801 18.4105 84.1383 17.809C85.0965 17.2075 85.4482 16.2931 85.4482 15.3869C85.4482 14.4807 85.1042 13.5585 84.1383 12.9647C83.1801 12.371 81.703 12.1518 80.242 12.1518C79.6186 12.1518 79.0438 12.0658 78.6366 11.8394C78.2294 11.6047 78.0778 11.2534 78.0778 10.9017C78.0778 10.5499 78.2216 10.1908 78.6366 9.9639C79.0438 9.72921 79.6749 9.65147 80.2973 9.65147C80.9198 9.65147 81.5509 9.73747 81.9591 9.9639C82.3663 10.1986 82.5179 10.5499 82.5179 10.9017H84.9531C84.9531 9.99499 84.6421 9.07327 83.7719 8.47951C82.9017 7.88576 81.5679 7.66663 80.2424 7.66663C78.9169 7.66663 77.5837 7.8775 76.713 8.47951C75.8427 9.08104 75.5308 9.99499 75.5308 10.9017C75.5308 11.8083 75.8423 12.73 76.713 13.3238C77.5832 13.9176 78.9165 14.1367 80.2424 14.1367C80.929 14.1367 81.688 14.2227 82.1428 14.4491C82.5985 14.676 82.7579 15.0351 82.7579 15.3869C82.7579 15.7387 82.5985 16.0977 82.1428 16.3246C81.688 16.5511 80.9931 16.6371 80.3066 16.6371C79.62 16.6371 78.9169 16.5511 78.4694 16.3246C78.0224 16.0982 77.8543 15.7387 77.8543 15.3869H75.0435C75.0435 16.2935 75.3865 17.2153 76.3534 17.809C77.3194 18.4028 78.7809 18.6214 80.2424 18.6214H80.242Z" fill="currentColor"/> <path d="M97.4733 13.1431V13.9948H91.0932V12.2996H95.3252C95.23 11.6825 95.006 11.1043 94.6071 10.682C94.0313 10.0727 93.1456 9.85409 92.2666 9.85409C91.3876 9.85409 90.5018 10.0727 89.927 10.682C89.3522 11.2913 89.1452 12.2213 89.1452 13.1435C89.1452 14.0658 89.3522 15.003 89.927 15.6046C90.5018 16.2061 91.3886 16.433 92.2666 16.433C93.1446 16.433 94.0313 16.2143 94.6071 15.6046C94.6863 15.5186 94.7587 15.4248 94.8301 15.331H97.1935C96.9855 16.0657 96.6585 16.7299 96.1639 17.2454C95.2057 18.2531 93.7281 18.6205 92.2666 18.6205C90.805 18.6205 89.3284 18.2609 88.3703 17.2454C87.4121 16.2299 87.0613 14.6828 87.0613 13.1435C87.0613 11.6043 87.4043 10.0494 88.3703 9.04168C89.3367 8.03396 90.806 7.66663 92.2666 7.66663C93.7272 7.66663 95.2057 8.02618 96.1639 9.04168C97.1298 10.0572 97.4729 11.6043 97.4729 13.1435L97.4733 13.1431Z" fill="currentColor"/> <path d="M109.499 13.1431V13.9948H103.119V12.2996H107.351C107.256 11.6825 107.032 11.1043 106.632 10.682C106.057 10.0727 105.172 9.85409 104.293 9.85409C103.414 9.85409 102.528 10.0727 101.953 10.682C101.378 11.2913 101.17 12.2213 101.17 13.1435C101.17 14.0658 101.378 15.003 101.953 15.6046C102.528 16.2061 103.415 16.433 104.293 16.433C105.171 16.433 106.057 16.2143 106.632 15.6046C106.712 15.5186 106.784 15.4248 106.856 15.331H109.22C109.012 16.0657 108.685 16.7299 108.19 17.2454C107.231 18.2531 105.754 18.6205 104.293 18.6205C102.831 18.6205 101.355 18.2609 100.396 17.2454C99.4382 16.2299 99.0864 14.6828 99.0864 13.1435C99.0864 11.6043 99.4295 10.0494 100.396 9.04168C101.362 8.03396 102.832 7.66663 104.293 7.66663C105.754 7.66663 107.231 8.02618 108.19 9.04168C109.156 10.0572 109.499 11.6043 109.499 13.1435V13.1431Z" fill="currentColor"/> <path d="M113.5 4.62817H111.104V18.6217H113.5V4.62817Z" fill="currentColor"/> <path d="M117.589 12.8154L121.517 18.6208H118.554L114.625 12.8154L118.554 8.15088H121.517L117.589 12.8154Z" fill="currentColor"/> <rect x="129.348" y="5.5" width="52" height="14" rx="2" fill="currentColor"/> <g clipPath="url(#maid-titlebar-brand-clip)"> <path d="M132.848 8.93205H134.08V16.137H132.848V8.93205ZM136.5 8.93205H137.732V16.137H136.5V8.93205ZM133.365 13.024V11.99H137.193V13.024H133.365Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M140.397 14.432L140.672 13.453H143.202L143.532 14.432H140.397ZM140.287 16.137H139.055L141.277 8.93205H142.201L142.146 9.74605L140.947 13.915H140.969L140.287 16.137ZM145.039 16.137H143.741L143.07 13.948L143.081 13.937L141.871 9.74605L141.926 8.93205H142.817L145.039 16.137Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M146.846 8.93205H149.068C149.852 8.93205 150.443 9.11538 150.839 9.48205C151.235 9.84138 151.433 10.3327 151.433 10.956C151.433 11.22 151.396 11.4657 151.323 11.693C151.249 11.9204 151.125 12.1257 150.949 12.309C150.773 12.4924 150.531 12.65 150.223 12.782C149.922 12.9067 149.541 13.0057 149.079 13.079V13.321H146.846V12.639L148.023 12.485C148.631 12.4044 149.09 12.298 149.398 12.166C149.706 12.034 149.915 11.8764 150.025 11.693C150.135 11.5024 150.19 11.2934 150.19 11.066C150.19 10.6994 150.083 10.417 149.871 10.219C149.658 10.021 149.324 9.92205 148.87 9.92205H146.846V8.93205ZM146.395 8.93205H147.627V16.137H146.395V8.93205ZM151.917 16.093V16.137H150.366L149.024 14.322C148.87 14.1094 148.73 13.9407 148.606 13.816C148.481 13.684 148.345 13.5887 148.199 13.53C148.052 13.464 147.872 13.42 147.66 13.398C147.447 13.3687 147.176 13.3504 146.846 13.343V13.145H149.079C149.233 13.211 149.368 13.2844 149.486 13.365C149.61 13.4457 149.735 13.5447 149.86 13.662C149.992 13.7794 150.138 13.937 150.3 14.135L151.917 16.093Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M153.58 9.57005L153.591 8.93205H154.46L157.584 15.51V16.137H156.704L153.58 9.57005ZM158.024 16.137H156.968L156.88 8.93205H158.024V16.137ZM154.24 16.137H153.096V8.93205H154.152L154.24 16.137Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M159.963 8.93205H161.206V16.137H159.963V8.93205ZM160.095 9.96605V8.93205H164.858V9.96605H160.095ZM160.095 16.137V15.103H164.902V16.137H160.095ZM160.095 13.013V11.99H164.374V13.013H160.095Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M169.052 15.257C169.543 15.257 169.895 15.1654 170.108 14.982C170.328 14.7987 170.438 14.5457 170.438 14.223C170.438 14.047 170.405 13.8967 170.339 13.772C170.273 13.6474 170.152 13.5337 169.976 13.431C169.807 13.321 169.558 13.2147 169.228 13.112L168.491 12.881C167.846 12.6757 167.38 12.4044 167.094 12.067C166.808 11.7297 166.665 11.3007 166.665 10.78C166.665 10.428 166.76 10.1017 166.951 9.80105C167.142 9.50038 167.428 9.25838 167.809 9.07505C168.19 8.89172 168.663 8.80005 169.228 8.80005C169.631 8.80005 169.998 8.82938 170.328 8.88805C170.665 8.93938 171.039 9.01638 171.45 9.11905L171.274 10.175C170.834 10.0504 170.442 9.96238 170.097 9.91105C169.76 9.85238 169.463 9.82305 169.206 9.82305C168.737 9.82305 168.403 9.90738 168.205 10.076C168.007 10.2374 167.908 10.439 167.908 10.681C167.908 10.857 167.941 11.0147 168.007 11.154C168.073 11.286 168.19 11.407 168.359 11.517C168.535 11.627 168.784 11.7334 169.107 11.836L169.866 12.078C170.526 12.276 170.995 12.5327 171.274 12.848C171.553 13.156 171.692 13.585 171.692 14.135C171.692 14.5604 171.589 14.9344 171.384 15.257C171.179 15.5797 170.878 15.8327 170.482 16.016C170.093 16.1994 169.609 16.291 169.03 16.291C168.627 16.291 168.212 16.247 167.787 16.159C167.362 16.071 166.9 15.9427 166.401 15.774L166.665 14.718C167.156 14.894 167.6 15.0297 167.996 15.125C168.399 15.213 168.751 15.257 169.052 15.257Z" fill="var(--dsw-alias-label-primary-inverted)"/> <path d="M175.809 15.257C176.3 15.257 176.652 15.1654 176.865 14.982C177.085 14.7987 177.195 14.5457 177.195 14.223C177.195 14.047 177.162 13.8967 177.096 13.772C177.03 13.6474 176.909 13.5337 176.733 13.431C176.564 13.321 176.315 13.2147 175.985 13.112L175.248 12.881C174.603 12.6757 174.137 12.4044 173.851 12.067C173.565 11.7297 173.422 11.3007 173.422 10.78C173.422 10.428 173.517 10.1017 173.708 9.80105C173.899 9.50038 174.185 9.25838 174.566 9.07505C174.947 8.89172 175.42 8.80005 175.985 8.80005C176.388 8.80005 176.755 8.82938 177.085 8.88805C177.422 8.93938 177.796 9.01638 178.207 9.11905L178.031 10.175C177.591 10.0504 177.199 9.96238 176.854 9.91105C176.517 9.85238 176.22 9.82305 175.963 9.82305C175.494 9.82305 175.16 9.90738 174.962 10.076C174.764 10.2374 174.665 10.439 174.665 10.681C174.665 10.857 174.698 11.0147 174.764 11.154C174.83 11.286 174.947 11.407 175.116 11.517C175.292 11.627 175.541 11.7334 175.864 11.836L176.623 12.078C177.283 12.276 177.752 12.5327 178.031 12.848C178.31 13.156 178.449 13.585 178.449 14.135C178.449 14.5604 178.346 14.9344 178.141 15.257C177.936 15.5797 177.635 15.8327 177.239 16.016C176.85 16.1994 176.366 16.291 175.787 16.291C175.384 16.291 174.969 16.247 174.544 16.159C174.119 16.071 173.657 15.9427 173.158 15.774L173.422 14.718C173.913 14.894 174.357 15.0297 174.753 15.125C175.156 15.213 175.508 15.257 175.809 15.257Z" fill="var(--dsw-alias-label-primary-inverted)"/> </g> <defs> <clipPath id="maid-titlebar-brand-clip"> <rect width="46" height="14" fill="white" transform="translate(132.348 5.5)"/> </clipPath> </defs></svg>`;
		//#endregion
		//#region src/client/composer-capsule.ts
		/**
		* Empty-state composer capsule: when the skin setting 'composerMode' is
		* 'capsule', an empty, unfocused active composer collapses into a compact
		* pill ("✎ 给智能体发消息"); clicking the pill focuses the editor to
		* expand it, typing keeps it expanded, and any open popover (model picker,
		* mode list, attachments) keeps it expanded too. Ported from the PR #42 idea
		* but attribute-driven instead of document-level :has(): the module owns the
		* 'data-maid-composer-capsule' seat attribute and the stylesheet reacts to
		* it, so typing never re-evaluates a document-wide selector.
		*
		* The fold/unfold layout swap is instant; the only animated properties are
		* compositor-friendly transform/opacity keyframes (see the stylesheet), so
		* state flips never reflow the transcript. Clicking content bound to the
		* composer area (todo, queue messages, goal progress) is ignored — focus is
		* stolen only for clicks landing on the pill card itself.
		*/
		const SEAT_SELECTOR$1 = "[data-composer-seat]";
		const SCROLLPORT_SELECTOR$1 = "[data-conversation-scroll]";
		const CHAT_FLOW_SELECTOR$1 = "[data-chat-flow]";
		const CARD_SELECTOR = "[data-composer-card]:not([class*='cardWorkspaceTrigger'])";
		const INPUT_SELECTOR = "[data-composer-input]";
		const MODE_ATTRIBUTE$1 = "data-maid-composer-mode";
		const CAPSULE_ATTRIBUTE = "data-maid-composer-capsule";
		const EXPANDING_ATTRIBUTE = "data-maid-composer-expanding";
		const MENU_OPEN_SELECTOR = "[aria-expanded='true']";
		const POPOVER_SELECTOR = [
			"[role=\"menu\"]",
			"[role=\"listbox\"]",
			"[role=\"dialog\"]",
			"[aria-modal=\"true\"]",
			"[data-radix-popper-content-wrapper]",
			"[data-floating-ui-portal]"
		].join(",");
		const EXPAND_LIFETIME_MS = 280;
		const HIGH_CHURN_SELECTOR = ".xterm";
		const ownershipByDocument$1 = /* @__PURE__ */ new WeakMap();
		function phaseRootOf$1(element) {
			let candidate = element.closest("[data-phase]");
			while (candidate !== null) {
				if (candidate.querySelector(SCROLLPORT_SELECTOR$1)?.closest("[data-phase]") === candidate) return candidate;
				candidate = candidate.parentElement?.closest("[data-phase]") ?? null;
			}
			return null;
		}
		function belongsToHighChurnSubtree(node) {
			if (node instanceof Element) return node.matches(HIGH_CHURN_SELECTOR) || node.closest(HIGH_CHURN_SELECTOR) !== null;
			return (node.parentElement?.closest(HIGH_CHURN_SELECTOR) ?? null) !== null;
		}
		/**
		* @param body - skin owning element (document.body) used to reach the
		* document; the mode attribute lives on documentElement.
		*/
		function installMaidComposerCapsule(body) {
			const doc = body.ownerDocument;
			const token = Symbol("maid-composer-capsule");
			const ownership = ownershipByDocument$1.get(doc) ?? {
				token,
				originals: /* @__PURE__ */ new Map()
			};
			ownership.token = token;
			ownershipByDocument$1.set(doc, ownership);
			const current = () => ownership.token === token;
			const remember = (seat) => {
				if (ownership.originals.has(seat)) return;
				ownership.originals.set(seat, {
					capsule: seat.getAttribute(CAPSULE_ATTRIBUTE),
					expanding: seat.getAttribute(EXPANDING_ATTRIBUTE)
				});
			};
			const write = (seat, attribute, value) => {
				if (!current()) return;
				remember(seat);
				if (value === null) seat.removeAttribute(attribute);
				else seat.setAttribute(attribute, value);
			};
			const restoreAttribute = (seat, attribute) => {
				if (!current()) return;
				const snapshot = ownership.originals.get(seat);
				if (snapshot === void 0) return;
				const value = attribute === CAPSULE_ATTRIBUTE ? snapshot.capsule : snapshot.expanding;
				if (value === null) seat.removeAttribute(attribute);
				else seat.setAttribute(attribute, value);
			};
			const restoreSeat = (seat, snapshot) => {
				if (snapshot.capsule === null) seat.removeAttribute(CAPSULE_ATTRIBUTE);
				else seat.setAttribute(CAPSULE_ATTRIBUTE, snapshot.capsule);
				if (snapshot.expanding === null) seat.removeAttribute(EXPANDING_ATTRIBUTE);
				else seat.setAttribute(EXPANDING_ATTRIBUTE, snapshot.expanding);
			};
			const timers = /* @__PURE__ */ new Set();
			const wasCapsule = /* @__PURE__ */ new WeakMap();
			const interacted = /* @__PURE__ */ new WeakMap();
			const schedule = (callback, delay) => {
				const timer = setTimeout(() => {
					timers.delete(timer);
					callback();
				}, delay);
				timers.add(timer);
			};
			const capsuleMode = () => doc.documentElement.getAttribute(MODE_ATTRIBUTE$1) === "capsule";
			const synchronize = () => {
				if (!current()) return;
				const active = capsuleMode();
				doc.querySelectorAll(SEAT_SELECTOR$1).forEach((seat) => {
					const root = phaseRootOf$1(seat);
					const scrollport = seat.closest(SCROLLPORT_SELECTOR$1);
					const pending = () => {
						remember(seat);
						restoreAttribute(seat, CAPSULE_ATTRIBUTE);
						restoreAttribute(seat, EXPANDING_ATTRIBUTE);
					};
					if (!active || root?.dataset.phase !== "active" || scrollport === null || scrollport.querySelector(CHAT_FLOW_SELECTOR$1) === null) {
						wasCapsule.set(seat, false);
						pending();
						return;
					}
					const card = seat.querySelector(CARD_SELECTOR);
					const input = card?.querySelector(INPUT_SELECTOR) ?? null;
					if (card === null || input === null) {
						wasCapsule.set(seat, false);
						pending();
						return;
					}
					const empty = (input.textContent ?? "").trim() === "";
					const focused = card.contains(doc.activeElement);
					const menuOpen = card.querySelector(MENU_OPEN_SELECTOR) !== null;
					const next = empty && !focused && !menuOpen && interacted.get(seat) !== true;
					const previous = wasCapsule.get(seat) === true;
					wasCapsule.set(seat, next);
					if (next) {
						write(seat, CAPSULE_ATTRIBUTE, "");
						restoreAttribute(seat, EXPANDING_ATTRIBUTE);
						return;
					}
					restoreAttribute(seat, CAPSULE_ATTRIBUTE);
					if (previous) {
						write(seat, EXPANDING_ATTRIBUTE, "");
						schedule(() => {
							restoreAttribute(seat, EXPANDING_ATTRIBUTE);
						}, EXPAND_LIFETIME_MS);
					} else restoreAttribute(seat, EXPANDING_ATTRIBUTE);
				});
			};
			const onPointerDown = (event) => {
				if (!current()) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const card = target.closest(CARD_SELECTOR);
				if (card !== null) {
					const seat = card.closest(SEAT_SELECTOR$1);
					if (seat !== null) interacted.set(seat, true);
					return;
				}
				if (target.closest(SEAT_SELECTOR$1) !== null || target.closest(POPOVER_SELECTOR) !== null) return;
				doc.querySelectorAll(SEAT_SELECTOR$1).forEach((seat) => {
					interacted.set(seat, false);
				});
				synchronize();
			};
			const onFocusIn = (event) => {
				if (!current()) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const seat = target.closest(SEAT_SELECTOR$1);
				if (seat === null) return;
				interacted.set(seat, true);
				synchronize();
			};
			const onFocusOut = (event) => {
				if (!current()) return;
				const target = event.target;
				if (!(target instanceof Element) || target.closest(SEAT_SELECTOR$1) === null) return;
				queueMicrotask(synchronize);
			};
			const onInput = (event) => {
				if (!current()) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const seat = target.closest(SEAT_SELECTOR$1);
				if (seat === null) return;
				interacted.set(seat, true);
				synchronize();
			};
			const onClick = (event) => {
				if (!current()) return;
				const target = event.target;
				if (!(target instanceof Element)) return;
				const card = target.closest(CARD_SELECTOR);
				if (card === null) return;
				const seat = card.closest(SEAT_SELECTOR$1);
				if (seat === null || !seat.hasAttribute(CAPSULE_ATTRIBUTE)) return;
				const input = card.querySelector(INPUT_SELECTOR);
				if (input === null || card.contains(doc.activeElement)) return;
				interacted.set(seat, true);
				restoreAttribute(seat, CAPSULE_ATTRIBUTE);
				input.focus({ preventScroll: true });
			};
			const touchComposerMutation = (record) => {
				if (record.type === "attributes") {
					const element = record.target instanceof Element ? record.target : void 0;
					if (record.attributeName === "data-phase") return element !== void 0 && phaseRootOf$1(element) === element;
					return element?.closest(SEAT_SELECTOR$1) !== null;
				}
				if (belongsToHighChurnSubtree(record.target)) return false;
				if (record.target instanceof Element && record.target.closest(INPUT_SELECTOR) !== null) return false;
				const changed = [...record.addedNodes, ...record.removedNodes];
				if (changed.length === 0) return record.target instanceof Element && record.target.closest(SEAT_SELECTOR$1) !== null;
				if (changed.every(belongsToHighChurnSubtree)) return false;
				const targetElement = record.target instanceof Element ? record.target : void 0;
				return (targetElement?.closest(SEAT_SELECTOR$1) ?? null) !== null || (targetElement?.closest(SCROLLPORT_SELECTOR$1) ?? null) !== null || changed.some((node) => node instanceof Element && (node.matches([
					SEAT_SELECTOR$1,
					CARD_SELECTOR,
					INPUT_SELECTOR
				].join(", ")) || node.querySelector([
					SEAT_SELECTOR$1,
					CARD_SELECTOR,
					INPUT_SELECTOR
				].join(", ")) !== null));
			};
			const observer = new MutationObserver((records) => {
				if (!records.some(touchComposerMutation)) return;
				synchronize();
			});
			observer.observe(doc.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["aria-expanded", "data-phase"]
			});
			const modeObserver = new MutationObserver(() => {
				synchronize();
			});
			modeObserver.observe(doc.documentElement, {
				attributes: true,
				attributeFilter: [MODE_ATTRIBUTE$1]
			});
			doc.addEventListener("pointerdown", onPointerDown, true);
			doc.addEventListener("focusin", onFocusIn, true);
			doc.addEventListener("focusout", onFocusOut, true);
			doc.addEventListener("input", onInput, true);
			doc.addEventListener("click", onClick);
			synchronize();
			return () => {
				observer.disconnect();
				modeObserver.disconnect();
				doc.removeEventListener("pointerdown", onPointerDown, true);
				doc.removeEventListener("focusin", onFocusIn, true);
				doc.removeEventListener("focusout", onFocusOut, true);
				doc.removeEventListener("input", onInput, true);
				doc.removeEventListener("click", onClick);
				timers.forEach((timer) => {
					clearTimeout(timer);
				});
				timers.clear();
				if (current()) {
					ownership.originals.forEach((snapshot, seat) => {
						restoreSeat(seat, snapshot);
					});
					ownership.originals.clear();
					ownershipByDocument$1.delete(doc);
				}
			};
		}
		//#endregion
		//#region src/client/composer-dismiss.ts
		const SEAT_SELECTOR = "[data-composer-seat]";
		const OPEN_PILL_SELECTOR = "[data-composer-stats] button[aria-expanded='true'][aria-haspopup='dialog']";
		const HIDING_ATTRIBUTES = ["data-maid-composer-hidden", "data-maid-composer-capsule"];
		const installations$2 = /* @__PURE__ */ new WeakMap();
		/**
		* @param body - skin owning element (document.body) used to reach the
		* document; the hide states live on the composer seats.
		*/
		function installMaidComposerDismiss(body) {
			const doc = body.ownerDocument;
			let installation = installations$2.get(doc);
			if (installation === void 0) {
				installation = {
					users: 0,
					dispose: observeComposer(body)
				};
				installations$2.set(doc, installation);
			}
			const current = installation;
			current.users += 1;
			let active = true;
			return () => {
				if (!active) return;
				active = false;
				if (--current.users > 0) return;
				current.dispose();
				installations$2.delete(doc);
			};
		}
		function observeComposer(body) {
			const hidden = /* @__PURE__ */ new WeakMap();
			const synchronize = (seat) => {
				const hiding = HIDING_ATTRIBUTES.some((attribute) => seat.hasAttribute(attribute));
				if (hidden.get(seat) === hiding) return;
				hidden.set(seat, hiding);
				if (!hiding) return;
				seat.querySelectorAll(OPEN_PILL_SELECTOR).forEach((pill) => {
					pill.click();
				});
			};
			const observer = new MutationObserver((records) => {
				const seats = /* @__PURE__ */ new Set();
				for (const record of records) if (record.target instanceof HTMLElement && record.target.matches(SEAT_SELECTOR) && body.contains(record.target)) seats.add(record.target);
				seats.forEach(synchronize);
			});
			const dispose = () => {
				observer.disconnect();
			};
			try {
				observer.observe(body, {
					attributes: true,
					attributeFilter: [...HIDING_ATTRIBUTES],
					subtree: true
				});
				body.querySelectorAll(SEAT_SELECTOR).forEach(synchronize);
			} catch (error) {
				dispose();
				throw error;
			}
			return dispose;
		}
		//#endregion
		//#region src/client/composer-scroll.ts
		/**
		* Composer scroll-intent presentation: scrolling up through the transcript
		* fades the docked composer out, scrolling back down (or reaching the
		* bottom) fades it in. Ported from the ORCA LINK approach (see
		* orca-link/src/client/composer-motion.ts) and gated by the skin-manager
		* setting `composerMode` (`data-maid-composer-mode` on <html>, owned by
		* installMaidCustomization; active only for the 'scroll' choice).
		*
		* The module only presents a reversible visibility state on the host's
		* stable data hooks; it never submits prompts or creates sessions. When the
		* switch is off (or the manager has not applied a state yet), every listener
		* stays inert and no seat state is touched.
		*/
		const SCROLLPORT_SELECTOR = "[data-conversation-scroll]";
		const COMPOSER_SEAT_SELECTOR = "[data-composer-seat]";
		const CHAT_FLOW_SELECTOR = "[data-chat-flow]";
		const MODE_ATTRIBUTE = "data-maid-composer-mode";
		const HIDDEN_ATTRIBUTE = "data-maid-composer-hidden";
		const INTERACTIVE_ATTRIBUTE = "data-maid-composer-interactive";
		const NESTED_SCROLL_SURFACE_SELECTOR = [
			"[role=\"menu\"]",
			"[role=\"listbox\"]",
			"[role=\"dialog\"]",
			"[aria-modal=\"true\"]",
			"[data-radix-popper-content-wrapper]",
			"[data-floating-ui-portal]"
		].join(",");
		const SCROLL_THRESHOLD = 10;
		const BOTTOM_THRESHOLD = 24;
		const SEAT_GESTURE_WINDOW_MS = 200;
		const ownershipByDocument = /* @__PURE__ */ new WeakMap();
		function phaseRootOf(element) {
			let candidate = element.closest("[data-phase]");
			while (candidate !== null) {
				if (candidate.querySelector(SCROLLPORT_SELECTOR)?.closest("[data-phase]") === candidate) return candidate;
				candidate = candidate.parentElement?.closest("[data-phase]") ?? null;
			}
			return null;
		}
		function scrollEnabled(doc) {
			return doc.documentElement.getAttribute(MODE_ATTRIBUTE) === "scroll";
		}
		function activeSeatOf(scrollport) {
			if (phaseRootOf(scrollport)?.dataset.phase !== "active") return null;
			if (scrollport.querySelector(CHAT_FLOW_SELECTOR) === null) return null;
			return scrollport.querySelector(COMPOSER_SEAT_SELECTOR);
		}
		/**
		* Wheeling inside an open popover (model picker, mode list, attachments)
		* must not drive the composer state. Any scrollable element on the event
		* path before the transcript scrollport owns the gesture.
		*/
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
		* @param body - skin owning element (document.body) used to reach the
		* document; the switch attribute lives on documentElement.
		*/
		function installMaidComposerScroll(body) {
			const doc = body.ownerDocument;
			const token = Symbol("maid-composer-scroll");
			const ownership = ownershipByDocument.get(doc) ?? {
				token,
				originals: /* @__PURE__ */ new Map()
			};
			ownership.token = token;
			ownershipByDocument.set(doc, ownership);
			const current = () => ownership.token === token;
			const remember = (seat) => {
				if (ownership.originals.has(seat)) return;
				ownership.originals.set(seat, {
					hidden: seat.getAttribute(HIDDEN_ATTRIBUTE),
					interactive: seat.getAttribute(INTERACTIVE_ATTRIBUTE)
				});
			};
			const write = (seat, attribute, value) => {
				if (!current()) return;
				remember(seat);
				if (value === null) seat.removeAttribute(attribute);
				else seat.setAttribute(attribute, value);
			};
			const restoreSeat = (seat, snapshot) => {
				if (snapshot.hidden === null) seat.removeAttribute(HIDDEN_ATTRIBUTE);
				else seat.setAttribute(HIDDEN_ATTRIBUTE, snapshot.hidden);
				if (snapshot.interactive === null) seat.removeAttribute(INTERACTIVE_ATTRIBUTE);
				else seat.setAttribute(INTERACTIVE_ATTRIBUTE, snapshot.interactive);
			};
			const clearSeatStates = () => {
				if (!current()) return;
				ownership.originals.forEach((snapshot, seat) => {
					restoreSeat(seat, snapshot);
				});
			};
			const lastTops = /* @__PURE__ */ new WeakMap();
			const blurSeat = (seat) => {
				const active = doc.activeElement;
				if (active instanceof HTMLElement && seat.contains(active)) active.blur();
			};
			const hideSeat = (seat) => {
				if (!current() || !scrollEnabled(doc)) return;
				write(seat, INTERACTIVE_ATTRIBUTE, null);
				blurSeat(seat);
				write(seat, HIDDEN_ATTRIBUTE, "");
			};
			const showSeat = (seat) => {
				write(seat, HIDDEN_ATTRIBUTE, null);
			};
			const activateSeat = (seat) => {
				showSeat(seat);
				write(seat, INTERACTIVE_ATTRIBUTE, "");
				if (!scrollEnabled(doc)) write(seat, INTERACTIVE_ATTRIBUTE, null);
			};
			let seatGestureUntil = 0;
			const onScroll = (event) => {
				if (!current() || !scrollEnabled(doc)) return;
				const scrollport = event.target;
				if (!(scrollport instanceof HTMLElement) || !scrollport.matches(SCROLLPORT_SELECTOR)) return;
				const seat = activeSeatOf(scrollport);
				if (seat === null) return;
				const top = scrollport.scrollTop;
				const previousTop = lastTops.get(scrollport);
				lastTops.set(scrollport, top);
				if (Date.now() < seatGestureUntil) return;
				if (scrollport.scrollHeight - top - scrollport.clientHeight <= BOTTOM_THRESHOLD) {
					showSeat(seat);
					return;
				}
				if (previousTop !== void 0 && top > previousTop + SCROLL_THRESHOLD) showSeat(seat);
				else if (previousTop !== void 0 && top < previousTop - SCROLL_THRESHOLD) hideSeat(seat);
			};
			const onWheel = (event) => {
				if (!current() || !scrollEnabled(doc)) return;
				if (wheelTargetsSeatDraft(event)) {
					seatGestureUntil = Date.now() + SEAT_GESTURE_WINDOW_MS;
					return;
				}
				if (Math.abs(event.deltaY) <= SCROLL_THRESHOLD) return;
				for (const candidate of event.composedPath()) {
					if (!(candidate instanceof HTMLElement) || !candidate.matches(SCROLLPORT_SELECTOR)) continue;
					const scrollport = candidate;
					if (wheelBelongsToNestedSurface(event, scrollport)) return;
					const seat = activeSeatOf(scrollport);
					if (seat === null) return;
					if (!lastTops.has(scrollport)) lastTops.set(scrollport, scrollport.scrollTop);
					if (event.deltaY < 0) hideSeat(seat);
					else showSeat(seat);
					return;
				}
			};
			const onFocusIn = (event) => {
				if (!current()) return;
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
					if (current() && !seat.contains(doc.activeElement)) write(seat, INTERACTIVE_ATTRIBUTE, null);
				});
			};
			const stateObserver = new MutationObserver((records) => {
				if (!current()) return;
				if (!records.some((record) => record.type === "attributes" && record.attributeName === MODE_ATTRIBUTE)) return;
				if (!scrollEnabled(doc)) clearSeatStates();
			});
			stateObserver.observe(doc.documentElement, {
				attributes: true,
				attributeFilter: [MODE_ATTRIBUTE]
			});
			doc.addEventListener("scroll", onScroll, true);
			doc.addEventListener("wheel", onWheel, true);
			doc.addEventListener("focusin", onFocusIn, true);
			doc.addEventListener("focusout", onFocusOut, true);
			return () => {
				stateObserver.disconnect();
				doc.removeEventListener("scroll", onScroll, true);
				doc.removeEventListener("wheel", onWheel, true);
				doc.removeEventListener("focusin", onFocusIn, true);
				doc.removeEventListener("focusout", onFocusOut, true);
				if (current()) {
					clearSeatStates();
					ownership.originals.clear();
					ownershipByDocument.delete(doc);
				}
			};
		}
		//#endregion
		//#region src/client/mobile-drawer.ts
		/**
		* `@deepseek-ai/dsh-client-ui-layout` closes its narrow sidebar only from the
		* toggle button. Two gestures a phone user expects are therefore missing:
		*
		* 1. picking a session calls `openSession`, which never touches
		*    `narrowExpanded`, so the drawer keeps covering the conversation after a
		*    session switch and has to be closed by hand;
		* 2. tapping outside the open drawer does nothing at all — the host's
		*    `overlayLayer` is only an overlay container (`pointer-events: none`, no
		*    handler), not a scrim, so the drawer stays up until the toggle is found
		*    again.
		*
		* Both are mirrored here: a row activation closes the overlay on the next
		* frame, and a pointer that lands outside the open column dismisses it. The tap
		* that dismisses is then swallowed, because on a phone the control behind the
		* drawer is usually the composer — and its send button sits exactly in the
		* corner a reader aims at when dismissing.
		*
		* A settings dialog opened from the drawer is deliberately *not* a dismissal:
		* closing one surface must not close another the reader opened. The drawer
		* stays where it was and the dialog closes on its own.
		*
		* The breakpoint mirrors `SIDEBAR_AUTO_COLLAPSE` in the layout package: below it
		* the collapsed column is a rail and the expanded column is an overlay, above it
		* the column is docked and must stay open.
		*/
		const DRAWER_AUTO_COLLAPSE = 1024;
		const SIDEBAR_COLUMN_SELECTOR$1 = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
		const SESSION_ROW_SELECTOR = "[data-maid-session-row], [role=\"treeitem\"][class*=\"sessionRow\"]";
		const ROW_AFFORDANCE_SELECTOR = "[role=\"menu\"], [role=\"dialog\"], input, textarea, [aria-haspopup]";
		/** Popups own the tap that dismisses them, so the drawer waits its turn. */
		const OPEN_POPUP_SELECTOR = [
			"[role=\"menu\"]",
			"[role=\"listbox\"]",
			"[role=\"dialog\"]",
			"[aria-modal=\"true\"]",
			"[data-radix-popper-content-wrapper]",
			"[data-floating-ui-portal]"
		].join(",");
		/** The host's resize handle is a drag, not a dismissal. */
		const DRAG_HANDLE_SELECTOR = "[class*='handle']";
		/** How long a dismissing pointer keeps swallowing the click it produced. */
		const SWALLOW_WINDOW_MS = 400;
		/**
		* Close the narrow sidebar when a session row (or the sidebar's New Session
		* button) is activated, and when a tap lands outside the open drawer.
		* @param body - skin owning element (document.body); supplies the document and view.
		* @returns disposer removing the listeners installed here.
		*/
		function installMaidMobileDrawerAutoClose(body) {
			const doc = body.ownerDocument;
			const view = doc.defaultView;
			if (view === null) return () => {};
			let pendingFrame = null;
			let swallowTimer = null;
			const drawerOpen = () => view.innerWidth < DRAWER_AUTO_COLLAPSE && doc.querySelector("div[data-sidebar-collapsed]") === null && (doc.querySelector(SIDEBAR_COLUMN_SELECTOR$1)?.getBoundingClientRect().width ?? 0) > 0;
			const closeDrawer = () => {
				if (!drawerOpen()) return;
				doc.querySelector(SIDEBAR_COLUMN_SELECTOR$1)?.querySelector("button[class*='toggle']")?.click();
			};
			/** Gestures that keep the drawer open: its own chrome, a popup, a drag handle. */
			const ownsGesture = (target) => target.closest(SIDEBAR_COLUMN_SELECTOR$1) !== null || target.closest(ROW_AFFORDANCE_SELECTOR) !== null || target.closest(DRAG_HANDLE_SELECTOR) !== null || doc.querySelector(OPEN_POPUP_SELECTOR) !== null;
			/** Dismiss the drawer for a gesture outside it; true when it was open to close. */
			const dismissOutside = (target) => {
				if (!drawerOpen() || ownsGesture(target)) return false;
				closeDrawer();
				return true;
			};
			const armSwallow = () => {
				if (swallowTimer !== null) clearTimeout(swallowTimer);
				swallowTimer = setTimeout(() => {
					swallowTimer = null;
				}, SWALLOW_WINDOW_MS);
			};
			const releaseSwallow = () => {
				if (swallowTimer === null) return false;
				clearTimeout(swallowTimer);
				swallowTimer = null;
				return true;
			};
			const onPointerDown = (event) => {
				if (event.isPrimary === false || event.button > 0) return;
				const target = event.target;
				if (!(target instanceof Element) || !dismissOutside(target)) return;
				armSwallow();
			};
			const onMouseDown = (event) => {
				if (swallowTimer !== null) event.preventDefault();
			};
			const onClick = (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;
				if (releaseSwallow()) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}
				if (drawerOpen() && dismissOutside(target)) return;
				if (target.closest(ROW_AFFORDANCE_SELECTOR) !== null) return;
				const row = target.closest(SESSION_ROW_SELECTOR);
				const newSession = target.closest("button[class*='newSession']");
				if (row === null && newSession === null) return;
				if (target.closest(SIDEBAR_COLUMN_SELECTOR$1) === null) return;
				const control = target.closest("button, [role=\"button\"], a");
				if (control !== null && row !== null && control !== row && row.contains(control)) return;
				if (!drawerOpen() || pendingFrame !== null) return;
				pendingFrame = view.requestAnimationFrame(() => {
					pendingFrame = null;
					closeDrawer();
				});
			};
			doc.addEventListener("pointerdown", onPointerDown, true);
			doc.addEventListener("mousedown", onMouseDown, true);
			doc.addEventListener("click", onClick, true);
			return () => {
				doc.removeEventListener("pointerdown", onPointerDown, true);
				doc.removeEventListener("mousedown", onMouseDown, true);
				doc.removeEventListener("click", onClick, true);
				if (pendingFrame !== null) view.cancelAnimationFrame(pendingFrame);
				pendingFrame = null;
				releaseSwallow();
			};
		}
		//#endregion
		//#region src/client/mobile-viewport.ts
		/**
		* Phone viewport: keep the host shell and the composer inside the band the
		* software keyboard leaves visible.
		*
		* `html`, `body` and `#root` are height-locked to the layout viewport, and the
		* layout viewport does not shrink for the software keyboard — iOS never does,
		* Android only when the page opts in through the `interactive-widget` viewport
		* hint. A focused composer therefore stays behind the keyboard, and the
		* height-locked page has no scroll range to bring it back.
		*
		* This module appends that hint where the engine accepts it and, when the
		* keyboard still shrinks only the visual viewport, publishes `--maid-vv-height`
		* and `--maid-vv-top` and marks the root so the stylesheet can pin the
		* application to the band `VisualViewport` reports. It also brings the composer
		* back into the band once per keyboard opening, which is what a landscape phone
		* needs: the hero stack is centred and taller than the band, so the composer
		* would otherwise sit below the fold.
		*
		* Every write is idempotent and remembered, so a viewport that stops changing
		* stops writing; the disposer removes the listeners, the published variables and
		* the viewport hint the module appended — and nothing else.
		*/
		/** Root attribute that tells the stylesheet the shell is pinned to the keyboard. */
		const KEYBOARD_ATTRIBUTE = "data-maid-keyboard";
		/** The visual viewport's height, published for the shell and the takeover cards. */
		const HEIGHT_PROPERTY = "--maid-vv-height";
		/** The visual viewport's offset from the layout viewport's top edge. */
		const TOP_PROPERTY = "--maid-vv-top";
		/** The seat's card: the composer while a prompt is being drafted. */
		const COMPOSER_CARD_SELECTOR = "[data-composer-card]";
		/** The takeover card that replaces the composer while a question or plan pends. */
		const TAKEOVER_CARD_SELECTOR = ":is([data-question-key], [data-plan-review-key]) > section";
		/** Phone widths own the bar-less layout; above them the host's own rail is in charge. */
		const PHONE_MAX_WIDTH = 700;
		/** A touch pointer owns the keyboard shell even in landscape, where the shell is wide. */
		const COARSE_QUERY = "(pointer: coarse)";
		/** A visual viewport this much shorter than the layout viewport is a keyboard. */
		const KEYBOARD_MIN_GAP = 120;
		/** The composer mounts with the shell; a few settle passes cover the rest. */
		const SETTLE_DELAYS = [
			250,
			1e3,
			3e3
		];
		/**
		* Keep the phone shell inside the visual viewport while the software keyboard is
		* open.
		* @param body - skin owning element (document.body); supplies the document and view.
		* @returns disposer restoring the meta hint and removing every listener and variable.
		*/
		function installMaidMobileViewport(body) {
			const doc = body.ownerDocument;
			const defaultView = doc.defaultView;
			if (defaultView === null) return () => {};
			const view = defaultView;
			const root = doc.documentElement;
			const visual = view.visualViewport ?? null;
			const meta = doc.querySelector("meta[name='viewport']");
			const originalContent = meta?.getAttribute("content") ?? null;
			const hinted = meta !== null && originalContent !== null && !originalContent.includes("interactive-widget");
			if (meta !== null && hinted) meta.setAttribute("content", `${originalContent}, interactive-widget=resizes-content`);
			const raf = view.requestAnimationFrame?.bind(view);
			const caf = view.cancelAnimationFrame?.bind(view);
			let frame = null;
			let nudgeFrame = null;
			let pending = false;
			let disposed = false;
			let heightWritten = null;
			let topWritten = null;
			let keyboardMarked = false;
			const settleTimers = [];
			/** The card whose top the band must contain: the composer, or its takeover. */
			const resolveAnchor = () => doc.querySelector(COMPOSER_CARD_SELECTOR) ?? doc.querySelector(TAKEOVER_CARD_SELECTOR);
			const publish = (property, value, previous) => {
				if (value === previous) return previous;
				root.style.setProperty(property, value);
				return value;
			};
			function update() {
				if (disposed) return;
				const phone = view.innerWidth <= PHONE_MAX_WIDTH;
				const coarse = view.matchMedia?.(COARSE_QUERY)?.matches ?? false;
				const unscaled = visual === null || Math.abs(visual.scale - 1) <= .01;
				const height = visual !== null && unscaled ? visual.height : view.innerHeight;
				const offset = visual !== null && unscaled ? visual.offsetTop : 0;
				const keyboard = (coarse || phone) && visual !== null && unscaled && view.innerHeight - visual.height > KEYBOARD_MIN_GAP;
				const opened = keyboard && !keyboardMarked;
				heightWritten = publish(HEIGHT_PROPERTY, `${Math.round(height)}px`, heightWritten);
				topWritten = publish(TOP_PROPERTY, `${Math.round(offset)}px`, topWritten);
				if (keyboard !== keyboardMarked) {
					keyboardMarked = keyboard;
					if (keyboard) root.setAttribute(KEYBOARD_ATTRIBUTE, "open");
					else root.removeAttribute(KEYBOARD_ATTRIBUTE);
				}
				const anchor = resolveAnchor();
				const box = anchor?.getBoundingClientRect();
				if (!opened || anchor === null || box === void 0 || box.bottom <= offset + height + 1) return;
				const nudge = () => {
					nudgeFrame = null;
					if (!disposed) anchor.scrollIntoView?.({
						block: "end",
						inline: "nearest"
					});
				};
				if (raf === void 0) nudge();
				else nudgeFrame = raf(nudge);
			}
			function schedule() {
				if (pending || disposed) return;
				pending = true;
				if (raf === void 0) {
					pending = false;
					update();
					return;
				}
				frame = raf(() => {
					frame = null;
					pending = false;
					update();
				});
			}
			const onViewportChange = () => {
				schedule();
			};
			view.addEventListener("resize", onViewportChange);
			doc.addEventListener("focusin", onViewportChange, true);
			visual?.addEventListener("resize", onViewportChange);
			visual?.addEventListener("scroll", onViewportChange);
			schedule();
			for (const delay of SETTLE_DELAYS) settleTimers.push(setTimeout(() => {
				schedule();
			}, delay));
			return () => {
				disposed = true;
				if (frame !== null && caf !== void 0) caf(frame);
				if (nudgeFrame !== null && caf !== void 0) caf(nudgeFrame);
				frame = null;
				nudgeFrame = null;
				pending = false;
				for (const timer of settleTimers) clearTimeout(timer);
				settleTimers.length = 0;
				view.removeEventListener("resize", onViewportChange);
				doc.removeEventListener("focusin", onViewportChange, true);
				visual?.removeEventListener("resize", onViewportChange);
				visual?.removeEventListener("scroll", onViewportChange);
				if (keyboardMarked) root.removeAttribute(KEYBOARD_ATTRIBUTE);
				keyboardMarked = false;
				if (heightWritten !== null) root.style.removeProperty(HEIGHT_PROPERTY);
				if (topWritten !== null) root.style.removeProperty(TOP_PROPERTY);
				heightWritten = null;
				topWritten = null;
				if (meta !== null && hinted && originalContent !== null) meta.setAttribute("content", originalContent);
			};
		}
		//#endregion
		//#region src/client/settings-navigation.ts
		const NAV_SELECTOR = "[data-slot='sidebar.settings'] > [role='presentation'] > [role='dialog'] > nav";
		const MORE_ATTRIBUTE = "data-maid-settings-more";
		const installations$1 = /* @__PURE__ */ new WeakMap();
		/** The existing settings observer calls synchronize when the host replaces its navigation. */
		function createMaidSettingsNavigation(body) {
			const doc = body.ownerDocument;
			let installation = installations$1.get(doc);
			if (installation === void 0) {
				installation = {
					users: 0,
					controller: createNavigation(body)
				};
				installations$1.set(doc, installation);
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
					installations$1.delete(doc);
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
		const ATTR_ART = "data-dsh-whale-maid-art";
		const ATTR_FONT = "data-dsh-whale-maid-font";
		const ATTR_MODEL_EXIT = "data-dsh-whale-maid-model-exit";
		const ATTR_MODEL = "data-dsh-whale-model";
		const ATTR_FLASH_GLASSES = "data-dsh-whale-maid-flash-glasses";
		const ATTR_COMPOSER_MODE = "data-maid-composer-mode";
		const ATTR_NAV_MODE = "data-maid-nav-mode";
		/** Navigation layouts the stylesheet implements; anything else falls back to the default. */
		const NAV_MODES = /* @__PURE__ */ new Set([
			"corner",
			"topbar",
			"rail"
		]);
		/**
		* The lineup is DeepSeek Flash and DeepSeek Pro, so the display name only
		* decides which side the artwork sits on. Both families carry vision now: the
		* glasses artwork is a separate switch (`flashGlasses`) instead of a `vision`
		* substring match, which used to split an older V4 name into a third family.
		*/
		function modelFamily(name) {
			const compact = name.toLowerCase().replace(/[^a-z0-9]/g, "");
			if (!compact.includes("deepseek")) return null;
			if (compact.includes("pro")) return "pro";
			if (compact.includes("flash")) return "flash";
			return null;
		}
		/** Expose controls and keep every resulting DOM mutation skin-owned. */
		function installMaidCustomization(root = document.documentElement) {
			const projector = new SkinAttributeProjector(root);
			let observer;
			let frame;
			let activeState = null;
			let mobile = window.innerWidth <= 700;
			const synchronizeModel = () => {
				let family = null;
				for (const trigger of document.querySelectorAll("[data-composer-card] button[aria-haspopup='menu']")) {
					family = modelFamily(`${trigger.title} ${trigger.getAttribute("aria-label") ?? ""} ${trigger.textContent ?? ""}`);
					if (family !== null) break;
				}
				if (family === null) projector.unset(ATTR_MODEL);
				else projector.set(ATTR_MODEL, family);
			};
			const scheduleModelSync = () => {
				if (frame !== void 0) return;
				frame = requestAnimationFrame(() => {
					frame = void 0;
					synchronizeModel();
				});
			};
			const startModelObserver = () => {
				if (observer !== void 0) return;
				observer = new MutationObserver((records) => {
					if (records.some((record) => {
						const element = record.target instanceof Element ? record.target : void 0;
						if (record.type === "childList" && element?.closest("[data-composer-input]")) return false;
						if (record.type === "attributes") return element?.matches("button[aria-haspopup='menu']") === true;
						if (element?.closest("[data-composer-card] button[aria-haspopup='menu']")) return true;
						return [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element && (node.matches("[data-composer-card], button[aria-haspopup='menu']") || node.querySelector("[data-composer-card], button[aria-haspopup='menu']")));
					})) scheduleModelSync();
				});
				observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["aria-label", "title"],
					childList: true,
					subtree: true
				});
				synchronizeModel();
			};
			const stopModelObserver = () => {
				observer?.disconnect();
				observer = void 0;
				if (frame !== void 0) cancelAnimationFrame(frame);
				frame = void 0;
				projector.release(ATTR_MODEL);
			};
			const synchronizeModelMode = () => {
				if (activeState === null) return;
				const modelExit = mobile ? activeState.values.mobileModelExit !== false : activeState.values.modelExit === true;
				projector.set(ATTR_MODEL_EXIT, modelExit ? "enabled" : "disabled");
				if (modelExit) startModelObserver();
				else stopModelObserver();
			};
			const onResize = () => {
				const nextMobile = window.innerWidth <= 700;
				if (mobile === nextMobile) return;
				mobile = nextMobile;
				synchronizeModelMode();
			};
			const apply = (state) => {
				if (state === null) {
					window.removeEventListener("resize", onResize);
					activeState = null;
					stopModelObserver();
					projector.release();
					return;
				}
				if (activeState === null) window.addEventListener("resize", onResize);
				activeState = state;
				mobile = window.innerWidth <= 700;
				const artwork = state.values.artwork === true;
				const scheduleVisible = state.visibility.sfwMode !== false;
				projector.set(ATTR_ART, artwork && scheduleVisible ? "visible" : "hidden");
				projector.set(ATTR_FONT, state.values.font === "serif" ? "serif" : "system");
				projector.set(ATTR_FLASH_GLASSES, state.values.flashGlasses === true ? "on" : "off");
				synchronizeModelMode();
				projector.set(ATTR_COMPOSER_MODE, typeof state.values.composerMode === "string" ? state.values.composerMode : "persistent");
				const navMode = state.values.mobileNav;
				projector.set(ATTR_NAV_MODE, typeof navMode === "string" && NAV_MODES.has(navMode) ? navMode : "corner");
			};
			return exposeSkinCustomization({
				protocol: 2,
				skinId: "maid-atelier",
				title: "深海女仆工坊",
				titleEn: "Abyssal Maid Atelier",
				settings: [
					{
						key: "artwork",
						type: "boolean",
						label: "显示双女仆立绘",
						labelEn: "Show the twin maid artwork",
						defaultValue: true
					},
					{
						key: "sfwMode",
						type: "visibility-schedule",
						label: "不那么二次元模式",
						labelEn: "Not-so-anime mode",
						description: "按本机时间控制大幅立绘；可设置工作时段隐藏、其他时间显示，也可反向设置。",
						descriptionEn: "Control the large artwork by local time; hide it during work hours and show it otherwise, or the reverse.",
						defaultValue: {
							enabled: false,
							outside: "visible",
							ranges: []
						}
					},
					{
						key: "font",
						type: "select",
						label: "对话区字体",
						labelEn: "Conversation font",
						defaultValue: "system",
						options: [{
							value: "system",
							label: "系统默认无衬线",
							labelEn: "System default sans"
						}, {
							value: "serif",
							label: "Georgia 衬线（#22）",
							labelEn: "Georgia serif (#22)"
						}]
					},
					{
						key: "modelExit",
						type: "boolean",
						label: "桌面端根据所选模型显示立绘",
						labelEn: "Show artwork based on the selected model on desktop",
						defaultValue: false
					},
					{
						key: "mobileModelExit",
						type: "boolean",
						label: "移动端根据所选模型显示立绘",
						labelEn: "Show artwork based on the selected model on mobile",
						defaultValue: true
					},
					{
						key: "flashGlasses",
						type: "boolean",
						label: "flash🧐 带眼镜立绘",
						labelEn: "flash 🧐 glasses artwork",
						description: "flash 模型改用带眼镜的立绘。",
						descriptionEn: "Use the glasses artwork for the flash model.",
						defaultValue: false,
						visibleWhen: {
							key: "mobileModelExit",
							values: [true],
							anyOf: [{
								key: "modelExit",
								values: [true]
							}, {
								key: "mobileModelExit",
								values: [true]
							}]
						}
					},
					{
						key: "mobileNav",
						type: "select",
						label: "移动端导航方式",
						labelEn: "Phone navigation layout",
						description: "仅影响竖屏手机（宽度 ≤700px）：左上角品牌图标（默认）、横向顶栏，或宿主原本的纵向侧栏。桌面与横屏不受影响。",
						descriptionEn: "Portrait phones only (≤700px wide): a brand mark in the top-left corner (default), a horizontal top bar, or the host’s own vertical column. Desktop and landscape are untouched.",
						defaultValue: "corner",
						options: [
							{
								value: "corner",
								label: "左上角品牌图标",
								labelEn: "Brand mark · top-left corner"
							},
							{
								value: "topbar",
								label: "横向顶栏",
								labelEn: "Horizontal top bar"
							},
							{
								value: "rail",
								label: "纵向侧栏（宿主默认）",
								labelEn: "Vertical column (host default)"
							}
						]
					},
					{
						key: "composerMode",
						type: "select",
						label: "输入框显示方式",
						labelEn: "Composer visibility mode",
						description: "始终显示；空态胶囊在输入框为空且未聚焦时收起为简约胶囊；滚动显隐在上滚回顾时隐去、下滚渐现。",
						descriptionEn: "Always visible; the idle capsule collapses to a slim capsule while the composer is empty and unfocused; scroll mode hides it when scrolling up to review and reveals it when scrolling down.",
						defaultValue: "persistent",
						options: [
							{
								value: "persistent",
								label: "始终显示",
								labelEn: "Always visible"
							},
							{
								value: "capsule",
								label: "空态胶囊（点击展开）",
								labelEn: "Idle capsule (click to expand)"
							},
							{
								value: "scroll",
								label: "上滚隐去 · 下滚渐现",
								labelEn: "Hide on scroll up · show on scroll down"
							}
						]
					}
				],
				apply
			});
		}
		//#endregion
		//#region src/client/boot-error.ts
		const BOOT_SELECTOR = "[data-dsh-boot]";
		const ERROR_ATTRIBUTE = "data-maid-boot-error";
		const leases = /* @__PURE__ */ new WeakMap();
		/** Decorate the kernel-owned failure page without replacing its diagnostics. */
		function installMaidBootError() {
			const owner = Symbol("maid-boot-error");
			const owned = /* @__PURE__ */ new Set();
			let observer;
			const release = (element) => {
				owned.delete(element);
				const lease = leases.get(element);
				if (!lease || !lease.owners.delete(owner) || lease.owners.size > 0) return;
				leases.delete(element);
				if (element.getAttribute(ERROR_ATTRIBUTE) !== "") return;
				if (lease.original === null) element.removeAttribute(ERROR_ATTRIBUTE);
				else element.setAttribute(ERROR_ATTRIBUTE, lease.original);
			};
			const synchronize = () => {
				const failed = /* @__PURE__ */ new Set();
				for (const boot of document.querySelectorAll(BOOT_SELECTOR)) {
					if (![...boot.querySelectorAll("div")].some((element) => element.childElementCount === 0 && element.textContent === "Failed to load plugins")) continue;
					failed.add(boot);
					if (owned.has(boot)) continue;
					let lease = leases.get(boot);
					if (!lease) {
						lease = {
							original: boot.getAttribute(ERROR_ATTRIBUTE),
							owners: /* @__PURE__ */ new Set()
						};
						leases.set(boot, lease);
					}
					lease.owners.add(owner);
					owned.add(boot);
					boot.setAttribute(ERROR_ATTRIBUTE, "");
				}
				for (const element of owned) if (!failed.has(element)) release(element);
			};
			const dispose = () => {
				observer?.disconnect();
				for (const element of owned) release(element);
			};
			try {
				observer = new MutationObserver((records) => {
					if (records.some((record) => {
						if ((record.target instanceof Element ? record.target : record.target.parentElement)?.closest(BOOT_SELECTOR)) return true;
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
		//#region src/client/boot-error-art.generated.ts
		const MAID_BOOT_ERROR_LEFT = skinAssetUrl("4386aee80ebaa41f926096ae9e0378b08dbd3eaaa2ad6646ff8f50a3f480a7a9.webp");
		const MAID_BOOT_ERROR_RIGHT = skinAssetUrl("1183d4d3a2b122078d09b1d9c97e085696ae214694399f14ce407fc21d8f1ec1.webp");
		//#endregion
		//#region src/client/table-card.ts
		const MAID_TABLE_SELECTOR = ".md-table-wide";
		const SKIN_OWNER$1 = "maid-atelier";
		const EXPANDABLE_ATTRIBUTE = "data-maid-table-expandable";
		const OPEN_ATTRIBUTE = "data-maid-table-open";
		const CONTROL_ATTRIBUTE = "data-maid-table-expand";
		const FRAME_ATTRIBUTE = "data-maid-table-frame";
		const SCROLL_SUPPRESSED_ATTRIBUTE = "data-maid-table-scroll-suppressed";
		const OVERLAY_ATTRIBUTE = "data-maid-table-lightbox";
		const MODAL_DIALOG_SELECTOR = "[role='dialog'][aria-modal='true']";
		const ASSISTANT_STEP_SELECTOR = "[data-chat-flow-kind='assistant-step']";
		const MARKDOWN_CONTAINER_SELECTOR = "div[class*='markdown']";
		const EXPANDED_HORIZONTAL_CHROME = 96;
		const EXPANDED_MIN_WIDTH = 560;
		const LIGHTBOX_EDGE_GAP = 56;
		const attributeLeases = /* @__PURE__ */ new WeakMap();
		const controlLeases = /* @__PURE__ */ new WeakMap();
		function setLeasedAttribute(element, attribute, owner, active) {
			let attributes = attributeLeases.get(element);
			let lease = attributes?.get(attribute);
			if (active) {
				if (attributes === void 0) {
					attributes = /* @__PURE__ */ new Map();
					attributeLeases.set(element, attributes);
				}
				if (lease === void 0) {
					lease = {
						originalValue: element.getAttribute(attribute),
						owners: /* @__PURE__ */ new Set()
					};
					attributes.set(attribute, lease);
				}
				lease.owners.add(owner);
				element.setAttribute(attribute, "");
				return;
			}
			if (lease === void 0 || attributes === void 0) return;
			lease.owners.delete(owner);
			if (lease.owners.size > 0) {
				element.setAttribute(attribute, "");
				return;
			}
			if (element.getAttribute(attribute) === "") {
				if (lease.originalValue === null) element.removeAttribute(attribute);
				else element.setAttribute(attribute, lease.originalValue);
			}
			attributes.delete(attribute);
			if (attributes.size === 0) attributeLeases.delete(element);
		}
		/** Labels follow the host language at the moment each control is created. */
		function tableLabel(zh, en) {
			return (document.documentElement.lang || navigator.language || "en").toLowerCase().startsWith("zh") ? zh : en;
		}
		function acquireControl(wrapper, owner, activate) {
			let lease = controlLeases.get(wrapper);
			if (lease === void 0) {
				const button = document.createElement("button");
				button.type = "button";
				button.setAttribute(CONTROL_ATTRIBUTE, "");
				button.dataset.skinOwner = SKIN_OWNER$1;
				button.setAttribute("aria-label", tableLabel("展开表格预览", "Expand table preview"));
				button.title = button.getAttribute("aria-label");
				const owners = /* @__PURE__ */ new Map();
				const onClick = (event) => {
					if (!wrapper.hasAttribute(EXPANDABLE_ATTRIBUTE)) return;
					const current = Array.from(owners.values()).at(-1);
					if (current === void 0) return;
					event.stopPropagation();
					current();
				};
				button.addEventListener("click", onClick);
				lease = {
					button,
					owners,
					onClick
				};
				controlLeases.set(wrapper, lease);
			}
			lease.owners.set(owner, activate);
			try {
				if (lease.button.parentElement !== wrapper) wrapper.append(lease.button);
			} catch (error) {
				releaseControl(wrapper, owner);
				throw error;
			}
			return lease.button;
		}
		function releaseControl(wrapper, owner) {
			const lease = controlLeases.get(wrapper);
			if (lease === void 0) return;
			lease.owners.delete(owner);
			if (lease.owners.size > 0) return;
			lease.button.removeEventListener("click", lease.onClick);
			lease.button.remove();
			controlLeases.delete(wrapper);
		}
		function isForeignModalDialog(element) {
			return element.matches(MODAL_DIALOG_SELECTOR) && !element.hasAttribute(OVERLAY_ATTRIBUTE) && element.closest(`[${OVERLAY_ATTRIBUTE}]`) === null;
		}
		function findBubble(wrapper) {
			const assistantStep = wrapper.closest(ASSISTANT_STEP_SELECTOR);
			const markdown = wrapper.closest(MARKDOWN_CONTAINER_SELECTOR);
			if (assistantStep !== null && markdown !== null && assistantStep.contains(markdown)) return markdown;
			return wrapper.parentElement;
		}
		function contentWidth(element) {
			if (element === null || element.clientWidth <= 0) return 0;
			const style = getComputedStyle(element);
			const start = Number.parseFloat(style.paddingLeft) || 0;
			const end = Number.parseFloat(style.paddingRight) || 0;
			return Math.max(0, element.clientWidth - start - end);
		}
		function contentInlineSize(entry) {
			return entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
		}
		function borderInlineSize(entry) {
			return entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
		}
		/**
		* Install the wide-table geometry pass on the current body. Idempotent per
		* call; every observer and mutation is torn down by the returned disposer.
		*/
		function installMaidTableCards(_ctx) {
			const owner = Symbol("maid-table-card-activation");
			const bindings = /* @__PURE__ */ new Map();
			const candidates = /* @__PURE__ */ new Map();
			const resizeTargets = /* @__PURE__ */ new Map();
			let observer;
			let resizeObserver;
			let overlay;
			const closingOverlays = /* @__PURE__ */ new Map();
			const closeOverlay = (immediate = false) => {
				if (overlay === void 0) return;
				const { root, source, onClick, onKeyDown } = overlay;
				overlay = void 0;
				setLeasedAttribute(source, OPEN_ATTRIBUTE, owner, false);
				root.removeEventListener("click", onClick);
				document.removeEventListener("keydown", onKeyDown);
				if (immediate) {
					root.remove();
					return;
				}
				root.dataset.maidTableClosing = "";
				const timer = window.setTimeout(() => {
					closingOverlays.delete(root);
					root.remove();
				}, 180);
				closingOverlays.set(root, timer);
			};
			const deactivate = (wrapper) => {
				if (overlay?.source === wrapper) closeOverlay(true);
				const binding = bindings.get(wrapper);
				if (binding !== void 0) {
					wrapper.removeEventListener("pointerleave", binding.onPointerLeave);
					wrapper.removeEventListener("scroll", binding.onScroll);
					releaseControl(wrapper, owner);
					bindings.delete(wrapper);
				}
				setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, false);
				setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, false);
				setLeasedAttribute(wrapper, OPEN_ATTRIBUTE, owner, false);
				setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, false);
			};
			const watch = (wrapper, target) => {
				if (resizeObserver === void 0 || target === null) return;
				let wrappers = resizeTargets.get(target);
				if (wrappers === void 0) {
					wrappers = /* @__PURE__ */ new Set();
					resizeTargets.set(target, wrappers);
					resizeObserver.observe(target);
				}
				wrappers.add(wrapper);
			};
			const unwatch = (wrapper, target) => {
				if (target === null) return;
				const wrappers = resizeTargets.get(target);
				if (wrappers === void 0) return;
				wrappers.delete(wrapper);
				if (wrappers.size > 0) return;
				resizeTargets.delete(target);
				resizeObserver?.unobserve(target);
			};
			const removeClosingOverlays = () => {
				for (const [root, timer] of closingOverlays) {
					clearTimeout(timer);
					root.remove();
				}
				closingOverlays.clear();
			};
			const hasForeignModalDialog = () => {
				return Array.from(document.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog);
			};
			const openOverlay = (wrapper) => {
				closeOverlay(true);
				removeClosingOverlays();
				if (hasForeignModalDialog()) return;
				const root = document.createElement("div");
				root.setAttribute(OVERLAY_ATTRIBUTE, "");
				root.dataset.skinOwner = SKIN_OWNER$1;
				root.setAttribute("role", "dialog");
				root.setAttribute("aria-modal", "true");
				const backdrop = document.createElement("div");
				backdrop.dataset.maidTableBackdrop = "";
				const panel = document.createElement("div");
				panel.dataset.maidTablePanel = "";
				const naturalWidth = wrapper.querySelector("table")?.scrollWidth ?? wrapper.scrollWidth;
				const availableWidth = Math.max(EXPANDED_MIN_WIDTH, window.innerWidth - LIGHTBOX_EDGE_GAP);
				const targetWidth = Math.min(availableWidth, Math.max(EXPANDED_MIN_WIDTH, Math.ceil(naturalWidth + EXPANDED_HORIZONTAL_CHROME)));
				panel.style.setProperty("--maid-table-expanded-width", `${targetWidth}px`);
				const close = document.createElement("button");
				close.type = "button";
				close.dataset.maidTableClose = "";
				close.setAttribute("aria-label", tableLabel("关闭展开表格", "Close expanded table"));
				const scroller = document.createElement("div");
				scroller.dataset.maidTableExpandedScroller = "";
				const clone = wrapper.cloneNode(true);
				clone.removeAttribute(FRAME_ATTRIBUTE);
				clone.removeAttribute(EXPANDABLE_ATTRIBUTE);
				clone.removeAttribute(OPEN_ATTRIBUTE);
				clone.removeAttribute(SCROLL_SUPPRESSED_ATTRIBUTE);
				clone.removeAttribute("tabindex");
				clone.removeAttribute("aria-label");
				clone.querySelector(`[${CONTROL_ATTRIBUTE}]`)?.remove();
				clone.dataset.maidTableExpanded = "";
				scroller.append(clone);
				panel.append(close, scroller);
				root.append(backdrop, panel);
				const onClick = (event) => {
					const target = event.target;
					if (target instanceof Element && (target.closest("[data-maid-table-close]") !== null || target.hasAttribute("data-maid-table-backdrop"))) closeOverlay();
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") closeOverlay();
				};
				root.addEventListener("click", onClick);
				document.addEventListener("keydown", onKeyDown);
				document.body.append(root);
				setLeasedAttribute(wrapper, OPEN_ATTRIBUTE, owner, true);
				overlay = {
					root,
					source: wrapper,
					onClick,
					onKeyDown
				};
				close.focus({ preventScroll: true });
			};
			const activate = (wrapper) => {
				if (bindings.has(wrapper)) {
					setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, true);
					setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, true);
					return;
				}
				const button = acquireControl(wrapper, owner, () => openOverlay(wrapper));
				const onScroll = () => {
					setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, true);
				};
				const onPointerLeave = () => {
					setLeasedAttribute(wrapper, SCROLL_SUPPRESSED_ATTRIBUTE, owner, false);
				};
				bindings.set(wrapper, {
					button,
					onPointerLeave,
					onScroll
				});
				try {
					setLeasedAttribute(wrapper, FRAME_ATTRIBUTE, owner, true);
					setLeasedAttribute(wrapper, EXPANDABLE_ATTRIBUTE, owner, true);
					wrapper.addEventListener("pointerleave", onPointerLeave);
					wrapper.addEventListener("scroll", onScroll, { passive: true });
				} catch (error) {
					deactivate(wrapper);
					throw error;
				}
			};
			const refreshCandidate = (wrapper) => {
				const candidate = candidates.get(wrapper);
				if (candidate === void 0) return void 0;
				const bubble = findBubble(wrapper);
				if (bubble !== candidate.bubble) {
					unwatch(wrapper, candidate.bubble);
					candidate.bubble = bubble;
					candidate.availableWidth = contentWidth(bubble);
					watch(wrapper, bubble);
				}
				const table = wrapper.querySelector("table");
				if (table !== candidate.table) {
					unwatch(wrapper, candidate.table ?? null);
					candidate.table = table;
					candidate.naturalWidth = table?.scrollWidth ?? wrapper.scrollWidth;
					watch(wrapper, table);
				}
				return candidate;
			};
			const untrack = (wrapper) => {
				const candidate = candidates.get(wrapper);
				if (candidate === void 0) return;
				deactivate(wrapper);
				unwatch(wrapper, candidate.bubble);
				unwatch(wrapper, candidate.table ?? null);
				candidates.delete(wrapper);
			};
			const reconcile = (wrapper) => {
				if (!wrapper.isConnected) {
					untrack(wrapper);
					return;
				}
				const candidate = candidates.get(wrapper);
				if (candidate === void 0) return;
				if (candidate.availableWidth > 0 && candidate.naturalWidth > candidate.availableWidth + 1) activate(wrapper);
				else deactivate(wrapper);
			};
			const track = (wrapper) => {
				if (wrapper.closest(`[${OVERLAY_ATTRIBUTE}]`) !== null) return;
				if (candidates.has(wrapper)) {
					refreshCandidate(wrapper);
					reconcile(wrapper);
					return;
				}
				candidates.set(wrapper, {
					bubble: null,
					table: void 0,
					availableWidth: 0,
					naturalWidth: 0
				});
				try {
					refreshCandidate(wrapper);
					reconcile(wrapper);
				} catch (error) {
					untrack(wrapper);
					throw error;
				}
			};
			const runtime = { dispose() {
				closeOverlay(true);
				removeClosingOverlays();
				observer?.disconnect();
				resizeObserver?.disconnect();
				for (const wrapper of [...candidates.keys()]) untrack(wrapper);
				resizeTargets.clear();
				resizeObserver = void 0;
				bindings.clear();
				candidates.clear();
			} };
			try {
				if (typeof ResizeObserver !== "undefined") resizeObserver = new ResizeObserver((entries) => {
					const affected = /* @__PURE__ */ new Set();
					for (const entry of entries) {
						const wrappers = resizeTargets.get(entry.target);
						if (wrappers === void 0) continue;
						for (const wrapper of wrappers) {
							const candidate = candidates.get(wrapper);
							if (candidate === void 0) continue;
							if (entry.target === candidate.bubble) candidate.availableWidth = contentInlineSize(entry);
							if (entry.target === candidate.table) candidate.naturalWidth = borderInlineSize(entry);
							affected.add(wrapper);
						}
					}
					affected.forEach(reconcile);
				});
				observer = new MutationObserver((records) => {
					let sawForeignModal = false;
					const refresh = /* @__PURE__ */ new Set();
					const removed = /* @__PURE__ */ new Set();
					for (const record of records) {
						if (record.target instanceof HTMLElement) {
							const wrapper = record.target.matches(".md-table-wide") ? record.target : record.target.closest(MAID_TABLE_SELECTOR);
							if (wrapper !== null && candidates.has(wrapper)) {
								const binding = bindings.get(wrapper);
								if (binding !== void 0 && binding.button.parentElement !== wrapper) wrapper.append(binding.button);
								refresh.add(wrapper);
							}
						}
						for (const node of record.addedNodes) {
							if (!(node instanceof Element)) continue;
							if (isForeignModalDialog(node) || Array.from(node.querySelectorAll(MODAL_DIALOG_SELECTOR)).some(isForeignModalDialog)) sawForeignModal = true;
							if (node.matches(".md-table-wide")) track(node);
							else if (node.querySelectorAll(".md-table-wide").length > 0) node.querySelectorAll(MAID_TABLE_SELECTOR).forEach(track);
						}
						for (const node of record.removedNodes) {
							if (!(node instanceof Element)) continue;
							if (node.matches(".md-table-wide")) removed.add(node);
							node.querySelectorAll(MAID_TABLE_SELECTOR).forEach((wrapper) => removed.add(wrapper));
						}
					}
					for (const wrapper of removed) if (!wrapper.isConnected) untrack(wrapper);
					for (const wrapper of refresh) if (wrapper.isConnected) {
						const candidate = candidates.get(wrapper);
						const table = wrapper.querySelector("table");
						if (candidate !== void 0 && table !== candidate.table) {
							refreshCandidate(wrapper);
							reconcile(wrapper);
						}
					}
					if (sawForeignModal && overlay !== void 0) closeOverlay(true);
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				document.querySelectorAll(MAID_TABLE_SELECTOR).forEach(track);
				return runtime;
			} catch (error) {
				runtime.dispose();
				throw error;
			}
		}
		//#endregion
		//#region src/client/icon-art.generated.ts
		const SLEEPY_32 = skinAssetUrl("c033e0ef8cca6b516489f4e2aab05dac758c54ea3cf20f246412f08735c2d7fc.png");
		const DELIGHTED_32 = skinAssetUrl("98f0e13da2ecb0913739d6fbe83026b66746263a9c1dab006ef1b73279b7d8de.png");
		const DELIGHTED_192 = skinAssetUrl("c433e0bc2e5a36cc0022eb05150691986b5086b749ceacc556ab71359438d5c4.png");
		const DELIGHTED_512 = skinAssetUrl("06eaf23edd8d5efcf8dfd2ff573307d92ad4422f4a5c022064e9659d34258b8d.png");
		//#endregion
		//#region src/client/page-icons.ts
		const PAGE_ICON = [
			SLEEPY_32,
			DELIGHTED_32,
			skinAssetUrl("fe8e1db21924622a0a3a38bd8fde3197d0f0ef2ba2b48c4665f5569013cd4f1d.png")
		][Math.floor(Math.random() * 3)];
		const installations = /* @__PURE__ */ new WeakMap();
		function installMaidPageIcons(ctx) {
			ctx.effect(() => {
				const doc = document;
				let installation = installations.get(doc);
				if (installation === void 0) {
					installation = {
						users: 0,
						restore: mountPageIcons(doc)
					};
					installations.set(doc, installation);
				}
				const current = installation;
				current.users += 1;
				let active = true;
				return () => {
					if (!active) return;
					active = false;
					if (--current.users > 0) return;
					current.restore();
					installations.delete(doc);
				};
			}, "ui-skin-maid-atelier: page icons");
		}
		function mountPageIcons(doc) {
			const replaced = [];
			const owned = [];
			const restore = () => {
				for (const node of owned) node.remove();
				for (const { node, anchor } of replaced) if (anchor.parentNode !== null && !node.isConnected) anchor.replaceWith(node);
				else anchor.remove();
			};
			try {
				for (const node of doc.head.querySelectorAll("link[rel~=\"icon\"], link[rel=\"manifest\"]")) {
					const anchor = doc.createComment("maid-atelier: host icon");
					replaced.push({
						node,
						anchor
					});
					node.before(anchor);
					node.remove();
				}
				const append = (rel, href, type) => {
					const node = doc.createElement("link");
					owned.push(node);
					node.rel = rel;
					node.href = href;
					node.type = type;
					node.dataset.skinChrome = rel === "icon" ? "favicon" : "manifest";
					node.dataset.skinOwner = "maid-atelier";
					doc.head.append(node);
					return node;
				};
				append("icon", PAGE_ICON, "image/png").setAttribute("sizes", "32x32");
				const root = new URL("/", doc.location.href).href;
				append("manifest", `data:application/manifest+json,${encodeURIComponent(JSON.stringify({
					id: root,
					name: "DeepSeek Harness",
					short_name: "DSH",
					start_url: root,
					scope: root,
					display: "fullscreen",
					icons: [{
						src: DELIGHTED_192,
						sizes: "192x192",
						type: "image/png",
						purpose: "any"
					}, {
						src: DELIGHTED_512,
						sizes: "512x512",
						type: "image/png",
						purpose: "any"
					}]
				}))}`, "application/manifest+json");
			} catch (error) {
				restore();
				throw error;
			}
			return restore;
		}
		//#endregion
		//#region src/client/index.ts
		const SKIN_TITLE = "深海女仆工坊 · DeepSeek Harness";
		const SKIN_OWNER = "maid-atelier";
		const SKIN_SYSTEM_CHROME_COLOR = "#0b193f";
		const VIEWPORT_RESIZE_SETTLE_MS = 120;
		const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])";
		const CONVERSATION_COLUMN_SELECTOR = ":is([data-pane='conversation'], [class*='centerCol'])";
		const SETTINGS_MASK_SELECTOR = "[role='presentation'] > [class*='mask']";
		const SETTINGS_DIALOG_SELECTOR = "[data-slot='sidebar.settings'] [role='dialog'][aria-modal='true']";
		const ACTIVE_CONVERSATION_SELECTOR = "[data-phase='active']";
		const ACTIVE_CHAT_SELECTOR = `${ACTIVE_CONVERSATION_SELECTOR} [data-chat-flow]`;
		const WORKSPACE_SELECTOR = "header [role='tablist']";
		const CORDIS_PANEL_SELECTOR = "[data-cordis-panel]";
		const TERMINAL_SELECTOR = ".xterm";
		const bodyAttributeLeases = /* @__PURE__ */ new WeakMap();
		function createBodyAttributeLease(body, attribute, value = "") {
			const owner = Symbol(attribute);
			let active = false;
			return {
				acquire() {
					if (active) return;
					let attributes = bodyAttributeLeases.get(body);
					if (attributes === void 0) {
						attributes = /* @__PURE__ */ new Map();
						bodyAttributeLeases.set(body, attributes);
					}
					let state = attributes.get(attribute);
					if (state === void 0) {
						state = {
							originalValue: body.getAttribute(attribute),
							owners: /* @__PURE__ */ new Set(),
							value
						};
						attributes.set(attribute, state);
					}
					state.owners.add(owner);
					active = true;
					body.setAttribute(attribute, state.value);
				},
				release() {
					if (!active) return;
					active = false;
					const attributes = bodyAttributeLeases.get(body);
					const state = attributes?.get(attribute);
					if (state === void 0 || !state.owners.delete(owner)) return;
					if (state.owners.size > 0) {
						body.setAttribute(attribute, state.value);
						return;
					}
					attributes?.delete(attribute);
					if (attributes?.size === 0) bodyAttributeLeases.delete(body);
					if (body.getAttribute(attribute) !== state.value) return;
					if (state.originalValue === null) body.removeAttribute(attribute);
					else body.setAttribute(attribute, state.originalValue);
				}
			};
		}
		const PROJECTED_STATE_ATTRIBUTES = {
			activeChat: "data-maid-chat-active",
			activeConversation: "data-maid-conversation-active",
			cordisPanelOpen: "data-maid-cordis-panel-open",
			settingsOpen: "data-maid-settings-open",
			workspace: "data-maid-workspace"
		};
		const PROJECTED_STATE_SELECTOR = [
			ACTIVE_CONVERSATION_SELECTOR,
			"[data-chat-flow]",
			WORKSPACE_SELECTOR,
			CORDIS_PANEL_SELECTOR,
			"[data-slot='sidebar.settings']"
		].join(", ");
		/** Workspace decoration flags, listed so diff application iterates a fixed order. */
		const WORKSPACE_FLAGS = [
			"data-maid-workspace-group",
			"data-maid-workspace-row",
			"data-maid-workspace-active",
			"data-maid-session-row",
			"data-maid-session-flat",
			"data-maid-session-first",
			"data-maid-session-last"
		];
		const WORKSPACE_FLAG_SELECTOR = WORKSPACE_FLAGS.map((flag) => `[${flag}]`).join(", ");
		const SIDEBAR_FOOTER_FLAG = "data-maid-sidebar-footer";
		const BACKDROP_PROPERTIES = [
			"--maid-boot-error-left-art",
			"--maid-boot-error-right-art",
			"--maid-palace-art",
			"--maid-sidebar-width",
			"--maid-top-trim-art",
			"--maid-bottom-trim-art",
			"--maid-bottom-crest-art",
			"--maid-bow-art",
			"--maid-new-session-art",
			"--maid-sidebar-swag-art",
			"--maid-sidebar-corner-art",
			"--maid-composer-frame-art",
			"--maid-composer-ribbon-left-cap-art",
			"--maid-composer-ribbon-left-fill-art",
			"--maid-composer-ribbon-right-fill-art",
			"--maid-composer-ribbon-right-cap-art",
			"--maid-composer-lace-art",
			"--maid-settings-frame-art",
			"--maid-workspace-crest-art",
			"--maid-workspace-ribbon-art"
		];
		function createCharacterStage() {
			const stage = document.createElement("div");
			stage.dataset.skinChrome = "character-stage";
			stage.dataset.skinOwner = SKIN_OWNER;
			stage.setAttribute("aria-hidden", "true");
			const left = document.createElement("img");
			left.dataset.maidCharacter = "left";
			left.alt = "";
			left.src = MAID_ATELIER_MAID_LEFT;
			const right = document.createElement("img");
			right.dataset.maidCharacter = "right";
			right.alt = "";
			right.src = MAID_ATELIER_MAID_RIGHT;
			const vision = document.createElement("img");
			vision.dataset.maidCharacter = "vision";
			vision.alt = "";
			vision.src = MAID_ATELIER_MAID_RIGHT_VISION;
			stage.append(left, right, vision);
			return stage;
		}
		/**
		* Seat the character stage (palace + both maids) inside the conversation
		* column. The stage is a first child at z-index 0; the ConversationRoot
		* paints above it by DOM order once the skin gives it `position: relative`
		* without a z-index (no new stacking context, so fixed popups keep their
		* page-level tier). The column is the chat-owning box, so any layout push
		* (right/bottom workbenches) moves the artwork with the chat instead of
		* leaving it fixed to the viewport. When the column has not mounted yet the
		* stage waiter returns false; the conversation-column mutation path retries
		* once the chat area appears or is replaced.
		*/
		function ensureChatAreaStage(stage) {
			const chat = document.querySelector(CONVERSATION_COLUMN_SELECTOR);
			if (!chat) return false;
			if (stage.parentElement !== chat) chat.prepend(stage);
			return true;
		}
		function ensureChatAreaChrome(...chrome) {
			const chat = document.querySelector(CONVERSATION_COLUMN_SELECTOR);
			if (!chat) return false;
			for (const element of chrome) if (element.parentElement !== chat) chat.append(element);
			return true;
		}
		function createComposerLaceRail() {
			const rail = document.createElement("div");
			const center = document.createElement("span");
			rail.dataset.skinChrome = "composer-lace";
			rail.dataset.skinOwner = SKIN_OWNER;
			rail.setAttribute("aria-hidden", "true");
			center.dataset.maidComposerLaceCenter = "";
			rail.append(center);
			return rail;
		}
		function ensureComposerLaceRail(rail) {
			const card = document.querySelector("[data-composer-card]");
			if (!card) {
				rail.remove();
				return false;
			}
			if (rail.parentElement !== card) card.prepend(rail);
			return true;
		}
		function hasAcceleratedWebGL() {
			if (typeof WebGLRenderingContext === "undefined") return false;
			const canvas = document.createElement("canvas");
			const options = { failIfMajorPerformanceCaveat: true };
			for (const kind of ["webgl2", "webgl"]) try {
				const context = canvas.getContext(kind, options);
				if (context === null) continue;
				context.getExtension("WEBGL_lose_context")?.loseContext();
				return true;
			} catch {}
			return false;
		}
		function createSidebarCorners() {
			const corners = document.createElement("div");
			corners.dataset.skinChrome = "sidebar-corners";
			corners.dataset.skinOwner = SKIN_OWNER;
			corners.setAttribute("aria-hidden", "true");
			for (const position of [
				"top-left",
				"top-right",
				"bottom-right",
				"bottom-left"
			]) {
				const corner = document.createElement("span");
				corner.dataset.skinCorner = position;
				corners.append(corner);
			}
			return corners;
		}
		/**
		* Place the whale-free DeepSeek Harness wordmark at the left of the
		* frameless title bar (Web-app overlay / desktop shell), mirroring the
		* sidebar brand at a smaller scale.
		*/
		function decorateTitlebarBrand(ownedNodes) {
			const titlebar = document.querySelector("[class*='titlebar']");
			if (!titlebar) return;
			if (titlebar.querySelector("[data-skin-chrome='titlebar-brand']")) return;
			const brand = document.createElement("span");
			brand.dataset.skinChrome = "titlebar-brand";
			brand.dataset.skinOwner = SKIN_OWNER;
			brand.setAttribute("aria-hidden", "true");
			brand.innerHTML = MAID_ATELIER_TITLEBAR_BRAND;
			ownedNodes.add(brand);
			titlebar.prepend(brand);
		}
		function decorateSidebar(ownedNodes, decoratedElements) {
			const sidebar = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
			const sidebarRoot = sidebar?.querySelector(":scope > div");
			if (!sidebar || !sidebarRoot) return;
			const settingsSlot = sidebar.querySelector("[data-slot='sidebar.settings']");
			let footer;
			if (settingsSlot) {
				let candidate = settingsSlot.parentElement;
				while (candidate && candidate !== sidebar) {
					if (candidate.querySelector("[data-slot='sidebar.footer.action']")) {
						footer = candidate;
						break;
					}
					candidate = candidate.parentElement;
				}
			}
			sidebar.querySelectorAll(`[${SIDEBAR_FOOTER_FLAG}]`).forEach((element) => {
				if (element === footer) return;
				delete element.dataset.maidSidebarFooter;
				decoratedElements.delete(element);
			});
			if (footer && !footer.hasAttribute(SIDEBAR_FOOTER_FLAG)) {
				footer.dataset.maidSidebarFooter = "";
				decoratedElements.add(footer);
			}
			if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-corners']")) {
				const corners = createSidebarCorners();
				ownedNodes.add(corners);
				sidebarRoot.prepend(corners);
			}
			if (!sidebarRoot.querySelector("[data-skin-chrome='sidebar-mascot']")) {
				const mascot = document.createElement("img");
				mascot.dataset.skinChrome = "sidebar-mascot";
				mascot.dataset.skinOwner = SKIN_OWNER;
				mascot.setAttribute("aria-hidden", "true");
				mascot.alt = "";
				mascot.src = MAID_ATELIER_CHIBI;
				ownedNodes.add(mascot);
				sidebarRoot.prepend(mascot);
			}
		}
		function decorateWorkspaceTree(decoratedElements) {
			const sidebar = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
			if (!sidebar) return;
			const current = /* @__PURE__ */ new Map();
			sidebar.querySelectorAll(WORKSPACE_FLAG_SELECTOR).forEach((element) => {
				const flags = /* @__PURE__ */ new Set();
				for (const flag of WORKSPACE_FLAGS) if (element.hasAttribute(flag)) flags.add(flag);
				current.set(element, flags);
			});
			const desired = /* @__PURE__ */ new Map();
			const claim = (element, flag) => {
				let flags = desired.get(element);
				if (!flags) {
					flags = /* @__PURE__ */ new Set();
					desired.set(element, flags);
				}
				flags.add(flag);
			};
			sidebar.querySelectorAll("[role='tree']").forEach((tree) => {
				const rows = [...tree.querySelectorAll("[role='treeitem']")];
				if (tree.matches("[class*='flatList']") && !rows.some((row) => row.hasAttribute("aria-expanded"))) {
					rows.filter((row) => row.hasAttribute("aria-selected")).forEach((sessionRow) => {
						claim(sessionRow, "data-maid-session-row");
						claim(sessionRow, "data-maid-session-flat");
					});
					return;
				}
				let workspaceRow;
				let sessionRows = [];
				const decorateGroup = () => {
					if (!workspaceRow) return;
					claim(workspaceRow, "data-maid-workspace-row");
					if (workspaceRow.parentElement) claim(workspaceRow.parentElement, "data-maid-workspace-group");
					sessionRows.forEach((sessionRow) => {
						claim(sessionRow, "data-maid-session-row");
					});
					if (sessionRows[0]) claim(sessionRows[0], "data-maid-session-first");
					if (sessionRows.at(-1)) claim(sessionRows.at(-1), "data-maid-session-last");
					if (workspaceRow.getAttribute("aria-expanded") === "true" && sessionRows.some((sessionRow) => sessionRow.getAttribute("aria-selected") === "true")) claim(workspaceRow, "data-maid-workspace-active");
				};
				rows.forEach((row) => {
					if (row.hasAttribute("aria-expanded")) {
						decorateGroup();
						workspaceRow = row;
						sessionRows = [];
					} else if (workspaceRow && row.hasAttribute("aria-selected")) sessionRows.push(row);
				});
				decorateGroup();
			});
			const touched = /* @__PURE__ */ new Set([...current.keys(), ...desired.keys()]);
			for (const element of touched) {
				const before = current.get(element);
				const after = desired.get(element);
				if (before !== void 0) {
					for (const flag of before) if (!after?.has(flag)) element.removeAttribute(flag);
				}
				if (after !== void 0) {
					for (const flag of after) if (!before?.has(flag)) element.setAttribute(flag, "");
					if (after.size > 0) decoratedElements.add(element);
				}
			}
		}
		/**
		* Apply the skin-owned background and independently retractable chrome.
		* @param ctx - owning context whose effect retracts every DOM and CSS write.
		*/
		function apply(ctx) {
			const body = document.body;
			ctx.effect(() => installMaidCustomization(), "ui-skin-maid-atelier: customization declaration");
			ctx.effect(() => installMaidBootError(), "ui-skin-maid-atelier: boot failure presentation");
			const originalTitle = document.title;
			const layoutResizeLease = createBodyAttributeLease(body, "data-maid-layout-resizing");
			const lowPowerLease = createBodyAttributeLease(body, "data-maid-low-power");
			const previous = /* @__PURE__ */ new Map();
			for (const property of BACKDROP_PROPERTIES) previous.set(property, body.style.getPropertyValue(property));
			const previousProjectedStates = /* @__PURE__ */ new Map();
			for (const attribute of Object.values(PROJECTED_STATE_ATTRIBUTES)) previousProjectedStates.set(attribute, body.getAttribute(attribute));
			const ownedNodes = /* @__PURE__ */ new Set();
			const decoratedElements = /* @__PURE__ */ new Set();
			const characterStage = createCharacterStage();
			ownedNodes.add(characterStage);
			const composerLaceRail = createComposerLaceRail();
			ownedNodes.add(composerLaceRail);
			let themeColorMeta = null;
			let previousThemeColor;
			let themeColorObserver;
			let observedSidebar;
			let resizeObserver;
			let composerPhase;
			let composerMotionTimer;
			let viewportResizeTimer;
			let handleViewportResize;
			let railSearchFocusFrame;
			let recoverRailSearchFocus;
			let settingsBackdropFrame;
			let observer;
			let titlebarOverlay;
			let syncTitlebarHeight;
			let titlebarSyncFrame;
			let disposeMaidTableCards = () => {};
			ctx.effect(() => () => {
				delete body.dataset.dshMaidAtelier;
				delete body.dataset.maidComposerMotion;
				delete body.dataset.maidSidebarCompact;
				delete body.dataset.maidSidebarSize;
				for (const [attribute, value] of previousProjectedStates) if (value === null) body.removeAttribute(attribute);
				else body.setAttribute(attribute, value);
				disposeMaidComposerCapsule();
				disposeMaidComposerScroll();
				disposeMaidTableCards();
				if (composerMotionTimer !== void 0) clearTimeout(composerMotionTimer);
				if (viewportResizeTimer !== void 0) clearTimeout(viewportResizeTimer);
				if (handleViewportResize !== void 0) window.removeEventListener("resize", handleViewportResize);
				layoutResizeLease.release();
				lowPowerLease.release();
				if (railSearchFocusFrame !== void 0) cancelAnimationFrame(railSearchFocusFrame);
				if (recoverRailSearchFocus !== void 0) document.removeEventListener("click", recoverRailSearchFocus);
				observer?.disconnect();
				themeColorObserver?.disconnect();
				if (titlebarOverlay !== void 0 && syncTitlebarHeight !== void 0) titlebarOverlay.removeEventListener("geometrychange", syncTitlebarHeight);
				if (titlebarSyncFrame !== void 0) cancelAnimationFrame(titlebarSyncFrame);
				titlebarSyncFrame = void 0;
				resizeObserver?.disconnect();
				for (const [property, value] of previous) body.style.setProperty(property, value);
				ownedNodes.forEach((element) => element.remove());
				decoratedElements.forEach((element) => {
					delete element.dataset.maidSidebarFooter;
					delete element.dataset.maidWorkspaceGroup;
					delete element.dataset.maidWorkspaceRow;
					delete element.dataset.maidWorkspaceActive;
					delete element.dataset.maidSessionRow;
					delete element.dataset.maidSessionFlat;
					delete element.dataset.maidSessionFirst;
					delete element.dataset.maidSessionLast;
				});
				if (themeColorMeta?.isConnected && themeColorMeta.content === SKIN_SYSTEM_CHROME_COLOR) themeColorMeta.content = previousThemeColor ?? "";
				if (document.title === SKIN_TITLE) document.title = originalTitle;
			}, "ui-skin-maid-atelier: layered background and ornament");
			handleViewportResize = () => {
				layoutResizeLease.acquire();
				if (viewportResizeTimer !== void 0) clearTimeout(viewportResizeTimer);
				viewportResizeTimer = setTimeout(() => {
					layoutResizeLease.release();
					viewportResizeTimer = void 0;
				}, VIEWPORT_RESIZE_SETTLE_MS);
			};
			window.addEventListener("resize", handleViewportResize);
			if (!hasAcceleratedWebGL()) lowPowerLease.acquire();
			const syncSystemChrome = () => {
				const meta = document.head.querySelector("meta[name=\"theme-color\"]");
				if (meta === null) return;
				if (meta !== themeColorMeta) {
					themeColorMeta = meta;
					previousThemeColor = meta.content;
				}
				if (meta.content !== SKIN_SYSTEM_CHROME_COLOR) meta.content = SKIN_SYSTEM_CHROME_COLOR;
			};
			themeColorObserver = new MutationObserver(syncSystemChrome);
			themeColorObserver.observe(document.head, {
				attributes: true,
				attributeFilter: ["content"],
				childList: true,
				subtree: true
			});
			syncSystemChrome();
			body.dataset.dshMaidAtelier = "";
			ctx.effect(() => installMaidComposerDismiss(body), "ui-skin-maid-atelier: composer stats dismissal");
			const disposeMaidComposerCapsule = installMaidComposerCapsule(body);
			const disposeMaidComposerScroll = installMaidComposerScroll(body);
			const settingsNavigation = createMaidSettingsNavigation(body);
			ctx.effect(() => settingsNavigation.dispose, "ui-skin-maid-atelier: settings navigation hint");
			ctx.effect(() => installMaidMobileDrawerAutoClose(body), "ui-skin-maid-atelier: mobile drawer auto-close");
			ctx.effect(() => installMaidMobileViewport(body), "ui-skin-maid-atelier: phone viewport");
			disposeMaidTableCards = installMaidTableCards(ctx).dispose;
			body.style.setProperty("--maid-top-trim-art", `url(${MAID_ATELIER_TOP_TRIM_TILE})`);
			body.style.setProperty("--maid-boot-error-left-art", `url(${MAID_BOOT_ERROR_LEFT})`);
			body.style.setProperty("--maid-boot-error-right-art", `url(${MAID_BOOT_ERROR_RIGHT})`);
			body.style.setProperty("--maid-bottom-trim-art", `url(${MAID_ATELIER_BOTTOM_TRIM_TILE})`);
			body.style.setProperty("--maid-bottom-crest-art", `url(${MAID_ATELIER_BOTTOM_CREST})`);
			body.style.setProperty("--maid-bow-art", `url(${MAID_ATELIER_BOW_CLEAN})`);
			body.style.setProperty("--maid-new-session-art", `url(${MAID_ATELIER_NEW_SESSION})`);
			body.style.setProperty("--maid-sidebar-swag-art", `url(${MAID_ATELIER_SIDEBAR_SWAG})`);
			body.style.setProperty("--maid-sidebar-corner-art", `url(${MAID_ATELIER_SIDEBAR_CORNER})`);
			body.style.setProperty("--maid-composer-frame-art", `url(${MAID_ATELIER_COMPOSER_FRAME_SHELL})`);
			body.style.setProperty("--maid-composer-ribbon-left-cap-art", `url(${MAID_ATELIER_COMPOSER_RIBBON_LEFT_CAP})`);
			body.style.setProperty("--maid-composer-ribbon-left-fill-art", `url(${MAID_ATELIER_COMPOSER_RIBBON_LEFT_FILL})`);
			body.style.setProperty("--maid-composer-ribbon-right-fill-art", `url(${MAID_ATELIER_COMPOSER_RIBBON_RIGHT_FILL})`);
			body.style.setProperty("--maid-composer-ribbon-right-cap-art", `url(${MAID_ATELIER_COMPOSER_RIBBON_RIGHT_CAP})`);
			body.style.setProperty("--maid-composer-lace-art", `url(${MAID_ATELIER_COMPOSER_LACE_TILE})`);
			body.style.setProperty("--maid-settings-frame-art", `url(${MAID_ATELIER_SETTINGS_FRAME})`);
			body.style.setProperty("--maid-workspace-crest-art", `url(${MAID_ATELIER_WORKSPACE_SHIELD})`);
			body.style.setProperty("--maid-workspace-ribbon-art", `url(${MAID_ATELIER_WORKSPACE_RIBBON})`);
			const syncBackdrop = () => {
				const next = `url(${body.hasAttribute("data-ds-dark-theme") ? MAID_ATELIER_PALACE_DARK : MAID_ATELIER_PALACE_LIGHT})`;
				if (body.style.getPropertyValue("--maid-palace-art") !== next) body.style.setProperty("--maid-palace-art", next);
			};
			syncBackdrop();
			const widthSheet = document.createElement("style");
			widthSheet.dataset.skinChrome = "sidebar-width-rule";
			widthSheet.dataset.skinOwner = SKIN_OWNER;
			ownedNodes.add(widthSheet);
			document.head.append(widthSheet);
			widthSheet.sheet.insertRule(`body[data-dsh-maid-atelier] :is(${SIDEBAR_COLUMN_SELECTOR}, [data-cordis-panel], [data-maid-settings-backdrop-frame], [data-maid-table-lightbox]) { --maid-sidebar-width: 280px; --maid-sidebar-swag-height: clamp(54px, calc(var(--maid-sidebar-width) * 0.2575), 94px); --maid-sidebar-mascot-width: min(320px, calc(var(--maid-sidebar-width) * 0.82)); }`);
			const appendRule = (rule) => {
				widthSheet.sheet.insertRule(rule, widthSheet.sheet.cssRules.length);
			};
			appendRule("body[data-dsh-maid-atelier] { --maid-titlebar-height: 0px; }");
			appendRule("body[data-dsh-maid-atelier] [class*=\"frame\"][data-wco] { grid-template-rows: env(titlebar-area-height, 40px) 1fr; }");
			appendRule("body[data-dsh-maid-atelier] [class*=\"frame\"][data-desktop] { grid-template-rows: 32px 1fr; }");
			appendRule("body[data-dsh-maid-atelier] [class*=\"frame\"] [class*=\"handle\"] { top: var(--maid-titlebar-height, 0px); }");
			const widthRule = widthSheet.sheet.cssRules[0];
			const titlebarRule = widthSheet.sheet.cssRules[1];
			const setRuleProperty = (rule, name, value) => {
				if (rule.style.getPropertyValue(name) !== value) rule.style.setProperty(name, value);
			};
			const measureTitlebarHeight = () => {
				const columns = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
				if (columns !== null) {
					const top = columns.getBoundingClientRect().top;
					if (top > 0) {
						setRuleProperty(titlebarRule, "--maid-titlebar-height", `${top}px`);
						return;
					}
				}
				if (document.querySelector("[class*='frame'][data-desktop]") !== null) {
					setRuleProperty(titlebarRule, "--maid-titlebar-height", "32px");
					return;
				}
				setRuleProperty(titlebarRule, "--maid-titlebar-height", "0px");
			};
			syncTitlebarHeight = () => {
				if (titlebarSyncFrame !== void 0) return;
				titlebarSyncFrame = requestAnimationFrame(() => {
					titlebarSyncFrame = void 0;
					measureTitlebarHeight();
				});
			};
			titlebarOverlay = navigator.windowControlsOverlay;
			titlebarOverlay?.addEventListener("geometrychange", syncTitlebarHeight);
			measureTitlebarHeight();
			const applySidebarWidth = (width) => {
				if (width <= 0) return;
				const roundPx = (value) => `${Math.round(value * 100) / 100}px`;
				const nextSize = width <= 120 ? "rail" : width <= 220 ? "narrow" : "wide";
				const compact = width <= 104;
				if (roundPx(width) === widthRule.style.getPropertyValue("--maid-sidebar-width") && body.dataset.maidSidebarSize === nextSize && body.hasAttribute("data-maid-sidebar-compact") === compact) return;
				setRuleProperty(widthRule, "--maid-sidebar-width", roundPx(width));
				if (body.dataset.maidSidebarSize !== nextSize) body.dataset.maidSidebarSize = nextSize;
				if (body.hasAttribute("data-maid-sidebar-compact") !== compact) body.toggleAttribute("data-maid-sidebar-compact", compact);
			};
			const clearSidebarWidth = () => {
				setRuleProperty(widthRule, "--maid-sidebar-width", "0px");
				if (body.dataset.maidSidebarSize !== "rail") body.dataset.maidSidebarSize = "rail";
				if (!body.hasAttribute("data-maid-sidebar-compact")) body.toggleAttribute("data-maid-sidebar-compact", true);
			};
			const syncProjectedState = () => {
				const set = (attribute, active) => {
					if (body.hasAttribute(attribute) !== active) body.toggleAttribute(attribute, active);
				};
				set(PROJECTED_STATE_ATTRIBUTES.activeChat, document.querySelector(ACTIVE_CHAT_SELECTOR) !== null);
				set(PROJECTED_STATE_ATTRIBUTES.activeConversation, document.querySelector(ACTIVE_CONVERSATION_SELECTOR) !== null);
				set(PROJECTED_STATE_ATTRIBUTES.workspace, document.querySelector(WORKSPACE_SELECTOR) !== null);
				set(PROJECTED_STATE_ATTRIBUTES.cordisPanelOpen, document.querySelector(CORDIS_PANEL_SELECTOR) !== null);
				set(PROJECTED_STATE_ATTRIBUTES.settingsOpen, document.querySelector(SETTINGS_DIALOG_SELECTOR) !== null);
			};
			let observedChatArea;
			const ensureResizeObserved = () => {
				if (!resizeObserver) return;
				const sidebar = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
				if (sidebar !== observedSidebar) {
					if (observedSidebar) resizeObserver.unobserve(observedSidebar);
					observedSidebar = sidebar ?? void 0;
					if (sidebar) resizeObserver.observe(sidebar);
				}
				const chat = document.querySelector(CONVERSATION_COLUMN_SELECTOR);
				if (chat !== observedChatArea) {
					if (observedChatArea) resizeObserver.unobserve(observedChatArea);
					observedChatArea = chat ?? void 0;
					if (chat) resizeObserver.observe(chat);
				}
			};
			recoverRailSearchFocus = (event) => {
				const target = event.target instanceof Element ? event.target.closest("button[class*='searchButton']") : null;
				const railSearch = target?.closest("[class*='search']");
				if (target === null || railSearch === null || railSearch.querySelector("input[class*='searchInput']") !== null) return;
				if (railSearchFocusFrame !== void 0) cancelAnimationFrame(railSearchFocusFrame);
				const startedAt = performance.now();
				const recover = () => {
					railSearchFocusFrame = void 0;
					const input = document.querySelector(`${SIDEBAR_COLUMN_SELECTOR} input[class*='searchInput']`);
					const searchRoot = input?.closest("[class*='search']");
					if (input !== null && input !== void 0 && searchRoot !== null && searchRoot !== void 0) {
						searchRoot.click();
						input.focus({ preventScroll: true });
						return;
					}
					if (performance.now() - startedAt < 500) railSearchFocusFrame = requestAnimationFrame(recover);
				};
				railSearchFocusFrame = requestAnimationFrame(recover);
			};
			document.addEventListener("click", recoverRailSearchFocus);
			if (typeof ResizeObserver !== "undefined") resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) if (entry.target === observedSidebar) applySidebarWidth(entry.contentRect.width);
				else if (entry.target === observedChatArea) handleViewportResize?.();
			});
			const syncComposerMotion = () => {
				const next = document.querySelector("[data-phase='hero'], [data-phase='active']")?.dataset.phase;
				if (next !== "hero" && next !== "active") return;
				if (composerPhase !== void 0 && composerPhase !== next) {
					body.dataset.maidComposerMotion = next === "active" ? "dock" : "rise";
					if (composerMotionTimer !== void 0) clearTimeout(composerMotionTimer);
					composerMotionTimer = setTimeout(() => {
						delete body.dataset.maidComposerMotion;
						composerMotionTimer = void 0;
					}, 560);
				}
				composerPhase = next;
			};
			const syncSettingsBackdropFrame = () => {
				settingsNavigation.synchronize();
				const mask = document.querySelector(SETTINGS_DIALOG_SELECTOR) === null ? null : document.querySelector(SETTINGS_MASK_SELECTOR);
				const overlay = mask?.parentElement;
				if (overlay === void 0 || overlay === null) {
					settingsBackdropFrame?.remove();
					return;
				}
				if (settingsBackdropFrame === void 0) {
					settingsBackdropFrame = createSidebarCorners();
					settingsBackdropFrame.dataset.maidSettingsBackdropFrame = "";
					ownedNodes.add(settingsBackdropFrame);
				}
				if (settingsBackdropFrame.parentElement !== overlay) overlay.insertBefore(settingsBackdropFrame, mask);
			};
			const topTrim = document.createElement("div");
			topTrim.dataset.skinChrome = "top-trim";
			topTrim.dataset.skinOwner = SKIN_OWNER;
			topTrim.setAttribute("aria-hidden", "true");
			const landingTrimLayer = document.createElement("div");
			landingTrimLayer.dataset.skinTrimLayer = "landing";
			const workspaceTrimLayer = document.createElement("div");
			workspaceTrimLayer.dataset.skinTrimLayer = "workspace";
			topTrim.append(landingTrimLayer, workspaceTrimLayer);
			ownedNodes.add(topTrim);
			const bottomTrim = document.createElement("div");
			bottomTrim.dataset.skinChrome = "bottom-trim";
			bottomTrim.dataset.skinOwner = SKIN_OWNER;
			bottomTrim.setAttribute("aria-hidden", "true");
			ownedNodes.add(bottomTrim);
			decorateTitlebarBrand(ownedNodes);
			decorateSidebar(ownedNodes, decoratedElements);
			decorateWorkspaceTree(decoratedElements);
			ensureChatAreaStage(characterStage);
			ensureChatAreaChrome(topTrim, bottomTrim);
			ensureComposerLaceRail(composerLaceRail);
			ensureResizeObserved();
			const initialSidebar = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
			if (initialSidebar) applySidebarWidth(initialSidebar.getBoundingClientRect().width);
			syncComposerMotion();
			syncSettingsBackdropFrame();
			syncProjectedState();
			const syncSidebarDecorations = () => {
				syncTitlebarHeight?.();
				decorateTitlebarBrand(ownedNodes);
				decorateSidebar(ownedNodes, decoratedElements);
				decorateWorkspaceTree(decoratedElements);
				ensureChatAreaStage(characterStage);
				ensureChatAreaChrome(topTrim, bottomTrim);
				ensureResizeObserved();
				const sidebar = document.querySelector(SIDEBAR_COLUMN_SELECTOR);
				if (sidebar === null) clearSidebarWidth();
				else if (resizeObserver === void 0) applySidebarWidth(sidebar.getBoundingClientRect().width);
			};
			const isSkinChrome = (node) => node instanceof Element && node.getAttribute("data-skin-owner") === SKIN_OWNER;
			const nodeTouches = (node, selector) => node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null);
			const isConversationPhaseRoot = (element) => {
				if (!(element instanceof HTMLElement) || !element.hasAttribute("data-phase")) return false;
				return element.querySelector("[data-conversation-scroll]")?.closest("[data-phase]") === element;
			};
			const sidebarChromeSelector = `${SIDEBAR_COLUMN_SELECTOR}, [class*='titlebar']`;
			const composerSelector = "[data-phase='hero'], [data-phase='active']";
			observer = new MutationObserver((records) => {
				let sidebarStructureChanged = false;
				let workspaceStateChanged = false;
				let backdropChanged = false;
				let composerChanged = false;
				let chatStructureChanged = false;
				let settingsStateChanged = false;
				let projectedStateChanged = false;
				for (const record of records) {
					const target = record.target instanceof Element ? record.target : void 0;
					if (target?.closest(TERMINAL_SELECTOR) !== null) continue;
					if (record.type === "attributes") {
						const conversationPhaseChanged = record.attributeName === "data-phase" && isConversationPhaseRoot(target);
						if (record.attributeName === "aria-expanded" && target !== void 0 && target.closest("[data-slot='sidebar.settings']") !== null) {
							settingsStateChanged = true;
							projectedStateChanged = true;
						} else if ((record.attributeName === "aria-expanded" || record.attributeName === "aria-selected") && target !== void 0 && target.closest(SIDEBAR_COLUMN_SELECTOR) !== null) workspaceStateChanged = true;
						else if (record.attributeName === "data-ds-dark-theme" && record.target === body) backdropChanged = true;
						else if (conversationPhaseChanged) composerChanged = true;
						if (conversationPhaseChanged || record.attributeName === "data-chat-flow" || record.attributeName === "data-cordis-panel" || record.attributeName === "data-slot" || record.attributeName === "role") projectedStateChanged = true;
						continue;
					}
					const appNodes = [...record.addedNodes, ...record.removedNodes].filter((node) => node instanceof Element && !isSkinChrome(node));
					if (!sidebarStructureChanged && appNodes.length > 0 && (target !== void 0 && target.closest(SIDEBAR_COLUMN_SELECTOR) !== null || appNodes.some((node) => nodeTouches(node, sidebarChromeSelector)))) sidebarStructureChanged = true;
					if (!composerChanged && appNodes.length > 0 && (target !== void 0 && target.closest(composerSelector) !== null || appNodes.some((node) => nodeTouches(node, composerSelector)))) composerChanged = true;
					if (!chatStructureChanged && appNodes.length > 0 && (target !== void 0 && target.closest(CONVERSATION_COLUMN_SELECTOR) !== null || appNodes.some((node) => nodeTouches(node, CONVERSATION_COLUMN_SELECTOR)))) chatStructureChanged = true;
					if (!settingsStateChanged && appNodes.length > 0 && target !== void 0 && target.closest("[data-slot='sidebar.settings']") !== null) settingsStateChanged = true;
					if (!projectedStateChanged && appNodes.length > 0 && (appNodes.some((node) => nodeTouches(node, PROJECTED_STATE_SELECTOR)) || target?.matches("header, [data-slot='sidebar.settings']") === true)) projectedStateChanged = true;
				}
				if (projectedStateChanged) syncProjectedState();
				if (sidebarStructureChanged) syncSidebarDecorations();
				else if (workspaceStateChanged) decorateWorkspaceTree(decoratedElements);
				if (!sidebarStructureChanged && chatStructureChanged) {
					ensureChatAreaStage(characterStage);
					ensureChatAreaChrome(topTrim, bottomTrim);
					ensureResizeObserved();
				}
				if (backdropChanged) syncBackdrop();
				if (composerChanged) {
					ensureComposerLaceRail(composerLaceRail);
					syncComposerMotion();
				}
				if (settingsStateChanged || projectedStateChanged) syncSettingsBackdropFrame();
			});
			observer.observe(body, {
				attributes: true,
				attributeFilter: [
					"aria-expanded",
					"aria-selected",
					"data-chat-flow",
					"data-cordis-panel",
					"data-ds-dark-theme",
					"data-phase",
					"data-slot",
					"role"
				],
				childList: true,
				subtree: true
			});
			installMaidPageIcons(ctx);
			document.title = SKIN_TITLE;
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map