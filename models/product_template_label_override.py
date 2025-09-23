# -*- coding: utf-8 -*-
from odoo import fields, models

class ProductTemplateLabelOverride(models.Model):
    _inherit = "product.template"

    default_code = fields.Char(string="Item Code")
