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

# 2. Phases

## 2.1 What the MVP is (WIP)

The MVP is Spain REBU end-to-end, the full cycle from deal intake to agent payment, but scoped to one market and one business unit.

**Why Spain REBU first:**

* Agent app is live. The process is known, the stakeholders are familiar, the edge cases are documented
* Spain has the most complex tax handling (IVA + IRPF withholding) — if the accounting engine works here, UAE and Saudi Arabia are simpler.
* Spain will have similar setup to other European countries in scope.
* REBU is the higher-volume BU.
* REBU has simpler commission structures

**What MVP includes:**

| Area | In MVP | Cut to Phase 2+ |
| --- | --- | --- |
| Deal lifecycle | Full (under-review → finalized + canceled) + all 3 deal creation flows | CPL agent flow in Spain |
| Stakeholder & P&L | Full waterfall, all stakeholder types | Connected agent (TL/Manager) overhead UI? |
| Document requirements | Per-deal checklist, approve/waive, upload | Deal configuration template editing (can seed manually) |
| Third party invoicing | Draft → Issued → Paid, accounting entries | - |
| Agent confirmation | Pending-details + pending-agent-approval flows | - |
| Agent invoice (Spain) | Factura upload, IVA/IRPF selection, Finance approval | UAE auto-generated invoice Salaried agents payroll calculation |
| Accounting | All automated postings, manual correction, agent subledger | Ledger creation |
| Karvel | Deals, Invoices, Ledger tabs | Deal Configuration tab (can seed data directly) |
| Agent app | Deals tab (all statuses), Earnings tab | - |
| Agent management | Financials tab Bulk agent financials upload | Deals tab, Ledger Tab |
| Bank statements ingestion | - | Phase 3 |
| Payout integration | - | Phase 3 |

---

# 3. Timeline & Engineering Capacity

## 3.1 Summary

| Phase | Scope | Duration | Team size |
| --- | --- | --- | --- |
| **Phase 1** | Spain REBU end-to-end | 3 months | 3 engineers |
| **Phase 2** | - | - | - |
| **Phase 3** | - | - | - |

Total to full multi-market, multi-BU coverage: **\~10 months**.

---

## 3.2 Phase 1 — Spain REBU

**Critical path:** accounting engine → deal lifecycle API → Karvel UI → Agent App UI → Invoice payout flow

The accounting engine (posting/ledger invariants, double-entry correctness) is the highest-risk component. It must be built and validated before the invoicing and payout flows can be tested end-to-end. Everything downstream depends on it being correct.

| Month | Milestones |
| --- | --- |
| M1 | Backend: data model, deal CRUD, stakeholder API, P&L waterfall engine |
| M2 | Backend: invoicing, accounting posting engine, agent subledger |
| M3 | Karvel and Agent app wired to real API. E2E testing + Spain REBU launch |

**Engineering capacity — Phase 1:**

| Role | Headcount | Owns |
| --- | --- | --- |
| Backend engineer | 2 | Domain model, deal lifecycle, invoicing, accounting engine, agent payout, database |
| Frontend engineer | 1 | Karvel (Deals/Invoices/Ledger) + Agent app (Deals + Earnings) |

Product and design are assumed available throughout. QA embedded with engineers rather than a separate headcount — each engineer owns their test coverage.

## 3.3 Key Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Poor Ops adoption due to exceptions | High - information scattered in multiple sources. Key process components still in google sheet. Data integrity compromised.  | Ensure approval of main ops finance stakeholders. Extensive prototype testing for key operators. |
| MBU posting shape differs from REBU | Medium - wrong posting creation timing and wrong ledgers | Prototype MBU accounting entries with finance team |
| Agent app adoption | Medium - agents may continue relying on Ops if UX is poor | Ship agent app with Spain REBU in Phase 1, gather feedback before Phase 2 expansion |
| Accounting engine correctness | Low - errors in double-entry are silent and compounding | Accounting source of truth will still be what's uploaded to Xero. Ledger entries in shadow mode. |

# 4. Prototypes

**Github** repo [here](https://github.com/fulviogargiulo/deals-prototype)

**Karvel app** prototype on Vercel [here](https://huspy-deals-karvel-app.vercel.app/)

**Agent app** prototype on Vercel [here](https://huspy-deals-agent-app.vercel.app/)
