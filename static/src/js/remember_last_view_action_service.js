/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ActionService } from "@web/webclient/actions/action_service";

const KEY_PREFIX = "akto:last_view:";

function keyFrom(actionRequest, resolvedAction) {
    // Accept id (number), xml_id (string), or a resolved action object
    if (typeof actionRequest === "number" || typeof actionRequest === "string") {
        return `${KEY_PREFIX}${actionRequest}`;
    }
    if (resolvedAction && (resolvedAction.xml_id || resolvedAction.id)) {
        return `${KEY_PREFIX}${resolvedAction.xml_id || resolvedAction.id}`;
    }
    if (actionRequest && (actionRequest.xml_id || actionRequest.id)) {
        return `${KEY_PREFIX}${actionRequest.xml_id || actionRequest.id}`;
    }
    return null;
}

function setLastView(key, viewType) {
    try {
        if (key && viewType) {
            localStorage.setItem(key, viewType);
            console.log("[AKTO] stored", key, "=", viewType);
        }
    } catch {}
}

function getLastView(key) {
    try { return key ? localStorage.getItem(key) : null; } catch { return null; }
}

patch(ActionService.prototype, {
    async doAction(actionRequest, options = {}) {
        // Let Odoo resolve the action (so we can extract id/xml_id reliably)
        const result = await super.doAction(actionRequest, options);

        try {
            // After a navigation, remember the view used for this action if provided
            const key = keyFrom(actionRequest, this.currentController?.action);
            const usedViewType =
                options.viewType ||
                this.currentController?.props?.view?.type || // sometimes available
                null;

            if (key && usedViewType) {
                setLastView(key, usedViewType);
            }
        } catch {}

        return result;
    },

    // Optional: persist when switching without doAction (if supported in your build)
    async switchView(viewType, kwargs) {
        try {
            const action = this.currentController?.action;
            const key = action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
            setLastView(key, viewType);
        } catch {}
        return await (super.switchView?.call(this, viewType, kwargs));
    },
});