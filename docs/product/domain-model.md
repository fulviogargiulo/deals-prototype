<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692 -->

This page explains how the core entities in the Deals system connect to each other. It is the authoritative reference for anyone building on, integrating with, or reasoning about the data model.

# 1. Entity Relationship Diagram

```
erDiagram
    Party {
        string id
        string displayName
        string email
        string phone
        string legalType
        string taxId "dedup key (optional)"
    }
    Agent {
        string id
        string partyId FK
        string employmentStatus
    }
    AgentFinancials {
        string id
        string agentId FK
        PnlEngine pnlEngine "rebu | mbu-ma-broker | mbu-direct"
        AgentStrategy strategy
        ConnectedAgent[] connectedAgents "team lead, manager, etc."
        number byobPenaltyRate "BYOB only — pct points off slab rate"
        string effectiveFrom
    }
    AgentDocument {
        string id
        string agentId FK
        AgentDocumentType documentType
        string kind "file | text"
        DocumentRequirementStatus status
        string expiresAt
    }
    Client {
        string id
        string partyId FK
        string status
        string verificationStatus
        string source
    }
    Opportunity {
        string id
        string clientId FK
        string agentId FK
        OpportunityType type
        OpportunityStatus status
        string country
    }
    Property {
        string id
        string name
        Country country
        Currency currency
        string address "optional"
        string type "optional"
        string developmentName "optional"
    }
    Mortgage {
        string id
        string lenderName
        Country country
        Currency currency
        number loanAmount "optional"
        number termYears "optional"
        string productType "fixed | variable | islamic"
    }
    Asset {
        string id
        AssetType assetType "real_estate | financial_product"
        string sourceSystem "rebu | mbu"
        string sourceId FK "Property.id or Mortgage.id"
    }
    Offer {
        string id
        OfferStatus status
        Country country
        Currency currency
        string assetId FK "optional"
        string assetName "display cache"
        string opportunityId FK "optional"
        string clientId FK "optional"
        number offerAmount "optional"
        CommissionPayer commissionPayer "optional"
        number totalCommissionPct "optional"
        string buyerAgentId FK "optional — Closer"
        string sellerAgentId FK "optional — Lister"
        number buyerAgentSplitPct "optional"
        number sellerAgentSplitPct "optional"
    }
    Deal {
        string id
        string offerId FK "optional"
        string assetId FK "optional"
        number dealAmount
        Currency currency "optional"
        BusinessUnit businessUnit "optional"
        Country country "optional"
        string channel "optional"
        string clientName "display cache"
        string agentName "display cache"
    }
    Tranche {
        string id
        string dealId FK
        string label "optional — Arras, Escritura, Full"
        number index "0-based tab ordering"
        DealStatus status
        string blueprintId FK "optional"
        PnlEngine pnlEngine "optional"
        string reportDate
        string ofCaseNumber "optional"
        number disbursedAmount "optional — MBU only"
    }
    Blueprint {
        string id
        Country country
        BusinessUnit businessUnit
        DealType dealType
        number taxRate
        string taxLabel
        number withholdingRate "optional — markets with income withholding (e.g. IRPF)"
        string withholdingLabel "optional — e.g. IRPF"
    }
    DealParticipant {
        string id
        string dealId FK
        string partyId FK
        ParticipantRole role "DEMAND | SUPPLY"
        boolean isPrimary "optional"
    }
    PnlEntry {
        string id
        string trancheId FK
        string partyId FK
        PnlRole role "REVENUE_SOURCE | AGENT_PAYOUT | ACQUISITION_DEDUCTION | OPERATIONAL_DEDUCTION"
        number splitPercentage "agent pool share (0-100); rate-based engines only"
        number amount "signed: + = revenue, - = cost"
        string source "engine | manual — who wrote the amount"
        string status "draft | confirmed"
    }
    PnlEntryAudit {
        string id
        string stakeId FK
        string trancheId FK
        string field
        string oldValue
        string newValue
        string changedBy
        string changedAt
    }
    DealDocumentRequirement {
        string id
        string trancheId FK
        string label
        boolean required
        DocumentRequirementStatus status
        string documentId FK
    }
    DocumentRequirementTemplate {
        string id
        Market market
        BusinessUnit businessUnit
        Country country
        string label
        boolean required
    }
    Invoice {
        string id
        string direction "inbound | outbound"
        string partyId FK
        string trancheId FK "optional"
        string invoiceNumber
        InvoiceStatus status
        number subtotal "base commission (pre-VAT); gross = subtotal + vatAmount"
        number vatAmount "optional — VAT charged on top of base"
        number withholdingRate "optional — IRPF rate applied (agent-editable)"
        number withholdingAmount "optional — withheld by Huspy, remitted to authority"
        Currency currency
        string issueDate
        string dueDate
        string proofFileName "required when paid"
        string proofUploadedAt "required when paid"
        string paymentReference "required when paid"
        string cancelReason "required when cancelled"
        string cancelledAt "set on cancel"
    }
    Task {
        string id
        string clientId FK
        string opportunityId FK
        string assigneeId FK
        TaskStatus status
        TaskPriority priority
    }
    Document {
        string id
        string clientId FK
        string opportunityId FK
        DocumentType type
    }
    DealComment {
        string id
        string dealId FK
        string author "ops | agent"
        string authorName
        string text
        string createdAt
    }
    Ledger {
        number id
        string name
        LedgerType type
        number glId "optional FK"
        string partyId "optional FK - agent subledgers only"
        Currency currency
    }
    Posting {
        string id
        string trancheId FK "optional"
        BusinessUnit businessUnit
        string externalRef
        BusinessProcess businessProcess
        string valueDate
        Currency currency
        string reversedByPostingId FK
    }
    PostingLine {
        string id
        string postingId FK
        number ledgerId FK
        string invoiceId FK
        PostingSide side
        number amount
    }

    Party           ||--o| Agent                       : "acts as"
    Party           ||--o| Client                      : "acts as"
    Agent           ||--o{ AgentFinancials              : "has strategy"
    Agent           ||--o{ AgentDocument                : "has compliance docs"
    Client          ||--o{ Opportunity                  : "has"
    Opportunity     ||--o{ Offer                        : "produces"
    Property        |o--o{ Asset                        : "sourced by"
    Mortgage        |o--o{ Asset                        : "sourced by"
    Asset           |o--o{ Offer                        : "subject of"
    Asset           |o--o{ Deal                         : "referenced by"
    Offer           ||--o| Deal                         : "spawns"
    Deal            ||--|{ Tranche                       : "settled via"
    Deal            ||--o{ DealParticipant               : "involves (identity)"
    Tranche         ||--|{ PnlEntry                      : "involves (P&L)"
    PnlEntry        ||--o{ PnlEntryAudit                 : "audited by"
    Tranche         ||--o{ DealDocumentRequirement       : "requires"
    Tranche         ||--o{ DealComment                    : "has thread"
    Tranche         |o--o{ Posting                       : "generates"
    Tranche         |o--|{ Invoice                       : "creates"
    Blueprint       |o--o{ Tranche                       : "governs tax for"
    DocumentRequirementTemplate ||--o{ DealDocumentRequirement : "instantiates"
    Party           ||--o{ PnlEntry                      : "participates as (P&L)"
    Party           ||--o{ DealParticipant               : "participates as (identity)"
    Party           |o--o{ Ledger                        : "owns (optional)"
    Party           ||--o{ Invoice                       : "billed to/from"
    Posting         ||--|{ PostingLine                   : "has"
    Ledger          ||--o{ PostingLine                   : "receives"
    Invoice         |o--o{ PostingLine                   : "claimed by"
    Client          ||--o{ Task                          : "has"
    Opportunity     ||--o{ Task                          : "has"
    Client          ||--o{ Document                      : "has"
    Opportunity     ||--o{ Document                      : "has"
    Ledger          ||--o{ Ledger                        : "subledger of"
    Agent           ||--o{ Opportunity                   : "assigned"
```

