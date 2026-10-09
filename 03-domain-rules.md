# 03 — Domain Rules and Invariants

These are the rules the code must never violate. Each has automated tests (see `11-security-testing-deployment.md §2`). When a rule here conflicts with another document, this document wins.

## 1. Quantities and units

1. Every product has exactly one **base unit** (`product_units.is_base = true`, `factor_to_base = 1`).
2. Every other product unit has `factor_to_base > 0` expressed relative to the base unit. Chained input (1 box = 10 strips, 1 strip = 10 tablets) is flattened on save: box = 100, strip = 10, tablet = 1.
3. **All stock quantities** in `inventory_balances`, `inventory_movements`, `product_batches` and stocktake lines are stored in **base units**.
4. Document lines store both the entered unit and quantity (`unit_id`, `quantity`) and the derived `base_quantity = quantity × factor_to_base`. `base_quantity` is what moves stock.
5. Base quantities must be whole numbers unless `products.allow_fractional_quantity = true`. Quantities are `DECIMAL(18,3)`.
6. Changing a factor on a product unit that has posted documents is forbidden; create a new product unit instead and deactivate the old one.
7. Deleting the base unit, or a unit referenced by barcodes, prices or documents, is forbidden.

## 2. Batches

1. Stock always belongs to a batch. Products with `track_batches = false` get one auto-created system batch (`batch_number = 'N/A'`, `expiry_date = NULL`) so the inventory model has a single code path.
2. Batch uniqueness: `UNIQUE(tenant_id, product_id, batch_number, expiry_date)`. Same number with a different expiry is a different batch.
3. `unit_cost` is per base unit. When a batch receives stock again:

   `new_cost = (existing_qty × existing_cost + received_base_qty × received_cost) ÷ (existing_qty + received_base_qty)`

   where `existing_qty` is the current total on-hand quantity of that batch across all warehouses. If `existing_qty = 0`, `new_cost = received_cost`.
4. `mrp` is per base unit; UI accepts MRP per pack and divides by the pack's factor.
5. `expiry_date` entered as month/year is stored as the last day of that month.
6. Batch status applies to the whole batch: `SALEABLE` (default), `QUARANTINED` (not sellable, pending decision), `BLOCKED` (manual block), `RECALLED` [P3]. Status changes are audited with reason.
7. Expired is **derived**: `business_date > expiry_date`. Never stored.

## 3. Inventory movements and balances

1. `inventory_movements` is append-only. No UPDATE or DELETE after insert. Corrections are new movements of type `REVERSAL` or via return documents.
2. Every movement has `source_type` and `source_id` (the document that caused it), `movement_type`, signed `quantity` in base units (positive = in, negative = out), `unit_cost` snapshot, `warehouse_id`, nullable `location_id`, `batch_id`, `product_id`, `created_by`, `business_date`.
3. `inventory_balances.quantity` for a dimension equals `SUM(inventory_movements.quantity)` for the same dimension at all times (checked by `inventory:verify-balances`, scheduled nightly; mismatches raise alerts and are fixed by `inventory:rebuild-balances --tenant=`).
4. Balances are updated in the same database transaction as the movements that change them.
5. Negative balances are impossible: the allocation step locks balance rows and re-validates after locking.
6. `reserved_quantity` is 0 in the MVP except during P3 transfers. Held POS carts do not reserve stock.

## 4. FEFO allocation

Input: tenant, warehouse, product, required base quantity, business date, optional forced batch.

```text
BEGIN TRANSACTION
candidates = inventory_balances
             JOIN product_batches
             WHERE tenant_id = ? AND warehouse_id = ? AND product_id = ?
               AND batch.status = 'SALEABLE'
               AND (batch.expiry_date IS NULL OR batch.expiry_date >= business_date)
               AND (quantity - reserved_quantity) > 0
               AND (forced_batch_id IS NULL OR batch_id = forced_batch_id)
             ORDER BY batch.expiry_date ASC NULLS LAST, batch.id ASC, inventory_balances.id ASC
             FOR UPDATE
remaining = required
for each candidate:
    take = min(candidate.available, remaining)
    allocate(candidate, take); remaining -= take
    if remaining == 0: break
if remaining > 0: ROLLBACK and raise INSUFFICIENT_STOCK (include available total)
create sale lines / movements / balances / journals
COMMIT
```

Rules:

1. Tie-break is deterministic: expiry ascending, then batch id ascending (earlier created), then balance id.
2. A sale line may be satisfied from multiple batches; the sale stores one `sale_line_allocations` row per batch (qty, unit cost) so COGS is exact.
3. If near-expiry blocking is enabled for the tenant, candidates within the warning window are excluded unless the user holds `sales.sell_near_expiry`.
4. Manual batch selection (`sales.select_batch`) sets `forced_batch_id` on the line; the batch must still pass every eligibility filter.
5. Locking order is always by `inventory_balances.id ASC` within a transaction to avoid deadlocks; two sales touching the same batches serialize.
6. Lock wait timeout failures are retried up to 3 times with jitter by the client-facing action before surfacing `CONCURRENT_UPDATE`.

