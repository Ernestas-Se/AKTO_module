/** @odoo-module **/

/**
 * Odoo 17/18/19 (OWL) webclient patch:
 * - Store the selected view type when the user switches views.
 * - Next time the same action/menu opens, prefer the stored view
 *   if it’s available in the action's view list.
 *
 * Notes:
 * - This is intentionally minimal and uses localStorage.
 * - If you want server-side persistence (works across browsers),
 *   we can store the mapping on res.users in a JSON field instead.
 */

import { patch } from "@web/core/utils/patch";
import { Layout } from "@web/search/layout";

const KEY_PREFIX = "akto:last_view:";

function actionKey(env) {
    // Current action controller: holds the action descriptor with id, views, etc.
    const ctrl = env.services.action?.currentController;
    const action = ctrl?.action;
    // Fall back to xml_id if present; otherwise numeric id
    return action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
}

// 1) Remember the view when user switches via the view switcher
patch(Layout.prototype, "akto_last_view.remember_on_switch", {
    async onSwitchView(ev) {
        // ev.detail?.viewType is used by the view switcher buttons
        const res = await this._super(ev);
        try {
            const k = actionKey(this.env);
            const v = ev?.detail?.viewType || this.props.activeView;
            if (k && v) {
                window.localStorage.setItem(k, v);
            }
        } catch (e) {
            // ignore storage errors
        }
        return res;
    },
});

// 2) When Layout initializes, if there is a stored view and it's available,
//    ask the action service to relaunch with that view (without breaking breadcrumbs)
patch(Layout.prototype, "akto_last_view.apply_on_load", {
    setup() {
        this._super();
        queueMicrotask(() => {
            try {
                const ctrl = this.env.services.action?.currentController;
                const action = ctrl?.action;
                const k = actionKey(this.env);
                const stored = k && window.localStorage.getItem(k);
                if (!action || !stored) return;

                // Gather allowed view types from the action
                const allowed = new Set();
                if (action.view_mode) {
                    action.view_mode.split(",").forEach((m) => allowed.add(m.trim()));
                }
                if (action.views) {
                    for (const [, t] of action.views) allowed.add(t);
                }

                // Only switch if the stored view exists and isn't already active
                const currentView = this.props.activeView;
                if (allowed.has(stored) && stored !== currentView) {
                    // Re-run the same action but ask for a specific viewType
                    this.env.services.action.doAction(action, {
                        viewType: stored,
                        replaceCurrentAction: true, // avoid breadcrumb duplication
                    });
                }
            } catch (e) {
                // fail-safe: do nothing
            }
        });
    },
});