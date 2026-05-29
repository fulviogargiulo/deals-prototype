# Jira Backlog — Draft (FP project)

> Draft of initial Jira tickets for the Finance Product (FP) board, to be created once the spec stabilises after Monday's sync with Gio and the Spain REBU MVP scope is locked with Gabriel. **Don't bulk-create yet.**
>
> Target board: [FP board 2391](https://huspy.atlassian.net/jira/software/projects/FP/boards/2391)

---

# 1. Huspy ticket conventions (observed from OPPS)

## 1.1 Title format

| Type | Pattern | Examples |
| --- | --- | --- |
| Epic | `[Quarter][Tag] Outcome-focused title` | `[Q2'26][UAE] Karvel Coaching` · `[Q2'26][Expansion] Italy & Turkey launch` · `[Q2'26][KTLO] - Keep the Lights On` |
| Task / Story | `[Team][Priority] Action-focused title` | `[BE][P1] Migrate Client SourceInfo from old values` · `[FE][Watchman][Mobile] Implement new claim flow for Spain` · `[BE][P0] Expose offer contacts` |

**Tag taxonomy:**
- Quarter — `Q1'26`, `Q2'26`, `Q3'26`
- Initiative / Market / Theme — `UAE`, `Expansion`, `KTLO`, `Spain REBU` (new)
- Team — `BE`, `FE`, `BE][Watchman` (codename for sub-team)
- Priority — `P0`, `P1` (optional, used on tasks)

**Labels** mirror the bracket tags (`[BE]`, `[FE]`, `[OOTO]`, etc.).

## 1.2 Epic description template

Reference: [Confluence — [Template] - Jira Epic](https://huspy.atlassian.net/wiki/spaces/corp/pages/1657110539/Template+-+Jira+Epic)

```
Title:
[Clear, outcome-focused title]

Epic Goal:
[One-sentence objective of this Epic]

Problem Statement:
[Problem being solved and its impact on users or the business]

Solution Overview:
[Link to Feature Page / BRD in Confluence covering the Epic scope]
```

## 1.3 Story / Task description template

Observed across OPPS tasks:

```
📝 Title
As a [user type], I want to [action], so that [goal].

🧠 Description
What the feature does and why it matters. Business context if relevant.

✅ Acceptance Criteria  (Given / When / Then)
1. Given [state], When [action], Then [outcome].
2. Given [state], When [action], Then [outcome].

🧭 User Flow / Screens
- Figma: [link]
- Screens: [list]

📊 Tracking / Events
- `event_name_1`
- `event_name_2`
```

Pure technical tasks (no user-facing change) skip the "As a..." line and use a plain Summary / Context / Acceptance Criteria / Other information structure — see [OPPS-3244](https://huspy.atlassian.net/browse/OPPS-3244) as an example.

---

# 2. Phase 1 Epics — Spain REBU MVP

8 epics. One per major workstream, mapped to the [Spain REBU MVP scope table](spain-rebu-mvp.md#1-scope). Quarter tag is provisional (`Q3'26`) — adjust once engineering kick-off date is confirmed.

## 2.1 `[Q3'26][Spain REBU] Deal Lifecycle`

**Epic Goal:** Ship the full deal state machine in Karvel and the Agent App, with both deal-creation entry points (offer submission + CSV upload).

**Problem Statement:** Today, deal state is tracked across spreadsheets and ops follow-ups. Ops cannot tell at a glance which deals are blocked, agents cannot see what stage their deals are at, and creating a new deal requires manual hand-offs between systems. Addresses problem §1.1.1 (agent visibility) and §1.1.4 (ops scaling).

**Solution Overview:** [lifecycle.md](lifecycle.md) · [domain-model.md](domain-model.md) · [Spain REBU MVP scope §1, row "Deal lifecycle"](spain-rebu-mvp.md)

**Out of scope (Phase 2+):** Single-deal creation UI.

---

## 2.2 `[Q3'26][Spain REBU] Deal P&L & Stakeholders`

**Epic Goal:** Compute the full P&L waterfall for every Spain REBU deal, supporting all stakeholder types and connected-agent overlays (if confirmed in REBU Spain — see open question).

**Problem Statement:** Commissions are calculated manually in spreadsheets, with no enforced waterfall structure. Splits, deductions, and connected-agent overheads are computed inconsistently across deals, leading to payout errors and disputes. Addresses problem §1.1.3 (manual commission calculation errors).

**Solution Overview:** [pnl-engines.md](pnl-engines.md) · [domain-model.md §2.2 (DealStakeholder)](domain-model.md) · [intro.md §4.2 — DealStakeholder polymorphism](intro.md)

**In scope:** `rebu` engine only. **Out of scope (Phase 2+):** Connected-agent overhead UI (logic only in MVP); `mbu-ma-broker`, `mbu-direct`, `manual` engines.

---

## 2.3 `[Q3'26][Spain REBU] Deal Document Requirements`

**Epic Goal:** Enforce a per-deal document checklist with approve / waive / upload actions, seeded from a hardcoded template per (market, BU, dealType).

**Problem Statement:** Document requirements vary by market and BU; today they live in ops people's heads. Missing or stale documents block invoicing without surfacing the blocker to anyone. Addresses problem §1.1.2 (invoice mismatches from stale data) and §1.1.4 (ops scaling).

**Solution Overview:** [domain-model.md §1 (DealDocumentRequirement, DocumentRequirementTemplate)](domain-model.md) · [Spain REBU MVP scope §1, row "Document requirements"](spain-rebu-mvp.md)

**Out of scope (Phase 2+):** Deal configuration template editing UI (templates hardcoded in MVP).

---

## 2.4 `[Q3'26][Spain REBU] Outbound Invoicing`

**Epic Goal:** Auto-create outbound invoice drafts on `deal.state = invoicing`, support the full draft → issued → paid lifecycle, and bulk-status upload for payment reconciliation.

**Problem Statement:** Outbound invoices are created manually in Xero with no link back to the originating deal. Reconciling client payments to deals is a spreadsheet exercise. Addresses problem §1.1.2 (invoice mismatches) and §1.1.4 (ops scaling).

**Solution Overview:** [domain-model.md §2.4 (Deal → Invoice → PostingLine)](domain-model.md) · [Spain REBU MVP scope §1, row "Invoice lifecycle"](spain-rebu-mvp.md)

**Out of scope (Phase 2+):** Automated comms to clients on `invoice.state = issued`; [Xero integration](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445574152) (sync written separately).

---

## 2.5 `[Q3'26][Spain REBU] Agent Confirmation & Inbound Invoicing`

**Epic Goal:** Agent-facing flows for confirming deal details and submitting their factura, including IVA / IRPF selection and the posting-line picker that lets one factura claim N deals' commissions.

**Problem Statement:** Agents submit facturas via email or WhatsApp with manual reconciliation against deal commissions. Cadence-batched facturas (one monthly invoice spanning multiple deals) are reconciled by hand. Addresses problem §1.1.1 (agent visibility) and §1.1.3 (manual processes).

**Solution Overview:** [domain-model.md §2.4](domain-model.md) · [intro.md §4.3 — why the subledger isn't optional](intro.md) · [Spain REBU MVP scope §1, rows "Agent confirmation" + "Agent invoice"](spain-rebu-mvp.md)

**Out of scope (Phase 2+):** Salaried agents payroll calculation; OCR for document validation.

---

## 2.6 `[Q3'26][Spain REBU] Accounting Engine`

**Epic Goal:** Automated double-entry postings for every business process (`invoice_issued`, `bank_statement_*_matched`, `commission_accrual`, `agent_invoice_accrual`, `external_cost_accrual`), plus manual correction postings. Postings run in shadow mode against Xero.

**Problem Statement:** Goal §1.3.3 — fully auditable, double-entry financial records for every event. Today, accounting entries are reconstructed after the fact by Finance from invoice CSVs and bank statements. Pre-invoice agent liability is invisible until the factura lands.

**Solution Overview:** [domain-model.md §2.5 (Posting → PostingLine → Ledger)](domain-model.md) · [accounting-101.md](accounting-101.md) · [intro.md §4.1 — build vs buy](intro.md) · [intro.md §4.3 — subledger is non-negotiable](intro.md)

**Out of scope (Phase 2+):** Ledger creation UI (chart of accounts hardcoded in MVP); bank statement CSV / API ingestion (manual mark-as-paid in MVP).

---

## 2.7 `[Q3'26][Spain REBU] Karvel UI Shell`

**Epic Goal:** Karvel app with Deals tab, Invoices tab, Ledger tab, wired to the real API (replacing the prototype's in-memory mocks).

**Problem Statement:** The Karvel prototype demonstrates the workflow but runs on mock data. Ops cannot use it as a daily tool until it connects to real APIs with auth, persistence, and live state.

**Solution Overview:** [Karvel prototype on Vercel](https://huspy-deals-karvel-app.vercel.app/) · [Spain REBU MVP scope §1, row "Karvel UI"](spain-rebu-mvp.md)

**Out of scope (Phase 2+):** Deal Configuration tab; Agent configuration tab (financials hardcoded in MVP).

---

## 2.8 `[Q3'26][Spain REBU] Agent App — Deals & Earnings`

**Epic Goal:** Ship Deals tab (all statuses) and Earnings tab in the Agent App, giving agents live visibility into deal status, accrued commissions, and invoice/payment state.

**Problem Statement:** Direct hit on §1.1.1 — agents currently chase ops for payment and invoice status. Earnings tab is the answer to "what does Huspy owe me right now, by deal."

**Solution Overview:** [agent-journey.md](agent-journey.md) · [Agent App prototype on Vercel](https://huspy-deals-agent-app.vercel.app/) · [Spain REBU MVP scope §1, row "Agent app UI"](spain-rebu-mvp.md)

---

# 3. Tasks — Open Questions

Each row of [spain-rebu-mvp.md §2](spain-rebu-mvp.md) is a real action item with an owner. Create as `Task` (not `Story` — there's no user-facing change yet). One ticket per question; close when the answer is captured in the MVP page.

Suggested title prefix: `[Q&A][Spain REBU]`.

## 3.1 `[Q&A][Spain REBU] Identify owners per process step`

**Summary:** Map each step of the Spain REBU deal-to-payment process to the team / person who owns it (ops, finance, agent management).

**Context:** We need named owners before we can scope sub-tasks or write acceptance criteria for ops-facing flows.

**Acceptance criteria:**
- A table is appended to [spain-rebu-mvp.md](spain-rebu-mvp.md) listing each step and the responsible team / individual.
- Reviewed with Gabriel and ops lead.

**Suggested assignee:** Fulvio (with Gabriel)

---

## 3.2 `[Q&A][Spain REBU] Confirm deal creation entry points and CSV template`

**Summary:** Decide whether deal creation is offer-submission-driven, CSV-upload-driven, or both. Validate the CSV template.

**Context:** Two creation flows are in scope for MVP. We need the CSV column spec and the trigger conditions for each path before [Deal Lifecycle epic](#21-q326spain-rebu-deal-lifecycle) can be broken into stories.

**Acceptance criteria:**
- CSV template confirmed and attached to MVP page.
- Decision recorded on which flow is primary for Phase 1.

**Suggested assignee:** Fulvio (with Gio — Monday sync)

---

## 3.3 `[Q&A][Spain REBU] Define document requirements per deal`

**Summary:** List the documents required per Spain REBU deal. Confirm whether requirements vary by channel or market.

**Context:** Blocks the seed data for `DocumentRequirementTemplate` rows in [Deal Document Requirements epic](#23-q326spain-rebu-deal-document-requirements).

**Acceptance criteria:**
- Document list captured in MVP page.
- Variance by channel / market confirmed.

**Suggested assignee:** Fulvio (with Spain ops)

---

## 3.4 `[Q&A][Spain REBU] Confirm connected agents in REBU Spain`

**Summary:** Do we have connected-agent (Team Lead / Manager) cuts in REBU Spain?

**Context:** Drives whether the [P&L epic](#22-q326spain-rebu-deal-pl--stakeholders) needs the connected-agent overlay logic in Phase 1 or can defer it to Phase 2.

**Acceptance criteria:**
- Yes / no decision recorded.
- If yes: structure of TL / Manager cut documented (% of agent net? fixed?).

**Suggested assignee:** Fulvio (with Spain ops + Marc)

---

## 3.5 `[Q&A][Spain REBU] Decide P&L approval flow`

**Summary:** Do we need a P&L approval flow involving multiple ops users (e.g. ops approves, finance signs off)?

**Context:** Affects the state machine in the [Deal Lifecycle epic](#21-q326spain-rebu-deal-lifecycle) and the role / permission model.

**Acceptance criteria:**
- Approval flow decision recorded (single approver vs multi-step).
- If multi-step: role list and transition rules documented.

**Suggested assignee:** Fulvio (with ops + finance)

---

## 3.6 `[Q&A][Spain REBU] Document 10% notary payment fund flow`

**Summary:** How does the 10% notary payment work end-to-end? Who pays, who receives, when, and how does it appear in the deal's P&L and accounting entries?

**Context:** Notary handling is a Spain-specific edge case in the fund flow that needs to land somewhere in [pnl-engines.md](pnl-engines.md) or [accounting-101.md](accounting-101.md). Blocks the [Accounting Engine epic](#26-q326spain-rebu-accounting-engine) for the notary case.

**Acceptance criteria:**
- Fund flow documented (sender, recipient, timing, posting shape).

**Suggested assignee:** Fulvio (with Spain ops)

---

## 3.7 `[Q&A][Spain REBU] External co-agency invoice ingestion`

**Summary:** How are non-agent invoices (e.g. external co-agency) sent to Huspy? Do we store them in Karvel? How do we reconcile them with the originating deal?

**Context:** Affects scope of [Outbound Invoicing epic](#24-q326spain-rebu-outbound-invoicing) (or whether co-agency needs a sibling inbound flow). Today these likely arrive by email — we need to decide if MVP supports upload + matching or punts to manual.

**Acceptance criteria:**
- Ingestion mechanism decided (upload UI vs out-of-band).
- Reconciliation rule documented.

**Suggested assignee:** Fulvio (with Spain ops + finance)

---

## 3.8 `[Q&A][Spain REBU] Define invoice draft templates`

**Summary:** Provide the templates (legal copy, layout, required fields) for outbound invoice drafts auto-created on `deal.state = invoicing`.

**Context:** Blocks the auto-creation logic in the [Outbound Invoicing epic](#24-q326spain-rebu-outbound-invoicing) — we need the field list and Spain-compliant template.

**Acceptance criteria:**
- Template attached to MVP page.
- Required fields list documented.

**Suggested assignee:** Fulvio (with finance)

---

# 4. What to add later (not now)

- **Stories** under each epic — only once spec is locked and engineers are ~2 weeks from picking them up. Doing it sooner means rewriting them.
- **Platform / engineering enabler tasks** — seed data scripts, CI setup, DB schema migrations — let the tech lead break these out when they onboard.
- **Bugs** — none yet; the prototype is not production.
- **Sub-tasks** — engineering's tool, not yours. Skip.
