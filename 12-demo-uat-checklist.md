# 12 — Demo and UAT Checklist

All scenarios run on staging against the demo tenant created by `php artisan pharmapro:demo-tenant`. Each case records: Case ID, steps, expected result, actual result, status (pass/fail/blocked), severity (critical/high/medium/low), comment, evidence (screenshot or export). No unresolved Critical/High defect at launch unless explicitly accepted in writing by the client.

## A. Onboarding (UAT-ONB)

| ID | Steps | Expected |
| --- | --- | --- |
| ONB-01 | Platform admin creates tenant "Demo Pharmacy" | Owner receives invitation; tenant has default branch, warehouse, CoA, units, forms, roles, walk-in customer |
| ONB-02 | Owner accepts invitation, sets password | Forced password change honoured; login works |
| ONB-03 | Owner sets fiscal year (July start), currency PKR, timezone Asia/Karachi, receipt header | Settings persisted; business date correct |
| ONB-04 | Owner invites Cashier, Pharmacist, Accountant | Each sees only permitted navigation |
| ONB-05 | Import opening stock CSV with one invalid row | Preview shows the error; after fixing, import completes; inventory valuation equals Inventory account; opening journal exists |

## B. Catalog (UAT-CAT)

| ID | Steps | Expected |
| --- | --- | --- |
| CAT-01 | Create manufacturer, supplier (30-day terms, limit 500,000), retail customer (limit 20,000) | Saved with auto codes |
| CAT-02 | Create product Panadol 500mg: base tablet, strip = 10, box = 10 strips | Box factor shows 100 tablets |
| CAT-03 | Add manufacturer barcode to box, internal barcode to strip | Scanning each in POS adds the correct unit |
| CAT-04 | Set retail price per strip; set tax category 0% exempt | Price history shows entry with effective date |
| CAT-05 | Try to change strip factor after a purchase exists | Blocked with `UNIT_FACTOR_LOCKED` |

## C. Procurement (UAT-PUR)

| ID | Steps | Expected |
| --- | --- | --- |
| PUR-01 | Credit purchase: 10 boxes Panadol batch A exp +12m @ 800/box, +1 box free; MRP 100/strip | Post → batch A has 1,100 tablets, cost = 8,000 ÷ 1,100 per tablet; AP +8,000; supplier balance 8,000 |
| PUR-02 | Second purchase: 5 boxes batch B exp +24m @ 900/box | Batch B 500 tablets at 9/tablet; inventory valuation reconciles |
| PUR-03 | Re-receive batch A 1 box @ 900 | Batch A cost becomes weighted average; stock +100 |
| PUR-04 | Supplier payment 5,000 allocated to PUR-01 | AP 3,000 + 4,500 + 900; statement shows running balance |
| PUR-05 | Purchase return 1 box from batch B | Stock −100; AP reduced by 900; journals balanced |
| PUR-06 | Attempt to edit posted purchase | Not editable; reversal only |
| PUR-07 | Reverse PUR-02 after a sale from batch B | Blocked; message explains to use return |

## D. POS (UAT-POS)

| ID | Steps | Expected |
| --- | --- | --- |
| POS-01 | Cashier scans box barcode, then strip barcode twice, searches "paracetamol" (generic) and adds 3 tablets | Cart: 1 box, 2 strips, 3 tablets; prices from strip retail / MRP per precedence |
| POS-02 | Apply 5% line discount (limit 10%) | Allowed. Apply 15% → blocked for Cashier, allowed for Manager with audit |
| POS-03 | Pay cash 2,000 + JazzCash remainder; post with `Ctrl+Enter` | Receipt prints; change computed; stock reduced from batch A first (earlier expiry); COGS uses batch A cost; journal balanced; two payment rows |
| POS-04 | Sell more than total available | `INSUFFICIENT_STOCK` with available quantity shown |
| POS-05 | Quarantine batch A; sell | Allocation skips A, uses B |
| POS-06 | Set a batch expiry to yesterday; sell | Expired batch excluded; if only expired stock → error |
| POS-07 | Hold cart, start another sale, resume held cart | Held cart restored exactly; no stock reserved meanwhile |
| POS-08 | Two cashiers simultaneously sell the last 10 tablets, each 7 | Exactly one succeeds; the other gets `INSUFFICIENT_STOCK`; balance never negative |
| POS-09 | Credit sale to retail customer 18,000 then another 5,000 | Second blocked (`CREDIT_LIMIT_EXCEEDED`); Manager override allowed with audit |
| POS-10 | Walk-in credit tender | Not possible |
| POS-11 | Price override above MRP as Cashier / as Pharmacist | Blocked / allowed and audited |
| POS-12 | Receipt reprint | Works; audit entry recorded |

