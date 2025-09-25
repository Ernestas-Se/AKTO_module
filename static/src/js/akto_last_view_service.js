/** @odoo-module **/

/**
 * AKTO - Remember last used view (kanban/list/...) per action.
 *
 * Works by wrapping the live `action` service instance:
 *  - inject stored viewType into doAction if none provided
 *  - persist viewType after navigation or when switching views
 *
 * Odoo 17/18/19 – use the service registry, not a class prototype.
 */

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";

const KEY_PREFIX = "akto:last_view:";

function keyFromAction(action) {
    return action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
}
function keyFromRequest(req) {
    if (typeof req === "number" || typeof req === "string") return `${KEY_PREFIX}${req}`;
    if (req && (req.xml_id || req.id)) return `${KEY_PREFIX}${req.xml_id || req.id}`;
    return null;
}

export const aktoLastViewService = {
    dependencies: ["action"],
    start(env, { action }) {
        console.log("[AKTO] last-view service starting");

        // Wrap the live action service object
        patch(action, {
            async doAction(actionRequest, options = {}) {
                try {
                    // Inject stored viewType if the caller didn't specify one
                    const k = keyFromRequest(actionRequest);
                    if (k && !options.viewType) {
                        const stored = localStorage.getItem(k);
                        if (stored) {
                            options = { ...options, viewType: stored };
                            console.log("[AKTO] injecting stored viewType", stored, "for", k);
                        }
                    }
                } catch {}

                const res = await super.doAction(actionRequest, options);

                // Persist the view after navigation
                try {
                    const ctrl = env.services.action.currentController;
                    const k = keyFromAction(ctrl?.action) || keyFromRequest(actionRequest);
                    const used =
                        options.viewType ||
                        ctrl?.props?.view?.type ||
                        ctrl?.props?.display?.activeView ||
                        null;
                    if (k && used) {
                        localStorage.setItem(k, used);
                        console.log("[AKTO] stored", k, "=", used);
                    }
                } catch {}

                return res;
            },

            async switchView(viewType, kwargs) {
                // Some builds use a direct switch; persist here too
                try {
                    const ctrl = env.services.action.currentController;
                    const k = keyFromAction(ctrl?.action);
                    if (k && viewType) {
                        localStorage.setItem(k, viewType);
                        console.log("[AKTO] stored via switchView", k, "=", viewType);
                    }
                } catch {}
                return super.switchView ? await super.switchView(viewType, kwargs) : undefined;
            },
        });

        // Optional API (not used elsewhere, handy for debugging)
        return {
            get(actionKey) { return localStorage.getItem(`${KEY_PREFIX}${actionKey}`); },
        };
    },
};

// Register our tiny service so it starts with the webclient.
registry.category("services").add("akto_last_view", aktoLastViewService);