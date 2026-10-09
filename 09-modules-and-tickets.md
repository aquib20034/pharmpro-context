# 09 — Modules and Tickets (MVP)

Ticket ID format `PP-<MODULE>-<nnn>`. Every ticket, when picked up, is expanded into: Objective, Scope, Dependencies, DB changes, API changes, UI changes, Permissions, Audit, Acceptance criteria, Tests. The entries below give the fixed parts; implementation details come from the referenced documents. Post-MVP tickets are listed in `13-post-mvp-roadmap.md`.

Sprint assignment is in `10-sprint-plan.md`. Within a sprint, tickets are ordered by dependency.

---

## Phase 0 — Foundation (`PP-FOUND`)

### PP-FOUND-001 Monorepo bootstrap
Scope: pnpm workspace, `services/api` (Laravel), `apps/web` (Next.js), `packages/types`, `packages/api-client` placeholder, root `Makefile` (`make setup|dev|lint|typecheck|test`), `.editorconfig`, `.env.example` for each app, README per app.
Acceptance: fresh clone + `make setup` + `make dev` serves API at `:8000` and web at `:3000` on Windows (Laragon) and Linux (Docker). Docs list every env var.

### PP-FOUND-002 Local environments
Scope: `infrastructure/docker/` compose with php-fpm, nginx, mysql 8, redis, mailpit, minio; Laragon instructions (MySQL 8, Redis via Memurai or Docker only for Redis); `make` targets detect which to use.
Acceptance: both paths run migrations and seeders; Horizon runs; mail visible in Mailpit.

### PP-FOUND-003 CI pipeline
Scope: GitHub Actions: PHP (Pint check, Larastan level 6, Pest with MySQL service), web (ESLint, tsc, Vitest, `next build`), OpenAPI freshness check, generated client freshness check. Cache dependencies. Required on PRs.
Acceptance: pipeline green on bootstrap; a deliberately failing test blocks merge.

### PP-FOUND-004 API standards
Depends: 001. Scope: `/api/v1` routing, JSON-only middleware, response macros (`data/meta/links`), `DomainException` hierarchy with codes (`05 §4`), handler mapping, pagination/filter/sort base (`05 §5`), `Idempotency-Key` middleware + table, request ID header, OpenAPI generation, `packages/api-client` generation script.
Acceptance: sample resource demonstrates list/show/create/patch with all conventions; OpenAPI served at `/api/documentation` in non-production; client regenerates and type-checks.
Tests: error format, pagination limits, unknown filter → 422, idempotent replay returns stored response, mismatched replay → 422.

### PP-FOUND-005 Shared support primitives
Scope: `Money` (brick/money wrapper with tenant currency), `Quantity` (BCMath, 3 dp), `BelongsToTenant` trait + global scope + `TenantContext`, `HasUlid`, `BusinessDate` resolver, `PostDocumentAction` base with retry on 1205/1213, `JournalBuilder` skeleton (balanced assertion), state machine helper.
Tests: money arithmetic/rounding; quantity conversion; tenant scope auto-fill; retry wrapper.

### PP-FOUND-006 Frontend shell
Scope: Next.js app with auth routes, app layout (sidebar, header, breadcrumbs), `SessionProvider`, `usePermission`, API client wiring with TanStack Query, `DataTable`, form primitives, dialog, toast, feedback components (Loading, Empty, Error, PermissionDenied, NotFound), theme tokens, i18n setup, Playwright smoke test.
Acceptance: login → dashboard placeholder → permission-gated nav; all feedback states demoable on a `/dev/components` page (non-production).

---

## Phase 1 — Platform (`PP-PLAT`)

### PP-PLAT-001 Tenants and platform admin
Scope: `tenants`, `tenant_settings` (typed settings enum with defaults), `platform_admins` guard, `/platform/tenants` CRUD + suspend, tenant creation seeds: default branch + warehouse, units, forms, chart of accounts, payment methods, roles, walk-in customer, document sequences, fiscal year.
Acceptance: creating a tenant yields a ready-to-use tenant with an Owner invitation sent.
Tests: tenant isolation suite skeleton (two tenants, every tenant-owned model) — becomes the table-driven test every later ticket adds rows to.

