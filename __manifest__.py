# -*- coding: utf-8 -*-
{
    "name": "Inventory Safety Stock Column",
    "summary": "Safety Stock + Product form tweaks + Item Code label; DB-level unique Item Code (case-insensitive, ignores blanks).",
    "version": "19.0.1.3.0",
    "license": "LGPL-3",
    "author": "AKTO",
    "depends": ["product"],
    "data": [
        "views/product_template_views.xml",
        "views/product_template_form_safety.xml",
        "views/product_template_form_move_name.xml",
        "views/product_template_form_name_code.xml",
        "views/default_code_label_views.xml"
    ],
    "installable": True,
    "application": True
}
