# 14 — Commercial Scope Notes

Not an engineering document. Kept with the specification so that what is sold matches what is built. Figures are the original indicative numbers and need commercial validation.

## 1. Indicative offers

| Offer | Subscription | One-time ("own the software") | Maps to |
| --- | --- | --- | --- |
| Starter Pharmacy | PKR 12,000 / month | PKR 450,000 | MVP, 1 branch, up to 3 users |
| Professional ERP | PKR 24,000 / month | PKR 850,000 | MVP + P2-A communication, up to 3 branches, 10 users |
| Distributor | PKR 48,000 / month | PKR 1,400,000 | + P2-B distributor mode, multiple warehouses |
| Enterprise | PKR 80,000 / month and up | PKR 2,200,000 and up | + P3 warehouse, mobile, desktop/offline, SLA |

## 2. Subscription must state

Hosting included or not · update policy (standard updates included; major new modules may be priced) · maintenance window · support hours and channel · backup frequency and retention · number of users, branches, warehouses · storage quota · third-party messaging charges (SMS/WhatsApp per message, passed through) · data export on termination · uptime commitment.

## 3. One-time ownership must state

"Own the software" is ambiguous unless the contract defines:

- Agreed scope: reference `01-mvp-scope.md` and the SRS version/date.
- Source-code ownership versus perpetual licence; whether the vendor may reuse the platform for other clients (recommended: client receives a perpetual, non-exclusive licence plus source escrow; vendor retains ownership of the platform).
- Deployment rights (self-host allowed? how many instances?).
- Hosting: who hosts, who pays infra, who holds credentials.
- Third-party services (Vercel, S3, WhatsApp, SMS, Sentry) are the client's accounts or billed through.
- Warranty period (e.g. 90 days defect fixing after UAT sign-off) and what counts as a defect versus a change.
- Maintenance/support plan after warranty (priced separately).
- Future enhancements: change-request process and rates.
- Mobile and desktop scope: explicitly in or out.
- SLA: response and resolution targets by severity.

Do not promise unlimited future development or unlimited support unless contractually priced.

## 4. Implementation services (priced separately)

Data migration from legacy software (mapping, cleansing, import), on-site training, custom report development, custom integrations, hardware procurement (scanners, thermal printers, cash drawers).

## 5. Dependencies on the client

Accountant sign-off on `07-accounting-rules.md` before go-live · supplier of clean opening stock data · WhatsApp Business account verification · tax registration details · hardware availability for UAT.
