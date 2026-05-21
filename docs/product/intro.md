# Deals — Concepts & Overview

This document covers the foundational concepts and accounting model that power the Deals ecosystem. For entity relationships and the full data model, see [Domain Model](./domain-model.md).

---

## Key Problems To Solve

Advisors/Collaborators don’t have visibility about the status of their payments and invoices. They constantly have to follow up with Huspy ops and finance teams which creates operational overhang and delays

Invoice mismatches for Advisors/Collaborators because of stale data in Huspy systems

Manual commission calculations, invoicing, and payments create possible delays and surface area for inaccuracies

## Scope

Deals and Payments team scope starts from an offer getting closed and ends at Huspy successfully settling payments to all parties involved and accounting the same in its books.

**The Deals ecosystem handles:**
- Deal intake and validation (documents, stakeholder identity)
- P&L and commission calculation (dynamic agent structures: slabs, caps, flat)
- Receivables and payables (invoicing clients, receiving agent invoices)
- Accounting (double-entry ledgers for all financial events)

**It does not handle:**
- Property searching or CRM lead generation (handled upstream)
- Corporate payroll for salaried employees

---

## Goal

- Standardize P&L and agent payout structures across all markets and business units
- Reduce manual spreadsheet tracking and reduce payout errors
- Create fully auditable, double-entry financial records for every event and clear deal financials data
- Give agents real-time visibility into their deal pipeline, commission breakdowns, and invoice lifecycle

---

## Accounting 101

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

| Entity | One-line summary |
|---|---|
| `Party` | Single identity record for every person or organisation — deduplicated by `taxId`. |
| `Deal` | Central transaction record: status, amount, market, BU, country. |
| `DealStakeholder` | Links a Party to a Deal with a financial or identity role; drives the P&L waterfall. |
| `Invoice` | Billing instrument — outbound (Huspy bills client) or inbound (agent/vendor bills Huspy). |
| `Posting` / `PostingLine` | Double-entry primitives — every business event creates a balanced posting across one or more ledger accounts. |
| `Ledger` | A GL account or agent subledger in the chart of accounts. |

> Full entity relationships, role tables, posting types, and invariants: [Domain Model](./domain-model.md).

---

## P&L Waterfall

The waterfall engine calculates deal profitability dynamically from its `DealStakeholders`. Applied in order:

1. **Gross Revenue** — sum of `REVENUE_SOURCE` stakeholder amounts (all services charged by Huspy)
2. **Minus Acquisition Deductions** — `ACQUISITION_DEDUCTION` stakeholders (external partners, referrals)
3. **Net Revenue** = Gross − Acquisition − Operational
4. **Minus Agent Payouts** — calculated from each agent's `AgentFinancials.strategy`
5. **Minus Operational Deductions** — `OPERATIONAL_DEDUCTION` stakeholders (notary, conveyance, legal)
6. **Huspy Margin** = Net Revenue − Agent Payouts

A stakeholder can carry a `parentStakeholderId`, linking it to another stakeholder. This is used when a deduction is funded from an agent's own commission rather than from Huspy directly — e.g. a referral fee paid out of the referring agent's cut.

Tax (Blueprint tax) is handled separately via country/BU configuration and never appears as a manually declared stakeholder.

**Example — €500,000 property, Spain, Agent has 50% rate:**

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
| `AgentLiability_agent-{slug}` | Liability | Subledger per agent |
| `LIAB_PAYABLE_{CUR}` | Liability | External partner payable (vendors, co-brokers) |
| `LIAB_VAT_{CUR}` | Liability | VAT collected and payable to tax authority |
| `LIAB_WITHHOLDING_TAX_{CUR}` | Liability | Withholding tax payable (IRPF in Spain) |
| `REV_{CUR}` | Revenue | All commission and fee revenue |
| `EXP_COMMISSION_{CUR}` | Expense | Agent commission expense (gross) |

### Blueprint Tax (per country)

Applied automatically at deal close — never declared as a stakeholder.

| Country | Tax | Rate |
|---|---|---|
| Spain | IVA (client invoice) | 21% |
| Spain | IRPF (agent withholding) | 19% |
| UAE | VAT (both sides) | 5% |
| Saudi Arabia | VAT (client invoice) | 15% |