### PP-PLAT-002 Authentication
Scope: Sanctum tokens, login/logout/me, forgot/reset, change password, `must_change_password`, invitation accept, token expiry, rate limits, login audit.
Tests: login success/failure, lockout after 10 attempts, expired token 401, inactive user 403, invitation flow.
Status: **partial** — login/logout/me, forgot/reset, change password, accept-invitation, login audit (`auth` activity), lockout after 10 (D-35). Remaining: expired-token 401 coverage polish.

### PP-PLAT-003 Users, roles, permissions
Scope: spatie permission with teams, seeded permission keys and default roles (`06`), `/users`, `/roles`, `/permissions`, branch assignment, `EnsureBranchAccess` middleware, Owner immutability.
Acceptance: Admin edits a role; Cashier loses `sales.void` immediately (permission cache per tenant invalidated).
Tests: table-driven 403/2xx test harness for every endpoint; branch scope denial.
Status: **partial** — teams + catalog seed, `/users` CRUD + invite/accept, `/roles`, `/permissions`, branch assignment, `EnsureBranchAccess`, Owner immutability. Remaining: table-driven 403 harness for every endpoint.

### PP-PLAT-004 Branches, warehouses, locations
Scope: CRUD with codes, default flags, `warehouse_locations` hierarchy (no stock workflows), deactivation rules (cannot deactivate default or warehouse with stock).
Tests: default warehouse auto-created; deactivation blocked with stock.
Status: **done (API)** — branches + warehouses + `warehouse_locations` CRUD, auto default warehouse on branch create, deactivation guards.

### PP-PLAT-005 Tenant settings UI and document numbering
Scope: settings pages (profile, regional, POS, inventory thresholds, approval threshold), `document_sequences` management, `NumberAllocator` with `FOR UPDATE`.
Tests: 50 concurrent allocations yield 50 unique sequential numbers.

### PP-PLAT-006 Fiscal years, periods, lock date
Scope: `fiscal_years`, `fiscal_periods` auto-generated monthly, close/reopen, lock date, `PostingGuard` used by `PostDocumentAction`.
Tests: posting into closed period → 423 `PERIOD_CLOSED`; on/before lock date → `LOCK_DATE_VIOLATION`.

### PP-PLAT-007 Audit log
Scope: spatie activitylog with `tenant_id`, `reason`; `Auditable` trait on master data; explicit `AuditLogger::record()` for document actions; `/audit-log` with filters; viewer UI.
Tests: update of product logs before/after; void logs reason; viewer requires `audit.view`.
Status: **partial** — `Activity` model + `tenant_id`/`reason`, `Auditable` trait, `AuditLogger`, `GET /audit-log` with filters + `audit.view`. Remaining: viewer UI; product before/after once catalog lands.

### PP-PLAT-008 Attachments
Scope: S3-compatible storage (MinIO locally), signed uploads, MIME/size validation, polymorphic attachments on purchases/adjustments/journals, temporary download URLs.

---

## Phase 2 — Catalog and partners (`PP-CAT`)

### PP-CAT-001 Manufacturers, categories, forms, units
Scope: CRUD + UI for each; two-level categories; deactivation rules.

### PP-CAT-002 Tax categories and taxes
Scope: CRUD, effective dating, `TaxResolver::forProduct(product, date)` returning rate/inclusive/recoverable; `TaxCalculator` (`03 §7`).
Tests: inclusive/exclusive math at 4 dp; effective date switching; 0% category distinguishes exempt.

### PP-CAT-003 Products and product units
Scope: product CRUD with all fields (`02 §8`), product units with flattened factors, base unit invariants, default sale/purchase unit, `UnitConverter`, factor lock once documents exist, FULLTEXT index, product list/detail UI with units editor accepting chained input.
Tests: box=10 strips, strip=10 tablets → box factor 100; purchase 2 boxes → 200 base; sale 3 strips → 30 base; changing locked factor → `UNIT_FACTOR_LOCKED`; two base units impossible.

### PP-CAT-004 Barcodes
Scope: multiple barcodes per product mapped to product units, uniqueness per tenant, EAN-13 internal generation with check digit, label print view, `/products/barcode/{code}`.
Tests: duplicate → `DUPLICATE_BARCODE`; lookup returns unit and current price.

### PP-CAT-005 Prices
Scope: `product_prices` with effective dating, `PriceResolver` (`03 §5`, MVP steps 1, 4, 5, 6, 7), price history UI, bulk price update by CSV (uses import pipeline when available; otherwise P2).
Tests: resolution precedence matrix; historical document unaffected by new price.

