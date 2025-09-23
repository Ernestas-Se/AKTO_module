# -*- coding: utf-8 -*-
from odoo import fields, models

class ProductTemplateLabelOverride(models.Model):
    _inherit = "product.template"
    default_code = fields.Char(string="No")

class ProductProductLabelOverride(models.Model):
    _inherit = "product.product"
    default_code = fields.Char(string="No")
