/** @odoo-module **/

/**
 * Store last used view when the user clicks a view switcher button.
 * This complements the Layout patch and guarantees we persist the choice.
 */

import { patch } from "@web/core/utils/patch";
import { ViewButton } from "@web/views/view_button/view_button";

const KEY_PREFIX = "akto:last_view:";

function getAction(env) {
    return env.services.action?.currentController?.action;
}
function getActionKey(action) {
    return action ? `${KEY_PREFIX}${action.xml_id || action.id}` : null;
}

patch(ViewButton.prototype, {
    onClick(ev) {
        try {
            const action = getAction(this.env);
            const k = getActionKey(action);
            const v = this.props?.viewType; // the button’s target view type
            if (k && v) localStorage.setItem(k, v);
        } catch {}
        return super.onClick(...arguments);
    },
});