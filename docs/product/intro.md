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

## 2.1 What the MVP is

The MVP is Spain REBU end-to-end, in production, replacing the current manual process entirely. Not a partial implementation — the full cycle from deal intake to agent payment, but scoped to one market and one business unit.

**Why Spain REBU first:**
- It is already partially live — the process is known, the stakeholders are familiar, the edge cases are documented
- Spain has the most complex tax handling (IVA + IRPF withholding) — if the accounting engine works here, UAE and Saudi Arabia are simpler
- REBU is the higher-volume BU — the operational pain is felt most acutely here
- MBU mortgage deals require broker rate slab infrastructure that doesn't exist yet; REBU has simpler commission structures

**What MVP includes:**

| Area | In MVP | Cut to Phase 2+ |
| --- | --- | --- |
| Deal lifecycle | Full (under-review → finalized + canceled) | Offer entity → auto deal creation |
| Stakeholder & P&L | Full waterfall, all stakeholder types | Connected agent (TL/Manager) overhead UI |
| Document requirements | Per-deal checklist, approve/waive, upload | Deal configuration template editing (can seed manually) |
| Client invoicing | Draft → Issued → Paid, accounting entries | — |
| Agent confirmation | Pending-details + pending-agent-approval flows | — |
| Agent invoice (Spain) | Factura upload, IVA/IRPF selection, Finance approval | UAE auto-generated invoice |
| Accounting | All automated postings, manual correction, agent subledger | Bulk posting CSV upload |
| Karvel | Deals, Invoices, Ledger tabs | Deal Configuration tab (can seed data directly) |
| Agent app | Deals tab (all statuses), Earnings tab | Income Details / pipeline summary view |
| Agent management | Deals tab, Ledger tab, Financials tab | Bulk agent financials upload |

The Deal Configuration tab (document templates, broker rate slabs) is a nice-to-have for MVP — Ops can manage this via data seeding initially. Ship it early Phase 2.

---

## 2.2 Phase 2 — UAE REBU + MBU (all markets)

Once the accounting engine is validated in production on Spain REBU, expand to:

- **UAE REBU** — AED currency, 5% VAT on both sides, auto-generated agent invoices (no self-invoicing restriction), Emirates ID party deduplication
- **MBU Mortgage** — Broker rate slab engine, MA/Broker channel, different commission structure from REBU. UAE first, then Saudi Arabia
- **Deal Configuration tab** — Ops-managed document requirement templates and broker rate slab uploads
- **Offer entity** — Automatic deal creation when an agent's offer is accepted (reduces Ops manual entry)
- **Income Details / pipeline view** in Agent app
- **Connected agent overhead** (Team Lead / Manager rates calculated and surfaced in UI)
- **Bulk CSV upload** for deals and agent financials

Risk note: MBU accounting entries differ from REBU (broker receives bank payment, not Huspy → agent). Validate posting shapes before shipping.

---

## 2.3 Phase 3 — Saudi Arabia + Scale

- **Saudi Arabia** — SAR currency, 15% VAT, local compliance requirements
- **Salaried agent payroll export** — ledger entries exported to HR/payroll system
- **Bulk payout run** — Finance marks multiple agent invoices paid in one action
- **Secondary and Leasing market variants** — document templates and P&L rules for non-primary deals
- **Reporting and analytics** — deal profitability by market/BU/agent, commission trend dashboards

---

# 3. Timeline & Engineering Capacity

## 3.1 Summary

| Phase | Scope | Duration | Team |
| --- | --- | --- | --- |
| **Phase 1** | Spain REBU end-to-end | 3 months | 2 BE + 1 FE |
| **Phase 2** | UAE REBU + MBU all markets + Deal Config + Offer entity | 3 months | 2 BE + 1 FE + 1 BE (MBU) |
| **Phase 3** | Saudi Arabia + scale features | 2.5 months | 2 BE + 1 FE |

Total to full multi-market, multi-BU coverage: **~8.5 months**.

DevOps is borrowed time from the existing platform team (~1–2 days to provision the service) — not a dedicated headcount.

---

## 3.2 Phase 1 — Spain REBU (Months 1–3)

**Critical path:** accounting engine → deal lifecycle API → Karvel UI → Agent App UI → Finance payout flow

