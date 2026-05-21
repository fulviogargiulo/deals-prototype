<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2411429911 -->

# 0. Intro

This process flow aims to support all type of deals across all geographies and business units. Th current scope and example cover REBU. If agents/brokers do not have access to agent app, the confirmation and pending document stages are handled offline. Figjam representation [here](https://www.figma.com/board/14IzOPtzeDJFLjmRaFeAL6/Payments---Deals-workflow?node-id=0-1&p=f&t=HS7ZpSQVjmsTyLiT-0)

# 1. State Machine

| State | Description | Can go to | Trigger |
| --- | --- | --- | --- |
| **Under Review** | Starting state. Ops is actively reviewing. Stakeholders and deal data can be edited. | Pending Details · Pending Agent Approval · Canceled | Ops on Karvel |
| **Pending Details** | Ops sent the deal back to the agent. Agent must provide missing documents or information. | Under Review · Canceled | Ops on Karvel / Agent in app |
| **Pending Agent Approval** | Commission terms are set. Agent must confirm before invoicing starts. | Under Review · Invoicing · Canceled | Ops on Karvel / Agent in app |
| **Invoicing** | Deal locked. Finance is collecting the commission payment from receivable parties. | Finalized · Canceled | auto → Finalized when all invoices paid |
| **Finalized** | All outbound invoices paid. Agent commission liability recorded. Auto-triggered — no manual step. | — terminal |  |
| **Canceled** | Deal voided. Reachable from any non-terminal status. Cannot be reactivated. | — terminal |  |

# 2. Who's Involved

| Role | App | Owns |
| --- | --- | --- |
| **Ops** | Karvel | Creates deals, validates data, manages stakeholders and commissions, moves the deal forward |
| **Agent** | Agent App | Responds to Ops information requests, confirms commission terms, generates invoice to Huspy |
| **Finance** | Karvel | Issues and collects client/external parties' invoices, reviews and pays agent invoices |
| **External parties** | — | The parties who pay Huspy's commission or support the deal — buyer, seller, developer, bank, or tenant depending on deal type. Each is a Party record and we may interact with them financially. |

# 3. The 6 Stages

### Stage 1 — Deal Created → `under-review`

A deal enters the system in **Under Review**. It is created either directly by Ops in Karvel, or triggered automatically. Agents do not currently create deals directly; an offer submission flow is being built that will allow REBU agents to submit offers — when accepted, a deal will be created automatically.

* **Ops**: Validates available data, begins reviewing documents, edits stakeholders, and reviews the P&L waterfall.
* If all information is present: Ops advances to **Pending Agent Approval**.
* If anything is missing: Ops sends the deal to **Pending Details** to request input from the agent.

**Permissions note:** Karvel has two internal roles — **Ops** and **Senior Ops**. Standard Ops users can edit deal data and stakeholders freely while the deal is in Under Review. Changes to the P&L waterfall that affect commission terms require approval from a Senior Ops user before the deal can advance to Pending Agent Approval.

### Stage 2 — Requesting Agent Input → `pending-details`

**Pending Details** is a backward step from Under Review — not the starting state. Ops triggers it when required documents or information are missing. The agent is notified and the deal appears in their action queue.

* **Agent**: Uploads required documents, fills in missing fields, writes a note to Ops, and clicks **Submit for Review**.
* On submission, the deal returns to **Under Review**. This loop can repeat.

**Future direction:** In a later version, deals could start directly in Pending Details — so that as soon as a deal is created, the agent is automatically prompted for all required documents without Ops having to manually trigger the step.

### Stage 3 — Agent Confirms Commission → `pending-agent-approval`

Ops has locked the commission terms. The agent must review and explicitly confirm before any invoicing can begin.

* **Agent**: Reviews the full commission breakdown (deal price → gross revenue → deductions → their payout). Clicks **Confirm** to approve.
* If the agent disagrees, they click **Request Review** and provide a reason. The deal reverts to **Under Review**. This can loop.
* On confirmation: deal moves to **Invoicing**. The agent is notified.

### Stage 4 — Invoicing → `invoicing`

Finance takes over. The deal is now locked — stakeholders cannot be changed. The focus is collecting the commission from the receivable parties and paying the involved external parties (not agent) if there are.

* Invoices are **automatically created in Draft** when the deal reaches Invoicing. Finance validates the amounts and issues it to the relevant party (developer, bank, buyer, tenant …).
* **Finance**: Matches the incoming/outgoing bank transfer to the invoice, optionally uploads proof of payment, and marks the invoice as **Paid**.
* Once **all** outbound invoices are marked Paid, the deal **automatically** transitions to Finalized.

| Status | What it means |
| --- | --- |
| `draft` | Created but not yet sent. Internal use only. |
| `issued` | Sent to the counterparty. Awaiting payment. |
| `paid` | Payment received and confirmed with a payment reference number. |
| `cancelled` | Voided. A written cancellation reason is always required. |

### Stage 5 — Deal Closed → `finalized`

Triggered automatically when the last outbound invoice is marked Paid. Terminal — no further edits are possible.

* Agent's commissions accounting entries are created: the agent's commission liability is credited to their individual subledger (Huspy now owes them money).
* **Agent**: Sees the deal appear in their earnings statement as a new ledger entry.

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
| IVA deduction to tax authority | +€228 |
| IRPF remitted to tax authority | -€228 |
| **Net cash retained by Huspy** | **+€1,800** |

Tax rates by market: Spain charges 21% IVA on the client invoice and withholds 19% IRPF from the agent. UAE applies 5% VAT on both sides. Saudi Arabia applies 15% VAT on the client invoice. **TO CONFIRM**

# 4. When Things Go Sideways

### Agent requests a review

At **Pending Agent Approval**, the agent clicks "Request Review" with a reason. Deal reverts to **Under Review**. Ops adjusts and re-submits. No limit on iterations.

### Agent invoice not approved

Finance cancels the invoice — a written reason is mandatory. Finance alerts Ops support, who can explain the discrepancy or create a manual accounting correction against the agent's subledger.

### Cancellation

A deal can be moved to **Canceled** from any status except Finalized — enforced by the system's transition rules (see state machine above). Canceled is terminal; there is no reactivation path.
