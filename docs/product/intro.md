# Deals — Concepts & Data Model

This document covers the foundational concepts, definitions, and data model that power the Deals ecosystem. It is intended for anyone who needs to understand how Huspy processes transactions and accounts for them.

---

## Scope

**The Deals ecosystem handles:**
- Deal intake and validation (documents, stakeholder identity)
- P&L and commission calculation (dynamic agent structures: slabs, caps, flat)
- Receivables and payables (invoicing clients, receiving agent invoices)
- Accounting (double-entry ledgers for all financial events)

**It does not handle:**
- Property searching or CRM lead generation (handled upstream in Salesforce/Pipedrive)
- Corporate payroll for salaried employees

---

## Goal

- Standardize P&L and agent payout structures across all markets and business units
- Eliminate manual spreadsheet tracking and reduce payout errors
- Create fully auditable, double-entry financial records for every event
- Give agents real-time visibility into their deal pipeline, commission breakdowns, and invoice lifecycle

---

## Accounting Primer

Every financial event in the Deals ecosystem creates a balanced double-entry posting. Two fundamental concepts underpin the model:

**Account types:**
- **Assets** — money we own or are owed (Bank Account, Accounts Receivable)
- **Liabilities** — money we owe others (VAT payable, Agent commission owed)
- **Revenue** — money we earn (Commission Income)
- **Expenses** — costs of doing business (Commission Expense paid to agents)

**Debit vs Credit:**
- To increase an Asset or Expense → **Debit**
- To increase a Liability or Revenue → **Credit**
- Every posting must balance: total debits = total credits

**Example — Deal finalized, agent gets 40% of €10,000 commission:**

| | DR | CR |
|---|---|---|
| Commission Expense | €4,000 | |
| Agent Liability subledger | | €4,000 |

The ledger stays balanced; Finance knows exactly what Huspy owes the agent.

---

## Key Entities

### Party
The central identity record. Every person or organisation in the system — buyer, seller, agent, bank, developer, notary — is a `Party`. Deduplicated using `taxId` (NIE in Spain, Emirates ID in UAE). Before creating a new Party, always look up by `taxId` first.

### Deal
The central transaction record. Holds high-level metadata (status, deal amount, market, BU, country). Delegates all financial specifics to its stakeholders.

### DealStakeholder
Links a `Party` to a `Deal` with a specific **financial or identity role**. Financial roles drive the P&L waterfall; identity roles (DEMAND, SUPPLY) record who the parties to the transaction are without affecting calculations.

| Role | Meaning |
|---|---|
| `REVENUE_SOURCE` | Party paying Huspy. Their `financialAmount` is Huspy's gross revenue. |
| `INTERNAL_PAYOUT` | Huspy agent. Commission calculated from `AgentFinancials.strategy`, not entered manually. |
| `ACQUISITION_DEDUCTION` | External commercial partner (co-broker, referral). Deducted from gross. |
| `OPERATIONAL_DEDUCTION` | Fixed service cost (notary, conveyance). Deducted from gross. |
| `DEMAND` | Buyer, tenant, or borrower. Identity role only — not part of the financial waterfall. First DEMAND entry is the canonical source for the deal's client name. |
| `SUPPLY` | Seller, developer, or lender. Identity role only — not part of the financial waterfall. |

### Invoice
The billing instrument. An invoice collects one or more uninvoiced `PostingLine` entries — once submitted, each line is linked to the invoice and cleared from the agent's pending balance. Two directions:

| Direction | Who sends it | Cash flow |
|---|---|---|
| `outbound` | Huspy bills the client (buyer, developer, bank, tenant) | Huspy collects |
| `inbound` | Agent or vendor bills Huspy | Huspy pays |

### Ledger, Posting, PostingLine
Double-entry accounting primitives:
- **Ledger** — a specific account in the chart of accounts (e.g. `ASSET_AR_EUR`, `LIAB_VAT_EUR`). Agents get individual subledgers: `AgentLiability_agent-{slug}`.
- **Posting** — a record of a business event (e.g. `invoice_issued`, `commission_accrual`). Groups multiple lines.
- **PostingLine** — the individual debit or credit applied to a specific Ledger. Every posting's lines must sum to zero.

---

## P&L Waterfall

The waterfall engine calculates deal profitability dynamically from its `DealStakeholders`. Applied in order:

1. **Gross Revenue** — sum of `REVENUE_SOURCE` stakeholder amounts
2. **Minus Acquisition Deductions** — `ACQUISITION_DEDUCTION` stakeholders (external partners, referrals)
3. **Minus Operational Deductions** — `OPERATIONAL_DEDUCTION` stakeholders (notary, conveyance, legal)
4. **Net Revenue** = Gross − Acquisition − Operational
5. **Minus Agent Payouts** — calculated from each agent's `AgentFinancials.strategy`
6. **Huspy Margin** = Net Revenue − Agent Payouts

A stakeholder can carry a `parentStakeholderId`, linking it to another stakeholder. This is used when a deduction is funded from an agent's own commission rather than from Huspy directly — e.g. a referral fee paid out of the referring agent's cut.

Tax (Blueprint tax) is handled separately via country/BU configuration and never appears as a manually declared stakeholder.

**Example — €500,000 property, Spain:**

| Line | Amount |
|---|---|
| Gross Revenue (3% take rate) | €15,000 |
| External broker fee (Acquisition Deduction) | −€3,000 |
| Net Revenue | €12,000 |
| Agent payout (flat 50%) | −€6,000 |
| **Huspy Margin** | **€6,000** |

### Agent Commission Strategies

| Kind | Behaviour |
|---|---|
| `flat` | Fixed % of the agent's share of net revenue |
| `slab` | Progressive tiers — each % applies to the slice between thresholds |
| `max` | Flat % capped at a maximum amount |

---

## Chart of Accounts

One set of GL accounts per currency (EUR, AED, SAR). Business unit attribution is a dimension on the Posting, not embedded in ledger names.

| Ledger pattern | Type | Notes |
|---|---|---|
| `ASSET_BANK_BankX_{CUR}` | Asset | Operating bank account |
| `ASSET_AR_{CUR}` | Asset | Client accounts receivable |
| `LIAB_AGENT_{CUR}` | Liability | Control account — GL parent for all agent subledgers |
| `LIAB_PAYABLE_{CUR}` | Liability | External partner payable (vendors, co-brokers) |
| `LIAB_VAT_{CUR}` | Liability | VAT collected and payable to tax authority |
| `LIAB_WITHHOLDING_TAX_{CUR}` | Liability | Withholding tax payable (IRPF in Spain) |
| `REV_{CUR}` | Revenue | All commission and fee revenue |
| `EXP_COMMISSION_{CUR}` | Expense | Agent commission expense (gross) |
| `AgentLiability_agent-{slug}` | Liability | Subledger per agent |

### Blueprint Tax (per country)

Applied automatically at deal close — never declared as a stakeholder.

| Country | Tax | Rate |
|---|---|---|
| Spain | IVA (client invoice) | 21% |
| Spain | IRPF (agent withholding) | 19% |
| UAE | VAT (both sides) | 5% |
| Saudi Arabia | VAT (client invoice) | 15% |