The accounting engine (posting/ledger invariants, double-entry correctness) is the highest-risk component. It must be built and validated before the invoicing and payout flows can be tested end-to-end. Everything downstream depends on it being correct.

The prototype substantially reduces frontend effort — screens, components, and UX patterns are already built. The FE engineer is wiring real APIs and handling auth/loading/error states, not designing from scratch.

| Month | Milestones |
| --- | --- |
| M1 | Service setup + event schema approval. Backend: data model, deal CRUD, stakeholder API, P&L waterfall engine, accounting posting engine |
| M2 | Backend: invoicing (outbound + inbound), agent subledger, commission accrual, Spain IVA/IRPF. Karvel: Deals + Invoices tabs wired to API |
| M3 | Karvel: Ledger tab. Agent app: Deals tab + Earnings tab + statement generation. E2E testing + Spain REBU launch |

**Engineering capacity — Phase 1:**

| Role | Headcount | Owns |
| --- | --- | --- |
| Backend engineer | 2 | Domain model, deal lifecycle, invoicing, accounting engine, agent payout |
| Frontend engineer | 1 | Karvel (Deals/Invoices/Ledger) + Agent app (Deals + Earnings) — wiring prototype to real API |
| **Total** | **3** | |

This works because the spec is locked (the prototype encodes it), engineers are senior, and the existing platform handles auth, docs, notifications, and infra. The accounting engine is the one component that needs the most care — plan for 1 BE to own it exclusively in M1.

---

## 3.3 Phase 2 — UAE REBU + MBU (Months 4–6)

Phase 1's architecture carries forward. Phase 2 adds currency/tax expansion, the MBU broker engine, and two new features (offer entity, deal config tab).

| Month | Milestones |
| --- | --- |
| M4 | UAE currency/tax config. UAE REBU deals live. Deal Configuration tab (doc templates + broker rate slabs) |
| M5 | MBU MA/Broker engine. Broker rate slab resolution. MBU UAE live. Offer entity → auto deal creation |
| M6 | MBU Spain. Income Details in agent app. Connected agent overhead. Bulk uploads |

**Engineering capacity — Phase 2:**

| Role | Headcount | Owns |
| --- | --- | --- |
| Backend engineer | 2 | Market/currency expansion, Config Server integration, offer entity |
| Backend engineer (MBU) | 1 | Broker rate slab engine, MBU-specific posting shapes — can be a Phase 1 BE ramping into MBU domain |
| Frontend engineer | 1 | Deal Config tab, Income Details, connected agent UI |
| **Total** | **4** | |

The MBU broker rate engine and its posting shapes differ materially from REBU. Validate the accounting entries with Finance before M5 implementation starts (Phase 1 exit criterion).

---

## 3.4 Phase 3 — Saudi Arabia + Scale (Months 7–9)

| Month | Milestones |
| --- | --- |
| M7 | Saudi Arabia REBU + MBU. SAR accounting, 15% VAT, local compliance |
| M8 | Bulk payout run. Salaried agent payroll export. Secondary/Leasing market variants |
| M9 | Reporting and analytics. Performance hardening. Full regression across all markets |

**Engineering capacity — Phase 3:**

| Role | Headcount | Owns |
| --- | --- | --- |
| Backend engineer | 2 | Saudi Arabia market, bulk operations, payroll export |
| Frontend engineer | 1 | Reporting dashboards, bulk payout UI |
| **Total** | **3** | |

---

## 3.5 Key Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Accounting engine correctness | High — errors in double-entry are silent and compounding | Extensive unit tests on posting invariants before any UI is wired up |
| Spain legal compliance (IVA/IRPF) | High — incorrect withholding creates tax liability | Early review with Huspy's Spain finance/legal team in M1 |
| MBU posting shape differs from REBU | Medium — wrong subledger credits | Prototype MBU accounting entries with finance team before M6 implementation |
| Agent app adoption | Medium — agents may continue relying on Ops if UX is poor | Ship agent app with Spain REBU in Phase 1, gather feedback before Phase 2 expansion |
| Deal volume growth outpacing DB schema | Low in Phase 1, Medium by Phase 3 | Partition ledger tables by currency from day one |

# 4. Architecture & Integration

