# -*- coding: utf-8 -*-
{
    "name": "AKTO module for functionality additions and customizations",
    "summary": "",
    "version": "19.0.1.3.7",
    "license": "LGPL-3",
    "author": "AKTO",
    "depends": ["product", "web","base"],
    "data": [
        "views/AKTO_label_names_change.xml",
        "views/AKTO_product_template_form_name_change.xml",
        "views/product_category_views.xml",
        "views/res_config_settings_views.xml"
    ],
    "assets": {
        "web.assets_backend": [
            "AKTO_module/static/src/js/akto_last_view_service.js",
        ],
    },
    "installable": True,
    "application": True
}