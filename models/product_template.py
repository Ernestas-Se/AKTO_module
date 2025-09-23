# -*- coding: utf-8 -*-
from odoo import api, fields, models

class ProductTemplate(models.Model):
    _inherit = "product.template"

    safety_stock = fields.Float(
        string="Safety Stock",
        help="Placeholder field for safety stock. No logic or computation yet.",
    )

    name_code = fields.Char(
        string="Code + Name",
        compute="_compute_name_code",
        store=False,
        help="Concatenation of the main variant Internal Reference and the Product Name.",
    )

    @api.depends('name', 'product_variant_id.default_code')
    def _compute_name_code(self):
        for tmpl in self:
            code = (tmpl.product_variant_id and tmpl.product_variant_id.default_code) or ''
            name = tmpl.name or ''
            tmpl.name_code = (f"{code} {name}".strip()) if code else name
