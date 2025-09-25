# -*- coding: utf-8 -*-
from odoo import fields, models

class ProductCategory(models.Model):
    _inherit = 'product.category'

    code_sequence_id = fields.Many2one(
        'ir.sequence',
        string="Internal Reference Sequence",
        help="Sequence used to generate 6-digit Internal References for products in this category. "
             "Tip: set a 2-digit prefix and padding=4 to get 6 digits total (e.g., 120001)."
    )