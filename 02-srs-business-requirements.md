# 02 — Software Requirements Specification

Functional requirements are numbered `FR-<AREA>-<nn>` and tagged `[MVP]`, `[P2]` or `[P3]`. Hard invariants (how rules are enforced) live in `03-domain-rules.md`; this document says *what* the system does.

## 1. Operating modes

- **FR-MODE-01 [MVP]** A tenant has exactly one mode: `pharmacy`, `distributor` or `warehouse`. The MVP implements `pharmacy`; the others are enabled by feature flags in later phases.
- **FR-MODE-02 [MVP]** Mode changes default settings and navigation emphasis only. The domain engine is identical across modes.

## 2. Tenant

- **FR-TEN-01 [MVP]** Tenant fields: business name, legal name, registration number, tax registration (NTN/STRN or equivalent), logo, address, phone, email, timezone, currency (ISO 4217), fiscal year start month, mode, status (`active`, `suspended`).
- **FR-TEN-02 [MVP]** Tenant settings (key/value with typed schema): invoice prefix rules, receipt header/footer text, default tax behaviour (inclusive/exclusive), near-expiry warning days, low-stock notification recipients, allow manual batch selection, max cashier discount %, adjustment approval threshold amount, rounding rule, default payment method.
- **FR-TEN-03 [MVP]** Every tenant-owned record is tenant-scoped; cross-tenant access is impossible through any endpoint.
- **FR-TEN-04 [MVP]** Platform administrators (not tenant users) create and suspend tenants. **[P2]** Self-service signup and subscription billing.

## 3. Branches, warehouses, locations

- **FR-ORG-01 [MVP]** A tenant has one or more branches; a branch has one or more warehouses. Creating a branch auto-creates a default warehouse.
- **FR-ORG-02 [MVP]** Warehouses may optionally define locations (type: zone, rack, shelf, bin; hierarchical via `parent_id`). Inventory rows carry a nullable `location_id`.
- **FR-ORG-03 [P3]** Location-aware put-away, picking and stocktake.
- **FR-ORG-04 [MVP]** Users are assigned to one or more branches; a user without assignment to a branch cannot view or act on that branch's documents and stock.

## 4. Identity and roles

- **FR-ID-01 [MVP]** Login with email + password; tokens expire and can be revoked; password reset by email; forced password change on first login after invitation.
- **FR-ID-02 [MVP]** Built-in roles: Owner, Admin, Branch Manager, Pharmacist, Cashier, Purchase Manager, Accountant, Auditor. Warehouse Manager is added in P3. Built-in roles are editable copies per tenant; custom roles supported.
- **FR-ID-03 [MVP]** Permissions are granular keys (see `06-permissions-matrix.md`); the backend enforces every one of them.
- **FR-ID-04 [MVP]** A user belongs to exactly one tenant. **[P2]** Multi-tenant users for chain operators/accountants.

## 5. Manufacturers

- **FR-MFR-01 [MVP]** Fields: name, code, address, phone, email, website, contact person, contact phone, contact email, notes, active. Manufacturer ≠ supplier.

## 6. Suppliers

- **FR-SUP-01 [MVP]** Fields: code (auto), company name, contact person, phone, WhatsApp, email, address, tax registration, payment terms (days), credit limit (nullable = unlimited), opening balance (and as-of date), notes, status.
- **FR-SUP-02 [MVP]** Supplier balance = opening balance + posted credit purchases − payments − credit notes from returns; shown on supplier page and statement.

## 7. Customers

- **FR-CUS-01 [MVP]** Types: `walk_in` (one system customer per tenant, non-editable), `retail`, `wholesale`, `institutional`.
- **FR-CUS-02 [MVP]** Fields: code (auto), name, phone, WhatsApp, email, address, tax registration, credit limit (nullable = no credit allowed), payment terms, opening balance, default price type (`retail`/`wholesale`), status.
- **FR-CUS-03 [MVP]** Credit sales exceeding the available credit are blocked unless the user has `sales.credit.override`; walk-in customers cannot buy on credit.
- **FR-CUS-04 [P2]** Customer-specific price lists.

## 8. Products

- **FR-PRD-01 [MVP]** Fields: SKU (auto or manual, unique per tenant), name, generic/salt name, brand, manufacturer, category, subcategory, form, strength, pack description, description, `is_prescription_required`, tax category, base unit, default sale unit, default purchase unit, reorder level, reorder quantity, max stock, preferred supplier, `allow_fractional_quantity` (default false), `track_batches` (default true; false only for non-pharma general items), active.
- **FR-PRD-02 [MVP]** Forms are tenant-configurable, seeded with: tablet, capsule, syrup, suspension, injection, cream, ointment, gel, drops, inhaler, sachet, device, general.
- **FR-PRD-03 [MVP]** Deactivated products are hidden from POS and purchasing but remain in history and reports.

