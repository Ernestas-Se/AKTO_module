/** @odoo-module **/
console.log("[AKTO] last-view layout patch loading");

import { patch } from "@web/core/utils/patch";
import { Layout } from "@web/search/layout";

const KEY_PREFIX = "akto:last_view:";
const APPLIED_SUFFIX = ":applied_once";

function getAction(env) {
    return env.services.action?.currentController?.action;
}
function keyFor(action) {
    return action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
}
function allowedViewTypes(action) {
    const s = new Set();
    if (action?.view_mode) action.view_mode.split(",").forEach(v => s.add(v.trim()));
    if (Array.isArray(action?.views)) for (const t of action.views) if (t?.[1]) s.add(String(t[1]).trim());
    return s;
}
function currentView(layout) {
    return layout.props?.activeView || layout.props?.display?.activeView || null;
}

patch(Layout.prototype, {
    setup() {
        super.setup(...arguments);
        queueMicrotask(() => {
            const action = getAction(this.env);
            if (!action) return;

            const k = keyFor(action);
            if (!k) return;

            // Prevent loops
            const appliedKey = k + APPLIED_SUFFIX;
            if (sessionStorage.getItem(appliedKey)) return;

            try {
                const stored = localStorage.getItem(k);
                const cur = currentView(this);
                const allowed = allowedViewTypes(action);

                console.log("[AKTO] action", action.xml_id || action.id, "stored=", stored, "current=", cur, "allowed=", [...allowed]);

                if (stored && allowed.has(stored) && stored !== cur) {
                    sessionStorage.setItem(appliedKey, "1");
                    this.env.services.action.doAction(action, {
                        viewType: stored,
                        replaceCurrentAction: true,
                    });
                }
            } catch {}
        });
    },
});