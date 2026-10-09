# 00 — Master Implementation Plan

## 1. Product vision

PharmaPro is a multi-tenant pharmaceutical ERP that combines point of sale, batch- and expiry-aware inventory, procurement, supplier/customer credit, double-entry accounting, reporting and (later) communications and warehouse operations.

One domain engine serves three operating modes, selected per tenant and differing only in enabled workflows, defaults and UI emphasis:

| Mode | Optimised for | Phase |
| --- | --- | --- |
| Pharmacy | Fast retail POS, barcode scanning, expiry control, customer credit | MVP |
| Distributor | Bulk purchasing, wholesale price lists, credit terms, multiple warehouses, PO workflow | P2 |
| Warehouse | Receiving, rack/bin storage, transfers, picking, dispatch, stocktake | P3 |

Target customers: single-shop pharmacies, multi-branch pharmacy chains, pharmaceutical distributors and warehouses, initially in Pakistan (PKR, JazzCash/Easypaisa, July–June fiscal year defaults) but with no hard-coded locale assumptions.

## 2. Non-negotiable architecture

| Layer | Choice | Notes |
| --- | --- | --- |
| Backend | Laravel (current stable major), PHP 8.3+, API-first | All business rules live here |
| Database | MySQL 8.0+, InnoDB | Single database, shared schema, `tenant_id` on every tenant-owned table (D-02) |
| Cache / queues | Redis + Laravel Horizon | Imports, reports, notifications, emails |
| Auth | Laravel Sanctum personal access tokens (Bearer) | Web is on a different origin than the API (D-05) |
| RBAC | spatie/laravel-permission | Permission keys defined in `06-permissions-matrix.md` |
| Audit | spatie/laravel-activitylog, single `activity_log` table (D-12) | Plus domain-specific reason fields on sensitive documents |
| Web | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query + react-hook-form + zod | Deployed to Vercel |
| Mobile | React Native + Expo | P3, same API |
| Desktop | Tauri wrapping the web UI | P3, same API |
| Object storage | S3-compatible (AWS S3, Cloudflare R2, MinIO locally) | Logos, attachments, import files, report exports |
| Messaging | WhatsApp Business Cloud API and SMS behind a provider interface | P2; MVP ships in-app + email only |
| Infra | Docker, Nginx, GitHub Actions | Laragon supported for local Windows development (D-17) |
| Observability | Sentry (API + web), Horizon dashboard, uptime + resource monitoring | |

### Deployment topology

```text
Browser ──▶ Vercel (Next.js) ──▶ Laravel API (Docker, Nginx) ──▶ MySQL
                                        │                     ──▶ Redis (cache, queues)
                                        │                     ──▶ S3-compatible storage
Mobile (Expo) ───────────────────────────┘
Desktop (Tauri) ─────────────────────────┘
```

The Laravel API is the only writer to the database. No client talks to MySQL directly.

## 3. Repository structure

Monorepo. The MVP creates `services/api`, `apps/web`, `packages/api-client`, `packages/types`, `infrastructure`, `.github/workflows`. `apps/mobile` and `packages/ui` are created when their phase starts.

```text
pharmapro/
├── apps/
│   ├── web/                 # Next.js
│   └── mobile/              # Expo (P3)
├── services/
│   └── api/                 # Laravel
│       ├── app/
│       │   ├── Domain/      # One folder per bounded context (see §5)
│       │   ├── Http/        # Controllers, Requests, Resources (thin)
│       │   └── Support/     # Shared helpers (Money, Quantity, TenantContext)
│       ├── database/
│       └── tests/
├── packages/
│   ├── api-client/          # Generated from OpenAPI, published to the monorepo only
│   ├── types/
│   └── ui/                  # Extract only when mobile/desktop need shared components
├── docs/
├── infrastructure/
│   ├── docker/
│   └── nginx/
└── .github/workflows/
```

Tooling: pnpm workspaces for JS, Composer for PHP, Turborepo optional. One `Makefile`/`justfile` at the root wraps the common commands so that documentation refers to `make test`, not to tool-specific invocations.

## 4. Core domain separation

These concepts are never collapsed into one another:

| Concept | Is | Is not |
| --- | --- | --- |
| Product | Catalog definition | A stock quantity |
| Product unit | A unit the product is bought/sold in, with a factor to the base unit | A global unit table lookup alone |
| Batch | A specific lot: number, expiry, cost, MRP | A product |
| Inventory balance | Quantity of a batch at a warehouse/location, in base units | Source of truth |
| Inventory movement | Append-only stock change with source document | Editable |
| Price | A rule that yields a selling price for a product unit in a context | Something stored on the batch only |
| Journal entry | The accounting effect of a posted document | Something the frontend computes |

There is no `products.stock` column. Stock is the sum of movements, projected into `inventory_balances`.

## 5. Bounded contexts (engines)

