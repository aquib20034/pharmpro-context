# 10 — Sprint Plan (MVP-first)

Two-week sprints. Assumes one team of 2 backend, 1–2 frontend, shared QA. The original plan reached POS in sprint 10 and accounting in sprint 13; this plan makes the pharmacy sellable by sprint 8 and complete by sprint 10, with two sprints of hardening and UAT.

Every sprint ends with: working demo on staging, green CI, updated docs, reviewed PRs, backlog groomed for the next sprint.

## MVP sprints

| Sprint | Theme | Tickets | Demo at sprint end |
| --- | --- | --- | --- |
| 1 | Foundation | PP-FOUND-001…006 | Login page, API conventions on a sample resource, CI green, Docker + Laragon dev paths |
| 2 | Platform | PP-PLAT-001…008 | Platform admin creates tenant; owner invites users; roles edited; branches/warehouses; settings; numbering; audit viewer |
| 3 | Catalog & partners | PP-CAT-001…008 | Products with box/strip/tablet units, barcodes, prices, taxes; suppliers; customers; POS search endpoint |
| 4 | Inventory core | PP-INV-001…003, PP-IMP-001 | Batches, movement ledger, balances, FEFO preview, concurrency test passing, import wizard shell |
| 5 | Accounting core + inventory ops | PP-ACC-001…002, PP-INV-004…006 | Chart of accounts, manual journals, payments engine, opening stock import with journal, adjustments with approval, low-stock/expiry pages |
| 6 | Procurement | PP-PUR-001…005, PP-CAT-006 opening balances | Supplier invoice with free goods posts stock + AP; supplier payment; purchase return; supplier statement |
| 7 | POS part 1 | PP-SALE-001, PP-SALE-002 | Cashier scans, searches, builds cart with correct prices/discounts/tax, holds and resumes |
| 8 | POS part 2 | PP-SALE-003, PP-SALE-004, PP-SALE-005 | Full cash and credit sales post atomically, receipts print, customer receipts allocate; two-cashier concurrency demo |
| 9 | Returns, void, statements, reports | PP-SALE-006…008, PP-ACC-003…005, PP-REP-001 | Returns and voids reverse exactly; trial balance, statements, aging; sales/purchase reports |
| 10 | Stocktake, dashboard, imports, reports | PP-INV-007, PP-REP-002…003, PP-IMP-002, PP-ACC-004 | Stocktake end-to-end; dashboard; inventory reports; P&L and balance sheet; product/partner imports |
| 11 | Hardening | PP-OPS-001…005 | Staging with large dataset, performance budgets met, backups restored, monitoring live |
| 12 | UAT & launch | PP-OPS-006 | UAT checklist executed and signed; first tenant live |

Buffer: sprint 12 doubles as a buffer; if sprints 1–10 slip by more than one sprint total, cut from MVP in this order: product/partner CSV importers (manual entry instead), dashboard charts (numbers only), A4 invoice format, stocktake multi-counter support.

## Milestones

| Milestone | After sprint | Exit criteria |
| --- | --- | --- |
| M1 Platform ready | 2 | Tenant isolation suite and permission harness in CI |
| M2 Stock engine ready | 4 | FEFO + concurrency tests green; balances reconcile to movements |
| M3 Buy-side complete | 6 | Purchase → stock → AP → payment → return → statement demo |
| M4 Sell-side complete | 8 | Sale → stock → COGS → journal → receipt; credit cycle; concurrency demo |
| M5 Books close | 9 | Trial balance balances across all UAT scenarios; returns/voids exact |
| M6 MVP feature complete | 10 | Every item in `01-mvp-scope.md §3` demoable |
| M7 Production ready | 11 | `11-security-testing-deployment.md §9` checklist complete |
| M8 Launch | 12 | UAT sign-off; first tenant live |

## Post-MVP sequence (one line each; details in `13-post-mvp-roadmap.md`)

| Sprints | Theme |
| --- | --- |
| 13–14 | Communication: templates, SMS, WhatsApp, payment reminders, message logs |
| 15–17 | Distributor: price lists, customer pricing, PR → PO → GRN, landed cost, schemes, cash drawer shifts |
| 18–20 | Warehouse: locations workflows, transfers, picking, dispatch, receiving, recall, location stocktake |
| 21–23 | Mobile (Expo): auth, dashboard, lookup, scan, inventory, approvals, stocktake |
| 24–26 | Desktop/offline: Tauri, offline queue, sync, printer integration |

## Working agreements

- Definition of Done from `00-master-plan.md §8` applies to every ticket.
- No ticket starts without its dependencies merged.
- Any change to `03-domain-rules.md` or `07-accounting-rules.md` requires a decision-log entry and reviewer sign-off from the product owner.
- Demo data: a seeder (`php artisan pharmapro:demo-tenant`) builds the UAT pharmacy with the multi-cost scenario so demos are reproducible.
