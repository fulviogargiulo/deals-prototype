<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2431909889 -->

# 1. Intro

## 1.1 Key Problems To Solve

* Advisors/Collaborators don't have visibility about the status of their payments and invoices. They constantly have to follow up with Huspy ops and finance teams which creates operational overhang and delays.
* Invoice mismatches for Advisors/Collaborators because of stale data in Huspy systems.
* Manual commission calculations, invoicing, and payments create possible delays and surface area for inaccuracies.
* Ops heavy process, we currently have X MBU and REBU agents/collaborators/brokers. Communication and handling ops overhead of all deals and actors involved does scale linearly with company growth.

## 1.2 Scope

Deals and Payments team scope starts from an offer getting closed and ends at Huspy successfully settling payments to all parties involved and accounting the same in its books.

**The Deals ecosystem handles:**

* Deal intake and validation (documents, stakeholder identity)
* P&L and commission calculation (dynamic agent commission structures: slabs, caps, flat, bonuses)
* Receivables and payables (invoicing clients, receiving agent invoices)
* Accounting (double-entry ledgers for all financial events)

**It does not handle:**

* Property searching or CRM lead generation (handled upstream)
* Corporate payroll for salaried employees

## 1.3 Goal

* Standardize P&L and agent payout structures across all markets and business units
* Reduce manual spreadsheet tracking and reduce payout errors
* Create fully auditable, double-entry financial records for every event and clear deal financials data
* Give agents real-time visibility into their deal pipeline, commission breakdowns, and invoice lifecycle

# 2. Prototypes

**Github** repo [here](https://github.com/fulviogargiulo/deals-prototype)

**Karvel app** prototype on Vercel [here](https://huspy-deals-karvel-app.vercel.app/)

**Agent app** prototype on Vercel [here](https://huspy-deals-agent-app.vercel.app/)