## 5. Pricing

Price resolution for a sale line (product unit `u`, batch `b`, customer `c`), first match wins:

1. Manual override entered by the user, if the user has `sales.price_override` (audited).
2. **[P2]** Customer-specific price for `u`.
3. **[P2]** Customer's price list price for `u`.
4. Product price of type matching the customer's `default_price_type` (`retail` or `wholesale`) for `u`, current as of business date.
5. Batch MRP × `u.factor_to_base` (pharmacy default: sell at MRP).
6. Product retail price for `u`.
7. If nothing resolves, the line cannot be added; the UI asks for a price (needs override permission).

Additional rules:

- Prices are stored with `effective_from`; "current" means the row with the greatest `effective_from ≤ business_date`.
- A unit price cannot exceed batch MRP × factor without `sales.price_override`.
- A unit price below cost per base unit × factor triggers a warning and needs `sales.price_override`.
- Posted documents snapshot `unit_price`, `unit_cost`, `tax_rate`, `tax_inclusive` and `discount` on each line. Nothing recomputes them later.

## 6. Discounts

1. Line discount: either percentage (0–100) or amount; stored as `discount_type`, `discount_value`, `discount_amount`.
2. Invoice discount: percentage or amount applied to the subtotal after line discounts; distributed proportionally to lines for revenue and tax computation, with the rounding remainder on the last line.
3. Cashier limit: tenant setting `max_discount_percent`; exceeding it (line or effective total) requires `sales.discount.override`.
4. Discounts reduce revenue (net method) for the revenue account; the discount total is stored for reporting (`07-accounting-rules.md §4`).

## 7. Taxes

1. Tax is resolved from the product's tax category at document time; the resolved rate and inclusive flag are snapshotted per line.
2. Exclusive: `tax = taxable_amount × rate`. Inclusive: `tax = taxable_amount − taxable_amount ÷ (1 + rate)`; the line's net revenue is the amount excluding tax.
3. Taxable amount = line amount after line discount and proportional invoice discount.
4. Taxes are computed per line and summed; never computed on the total (avoids rounding disputes).
5. Purchase tax: recoverable (`Input Tax Receivable`) or non-recoverable (added to inventory cost) per tax definition flag `is_recoverable_on_purchase`.

## 8. Money and rounding

1. Money columns: `DECIMAL(19,4)`. Per-base-unit rates (cost, price, MRP): `DECIMAL(19,6)`. Quantities: `DECIMAL(18,3)`.
2. Arithmetic in PHP uses `brick/money` or BCMath with explicit scale; never float.
3. Line totals are computed at 4 dp. Document grand total is rounded to the currency's minor unit (2 dp for PKR) using the tenant rounding rule (`none`, `nearest_0.5`, `nearest_1`). The difference is stored as `rounding_amount` and posted to `Rounding Differences`.
4. Journal lines are stored at 4 dp; balance check is exact equality of sums.

## 9. Document numbering

1. Table `document_sequences(tenant_id, branch_id NULL, document_type, fiscal_year, prefix, next_number, padding)`.
2. Numbers are allocated **at posting**, inside the posting transaction, with `SELECT ... FOR UPDATE` on the sequence row. Drafts display `DRAFT-<id>`.
3. Format: `{prefix}{fiscal_year_short}-{number}` e.g. `INV26-000123`; prefix configurable per tenant and document type. Document types: `SALE`, `SALE_RETURN`, `PURCHASE`, `PURCHASE_RETURN`, `PAYMENT_IN`, `PAYMENT_OUT`, `ADJUSTMENT`, `STOCKTAKE`, `JOURNAL`, `TRANSFER` [P3].
4. Posted document numbers are gap-free per sequence and never reused, including after void (void does not free the number).

## 10. Document state machines

| Document | States | Transitions |
| --- | --- | --- |
| Sale | `draft` → `posted` → `partially_returned` → `returned`; `posted` → `voided` | `is_held` flag only on draft. Void only if business_date = today and user has `sales.void`. |
| Sales return | `draft` → `posted` | Posted returns can be reversed by `accounting.reverse`. |
| Purchase | `draft` → `posted` → `partially_returned` → `returned`; `posted` → `reversed` | Reversal allowed only if no stock from its batches has been sold/adjusted since; otherwise use return. |
| Purchase return | `draft` → `posted` | |
| Payment | `posted` → `reversed` | Payments are created posted. Reversal creates a mirror payment. |
| Stock adjustment | `draft` → `pending_approval` → `approved` → `posted`; `pending_approval` → `rejected` | Approval needed when `|total_value| ≥ tenant threshold` or reason ∉ {COUNT_CORRECTION}. |
| Stocktake | `open` → `counting` → `review` → `approved` → `completed`; any → `cancelled` before `approved` | Completion posts an adjustment document. |
| Journal | `draft` → `posted` → `reversed` | System journals are created posted. |
| Batch | `SALEABLE` ⇄ `QUARANTINED` ⇄ `BLOCKED`; any → `RECALLED` [P3] | |