Deals is a **new domain service** in Huspy's existing microservices platform. The platform uses event-driven architecture (Kafka event bus), Keycloak for auth, and Aurora PostgreSQL for data storage. Several core capabilities already exist and must be integrated — not rebuilt.

## 4.1 What's Free (Integrate, Don't Build)

| Capability | Existing Service | What Deals uses it for |
| --- | --- | --- |
| **Auth & RBAC** | Identity / Keycloak | Add `deals:ops`, `deals:senior_ops`, `deals:finance`, `deals:agent` roles. Zero auth engineering. |
| **Document storage & PDF generation** | Doc Service | Agent document uploads (pre-signed S3 URLs), invoice PDF generation from templates |
| **Notifications** | Comms Service | Agent alerts (pending-details, pending-agent-approval, invoice paid) via SMS/WhatsApp/Email/Push. Deals publishes events; Comms reacts. We write the templates, not the plumbing. |
| **Infrastructure** | AWS/EKS/Aurora PostgreSQL/Kafka | Aurora PostgreSQL is correct for double-entry ACID. Kafka for event bus. Standard CICD via ArgoCD + Jenkins. |

## 4.2 Open Decisions (Must Resolve Before Phase 1 Starts)

**Party entity ownership**

Our domain model has a `Party` entity — the single identity record for every buyer, seller, agent, bank, notary. The existing architecture has no clear owner for this. Decision needed:

- **Option A (recommended):** Deals owns `Party` in Phase 1. Pragmatic, unblocks development. Flag for promotion to a Core service in Phase 2 if other domains need it.
- **Option B:** Coordinate a new Core Party service upfront. Architecturally cleaner but adds cross-team dependency and delays Phase 1.

**BFF integration**

Karvel and Agent App go through the existing BFF (aggregation layer). The BFF team would need to add Deals aggregation. If they are at capacity, this blocks frontend work.

- **Recommendation:** Deals exposes its own API directly to the frontends for Phase 1 (skip BFF). Integrate into the BFF in Phase 2. Not architecturally ideal but avoids a coordination bottleneck on the critical path.

## 4.3 Key Constraints

**Event schema governance adds lead time to M1**

Every domain event Deals publishes (`DealStatusChanged`, `InvoiceIssued`, `AgentInvoicePaid`, etc.) must be designed and approved through the Schema Registry before development begins. This is ~1–2 weeks of design work that must happen at the start of M1 — not mid-sprint. Starting to code before events are approved means rework.

**Workflow Engine (Camunda) — defer to Phase 2**

The deal lifecycle is a Camunda candidate (multi-party confirmation loops, auto-finalization, future SLA chasing). The architecture principle says complex business processes → Camunda. For Phase 1, the state machine is small enough (6 states, well-defined transitions) to live inside the Deals service. **Phase 1 uses an internal state machine. Phase 2 evaluates migration to Camunda** when chasing workflows and SLA automation become requirements.

**Config Server — defer to Phase 2**

Document requirement templates and broker rate slabs (Deal Configuration tab) are exactly what the Config Server (rule engine) is designed for. Phase 1 seeds this data directly. Phase 2 integrates with Config Server so Ops can manage configuration without engineering involvement.

## 4.4 Phase 2 Dependency: Mortgage Service Events

For MBU auto-deal creation (offer → deal triggered by a disbursed mortgage), Deals needs to consume Mortgage service domain events. The Mortgage service currently has no documented event catalog. **This must be resolved with the Mortgage team during Phase 1** — not at the start of Phase 2. It is a Phase 1 exit criterion.

## 4.5 Revised Phase 1 Timeline

The original 4-month estimate should be revised to **4.5–5 months**. The additional time accounts for:

- Event schema design and Schema Registry approval (~2 weeks, M1)
- Service scaffolding: K8S deployment config, DB provisioning, Keycloak role setup (~1–2 weeks, M1)

These are fixed costs that must happen before feature development starts, not risks that may or may not materialise.

# 5. Prototypes

**Github** repo [here](https://github.com/fulviogargiulo/deals-prototype)

**Karvel app** prototype on Vercel [here](https://huspy-deals-karvel-app.vercel.app/)

**Agent app** prototype on Vercel [here](https://huspy-deals-agent-app.vercel.app/)
