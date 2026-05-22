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

### The Actions Required Section — The Agent's Queue

<!-- SCREENSHOT -->

The top of the Deals page surfaces everything that needs the agent's attention. This is the primary entry point into the deal flow. Two types of action appear here:

**Provide Missing Info** (`pending-details`)

Ops has reviewed the deal and flagged that something is missing. The agent is notified and the deal appears in the "Pending Info" section. Clicking through opens the deal with the **Missing Information** section expanded:

* A list of required documents with individual upload buttons (pending items shown first)
* A mandatory note field to explain anything Ops needs to know
* A **Submit for Review** button — this moves the deal back to **Under Review**

**Confirm Commission** (`pending-agent-approval`)

Ops has finalized the commission terms. The agent needs to confirm.

Inside the deal, the commission breakdown is expanded and non-collapsible at this stage:

* Deal price → Gross revenue → Acquisition deductions → Operational deductions → Net revenue → Commission rate → **Your payout**
* If the agent is one of multiple agents on the deal, their split percentage is shown

| Button | What it does |
| --- | --- |
| **Confirm** | Approves the commission terms. Deal moves to Invoicing. Finance can now invoice the client. |
| **Request Review** | Pushes the deal back to Ops with a written reason. Deal reverts to Under Review. |

## 3.1 Inside a Deal Page

### Pending Details

<!-- SCREENSHOT -->

The user can:

* Upload the requested documents
* Download uploaded documents and templates (if available)
* Add a note for Huspy
* Submit note and/or documents for Review (Deal moves from Pending Details → Under Review)
* See the comments on the deal

### Under Review

<!-- SCREENSHOT -->

The user can:

* Download uploaded documents
* See and create comments on the deal

The deal is pending ops input.

### Pending Agent Approval

<!-- SCREENSHOT -->

The user can:

* Download uploaded documents
* See the commission calculation breakdown (Karvel P&L waterfall view), including:

    * All revenue sources
    * Acquisition costs beared by agents or Huspy
    * Net revenues (i.e. commission pool) and agent split
    * Operational costs
    * His commission
    * His connected agents commission

* Confirm commission (Deal moves from Pending Agent Approval → Invoicing)
* Add a note and request review (Deal moves from Pending Agent Approval → Under Review)
* See and create comments on the deal

The deal is pending agent input.

### Invoicing

<!-- SCREENSHOT -->

The user can:

* Download attached documents
* See the commission calculation breakdown
* See and create comments on the deal

The deal is pending that linked invoices are Paid.

### Finalized

<!-- SCREENSHOT -->

The user can:

* Download attached documents
* See the commission calculation breakdown
* See comments on the deal

### Canceled

<!-- SCREENSHOT -->

The user can:

* Download atatched documents
* See the commission calculation breakdown
* See comments on the deal

# 4. The Earnings Tab

<!-- SCREENSHOT -->

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
