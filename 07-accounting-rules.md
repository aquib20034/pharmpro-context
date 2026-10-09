# 07 — Accounting Rules

PharmaPro keeps true double-entry books with perpetual inventory. Every posted document produces exactly one journal entry (plus one per payment) through `JournalBuilder`. Nothing in the frontend computes accounting.

The rules below are the defaults shipped with the product. Tenants can remap which account a `system_key` points to, but cannot change *which* system keys a document posts to. A client's accountant should review these before financial sign-off (see §10).

## 1. Principles

1. `SUM(debit) = SUM(credit)` on every posted entry, checked at 4 dp before insert.
2. Posted entries are immutable. Corrections: original → reversal (mirror entry, `reversal_of_id`) → new entry.
3. Journals carry `business_date`, `fiscal_period_id`, `source_type`, `source_id`. The period must be open and the date after the tenant lock date.
4. Sub-ledgers: AR and AP balances per counterparty are derived from `journal_lines` where `account.system_key IN ('ar','ap')` and `counterparty_*` is set. Supplier/customer "balance" fields shown in UI are read models of this, verified nightly.
5. Inventory valuation method: **specific identification by batch** (D-04). Inventory account balance must equal `SUM(inventory_balances.quantity × batch.unit_cost)` ± rounding; verified nightly.
6. Revenue is recognised net of discounts; discount totals are kept on documents for reporting.
7. Tax collected on sales is a liability; tax paid on purchases is an asset if recoverable, otherwise part of inventory cost.

## 2. Default chart of accounts

Codes are 4-digit; `system_key` marks accounts the engine posts to (cannot be deleted or re-typed). Tenants may add sub-accounts and non-system accounts freely.

| Code | Name | Type | Normal | system_key |
| --- | --- | --- | --- | --- |
| **1000** | **Assets** | group | | |
| 1010 | Cash in Hand | asset | Dr | `cash` |
| 1020 | Bank | asset | Dr | `bank` |
| 1030 | Mobile Wallets (JazzCash / Easypaisa) | asset | Dr | `wallet` |
| 1040 | Card Receivable (acquirer settlement) | asset | Dr | `card_clearing` |
| 1100 | Accounts Receivable | asset | Dr | `ar` |
| 1200 | Inventory | asset | Dr | `inventory` |
| 1300 | Input Tax Receivable | asset | Dr | `input_tax` |
| 1400 | Supplier Advances | asset | Dr | `supplier_advance` |
| 1900 | Other Current Assets | asset | Dr | |
| **2000** | **Liabilities** | group | | |
| 2100 | Accounts Payable | liability | Cr | `ap` |
| 2200 | Sales Tax Payable | liability | Cr | `output_tax` |
| 2300 | Customer Advances / Credit Notes | liability | Cr | `customer_advance` |
| 2900 | Other Current Liabilities | liability | Cr | |
| **3000** | **Equity** | group | | |
| 3100 | Owner Capital | equity | Cr | `capital` |
| 3200 | Owner Drawings | equity | Dr | `drawings` |
| 3300 | Retained Earnings | equity | Cr | `retained_earnings` |
| 3900 | Opening Balance Equity | equity | Cr | `obe` |
| **4000** | **Revenue** | group | | |
| 4100 | Sales Revenue | revenue | Cr | `sales_revenue` |
| 4200 | Sales Returns (contra) | revenue | Dr | `sales_returns` |
| 4900 | Other Income | revenue | Cr | `other_income` |
| **5000** | **Cost of Sales** | group | | |
| 5100 | Cost of Goods Sold | cogs | Dr | `cogs` |
| 5200 | Inventory Shrinkage / Count Variance | cogs | Dr | `inventory_variance` |
| 5300 | Damaged & Expired Stock Loss | cogs | Dr | `stock_loss` |
| 5400 | Purchase Return Variance | cogs | Dr | `purchase_variance` |
| 5900 | Rounding Differences | cogs | Dr | `rounding` |
| **6000** | **Operating Expenses** | group | | |
| 6100 | Rent | expense | Dr | |
| 6200 | Salaries & Wages | expense | Dr | |
| 6300 | Utilities | expense | Dr | |
| 6400 | Bank & Wallet Charges | expense | Dr | `bank_charges` |
| 6900 | Other Expenses | expense | Dr | |

Payment methods map to one of `cash`, `bank`, `wallet`, `card_clearing` accounts (or any tenant account of type asset). The `credit` payment method has no account; it posts to `ar`.

