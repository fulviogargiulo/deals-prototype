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

# 4. Architectural & Product Decisions

Four questions a director of engineering or product would push on before greenlighting the build.

## 4.1 Build vs buy: what we own, and what we rent

Two adjacent products exist on the market. We rent one and build the other.

**Statutory accounting → Xero (bought).** Books of record, tax filings, audit trail. No reason to rebuild. Xero stays the source of truth while our postings run in shadow mode; flipping that is a Phase 2+ decision gated on a measured zero-divergence window (§3.3 risk row 4).

**Incentive Compensation Management → CaptivateIQ / Salesforce Spiff / Everstage (declined).** These ICM tools target SaaS sales orgs: one rep owns one deal, a *plan* is the unit of configuration, attainment-vs-quota drives payout. Our deals carry multi-stakeholder splits per deal (Closer + Lister + Team Lead + Manager + internal referrer), Spain IRPF withholding, and connected-agent overlays funded by Huspy. Modelling that as a "plan" fights the tool, and the data they'd need (deals, stakeholders, blueprints, agent financials) lives in our system anyway — integration cost roughly equals build cost.

**What we therefore own:** deal model, stakeholder waterfall, P&L engine, transactional subledger. The subledger is the expensive piece; §4.3 explains why it's not optional.

## 4.2 Domain shape: four choices, each tied to a concrete case

| Choice | Why this shape | Alternative we rejected |
| --- | --- | --- |
| `Party` is its own entity, dedup by `taxId` | The same legal entity shows up as client, referral source, and later as agent. One join hop, single KYC update point | Duplicate person rows across `Client` and `Agent` |
| `DealStakeholder` polymorphic with signed `financialAmount` | Six roles share one shape because the waterfall switches on role anyway; "list every party on this deal" stays a single query | Six role-typed tables, six joins to render a deal |
| `Invoice` is a billing doc; `PostingLine.invoiceId` is a back-pointer | Lets one inbound factura claim N deals' commission lines (Spain monthly batch) and answers settlement state without a sync flag | 1:1 invoice-to-deal, manual settlement flag |
| Tax rates live in `Blueprint` data, not code | VAT and IRPF change by government decree — Spain has moved IRPF three times in five years. Phase 1 seeds rows; Phase 2 adds editor if ops self-serve becomes the bottleneck | `if (country === 'ES' && bu === 'REBU')` branches in the posting engine |

## 4.3 Why a subledger isn't optional (and how MBU forces it)

"Even Revolut didn't build a ledger" is misleading. Revolut runs a transactional ledger engine internally — what they don't run is statutory bookkeeping. Same split here: bookkeeping → Xero, transactional sub-ledger → us.

Phase 1 (Spain REBU) could *just about* be served by Xero AP plus a simple commission calculator. Phase 2 (MBU) cannot. Three MBU requirements have no shape in Xero:

1. **Multi-party running balances.** Banks, mortgage consultants, MA/BYOB/BBG brokers all carry ongoing balances with Huspy across many deals — see [pnl-engines.md §2](pnl-engines.md). Xero gives one number per vendor, post-invoice.
2. **Cadence settlement.** Brokers and MCs are paid weekly or monthly, with one factura claiming N deals' commissions. Modelled as `commission_accrual` postings per deal, claimed later by one invoice with `dealId = null` (see [domain-model.md §2.4](domain-model.md)).
3. **Non-deal events.** Training fees, bonuses, manual adjustments land on the party's balance without belonging to a deal.

**The trade-off worth naming.** A "subledger without double-entry" — single `SubledgerEntry` rows instead of balanced `Posting` + `PostingLine` pairs — would deliver all three at ~60-70% of current cost. What it sacrifices: balanced-postings invariant (reversals become ad-hoc), automated journal sync to Xero, and ledger-level auditability. Finance acceptance is the gate. The double-entry layer is the marginal call, and the one to defend on audit grounds.

## 4.4 Scope discipline: how this stays a 3-month MVP, not a 3-year platform

Finance projects bloat when the team builds the **generalisation layer** — CoA editor, tax-rule builder, plan-template designer, doc-checklist editor — before the specific case ships. Each is a mini-product.

Phase 1 ships none of them. Authoring UIs are replaced by seed data:

| Concept | Phase 1 | Phase 2+ |
| --- | --- | --- |
| Chart of accounts | Seeded ledgers | Ledger creation UI |
| Tax rates per `(country, BU, dealType)` | Seeded `Blueprint` rows | Blueprint editor |
| Document checklists | Seeded `DocumentRequirementTemplate` rows | Template editor |
| Agent commission terms | Seeded `AgentFinancials` | Agent configuration tab |
| P&L engines | `rebu` only | `mbu-ma-broker`, `mbu-direct`, `manual` |
| Bank statement ingestion | Manual mark-as-paid | CSV / API ingestion |
| Payout execution | Out of scope | Bank rail integration |

Confirmed against the [Spain REBU MVP scope](spain-rebu-mvp.md): rebu-engine only, ledgers hardcoded, agent financials hardcoded, document templates hardcoded.

**Principle.** We are building a deal system that happens to keep clean books — not an accounting platform that happens to know about deals. Every scope conversation is rooted there.

# 5. Prototypes

**Github** repo [here](https://github.com/fulviogargiulo/deals-prototype)

**Karvel app** prototype on Vercel [here](https://huspy-deals-karvel-app.vercel.app/)

**Agent app** prototype on Vercel [here](https://huspy-deals-agent-app.vercel.app/)
