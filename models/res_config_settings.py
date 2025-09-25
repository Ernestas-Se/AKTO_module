# -*- coding: utf-8 -*-
from odoo import fields, models

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    enforce_six_digit_sku = fields.Boolean(
        string="Enforce 6-digit SKU format",
        config_parameter='akto.enforce_six_digit_sku',
        default=True,
        help="When enabled (default), Internal Reference must be exactly 6 digits. "
             "Turn off to allow other formats."
    )

    default_product_code_sequence_id = fields.Many2one(
        'ir.sequence',
        string="Default Product Code Sequence (no category)",
        config_parameter='akto.default_product_code_sequence_id',
        help="Used when no category sequence is set. "
             "Tip: use 00 as prefix and padding=4 to get 6 digits total (e.g., 000001)."
    )