<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2411429911 -->

# 0. Intro

This process flow aims to support all type of deals across all geographies and business units. The current scope and example covers REBU. If agents/brokers do not have access to agent app, the confirmation and pending document stages are handled offline. Figjam representation [here](https://www.figma.com/board/14IzOPtzeDJFLjmRaFeAL6/Payments---Deals-workflow?node-id=0-1&p=f&t=HS7ZpSQVjmsTyLiT-0)

# 1. State Machine

**The state machine belongs to the Tranche, not the Deal.** A `Deal` is a commercial header (amount, market, parties) with no status of its own. Each `Tranche` within the deal progresses independently through the states below. A Deal always has at least one Tranche; a split-payment deal (e.g. Spain REBU Arras + Escritura) has two or more.

For display purposes, a Deal's aggregate status in the ops list is derived from its Tranches (highest priority active state wins). The agent-facing status uses a simplified 3-state model — see §1.2 below.

## 1.1 Tranche States

| State | Description | Can go to | Trigger |
| --- | --- | --- | --- |
| **Under Review** | Starting state. Ops is actively reviewing. Stakeholders and deal data can be edited. | Pending Details · Pending Agent Approval · Canceled | Ops on Karvel → Pending Agent Approval all documents must be approved or waived |
| **Pending Details** | Ops sent the deal back to the agent. Agent must provide missing documents or information. | Under Review · Canceled | Ops on Karvel / Agent in app |
| **Pending Agent Approval** | Commission terms are set. Agent must confirm before invoicing starts. | Under Review · Invoicing · Canceled | Ops on Karvel / Agent in app |
| **Invoicing** | Deal locked. Finance is collecting the commission payment from receivable parties. | Finalized · Canceled | auto → Finalized when all invoices paid |
| **Finalized** | All outbound invoices paid. Agent commission liability recorded. Auto-triggered — no manual step. | — terminal |  |
| **Canceled** | Deal voided. Reachable from any non-terminal status. Cannot be reactivated. | — terminal |  |

## 1.2 Agent-Facing Deal Status

Agents see a simplified 3-state status derived from all Tranches on the Deal. This avoids exposing internal ops states (e.g. `under-review`) to agents who have nothing to act on at that moment.

| `AgentDealStatus` | When it applies | What the agent sees |
| --- | --- | --- |
| `action-required` | Any Tranche is `pending-agent-approval` or `pending-details` | Deal appears in the agent's action queue |
| `in-progress` | No Tranche needs action; at least one is `under-review` or `invoicing` | Deal is progressing; no agent action needed |
| `closed` | All Tranches are `finalized` or `canceled` | Deal is closed; commission locked |

Priority: `action-required` > `in-progress` > `closed`.

## 1.3 Adding a Tranche

A second Tranche can be added to a Deal by Ops in Karvel, but **only when the existing Tranche is in `under-review`**. The constraint prevents creating parallel financial tracks while a prior settlement is already locked or being invoiced. Once added, each Tranche advances independently.

# 2. Who's Involved

| Role | App | Owns |
| --- | --- | --- |
| **Ops** | Karvel | Creates deals, validates data, manages stakeholders and commissions, moves the deal forward |
| **Agent** | Agent App | Responds to Ops information requests, confirms commission terms, generates invoice to Huspy |
| **Finance** | Karvel | Issues and collects client/external parties' invoices, reviews and pays agent invoices |
| **External parties** | — | The parties who pay Huspy's commission or support the deal — buyer, seller, developer, bank, or tenant depending on deal type. Each is a Party record and we may interact with them financially. |

# 3. The 6 Stages

Each stage below refers to a **Tranche** moving through its state machine. The Deal itself has no status. In a single-Tranche deal the distinction is invisible; in a multi-Tranche deal (e.g. Arras + Escritura), each Tranche can be at a different stage simultaneously.

### Stage 1 — Tranche Created → `under-review`

A Tranche enters the system in **Under Review**. The first Tranche is created automatically when the Deal is created. Additional Tranches (e.g. Escritura) are added by Ops. Agents do not currently create deals directly; an offer submission flow is being built that will allow REBU agents to submit offers — when accepted, a deal and its first Tranche will be created automatically.

* **Ops**: Validates available data, begins reviewing documents, edits stakeholders on this Tranche, and reviews the P&L waterfall.
* If all information is present: Ops advances this Tranche to **Pending Agent Approval**.
* If anything is missing: Ops sends this Tranche to **Pending Details** to request input from the agent.

**Permissions note:** Karvel has two internal roles — **Ops** and **Senior Ops**. Standard Ops users can edit Tranche data and stakeholders freely while the Tranche is in Under Review. Changes to the P&L waterfall that affect commission terms require approval from a Senior Ops user before the Tranche can advance to Pending Agent Approval.

### Stage 2 — Requesting Agent Input → `pending-details`

**Pending Details** is a backward step from Under Review — not the starting state. Ops triggers it when required documents or information are missing. The agent is notified and the Tranche appears in their action queue (`AgentDealStatus: action-required`).

* **Agent**: Uploads required documents, fills in missing fields, writes a note to Ops, and clicks **Submit for Review**.
* On submission, the Tranche returns to **Under Review**. This loop can repeat.

**Future direction:** In a later version, Tranches could start directly in Pending Details — so that as soon as a Tranche is created, the agent is automatically prompted for all required documents without Ops having to manually trigger the step.

### Stage 3 — Agent Confirms Commission → `pending-agent-approval`

Ops has locked the commission terms for this Tranche. The agent must review and explicitly confirm before any invoicing can begin.

* **Agent**: Reviews the full commission breakdown for this Tranche (deal price → gross revenue → deductions → their payout). Clicks **Confirm** to approve.
* If the agent disagrees, they click **Request Review** and provide a reason. The Tranche reverts to **Under Review**. This can loop.
* On confirmation: Tranche moves to **Invoicing**. The agent is notified.

### Stage 4 — Invoicing → `invoicing`

Finance takes over for this Tranche. The Tranche is now locked; stakeholders cannot be changed. The focus is collecting the commission from the receivable parties and paying involved external parties (not agent).

* Invoices are **automatically created in Draft** when the Tranche reaches Invoicing. Finance validates the amounts and issues the invoice to the relevant party (developer, bank, buyer, tenant …).
* **Finance**: Matches the incoming/outgoing bank transfer to the invoice, optionally uploads proof of payment, and marks the invoice as **Paid**.
* Once **all** outbound invoices linked to this Tranche are marked Paid, the Tranche **automatically** transitions to Finalized.

| Status | What it means |
| --- | --- |
| `draft` | Created but not yet sent. Internal use only. |
| `issued` | Sent to the counterparty. Awaiting payment. |
| `paid` | Payment received and confirmed with a payment reference number. |
| `cancelled` | Voided. A written cancellation reason is always required. |

Parties with subledgers (agents/brokers appearing as cost parties) skip invoice creation entirely and are settled via commission accrual posting.

**Xero integration**

Once an invoice is ISSUED in our system, we should create it in Xero as well. Same for PAID status in Xero, we should pull this information. Further info in [Xero integration](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445574152).

### Stage 5 — Tranche Closed → `finalized`

Triggered automatically when the last outbound invoice linked to this Tranche is marked Paid. Terminal for this Tranche — no further edits are possible.

* Agent's commission accounting entries are created: the agent's commission liability is credited to their individual subledger (Huspy now owes them money).
* **Agent**: Sees the new commission entry appear in their earnings statement.

A Deal is considered fully closed when all its Tranches are `finalized` or `canceled`. Only then does `AgentDealStatus` become `closed`.

For MBU, agents/broker liability recognition happens when the Tranche moves to the invoicing stage (not finalized).

### Stage 6 — Agent Payout (separate cycle)

Agent payment is intentionally decoupled from deal finalization. Agents accumulate commission entries and other non-deal-specific ledger entries (bonuses, adjustments, platform fees) across multiple finalized deals and invoice Huspy in batches — not one invoice per deal.

* **Agent**: Reviews their ledger movements in the Earnings tab, selects uninvoiced entries, and clicks **Generate Statement**.

    * In **UAE and Saudi Arabia**: the system generates the invoice document.
    * In **Spain**: self-invoicing is not legally permitted. The agent selects which posting line entries to include, enters the applicable **IVA rate** (default 21%) and **IRPF withholding rate** (default 15%), and uploads a pre-prepared _factura_ (PDF). The system records the line items and tax rates; the agent provides the legal invoice document.
    * **Salaried referral agents** do not self-invoice — their payouts are routed through HR/payroll. We keep the ledger entries and data to support Payroll calculations.

* **Finance**: Reviews the agent invoice in Karvel (Invoices tab → Inbound → Issued), approves it, makes the bank transfer. The agent's subledger balance is cleared.

### Accounting Entries Per Stage

Worked example: Spain REBU deal, property sold for **€100,000**, Huspy commission 3% (€3,000 base + 21% IVA = **€3,630** invoiced to buyer), agent share 40% (€1,200 gross), Spain IRPF withholding 19% (€228).

| Stage / Event | Account | Debit | Credit | What it means |
| --- | --- | --- | --- | --- |
| **Stage 4a** — Invoice issued to buyer | Accounts Receivable (AR) | €3,630 |  | Huspy recognises €3,000 revenue + €630 IVA; buyer owes €3,630 |
|  | Revenue |  | €3,000 |  |
|  | VAT Liability (IVA) |  | €630 |  |
| **Stage 4b** — Buyer pays | Bank | €3,630 |  | Cash in; AR settled |
|  | Accounts Receivable (AR) |  | €3,630 |  |
| **Stage 5** — Deal finalized (auto) | Commission Expense | €1,200 |  | Huspy records €1,200 owed to agent (40% of gross) |
|  | Agent Liability subledger |  | €1,200 |  |
| **Stage 6a** — Agent invoice validated (`agent_invoice_accrual`) | Agent Liability subledger | €1,200 |  | Gross liability restructured: net + withholding separated |
|  | Withholding Tax Liability (IRPF) |  | €228 | €228 withheld for tax authority |
|  | Liability VAT | €252 |  |  |
|  | Liability Payable |  | €1,224 |  |
| **Stage 6b** — Bank transfer executed (`bank_statement_outbound_matched`) | Liability Payable | €1,224 |  | Net liability cleared |
|  | Bank |  | €1,224 | €1,224 transferred to agent |

### Net Result

| Line | Amount |
| --- | --- |
| Revenue recognised (base) | +€3,000 |
| Commission expense (agent's gross share) | −€1,200 |
| **Huspy margin** | **+€1,800** |
| Cash collected from buyer (incl. IVA) | +€3,630 |
| IVA remitted to tax authority | −€630 |
| Cash paid to agent (net of IRPF) | −€1,224  |
| IVA deduction to tax authority | +€252 |
| IRPF remitted to tax authority | -€228 |
| **Net cash retained by Huspy** | **+€1,800** |

Tax rates by market: Spain charges 21% IVA on the client invoice and withholds 19% IRPF from the agent. UAE applies 5% VAT on both sides. Saudi Arabia applies 15% VAT on the client invoice. **TO CONFIRM**

# 4. Multi-Tranche Example: Spain REBU Arras + Escritura

In Spain, real-estate sales commonly involve two separate payment events. Huspy's commission is recognised in two tranches:

| | Tranche 1 — Arras | Tranche 2 — Escritura |
| --- | --- | --- |
| **Trigger** | Reservation contract signed | Notarisation completed |
| **Commission** | ~40–50% of total commission | Remaining ~50–60% |
| **Invoice** | Outbound invoice to buyer (deposit) | Outbound invoice to buyer (completion) |
| **Agent confirmation** | Required before invoicing starts | Required before invoicing starts |
| **Documents** | Contract, ID | Title deed, Nota simple |

Both Tranches live on the same Deal (same commercial agreement, same parties). Ops creates the Arras Tranche first. When the reservation contract is signed and Ops is ready to move to the completion phase, they add the Escritura Tranche to the same Deal.

**Independent lifecycles:** Tranche 1 can reach `finalized` months before Tranche 2 even reaches `under-review`. The agent's ledger receives two separate commission entries — one per Tranche at finalization. The agent sees both Tranches under the same Deal in their app, with independent progress indicators and document checklists per Tranche.

**Accounting:** Each Tranche generates its own set of postings and invoices. The agent's subledger is credited once per Tranche at finalization.

# 5. When Things Go Sideways

### Agent requests a review

At **Pending Agent Approval**, the agent clicks "Request Review" with a reason. Deal reverts to **Under Review**. Ops adjusts and re-submits. No limit on iterations.

### Agent invoice not approved

Finance cancels the invoice — a written reason is mandatory. Finance alerts Ops support, who can explain the discrepancy or create a manual accounting correction against the agent's subledger.

### Cancellation

A Tranche can be moved to **Canceled** from any status except Finalized — enforced by the system's transition rules (see state machine above). Canceled is terminal for that Tranche; there is no reactivation path. Other Tranches on the same Deal are unaffected.
