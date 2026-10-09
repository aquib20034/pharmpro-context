# 08 — Frontend Architecture and Design System

## 1. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router), React, TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives), CSS variables for theming |
| Server state | TanStack Query; generated client from `packages/api-client` |
| Forms | react-hook-form + zod schemas (mirroring API validation for UX only) |
| Tables | TanStack Table with a shared `DataTable` wrapper |
| Charts | Recharts (dashboard only) |
| Icons | lucide-react |
| Printing | Dedicated print routes rendered with print CSS; PDF comes from the API |
| Barcode scanning | Keyboard-wedge scanners (default); camera scanning is mobile (P3) |
| i18n | `next-intl`, English first; Urdu copy later; all strings in message files from day one |
| Testing | Vitest + Testing Library (units), Playwright (POS and critical flows) |
| Lint/format | ESLint (next, typescript, jsx-a11y), Prettier |

Rendering: the app is an authenticated SPA-like experience; pages are client components under a server-rendered shell. No data is fetched server-side with the user's token (the token lives in memory + `httpOnly`-less storage is avoided: store the Sanctum token in `sessionStorage` for web; see §9).

Deployment: Vercel. `NEXT_PUBLIC_API_URL` points to the Laravel API. The API enables CORS for the Vercel origins.

## 2. Project structure (`apps/web`)

```text
src/
  app/
    (auth)/login, forgot-password, reset-password, accept-invitation
    (app)/
      layout.tsx          # shell: sidebar, header, breadcrumbs, toasts
      dashboard/
      pos/                # full-screen layout, no sidebar
      sales/, sales-returns/
      purchases/, purchase-returns/
      inventory/ (balances, ledger, batches, expiry, low-stock, adjustments, stocktakes)
      products/, manufacturers/, categories/, units/, taxes/
      suppliers/, customers/
      accounting/ (accounts, journals, payments, ledger, reports)
      reports/
      settings/ (tenant, branches, users, roles, numbering, payment-methods, notifications, audit-log)
    print/                # receipt and document print views
  components/
    ui/                   # shadcn primitives
    data-table/, forms/, layout/, feedback/ (EmptyState, ErrorState, PermissionDenied, Skeletons)
  features/<domain>/      # hooks, api wrappers, forms, columns per domain
  lib/ (api, auth, permissions, money, quantity, dates)
  messages/ (i18n)
```

## 3. Navigation (permission-driven)

Sidebar items render only when the user holds the relevant permission:

Dashboard · POS · Sales (Sales, Returns, Held carts) · Purchases (Purchases, Returns) · Inventory (Stock, Batches, Ledger, Expiry, Low stock, Adjustments, Stocktakes) · Products (Products, Manufacturers, Categories, Units & forms, Taxes) · Partners (Suppliers, Customers) · Accounting (Payments, Journals, Ledger, Accounts) · Reports · Settings.

Header: tenant name, branch switcher (assigned branches only), business date, notifications bell, user menu. Breadcrumbs on every page.

## 4. POS UX (the product's most important screen)

Layout (desktop/laptop, 1280px+): left 60% cart, right 40% search/product panel; payment opens as a modal. Tablet (≥ 1024px) stacks search above cart.

Rules:

- The barcode input is focused on load and regains focus after every action unless a text field is explicitly focused. `Esc` returns focus to it.
- Scanning adds the barcode's product unit with qty 1 or increments the matching line (same product unit, same forced batch). Unknown barcode → toast + focus retained.
- Search box (`/` shortcut): server typeahead on name/generic/SKU/barcode, 200 ms debounce, shows product, strength, form, manufacturer, default unit price, saleable qty in current warehouse and nearest expiry. Arrow keys + Enter to add.
- Cart line: product, unit selector (product units), qty (±, direct input), unit price (editable only with permission; MRP badge), discount, tax, total, expected batch/expiry preview from `/inventory/allocation-preview`, warning badges (near expiry, low stock, below cost).
- Customer selector (`F4`): walk-in default; shows available credit for named customers.
- Totals panel: subtotal, line discounts, invoice discount control, tax, rounding, grand total.
- Payment modal (`F9`): tender buttons per payment method, amounts, remaining/change computed, credit tender disabled for walk-in or when exceeding available credit (unless override), "Post & print" (`Ctrl+Enter`).
- Hold (`F6`) / Resume (`F7`) with label; held carts list.
- Return (`F8`) opens the return flow searching by receipt number/customer.
- Post sends `Idempotency-Key`; the button is disabled while in flight; on network error the UI retries with the same key up to 3 times before showing a resolvable error ("Check sales list for INV…").
- After posting: receipt preview with auto-print option (tenant setting), then new empty cart with focus on barcode input.
- Keyboard shortcuts documented in a `?` overlay. No action requires the mouse.

