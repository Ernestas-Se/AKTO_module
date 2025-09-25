# -*- coding: utf-8 -*-
import re
from odoo import api, models, _
from odoo.exceptions import ValidationError

SKU_REGEX = re.compile(r'^\d{6}$')

class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.model_create_multi
    def create(self, vals_list):
        products = super().create(vals_list)

        if self.env.context.get('skip_auto_code'):
            return products

        ICP = self.env['ir.config_parameter'].sudo()
        enforce_flag = ICP.get_param('akto.enforce_six_digit_sku', 'True') == 'True'
        default_seq_id = ICP.get_param('akto.default_product_code_sequence_id')
        default_seq = self.env['ir.sequence'].browse(int(default_seq_id)) if default_seq_id else False

        for product in products:
            if product.default_code:
                if enforce_flag and not SKU_REGEX.match(product.default_code):
                    raise ValidationError(_("Internal Reference must be exactly 6 digits."))
                continue

            seq = product.product_tmpl_id.categ_id.code_sequence_id or default_seq
            if not seq:
                continue

            code = seq.next_by_id()
            if enforce_flag and not SKU_REGEX.match(code or ''):
                raise ValidationError(_(
                    "The selected sequence generated '%s', which does not match the 6-digit format.\n"
                    "Adjust the sequence (prefix=2 digits, padding=4) or disable enforcement in Settings."
                ) % (code,))
            product.default_code = code

        return products

    @api.constrains('default_code')
    def _check_default_code_format(self):
        ICP = self.env['ir.config_parameter'].sudo()
        enforce_flag = ICP.get_param('akto.enforce_six_digit_sku', 'True') == 'True'
        if not enforce_flag:
            return
        for rec in self:
            if rec.default_code and not SKU_REGEX.match(rec.default_code):
                raise ValidationError(_("Internal Reference must be exactly 6 digits."))