## 9. Units and conversions

- **FR-UNT-01 [MVP]** Global unit master seeded with: piece, tablet, capsule, strip, box, carton, bottle, tube, vial, ampoule, pack, sachet, case, ml, g.
- **FR-UNT-02 [MVP]** Each product declares a base unit (factor 1) and any number of additional product units with a factor to base (e.g. strip = 10, box = 100). Factors are product-specific.
- **FR-UNT-03 [MVP]** UI accepts chained input ("1 box = 10 strips", "1 strip = 10 tablets") and stores the flattened factor to base.
- **FR-UNT-04 [MVP]** Purchases, sales, returns and adjustments can be entered in any product unit; stock is always stored in base units.

## 10. Pricing

- **FR-PRC-01 [MVP]** Price types: purchase cost (from purchase line), batch MRP, product retail price, product wholesale price. **[P2]** Customer-specific and promotional prices, price lists.
- **FR-PRC-02 [MVP]** Prices are stored per product unit with `effective_from`; the current price is the latest effective one. History is kept.
- **FR-PRC-03 [MVP]** Documents snapshot the price, cost and tax used on each line; later price changes never alter posted documents or historical profit.
- **FR-PRC-04 [MVP]** Price precedence for a POS line is defined in `03-domain-rules.md §5`.
- **FR-PRC-05 [MVP]** Selling below cost or above MRP requires `sales.price_override` and is audited with before/after values.

## 11. Taxes

- **FR-TAX-01 [MVP]** Tax definition: name, code, rate %, inclusive/exclusive, applies to (all / categories / products), effective from/to, jurisdiction label, active. No rate is hard-coded.
- **FR-TAX-02 [MVP]** Tax categories group products; a product's tax is resolved from its tax category at document time and snapshotted on the line.
- **FR-TAX-03 [MVP]** Zero-rated/exempt is modelled as a 0% tax category, not as "no tax", so reporting can distinguish them.

## 12. Barcodes

- **FR-BAR-01 [MVP]** Many barcodes per product; each barcode maps to a product unit (manufacturer box barcode → box, strip barcode → strip, internal → base). Barcodes are unique per tenant.
- **FR-BAR-02 [MVP]** Internal barcodes can be generated (EAN-13 with tenant prefix) and printed as labels.
- **FR-BAR-03 [P2]** Batch-specific barcodes (GS1 DataMatrix with lot/expiry parsing).

## 13. Batches

- **FR-BAT-01 [MVP]** Fields: product, batch number, manufacturing date (nullable), expiry date (required; month/year input stored as last day of that month), supplier (first receiving supplier), unit cost per base unit, MRP per base unit (entered per pack, converted), status, notes.
- **FR-BAT-02 [MVP]** Statuses: `SALEABLE`, `QUARANTINED`, `BLOCKED`, `RECALLED`. Expiry is derived from the date, not a status. Damage and expiry write-offs are movements, not batch statuses.
- **FR-BAT-03 [MVP]** Uniqueness: (tenant, product, batch number, expiry date). Receiving the same batch again merges into the existing batch with weighted-average cost (D-04).
- **FR-BAT-04 [MVP]** Products with `track_batches = false` use one system batch per product with no expiry; everything else is identical.

## 14. Inventory

- **FR-INV-01 [MVP]** Inventory balance dimensions: tenant, warehouse, location (nullable), product, batch. Quantity and reserved quantity in base units. Available = quantity − reserved.
- **FR-INV-02 [MVP]** Inventory is movement-driven; the balance is a projection that is rebuilt from movements on demand (admin tool) and verified by a scheduled consistency job.
- **FR-INV-03 [MVP]** Movement types: `OPENING`, `PURCHASE`, `PURCHASE_RETURN`, `SALE`, `SALE_RETURN`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `DAMAGE`, `EXPIRY`, `STOCKTAKE`, `TRANSFER_OUT` [P3], `TRANSFER_IN` [P3], `RECALL` [P3], `REVERSAL`.
- **FR-INV-04 [MVP]** Negative stock is never allowed. A sale/adjustment that would make any balance negative is rejected.
- **FR-INV-05 [MVP]** Default allocation is FEFO (`03-domain-rules.md §4`); manual batch choice requires `sales.select_batch`.
- **FR-INV-06 [MVP]** Expired stock (business date > expiry date) cannot be sold. Near-expiry (within tenant setting, default 90 days) shows a warning; selling it needs `sales.sell_near_expiry` only if the tenant enables "block near-expiry sales".
- **FR-INV-07 [MVP]** Low stock: product-level `reorder_level`, `reorder_quantity`, `max_stock`; evaluated per warehouse on total saleable base quantity; produces an in-app notification once per crossing.
- **FR-INV-08 [MVP]** Expiry alerts: buckets expired, today, 7, 30, 60, 90 days (configurable); daily digest notification.
- **FR-INV-09 [MVP]** Stock adjustments: reason code (`DAMAGE`, `EXPIRY`, `THEFT`, `COUNT_CORRECTION`, `OTHER`), notes, lines in any unit, approval required when absolute value exceeds tenant threshold; posting creates movements and journals.
- **FR-INV-10 [MVP]** Stocktake: open (freeze expected quantities for selected warehouse and optional filters) → count (any unit, multiple counters) → variance → approve → adjustment document → completed. Expected, counted and variance stored per line.
- **FR-INV-11 [P3]** Transfers, picking, dispatch, receiving, recall, location-level operations.

