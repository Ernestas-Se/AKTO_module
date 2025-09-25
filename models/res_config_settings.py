# -*- coding: utf-8 -*-
from odoo import fields, models

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
    
    akto_default_product_code_sequence_id = fields.Many2one(
        'ir.sequence',
        string="Default Product Code Sequence (no category)",
        config_parameter='akto.default_product_code_sequence_id',
        help="Used when no category sequence is set. Any format is accepted.",
    )