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
* REBU is the higher-volume BU. Spain Invoices issued per month: 200, Invoices paid to agents: 250.
* REBU has simpler commission structures (i.e. 1 P&L engine)

**What MVP includes:** check [Spain REBU MVP](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445410312)

---

# 3. Timeline & Engineering Capacity

## 3.1 Summary

| Phase | Scope | Duration | Team size |
| --- | --- | --- | --- |
| **Phase 1** | Spain REBU end-to-end | 3 months | 3 engineers |
| **Phase 2** | - | - | - |
| **Phase 3** | - | - | - |

---

## 3.2 Phase 1 - Spain REBU

**Critical path:** accounting engine → deal lifecycle → Karvel UI → Agent App UI → Invoice payout flow

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
| Poor Ops adoption due to exceptions | High - information scattered in multiple sources. Key process components still in google sheet. Data integrity compromised. | Ensure approval of main ops finance stakeholders. Extensive prototype testing for key operators. |
| MBU posting shape differs from REBU | Medium - wrong posting creation timing and wrong ledgers | Prototype MBU accounting entries with finance team |
| Agent app adoption | Medium - agents may continue relying on Ops if UX is poor | Ship agent app with Spain REBU in Phase 1, gather feedback before Phase 2 expansion |
| Accounting engine correctness | Low - errors in double-entry are silent and compounding | Accounting source of truth will still be what's uploaded to Xero. Ledger entries in shadow mode. |

# 4. Key Architectural & Product Decisions

## 4.1 Build vs buy: what we own, and what we rent

Two adjacent products exist on the market. We rent one and build the other.

**Statutory accounting → Xero (bought).** Books of record, tax filings, audit trail. No reason to rebuild. Xero stays the source of truth while our postings run in shadow mode; possibly flipping that is a Phase 3+ decision gated on a measured zero-divergence window (§3.3 risk row 4). Check [Xero integration](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445574152) for integrating with Xero.

**Incentive Compensation Management → CaptivateIQ / Salesforce Spiff / Everstage (declined).** These ICM tools target SaaS sales orgs: one rep owns one deal, a _plan_ is the unit of configuration, attainment-vs-quota drives payout. Our deals carry multi-stakeholder splits per deal (Closer + Lister + Team Lead + Manager + internal referrer), Spain IRPF withholding, and connected-agent overlays funded by Huspy. Modelling that as a "plan" fights the tool, and the data they'd need (deals, stakeholders, blueprints, agent financials) lives in our system anyway, integration cost roughly equals build cost.

**What we therefore own:** deal model, stakeholder waterfall, P&L engine, transactional subledger. The subledger is the expensive piece; §4.3 explains why it's not optional.

## 4.2 Domain shape: four choices, each tied to a concrete case

| Choice | Why this shape | Alternative we rejected |
| --- | --- | --- |
| `Party` is its own entity, dedup by `taxId` | The same legal entity can show up as client, referral source, agent, broker. One join hop, single KYC update point | Duplicate person rows across `Client` and `Agent` (brokers, agents, internal employees) |
| `DealStakeholder` polymorphic with signed `financialAmount` | Six roles share one shape because the waterfall switches on role anyway; "list every party on this deal" stays a single query | Six role-typed tables, six joins to render a deal |
| `Invoice` is a billing doc; `PostingLine.invoiceId` is a back-pointer | Lets one inbound invoice claim N deals' commission lines (Spain monthly batch) and answers settlement state without a sync flag | 1:1 invoice-to-deal, manual settlement flag |
| Tax rates live in `Blueprint` data, not code | VAT and IRPF change by government decree. Spain has moved IRPF three times in five years. Phase 1 seeds rows; Phase 2 adds editor if ops self-serve becomes the bottleneck | `if (country === 'ES' && bu === 'REBU')` branches in the posting engine |

## 4.3 Why a ledger isn't optional (and how MBU forces it)

Revolut runs a transactional ledger engine internally, what they don't run is statutory bookkeeping. Same split here: bookkeeping → Xero, transactional sub-ledger → us.

For full REBU+MBU coverage across geographies with actors paid at different cadence and grouping, these are three requirements have no shape in Xero:

1. **Multi-party running balances.** Banks, mortgage consultants, MA/BYOB/BBG brokers all carry ongoing balances with Huspy across many deals, see [P&L Engines](https://huspy.atlassian.net/wiki/spaces/corp/pages/2441248770). Xero gives one number per vendor, post-invoice.
2. **Cadence settlement.** Agents, Brokers and MCs can be paid weekly or monthly, with one invoice claiming N deals' commissions. Modelled as `commission_accrual` postings per deal, claimed later. See [Domain Model — 3.5 Deal → Invoice → PostingLine](https://huspy.atlassian.net/wiki/spaces/corp/pages/2431090692/Domain+Model+-+Entity+Relationships#3.5-Deal-%E2%86%92-Invoice-%E2%86%92-PostingLine)
3. **Non-deal events.** Training fees, bonuses, manual adjustments land on the party's balance without belonging to a deal.

**Principle.** We are building a deal system that happens to keep clean books, not an accounting platform that happens to know about deals. Every scope conversation is rooted there.

# 5. Prototypes

**Github** repo [here](https://github.com/fulviogargiulo/deals-prototype)

**Karvel app** prototype on Vercel [here](https://huspy-deals-karvel-app.vercel.app/)

**Agent app** prototype on Vercel [here](https://huspy-deals-agent-app.vercel.app/)
