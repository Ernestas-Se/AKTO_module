# -*- coding: utf-8 -*-
import random
from odoo import api, models
from odoo.tools import mute_logger

# Psycopg exceptions vary by version; be tolerant
try:
    from psycopg2 import IntegrityError  # classic
except Exception:  # pragma: no cover
    try:
        from psycopg2.errors import UniqueViolation as IntegrityError
    except Exception:
        IntegrityError = Exception


class ProductProduct(models.Model):
    _inherit = 'product.product'

    # Retries when the DB unique constraint trips due to concurrency
    _AKTO_CODE_RETRY = 8

    # How many candidates max when probing for a free code
    _AKTO_SEQ_PROBE_LIMIT = 150

    # How many candidates max when probing for a free emergency code
    _AKTO_EMERGENCY_PROBE_LIMIT = 300

    def _akto_code_exists(self, code):
        """Check existence across active & archived variants."""
        if not code:
            return False
        Product = self.env['product.product'].sudo().with_context(active_test=False)
        return bool(Product.search_count([('default_code', '=', code)], limit=1))

    def _akto_next_unique_from_sequence(self, seq):
        """
        Pulls from sequence until a free code is found (bounded attempts).
        Returns the free code, or None if not found / no seq.
        """
        if not seq:
            return None

        for _ in range(self._AKTO_SEQ_PROBE_LIMIT):
            # next_by_id() is sequence-safe under concurrency
            candidate = seq.next_by_id()
            if candidate and not self._akto_code_exists(candidate):
                return candidate
        return None

    def _akto_generate_emergency_code(self):
        """
        Generate a unique 7-char code starting with 'E' + 6 digits.
        Loops until a free one is found (bounded).
        """
        for _ in range(self._AKTO_EMERGENCY_PROBE_LIMIT):
            candidate = 'E' + f"{random.randint(0, 999_999):06d}"
            if not self._akto_code_exists(candidate):
                return candidate
        return None  # extremely unlikely; handled by caller

    @api.model_create_multi
    def create(self, vals_list):
        products = super().create(vals_list)

        if self.env.context.get('skip_auto_code'):
            return products

        ICP = self.env['ir.config_parameter'].sudo()
        # Fallback sequence (used when no category sequence is set)
        default_seq_id = ICP.get_param('akto.default_product_code_sequence_id')
        default_seq = self.env['ir.sequence'].browse(int(default_seq_id)) if default_seq_id else False

        for product in products:
            # Respect any manually provided default_code
            if product.default_code:
                continue

            tmpl = product.product_tmpl_id
            seq = tmpl.categ_id.code_sequence_id or default_seq

            # 1) Try to get a free code from sequence (if any)
            code = self._akto_next_unique_from_sequence(seq)

            # 2) If none available or no sequence configured, fall back to emergency code
            if not code:
                code = self._akto_generate_emergency_code()

            # 3) Final safety net: write with retry on DB race collisions
            #    If a collision occurs, we fetch another candidate (seq first, then emergency)
            #    and retry a few times before ultimately erroring.
            if not code:
                # As a last resort, make one more attempt from either source
                code = self._akto_next_unique_from_sequence(seq) or self._akto_generate_emergency_code()

            # If still no code, we must fail explicitly to respect your DB constraint
            if not code:
                raise ValueError(
                    "Could not allocate unique Internal Reference: "
                    "sequence exhausted and emergency code generation failed."
                )

            for _ in range(self._AKTO_CODE_RETRY):
                try:
                    # write() instead of direct assignment to control exception
                    product.write({'default_code': code})
                    break
                except IntegrityError:
                    # Another transaction grabbed the same code meanwhile
                    with mute_logger('odoo.sql_db'):  # silence duplicate key logs
                        self.env.cr.rollback()
                    # Get a fresh candidate (try sequence again first; then emergency)
                    code = self._akto_next_unique_from_sequence(seq) or self._akto_generate_emergency_code()
                    if not code:
                        # Try one more emergency generation before giving up
                        code = self._akto_generate_emergency_code()
                        if not code:
                            break
            else:
                # All retries exhausted: one last hard fail so the record won't remain invalid
                raise ValueError(
                    "Could not assign a unique Internal Reference after multiple attempts. "
                    "Please re-try or review sequence/emergency code policy."
                )

        return products