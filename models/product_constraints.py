# -*- coding: utf-8 -*-
from odoo import api, models, _
from odoo.exceptions import ValidationError


def _raise_if_blank_or_duplicate(env, code, exclude_id=None):
    """
    Helper: raise if code is blank or already used (case-insensitive, trimmed).
    exclude_id: product_product.id to exclude from duplicate check.
    """
    code_trim = (code or '').strip()
    if not code_trim:
        raise ValidationError(_('Item Code is required and cannot be blank.'))

    env.cr.execute(
        """
        SELECT 1
          FROM product_product
         WHERE (%s IS NULL OR id != %s)
           AND lower(trim(default_code)) = lower(trim(%s))
         LIMIT 1
        """,
        (exclude_id, exclude_id, code_trim),
    )
    if env.cr.fetchone():
        # Show what the user typed (not the trimmed one), it’s more informative
        raise ValidationError(
            _('Item Code must be unique. "%s" is already used by another product.') % (code or '')
        )


class ProductProductUniqueCode(models.Model):
    _inherit = 'product.product'

    @api.constrains('default_code')
    def _check_item_code_required_and_unique(self):
        """
        Enforce Item Code (default_code) to be:
        - required (non-blank after trimming),
        - unique (case-insensitive, trimmed),
        across ALL products (active and archived).

        This runs on variant edits. Creation of a brand-new product via template
        is covered in ProductTemplate.create below.
        """
        for rec in self:
            # If the field is empty in DB, this will raise (required)
            _raise_if_blank_or_duplicate(self.env, rec.default_code, exclude_id=rec.id)


class ProductTemplateCreateGuard(models.Model):
    _inherit = 'product.template'

    @api.model_create_multi
    def create(self, vals_list):
        """
        After Odoo creates the template (and its variants), enforce that
        SINGLE-VARIANT templates have a non-blank and globally unique Item Code
        on the main variant. Multi-variant templates are not forced here; variants
        will be enforced individually on edit/save by the variant constraint.
        """
        records = super().create(vals_list)

        for tmpl in records:
            # Only enforce on single-variant templates (the form shows Item Code there)
            if tmpl.product_variant_count <= 1:
                variant = tmpl.product_variant_id
                if variant:
                    _raise_if_blank_or_duplicate(self.env, variant.default_code, exclude_id=variant.id)
                else:
                    # Safety net: if no variant is present (shouldn't happen), still block
                    raise ValidationError(_('Item Code is required and cannot be blank.'))

        return records