### PP-CAT-006 Suppliers
Scope: CRUD, opening balance with as-of date (creates opening document + journal once accounting core exists — ticket gated on PP-ACC-001), balance read model, UI.

### PP-CAT-007 Customers
Scope: types, walk-in system customer per tenant, credit fields, opening balance, `CreditChecker`, UI with available credit.
Tests: walk-in cannot be edited/deactivated; available credit math.

### PP-CAT-008 POS product search endpoint
Scope: `/products/search` combining FULLTEXT + prefix + barcode match, returns units, prices, saleable qty and nearest expiry for a warehouse; indexed; p95 budget.
Tests: finds by generic name; excludes inactive; performance test on seeded 50k products in CI nightly.

---

## Phase 3 — Inventory core (`PP-INV`)

### PP-INV-001 Batches
Scope: `product_batches`, uniqueness, MRP per pack → per base, system batch for `track_batches=false`, status transitions with reason + audit, batch list/detail UI.
Tests: uniqueness; status change audited; expired derived correctly at boundaries.

### PP-INV-002 Movements and balances
Scope: `inventory_movements` append-only, `inventory_balances` with generated `location_key`, `StockLedger::record()` that writes movement + updates balance in one transaction with version check, `inventory:verify-balances`, `inventory:rebuild-balances`, ledger/balances endpoints + UI.
Tests: balance equals Σ movements after random operation sequences (property test); rebuild reproduces balances; app DB user cannot UPDATE movements (integration test against grants in CI).

### PP-INV-003 FEFO allocator and concurrency
Scope: `FefoAllocator` per `03 §4`, `/inventory/allocation-preview`, forced batch validation, near-expiry blocking setting, deterministic ordering, lock ordering.
Tests: A expires before B → A first; partial from A then B; expired excluded; quarantined excluded; forced ineligible batch → `BATCH_NOT_ELIGIBLE`; **concurrency test**: 10 parallel allocations of the last 10 units each requesting 3 → exactly 3 succeed, balances never negative (run with real MySQL in CI).

### PP-INV-004 Opening stock import
Depends: PP-IMP-001, PP-ACC-001. Scope: opening stock importer (validate SKU/unit/warehouse/location, batch upsert, `OPENING` movements, opening journal), template download.
Tests: invalid rows reported with row numbers; successful import reconciles inventory account vs stock value.

### PP-INV-005 Stock adjustments
Depends: PP-ACC-001. Scope: documents + lines, reason codes, approval threshold, state machine, posting (movements + journal `07 §4.7`), UI editor and approval queue, in-app notification to approvers.
Tests: OUT beyond available → `INSUFFICIENT_STOCK`; threshold routes to approval; journal per reason correct.

### PP-INV-006 Low stock and expiry
Scope: low-stock evaluation per warehouse on `StockMoved` (debounced), expiry buckets endpoint, daily digest job, in-app + email notifications, UI pages with filters, dashboard counts.
Tests: crossing reorder level notifies once; digest content correct at bucket boundaries.

### PP-INV-007 Stocktake
Depends: PP-INV-005. Scope: state machine (`03 §10`), expected snapshot at open, count entry in any unit (multiple counters), variance review, approval → adjustment document posted, UI (open wizard, counting grid, review).
Tests: stock movements after open do not change expected; variance math; completion posts correct adjustment; cancel before approval leaves no movements.

---

## Phase 4 — Accounting core (`PP-ACC`)

### PP-ACC-001 Chart of accounts and journal engine
Scope: `account_groups`, `accounts` with `system_key`, default CoA seeder (`07 §2`), `JournalBuilder` (balanced assertion, period/lock guard, counterparty lines), `journal_entries/lines`, manual journal + expense voucher endpoints and UI, reversal action.
Tests: unbalanced → `UNBALANCED_JOURNAL`; system account cannot be deleted; reversal mirrors exactly; period guard.

### PP-ACC-002 Payment methods and payments
Scope: `payment_methods` CRUD mapped to accounts, `payments` + `payment_allocations`, `RecordPaymentAction` (direction in/out, allocation incl. auto oldest-first, advances), reversal, open-documents endpoints, payments UI (customer receipt, supplier payment, allocation editor).
Tests: partial allocation leaves advance; over-allocation rejected; reversal restores document balances; journals per `07 §4.3/4.8`.

