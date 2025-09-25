/** @odoo-module **/

/**
 * AKTO - Remember last used view (kanban/list/...) per action.
 * Stores AND looks up by BOTH xml_id and numeric id, and keeps a map id->xml_id.
 */

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";

const KEY_PREFIX = "akto:last_view:";
const MAP_XML_BY_ID = "akto:last_view:xml_by_id:"; // e.g., akto:last_view:xml_by_id:1234 -> "stock.product_template_action_product"

function kXml(xmlId)        { return `${KEY_PREFIX}${xmlId}`; }
function kId(id)            { return `${KEY_PREFIX}${id}`; }
function kMapId(id)         { return `${MAP_XML_BY_ID}${id}`; }

function keyFromAction(action) {
    if (!action) return { idKey: null, xmlKey: null };
    return { idKey: kId(action.id), xmlKey: action.xml_id ? kXml(action.xml_id) : null };
}

function ensureStore(action, viewType) {
    try {
        const { idKey, xmlKey } = keyFromAction(action);
        if (viewType) {
            if (idKey)  localStorage.setItem(idKey, viewType);
            if (xmlKey) localStorage.setItem(xmlKey, viewType);
            if (idKey && action?.xml_id) {
                // remember mapping id -> xml_id for future lookups
                localStorage.setItem(kMapId(action.id), action.xml_id);
            }
            console.log("[AKTO] stored", idKey, "and", xmlKey, "=", viewType);
        }
    } catch {}
}

function lookupStored(actionRequest) {
    try {
        // 1) Direct by request (string xml_id or numeric id)
        if (typeof actionRequest === "string") {
            const s = localStorage.getItem(kXml(actionRequest));
            if (s) return s;
        }
        if (typeof actionRequest === "number") {
            const s = localStorage.getItem(kId(actionRequest));
            if (s) return s;
            // 2) Try mapping id -> xml_id then lookup xml_id key
            const xml = localStorage.getItem(kMapId(actionRequest));
            if (xml) {
                const s2 = localStorage.getItem(kXml(xml));
                if (s2) return s2;
            }
        }
        // 3) Request is an object {id, xml_id}
        if (actionRequest && (actionRequest.id || actionRequest.xml_id)) {
            const sObjId  = actionRequest.id     ? localStorage.getItem(kId(actionRequest.id))     : null;
            const sObjXml = actionRequest.xml_id ? localStorage.getItem(kXml(actionRequest.xml_id)) : null;
            return sObjId || sObjXml || null;
        }
    } catch {}
    return null;
}

export const aktoLastViewService = {
    dependencies: ["action"],
    start(env, { action }) {
        console.log("[AKTO] last-view service starting");

        patch(action, {
            async doAction(actionRequest, options = {}) {
                try {
                    if (!options.viewType) {
                        const stored = lookupStored(actionRequest);
                        if (stored) {
                            options = { ...options, viewType: stored };
                            console.log("[AKTO] injecting stored viewType", stored, "for", actionRequest);
                        }
                    }
                } catch {}

                const res = await super.doAction(actionRequest, options);

                // After navigation, persist under both id and xml_id (and remember the mapping)
                try {
                    const ctrl = env.services.action.currentController;
                    const act  = ctrl?.action;
                    const used =
                        options.viewType ||
                        ctrl?.props?.view?.type ||
                        ctrl?.props?.display?.activeView ||
                        null;
                    ensureStore(act, used);
                } catch {}

                return res;
            },

            async switchView(viewType, kwargs) {
                // Persist the explicit user choice as well
                try {
                    const ctrl = env.services.action.currentController;
                    ensureStore(ctrl?.action, viewType);
                } catch {}
                return super.switchView ? await super.switchView(viewType, kwargs) : undefined;
            },
        });

        return {}; // optional service API not needed
    },
};

registry.category("services").add("akto_last_view", aktoLastViewService);