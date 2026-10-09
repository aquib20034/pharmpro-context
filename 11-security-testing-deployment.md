# 11 — Security, Testing and Deployment

## 1. Security

### Tenant isolation
- `BelongsToTenant` global scope on every tenant-owned model; `TenantContext` set by middleware from the authenticated user, never from input.
- Route-model binding inside the scope → cross-tenant IDs are 404.
- Unique constraints include `tenant_id`; `Rule::exists()` always constrained by `tenant_id`.
- Raw/report queries must filter `tenant_id`; a custom PHPStan rule flags `DB::table(`/`DB::select(` outside allowed namespaces without a `tenant_id` literal.
- Table-driven isolation test: for every tenant-owned endpoint, user of tenant A requests tenant B's resource by ULID → 404; list endpoints never include B's rows; create with B's foreign keys → 422.

### Authorization
- Permission per endpoint (`06`), Policies for record-level checks, branch scope middleware.
- Frontend visibility is not security.
- Elevated actions require reason and write audit entries.

### Authentication and sessions
- Sanctum tokens with expiry; prune expired tokens daily; logout revokes; password policy (min 10 chars, breached-password check via `Password::uncompromised()`); login throttling per IP + email; failed logins audited.
- Platform admins use a separate guard and MFA (TOTP) from day one.

### Input and files
- Form Requests on every write; strict types; max sizes.
- Uploads: MIME sniffing, extension allow-list (`csv, xlsx, pdf, jpg, png`), size limits, stored in private buckets, served by signed temporary URLs only.
- CSV import rows sanitised against formula injection on export (`=`, `+`, `-`, `@` prefixed cells are quoted).

### Transport and headers
- HTTPS only; HSTS; CORS restricted to known web origins; `X-Content-Type-Options`, `Referrer-Policy`, CSP on the web app.

### Secrets
- Never committed. `.env.example` lists names only. Production secrets in the host's secret store / GitHub environments. Rotate WhatsApp/SMS/S3 keys on staff change.

### Rate limiting
As in `05 §11`. Public callbacks (P2 webhooks) verify signatures.

### Data protection
- Customer phone/CNIC-type fields are PII: masked in logs, excluded from Sentry breadcrumbs, exportable only with `reports.export`.
- National-id / CNIC-style columns use Laravel `encrypted` cast (D-32). Passwords are hashed. Stock, money and journal amounts stay plain `DECIMAL` for reconciliation.
- Helpers: `App\Support\Pii` (mask/redact). See `16-engineering-standards.md §3`.
- Audit log is append-only from the application's perspective.

## 2. Testing

Tooling: Pest (PHP), Larastan level 6+, Pint; Vitest + Testing Library; Playwright. CI runs against real MySQL 8 and Redis (no SQLite) because locking semantics matter.

### Unit (pure logic)
Money/Quantity arithmetic and rounding · `UnitConverter` · `PriceResolver` precedence · discount distribution · `TaxCalculator` inclusive/exclusive · `FefoAllocator` ordering · `JournalBuilder` balance assertion · state machine transitions · credit availability · aging buckets.

### Feature (HTTP)
Every endpoint: happy path, validation failure, permission denial (table-driven), tenant isolation (table-driven), idempotent replay where applicable.

### Integration (end-to-end business flows, database-backed)
1. Purchase (credit, with free goods) → batches/balances → AP → partial payment → return → supplier statement.
2. Sale (split tender) → FEFO allocations → COGS → journal → tender payments → receipt data.
3. Credit sale → AR → receipt allocation → aging → statement.
4. Sales return (restock, write-off) → stock → journals.
5. Void → balances and ledger identical to pre-sale snapshot.
6. Opening stock import → inventory account equals stock valuation.
7. Stocktake → variance → adjustment → journals.
8. Multi-cost scenario from `07 §9` → gross profit exact.
After each flow: trial balance balances; reconciliation checks (`07 §7`) pass.

### Concurrency (real MySQL, parallel processes)
- N parallel sale posts for the last units → exactly the right number succeed; no negative balance.
- Duplicate `Idempotency-Key` in parallel → one execution, identical responses.
- Parallel number allocation → unique, gap-free.
- Parallel purchase re-receipt of same batch → weighted cost correct.