### PP-ACC-003 Ledger, trial balance, statements
Scope: general ledger endpoint, trial balance, customer/supplier statements with running balance, AR/AP aging with configurable buckets, UI with export.
Tests: trial balance balances after fixture scenarios; aging buckets; statement opening balance equals prior closing.

### PP-ACC-004 P&L and balance sheet
Scope: definitions in `07 §6`, date range, comparison period optional, UI.
Tests: P&L equals revenue − COGS − expenses from fixtures; balance sheet balances with computed current earnings.

### PP-ACC-005 Reconciliation jobs
Scope: nightly jobs from `07 §7`, alerts to Owner/Admin + Sentry on mismatch, `/platform/health` includes last run status.

---

## Phase 5 — Procurement (`PP-PUR`)

### PP-PUR-001 Purchase invoice drafts
Scope: `purchases`, `purchase_lines`, draft CRUD, line calculations (unit → base, free qty, discount, tax, effective unit cost), supplier invoice fields, due date from terms, attachments, editor UI with keyboard grid, product/batch typeahead (existing batch autocompletion by number).
Tests: effective cost with free goods; tax recoverable vs non-recoverable; totals at 4 dp.

### PP-PUR-002 Purchase posting
Depends: PP-INV-002, PP-ACC-001, PP-PLAT-005. Scope: `PostPurchaseAction`: number allocation, batch upsert with weighted cost (`03 §2.3`), MRP update, `PURCHASE` movements, balances, journal `07 §4.2`, AP or cash payment, supplier credit warning/override, idempotency, events.
Tests: integration Purchase → stock → AP → journal; re-receipt averages cost; cash purchase creates payment; duplicate post (same key) returns same result; different key on posted doc → `DOCUMENT_NOT_DRAFT`.

### PP-PUR-003 Purchase reversal
Scope: reverse posted purchase only if none of its received quantities have moved since; mirror movements and journal; status `reversed`.
Tests: blocked after a sale from the batch; allowed otherwise.

### PP-PUR-004 Purchase returns
Scope: returnable-lines endpoint, draft + post, settlement AP credit or cash refund, movements, journal `07 §4.4`, UI.
Tests: exceeds received → `RETURN_EXCEEDS_RECEIVED`; exceeds available → `INSUFFICIENT_STOCK`; variance line when batch cost changed.

### PP-PUR-005 Procurement reports
Scope: purchase summary/detail, by supplier, by product, returns, payables, supplier statement link; CSV.

---

## Phase 6 — POS and sales (`PP-SALE`)

### PP-SALE-001 Sale drafts and cart engine (API)
Scope: `sales`, `sale_lines`, `sale_tenders`, draft CRUD, server-side line computation (`PriceResolver`, discounts incl. invoice distribution, `TaxCalculator`, rounding), hold/resume (`is_held`, label, auto-discard job), permissions for overrides with audit, allocation preview per line.
Tests: price precedence; discount distribution remainder on last line; cashier discount limit; price above MRP without permission → `PRICE_ABOVE_MRP`.

### PP-SALE-002 POS screen
Depends: PP-CAT-008, PP-SALE-001. Scope: full POS UI per `08 §4` (scan, search, cart, customer, totals, hold/resume, shortcuts, warnings), Playwright flows.
Acceptance: 3-item sale by scanning in < 15 s without mouse.

### PP-SALE-003 Payments and atomic posting
Depends: PP-INV-003, PP-ACC-002. Scope: payment modal, split tenders, change, credit tender with `CreditChecker`; `PostSaleAction`: number, FEFO allocation with locks, `sale_line_allocations`, `SALE` movements, COGS, journal `07 §4.5`, tender payments, AR, idempotency, events; `SalePosted` listeners (low stock, dashboard).
Tests: integration Sale → stock → COGS → journal → payments; split tender math; credit beyond limit blocked/overridden; concurrency test (two cashiers, last units); duplicate post idempotent.

### PP-SALE-004 Receipts
Scope: receipt data endpoint, 80 mm / 58 mm / A4 print views, PDF via API (dompdf or browserless), tenant header/footer, batch/expiry toggle, auto-print setting, reprint from sales list (audited).

