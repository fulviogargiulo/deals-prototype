<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2412085272 -->

# 1. User Stories

* **As** an Ops team member, **I want to** create and review incoming deals **so that** only complete, accurate deals move to commission approval.
* **As** an Ops team member, **I want to** request missing information from the agent and track what's been submitted **so that** nothing falls through the cracks.
* **As** an Ops team member, **I want to** manage deal stakeholders and review the P&L waterfall **so that** commission terms are correct before being sent to the agent.
* **As** a Finance team member, **I want to** issue client invoices and record incoming payments **so that** revenue is recognized correctly.
* **As** a Finance team member, **I want to** review agent invoices and confirm payment **so that** agents are compensated accurately and on time.
* **As** an Ops/Finance team member, **I want to** configure document requirement templates per market and business unit so that every deal has the right compliance checklist from day one.
* **As** a Finance team member, **I want to** see which invoices are linked to a deal and what accounting entries they generated **so that** I can reconcile financial records accurately.

# 2. What Karvel is for

[Karvel](https://ops.huspy.net/) is Huspy's internal back-office — an existing product being expanded. It is not visible to agents. Goal is to get Ops and Finance use it to manage the full deal pipeline, handle invoicing on both sides (client and agent), and maintain agent profiles including their accounting ledger and commission structures.

Deals and Payments product aim to add to Karvel four main tabs under the Deal section: **Deals**, **Invoices**, **Ledger**, and **Deal Configuration**.

# 3. How Deals Enter the System

Deals always start in **Under Review**. There are currently two creation paths, with a third planned:

* **Manual** — Ops clicks "Add Deal" in the Deals tab and fills in the form.
* **Bulk CSV upload** — Ops uploads a CSV to create multiple deals at once. A template is provided
* **Offer entity (planned)** — An offer submission flow is being built for REBU agents. When an agent's offer is accepted, a deal will be created automatically without Ops having to enter it manually.

From Under Review, Ops has two paths:

* **Everything looks complete** → advance to Pending Agent Approval
* **Information or documents are missing** → send to Pending Details to request input from the agent

Once the agent submits their information, the deal returns to Under Review automatically. This loop can repeat.

Every Deal starts with one Tranche (also in `under-review`). If the deal involves multiple settlement events (e.g. Spain Arras + Escritura), additional Tranches can be added later. All P&L entries (TrancheStakeholders) are scoped to a specific Tranche — not to the Deal. Check the domain model [here](https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692). When adding a P&L entry, Ops verifies the `Party` record using `taxId` (NIE in Spain, Emirates ID in UAE…). If the `taxId` already exists in the system, the existing Party record is reused — no duplicate is created. This keeps the ledger accurate across multiple deals involving the same buyer, developer, or other third parties.

# 4. The Deals Tab

The Deals tab is a paginated, searchable table. **Each row represents a Tranche**, not a Deal. A Deal with two Tranches (e.g. Arras + Escritura) appears as two rows. This gives Finance a per-Tranche view of status, gross/net revenue, and report date.

* **Search** by agent name, client name, deal ID, or market
* **Filter and sort** by status, business unit, country, deal ID, gross revenue, net revenue, Huspy margin, report date
* **Add Deal** and **Bulk Upload** (CSV) buttons for deal creation

Each row shows: Deal ID, Tranche index, status, BU, country, market, gross revenue, net revenue, Huspy margin, and report date. Clicking a row opens the deal detail page at that specific Tranche.

## 4.1. Inside a Deal — What Ops Does

### Tranche Tabs

When a Deal has multiple Tranches (e.g. Arras + Escritura), a tab strip appears at the top of the detail panel. Each tab shows the Tranche index, its label (if set), and status badge. All sections below the tabs — status transitions, stakeholders, P&L, documents, invoices, accounting events — are scoped to the selected Tranche.

**Adding a Tranche** is available when the currently selected Tranche is in `under-review`. This prevents creating parallel settlement tracks while a prior Tranche is locked.

### Status Transitions

The **Tranche** status is changed via a dropdown in the detail header. Every status change is timestamped and recorded in the Tranche's status history. Check the deal state machine [here](https://huspy.atlassian.net/wiki/spaces/corp/pages/2411429911) for more details.

### P&L Entries (TrancheStakeholders)

P&L entries are the financial participants in this Tranche's commission waterfall. This panel is **editable only when the Tranche is in Under Review or Pending Details**. Once the Tranche advances, it locks. User can add all these entry types:

| Entry type | Role |
| --- | --- |
| **Revenue Source** | The parties paying Huspy (buyer, developer, bank, tenant…). Their amounts sum to Huspy's gross revenue for this Tranche. |
| **Agent Payout** | A Huspy agent/broker. Commission is calculated by the system from the agent's commission structure — not entered manually. |
| **Acquisition Deduction** | External commercial partner (co-broker, referral). Huspy pays them; deducted from gross revenue. |
| **Operational Deduction** | Fixed service cost (notary, conveyance, legal). Deducted from net after agent payouts. |

### P&L Waterfall

Displayed on every Tranche detail view. Shows how this Tranche's gross revenue flows to Huspy's margin. `grossRevenue` is always derived at runtime from the sum of `REVENUE_SOURCE` entry amounts — it is never stored separately.

1. Deal amount (and any rebate/subsidy applied)
2. Gross revenue (sum of Revenue Source entries for this Tranche)
3. Minus Acquisition Deductions (external partners)
4. = Net revenue
5. Minus Agent payouts (calculated from each agent's commission strategy)
6. Minus Operational Deductions (fixed costs)
7. = **Huspy margin**

Refer to [P&L Engines](https://huspy.atlassian.net/wiki/spaces/corp/pages/2441248770) for P&L calculations.

### Invoices (Per Deal)

All invoices linked to the deal appear in the Invoices section on the deal detail page, showing their counterparty, type, gross amount, status, and issue date. Clicking an invoice redirects the user to its detailed page. See the dedicated invoices tab below for more information.

Not all invoices are linked to deals. Check domain model [here](https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692)

### Accounting Events (Per Deal)

Deal progress and linked invoice status changes generate accounting events (postings). A dedicated section on the deal detail page displays them. Clicking any posting opens a posting popup with more details. See the dedicated ledger tab below for more.

Not all postings are linked to deals. Check domain model [here](https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692)

### Document Requirements (Per Deal)

Each deal has a checklist of required documents, pre-populated based on the deal's market, BU, and country (and channel?). Ops can:

* **Approve** a document the agent has uploaded
* **Waive** a requirement if it doesn't apply
* **Add** a one-off requirement not in the standard template
* **Download** any uploaded file

### Comments

A threaded comment panel connects Ops and the agent. Ops can write at any status. The agent can reply until the deal is Finalized or Canceled. All messages are timestamped and retained permanently.

# 5. The Invoices Tab

Centralized view of all invoices across deals. Filter the table by any header: invoice ID, direction, party, deal, amount, status, issue date, or due date.

## 5.1. Inside an Invoice — What Ops Does

To check booking logic (i.e., posting creation), see the example [here](https://huspy.atlassian.net/wiki/spaces/corp/pages/2411429911)

### Invoice in Draft state

**Inbound**

The user can:

* Upload the received invoice
* Fill in invoice number, due date and VAT
* Confirm receipt. I.e. move Draft → Issued.
* Cancel invoice

**Outbound**

The user can:

* Change invoice number, due date and VAT
* Download the pre filled invoice template
* Once the user has sent the document to the counterparty to collect the funds, he can move Draft → Issued.
* Cancel invoice

### Invoice in Issued state

**Inbound / Outbound**

The user can:

* Download the invoice
* See related accounting events (i.e. linked postings)
* Record the payment
* Cancel or mark as Paid

### Invoice in Paid state

**Inbound / Outbound**

The user can:

* Download the invoice
* See related accounting events (i.e. linked postings)
* Cancel invoice

# 6. Ledger Tab

The Ledger tab is the global view of all ledgers and double-entry accounting postings in the system. It is Finance's primary tool for reconciliation, audit, and manual corrections. The high level view show all the ledgers and their balance.

Finance can create a manual posting directly from this tab for corrections, bonuses, or adjustments that fall outside the automated flows (e.g. a one-off incentive, a withholding tax correction, or a reversal of a mis-posted entry).

The manual posting form requires:

* **Value date** — accounting date for the entry
* **Currency** — all lines must share the same currency
* **Business process** — select from a fixed list (e.g. `manual_adjustment`, `reversal`)
* **Description** — mandatory free-text explanation for audit purposes
* **At least two posting lines** — each specifying a ledger, side (Debit / Credit), and amount

The form enforces the balance invariant in real time: the **Save** button is disabled until `Σ debits = Σ credits`. Unbalanced postings cannot be saved.

Manual postings can be created singularly or via bulk upload via csv.

### Postings Table

Once a ledger is clicked, a paginated, searchable table of every posting ever created on that ledger shows up. User can **Search, Filter and Sort** by posting ID, value date and created date, description, deal ID, type or amount.

### Posting Detail

Clicking a row expands the full posting. All [posting and its postinglines metadata](https://huspy.atlassian.net/wiki/spaces/corp/pages/2432073741) is shown here.

# 7. Deal Configuration Tab

Global configuration that drives how deals behave across all markets and business units. Changes here affect all new deals going forward — nothing here is per-deal. The tab is split into sub-tabs; more will be added as the system expands.

---

### Sub-tab: Document Requirements

Manages the templates that determine what documents are required for each deal type.

The matrix is organized by **Business Unit** (REBU / Mortgage) × **Market** (Primary / Secondary / Leasing) × **Country** (AE, ES, SA). Each cell is one of:

| Value | Meaning |
| --- | --- |
| **Required** | Mandatory — deal cannot advance to Pending Agent Approval without this document |
| **Optional** | Shown on the deal but can be waived by Ops |
| **Off** | Not shown on deals for this market/country combination |

Additional actions per document:

* **Attach a template file** per country — agents can download and fill it in from the deal page
* **Add** a new document type (appears across all cells until configured)
* **Remove** an existing document type

The user can also add another row (required document) and configure it per each country.

---

### Sub-tab: Broker Rate Slabs

Configures the monthly broker commission rates for the **MBU MA/Broker channel** (UAE). This is the rate Huspy pays to the broker from the disbursed mortgage, split into tiers based on the broker's total monthly GMV across all banks.

**How it works:**

* Rates are expressed as a **percentage of the disbursed mortgage amount**
* The applicable tier is determined by the broker's **total monthly disbursed GMV across all banks**
* Each tier defines a per-bank rate; different banks pay different percentages
* A new slab set is created each **reporting month** — historical months are read-only

The User can upload a csv to edit/add new months. This will impact newly created deals.

# 8. Agent Management

The Agents section has a searchable, filterable list of all agents. In relation to Deals and Payments product, 3 new tabs will be added:

| Tab | What it contains |
| --- | --- |
| **Deals** | All deals linked to the agent with main metadata |
| **Ledger** | The agent's subledger view: running balance, full posting history. Same as in the ledger general tab, filtered for the agent subledger. Finance/Ops can create manual postings here as well. |
| **Financials** | Commission structure: Flat %, Max with cap, or Slab (progressive tiers). Also shows connected agents (i.e. team leads, managers) |

Finance / Ops can also bulk upload updates on agent financials and connected agents.
