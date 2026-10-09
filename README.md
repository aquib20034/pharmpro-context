# PharmaPro Specification — Index

This folder is the single source of truth for PharmaPro. The specification was consolidated from the original idea document (`context/idea.txt`), then gap-filled. Every gap that required a decision is recorded in `15-decision-log.md` so it can be reviewed and overturned before code depends on it.

## Reading order

1. `00-master-plan.md` — vision, architecture, stack, phases, Definition of Done
2. `01-mvp-scope.md` — exactly what ships in the MVP and what does not
3. `02-srs-business-requirements.md` — functional requirements, numbered
4. `03-domain-rules.md` — the invariants the code must never violate
5. `04-database-design.md` — ERD, tables, constraints, indexes, concurrency
6. `05-api-architecture.md` — conventions, auth, error format, endpoints, services
7. `06-permissions-matrix.md` — permission keys and default role mapping
8. `07-accounting-rules.md` — chart of accounts and journal postings per document
9. `08-frontend-design-system.md` — Next.js stack, navigation, POS UX, form/table rules
10. `09-modules-and-tickets.md` — implementable tickets with acceptance criteria
11. `10-sprint-plan.md` — MVP-first sprint order
12. `11-security-testing-deployment.md`
13. `12-demo-uat-checklist.md`
14. `13-post-mvp-roadmap.md` — communication, advanced procurement, warehouse, mobile, desktop/offline
15. `14-commercial-scope-notes.md` — pricing and contract notes (not an engineering document)
16. `15-decision-log.md` — architecture/business decisions made to fill gaps
17. `16-engineering-standards.md` — layering, naming, PII, logging, error notification to developers

The original "Cursor agent rules" document became real rule files in `.cursor/rules/` (`pharmapro-core.mdc` always on; `laravel-api.mdc` and `nextjs-web.mdc` scoped by path).

## Tagging conventions used across documents

- `[MVP]` — required for the MVP release
- `[P2]` — Phase 2 (Distributor mode, advanced procurement, communications)
- `[P3]` — Phase 3 (warehouse operations, mobile, desktop/offline)
- Requirement IDs: `FR-<area>-<nn>` (e.g. `FR-INV-04`)
- Ticket IDs: `PP-<MODULE>-<nnn>` (e.g. `PP-INV-004`)
- Decisions: `D-<nn>`

## Glossary

| Term | Meaning |
| --- | --- |
| Tenant | One customer business (pharmacy, distributor, warehouse operator). All business data is tenant-scoped. |
| Branch | A physical business site of a tenant. Sales happen at a branch. |
| Warehouse | A stock-holding location belonging to a branch. A branch has at least one warehouse (the shop floor). |
| Location | Optional sub-division of a warehouse: zone, rack, shelf, bin. |
| Product | Catalog definition of an item (e.g. Panadol 500mg Tablet). Never holds stock quantity itself. |
| Base unit | The smallest unit a product is tracked and sold in (e.g. tablet). All stock quantities are stored in base units. |
| Product unit | A sellable/purchasable unit of a product with a factor to base (e.g. strip = 10, box = 100). |
| Batch | A specific manufactured lot of a product with its own batch number, expiry and cost. Stock always belongs to a batch. |
| Inventory balance | Fast-read projection of stock per warehouse/location/product/batch. Derived from movements. |
| Inventory movement | Append-only record of a stock change. The authoritative stock history. |
| FEFO | First Expiry, First Out — default batch allocation for sales. |
| MRP | Maximum Retail Price printed on the pack; in PharmaPro stored per batch. |
| Posting | The irreversible act of committing a document (sale, purchase, payment, journal) so it affects stock and ledger. |
| Reversal | A new document that undoes a posted one. Posted documents are never edited or deleted. |
| AR / AP | Accounts Receivable (customers owe us) / Accounts Payable (we owe suppliers). |
| COGS | Cost of goods sold, computed from the batch cost at the time of sale. |
| Disposition | What happens to returned stock: restock or write-off (quarantine in P3). |
| Business date | The tenant-local calendar date a document belongs to; used for numbering, reports and fiscal periods. |
