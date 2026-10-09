# 16 — Engineering Standards (API & Observability)

Cross-cutting rules for every ticket. Complements `05-api-architecture.md`, `11-security-testing-deployment.md`, and `.cursor/rules/laravel-api.mdc`.

## 1. Layering (request path)

Every write/read HTTP call goes through this stack. Controllers never skip it.

```text
Client
  → Transport (HTTPS, CORS, rate limit)                          [infra / PP-OPS-001]
  → Middleware pipeline (“layer before the controller”)
       1. EnsureJsonRequest          Accept: application/json
       2. AssignRequestId            X-Request-Id (in + out)
       3. LogHttpRequest             structured access log (PII-redacted)
       4. auth:sanctum               Bearer token (except public auth routes)
       5. EnsureUserActive
       6. SetTenantContext           from authenticated user only (never from body); also setPermissionsTeamId
       7. SetPermissionsTeamFromTenant  Spatie teams (`tenant_id`)
       8. EnsureBranchAccess         when branch_id / warehouse_id / X-Branch-Id present (Owner/Admin bypass)
       9. HandleIdempotency          required posting endpoints
      10. SubstituteBindings         ULID resolve inside tenant scope → 404 cross-tenant
  → Form Request                     validation only
  → Action / Service                 business rules + DB transaction
  → API Resource                     JSON shape (money/qty as strings)
  → Exception handler                DomainException → stable `code`; unexpected → report
```

**Do not** put business rules in controllers, middleware, or React. **Do not** wrap every Action in try/catch; throw domain exceptions and let the handler map them. Catch only for retries (deadlock 1205/1213) or to translate vendor errors.

## 2. Naming & folder conventions

| Kind | Location | Name |
| --- | --- | --- |
| Model | `app/Domain/<Context>/Models` | Singular PascalCase |
| Action | `app/Domain/<Context>/Actions` | `VerbNounAction` |
| Service | `app/Domain/<Context>/Services` | Stateless helper (`FefoAllocator`) |
| Exception | `app/Domain/Shared/Exceptions` | `SomethingException` + stable `errorCode` |
| Form Request | `app/Http/Requests/Api/V1` | `StoreXRequest` / `UpdateXRequest` |
| Resource | `app/Http/Resources/Api/V1` | `XResource` |
| Controller | `app/Http/Controllers/Api/V1` | thin |
| Middleware | `app/Http/Middleware` | verb phrase |
| Support | `app/Support` | Money, Quantity, TenantContext, Pii |

API URLs use **ULIDs** (`id` in JSON = `ulid`). Internal FKs stay BIGINT.

## 3. PII & data protection (D-32)

| Rule | Practice |
| --- | --- |
| Classify | Phone, WhatsApp, email, CNIC/national id, address lines on people = PII |
| At rest | CNIC / national-id style fields use Laravel `encrypted` cast (APP_KEY). Passwords use `hashed`. |
| In logs | Never log raw PII. Use `Pii::redact()` / `Pii::maskPhone()` before `Log::*`. |
| In Sentry | Scrub `password`, `token`, `authorization`, phone, cnic from request/context |
| In exports | Only with `reports.export`; prefer masked columns in UI lists |
| Access | Tenant scope + permission; cross-tenant = 404 |

Do **not** invent field-level encryption for every string column; money/qty/stock stay plain DECIMAL for querying and reconciliation.

## 4. Logging

- Channel: `stack` (single + stderr in containers).
- Every API request (after response): method, path, status, duration_ms, `request_id`, `tenant_id`, `user_id` (if any). Body **not** logged by default.
- Domain Actions may `Log::info` / `Log::warning` with redacted context for operational events (e.g. import finished).
- Never log Authorization headers or request bodies that may contain passwords.

## 5. Errors & developer notification (D-33)

| Class | HTTP | Notify developer? |
| --- | --- | --- |
| `DomainException` (expected business rule) | 4xx as mapped | No (unless rate of spikes) |
| Validation (`ValidationException`) | 422 | No |
| Auth / forbidden | 401 / 403 | No |
| Unexpected `Throwable` | 500 | **Yes** — Sentry (primary) + optional mail |

Implementation:

1. Laravel `report()` / exception handler calls `ErrorReporter`.
2. `ErrorReporter` always writes structured log with `request_id` + `tenant_id`.
3. If `SENTRY_LARAVEL_DSN` set → Sentry with release + tenant tag.
4. If `ERROR_NOTIFY_MAIL` set and env is `production` → queue a short mail to that address (fallback when Sentry is down).

Expected domain failures must **not** email the on-call inbox.

## 6. Compliance checklist (per ticket)

- [ ] Form Request on every write  
- [ ] Permission / Policy on every endpoint  
- [ ] Tenant scope on every tenant-owned model  
- [ ] Money/qty as strings on API  
- [ ] No float arithmetic  
- [ ] Stock/money only via Actions + movements / JournalBuilder  
- [ ] Tests: happy, 422, 403 row, tenant isolation 404  
- [ ] PII fields cast/redacted as above  
- [ ] OpenAPI regenerated when routes change  

## 7. Audit (PP-PLAT-007)

- Master data: opt-in `Auditable` trait (Spatie `LogsActivity`) — dirty fillable before/after.
- Document actions (void, reverse, approve): `AuditLogger::record($description, subject:, reason:, …)` — always set `tenant_id` + `reason` when required by domain rules.
- Viewer: `GET /audit-log` requires `audit.view`.

## 8. Pull-forward from Ops

Observability primitives (request log, PII helper, ErrorReporter, Sentry package) ship in **foundation / early platform**, not only sprint 11. Full Horizon alerts, uptime, and dashboards remain `PP-OPS-005`.
