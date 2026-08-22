//#region src/protocol.ts
/**
* Stable browser seam between the built-in manager and independently bundled
* skins. A skin declares controls and owns every side effect produced by apply().
*/
const SKIN_CUSTOMIZATION_PROTOCOL = 1;
const SKIN_CUSTOMIZATION_REGISTER_EVENT = "dsh:skin-customization-register-v1";
const SKIN_CUSTOMIZATION_UNREGISTER_EVENT = "dsh:skin-customization-unregister-v1";
const SKIN_CUSTOMIZATION_READY_EVENT = "dsh:skin-customization-ready-v1";
/**
* Expose one skin definition without a runtime dependency on the manager.
* The ready handshake makes load order and manager hot reload irrelevant.
*/
function exposeSkinCustomization(definition, target = window) {
	const token = {};
	const register = () => target.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_REGISTER_EVENT, { detail: {
		token,
		definition
	} }));
	target.addEventListener(SKIN_CUSTOMIZATION_READY_EVENT, register);
	register();
	return () => {
		target.removeEventListener(SKIN_CUSTOMIZATION_READY_EVENT, register);
		target.dispatchEvent(new CustomEvent(SKIN_CUSTOMIZATION_UNREGISTER_EVENT, { detail: {
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
export { SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SkinAttributeProjector, exposeSkinCustomization };
