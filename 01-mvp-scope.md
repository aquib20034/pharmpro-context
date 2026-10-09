# 01 — MVP Scope

The original idea listed almost every module as "MVP". This document draws the actual line. Anything not listed under "In scope" is out of the MVP, even if it appears elsewhere in the specification with a `[P2]` or `[P3]` tag.

## 1. MVP goal

A pharmacy (single shop or small chain) can run its daily business on PharmaPro: receive stock from suppliers on credit, sell at the counter with barcode scanning and correct batch/expiry handling, extend and collect customer credit, pay suppliers, process returns, and see accurate stock, expiry, sales, profit and receivable/payable figures, with every action auditable.

Success criteria for the MVP release:

- A tenant can be onboarded and operating with imported opening stock in under one working day.
- POS: scanning a barcode to a printed receipt takes under 15 seconds for a 3-item sale on a normal shop PC.
- Two concurrent cashiers can never oversell the last units of a batch.
- Trial balance balances after any sequence of UAT scenarios in `12-demo-uat-checklist.md`.
- Tenant isolation, FEFO, unit conversion, duplicate posting and balanced journals are covered by automated tests that run in CI.

## 2. Personas (MVP)

| Persona | Primary needs |
| --- | --- |
| Owner | Dashboard, profit, receivables/payables, approvals, settings, user management |
| Pharmacist / Branch manager | Stock, expiry, purchasing, adjustments, returns, price changes |
| Cashier | POS only: scan, sell, take payment, print receipt, hold/resume, simple returns |
| Accountant | Journals, ledger, statements, trial balance, P&L, balance sheet, payments |
| Auditor (read-only) | Reports and audit log |

## 3. In scope

### Platform
- Tenant with settings (identity, currency, timezone, fiscal year, invoice settings, tax settings, mode = Pharmacy)
- Tenant onboarding by platform admin (self-service signup is P2)
- Users belonging to exactly one tenant; invitation by email; password reset
- Built-in roles + custom roles; granular permissions; branch/warehouse scoping of users
- Branches and warehouses (locations table exists, optional `location_id`, no rack/bin workflows)
- Document numbering per tenant/branch/document type/fiscal year
- Audit log with viewer

### Catalog and partners
- Manufacturers, categories (two levels), product forms, global units
- Products with generic name, strength, form, manufacturer, category, tax category, reorder settings, Rx flag, active flag
- Product units with factor to base, default sale unit, default purchase unit
- Multiple barcodes per product, each mapped to a product unit
- Prices: product-level retail and wholesale per unit with effective dates; batch MRP; price precedence rules
- Taxes: configurable, inclusive/exclusive, effective dates, product/category applicability
- Suppliers with payment terms, credit limit, opening balance
- Customers (walk-in, retail, wholesale, institutional) with credit limit, payment terms, opening balance

### Inventory
- Batches with number, mfg/expiry, supplier, cost per base unit, MRP, status
- Inventory balances (projection) and append-only movements in base units
- FEFO allocation with deterministic tie-break; manual batch selection with permission
- Pessimistic locking so concurrent sales cannot oversell
- Negative stock blocked
- Expired stock not sellable; near-expiry warning (configurable days) with override permission
- Stock adjustments with reason codes, approval threshold, accounting posting
- Low-stock and expiry views and in-app notifications
- Opening stock via CSV import (validate → preview → confirm → log)
- Stocktake: open → count → variance → approve → adjustment

### Procurement (simple flow)
- Purchase invoice that receives stock on posting: lines with batch, mfg/expiry, unit, qty, free qty, price, discount, tax
- Cash or credit purchase; AP posting; supplier payments with allocation (full/partial/advance)
- Purchase returns linked to original purchase, batch-aware, with AP/cash effect
- Supplier statement

### Sales and POS
- POS: barcode scan, search by name/generic/SKU/barcode, unit selection, qty, price (with precedence), line and invoice discounts, tax, customer, multiple payment methods per sale (split tender), change calculation, receipt (80mm/58mm browser print and PDF), hold/resume
- Walk-in and named customers; customer credit with limit enforcement; customer payments with allocation
- Atomic posting: stock, COGS, journals and payments commit together
- Sales returns linked to original sale (unlinked with permission), disposition restock/write-off, refund by cash or credit note to AR
- Void of same-business-day posted sale with permission and reason (implemented as full reversal)
- Price override and discount beyond limit require permission and are audited

