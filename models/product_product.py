# -*- coding: utf-8 -*-
from odoo import fields, models

class ProductProductLabelOverride(models.Model):
    _inherit = "product.product"

    default_code = fields.Char(string="Item Code")
