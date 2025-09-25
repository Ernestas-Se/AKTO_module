/** @odoo-module **/

/**
 * Initialize a last-view key on first load, and reuse it next time.
 * Also keeps remembering when the view changes (via Layout-level switch).
 *
 * Works with Odoo 17/18/19 (OWL). Uses patch(target, extensionObject).
 */

import { patch } from "@web/core/utils/patch";
import { Layout } from "@web/search/layout";

const KEY_PREFIX = "akto:last_view:";
const APPLIED_SUFFIX = ":applied_once";

function getAction(env) {
    return env.services.action?.currentController?.action;
}
function getActionKey(action) {
    return action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
}
function getAllowedViewTypes(action) {
    const allowed = new Set();
    if (action?.view_mode) {
        action.view_mode.split(",").forEach((m) => allowed.add(m.trim()));
    }
    if (Array.isArray(action?.views)) {
        for (const pair of action.views) {
            if (pair && pair[1]) allowed.add(String(pair[1]).trim()); // [view_id, view_type]
        }
    }
    return allowed;
}
function getCurrentViewFromLayout(layoutInstance) {
    // Some builds expose it as props.activeView; others nest under props.display.activeView
    return (
        layoutInstance.props?.activeView ||
        layoutInstance.props?.display?.activeView ||
        null
    );
}

patch(Layout.prototype, {
    async onSwitchView(ev) {
        const res = await super.onSwitchView(...arguments);
        try {
            const action = getAction(this.env);
            const k = getActionKey(action);
            const v = ev?.detail?.viewType || getCurrentViewFromLayout(this);
            if (k && v) localStorage.setItem(k, v);
        } catch {}
        return res;
    },
});

patch(Layout.prototype, {
    setup() {
        super.setup(...arguments);
        queueMicrotask(() => {
            try {
                const action = getAction(this.env);
                if (!action) return;
                const k = getActionKey(action);
                if (!k) return;

                const allowed = getAllowedViewTypes(action);
                const currentView = getCurrentViewFromLayout(this);
                if (!currentView) return;

                // 1) If no stored value yet, initialize to the current view
                const stored = localStorage.getItem(k);
                if (!stored && allowed.has(currentView)) {
                    localStorage.setItem(k, currentView);
                    return; // first load: just initialize, don't switch
                }

                // 2) If we do have a stored value and it's different & allowed, switch once
                const appliedKey = k + APPLIED_SUFFIX;
                if (!sessionStorage.getItem(appliedKey) && stored && allowed.has(stored) && stored !== currentView) {
                    sessionStorage.setItem(appliedKey, "1");
                    this.env.services.action.doAction(action, {
                        viewType: stored,
                        replaceCurrentAction: true, // keep breadcrumbs clean
                    });
                }
            } catch {}
        });
    },
});