## 15. Procurement

- **FR-PUR-01 [MVP]** Simple flow: Purchase invoice (draft) → post (receives stock, creates AP or cash effect) → pay / credit. **[P2]** Purchase request → PO → GRN → invoice matching.
- **FR-PUR-02 [MVP]** Purchase header: supplier, branch, warehouse, supplier invoice number and date, business date, payment type (`cash`, `credit`), due date (from terms), notes, attachments.
- **FR-PUR-03 [MVP]** Purchase line: product, batch number, mfg date, expiry, unit, quantity, free quantity, unit price (per entered unit), discount (% or amount), tax (resolved, overridable with permission), MRP per pack, line net.
- **FR-PUR-04 [MVP]** Free goods: paid and free quantities both stored; effective unit cost = net line amount ÷ (paid + free) base quantity.
- **FR-PUR-05 [MVP]** Posting is atomic: batches upserted, movements created, balances updated, journal posted, supplier balance updated, document number allocated.
- **FR-PUR-06 [MVP]** Supplier payments: amount, method, reference, date; allocated to one or more purchases (auto oldest-first optional); unallocated remainder is a supplier advance.
- **FR-PUR-07 [MVP]** Purchase returns: lines reference original purchase lines and batches; quantity cannot exceed remaining returnable; settlement by AP credit or cash refund; stock leaves via `PURCHASE_RETURN` movement.
- **FR-PUR-08 [MVP]** Posted purchases cannot be edited; corrections are via return or reversal.

## 16. POS and sales

- **FR-POS-01 [MVP]** POS screen: barcode field always focused by default, search (name, generic, SKU, barcode; typeahead ≤ 150 ms server response), cart with unit, qty, price, discount, tax, line total; customer selector (default walk-in); totals; payment panel; receipt.
- **FR-POS-02 [MVP]** Scanning a barcode adds its mapped product unit with qty 1; scanning the same barcode increments. Unknown barcode shows a non-blocking error.
- **FR-POS-03 [MVP]** Batch allocation happens on the server at posting using FEFO; the cart shows the expected batch(es) and expiry as a preview. Manual batch selection per line with permission.
- **FR-POS-04 [MVP]** Discounts: per line (% or amount) and invoice-level (% or amount). Cashier discount above tenant max requires `sales.discount.override`.
- **FR-POS-05 [MVP]** Payment methods: cash, bank transfer, card, JazzCash, Easypaisa, credit (AR), custom tenant-defined. Multiple tenders per sale; change given from cash.
- **FR-POS-06 [MVP]** Hold/resume: a held cart is a draft sale with `is_held = true`; it does not reserve stock; held carts older than N days are auto-discarded.
- **FR-POS-07 [MVP]** Receipt: tenant header, receipt number, date/time, cashier, customer, lines with unit, qty, price, discount, tax, batch/expiry (configurable), totals, tenders, change, outstanding balance for credit customers, footer text. Formats: 80 mm, 58 mm, A4 invoice, PDF.
- **FR-POS-08 [MVP]** Sale records: customer, branch, warehouse, cashier, business date, lines (product, product unit, qty, base qty, batch, unit price, discount, tax, cost per base unit, COGS), tenders, status, totals, rounding.
- **FR-POS-09 [MVP]** Sales returns: select original sale → pick lines/quantities (≤ remaining) → disposition per line (`RESTOCK`, `WRITE_OFF`) → refund (cash/other method) or credit to AR → post. Unlinked returns need `sales.return.unlinked` and require product, batch, qty and price.
- **FR-POS-10 [MVP]** Void: only for sales posted on the current business date, requires `sales.void` and a reason; implemented as a full reversal (stock, journals, tenders); the original stays visible with status `voided`.
- **FR-POS-11 [P2]** Cash drawer shifts, prescription capture, doctor master, controlled-drug register.

