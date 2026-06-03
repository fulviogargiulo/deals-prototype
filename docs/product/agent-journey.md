<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2412609545 -->

# 1. User Stories

* **As** an agent, **I want to** be notified when Ops needs information from me **so that** I can respond quickly and keep the deal moving.
* **As** an agent, **I want to** see exactly what documents are required **so that** I don't waste time submitting the wrong things.
* **As** an agent, **I want to** review my commission breakdown before invoicing starts **so that** I know exactly what I'll be paid.
* **As** an agent, **I want to** request a review if I disagree with the proposed terms **so that** issues are resolved before finalization.
* **As** an agent, **I want to** generate my invoice to Huspy from my accumulated earnings **so that** I get paid on time.
* **As** an agent, **I want to** see my expected and received payments at a glance **so that** I have full visibility into my income.

# 2. What the Agent App is for

The Agent App is the external-facing tool for agents working with Huspy. It is an existing product being expanded. Agents do not currently create deals — deals are created by Ops in Karvel or triggered automatically when an offer is accepted. The Agent App covers the agent's side of the deal from that point onward: responding to Ops information requests, confirming commission terms, and getting paid.

In relation to Deals & Payments products, we plan to add a new Deals section in the app, with 2 main tabs in it: **Deals** and **Earnings**. Each serves a different moment in the deal and payment journey.

# 3. The Deals Tab

The Deals list shows one row per Deal. The status shown is the `AgentDealStatus` derived from all Tranches on the deal:

| `AgentDealStatus` | Badge | Meaning |
| --- | --- | --- |
| `action-required` | Amber | At least one Tranche needs the agent's input (provide docs, confirm commission) |
| `in-progress` | Blue | Ops is processing; no agent action needed |
| `closed` | Green | All Tranches finalized or canceled |

The commission shown in the list is the sum of confirmed `AGENT_PAYOUT` amounts across all **finalized** Tranches on the deal.

### The Actions Required Section — The Agent's Queue

The top of the Deals page surfaces everything that needs the agent's attention. This is the primary entry point into the deal flow. Two types of action appear here:

**Provide Missing Info** (Tranche in `pending-details`)

Ops has reviewed the Tranche and flagged that something is missing. The agent is notified and the deal appears in the "Pending Info" section. Clicking through opens the deal, defaulting to the affected Tranche tab, with the **Missing Information** section expanded:

* A list of required documents with individual upload buttons (pending items shown first)
* A mandatory note field to explain anything Ops needs to know
* A **Submit for Review** button — this moves the Tranche back to **Under Review**

**Confirm Commission** (Tranche in `pending-agent-approval`)

Ops has finalized the commission terms for this Tranche. The agent needs to confirm.

Inside the Tranche view, the commission breakdown is expanded and non-collapsible at this stage:

* Deal price → Gross revenue → Acquisition deductions → Operational deductions → Net revenue → Commission rate → **Your payout**
* If the agent is one of multiple agents on the deal, their split percentage is shown

| Button | What it does |
| --- | --- |
| **Confirm** | Approves the commission terms. Tranche moves to Invoicing. Finance can now invoice the client. |
| **Request Review** | Pushes the Tranche back to Ops with a written reason. Tranche reverts to Under Review. |

## 3.1 Inside a Deal Page

When a Deal has multiple Tranches (e.g. Arras + Escritura), the deal detail page shows a **Tranche tab strip** below the deal header. Each tab displays the Tranche index, its label (if set), and a status badge. Switching tabs changes all sections below — progress, documents, comments, commission — to show data scoped to the selected Tranche. Each Tranche has a fully independent document checklist and comment thread.

For single-Tranche deals, no tabs are shown — the experience is identical to the prior single-deal view.

All sections below are scoped to the **selected Tranche**. Switching Tranche tabs resets the view to the selected Tranche's data.

### Pending Details (Tranche)

The user can:

* Upload the requested documents for this Tranche
* Download uploaded documents and templates (if available)
* Add a note for Huspy
* Submit note and/or documents for Review (Tranche moves from Pending Details → Under Review)
* See the comments on this Tranche

### Under Review (Tranche)

The user can:

* Download uploaded documents for this Tranche
* See and create comments on this Tranche

This Tranche is pending ops input.

### Pending Agent Approval (Tranche)

The user can:

* Download uploaded documents for this Tranche
* See the commission calculation breakdown for this Tranche (P&L waterfall), including:

    * All revenue sources
    * Acquisition costs borne by agents or Huspy
    * Net revenues (commission pool) and agent split
    * Operational costs
    * Their commission
    * Their connected agents' commission

* Confirm commission (Tranche moves from Pending Agent Approval → Invoicing)
* Add a note and request review (Tranche moves from Pending Agent Approval → Under Review)
* See and create comments on this Tranche

This Tranche is pending agent input.

### Invoicing (Tranche)

The user can:

* Download attached documents for this Tranche
* See the commission calculation breakdown for this Tranche
* See and create comments on this Tranche

This Tranche is pending that its linked invoices are Paid.

### Finalized (Tranche)

The user can:

* Download attached documents for this Tranche
* See the commission calculation breakdown for this Tranche
* See comments on this Tranche

### Canceled (Tranche)

The user can:

* Download attached documents for this Tranche
* See the commission calculation breakdown for this Tranche
* See comments on this Tranche

# 4. The Earnings Tab

The Earnings tab (inside the Deals page) is where the agent manages their actual payout cycle. It is separate from tracking individual deal status.

Ledger entries and statements can be Filter by period (All time or custom date range).

### Ledger Movements

Every time a deal is finalized, a new entry appears in the agent's ledger: the commission amount Huspy owes them. Additional entry types can also appear: bonuses, incentives, platform fees, and manual adjustments. Each line shows the date, the description, the linked deal (if any), the type, the linked invoice (if any) and the amount.

### Statements (Invoice Creation)

Once one or more ledger entries (postinglines on agent subledger) are uninvoiced, the **Generate Statement / Upload Invoice** button becomes active. Clicking it opens a form showing the pending entries — the agent confirms and submits.

* In **UAE and Saudi Arabia**: the system should generate the invoice document automatically.
* In **Spain**: self-invoicing is not legally permitted. The agent selects which posting line entries to include, enters the applicable **IVA rate** (default 21%) and **IRPF withholding rate** (default 15%), and uploads an invoice (PDF). The system records the line items and tax rates; the agent provides the legal invoice document.

Submitted invoices appear in the Statements section below the ledger:

| Invoice status | Meaning |
| --- | --- |
| `issued` | Submitted to Huspy, awaiting Finance review |
| `paid` | Finance has approved and transferred the payment |
| `canceled` | Finance has raised an issue with the invoice — agent should contact support |

Paid and Issued invoices can be downloaded directly from this view.