# 2. Key Entities

| Entity | One-line summary |
| --- | --- |
| `Party` | Central identity record. `Agent` and `Client` are sub-types that link to a `Party` via `partyId`. Third parties (banks, developers, buyers, sellers) are also Parties. Deduplicated by `taxId`. Before creating a new Party record, look up by `taxId` |
| `Asset` | Lightweight deal-level bridge to the thing being transacted. Carries only `assetType` (discriminator) + `sourceSystem`/`sourceId` (redirect key to the canonical record in the BU-specific system — `Property` for REBU, `Mortgage` for MBU). Display name is cached on `Offer.assetName` / `Deal.title`. |
| `Property` | REBU source record: the real-estate unit (address, type, development). Referenced by `Asset.sourceId` when `assetType = real_estate`. |
| `Mortgage` | MBU source record: the loan product brokered by Huspy (lender, amount, term, product type). Referenced by `Asset.sourceId` when `assetType = financial_product`. |
| `Deal` | Commercial agreement header: amount, market, channel, BU, country, linked offer/asset. Carries no state machine and no P&L data of its own — all financial logic lives on its Tranches. A Deal always has at least one Tranche. |
| `Tranche` | A single financial settlement event within a Deal. Owns the state machine (`status`), P&L engine config (`pnlEngine`, `blueprintId`), report date, and all financial participants (`PnlEntry`). A Spain REBU split-payment deal has two Tranches: one for Arras (deposit commission) and one for Escritura (completion commission). |
| `DealParticipant` | Identity-only party on a Deal: `DEMAND` (buyer/tenant/borrower) and `SUPPLY` (seller/developer/bank). Deal-scoped — the buyer is the same person across Arras and Escritura Tranches. No amount, no waterfall position. |
| `PnlEntry` | One line in a Tranche's P&L waterfall. Scoped to a Tranche — two Tranches on the same Deal have independent entry sets with independent amounts and confirmation state. Role is one of `REVENUE_SOURCE`, `AGENT_PAYOUT`, `ACQUISITION_DEDUCTION`, `OPERATIONAL_DEDUCTION`. `status: "draft"` while editable; `status: "confirmed"` (immutable) from the invoicing transition onwards. |
| `Invoice` | Billing instrument scoped to a Tranche. Outbound (Huspy bills client) or inbound (agent/vendor bills Huspy). Agent invoices span multiple Tranches and are not linked to a specific Tranche. |
| `Posting` / `PostingLine` | Double-entry primitives — every business event creates a balanced posting across one or more ledger accounts. |
| `Ledger` | A GL account or agent/broker subledger in the chart of accounts. |

