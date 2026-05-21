# Ops & Finance Journey — Karvel

 is Huspy's internal back-office — an existing product being expanded. It is not visible to agents. Ops and Finance use it to manage the full deal pipeline, handle invoicing on both sides (client and agent), and maintain agent profiles including their accounting ledger and commission structures.

> **Current scope:** Deals, invoices, and payments functionality is live for **Spain REBU** only. Expansion to UAE, Saudi Arabia, and Mortgage is the target scope of this buildout.

## Karvel has four main tabs: **Deals**, **Invoices**, **Ledger**, and **Document Requirements**.

## User Stories

- As an Ops team member, I want to create and review incoming deals so that only complete, accurate deals move to commission approval.
- As an Ops team member, I want to request missing information from the agent and track what's been submitted so that nothing falls through the cracks.
- As an Ops team member, I want to manage deal stakeholders and review the P&L waterfall so that commission terms are correct before being sent to the agent.
- As a Finance team member, I want to issue client invoices and record incoming payments so that revenue is recognized correctly.
- As a Finance team member, I want to review agent invoices and confirm payment so that agents are compensated accurately and on time.
- As an Ops/Finance team member, I want to configure document requirement templates per market and business unit so that every deal has the right compliance checklist from day one.
- As a Finance team member, I want to see which invoices are linked to a deal and what accounting entries they generated so that I can reconcile financial records accurately.

---

## How Deals Enter the System

Deals always start in **Under Review**. There are currently two creation paths, with a third planned:

- **Manual** — Ops clicks "Add Deal" in the Deals tab and fills in the form.
- **Bulk CSV upload** — Ops uploads a CSV to create multiple deals at once.
- **Offer entity (planned)** — An offer submission flow is being built for REBU agents. When an agent's offer is accepted, a deal will be created automatically without Ops having to enter it manually.

From Under Review, Ops has two paths:

- **Everything looks complete** → advance to Pending Agent Approval
- **Information or documents are missing** → send to Pending Details to request input from the agent

Once the agent submits their information, the deal returns to Under Review automatically. This loop can repeat.

---

## The Deals Pipeline

<!-- SCREENSHOT: Karvel deals pipeline table — full list view with filters and status badges -->

The Deals tab is a paginated, searchable table of all deals across all statuses and markets.

- **Search** by agent name, client name, deal ID, or market
- **Filter** by status, business unit, and country — individually or in combination
- **Sort** by any column (deal ID, status, gross revenue, net revenue, Huspy margin, created date)
- **Add Deal** and **Bulk Upload** (CSV) buttons for deal creation

Each row shows: Deal ID, status, BU, country, market, gross revenue, net revenue, Huspy margin, and creation date.

---

## Inside a Deal — What Ops Does

<!-- SCREENSHOT: Karvel deal detail page — header with status dropdown, stakeholders panel, P&L waterfall -->

### Status Transitions

The deal status is changed via a dropdown in the deal detail header. One hard constraint is enforced:

> A deal cannot move from **Under Review** to **Pending Agent Approval** unless all document requirements on the deal are either Approved or Waived.

Every status change is timestamped and recorded in the deal's history.

### Stakeholders Panel

Stakeholders are the parties involved in the commission waterfall. This panel is **editable only when the deal is in Under Review**. Once the deal advances, it locks.


| Stakeholder type          | Role                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Revenue Source**        | The party paying Huspy (buyer, developer, bank, tenant). Their amount is Huspy's gross revenue.                     |
| **Internal Payout**       | A Huspy agent. Commission is calculated by the system from the agent's commission structure — not entered manually. |
| **Acquisition Deduction** | External commercial partner (co-broker, referral). Huspy pays them; deducted from gross.                            |
| **Operational Deduction** | Fixed service cost (notary, conveyance, legal). Deducted from gross.                                                |


### Identity Resolution

Before adding a stakeholder, Ops verifies the `Party` record using `taxId` (NIE in Spain, Emirates ID in UAE). If the `taxId` already exists in the system, the existing Party record is reused — no duplicate is created. This keeps the ledger accurate across multiple deals involving the same buyer, developer, or agent.

### P&L Waterfall

Displayed on every deal detail page. Shows how gross revenue flows to Huspy's margin:

1. Deal amount (and any rebate/subsidy applied)
2. Gross revenue (sum of Revenue Source stakeholders)
3. Minus Acquisition Deductions (external partners)
4. Minus Operational Deductions (fixed costs)
5. = Net revenue
6. Minus Agent payouts (calculated from each agent's commission strategy)
7. = **Huspy margin**

### Document Requirements (Per Deal)

Each deal has a checklist of required documents, pre-populated based on the deal's market, BU, and country. Ops can:

- **Approve** a document the agent has uploaded
- **Waive** a requirement if it doesn't apply
- **Add** a one-off requirement not in the standard template
- **Download** any uploaded file

### Comments

A threaded comment panel connects Ops and the agent. Ops can write at any status. The agent can reply until the deal is Finalized or Canceled. All messages are timestamped and retained permanently.

---

## The Invoices Tab

Centralized view of all invoices across all deals. Four KPI tiles at the top (unaffected by the table filters):


| Tile                        | What it counts                                                      |
| --------------------------- | ------------------------------------------------------------------- |
| Outbound — Awaiting payment | Client invoices (Huspy → client) that are Issued but not yet Paid   |
| Outbound — Collected        | Client invoices marked Paid                                         |
| Agent invoices — Pending    | Agent invoices submitted to Huspy (Issued, awaiting Finance review) |
| Agent invoices — Paid       | Agent invoices that have been paid out                              |


The table can be filtered by **direction** (outbound = client-facing; inbound = agent-facing), **status**, and **currency**.

### Invoice Actions (in the Invoice Detail)


| Action        | Constraint                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------ |
| Issue invoice | Moves Draft → Issued. Invoice is now sent to counterparty.                                 |
| Mark as Paid  | Requires a **payment reference number**. Proof of payment file is optional.                |
| Cancel        | A written **cancellation reason** is mandatory. Can be applied to Issued or Paid invoices. |


---

## Finalizing a Deal (Automatic)

When Finance marks the last outbound invoice as Paid, the system **automatically** transitions the deal to **Finalized**. This is not a manual step in the status dropdown.

What the auto-finalization creates:

- Locks the deal permanently — no further changes
- Creates a commission accrual posting: agent commission liability is credited to the agent's individual subledger
- The agent sees a new entry appear in their Earnings ledger

> Agent payout is **not** triggered at finalization. The deal closing creates the liability; the actual bank transfer happens later when Finance reviews and pays the agent's inbound invoice.

---

## Vendor Invoices

If the deal had external deductions (e.g. a €500 notary fee, a conveyance provider), those parties submit their own invoices to Huspy after the deal closes. Finance logs these as inbound invoices in the Invoices tab, verifies amounts against the deal's Operational Deduction stakeholders, and pays them out. Each payment creates a `bank_statement_outbound_matched` posting against the relevant external liability subledger.

---

## Agent Management

<!-- SCREENSHOT: Karvel agents list — searchable table with status badges (Onboarding / Active / Churned) -->

<!-- SCREENSHOT: Karvel agent detail — profile tabs (Overview, Documents, Deals, Ledger, Financials) -->

The Agents section has a searchable, filterable list of all agents with status badges (Onboarding / Active / Churned). Each agent profile has eight tabs:


| Tab               | What it contains                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**      | Personal details, working zones, agent ID, activation/archive controls                                                                                                  |
| **Documents**     | Compliance documents (KYC, passport, IBAN, license) — Ops can upload, approve, waive, or reset each one                                                                 |
| **Clients**       | Planned — not yet live                                                                                                                                                  |
| **Properties**    | Planned — not yet live                                                                                                                                                  |
| **Opportunities** | Planned — not yet live                                                                                                                                                  |
| **Deals**         | All deals linked to the agent with status, market, commission payout                                                                                                    |
| **Ledger**        | The agent's subledger: running balance, full posting history. Finance can create manual postings here (bonuses, adjustments, reversals) using a full double-entry form. |
| **Financials**    | Commission structure: Flat %, Max with cap, or Slab (progressive tiers). Also shows Team Lead and Manager overhead rates.                                               |


### Payout Run

Finance processes agent invoices in bulk, not one at a time. On payday, Finance filters the Invoices tab for Inbound → Issued, verifies each agent's VAT and withholding tax calculations, executes the wire transfers via the bank portal, and marks each invoice as Paid in Karvel. This creates `bank_statement_outbound_matched` postings that clear the agent subledger balances to zero.

---

## Document Requirements Tab (Global Templates)

Manages the templates that determine what documents are required for each deal type. Changes here affect all new deals going forward — it is not a per-deal view.

Matrix organized by **Business Unit** (REBU / Mortgage) × **Market** (Primary / Secondary / Leasing) × **Country** (AE, ES, SA):


| Value        | Meaning                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| **Required** | Mandatory — deal cannot advance to Pending Agent Approval without this document |
| **Optional** | Shown on the deal but can be waived by Ops                                      |
| **Off**      | Not shown on deals for this market/country combination                          |


Ops can also attach a template file per document per country (for agents to download and fill in), add new document types, or remove existing ones.

---

## Ledger Tab

The Ledger tab is a global view of all accounting postings in the system. Finance uses it to inspect any posting in detail — seeing which accounts were debited and credited, the business event that triggered the posting, the linked deal or invoice, and the value date.

Finance can also create manual postings directly from this view for corrections, bonuses, or adjustments that fall outside the automated flows (e.g. a one-off incentive or a withholding tax correction). All manual postings require a full double-entry form: both sides must balance before the posting can be saved.