## E. Returns and voids (UAT-RET)

| ID | Steps | Expected |
| --- | --- | --- |
| RET-01 | Return 1 strip from POS-03 as RESTOCK, cash refund | Stock +10 to the matched batch at its allocation cost; sales returns journal; cash −refund |
| RET-02 | Return 1 strip WRITE_OFF | No stock change; loss account debited; COGS credited |
| RET-03 | Return more than sold | `RETURN_EXCEEDS_SOLD` |
| RET-04 | Unlinked return as Cashier / Manager | Blocked / allowed |
| RET-05 | Void today's sale with reason | Stock, ledger, payments restored exactly; sale shows `voided`; number not reused |
| RET-06 | Void yesterday's sale | `VOID_WINDOW_EXPIRED`; use return instead |

## F. Inventory operations (UAT-INV)

| ID | Steps | Expected |
| --- | --- | --- |
| INV-01 | Adjustment OUT 20 tablets reason EXPIRY | Below threshold: posts directly; stock −20; `Dr stock_loss / Cr inventory` |
| INV-02 | Adjustment OUT worth more than approval threshold | Goes to pending approval; approver notified; post after approval |
| INV-03 | Low stock: set reorder level above current stock | Notification once; appears in low-stock page and dashboard |
| INV-04 | Expiry report 90 days | Shows batches in correct buckets |
| INV-05 | Stocktake warehouse: count one batch short by 5 | Variance −5; approve → adjustment posted; stock and ledger updated |
| INV-06 | Movements after stocktake opened | Expected quantities unchanged; variance computed against snapshot |
| INV-07 | Run `inventory:verify-balances` | No mismatch |

## G. Accounting (UAT-ACC)

| ID | Steps | Expected |
| --- | --- | --- |
| ACC-01 | Trial balance after A–F | Debits = credits |
| ACC-02 | P&L current month | Revenue, returns, COGS, loss, gross and net profit consistent with sales report |
| ACC-03 | Balance sheet | Assets = Liabilities + Equity (incl. current earnings) |
| ACC-04 | Customer statement, supplier statement | Opening, documents, payments, closing match UI balances |
| ACC-05 | AR and AP aging | Buckets by due date correct |
| ACC-06 | Expense voucher: rent 50,000 cash | P&L net profit decreases; cash decreases |
| ACC-07 | Close last month, post a sale dated in it | `PERIOD_CLOSED` |
| ACC-08 | Set lock date; post before it | `LOCK_DATE_VIOLATION` |
| ACC-09 | Reverse a manual journal | Mirror entry; original unchanged |
| ACC-10 | Multi-cost scenario `07 §9` end-to-end | Figures match exactly |

## H. Security and audit (UAT-SEC)

| ID | Steps | Expected |
| --- | --- | --- |
| SEC-01 | Tenant B user requests tenant A sale ULID | 404 |
| SEC-02 | Cashier calls `POST /sales/{id}/void` directly | 403 |
| SEC-03 | User not assigned to Branch 2 lists Branch 2 sales | Empty / 403 per endpoint rule |
| SEC-04 | Audit viewer filters by user and action | Entries with before/after and reasons |
| SEC-05 | 11 failed logins | Throttled |
| SEC-06 | Expired token | 401 and web redirects to login preserving return URL |

## I. Operations (UAT-OPS)

| ID | Steps | Expected |
| --- | --- | --- |
| OPS-01 | Restore last backup to staging | Completed per runbook; row counts match |
| OPS-02 | Kill Horizon during an import | Import resumes/fails cleanly; no partial rows without log |
| OPS-03 | Sentry receives a forced test error from API and web | Visible with release tag |

## Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Client owner | | | |
| Client accountant | | | |
| Product owner | | | |
| Tech lead | | | |
