/** @odoo-module **/

/**
 * Remember the last view (kanban/list/…) used for each action and restore it
 * next time that action is opened.
 *
 * - Stores per-action view type in localStorage (per browser).
 * - Only switches if the stored view exists for the action.
 * - Uses the v17+ patch API (patch(target, extensionObject)).
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
            // pair format: [view_id, view_type]
            if (pair && pair[1]) allowed.add(String(pair[1]).trim());
        }
    }
    return allowed;
}
function getCurrentViewFromLayout(layoutInstance) {
    // Different Odoo builds may expose the current view type on props as
    // `activeView` or nested under `display.activeView`.
    return (
        layoutInstance.props?.activeView ||
        layoutInstance.props?.display?.activeView ||
        null
    );
}

/* 1) When the user switches view via the view switcher, remember it. */
patch(Layout.prototype, {
    async onSwitchView(ev) {
        const res = await super.onSwitchView(...arguments);
        try {
            const action = getAction(this.env);
            const k = getActionKey(action);
            const v = ev?.detail?.viewType || getCurrentViewFromLayout(this);
            if (k && v) {
                window.localStorage.setItem(k, v);
            }
        } catch {
            // ignore storage errors
        }
        return res;
    },
});

/* 2) On load, if we have a stored view for this action and it is allowed,
      relaunch the action once with that view (keeps breadcrumbs clean). */
patch(Layout.prototype, {
    setup() {
        super.setup(...arguments);
        queueMicrotask(() => {
            try {
                const action = getAction(this.env);
                if (!action) return;

                const k = getActionKey(action);
                if (!k) return;

                // avoid switching more than once per action load
                const appliedKey = k + APPLIED_SUFFIX;
                if (sessionStorage.getItem(appliedKey)) return;

                const stored = window.localStorage.getItem(k);
                if (!stored) return;

                const allowed = getAllowedViewTypes(action);
                const currentView = getCurrentViewFromLayout(this);

                if (allowed.has(stored) && stored !== currentView) {
                    sessionStorage.setItem(appliedKey, "1");
                    this.env.services.action.doAction(action, {
                        viewType: stored,
                        replaceCurrentAction: true, // avoids breadcrumb duplication
                    });
                }
            } catch {
                // fail-safe: do nothing
            }
        });
    },
});