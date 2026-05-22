<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692 -->

This page explains how the core entities in the Deals system connect to each other. It is the authoritative reference for anyone building on, integrating with, or reasoning about the data model.

# 1. Entity Relationship Diagram

```
erDiagram
    Party {
        string id
        string taxId
        string displayName
        string country
    }
    Deal {
        string id
        DealStatus status
        string market
        BusinessUnit businessUnit
        Country country
        number dealAmount
    }
    DealStakeholder {
        string id
        string dealId
        string partyId
        StakeholderType role
        number financialAmount
        number splitPercentage
        string parentStakeholderId
    }
    Agent {
        string id
        string partyId
        Country country
        string employmentType
    }
    AgentFinancials {
        string agentId
        AgentStrategy strategy
    }
    Invoice {
        string id
        string direction
        string partyId
        string dealId
        InvoiceStatus status
        number subtotal
        number vatAmount
        number withholdingAmount
    }
    Posting {
        string id
        string dealId
        BusinessProcess businessProcess
        string valueDate
        Currency currency
    }
    PostingLine {
        string id
        string postingId
        number ledgerId
        PostingSide side
        number amount
        string invoiceId
    }
    Ledger {
        number id
        string name
        LedgerType type
        boolean isControlAccount
        number glId
        string partyId
    }
    DealDocumentRequirement {
        string id
        string dealId
        string label
        DocumentRequirementStatus status
    }
    DealComment {
        string id
        string dealId
        string authorRole
        string body
    }

    Party ||--o{ DealStakeholder : "plays role in"
    Deal   ||--o{ DealStakeholder : "has"
    DealStakeholder }o--o| DealStakeholder : "funded by parent"
    Party ||--o| Agent : "is"
    Agent  ||--o| AgentFinancials : "has commission structure"
    Agent  ||--o| Ledger : "owns subledger"
    Deal   ||--o{ Invoice : "has"
    Party  ||--o{ Invoice : "counterparty on"
    Deal   ||--o{ Posting : "triggers"
    Posting ||--|{ PostingLine : "contains"
    PostingLine }o--|| Ledger : "posts to"
    PostingLine }o--o| Invoice : "settled by"
    Ledger  }o--o| Ledger : "subledger of (glId)"
    Deal ||--o{ DealDocumentRequirement : "requires"
    Deal ||--o{ DealComment : "has"
```

# 2. Key Entities

| Entity | One-line summary |
| --- | --- |
| `Party` | Single identity record for every person or organisation — deduplicated by `taxId`. |
| `Deal` | Central transaction record: status, amount, market, BU, country. |
| `DealStakeholder` | Links a Party to a Deal with a financial or identity role; drives the P&L waterfall. |
| `Invoice` | Billing instrument — outbound (Huspy bills client) or inbound (agent/vendor bills Huspy). |
| `Posting` / `PostingLine` | Double-entry primitives — every business event creates a balanced posting across one or more ledger accounts. |
| `Ledger` | A GL account or agent subledger in the chart of accounts. |

## P&L Waterfall

The waterfall engine calculates deal profitability dynamically from its `DealStakeholders`. Applied in order:

1. **Gross Revenue** — sum of `REVENUE_SOURCE` stakeholder amounts (all services charged by Huspy)
2. **Minus Acquisition Deductions** — `ACQUISITION_DEDUCTION` stakeholders (external partners, referrals)
3. **Minus Operational Deductions** — `OPERATIONAL_DEDUCTION` stakeholders (notary, conveyance, legal)
4. **Net Revenue** = Gross − Acquisition − Operational
5. **Minus Agent Payouts** — calculated from each agent's `AgentFinancials.strategy`
6. **Huspy Margin** = Net Revenue − Agent Payouts

A stakeholder can carry a `parentStakeholderId`, linking it to another stakeholder. This is used when a deduction is funded from an agent's own commission rather than from Huspy directly — e.g. a referral fee paid out of the referring agent's cut.

Tax (Blueprint tax) is handled separately via country/BU configuration and never appears as a manually declared stakeholder.

**Example — €500,000 property, Spain, Agent has 50% rate:**

| Line | Amount |
| --- | --- |
| Gross Revenue (3% take rate) | €15,000 |
| External broker fee (Acquisition Deduction) | −€3,000 |
| Net Revenue | €12,000 |
| Agent payout (flat 50%) | −€6,000 |
| **Huspy Margin** | **€6,000** |

### Agent Commission Strategies

| Kind | Behaviour |
| --- | --- |
| `flat` | Fixed % of the agent's share of net revenue |
| `slab` | Progressive tiers — each % applies to the slice between thresholds |
| `max` | Flat % capped at a maximum amount |

## Chart of Accounts

One set of GL accounts per currency (EUR, AED, SAR). Business unit attribution is a dimension on the Posting, not embedded in ledger names.