### Accounting
- Default chart of accounts seeded per tenant, editable
- Journal engine with balanced-entry enforcement; all postings generated server-side
- Fiscal years/periods with lock date
- Payment methods mapped to accounts (cash, bank, card, JazzCash, Easypaisa, custom)
- Manual journal entries and simple expense vouchers (so P&L is meaningful)
- General ledger, trial balance, P&L, balance sheet (simple), AR/AP aging, customer and supplier statements
- Opening balances via Opening Balance Equity

### Reports and dashboard
- Inventory: current stock, stock ledger, batch report, expiry, low stock, valuation, adjustments
- Sales: summary, detail, by cashier, by product, by batch, returns, discounts, tax, COGS and gross profit
- Purchases: summary, detail, by supplier, returns, payables
- Financial: as listed under Accounting
- Role-based dashboard: today's sales, cash collected, receivables, payables, stock value, low-stock count, expiring/expired counts, top products, pending approvals
- CSV export of every report, permission gated

### Non-functional
- Tenant isolation tests, concurrency tests, posting idempotency
- Sentry, Horizon, backups with tested restore, staging + production environments
- OpenAPI spec and generated TS client

## 4. Out of scope for MVP (and where it goes)

| Item | Phase | Reason |
| --- | --- | --- |
| Purchase request → PO → GRN workflow | P2 | Pharmacies buy against supplier invoices; the simple flow covers them |
| Customer-specific price lists, promotional prices | P2 (Distributor) | Needs price list engine |
| SMS / WhatsApp messaging | P2 | Provider contracts and templates; MVP uses in-app + email |
| Landed cost allocation | P2 | Distributor need |
| Consignment / borrowed stock ownership | P2 | Needs explicit ownership model and separate accounting |
| Warehouse locations workflows, transfers, picking, dispatch, recall | P3 | Warehouse mode |
| Quarantine disposition for returns | P3 | Requires locations |
| Stock reservation (`reserved_quantity`) | P3 | Column exists; only transfers use it |
| Mobile app | P3 | |
| Desktop / offline POS, local printer drivers | P3 | Online POS first |
| Self-service tenant signup and billing | P2 | Platform admin onboards tenants in MVP |
| Multi-currency | Not planned | Tenant has one currency |
| Controlled-substance register, prescription capture, doctor master | P2 | Product `is_prescription_required` flag exists for display |
| Loyalty points, gift cards | Not planned | |
| Cash drawer shift open/close with declared cash | P2 | Useful but not required for correctness; sales by cashier report covers MVP |
| Meilisearch/Elasticsearch | Later if needed | MySQL FULLTEXT + indexed prefix search first |

## 5. MVP user journeys (must all work end-to-end)

1. **Onboard**: platform admin creates tenant → owner logs in → sets branch, warehouse, fiscal year, payment methods → invites staff → imports opening stock → opening journals exist.
2. **Buy**: pharmacist enters supplier invoice with 3 lines including a free-goods line → posts → batches and balances exist in base units → AP increased → partial supplier payment → supplier statement correct.
3. **Sell (cash)**: cashier scans strip barcode → qty 2 → sells 1 tablet of another product by search → discount within limit → cash + JazzCash split → receipt → stock reduced from earliest-expiry batch → COGS from that batch's cost → journals balanced.
4. **Sell (credit)**: named customer within limit → credit sale → AR increased → later payment allocated → aging correct → attempt beyond limit blocked.
5. **Return**: customer returns 1 strip from yesterday's sale → restock → cash refund → stock and ledger reversed exactly.
6. **Void**: manager voids today's wrong sale with reason → full reversal → audit entry.
7. **Adjust**: expired batch written off with reason → stock zero, loss posted.
8. **Count**: stocktake on one warehouse → variances → approve → adjustments posted.
9. **Report**: owner views dashboard, P&L for the month, trial balance, expiry in 90 days, low stock.
10. **Isolation**: a user of tenant B cannot see, guess or mutate any record above.
