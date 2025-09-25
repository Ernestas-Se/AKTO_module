# AKTO_module

## Overview
This Odoo 19 module provides enhancements and customizations for product management, including:
- Custom product form tweaks
- Unique item code enforcement (case-insensitive, ignores blanks)
- Label and view overrides for product templates and variants

## Key Models
- `product.template`: Main product template model, extended with safety stock and custom code+name logic.
- `product.product`: Product variant model, with unique code constraints and label overrides.

## Features
- Enforces uniqueness and non-blank values for the `default_code` (now labeled as "No.").
- Customizes product form views to display and style the code and name fields.
- Odoo remenbers your last used Product view

## File Structure
- `models/`: Python files for model extensions and constraints.
- `views/`: XML files for form and tree view customizations.
- `__manifest__.py`: Odoo module manifest, lists dependencies and data files.

## Notable Conventions
- All product codes are labeled as "No." in the UI.
- All `views` has to have "AKTO_" prefix

## To Do / Notes
- [ ] Review and update this README with any additional business logic or conventions.
- [ ] Add any special instructions for deployment or upgrades.

