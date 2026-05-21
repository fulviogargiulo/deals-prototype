<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2412609545 -->

# Agent Journey — Agent App

The Agent App is the external-facing tool for independent agents working with Huspy (UAE, Spain, Saudi Arabia). It is an existing product being expanded. Agents do not currently create deals — deals are created by Ops in Karvel or triggered automatically when an offer is accepted. The Agent App covers the agent's side of the deal from that point onward: responding to Ops information requests, confirming commission terms, and getting paid.

The app has three main areas: **Deals**, **Income Details**, and the **Earnings tab** (inside Deals). Each serves a different moment in the payment journey.

---

## User Stories

- As an agent, I want to be notified when Ops needs information from me so that I can respond quickly and keep the deal moving.
- As an agent, I want to see exactly what documents are required so that I don't waste time submitting the wrong things.
- As an agent, I want to review my commission breakdown before invoicing starts so that I know exactly what I'll be paid.
- As an agent, I want to request a review if I disagree with the proposed terms so that issues are resolved before finalization.
- As an agent, I want to generate my invoice to Huspy from my accumulated earnings so that I get paid on time.
- As an agent, I want to see my expected and received payments at a glance so that I have full visibility into my income.

---

## The Actions Required Section — The Agent's Daily Queue

<!-- SCREENSHOT: Agent App deals page — Actions Required queue showing pending commission confirmations and info requests -->

The top of the Deals page surfaces everything that needs the agent's attention. This is the primary entry point into the deal flow. Two types of action appear here:

### Provide Missing Info (`pending-details`)

Ops has reviewed the deal and flagged that something is missing. The agent is notified and the deal appears in the "Pending Info" section. Clicking through opens the deal with the **Missing Information** section expanded:

- A list of required documents with individual upload buttons (pending items shown first)
- A mandatory note field to explain anything Ops needs to know
- A **Submit for Review** button — this moves the deal back to **Under Review**

### Confirm Commission (`pending-agent-approval`)

Ops has finalized the commission terms. The agent has a **2-day window** to act (shown as a countdown in the Actions Required list). Multiple deals can be confirmed in bulk from this list, or individually from inside the deal.

Inside the deal, the commission breakdown is expanded and non-collapsible at this stage:

- Deal price → Gross revenue → Acquisition deductions → Operational deductions → Net revenue → Commission rate → **Your payout**
- If the agent is one of multiple agents on the deal, their split percentage is shown


| Button             | What it does                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Confirm**        | Approves the commission terms. Deal moves to Invoicing. Finance can now invoice the client. |
| **Request Review** | Pushes the deal back to Ops with a written reason. Deal reverts to Under Review.                      |


---

## Inside a Deal Page

<!-- SCREENSHOT: Agent App deal detail — timeline progress bar, commission breakdown expanded, Confirm / Request Review buttons -->

Every deal page has the same structure regardless of status:


| Section                  | What it shows                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Header**               | Deal title, type, status badge, link to the related opportunity                          |
| **Deal cards**           | Deal price, property details (building, unit), client name, report date                  |
| **Timeline**             | Visual progress bar across the deal stages — completed, current, upcoming                |
| **Commission breakdown** | Visible from Under Review onward. Collapsed by default except at Pending Agent Approval. |
| **Documents**            | Upload/download list. Active at Pending Details; read-only from Under Review onward.     |
| **Messages**             | Direct comment thread with Ops. Active until the deal is Finalized or Canceled.          |


---

## Tracking Income — The Income Details Page

<!-- SCREENSHOT: Agent App Income Details — Earned Income, Expected Payout cycle, Potential Income from Pipeline -->

Accessible from the main navigation. Gives a financial snapshot across all deals in three buckets:


| Section             | What it shows                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Earned Income**   | Count of finalized deals and total commission received to date. Clicking the total opens a breakdown per deal.                                                       |
| **Expected Payout** | Current payment cycle: balance owed, due date, and status (Paid / Payment Pending / In Review). Overdue cycles are flagged in red. Click to open the invoice detail. |
| **Pipeline**        | Deals currently in Under Review, Pending Agent Approval, or Invoicing — projected commission totals. Not yet invoiceable, but shows what's coming.         |


---

## Generating Your Invoice to Huspy — The Earnings Tab

<!-- SCREENSHOT: Agent App Earnings tab — ledger movements list with commission/bonus/fee entries, Statements section below -->

The Earnings tab (inside the Deals page) is where the agent manages their actual payout cycle. It is separate from tracking individual deal status.

### Ledger Movements

Every time a deal is finalized, a new entry appears in the agent's ledger: the commission amount Huspy owes them. Additional entry types can also appear: bonuses, incentives, platform fees, and manual adjustments. Each line shows the date, the linked deal, the type, and the amount (green for credits, red for debits).

Filter by period (All time or custom date range); the net total for the period appears at the bottom.

### Generating a Statement (Invoice)

Once one or more ledger entries are uninvoiced, the **Generate Statement** button becomes active. Clicking it opens a form showing the pending entries — the agent confirms and submits.

- In **UAE and Saudi Arabia**: the system generates the invoice document automatically.
- In **Spain**: self-invoicing is not legally permitted. The agent selects which posting line entries to include, enters the applicable **IVA rate** (default 21%) and **IRPF withholding rate** (default 15%), and uploads a pre-prepared *factura* (PDF). The system records the line items and tax rates; the agent provides the legal invoice document.

Submitted invoices appear in the Statements section below the ledger:


| Invoice status                                   | Meaning                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `draft`                                          | Created, not yet submitted                                           |
| `issued`                                         | Submitted to Huspy, awaiting Finance review                          |
| `paid`                                           | Finance has approved and transferred the payment                     |
| `disputed` | Finance has raised an issue with the invoice — agent should contact support |


Paid and Issued invoices can be downloaded directly from this view.