## 3. Notation

`Dr X / Cr Y` lines are listed with the amount expression. All amounts come from the posted document's snapshotted lines. "net" = after line and proportional invoice discounts, excluding tax.

## 4. Postings by document

### 4.1 Opening balances

Opening stock import (per import):
```text
Dr inventory              Σ(base_qty × unit_cost)
Cr obe                    same
```
Supplier opening balance (per supplier, counterparty set):
```text
Dr obe / Cr ap            opening_balance
```
Customer opening balance:
```text
Dr ar / Cr obe            opening_balance
```

### 4.2 Purchase posting

For a purchase with net goods value `G` (Σ line net incl. value of paid goods; free goods add 0), recoverable tax `Tr`, non-recoverable tax `Tn`, rounding `R`, total `G + Tr + Tn + R`:

```text
Dr inventory              G + Tn
Dr input_tax              Tr
Dr/Cr rounding            R (sign as needed)
Cr ap  (credit purchase, counterparty = supplier)   total
  — or —
Cr <payment method account> (cash purchase)         total
```
A cash purchase also creates a `payments` row (direction `out`) fully allocated to the purchase so supplier history is complete.

Batch cost after posting follows `03-domain-rules.md §2.3`; the inventory debit uses the line's `effective_unit_cost × (base_qty + free_base_qty)`, which equals the line's share of `G + Tn` by construction.

### 4.3 Supplier payment

```text
Dr ap (counterparty = supplier)     allocated amount
Dr supplier_advance                 unallocated remainder (if any)
Cr <payment method account>         payment amount
```
When an advance is later allocated: `Dr ap / Cr supplier_advance`.

### 4.4 Purchase return

Return value `V = Σ(base_qty × original effective_unit_cost)`, tax `T` at original rate, batch cost now `c` (may differ after re-receipts):
```text
Dr ap (counterparty)  or  Dr <payment method account>   V + T
Cr inventory                                            Σ(base_qty × c)
Cr input_tax                                            T
Dr/Cr purchase_variance                                 Σ(base_qty × (c − original cost))   (balancing)
```

### 4.5 Sale posting

Totals: net revenue `N`, output tax `T`, rounding `R`, total `N + T + R`; tenders by method `Pm`; credit portion `C`; change given `Ch` (reduces cash); COGS `K = Σ allocations(base_qty × batch unit_cost)`.

```text
Dr <method account> for each non-credit tender        Pm
Cr cash                                               Ch   (change)
Dr ar (counterparty = customer)                       C
Cr sales_revenue                                      N
Cr output_tax                                         T
Dr/Cr rounding                                        R
Dr cogs                                               K
Cr inventory                                          K
```
Card tenders post to `card_clearing`; the settlement to bank and acquirer fee are recorded later by a manual journal or a P2 settlement feature (`Dr bank, Dr bank_charges / Cr card_clearing`).

Each non-credit tender also creates a `payments` row (direction `in`, counterparty = customer, source = sale tender) allocated to the sale, so customer statements and cash reports have one source.

### 4.6 Sales return

Per line at original effective price `p`, tax at original rate, original unit cost `c0` (from `sale_line_allocations`, weighted if multiple):

```text
Dr sales_returns                                      Σ(base_qty × p)      (net)
Dr output_tax                                         T
Cr <refund method account>  or  Cr ar (counterparty)  Σ + T                (refund or AR credit)
RESTOCK lines:   Dr inventory / Cr cogs               base_qty × c0
WRITE_OFF lines: Dr stock_loss / Cr cogs              base_qty × c0
```
If the refund is "AR credit" and the customer's AR goes negative, the customer simply holds a credit balance (shown as advance in statements); no separate credit-note document in MVP.

### 4.7 Stock adjustment

Per line, value `v = base_qty × unit_cost`:

| Reason / direction | Entry |
| --- | --- |
| `COUNT_CORRECTION` IN | Dr inventory / Cr inventory_variance |
| `COUNT_CORRECTION` OUT | Dr inventory_variance / Cr inventory |
| `DAMAGE`, `EXPIRY` OUT | Dr stock_loss / Cr inventory |
| `THEFT` OUT | Dr inventory_variance / Cr inventory |
| `OTHER` IN/OUT | Dr inventory / Cr inventory_variance (or mirror); note required |

Stocktake completion posts one adjustment with reason `COUNT_CORRECTION`.