### PP-SALE-005 Customer credit and receipts
Depends: PP-ACC-002. Scope: customer page with balance, open invoices, record receipt with allocation, statement; POS "pay outstanding" shortcut.
Tests: allocation reduces aging; advance handling.

### PP-SALE-006 Sales returns
Scope: returnable-lines (with allocations), draft + post, disposition per line, refund method or AR credit, movements, journal `07 §4.6`, UI from sale or from POS `F8`, unlinked return with permission.
Tests: exceeds sold → `RETURN_EXCEEDS_SOLD`; restock to specific allocation at its cost; write-off reclassifies; walk-in cannot receive AR credit.

### PP-SALE-007 Void
Scope: same-business-day check, reason, full reversal (stock at allocation cost, journal mirror, tender payments reversed), status `voided`, audit, UI confirmation.
Tests: next-day void → `VOID_WINDOW_EXPIRED`; reversal leaves balances and ledger as before the sale; number not reused.

### PP-SALE-008 Sales reports
Scope: summary, detail, by cashier, by product, by batch, by customer, returns, discounts, tax, COGS/gross profit (from allocations); CSV.
Tests: gross profit equals Σ(revenue − COGS) from fixtures across multi-cost batches.

---

## Phase 7 — Reports and dashboard (`PP-REP`)

### PP-REP-001 Report framework
Scope: `ReportDefinition` abstraction (filters schema, columns, query, totals), `/reports/{key}` JSON/CSV, queued large export with `/exports/{id}`, generic report page in web driven by definition metadata.

### PP-REP-002 Inventory reports
Scope: current stock, stock ledger, batch report, expiry, low stock, valuation at batch cost, adjustments, stocktake variance.
Tests: valuation equals inventory account (fixture).

### PP-REP-003 Dashboard
Scope: `/dashboard` aggregating permitted widgets (`02 §19 FR-REP-06`), cached 60 s per tenant/branch, invalidated by posting events, UI with charts.

---

## Phase 8 — Imports (`PP-IMP`)

### PP-IMP-001 Import pipeline
Scope: `imports`, `import_rows`, upload → validate (queued) → preview → confirm → process (queued, chunked, idempotent per row) → log; error CSV; UI wizard; `Importer` contract.
Tests: validation errors per row; partial success semantics documented (all-or-nothing per import by default).

### PP-IMP-002 Importers
Scope: products (+units, barcodes), suppliers, customers (opening stock is PP-INV-004); templates download.

---

## Phase 9 — Hardening and launch (`PP-OPS`)

### PP-OPS-001 Security hardening
Scope: rate limits, CORS, headers, Sanctum token pruning, secrets audit, dependency audit in CI, tenant isolation suite complete, raw-query lint rule.

### PP-OPS-002 Performance
Scope: seed large dataset in staging, EXPLAIN review of POS search, posting, ledger, reports; indexes; N+1 detection (`preventLazyLoading` in non-prod); query budget assertions in tests for POS endpoints.

### PP-OPS-003 Backups and restore drill
Scope: automated MySQL dumps + object storage sync, retention, documented restore runbook, restore test executed and recorded.

### PP-OPS-004 Deployment
Scope: Dockerfile (php-fpm + nginx), compose for VPS, GitHub Actions deploy to staging on `main` and production on tag, migrations with maintenance window strategy, Horizon + scheduler supervisors, Vercel project for web, env documentation, release checklist (`11 §9`).

### PP-OPS-005 Observability
Scope: Sentry API + web with release tags, Horizon alerts, uptime checks, structured logs with request id and tenant id, `/platform/health`.
Note (D-34): request logging, `Pii` helper, `ErrorReporter`, and Sentry SDK wiring are pulled into foundation/early platform (`16-engineering-standards.md`); this ticket completes dashboards, uptime, and Horizon alert routing.

### PP-OPS-006 UAT and launch
Scope: execute `12-demo-uat-checklist.md`, triage, fixes, sign-off record, production data onboarding for first tenant, training material (short videos/screens).

---

## Ticket template

```markdown
# PP-XXX-nnn Title

Objective:
Scope (in / out):
Dependencies:
Database changes:
API changes (+ OpenAPI):
UI changes:
Permissions:
Audit:
Acceptance criteria:
- [ ] ...
Tests:
- [ ] unit ...
- [ ] feature ...
- [ ] isolation row added
- [ ] permission row added
Docs to update:
```
