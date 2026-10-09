# 05 — API Architecture

## 1. Principles

- One Laravel API serves web, POS, mobile, desktop and future integrations. Business rules never live only in a client.
- Base path `/api/v1`. Breaking changes go to `/api/v2`; additive changes do not bump the version.
- Resources are addressed by `ulid`, not by auto-increment id.
- JSON only; `Accept: application/json` is enforced by middleware.
- OpenAPI 3.1 spec is generated from attributes (e.g. `scramble` or `l5-swagger`) and committed to `services/api/openapi.json`; `packages/api-client` is regenerated from it in CI and the build fails if it is stale.

## 2. Authentication

Laravel Sanctum personal access tokens, sent as `Authorization: Bearer <token>` (D-05). Tokens carry abilities `['*']`; authorization is by permissions, not token abilities. Token lifetime 12 h for web, 30 d for mobile (`expires_at`), refreshed by re-login.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | `{email, password, device_name}` → `{token, user, tenant, permissions}` |
| POST | `/auth/logout` | revokes current token |
| GET | `/auth/me` | user, tenant, branches, permissions, settings subset |
| POST | `/auth/forgot-password` | |
| POST | `/auth/reset-password` | |
| POST | `/auth/change-password` | |
| POST | `/auth/accept-invitation` | `{token, name, password}` |

Platform admin endpoints live under `/api/v1/platform/*` and require `platform_admin` guard; they are not tenant-scoped.

## 3. Request context

Middleware is the **layer before controllers** (full diagram in `16-engineering-standards.md §1`).