Each context lives in `app/Domain/<Context>/` with its own Models, Actions/Services, Events, Policies and Exceptions.

| Context | Owns |
| --- | --- |
| Tenancy | tenants, settings, branches, warehouses, locations, document sequences, fiscal periods |
| Identity | users, roles, permissions, invitations, tokens |
| Catalog | manufacturers, categories, forms, units, products, product units, barcodes, prices, taxes |
| Partners | suppliers, customers, price lists (P2) |
| Inventory | batches, balances, movements, allocation (FEFO), adjustments, stocktakes, transfers (P3) |
| Procurement | purchases (invoices), purchase returns, purchase requests/orders/GRN (P2) |
| Sales | sales, sale lines, sale payments, sales returns, voids, POS holds |
| Accounting | chart of accounts, journals, ledger, AP/AR, payments and allocations, payment methods, statements |
| Reporting | dashboards and reports (read models only) |
| Communication | notification templates, rules, logs, providers (MVP: in-app + email) |
| Imports | CSV import pipeline |
| Audit | activity log queries and viewer |

Cross-context writes go through the owning context's Action classes, never by touching another context's tables directly.

## 6. Phases

The original plan put POS in month six. The plan below is MVP-first: a pharmacy can buy, stock, sell and account within the MVP.

| Phase | Content | Doc |
| --- | --- | --- |
| 0 — Foundation | Repo, Docker/Laragon, CI, API standards, frontend shell | tickets `PP-FOUND-*` |
| 1 — Platform | Tenant, auth, users, roles, permissions, branches, warehouses, settings, numbering, audit | `PP-PLAT-*` |
| 2 — Catalog & partners | Manufacturers, suppliers, customers, categories, forms, units, products, product units, barcodes, prices, taxes | `PP-CAT-*` |
| 3 — Inventory core | Batches, balances, movements, FEFO, concurrency, opening stock, adjustments, low stock, expiry | `PP-INV-*` |
| 4 — Accounting core | CoA, journal engine, fiscal periods, payment methods, manual journals, ledger, trial balance | `PP-ACC-*` |
| 5 — Procurement (simple) | Purchase invoice with receiving, free goods, AP, supplier payments, purchase returns | `PP-PUR-*` |
| 6 — POS & sales | POS, search, cart, allocation, pricing, discounts, tax, payments, atomic posting, receipts, credit, holds, returns, void | `PP-SALE-*` |
| 7 — Reports & dashboard | Core inventory/sales/purchase/financial reports, role dashboards, statements, aging | `PP-REP-*` |
| 8 — Stocktake & imports | Stocktake workflow, CSV imports | `PP-INV-*`, `PP-IMP-*` |
| 9 — Hardening & launch | Security, performance, backups, UAT, deployment | `PP-OPS-*` |
| **MVP boundary** | | |
| 10 — Communication | Templates, SMS, WhatsApp, alerts, message logs | `13-post-mvp-roadmap.md` |
| 11 — Advanced procurement & distributor | PR → PO → GRN → invoice, price lists, customer-specific pricing, schemes | |
| 12 — Warehouse | Locations, transfers, picking, dispatch, receiving, recall, location stocktake | |
| 13 — Mobile | Expo app | |
| 14 — Desktop / offline | Tauri, offline queue, sync | |

## 7. MVP summary

Full definition in `01-mvp-scope.md`. In one sentence: a single-tenant-per-login Pharmacy mode with one or more branches/warehouses, batch-and-expiry inventory in base units, simple purchase invoices with supplier credit and payments, a fast POS with FEFO allocation and customer credit, returns and voids, double-entry accounting with core statements, core reports, CSV opening-stock import, stocktake and an audit trail.

## 8. Definition of Done (per ticket)

A ticket is done only when all of the following hold:

1. Migrations exist, are reversible where safe, and include indexes and foreign keys.
2. Form Request validation exists for every write endpoint.
3. A Policy or permission check exists for every endpoint.
4. Domain logic lives in an Action/Service, not in the controller.
5. API endpoints are documented in the OpenAPI spec and the TS client regenerated.
6. UI exists where the ticket requires it, handling loading / empty / error / success / permission-denied.
7. Audit requirements of the ticket are met.
8. Tests: unit tests for rules, feature tests for endpoints, and the specific tests listed in the ticket.
9. `make lint`, `make typecheck`, `make test` pass locally and in CI.
10. Documentation in `docs/` updated if behaviour, schema or API changed.
11. No known critical or high defect remains.

## 9. Engineering principles

- Business rules exist once, server-side. Clients may duplicate validation for UX only.
- Posted documents are immutable. Fix mistakes with reversals and new documents.
- Every tenant-owned query is tenant-scoped automatically; tests prove isolation.
- Money is `DECIMAL`, never float. Quantities are stored in base units.
- Prefer explicit status columns and state machines over inferring state.
- Prefer boring, well-understood Laravel patterns over clever abstractions.