# 3. How the Entities Connect

### 3.1 Party - the identity anchor

`Party` is the single identity record for every person or organisation in the system: buyer, seller, developer, bank, notary, agent. Deduplicated by `taxId`. All other entities that represent a person/legal entity point here — `Agent`, `PnlEntry`, `DealParticipant`, and `Invoice` all carry a `partyId`.

### 3.2 Deal → Tranche + DealParticipant → PnlEntry → Party

A `Deal` carries two types of participants:

| Entity | Scope | Purpose |
| --- | --- | --- |
| `DealParticipant` | Deal-level | Identity only: who is the buyer (`DEMAND`) and seller/bank (`SUPPLY`). No amounts. Shared across all Tranches on the deal. |
| `PnlEntry` | Tranche-level | Financial waterfall entries: revenue sources, agent payouts, cost deductions. Each Tranche has its own independent set. |

This separation means the buyer doesn't change when you add an Escritura Tranche — only the financial amounts do.

**Why Tranche for PnlEntry?** A deal can be settled in multiple financial events. The canonical Spain REBU case is a split-payment sale: a deposit commission (Arras) is collected when the reservation contract is signed, and the completion commission (Escritura) is collected at notarisation. Each is a separate invoicing cycle with its own P&L confirmation, document checklist, and accounting entries — they are modelled as two Tranches on the same Deal. Single-payment deals simply have one Tranche.