Tenant routes (MVP target): `EnsureJsonRequest` → `AssignRequestId` → `LogHttpRequest` → `auth:sanctum` → `EnsureUserActive` → `SetTenantContext` (from the user's `tenant_id` only) → `SetBusinessDate` (tenant timezone) → `EnsureBranchAccess` (when a `branch_id`/`warehouse_id` is present in the request, verify user assignment) → `HandleIdempotency` on posting verbs.

Controllers never read `tenant_id` from input. Local/testing may use `X-Tenant-Id` only until Sanctum login lands; that header is ignored in production.

## 4. Response format

Success (single):

```json
{ "data": { "id": "01J...", "name": "..." } }
```

Success (list):

```json
{
  "data": [ ... ],
  "meta": { "current_page": 1, "per_page": 50, "total": 1234, "last_page": 25 },
  "links": { "next": "...", "prev": null }
}
```

Error:

```json
{
  "message": "Insufficient stock for Panadol 500mg (Batch B123).",
  "code": "INSUFFICIENT_STOCK",
  "errors": { "lines.0.quantity": ["Only 40 tablets available."] },
  "context": { "product_id": "01J...", "available_base_quantity": "40.000" }
}
```

`errors` is present for 422 validation failures (Laravel format). `code` is present for domain errors and is stable (clients switch on it, never on `message`). `context` is optional structured detail.

HTTP status usage: 200 OK, 201 Created, 204 No Content, 400 malformed, 401 unauthenticated, 403 forbidden, 404 not found (also for cross-tenant IDs), 409 state conflict (e.g. posting a non-draft), 422 validation/domain rule violation, 423 locked period, 429 rate limited, 500.

### Domain error codes (initial set)

`INSUFFICIENT_STOCK`, `BATCH_NOT_ELIGIBLE`, `BATCH_EXPIRED`, `NEAR_EXPIRY_BLOCKED`, `NEGATIVE_STOCK`, `CREDIT_LIMIT_EXCEEDED`, `PRICE_ABOVE_MRP`, `PRICE_BELOW_COST`, `DISCOUNT_LIMIT_EXCEEDED`, `DOCUMENT_NOT_DRAFT`, `DOCUMENT_NOT_POSTED`, `PERIOD_CLOSED`, `LOCK_DATE_VIOLATION`, `UNBALANCED_JOURNAL`, `RETURN_EXCEEDS_SOLD`, `RETURN_EXCEEDS_RECEIVED`, `VOID_WINDOW_EXPIRED`, `UNIT_FACTOR_LOCKED`, `DUPLICATE_BARCODE`, `CONCURRENT_UPDATE`, `IDEMPOTENT_REPLAY_MISMATCH`, `APPROVAL_REQUIRED`, `INVALID_STATE_TRANSITION`.

Each code maps to a `DomainException` subclass in `app/Domain/Shared/Exceptions` with its HTTP status.

## 5. Lists: pagination, filtering, sorting

- `?page=`, `?per_page=` (default 50, max 200).
- Filters are whitelisted per endpoint: `?filter[status]=posted&filter[business_date_from]=2026-07-01`. Unknown filters → 422.
- Sorting: `?sort=-business_date,document_number`; sortable fields whitelisted. Unknown → 422.
- Search: `?q=` for endpoints that declare it.
- Includes: `?include=lines,customer` from a whitelist; no arbitrary relation loading.
- Spatie Query Builder (or equivalent) implements this uniformly.

## 6. Writes

- Create → `POST /resource` returns 201 with the resource.
- Update → `PATCH /resource/{ulid}` partial; `PUT` not used.
- Documents: `POST /sales` creates a draft; `POST /sales/{ulid}/post` posts it; `POST /sales/{ulid}/void`, `POST /purchases/{ulid}/reverse` etc. Actions are verbs under the resource, never encoded as `PATCH status`.
- Deactivate master data → `POST /products/{ulid}/deactivate` / `activate`.

## 7. Endpoints (MVP)

Prefix `/api/v1`. Every endpoint requires the permission in brackets (see `06-permissions-matrix.md`).

### Tenancy and settings
`GET/PATCH /tenant` [settings.manage for PATCH] · `GET/PUT /tenant/settings` · `CRUD /branches` [branches.manage] · `CRUD /warehouses` · `CRUD /warehouses/{id}/locations` · `GET/PUT /document-sequences` · `CRUD /fiscal-years`, `POST /fiscal-periods/{id}/close|reopen` [accounting.periods.manage] · `PUT /tenant/lock-date`

### Identity
`CRUD /users` [users.manage] · `POST /users/{id}/invite` · `PUT /users/{id}/branches` · `CRUD /roles` [roles.manage] · `GET /permissions`

### Catalog
`CRUD /manufacturers` · `CRUD /categories` · `CRUD /product-forms` · `CRUD /units` · `CRUD /tax-categories` · `CRUD /taxes` · `CRUD /products` · `GET /products/search?q=` (POS search, returns product + units + barcodes + current prices + saleable qty for warehouse) · `GET /products/barcode/{code}?warehouse_id=` · `CRUD /products/{id}/units` · `CRUD /products/{id}/barcodes` · `POST /products/{id}/barcodes/generate` · `GET/POST /products/{id}/prices` (POST adds a new effective price) · `GET /products/{id}/batches` · `GET /products/{id}/stock`

### Partners
`CRUD /suppliers` · `GET /suppliers/{id}/statement` · `GET /suppliers/{id}/open-documents` · `CRUD /customers` · `GET /customers/{id}/statement` · `GET /customers/{id}/open-documents` · `GET /customers/{id}/credit`

### Inventory
`GET /batches` · `GET/PATCH /batches/{id}` (notes, mrp with permission) · `POST /batches/{id}/status` [inventory.batch.status] · `GET /inventory/balances` · `GET /inventory/ledger` · `GET /inventory/low-stock` · `GET /inventory/expiry` · `POST /inventory/allocation-preview` (FEFO preview for POS cart) · `CRUD /stock-adjustments`, `POST .../submit|approve|reject|post` · `CRUD /stocktakes`, `POST .../start-counting|submit-counts|review|approve|complete|cancel`, `PUT /stocktakes/{id}/lines/{lineId}/count`

### Procurement
`CRUD /purchases` (drafts) · `POST /purchases/{id}/post` · `POST /purchases/{id}/reverse` · `GET /purchases/{id}/returnable-lines` · `CRUD /purchase-returns`, `POST .../post`

### Sales
`CRUD /sales` (drafts; `?filter[is_held]=1` lists holds) · `POST /sales/{id}/post` · `POST /sales/{id}/void` · `GET /sales/{id}/receipt?format=80mm|58mm|a4|pdf` · `GET /sales/{id}/returnable-lines` · `CRUD /sales-returns`, `POST .../post`

### Accounting
`CRUD /accounts`, `GET /account-groups` · `CRUD /payment-methods` · `GET /journal-entries`, `POST /journal-entries` (manual draft), `POST .../post|reverse` · `POST /expense-vouchers` (sugar over manual journal) · `GET/POST /payments`, `POST /payments/{id}/reverse`, `POST /payments/{id}/allocate` · `GET /ledger?account_id=` · `GET /reports/trial-balance` · `GET /reports/profit-loss` · `GET /reports/balance-sheet` · `GET /reports/ar-aging` · `GET /reports/ap-aging`

### Reports and dashboard
`GET /dashboard` · `GET /reports/{report-key}` with `?format=json|csv` for every report key in `02-srs-business-requirements.md §19`; `POST /reports/{report-key}/export` queues large exports and returns a job id; `GET /exports/{id}`.

### Imports, notifications, audit, files
`POST /imports` (multipart) · `GET /imports/{id}` · `POST /imports/{id}/confirm` · `GET /imports/{id}/errors.csv` · `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` · `GET /audit-log` [audit.view] · `POST /attachments` (signed upload), `GET /attachments/{id}/download` (signed temporary URL)

## 8. Idempotency

- Header `Idempotency-Key: <uuid>` is **required** on `POST /sales/{id}/post`, `POST /purchases/{id}/post`, `POST /payments`, `POST /*-returns/{id}/post`, `POST /sales/{id}/void`, `POST /stock-adjustments/{id}/post`.
- The key is scoped to tenant + user. First request stores a row in `idempotency_keys` with a hash of the body; a replay with the same hash returns the stored response and status; a replay with a different body returns 422 `IDEMPOTENT_REPLAY_MISMATCH`.
- Rows expire after 24 h. Clients generate the key when the user clicks "Post" and reuse it on retry.

## 9. Service layer

```text
app/Domain/<Context>/
  Models/
  Actions/            # one class per use case: PostSaleAction, AllocateStockAction, RecordPaymentAction
  Services/           # stateless helpers used by actions: FefoAllocator, PriceResolver, TaxCalculator, JournalBuilder
  Events/             # SalePosted, PurchasePosted, PaymentRecorded, StockAdjusted, LowStockDetected, ExpiryDigestReady
  Listeners/
  Policies/
  Exceptions/
  Data/               # DTOs (spatie/laravel-data) for action input
```

- Controllers: validate (Form Request) → map to DTO → call Action → return Resource. No business logic, no queries beyond simple lookups.
- Actions own the transaction boundary (`DB::transaction` with retry wrapper) and emit events after commit (`DB::afterCommit`).
- Posting actions share an abstract `PostDocumentAction` implementing the pipeline in `03-domain-rules.md §11`.
- `JournalBuilder` is the only code that creates `journal_entries`; it refuses to persist an unbalanced entry.

## 10. Events (MVP)

`UserLoggedIn`, `TenantSettingsChanged`, `ProductPriceChanged`, `BatchStatusChanged`, `StockMoved`, `LowStockDetected`, `ExpiryDigestReady`, `PurchasePosted`, `PurchaseReturned`, `SalePosted`, `SaleVoided`, `SalesReturnPosted`, `PaymentRecorded`, `PaymentReversed`, `StockAdjustmentSubmitted`, `StockAdjustmentPosted`, `StocktakeSubmittedForReview`, `StocktakeCompleted`, `JournalPosted`, `ImportCompleted`.

Listeners that send notifications, refresh dashboards or index search are queued. Listeners that affect stock or money do not exist; those effects happen inside the posting transaction.

## 11. Rate limiting

`auth/*`: 10/min per IP. Imports: 10/hour per tenant. Report exports: 30/hour per tenant. General API: 600/min per user. Headers `X-RateLimit-*` returned.

## 12. Versioning and deprecation

Fields are never removed or renamed within `/v1`; new fields are additive. Deprecated fields are marked in OpenAPI and removed only in `/v2`.

## 13. Health and ops endpoints

`GET /up` (Laravel health), `GET /api/v1/platform/health` (DB, Redis, queue depth, last backup time; platform admin only).
