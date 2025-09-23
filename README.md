# AKTO_module

## Overview
This Odoo module provides enhancements and customizations for product management, including:
- Safety Stock field for products
- Custom product form tweaks
- Unique item code enforcement (case-insensitive, ignores blanks)
- Label and view overrides for product templates and variants

## Key Models
- `product.template`: Main product template model, extended with safety stock and custom code+name logic.
- `product.product`: Product variant model, with unique code constraints and label overrides.

## Features
- Adds a `safety_stock` field to product templates.
- Enforces uniqueness and non-blank values for the `default_code` (now labeled as "No.").
- Customizes product form views to display and style the code and name fields.

## File Structure
- `models/`: Python files for model extensions and constraints.
- `views/`: XML files for form and tree view customizations.
- `__manifest__.py`: Odoo module manifest, lists dependencies and data files.

## Notable Conventions
- All product codes are labeled as "No." in the UI.
- View XML files are merged where possible for maintainability.
- Redundant or duplicate logic is minimized.

## To Do / Notes
- [ ] Review and update this README with any additional business logic or conventions.
- [ ] Add any special instructions for deployment or upgrades.

---
_Edit this file to add more details about your module's purpose, business rules, or special requirements._
