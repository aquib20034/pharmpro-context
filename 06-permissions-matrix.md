# 06 — Permissions Matrix

Permissions are flat string keys `area.action`, seeded globally and assigned to tenant-scoped roles via spatie/laravel-permission (`team_foreign_key = tenant_id`). The backend checks a permission on every endpoint; frontend uses the same keys only to hide UI.

Scope rule: in addition to the permission, a user may act on a branch only if assigned to it (`user_branches`), and on a warehouse only if it belongs to an assigned branch. Owner and Admin bypass branch assignment.

## 1. Permission keys

| Key | Meaning |
| --- | --- |
| **Tenant & settings** | |
| `settings.view` | View tenant settings |
| `settings.manage` | Edit tenant profile, settings, numbering, payment methods |
| `branches.manage` | CRUD branches, warehouses, locations |
| `users.manage` | CRUD users, invitations, branch assignments |
| `roles.manage` | CRUD roles and permission assignment |
| `audit.view` | Audit log viewer |
| **Catalog** | |
| `catalog.view` | View manufacturers, categories, forms, units, taxes, products, prices |
| `catalog.manage` | CRUD manufacturers, categories, forms, units, tax categories |
| `taxes.manage` | CRUD taxes |
| `products.create` / `products.update` / `products.deactivate` | |
| `products.prices.manage` | Add new effective prices |
| `products.barcodes.manage` | |
| **Partners** | |
| `suppliers.view` / `suppliers.manage` | |
| `customers.view` | |
| `customers.create` | Create customers (POS quick-add) without edit rights |
| `customers.manage` | Create, update, deactivate customers |
| `customers.credit.manage` | Change credit limit / terms |
| **Inventory** | |
| `inventory.view` | Balances, ledger, batches, expiry, low stock |
| `inventory.batch.update` | Edit batch notes/MRP |
| `inventory.batch.status` | Quarantine / block / release a batch |
| `inventory.adjust.create` | Create and submit adjustments |
| `inventory.adjust.approve` | Approve/reject adjustments |
| `inventory.adjust.post` | Post approved adjustments |
| `inventory.stocktake.manage` | Open/cancel stocktakes |
| `inventory.stocktake.count` | Enter counts |
| `inventory.stocktake.approve` | Approve and complete |
| `inventory.rebuild` | Run balance rebuild (Owner/Admin only) |
| **Procurement** | |
| `purchases.view` | |
| `purchases.create` | Create/edit drafts |
| `purchases.post` | Post purchases |
| `purchases.reverse` | Reverse posted purchases |
| `purchases.return` | Create and post purchase returns |
| `purchases.credit.override` | Post beyond supplier credit limit |
| `purchases.tax.override` | Change resolved tax on a line |
| **Sales / POS** | |
| `pos.access` | Open POS screen |
| `sales.view` | View sales |
| `sales.create` | Create drafts, hold/resume |
| `sales.post` | Post sales |
| `sales.void` | Void same-day sales (reason required) |
| `sales.return` | Create and post linked returns |
| `sales.return.unlinked` | Returns without original sale |
| `sales.price_override` | Set price above MRP or below cost, or manual price |
| `sales.discount.override` | Exceed tenant max discount |
| `sales.select_batch` | Choose batch manually |
| `sales.sell_near_expiry` | Sell within near-expiry window when blocking is enabled |
| `sales.credit.override` | Credit sale beyond customer limit |
| **Payments & accounting** | |
| `payments.view` | |
| `payments.create` | Record customer/supplier payments and allocations |
| `payments.reverse` | |
| `accounting.view` | Chart of accounts, journals, ledger, statements |
| `accounting.accounts.manage` | CRUD non-system accounts |
| `accounting.journal.create` | Manual journals / expense vouchers (draft) |
| `accounting.journal.post` | Post manual journals |
| `accounting.reverse` | Reverse any posted journal/document (Accountant+) |
| `accounting.periods.manage` | Fiscal years, period close, lock date |
| **Reports** | |
| `reports.inventory` / `reports.sales` / `reports.purchases` / `reports.financial` | View report family |
| `reports.export` | Export CSV/PDF |
| `dashboard.view` | |
| **Imports & notifications** | |
| `imports.run` | |
| `notifications.manage` | Edit notification rules/recipients |

## 2. Default role mapping

