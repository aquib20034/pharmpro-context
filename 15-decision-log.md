# 15 — Decision Log

Decisions made while consolidating the original idea into this specification. Each one fills a gap or resolves an ambiguity in `context/idea.txt`. Status `proposed` means the product owner has not yet confirmed; development may proceed on it, but it should be confirmed before the dependent sprint starts.

| ID | Decision | Rationale | Alternatives rejected | Status | Affects |
| --- | --- | --- | --- | --- | --- |
| D-01 | MVP = Pharmacy mode only; Distributor and Warehouse modes are feature-flagged later phases | Original "MVP" listed nearly everything; pharmacies are the first customers | Build all three modes at once | proposed | `01` |
| D-02 | Single database, shared schema, `tenant_id` column on every tenant-owned table with global scope | Simplest to operate and back up at this scale; isolation enforced by code + tests | Database-per-tenant (ops burden), schema-per-tenant (MySQL has no schemas) | proposed | `03 §17`, `04` |
| D-03 | All stock quantities stored in the product's base unit; documents store entered unit + derived base quantity | Original spec put `unit_id` on balances, which makes totals and FEFO ambiguous | Store per-unit balances with conversion at read time | proposed | `03 §1`, `04 §7` |
| D-04 | Inventory valuation = specific identification by batch; re-receiving the same batch uses weighted-average cost for that batch | Pharma stock is batch-tracked anyway; gives exact COGS and matches how pharmacists think | FIFO across batches, product-level weighted average | proposed | `03 §2`, `07` |
| D-05 | Sanctum personal access tokens as Bearer; token in memory + sessionStorage on web | Web (Vercel) and API are different origins; cookie SPA auth needs same-site | Sanctum SPA cookies with custom domain for both; JWT | proposed | `05 §2`, `08 §9` |
| D-06 | A user belongs to exactly one tenant in MVP | Avoids tenant switcher complexity; P2 adds multi-tenant users | Multi-tenant users from day one | proposed | `02 §4` |
| D-07 | MVP procurement = purchase invoice that receives stock on posting; PR → PO → GRN is P2 | Pharmacies buy against supplier invoices; three-document flow adds weeks | Full procurement chain in MVP | proposed | `02 §15`, `13` |
| D-08 | Negative stock is never allowed, no tenant option | Negative stock breaks valuation and COGS; pharmacies can post the purchase first | Configurable negative stock | proposed | `03 §3` |
| D-09 | Expired stock cannot be sold; near-expiry sale is a warning by default, blockable per tenant with permission override | Regulatory and safety | Allow expired sale with override | proposed | `02 §14`, `03 §4` |
| D-10 | Document numbers allocated at posting, gap-free per tenant/branch/type/fiscal year; drafts show `DRAFT-<id>` | Tax-compliant numbering; drafts can be deleted without gaps | Allocate at creation | proposed | `03 §9` |
| D-11 | Payments are separate documents with allocations; unallocated remainder is an advance (asset/liability accounts) | Supports partial payments, advances, statements | Payments only against single invoices | proposed | `04 §10`, `07 §4.3/4.8` |
| D-12 | One audit table (`activity_log` via spatie) with `tenant_id` and `reason`; original spec had both `activity_log` and `audit_logs` | Avoid duplicate audit sources | Custom audit table | proposed | `04 §11` |
| D-13 | Price precedence: override → [P2 customer price → price list] → product price by customer price type → batch MRP → product retail | Pharmacies in Pakistan sell at MRP by default; distributors use lists | MRP-only; product-price-only | proposed | `03 §5` |
| D-14 | Discounts reduce revenue (net method); invoice discounts distributed proportionally to lines; taxes per line | Clean revenue and tax figures; avoids rounding disputes | Gross method with discount expense account | proposed | `03 §6-7`, `07` |
| D-15 | Opening balances post against Opening Balance Equity (3900) | Standard practice; keeps TB balanced from day one | Post to capital directly | proposed | `07 §4.1` |
| D-16 | Fiscal year start month configurable; default July (Pakistan); monthly periods; lock date | Local norm; accountants expect period control | Calendar year default | proposed | `07 §5` |
| D-17 | Local development supported on Laragon (Windows) and Docker; CI uses Docker services | Team works on Laragon; CI/staging/prod are Linux containers | Docker only | proposed | `09 PP-FOUND-002` |
| D-18 | Web stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query/Table, react-hook-form, zod, Playwright | Mainstream, accessible, fast to build dense ERP UIs | Vue/Nuxt, Inertia | proposed | `08` |
| D-19 | API tooling: Pest, Larastan level 6, Pint, spatie permission/activitylog/query-builder/data, brick/money | Standard Laravel ecosystem; team familiarity | Custom RBAC, custom audit | proposed | `05 §9`, `11 §2` |
| D-20 | MVP notifications: in-app + email only; SMS/WhatsApp in P2 behind the same channel interface | Provider onboarding (Meta approval) takes time and is not needed to sell | WhatsApp in MVP | proposed | `02 §20`, `13` |
| D-21 | Held POS carts do not reserve stock; `reserved_quantity` is only used by P3 transfers | Reservation complicates FEFO and expiry; holds are short-lived | Reserve on hold | proposed | `03 §3` |
| D-22 | Sales returns default to the original sale; unlinked returns require `sales.return.unlinked`; dispositions RESTOCK / WRITE_OFF; quarantine disposition arrives with locations in P3 | Exact reversal needs allocations; quarantine needs a place to hold stock | Quarantine as batch status | proposed | `03 §13`, `07 §4.6` |
| D-23 | Perpetual inventory: COGS posted at sale posting from `sale_line_allocations` | Real-time profit and valuation | Periodic inventory | proposed | `07` |
| D-24 | Timestamps UTC; `business_date` in tenant timezone drives numbering, periods, reports, expiry | Correct day boundaries for Pakistan shops open past midnight UTC | Use `created_at` | proposed | `03 §16` |
| D-25 | ULIDs in API URLs; BIGINT PKs internally | Non-guessable, sortable identifiers without UUID index cost | UUID v4 PKs | proposed | `04` |
| D-26 | Production app DB user lacks UPDATE/DELETE on movements and DELETE on journals/payments; migrations use a privileged user | Defence in depth for append-only ledgers | Rely on application code only | proposed | `04 §14` |
| D-27 | Batch status is whole-batch (`SALEABLE`, `QUARANTINED`, `BLOCKED`, `RECALLED`); expired is derived; damaged/expired units leave via adjustment movements | Partial damage is a quantity event, not a batch state | `DAMAGED`/`EXPIRED`/`RETURNED` batch statuses from original spec | proposed | `02 §13`, `03 §2` |
| D-28 | Void allowed only on the current business date; otherwise use a return | Keeps daily cash reports stable; matches regulatory expectations | Void any day with permission | proposed | `03 §10` |
| D-29 | Money `DECIMAL(19,4)`, per-base-unit rates `DECIMAL(19,6)`, quantities `DECIMAL(18,3)`; document totals rounded to currency minor unit with a rounding account | Prevents drift from per-tablet costs like 8,000 ÷ 1,100 | 2 dp everywhere | proposed | `03 §8` |
| D-30 | Tenants created by platform admin in MVP; self-service signup and billing in P2 | First customers are onboarded by the vendor | Self-service from day one | proposed | `02 §2` |
| D-31 | Sprint plan reordered so a pharmacy can sell by sprint 8; accounting core precedes purchasing | Original plan delayed POS to sprint 10–12 and accounting to 13–15, making early demos impossible | Original module-by-module order | proposed | `10` |
| D-32 | PII: mask in logs/UI lists; Laravel `encrypted` cast for national-id/CNIC-style fields; passwords hashed; do not encrypt all columns | Queryable stock/money/accounting must stay plain DECIMAL; full DB encryption is infra | Encrypt every string column; store CNIC plaintext in logs | proposed | `11 §1`, `16 §3` |
| D-33 | Unexpected 500s → structured log + Sentry (primary) + optional `ERROR_NOTIFY_MAIL` in production; DomainException/validation do not page developers | Avoid alert fatigue; still never lose a real crash | Email on every 422; rely on log files only | proposed | `11 §7`, `16 §5` |
| D-34 | Observability primitives (request id logging, PII redactor, ErrorReporter, Sentry SDK) land in foundation/early platform; full ops dashboards stay PP-OPS-005 | Catch crashes from day one of feature work | Wait until sprint 11 to add any Sentry | proposed | `09`, `16 §7` |
| D-35 | Login lockout: 10 failed attempts per email+IP → 15 min lock (`LOGIN_LOCKED`); invitation tokens expire in 7 days; `FRONTEND_URL` used for invite/reset links | Ticket tests require lockout after 10; docs left duration/link base unspecified | Permanent lockout; 1-hour lock; invite never expires | proposed | `09` PP-PLAT-002/003 |

## How to use this log

- Confirm or overturn each `proposed` decision before the first sprint that depends on it.
- New decisions get the next ID and a row; changes to existing decisions get a new row superseding the old one (never edit history).
- Any change to `03-domain-rules.md` or `07-accounting-rules.md` requires an entry here.