### Property-based
Random sequences of purchases/sales/returns/adjustments keep: Σ movements = balances; inventory account = valuation; every journal balanced.

### Frontend
- Vitest: money/quantity formatting, cart reducers, permission hook.
- Playwright: login, POS 3-item sale by keyboard, hold/resume, credit sale blocked over limit, purchase entry and post, return flow, permission-denied rendering.

### Performance (nightly on staging dataset)
POS search p95, sale post p95, dashboard, ledger, valuation report; fail the nightly job if budgets in `02 §22` are exceeded; query-count assertions on POS endpoints in the normal suite.

### Coverage targets
Domain Actions/Services ≥ 90% lines; overall API ≥ 80%. Coverage is a signal, not a gate; the critical-rule test list above is the gate.

## 3. Queues and scheduling

Redis + Horizon. Queues: `default`, `imports`, `reports`, `notifications`, `mail`. Posting never depends on a queued job. Scheduler: token prune, held-cart discard, expiry digest, low-stock evaluation sweep, reconciliation jobs, backups, idempotency key purge, nightly performance suite trigger (staging).

## 4. Environments

| Env | Purpose | Data |
| --- | --- | --- |
| local | Laragon or Docker | seeded demo tenant |
| staging | Pre-production, UAT, performance | anonymised large dataset |
| production | Live | real |

Feature flags per tenant (`tenant_settings`) gate P2/P3 features.

## 5. Deployment

- **Web**: Vercel, preview deployments per PR pointing at staging API.
- **API**: Docker image (php-fpm + nginx sidecar or Caddy), compose on VPS initially; Horizon and scheduler as separate services; health checks; zero-downtime via rolling restart after migrations.
- **Migrations**: additive-first; destructive changes in a later release; run under privileged DB user; app user has restricted grants (`04 §14`).
- **Database**: managed MySQL or private VPS instance, no public exposure, TLS, daily snapshots.
- **Redis**: private, password, persistence enabled for queues.
- **Storage**: S3-compatible bucket per environment, private, lifecycle rules for exports.

## 6. Backups

Daily logical dump + binlog retention (point-in-time) to off-server object storage; 30 daily, 12 monthly; monthly restore drill into staging with a recorded checklist; object storage versioning on. A backup that has not been restored is not a backup.

## 7. Monitoring and alerting

Sentry (API, web) with release and tenant tags · Horizon failed job alerts · uptime check on `/up` · host metrics (CPU, memory, disk) · MySQL slow query log reviewed weekly · Redis memory · backup success/age alert · reconciliation job alerts · API p95 latency dashboard.

### Early foundation (D-33, D-34)

Ships before full PP-OPS-005 dashboards:

| Piece | Behaviour |
| --- | --- |
| `X-Request-Id` | Assigned/echoed on every `/api/*` request |
| Access log | Method, path, status, duration, request_id, tenant_id, user_id — PII-redacted |
| `ErrorReporter` | Unexpected exceptions → structured log; Sentry if `SENTRY_LARAVEL_DSN`; optional mail if `ERROR_NOTIFY_MAIL` + `production` |
| Domain 4xx | Logged at notice/debug only; **do not** email developers |

UAT still requires OPS-03 (forced Sentry test event) before launch.

## 8. Operational runbooks (to write during sprint 11)

Restore from backup · rebuild inventory balances for a tenant · reverse a wrongly posted document · rotate secrets · scale queue workers · onboard a tenant · suspend a tenant · investigate a stock mismatch alert.

## 9. Production release checklist

- [ ] Migrations reviewed and tested on a staging copy of production data
- [ ] Backup taken immediately before release; restore path verified this month
- [ ] Rollback plan written for this release
- [ ] Environment variables diffed against `.env.example`
- [ ] Queue workers and scheduler running post-deploy
- [ ] SSL, CORS, rate limits, security headers verified
- [ ] Sentry receiving events with the new release tag
- [ ] Smoke tests: login, POS search, sale post, purchase post, report
- [ ] Reconciliation jobs green after deploy
- [ ] Release notes and docs updated
