# Jira Backlog — Draft (FP project)

> Two tiers of tickets:
> - **§2 + §3** — Phase 1 build epics and open questions. Build epics are **blocked** until engineers are hired; open questions are PO-side work feeding the Discovery epic in §4.
> - **§4** — *Active work during the hiring gap*. Discovery, hiring, alignment, decisions. These have closeable weekly outcomes so leadership sees velocity even while the build is blocked.
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

# 2. Phase 1 Build Epics — Foundation + Spain REBU MVP

> **Status: Blocked — Awaiting Engineering.** These epics exist so Phase 1 scope is visible on the board, but no tickets get worked until engineers are hired and §4.1 (Pre-engineering readiness) closes.

10 epics in two layers, deliberately separated so engineers build the foundation **as foundation** (reused by every future market/BU), not as a Spain-specific delivery:
- **§2.1 – §2.5 Foundation** — built once, exercised by Spain REBU MVP first, reused by every Phase 2+ market/BU.
- **§2.6 – §2.10 Spain REBU MVP** — the Spain-specific configurations and workflows on top of the foundation.

Quarter tag is provisional (`Q3'26`) — adjust once engineering kick-off date is confirmed.

---

## Layer A — Foundation (reused across markets/BUs)

### 2.1 `[Q3'26][Foundation] Deal lifecycle + Stakeholder waterfall engine`

**Epic Goal:** Universal deal state machine (under-review → invoicing → finalized + canceled) and the multi-stakeholder waterfall engine. Engine implementations (`rebu`, `mbu-*`) sit on top of this engine; the engine itself is engine-agnostic. Multi-tranche deals (1 deal per arras + 1 per escritura) work out of the box.

**Problem Statement:** Every market and BU needs the same lifecycle semantics: states, transitions, permissions, stakeholder mechanics, waterfall computation. Building this as Spain-specific would force a rewrite when MBU lands.

**Solution Overview:** [lifecycle.md](lifecycle.md) · [domain-model.md §2.2 (DealStakeholder)](domain-model.md) · [intro.md §4.2 — DealStakeholder polymorphism](intro.md)

**Out of scope:** Specific engine implementations (see §2.6 / Phase 2+); single-deal creation UI (Phase 2+).

---

### 2.2 `[Q3'26][Foundation] Invoice lifecycle + Document Requirements framework`

**Epic Goal:** Universal invoice state machine (draft → issued → paid, both directions) with `PostingLine.invoiceId` back-pointer for settlement tracking, and the document-checklist framework (template → per-deal instance with approve / waive / upload).

**Problem Statement:** Direction-handling and document-checklist mechanics are universal. The *content* of templates and the *implementation* of invoice creation (e.g. via Xero) differ per market and live in Layer B.

**Solution Overview:** [domain-model.md §2.4](domain-model.md) · [intro.md §4.2 — Invoice vs PostingLine](intro.md)

**Out of scope:** Spain document templates (§2.7); Xero invoice creation (§2.9); template authoring UIs (Phase 2+).

---

### 2.3 `[Q3'26][Foundation] Accounting engine`

**Epic Goal:** Posting / PostingLine primitives, balanced double-entry invariants, ledger and subledger control-account model, and parameterised posting-business-process templates (`invoice_issued`, `bank_statement_*_matched`, `commission_accrual`, `agent_invoice_accrual`, `external_cost_accrual`, `manual_adjustment`, `reversal`). Shadow-mode sync to Xero.

**Problem Statement:** Accounting is almost entirely foundation — only the tax-account ledgers differ per market, seeded via blueprint data. Posting correctness is the highest-risk Phase 1 component (intro §3.2 critical path).

**Solution Overview:** [domain-model.md §2.5](domain-model.md) · [accounting-101.md](accounting-101.md) · [intro.md §4.1 + §4.3](intro.md)

**Out of scope:** Ledger creation UI (Phase 2+); bank statement CSV / API ingestion (manual mark-as-paid in MVP).

---

### 2.4 `[Q3'26][Foundation] Karvel UI shell`

**Epic Goal:** Karvel app with auth, layout, navigation, and tab structure (Deals, Invoices, Ledger). Wired to the real backend via the BFF. i18n-ready so Spanish copy and future markets are configuration, not rebuild.

**Problem Statement:** The shell is reused unchanged across markets. Building it as Spain-specific would force layout / nav / auth rework on every Phase 2+ launch.