| Ledger pattern | Type | Notes |
| --- | --- | --- |
| `ASSET_BANK_BankX_{CUR}` | Asset | Operating bank account |
| `ASSET_AR_{CUR}` | Asset | Client accounts receivable |
| `LIAB_AGENT_{CUR}` | Liability | Control account — GL parent for all agent subledgers |
| `AgentLiability_agent-{slug}` | Liability | Subledger per agent |
| `LIAB_PAYABLE_{CUR}` | Liability | External partner payable (vendors, co-brokers) |
| `LIAB_VAT_{CUR}` | Liability | VAT collected and payable to tax authority |
| `LIAB_WITHHOLDING_TAX_{CUR}` | Liability | Withholding tax payable (IRPF in Spain) |
| `REV_{CUR}` | Revenue | All commission and fee revenue |
| `EXP_COMMISSION_{CUR}` | Expense | Agent commission expense (gross) |

# 2. How the Entities Connect

### Party — the identity anchor

`Party` is the single identity record for every person or organisation in the system: buyer, seller, developer, bank, notary, agent. Deduplicated by `taxId` (NIE in Spain, Emirates ID in UAE). All other entities that represent a person point here — `Agent`, `DealStakeholder`, and `Invoice` all carry a `partyId`.

### Deal → DealStakeholder → Party

A `Deal` has no notion of "who is involved" by itself. All financial and identity participants are expressed as `DealStakeholders`. Each stakeholder links a `Party` to the deal with a role:

| Role | Effect on waterfall |
| --- | --- |
| `REVENUE_SOURCE` | Adds to gross revenue |
| `INTERNAL_PAYOUT` | Agent commission — calculated from `AgentFinancials.strategy` |
| `ACQUISITION_DEDUCTION` | Deducted from gross (external partner, referral) |
| `OPERATIONAL_DEDUCTION` | Deducted from gross (notary, conveyance) |
| `DEMAND` | Buyer / tenant / borrower — identity only, no financial effect |
| `SUPPLY` | Seller / developer / lender — identity only, no financial effect |

**Sub-stakeholders:** A `DealStakeholder` can carry a `parentStakeholderId`, linking it to an `INTERNAL_PAYOUT` stakeholder. When set, the cost is deducted from the parent agent's commission pool rather than from Huspy's gross revenue (e.g. a referral fee funded by the agent's own cut, not by Huspy).

### Agent → AgentFinancials → commission strategy

`Agent` is Huspy's own agent record. It extends `Party` (via `partyId`), carries the country and employment type (`commission` or `salaried`), and links to `AgentFinancials`, which stores the commission strategy:

| Strategy | How it works |
| --- | --- |
| `flat` | Fixed % of the agent's allocated commission base |
| `slab` | Progressive tiers — each rate applies to the slice between thresholds |
| `max` | Flat % capped at a maximum payout amount |

`AgentFinancials` also tracks connected agents (Team Lead, Manager) and their overhead rates, which are calculated on top of the base agent's payout.

### Deal → Invoice → PostingLine

When a deal reaches `invoicing`, an outbound `Invoice` is created linking the `Deal` to the receivable `Party`. When the agent submits a statement, an inbound `Invoice` is created linking back to the `Party` (the agent). Not all invoices are linked to specific deals (e.g. agent invoice can group multiple deals related postinglines and non)

`Invoice` is directional:

| `direction` | Who sends it | Effect |
| --- | --- | --- |
| `outbound` | Huspy → client | Huspy collects |
| `inbound` | Agent / vendor → Huspy | Huspy pays |

An invoice is settled when the `PostingLine` entries linked to it (via `invoiceId`) are cleared by a `bank_statement` posting.

### Posting → PostingLine → Ledger

Every business event creates a `Posting`, which groups one or more `PostingLine` records. Each line debits or credits a specific `Ledger`. All lines on a posting must sum to zero (balanced double-entry).

Key posting types and what they do:

| Business process | What it records |
| --- | --- |
| `invoice_issued` | DR AR / CR Revenue + CR VAT Liability (outbound); DR Expense / CR Payable (inbound) |
| `bank_statement_inbound_matched` | DR Bank / CR AR — cash received from client |
| `commission_accrual` | DR Commission Expense / CR Agent Liability — Huspy owes the agent |
| `agent_invoice_accrual` | Restructures Agent Liability into net payable + withholding tax |
| `bank_statement_outbound_matched` | DR Agent Liability / CR Bank — cash paid to agent or vendor |
| `manual_adjustment` | Finance-entered correction (bonus, reversal, platform fee) |

### Ledger → subledger hierarchy

`LIAB_AGENT_{CUR}` is a control account (marked `isControlAccount: true`). Individual agent subledgers (`AgentLiability_agent-{slug}`) point back to it via `glId`. You never post directly to a control account — always to the subledger. The control account balance equals the sum of all its subledgers.

### DealDocumentRequirement — per-deal checklist

When a deal is created, `DealDocumentRequirement` rows are instantiated from the matching `DocumentRequirementTemplate` (filtered by market, business unit, and country). Ops approves or waives each requirement in Karvel. A deal cannot advance from `under-review` to `pending-agent-approval` until all requirements are either `approved` or `waived`.

# 3. Key Invariants

* Every `Party` is unique by `taxId`. Always look up before creating.
* Every `Posting`'s lines must sum to zero. The system rejects unbalanced postings.
* `DealStakeholder` financial entries are locked once the deal leaves `under-review`.
* `invoicing → finalized` is automatic — triggered when the last outbound invoice is marked Paid, never by a manual status change.
* Agent subledger balance at any point = sum of all CREDIT lines minus DEBIT lines on that ledger = what Huspy currently owes the agent.
