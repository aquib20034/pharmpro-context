# 13 — Post-MVP Roadmap

Everything here consumes the MVP's domain engine without changing its invariants. Each section lists goals, key design notes and ticket stubs. Ticket numbering continues the MVP conventions.

## P2-A Communication (sprints 13–14)

Goals: provider-independent SMS and WhatsApp, templates, rules, logs; payment reminders; supplier messages.

Design notes:
- `NotificationChannel` interface (`send(Message): ProviderResult`) with `InAppChannel`, `MailChannel` (MVP), `SmsChannel`, `WhatsAppChannel`. Providers behind `SmsProvider`/`WhatsAppProvider` contracts; first implementations: a Pakistani SMS gateway and Meta WhatsApp Business Cloud API.
- `notification_templates(tenant_id, event, channel, locale, subject, body, variables)`; variables like `{{customer_name}}`, `{{amount_due}}`, `{{due_date}}`, `{{product_name}}`, `{{quantity}}`, `{{warehouse}}`.
- `notification_rules(tenant_id, event, channel, recipients_type, recipients, schedule, is_active)`.
- `notification_logs(tenant_id, channel, provider, recipient, template_id, payload, status, provider_message_id, error, sent_at, delivered_at)`; webhooks update status with signature verification.
- WhatsApp templates must be pre-approved by Meta; store template names and parameter mapping.
- Messaging never blocks posting; all sends are queued with retry/backoff and per-tenant rate limits.

Tickets: PP-COM-001 channel/provider abstraction · 002 templates · 003 rules + recipients · 004 SMS provider · 005 WhatsApp provider + webhooks · 006 payment reminders (AR due, AP due) · 007 supplier purchase message (P2-B dependency) · 008 message log UI · 009 opt-out handling.

## P2-B Distributor mode (sprints 15–17)

Goals: wholesale pricing, customer-specific pricing, formal procurement workflow, schemes, landed cost, shifts.

Design notes:
- `price_lists`, `price_list_items(product_unit_id, price, min_qty)`, `customer_prices`; `PriceResolver` steps 2–3 enabled.
- Procurement: `purchase_requests` → `purchase_orders` (sent to supplier, partial receipts) → `goods_receipts` (stock in at PO cost, `GRN` movement type) → purchase invoice matching (3-way) adjusting cost variance. Stock posts at GRN; AP posts at invoice; `GRNI` (goods received not invoiced) liability account added to CoA.
- Schemes: supplier scheme master (buy X get Y, slab discounts) auto-filling free quantity/discount on lines.
- Landed cost: allocate freight/duties across lines by value or quantity; adjusts batch cost before posting.
- Supplier withholding tax on payments; tax reports.
- Cash drawer shifts: open with float, tenders by method, close with declared cash and variance posting.
- Prescription capture, doctor master, controlled-drug register (dispensing log with patient/prescriber).
- Ownership on inventory for consignment/borrowed stock: `inventory_balances.ownership` (OWNED/CONSIGNED/BORROWED) with distinct accounting (consigned stock off-balance until sold; borrowed stock tracked as payable in kind). Only if a customer requires it.
- Multi-tenant users (an accountant serving several tenants) via `user_tenants` pivot and tenant switcher.
- Year-end close journal; cash flow statement.

Tickets: PP-DIST-001 price lists · 002 customer prices · 003 purchase requests · 004 purchase orders · 005 GRN posting · 006 invoice matching · 007 schemes · 008 landed cost · 009 withholding tax · 010 cash drawer shifts · 011 prescription/doctor · 012 controlled-drug register · 013 ownership model · 014 multi-tenant users · 015 year-end close · 016 cash flow statement · 017 fast/slow/dead stock analysis · 018 scheduled report emails · 019 self-service signup and subscription billing.

## P3-A Warehouse mode (sprints 18–20)

Goals: location-level operations, transfers, picking, dispatch, receiving, recall, location stocktake.

Design notes:
- Transfers: `stock_transfers` with states Draft → Requested → Approved → Picked → Dispatched → Received → Completed. Stock leaves source at **dispatch** (`TRANSFER_OUT`), sits in an "in-transit" virtual warehouse per tenant, enters destination at **receive** (`TRANSFER_IN`). `reserved_quantity` is set at approval and released at dispatch. Shortages at receive create a discrepancy adjustment with approval. Inventory account unchanged by transfers (same tenant); inter-branch cost centres are reporting-only.
- Put-away rules and pick lists (FEFO by location), packing, dispatch notes.
- Recall: batch status `RECALLED` blocks sale; recall report lists current stock by warehouse/location, affected purchases, affected sales with customers; dispositions (return to supplier, destroy) as purchase return or adjustment with reason `RECALL`.
- Location-aware stocktake with blind counts and recount rounds.
- Warehouse Manager role.

Tickets: PP-WH-001 location workflows and put-away · 002 transfers request/approve · 003 picking · 004 dispatch · 005 receiving + discrepancies · 006 in-transit reporting · 007 recall · 008 location stocktake · 009 warehouse reports.

## P3-B Mobile (sprints 21–23)

React Native + Expo consuming the same API with 30-day tokens.

Screens: login, role dashboard, product lookup, camera barcode scan (GS1 parsing in P3), inventory/batch/expiry view, purchase order review/approve, adjustment/transfer approvals, stocktake counting (offline-tolerant count buffer synced on connectivity), push notifications (Expo push via `NotificationChannel`).

Tickets: PP-MOB-001…011 as in the original plan.

## P3-C Desktop and offline POS (sprints 24–26)

Only after the online POS is stable in production.

Design notes:
- Tauri shell wrapping `apps/web` with native printing (ESC/POS via local bridge) and cash drawer kick.
- Offline: local SQLite cache of products, units, barcodes, prices, batches and balances for the terminal's warehouse; offline sales queued with client-generated ULIDs and `Idempotency-Key`; sync posts queued sales in order; server remains authoritative for allocation, so an offline sale may be re-allocated to a different batch or rejected on sync — rejected sales go to a reconciliation queue for a manager.
- Never silently overwrite server data; conflicts are surfaced.

Tickets: PP-DESK-001 Tauri shell · 002 installer · 003 local cache · 004 offline queue · 005 sync engine · 006 conflict UI · 007 printer/drawer integration.

## Platform and commercial (ongoing)

Self-service signup, subscription plans and billing, usage limits (users, branches, storage), tenant export (full data export in CSV/JSON on request), data retention policies, public API keys for third-party integrations with scoped abilities, webhook subscriptions for `SalePosted`, `PurchasePosted`, `PaymentRecorded`.
