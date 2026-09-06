//#region src/protocol.ts
/**
* Stable browser seam between the built-in manager and independently bundled
* skins. A skin declares controls and owns every side effect produced by apply().
*/
const LEGACY_SKIN_CUSTOMIZATION_PROTOCOL = 1;
const SKIN_CUSTOMIZATION_PROTOCOL = 2;
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
const SKIN_CUSTOMIZATION_REGISTER_EVENT = SKIN_CUSTOMIZATION_EVENTS[2].register;
const SKIN_CUSTOMIZATION_UNREGISTER_EVENT = SKIN_CUSTOMIZATION_EVENTS[2].unregister;
const SKIN_CUSTOMIZATION_READY_EVENT = SKIN_CUSTOMIZATION_EVENTS[2].ready;
/**
* Expose one skin definition without a runtime dependency on the manager.
* The ready handshake makes load order and manager hot reload irrelevant.
*/
function exposeSkinCustomization(definition, target = window) {
	const token = {};
	const events = SKIN_CUSTOMIZATION_EVENTS[definition.protocol];
	const register = () => target.dispatchEvent(new CustomEvent(events.register, { detail: {
		token,
		definition
	} }));
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
export { LEGACY_SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_EVENTS, SKIN_CUSTOMIZATION_PROTOCOL, SKIN_CUSTOMIZATION_READY_EVENT, SKIN_CUSTOMIZATION_REGISTER_EVENT, SKIN_CUSTOMIZATION_UNREGISTER_EVENT, SkinAttributeProjector, exposeSkinCustomization };