### 4.8 Customer payment (receipt against AR)

```text
Dr <payment method account>           amount
Cr ar (counterparty = customer)       allocated amount
Cr customer_advance                   unallocated remainder
```
Later allocation of an advance: `Dr customer_advance / Cr ar`.

### 4.9 Void (same day)

A void posts the exact mirror of the sale's journal (and of its tender payments, as reversed payments), restores stock via `REVERSAL` movements at the allocation costs, and sets the sale to `voided`. The reversal journal references the original.

### 4.10 Manual journal and expense voucher

Manual journals: any accounts, must balance, require `accounting.journal.post`. Expense voucher is a UI shortcut producing `Dr <expense account> / Cr <payment method account>`.

### 4.11 Owner drawings and capital

Via manual journal in MVP (`Dr drawings / Cr cash`; `Dr cash / Cr capital`). Dedicated UI is P2.

## 5. Fiscal periods

- Fiscal year start month defaults to July (Pakistan); configurable per tenant before the first posting.
- Periods are monthly. Closing a period blocks postings dated in it; reopening requires `accounting.periods.manage` and is audited.
- Lock date: nothing may be posted on or before it, regardless of period status.
- Year-end close (P2): transfer revenue/COGS/expense balances to `retained_earnings`. In MVP, P&L reports compute by date range and the balance sheet computes current-year earnings on the fly.

## 6. Financial statements (MVP definitions)

- **Trial balance**: per account, opening balance at range start, period debits, period credits, closing balance; totals must balance.
- **P&L**: Revenue (4100 − 4200 + 4900) − Cost of sales (5xxx) = Gross profit; − Operating expenses (6xxx) = Net profit. Date range on `business_date`.
- **Balance sheet**: Assets = Liabilities + Equity, where Equity includes computed current-period earnings (Revenue − Costs − Expenses from fiscal year start to the as-of date) when no year-end close has been posted.
- **AR / AP aging**: open documents by counterparty bucketed 0–30, 31–60, 61–90, 90+ days from due date (configurable buckets), minus allocations.
- **Statements**: opening balance, chronological documents and payments, running balance, closing balance for a date range.
- **Cash flow** (P2): classified from account groups and payment methods.

## 7. Reconciliation jobs (scheduled nightly, alert on mismatch)

1. Inventory account balance vs Σ(balance qty × batch cost).
2. AR account balance vs Σ customer sub-ledger; AP likewise.
3. Σ `payments.unallocated_amount` vs advances accounts.
4. Every posted document has exactly one posted journal and vice versa.
5. Every journal balances (defensive).

## 8. Reports needed by accountants in Pakistan (notes)

Sales tax treatment for pharmaceuticals varies (many items exempt or zero-rated; some taxed). PharmaPro models this through tax categories and never assumes a rate. Withholding taxes on supplier payments are P2 (would post `Dr ap / Cr withholding_payable`).

## 9. Worked example (UAT multi-cost scenario)

1. Purchase 100 tablets Batch A @ PKR 10 (credit): `Dr inventory 1,000 / Cr ap 1,000`.
2. Purchase 100 tablets Batch B @ PKR 15 (credit), expiry later than A: `Dr inventory 1,500 / Cr ap 1,500`.
3. Sell 120 tablets @ PKR 20 cash, 0% tax. FEFO allocates 100 from A and 20 from B; `sale_line_allocations` records both. `Dr cash 2,400 / Cr sales_revenue 2,400`; COGS = 100×10 + 20×15 = 1,300: `Dr cogs 1,300 / Cr inventory 1,300`. Inventory account = 1,200 = 80 remaining × 15 ✓.
4. Return 10 tablets with disposition RESTOCK. The return line is matched to one allocation of the original line; default is the allocated batch with the latest expiry (B), user may choose another allocated batch. Stock returns to B at B's allocation cost (15): `Dr sales_returns 200 / Cr cash 200`; `Dr inventory 150 / Cr cogs 150`. Inventory account = 1,350 = 90 × 15 ✓.

Rule illustrated: a sales return always reverses cost at the **allocation cost of the specific batch it is restocked to**, never at a weighted or current cost. Without `sale_line_allocations` the inventory account and the stock valuation would drift apart.

## 10. Production warning

Tax treatment, valuation, fiscal periods and statement layouts must be reviewed with the client's accountant/tax adviser before production financial sign-off. Anything they change is a configuration or a documented rule change here, never an ad-hoc code path.