Performance budget: cart interactions < 50 ms; search results < 300 ms end-to-end; post + receipt render < 1.5 s.

## 5. Inventory and list screens

Standard `DataTable` features: server pagination, column sort (whitelisted), filters in a collapsible bar, global search where the endpoint supports `q`, column visibility, row density toggle, sticky header, totals row for money/qty columns, CSV export button only with `reports.export`, URL-synced state (filters/sort/page in query string).

Stock table columns: product, SKU, batch, expiry (coloured by bucket), warehouse, location, on hand, reserved, available, unit cost, MRP, value, status. Filters: warehouse, category, manufacturer, expiry bucket, low stock, batch status, search.

## 6. Forms

Every form: labels, required markers, inline client validation (zod) that mirrors but never replaces server validation; server errors mapped to fields by key (`errors["lines.0.quantity"]`), unmapped errors shown at the top; submit disabled while pending; dirty-state guard on navigation; success toast; optimistic updates only for trivial toggles.

Document editors (purchase, sale return, adjustment, stocktake, manual journal): header section, lines grid with keyboard navigation (Tab/Enter to next cell, add row on last cell), totals footer, actions (Save draft, Post with confirmation and reason where required).

## 7. Feedback states

Each route handles: loading (skeletons, not spinners, for tables), empty (illustration + primary action), error (message, retry, Sentry event id), permission denied (dedicated component, no redirect loop), stale (TanStack refetch indicator). Mutations surface `code` from the API to show specific messages (e.g. `INSUFFICIENT_STOCK` highlights the line).

## 8. Destructive and sensitive actions

Confirmation dialog with typed reason for: void, reverse, cancel stocktake, deactivate, post adjustment, approve adjustment/stocktake, price override, discount override, credit override. Dialogs state the irreversible consequence in one sentence.

## 9. Auth and session

- Login stores token in memory and `sessionStorage` (per-tab, cleared on close); refresh via silent re-login is not available, so sessions end at token expiry (12 h) with a redirect to login that preserves the return URL.
- `/auth/me` is loaded once into a `SessionProvider` (user, tenant, permissions, settings, branches). `usePermission('sales.void')` gates UI.
- Branch switcher sets the active branch; all requests include `branch_id` where the API expects it. Warehouse selection in POS defaults to the branch default warehouse.
- 401 → clear session and redirect. 403 → PermissionDenied component. 404 on a detail route → NotFound.

## 10. Formatting

- Money via a single `formatMoney(amount, currency)` using tenant currency; inputs accept and display 2 dp; the API receives strings (never JS floats) for money and quantities.
- Quantities show up to 3 dp but trim trailing zeros; unit label always adjacent.
- Dates in tenant timezone; `business_date` as `DD MMM YYYY`; timestamps with time.

## 11. Accessibility

Keyboard-complete flows; visible focus; semantic controls; `aria-live` for toasts and totals; labels tied to inputs; 4.5:1 contrast minimum; table headers announced; dialogs trap focus. WCAG 2.1 AA for POS, purchase entry, payments and reports.

## 12. Visual style

Serious ERP: dense data, clear hierarchy, 14 px base in tables, 8 px spacing grid, neutral palette with a single accent, semantic colours only for status/expiry, minimal decoration, consistent button placement (primary bottom-right in dialogs, top-right on pages).

## 13. Never in the frontend

Final stock, final price authorisation, tax authority, COGS, journal entries, permission decisions, tenant scoping. The frontend proposes; the API decides.