**Solution Overview:** [Karvel prototype on Vercel](https://huspy-deals-karvel-app.vercel.app/)

**Out of scope:** Spanish copy and market-specific tab content (Layer B); Deal Configuration tab; Agent Configuration tab (Phase 2+).

---

### 2.5 `[Q3'26][Foundation] Agent App UI shell`

**Epic Goal:** Deals and Earnings tab structure in the Agent App, wired to the BFF, with i18n + theming. Reusable across all markets via configuration.

**Problem Statement:** Same reasoning as §2.4 — the shell is universal, the content varies per market.

**Solution Overview:** [agent-journey.md](agent-journey.md) · [Agent App prototype on Vercel](https://huspy-deals-agent-app.vercel.app/)

**Out of scope:** Spanish copy and Spain-specific commission breakdown (Layer B).

---

## Layer B — Spain REBU MVP (first concrete implementation)

### 2.6 `[Q3'26][Spain REBU MVP] rebu P&L engine + Spain blueprints`

**Epic Goal:** Implement the `rebu` engine on top of the foundation waterfall (§2.1) and seed Spain blueprints (IVA 21% + IRPF withholding rates) into the Blueprint table referenced by §2.3.

**Problem Statement:** Spain REBU is the first market live; `rebu` is the first of four engines. Connected-agent overlays are **deferred from Spain MVP** per the updated answer in [spain-rebu-mvp.md §2](spain-rebu-mvp.md) — "TL will leave soon; KAM bonuses paid outside product." The capability stays in the foundation (§2.1); only the implementation defers.

**Solution Overview:** [pnl-engines.md §3](pnl-engines.md) · [spain-rebu-mvp.md](spain-rebu-mvp.md)

**Out of scope:** Connected-agent overlay implementation in Spain MVP (deferred); other engines (Phase 2+).

---

### 2.7 `[Q3'26][Spain REBU MVP] Spain document templates + KAM P&L approval flow`

**Epic Goal:** Seed Spain REBU document requirement templates (per [spain-rebu-mvp.md §2](spain-rebu-mvp.md), check with Andreas; confirm escritura penalties). Implement the KAM-driven P&L editing + approval flow: KAMs edit P&L on Karvel; Andreas's team or finance approves before deal transitions to invoicing.

**Problem Statement:** Per the latest spain-rebu-mvp.md §2 answers, KAMs own deal data entry up to invoicing; Andreas / finance is the approver. This is a Spain-specific workflow on top of the universal state machine (§2.1).

**Solution Overview:** [spain-rebu-mvp.md §2](spain-rebu-mvp.md) · [domain-model.md §1 (DocumentRequirementTemplate)](domain-model.md)

**Out of scope:** Template authoring UI (Phase 2+).

---

### 2.8 `[Q3'26][Spain REBU MVP] Spain agent invoice flow`

**Epic Goal:** Agent-facing Spain factura submission flow: factura upload, IVA / IRPF selection, posting-line picker that lets one factura claim N deals' commissions. Agent confirmation flows wired to deal status updates.

**Problem Statement:** Spain factura format (IRPF withholding logic) and the posting-line picker are Spain-specific. Cadence-batching mechanism is foundational; the UI and form fields are Spanish.

**Solution Overview:** [domain-model.md §2.4](domain-model.md) · [intro.md §4.3 — why the subledger isn't optional](intro.md) · [agent-journey.md](agent-journey.md)

**Out of scope:** Salaried agents payroll calculation; OCR for document validation (both Phase 2+).

---

### 2.9 `[Q3'26][Spain REBU MVP] Xero invoice creation via API`

**Epic Goal:** Trigger outbound invoice creation in Xero via API when deal transitions to invoicing. Track invoice state locally; reconcile back from Xero. Manual upload + email-based reconciliation for inbound non-agent invoices (e.g. external co-agency).

**Problem Statement:** Per [spain-rebu-mvp.md §2](spain-rebu-mvp.md), "invoice created via Xero API; template lives there." Scope shrinks to triggering Xero and tracking state — we don't generate invoices. Inbound non-agent invoices arrive "manual via email" in MVP; Xero connectivity for inbound is future.

**Solution Overview:** [xero-integration.md](xero-integration.md) · [spain-rebu-mvp.md §2](spain-rebu-mvp.md)

**Out of scope:** Auto comms to clients on invoice issuance (Phase 2+); inbound Xero connectivity (Phase 2+); invoice generation in our system (Xero owns it).

---

### 2.10 `[Q3'26][Spain REBU MVP] Notary 10% reservation fund flow`

**Epic Goal:** Model the 10% reservation payment in the deal-to-payment fund flow. Use Spain-specific separate bank account on the Posting side. Handle the netting case where buyer = commission payer.

**Problem Statement:** Per [spain-rebu-mvp.md §2](spain-rebu-mvp.md), the 10% reservation lives in a separate bank account; complexity primarily lives in the Offer domain (upstream), with netting when the buyer also pays the commission. The Finance product side handles the held-funds posting and the netted-payout case.

**Solution Overview:** [spain-rebu-mvp.md §2](spain-rebu-mvp.md) · [pnl-engines.md](pnl-engines.md)

**Out of scope:** Offer domain changes (live in CRM / Offer service, not Finance product).

---

# 3. Tasks — Open Questions

> Parent epic: [§4.1 Pre-engineering readiness](#41-q326-pre-engineering-readiness). Labelled `[Discovery][Spain REBU]` when created.

Each row of [spain-rebu-mvp.md §2](spain-rebu-mvp.md) is a real action item. Create as `Task` (not `Story` — there's no user-facing change yet). One ticket per question; close when the answer is captured in the MVP page.

**Status:** The MVP page now has initial answers for all 8 rows. Most still require follow-up (typically "Check with Andreas") and the implications for Phase 1 epic scope are summarised in [spain-rebu-mvp.md §3](spain-rebu-mvp.md). Close each ticket once the follow-up is complete and the relevant Layer B epic in §2 has the answer baked in.

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

**Context:** Two creation flows are in scope for MVP. We need the CSV column spec and the trigger conditions for each path before §2.1 (Foundation deal lifecycle) can be broken into stories.

**Latest answer (per spain-rebu-mvp.md §2):** Multiple deals get created if there are multiple tranches (1 deal per arras + 1 per escritura when revenues collected separately). Follow up with Andreas on template fields.

**Acceptance criteria:**
- CSV template confirmed and attached to MVP page.
- Decision recorded on which flow is primary for Phase 1.

**Suggested assignee:** Fulvio (with Gio — Monday sync)

---

## 3.3 `[Q&A][Spain REBU] Define document requirements per deal`

**Summary:** List the documents required per Spain REBU deal. Confirm whether requirements vary by channel or market.

**Context:** Blocks the seed data for `DocumentRequirementTemplate` rows in §2.7 (Spain document templates + KAM approval flow).

**Latest answer (per spain-rebu-mvp.md §2):** Check with Andreas; confirm penalties in case of absence of escritura.

**Acceptance criteria:**
- Document list captured in MVP page.
- Variance by channel / market confirmed.

**Suggested assignee:** Fulvio (with Spain ops)

---

## 3.4 `[Q&A][Spain REBU] Confirm connected agents in REBU Spain`

**Summary:** Do we have connected-agent (Team Lead / Manager) cuts in REBU Spain?

**Context:** Drives whether §2.6 (rebu engine + Spain blueprints) needs connected-agent overlay logic in Phase 1.

**Latest answer (per spain-rebu-mvp.md §2):** "TL will leave soon; KAM bonuses paid most likely outside product." → Connected agents **deferred from Spain MVP**. Capability stays in foundation §2.1; implementation defers.

**Acceptance criteria:**
- Yes / no decision recorded.
- If yes: structure of TL / Manager cut documented (% of agent net? fixed?).

**Suggested assignee:** Fulvio (with Spain ops + Marc)

---

## 3.5 `[Q&A][Spain REBU] Decide P&L approval flow`

**Summary:** Do we need a P&L approval flow involving multiple ops users (e.g. ops approves, finance signs off)?

**Context:** Affects state machine permissions in §2.1 (Foundation deal lifecycle) and the workflow in §2.7 (Spain KAM P&L approval flow).

**Latest answer (per spain-rebu-mvp.md §2):** KAM edits P&L on Karvel; Andreas's team or finance approves before invoicing. Andreas is the named owner of the deal-to-invoicing transition.

**Acceptance criteria:**
- Approval flow decision recorded (single approver vs multi-step).
- If multi-step: role list and transition rules documented.

**Suggested assignee:** Fulvio (with ops + finance)

---

## 3.6 `[Q&A][Spain REBU] Document 10% notary payment fund flow`

**Summary:** How does the 10% notary payment work end-to-end? Who pays, who receives, when, and how does it appear in the deal's P&L and accounting entries?

**Context:** Drives the model for §2.10 (Notary 10% fund flow) and the posting shapes in §2.3 (Foundation accounting engine).

**Latest answer (per spain-rebu-mvp.md §2):** Separate bank account; complexity primarily in Offer domain (upstream); netting case when buyer = commission payer. Follow up with Andreas on full fund-flow detail.

**Acceptance criteria:**
- Fund flow documented (sender, recipient, timing, posting shape).

**Suggested assignee:** Fulvio (with Spain ops)

---

## 3.7 `[Q&A][Spain REBU] External co-agency invoice ingestion`

**Summary:** How are non-agent invoices (e.g. external co-agency) sent to Huspy? Do we store them in Karvel? How do we reconcile them with the originating deal?

**Context:** Affects §2.2 (Invoice lifecycle foundation, inbound direction) and §2.9 (Xero integration).

**Latest answer (per spain-rebu-mvp.md §2):** Manual via email in MVP. Xero upload connectivity is future. MVP scope: receive file, store reference, link to deal, manually reconcile.

**Acceptance criteria:**
- Ingestion mechanism decided (upload UI vs out-of-band).
- Reconciliation rule documented.

**Suggested assignee:** Fulvio (with Spain ops + finance)

---

## 3.8 `[Q&A][Spain REBU] Define invoice draft templates`

**Summary:** Provide the templates (legal copy, layout, required fields) for outbound invoice drafts auto-created on `deal.state = invoicing`.

**Context:** Affects §2.9 (Xero invoice creation via API).

**Latest answer (per spain-rebu-mvp.md §2):** Invoice created via Xero API; template lives there. **Largely answered** — Xero owns templates and creation. Remaining follow-up: confirm which fields we pass to Xero on invoice trigger.

**Acceptance criteria:**
- Template attached to MVP page.
- Required fields list documented.

**Suggested assignee:** Fulvio (with finance)

---

# 4. Active during the hiring gap

One epic, with child tasks grouped by label. All children have closeable outcomes so the board reflects weekly velocity while §2 is blocked.

## 4.1 `[Q3'26] Pre-engineering readiness`

**Epic Goal:** Two outcomes, both prerequisites for engineering kick-off:

1. **Multi-BU, multi-country architecture validated** through ops observation and stakeholder sign-off — the data model and accounting engine demonstrably survive every BU and market in scope.
2. **Spain REBU MVP build-ready** — scope locked, key decisions made, FE contribution paths agreed — so day one of engineering is "build", not "scope".

**Problem Statement:** Both outcomes are PO-side work that doesn't require engineers. Without them, engineers arrive to an unvalidated architecture and an unscoped MVP, and burn the first month re-doing discovery. The hiring window is when this work is cheapest to do.

**Solution Overview:** [intro.md §4](intro.md) · [spain-rebu-mvp.md](spain-rebu-mvp.md) · [pnl-engines.md](pnl-engines.md) · [domain-model.md](domain-model.md)

**Child tasks, grouped by label:**

| Label | Tasks | Maps to outcome |
| --- | --- | --- |
| `[Discovery][Multi-BU]` | Shadow Mortgage MA broker — 1-2 days · Capture non-deal event types (training fees, bonuses, manual adjustments) · Walk full architecture against MBU edge cases | 1 |
| `[Discovery][Spain REBU]` | Shadow Spain REBU ops — 3 days on-site · Baseline metrics from Finance (invoice mismatches/month, ops follow-ups/deal, deal-to-payment time) · The 8 Q&A tasks in [§3](#3-tasks--open-questions) | 2 |
| `[Decision]` | Visibility scope — pre-invoice accrual vs post-invoice status (with Marc) · Finance director sign-off on shadow-mode against Xero · Karvel FE lead — PR contribution path agreed · Agent App FE lead (Opportunities team) — PR contribution path agreed | Both |
| `[Doc]` | Decision log skeleton + first 5 entries (build-vs-buy, subledger non-optional, scope discipline, blueprint-as-data, shadow-mode) · MBU non-deal event types appended to [pnl-engines.md](pnl-engines.md) | Both |

**Off-board:** Engineering hiring is tracked outside FP with HR / engineering leadership. PO contribution to hiring (tech screen briefs, interview loops) is captured there, not on this board.

---

# 5. WIP discipline

Rules that keep the board honest, not theatrical:

- **WIP cap: 5-7 open tickets** across all categories (Discovery + Hiring + Alignment + open questions). More than that and the board stops reflecting reality.
- **Closeable outcomes only.** Every ticket has a defined "done" state — a doc appended, a decision recorded, a meeting held with output. "Ongoing X" is not a ticket; if the work is ongoing, it's an Epic, and the closeable pieces are its children.
- **No backfill.** Don't create retroactive tickets for work already done. Start from today.
- **Promote when ready.** When a §2 build epic unblocks (engineers hired, scope locked), update its status from Blocked to Open and decompose into stories. Until then, leave it.

---

# 6. What to add later (not now)

- **Stories** under each build epic — only once spec is locked and engineers are ~2 weeks from picking them up. Doing it sooner means rewriting them.
- **Platform / engineering enabler tasks** — seed data scripts, CI setup, DB schema migrations — let the tech lead break these out when they onboard.
- **Bugs** — none yet; the prototype is not production.
- **Sub-tasks** — engineering's tool, not yours. Skip.
