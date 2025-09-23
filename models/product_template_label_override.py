# -*- coding: utf-8 -*-

#Default label changes. Also need to do changes in AKTO_label_names_change.xml

from odoo import fields, models

#"Internal reference" to "No"
class ProductTemplateLabelOverride(models.Model):
    _inherit = "product.template"
    default_code = fields.Char(string="No")

class ProductProductLabelOverride(models.Model):
    _inherit = "product.product"
    default_code = fields.Char(string="No")