Rules common to all documents:

- Only `draft` documents are editable.
- `posted` documents are immutable; reversal creates an opposite document referencing the original (`reversal_of_id`).
- Posting checks the fiscal lock date and that the period is open.
- Posting is idempotent per `Idempotency-Key` (`05-api-architecture.md §8`).

## 11. Posting pipeline (every document type)

```text
1. Authorize (policy: action + branch/warehouse scope)
2. Validate draft (lines, references active, period open, lock date)
3. BEGIN TRANSACTION
4. Allocate document number (FOR UPDATE on sequence)
5. Stock: lock balances → validate availability → write movements → update balances
6. Snapshot costs/prices/taxes on lines
7. Build journal via the document's JournalBuilder → assert balanced → insert
8. Update counterparty balances (AR/AP) and payment allocations
9. Set status = posted, posted_by, posted_at
10. COMMIT
11. After commit: dispatch events (notifications, projections, search index)
```

Nothing in step 11 may be required for correctness.

## 12. Credit control

1. Customer available credit = `credit_limit − (AR balance + unposted held credit sales)`. `credit_limit = NULL` means credit not allowed.
2. A credit tender exceeding available credit blocks posting unless the user has `sales.credit.override` (audited).
3. Supplier credit limit is advisory: exceeding it shows a warning on the purchase and needs `purchases.credit.override` to post.

## 13. Returns

1. Sales return quantity per original line ≤ `sold_base_qty − already_returned_base_qty`.
2. Return price = original line's effective unit price after discounts; tax reversed at original rate.
3. Each return line is matched to one `sale_line_allocations` row of the original line (default: the allocated batch with the latest expiry; user may pick another allocated batch; quantity ≤ that allocation's remaining). Disposition `RESTOCK`: stock returns to that batch at that allocation's `unit_cost` (`SALE_RETURN` movement). `WRITE_OFF`: no movement; the same cost is reclassified from COGS to loss.
4. Refund tender may differ from original (e.g. cash sale refunded as AR credit note for a named customer). Walk-in returns must be refunded in cash or a non-credit method.
5. Purchase return quantity per original line ≤ `received_base_qty − already_returned_base_qty`, and ≤ current available quantity of that batch in the warehouse.
6. Purchase return value = qty × original line effective unit cost; settlement reduces AP or creates a cash receipt.

## 14. Stock adjustments

1. Lines in any product unit; converted to base. Direction per line (`IN`/`OUT`).
2. `OUT` lines require available quantity for the batch in the warehouse.
3. `IN` lines require a unit cost (defaults to batch cost) because they increase inventory value.
4. Reason codes map to accounts (`07-accounting-rules.md §4.7`).

## 15. Opening balances

1. Opening stock import creates `OPENING` movements and one journal per import: Dr Inventory / Cr Opening Balance Equity.
2. Supplier/customer opening balances create an opening journal line against Opening Balance Equity and an opening "document" (`PURCHASE`/`SALE` of type `opening`) so payments can be allocated.
3. Opening entries are dated the tenant's `opening_balance_date`; postings before that date are forbidden.

## 16. Time and dates

1. Timestamps stored UTC. `business_date` is a `DATE` computed in the tenant's timezone at creation and editable on drafts only within the current open period and not before the lock date.
2. Reports, numbering and expiry comparisons use `business_date`, never `created_at`.

## 17. Tenant isolation

1. Every tenant-owned model uses the `BelongsToTenant` trait: global scope on `tenant_id`, auto-fill on create from `TenantContext`.
2. Route-model binding resolves inside the scope, so a foreign ID returns 404, never 403 (no existence leak).
3. Raw queries and reporting queries must include `tenant_id` explicitly; a static analysis rule flags `DB::table` usage outside `app/Domain/Reporting` without `->where('tenant_id'`.
4. Unique constraints on tenant-owned tables always include `tenant_id`.

## 18. Deletion policy

- Master data (products, partners, units…) is deactivated, never hard-deleted once referenced. Unreferenced records may be deleted.
- Draft documents may be deleted by their creator or a manager.
- Posted documents, movements, journals, payments: never deleted.
- Soft deletes (`deleted_at`) are used only for master data and drafts.