✓ = granted. Owner has every permission and cannot be edited. Roles are copied into each tenant on creation and may be customised.

| Permission | Owner | Admin | Branch Mgr | Pharmacist | Cashier | Purchase Mgr | Accountant | Auditor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| settings.view | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| settings.manage | ✓ | ✓ | | | | | | |
| branches.manage | ✓ | ✓ | | | | | | |
| users.manage | ✓ | ✓ | | | | | | |
| roles.manage | ✓ | ✓ | | | | | | |
| audit.view | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| catalog.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| catalog.manage | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| taxes.manage | ✓ | ✓ | | | | | ✓ | |
| products.create / update | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| products.deactivate | ✓ | ✓ | ✓ | | | | | |
| products.prices.manage | ✓ | ✓ | ✓ | ✓ | | | | |
| products.barcodes.manage | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| suppliers.view | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| suppliers.manage | ✓ | ✓ | ✓ | | | ✓ | | |
| customers.view | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| customers.create | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| customers.manage | ✓ | ✓ | ✓ | ✓ | | | | |
| customers.credit.manage | ✓ | ✓ | ✓ | | | | ✓ | |
| inventory.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| inventory.batch.update | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| inventory.batch.status | ✓ | ✓ | ✓ | ✓ | | | | |
| inventory.adjust.create | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| inventory.adjust.approve | ✓ | ✓ | ✓ | | | | | |
| inventory.adjust.post | ✓ | ✓ | ✓ | | | | | |
| inventory.stocktake.manage | ✓ | ✓ | ✓ | ✓ | | | | |
| inventory.stocktake.count | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| inventory.stocktake.approve | ✓ | ✓ | ✓ | | | | | |
| inventory.rebuild | ✓ | ✓ | | | | | | |
| purchases.view | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| purchases.create | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| purchases.post | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| purchases.reverse | ✓ | ✓ | ✓ | | | | ✓ | |
| purchases.return | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| purchases.credit.override | ✓ | ✓ | ✓ | | | | | |
| purchases.tax.override | ✓ | ✓ | | | | | ✓ | |
| pos.access | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| sales.view | ✓ | ✓ | ✓ | ✓ | ✓ (own branch) | | ✓ | ✓ |
| sales.create / post | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| sales.void | ✓ | ✓ | ✓ | | | | | |
| sales.return | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| sales.return.unlinked | ✓ | ✓ | ✓ | | | | | |
| sales.price_override | ✓ | ✓ | ✓ | ✓ | | | | |
| sales.discount.override | ✓ | ✓ | ✓ | | | | | |
| sales.select_batch | ✓ | ✓ | ✓ | ✓ | | | | |
| sales.sell_near_expiry | ✓ | ✓ | ✓ | ✓ | | | | |
| sales.credit.override | ✓ | ✓ | ✓ | | | | | |
| payments.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| payments.create | ✓ | ✓ | ✓ | ✓ | ✓ (customer receipts only) | ✓ (supplier) | ✓ | |
| payments.reverse | ✓ | ✓ | ✓ | | | | ✓ | |
| accounting.view | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| accounting.accounts.manage | ✓ | ✓ | | | | | ✓ | |
| accounting.journal.create / post | ✓ | ✓ | | | | | ✓ | |
| accounting.reverse | ✓ | ✓ | | | | | ✓ | |
| accounting.periods.manage | ✓ | | | | | | ✓ | |
| reports.inventory | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| reports.sales | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| reports.purchases | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| reports.financial | ✓ | ✓ | ✓ | | | | ✓ | ✓ |
| reports.export | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| dashboard.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| imports.run | ✓ | ✓ | ✓ | | | | ✓ | |
| notifications.manage | ✓ | ✓ | ✓ | | | | | |

Notes:
- `customers.manage` implies `customers.create`.
- Dashboard widgets are filtered by the report permissions above.

## 3. Enforcement checklist per endpoint

1. `auth:sanctum` and active user.
2. `can:<permission>` middleware or Policy method.
3. Branch/warehouse scope check for any request carrying `branch_id`/`warehouse_id` or acting on a document with one.
4. Record ownership for self-service actions (e.g. editing own draft).
5. Elevated-permission actions (override, void, reverse, approve) write an audit entry with `reason` where required.

## 4. Tests

For every permission key: one feature test asserting 403 without it and 2xx with it, generated from a table-driven test so new endpoints cannot be added without a row.