`PnlEntry` records can be added to a Tranche at any point up to, but not including, that Tranche's transition to `invoicing` status. Each entry links a `Party` to the Tranche with a financial role:

| Role | Effect on waterfall |
| --- | --- |
| `REVENUE_SOURCE` | Adds to gross revenue. `grossRevenue` is always **derived** at runtime as the sum of all `REVENUE_SOURCE` entry amounts — it is never stored on the Tranche directly. |
| `ACQUISITION_DEDUCTION` | Deducted from gross revenue (reduces agent commission pool) |
| `AGENT_PAYOUT` | Agent commission — rate-based (splitPercentage + AgentStrategy) pre-confirmation; fixed amount (amount) post-confirmation |
| `OPERATIONAL_DEDUCTION` | Deducted from net revenues after agent splits |

**Sub-entries:** A `PnlEntry` can carry a `parentEntryId`, linking it to an `AGENT_PAYOUT` entry. When set, the cost is deducted from the parent agent's commission pool rather than from Huspy's share (e.g. a referral fee funded by the agent's own cut, not by Huspy).

**Connected agents (TL, manager) as PnlEntries:** Connected agent payouts exist as `AGENT_PAYOUT` entries from Tranche creation (`source: "engine"`, `amount` = initial engine estimate). While the Tranche is in draft, the engine re-derives their amounts live from `AgentFinancials.connectedAgents`. At confirmation (invoicing transition), the amounts are locked and the entries become first-class confirmed records. The confirmed PnlEntry table is self-contained: the full P&L can be reconstructed without consulting AgentFinancials.

**Lifecycle:** Entries are `status: "draft"` while the Tranche is editable. On the transition to `invoicing`, all entries are confirmed atomically: `amount` is locked on rate-based AGENT_PAYOUT entries, connected-agent entries are updated to confirmed. Who confirmed and when is in `tranche.statusHistory`.

### 3.3 Party → Ledger

`ledger.partyId` is optional. Most GL accounts (revenue, expense, AR, bank) are company-wide and carry no `partyId`.

Agent/brokers/MCs/DS have subledgers set under general ledger `LIAB_AGENT_{CUR}`, because Huspy carries an ongoing liability to agents across multiple deals, the subledger balance matters between payout runs.

### 3.4 Agent → AgentFinancials → commission strategy

`Agent` is Huspy's own agent/broker/MC record. It extends `Party` (via `partyId`), carries the country and employment type (`commission` or `salaried`), and links to `AgentFinancials`. `AgentFinancials` is keyed by `(agentId, pnlEngine)` — one record per engine the agent participates in. This supports multi-role agents: the same person can act as a REBU agent on some deals and a mortgage advisor (`mbu-direct`) on others, with different commission terms per role.

`connectedAgents` (team lead, manager, etc.) are configured per AF record and therefore per engine. They are auto-calculated on top of the agent's payout and never deducted from the agent's take-home.

An agent must have an AF record for the deal's engine before they can be added to a deal (validation enforced at deal creation and bulk upload). Fixed-amount stakes (`financialAmount` set) are exempt from this requirement.

### 3.5 Tranche → Invoice → PostingLine

When a Tranche reaches `invoicing`, an outbound `Invoice` is created linking the `Tranche` to the receivable `Party` (same for inbound invoices for non-agent parties). When the agent submits a statement, an inbound `Invoice` is created linking back to the `Party` (the agent) — agent invoices span multiple Tranches and are not linked to a single Tranche. Not all invoices are linked to specific Tranches (e.g. agent invoice can group multiple finalized Tranches and non-deal-specific entries).

`Invoice` is directional:

| `direction` | Who sends it | Effect |
| --- | --- | --- |
| `outbound` | Huspy → client | Huspy collects |
| `inbound` | Agent / vendor → Huspy | Huspy pays |

Entry point by invoice type:

| Type | Auto-created on deal → `invoicing`? | Entry state | Advances to `issued` when… |
| --- | --- | --- | --- |
| Outbound (Huspy → client/developer/bank) | Yes | `draft` | Finance completes (due date, VAT) and sends PDF |
| Inbound — external vendor | Yes, unless the party has an agent/broker subledger — those are settled via commission accrual posting instead | `draft` | Vendor submits their invoice; Finance validates and updates details |
| Inbound — agent | No — decoupled from deal lifecycle | `issued` | Agent submits or on schedule; no draft stage |

An invoice is settled when the `PostingLine` entries linked to it (via `invoiceId`) are cleared by a `bank_statement` posting.

`Invoice` links directly to the Party being billed (outbound) or billing Huspy (inbound).

### 3.6 Posting → PostingLine → Ledger

Every business event creates a `Posting`, which groups one or more `PostingLine` records. Each line debits or credits a specific `Ledger`. All lines on a posting must sum to zero (balanced double-entry).

Key posting types and what they do:

| `businessProcess` | Typical lines | Trigger |
| --- | --- | --- |
| `invoice_issued` | DEBIT `ASSET_AR_{CUR}` (gross = subtotal + vatAmount), CREDIT `REV_{CUR}` (subtotal), CREDIT `LIAB_VAT_{CUR}` (vatAmount). | Triggered: outbound invoice draft → issued. |
| `bank_statement_inbound_matched` | DEBIT `ASSET_BANK_BankX_{CUR}` (gross), CREDIT `ASSET_AR_{CUR}` (gross). | Triggered: outbound invoice issued → paid. |
| `commission_accrual` | DEBIT `EXP_COMMISSION_{CUR}` (gross base), CREDIT `AgentLiability_agent-{slug}` (gross base). | Triggered: deal status change, dependent on deal. No invoice exists yet, do not set `invoiceId`. |
| `agent_invoice_accrual` | DEBIT `AgentLiability_agent-{slug}` (base — clears the commission accrual debit), DEBIT `LIAB_VAT_{CUR}` (input VAT), CREDIT `LIAB_WITHHOLDING_TAX_{CUR}` (IRPF, Spain only), CREDIT `LIAB_PAYABLE_{CUR}` (net payable = base + VAT − withholding). | Triggered: agent invoice → issued. All lines tagged with `invoiceId`. |
| `external_cost_accrual` | DEBIT `EXP_COMMISSION_{CUR}` (subtotal), DEBIT `LIAB_VAT_{CUR}` (vatAmount — input VAT reduces net VAT owed), CREDIT `LIAB_PAYABLE_{CUR}` (gross). | Triggered: inbound vendor invoice draft → issued. All lines tagged with `invoiceId`. |
| `bank_statement_outbound_matched` | DEBIT `LIAB_PAYABLE_{CUR}`, CREDIT `ASSET_BANK_BankX_{CUR}`. | Triggered: inbound invoice issued → paid. Bank line is **not** tagged with `invoiceId`; payable-clearing line is tagged. |
| `manual_adjustment` | Flexible — use for standalone corrections | |
| `reversal` | Mirror of reversed posting with sides flipped; set `reversedByPostingId` | |

### 3.7 Ledger → subledger hierarchy

`LIAB_AGENT_{CUR}` is a control account (marked `isControlAccount: true`). Individual agent subledgers (`AgentLiability_agent-{slug}`) point back to it via `glId`. You never post directly to a control account — always to the subledger. The control account balance equals the sum of all its subledgers.

Key ledgers and what they do:

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

# 3. Key Invariants

* Every `Party` is unique by `taxId`. Always look up before creating.
* Every `Posting`'s lines must sum to zero. The system rejects unbalanced postings.
* `PnlEntry` records are locked once `status === "confirmed"`. Confirmation fires atomically on the Tranche's transition to `invoicing`. No P&L edits are permitted after that point.
* `invoicing → finalized` is automatic per Tranche — triggered when the last outbound invoice linked to that Tranche is marked Paid, never by a manual status change.
* Agent subledger balance at any point = sum of all CREDIT lines minus DEBIT lines on that ledger = what Huspy currently owes the agent.