## 17. Accounting

- **FR-ACC-01 [MVP]** Double-entry; every posted journal balances to the cent; unbalanced journals cannot be posted.
- **FR-ACC-02 [MVP]** Chart of accounts seeded per tenant (`07-accounting-rules.md §2`), with account groups, codes, types, system flags (system accounts cannot be deleted or re-typed).
- **FR-ACC-03 [MVP]** Journals are generated server-side from posted documents and reference `source_type`/`source_id`. Manual journals and expense vouchers are allowed with permission.
- **FR-ACC-04 [MVP]** Fiscal years with periods (monthly); a period can be closed; a tenant lock date prevents any posting on or before it.
- **FR-ACC-05 [MVP]** Payment methods map to accounts; payments record method, amount, reference, date, counterparty, allocations.
- **FR-ACC-06 [MVP]** Reports: general ledger, trial balance, P&L, balance sheet, AR aging, AP aging, customer statement, supplier statement. **[P2]** Cash flow statement.
- **FR-ACC-07 [MVP]** Corrections follow original → reversal → new document. Posted journals are never updated or deleted.
- **FR-ACC-08 [MVP]** Inventory valuation: specific identification by batch cost (D-04).

## 18. Imports

- **FR-IMP-01 [MVP]** CSV import pipeline: upload → validate (schema, references, duplicates) → preview with per-row errors → confirm → process (queued) → import log with per-row result and downloadable error file.
- **FR-IMP-02 [MVP]** Importers: products (with units and barcodes), suppliers, customers, opening stock (SKU, batch, expiry, qty, unit, cost per unit, MRP per pack, warehouse, location). **[P2]** price lists, chart of accounts.
- **FR-IMP-03 [MVP]** Opening stock import posts `OPENING` movements and an opening journal against Opening Balance Equity.

## 19. Reports and dashboard

- **FR-REP-01 [MVP]** Every report: date range, branch/warehouse filter where relevant, pagination, sort, CSV export (permission gated), consistent totals row.
- **FR-REP-02 [MVP]** Inventory: current stock (by product/batch/warehouse), stock ledger, batch report, expiry, low stock, valuation (at batch cost), adjustments, stocktake variance.
- **FR-REP-03 [MVP]** Sales: summary, detail, by cashier, by product, by batch, by customer, returns, discounts, tax, COGS and gross profit.
- **FR-REP-04 [MVP]** Purchases: summary, detail, by supplier, by product, returns, payables.
- **FR-REP-05 [MVP]** Financial: as in FR-ACC-06.
- **FR-REP-06 [MVP]** Dashboard widgets by permission: today's/this month's sales, cash collected by method, receivables, payables, stock value, low-stock count, expired/expiring counts, top 10 products, pending approvals.
- **FR-REP-07 [P2]** Fast/slow/dead stock analysis, financial analytics, scheduled report emails.

## 20. Communication

- **FR-COM-01 [MVP]** Event-driven notification framework with channels `in_app` and `email`; events: low stock, expiry digest, adjustment awaiting approval, stocktake awaiting approval, payment received, import finished.
- **FR-COM-02 [P2]** SMS and WhatsApp channels behind a provider interface, templates with variables, payment reminders, supplier PO messages, message logs with provider IDs and delivery status.

## 21. Audit

- **FR-AUD-01 [MVP]** Audited: login/logout/failed login, create/update/deactivate of master data, post/void/reverse/return of documents, payments, adjustments, price changes, permission and role changes, settings changes, imports.
- **FR-AUD-02 [MVP]** Each entry stores actor, tenant, timestamp, entity type/id, action, before/after (for updates), reason (where required), IP and user agent.
- **FR-AUD-03 [MVP]** Audit viewer with filters (user, entity, action, date) for `audit.view`.

## 22. Non-functional requirements

- **NFR-01** POS search p95 < 300 ms server time on 50k products; sale posting p95 < 800 ms.
- **NFR-02** Concurrency-safe stock allocation; exactly one of N concurrent conflicting posts succeeds.
- **NFR-03** All list endpoints paginated, max 200 per page.
- **NFR-04** Daily automated backups with monthly restore verification.
- **NFR-05** 99.5% monthly availability target for the API in production.
- **NFR-06** All timestamps stored UTC; business dates in tenant timezone.
- **NFR-07** WCAG 2.1 AA for the web application's core flows.
