# /product-check — Product Integrity Check

You are a senior product lead + staff engineer reviewing changes to the Huspy Deals monorepo. Your job is to detect three things:

1. **Concept breaks** — changes that contradict a product rule or workflow
2. **Stale documentation** — code that has moved ahead of what DOMAIN_MODEL.md describes
3. **Code vs. docs drift** — the implementation files listed below diverge from what the docs say

---

## Product context

### What Huspy does
Huspy is a real estate and mortgage brokerage operating in UAE (AED), Spain (EUR), Saudi Arabia (SAR). Two business units: **REBU** (property transactions) and **Mortgage (MBU)**. Huspy earns a commission on each transaction and pays a share to the agent who brought the deal.

Two apps:
- **Karvel** (internal) — Ops and Finance teams. Review deals, process documents, approve commissions, manage receivables/payables, run P&L.
- **Agent-app** (external) — Independent agents. Log deals, track status, view and dispute commission, generate invoices to Huspy.

**"Client"** = the property buyer, seller, or tenant — the end customer of the transaction. Not the agent.

### Core deal lifecycle (authoritative source: `src/dealWorkflow.ts`)

Allowed transitions:

| From | Allowed next |
|---|---|
| `pending-details` | `under-review`, `canceled` |
| `under-review` | `pending-details`, `pending-agent-approval`, `canceled` |
| `pending-agent-approval` | `under-review`, `pending-receivables`, `canceled` |
| `pending-receivables` | `finalized`, `canceled` |
| `finalized` | _(terminal)_ |
| `canceled` | _(terminal)_ |

`under-review → pending-details` is a **normal backward transition** (Ops requests more agent input). It is not an error.

`isDisputed`: when raised by agent in agent-app, deal reverts to `under-review` + `isDisputed = true`. Ops resolves in Karvel, then moves forward.

### Agent payout — decoupled from deal lifecycle
`finalized` credits `AgentLiability_agent-{slug}` (via `invoice_issued` posting). The agent then invoices Huspy separately for accumulated posting lines. `payout_instructed` posting closes the cycle. **Never trigger payment at finalization.**

### Invoice direction semantics
Accounting-standard convention (from the perspective of Huspy's books):
- **Inbound** = Invoice received by Huspy; Huspy pays. `Invoice.direction === "inbound"`. Typical party: agent, vendor, authority.
- **Outbound** = Invoice sent by Huspy; Huspy receives. `Invoice.direction === "outbound"`. Typical party: client (buyer, seller, tenant, bank).
- Agent invoices (agents billing Huspy for commission) are always **inbound**.
- Client invoices (Huspy billing the client for the commission fee) are always **outbound**.

### Invoice status machine
- `draft → issued → paid` (normal path)
- `issued → cancelled` (requires `cancelReason` — mandatory)
- `paid → cancelled` (requires `cancelReason`)
- `issued → paid` requires both `proofFileName` and `paymentReference` — neither alone is sufficient.
- A cancelled invoice can be restored to `issued` (for op error recovery).

### Invoice ↔ deal status invariants
These must hold across the fixture data and any UI transition logic:

| Deal status | Outbound invoice constraint |
|---|---|
| `finalized` | ALL outbound invoices linked to the deal must be `paid` |
| `pending-receivables` | At least 1 outbound invoice must be `issued` |
| Any other status | No outbound invoice should be in `paid`, `issued`, or `draft` |

Deal can transition `pending-receivables → finalized` only when all outbound invoices are `paid`. Inbound invoice payment is completely decoupled from deal status — never gate on inbound invoices.

### Invoice ↔ PostingLines accounting invariants
- All invoices must have at least one `PostingLine` with `invoiceId` set.
- **Outbound invoice in `issued`**: must have a posting line with DEBIT `ASSET_AR` (the other side CREDIT should be a revenue account).
- **Outbound invoice in `paid`**: must also have a posting line with CREDIT `ASSET_AR` (the other side DEBIT should be `ASSET_BANK_BankX` — cash received).
- **Finalized deal**: must have postings with CREDIT `LIAB_AGENT_PAYABLE` and DEBIT `EXP_COMMISSION` (agent liability recorded at close).
- **Inbound invoice in `paid` to an agent**: must have a posting line with DEBIT `LIAB_AGENT_PAYABLE` (the other side CREDIT should be `ASSET_BANK_BankX` — cash disbursed).

When displaying accounting entries for an invoice, show **only** posting lines where `PostingLine.invoiceId` is explicitly set. Do not expand to all lines of the parent posting.

### Rebate and subsidy — upstream model
Rebate and subsidy are price concessions paid back to the client. They reduce the amount the client actually owes Huspy:
- Baked into the client's `DealStakeholder.financialAmount` (REVENUE_SOURCE). The stored `financialAmount` is already net of rebate/subsidy.
- **Not** `ACQUISITION_DEDUCTION` stakeholders and **not** separate waterfall entries.
- `deal.rebateAmount` = `deal.rebatePercentage% × sum of REVENUE_SOURCE financialAmounts` (gross commission actually invoiced). Never compute as `rebatePercentage × dealAmount`.
- `deal.subsidyAmount` reduces the client payer's `financialAmount` by the same mechanism.
- Both fields appear as greyed context lines in the P&L waterfall below "Deal Amount" — not in the commission bucket.

### Karvel tabs structure
Karvel's Deals page has exactly 4 tabs: `listing` (Deals), `invoices` (Invoices), `doc-requirements` (Doc Requirements), `ledger` (Ledger). The P&L tab and Finance tab were removed. `DealPnLView` and `DealFinanceView` are deleted.

### Commission waterfall (authoritative source: `src/waterfall.ts`)

1. Gross revenue — from `REVENUE_SOURCE` stakes (`financialAmount > 0`) or `grossRevenue` fallback
2. − Bucket C — `ACQUISITION_DEDUCTION` stakes (co-brokers, rebates, referrals)
3. − Bucket D — `OPERATIONAL_DEDUCTION` stakes (notary, conveyance, legal)
4. = Net revenue
5. − Bucket B — `INTERNAL_PAYOUT` per agent via `AgentFinancials.strategy`; TL/manager are **additive Huspy-borne overhead**, not deducted from agent payout
6. = Huspy margin

`totalBucketA` is always 0 in the engine — tax is outside the waterfall.

### Tax — two distinct mechanisms
**Blueprint tax** (charged to client at `invoice_issued`): Spain 21% IVA, UAE 5% VAT, Saudi 15% VAT. Source: `src/blueprints.ts`. Never implement tax as a manually declared stakeholder.

**Withholding tax** (deducted from agent at `commission_accrual`): Spain 15% IRPF, UAE 5% VAT. Lines: DEBIT `EXP_COMMISSION`, CREDIT `AgentLiability` (net), CREDIT `LIAB_STATUTORY_TAX` (withheld).

### Key constraints
- A deal cannot advance to `pending-receivables` without all required stakeholders set
- `canTransitionDealStatus(from, to)` in `dealWorkflow.ts` is the single gatekeeper — any UI or logic that transitions state must use it or replicate its table exactly
- `Deal.agentId` / `Deal.clientId` as direct FKs are deprecated — use `DealStakeholder`
- `Deal.conveyanceRevenue` is deprecated — use `OPERATIONAL_DEDUCTION` stakeholder
- `Ledger.id` is a **number**; `Ledger.name` is the string used for pattern matching (e.g. `REV_EUR`)
- `getLedgerById`, `getSubledgersForGL`, `getPostingLinesForLedger` all take **number** params

---

## Step 1 — Gather what changed

```bash
git -C /Users/fulviogargiulo/Documents/projects/Deals diff HEAD~1 HEAD --name-only 2>/dev/null \
  || git -C /Users/fulviogargiulo/Documents/projects/Deals diff --name-only --cached 2>/dev/null \
  || git -C /Users/fulviogargiulo/Documents/projects/Deals status --short 2>/dev/null
```

If no git history, ask: "What did you just change, or which files should I review?"

## Step 2 — Load what you need

Always read (authoritative product context):
- `docs/product/domain-model.md` — entity relationships, P&L waterfall, chart of accounts
- `docs/product/lifecycle.md` — deal state machine, stage descriptions, accounting entries
- `docs/product/ops-journey.md` — Karvel tabs, deal/invoice/ledger/agent management flows
- `docs/product/agent-journey.md` — agent app deals and earnings flows
- `docs/product/accounting-101.md` — double-entry concepts, posting/line metadata fields
- `packages/shared-domain/DOMAIN_MODEL.md` — code-level invariants and implementation rules
- `packages/shared-domain/src/enums.ts`
- `packages/shared-domain/src/entities.ts`

Read these only when the changed files touch them:
- `packages/shared-domain/src/dealWorkflow.ts` — if state machine or transitions changed
- `packages/shared-domain/src/waterfall.ts` — if commission/waterfall logic changed
- `packages/shared-domain/src/blueprints.ts` — if tax or Blueprint logic changed
- `packages/shared-domain/src/commissionCalc.ts` — if COMMISSION_RATES or base calculation changed
- `packages/shared-domain/src/services/pnl.ts` — if P&L aggregation changed
- `packages/shared-domain/src/fixtures/queries.ts` — if query helpers changed
- `packages/shared-domain/src/fixtures/ledgers.ts` — if chart of accounts changed

## Step 3 — Run these checks

### A. Concept breaks
A change that contradicts a documented product rule.

- State transition not in `DEAL_WORKFLOW_TRANSITIONS` (e.g. `pending-details → pending-receivables` directly)
- `isDisputed = true` set without also reverting status to `under-review`
- Tax logic implemented as a `DealStakeholder` cost or a manually entered field instead of Blueprint
- Agent payout triggered at `finalized` (should credit liability subledger, not pay the agent)
- `Deal.agentId` / `Deal.clientId` used as a direct FK instead of `DealStakeholder`
- Commission deducted from what Huspy charges the client (should reduce Huspy's margin, not gross revenue)
- `totalBucketA` set to a non-zero value in the waterfall engine output
- `ProjectedPnLInput.reductions` passed for new code (deprecated — use `ACQUISITION_DEDUCTION` stakeholder)
- Invoice `direction` inverted: agent invoices marked `outbound` (should be `inbound`); client invoices marked `inbound` (should be `outbound`)
- Deal `pending-receivables → finalized` transition gated on inbound invoices (must gate only on outbound invoices all being `paid`)
- Rebate or subsidy implemented as an `ACQUISITION_DEDUCTION` stakeholder (they belong in the payer's `financialAmount`, not as a separate stakeholder)
- `rebateAmount` computed as `rebatePercentage × dealAmount` (must be `rebatePercentage × sum of REVENUE_SOURCE financialAmounts`)
- Invoice marked `paid` without `proofFileName` or `paymentReference`
- Invoice cancelled without `cancelReason`
- A finalized deal has outbound invoices not in `paid` status
- A `pending-receivables` deal has no outbound invoice in `issued` status
- A deal not in `finalized` or `pending-receivables` has outbound invoices in `paid`, `issued`, or `draft`
- An outbound `issued` invoice has no posting line with DEBIT `ASSET_AR`
- An outbound `paid` invoice has no posting line with CREDIT `ASSET_AR`
- A finalized deal has no posting with CREDIT `LIAB_AGENT_PAYABLE` + DEBIT `EXP_COMMISSION`
- An inbound `paid` agent invoice has no posting line with DEBIT `LIAB_AGENT_PAYABLE`

### B. Documentation stale — code moved ahead of docs
A change introduces something new that isn't reflected in DOMAIN_MODEL.md.

- New `DealStatus` value not in the state machine table
- New `BusinessProcess` value not in the posting-shape table
- New `StakeholderType` value not in the StakeholderType table
- New top-level interface in `entities.ts` not in the ERD
- New query helper in `queries.ts` not in the Query helpers table
- New `Blueprint` country or rate not in the Blueprint tax table
- `DEAL_WORKFLOW_TRANSITIONS` changed but DOMAIN_MODEL state machine table not updated
- `COMMISSION_RATES` changed but DOMAIN_MODEL commission defaults table not updated
- A `[TO BE DETERMINED]` item in the domain model that this change appears to resolve

### C. Code vs. implementation drift
The implementation diverges from what the docs describe.

- `pnl.ts` pattern matching uses `ledger.id` (number) instead of `ledger.name` (string) → regex always returns false
- Any query helper that takes `ledgerId` or `glId` as `string` when the entity has `number` — breaks equality checks
- `DEAL_WORKFLOW_TRANSITIONS` in `dealWorkflow.ts` does not match the transition table in DOMAIN_MODEL.md
- Blueprint tax rates in `blueprints.ts` do not match the rates in DOMAIN_MODEL.md
- `COMMISSION_RATES` in `commissionCalc.ts` do not match the defaults table in DOMAIN_MODEL.md
- A new fixture entity missing from `fixtures/index.ts` barrel

### D. Deprecated / dead concepts touched

- `@deprecated` fields used: `Deal.conveyanceRevenue`, `Client.fullName/phone/email`, `Agent.name/email/phone`, `Deal.marketType`
- Legacy flat arrays extended: `deal.agents[]`, `deal.payables[]`, `deal.externalPartners[]`
- New code importing from `apps/karvel/src/data/types.ts` instead of `@huspy/shared-domain`
- `DealPnLView` used or imported — deleted; P&L tab was removed
- `DealFinanceView` used or imported — deleted; Finance tab was replaced by Invoices tab
- New Karvel tab added beyond the canonical 4 (`listing`, `invoices`, `doc-requirements`, `ledger`) without explicit product decision

### E. Cross-app consistency

- A type in one app's local `types/` that extends a shared-domain type without importing from `@huspy/shared-domain`
- Enum value rendered directly as a display string instead of going through `labels.ts` (karvel) or `translations.ts` (agent-app)
- Agent payout flow implemented differently between apps (agent-app shows liability balance; karvel manages payouts — same posting data)
- `Deal.marketType` used where `Deal.market` is canonical

### F. Financial reconciliation
Run these numeric consistency checks across the fixture data (read the relevant fixture files to verify):

**Invoice ↔ PostingLines**
- For outbound invoices (client invoices): the DEBIT side line amounts (where `invoiceId` is set) must sum to `Invoice.amount`
- For inbound invoices (agent/vendor invoices): net of (CREDIT lines − DEBIT lines) where `invoiceId` is set must equal `Invoice.amount`. CREDIT-only sum will exceed the invoice amount when a platform fee (DEBIT) is also tagged to the same invoice — this is expected and correct.

**Invoice ↔ DealStakeholder**
- Each outbound invoice linked to a deal (`Invoice.dealId`) must have an amount matching the REVENUE_SOURCE `DealStakeholder.financialAmount` for the same payer party in that deal (these are net amounts — already after rebate/subsidy)
- Each inbound invoice linked to a deal must match the INTERNAL_PAYOUT or OPERATIONAL_DEDUCTION stakeholder `financialAmount` (absolute value) for the corresponding party

**Posting ↔ DealStakeholder (agent commission)**
- For every `commission_accrual` posting, the CR `AgentLiability` line amount must equal the INTERNAL_PAYOUT `DealStakeholder.financialAmount` for that agent's party on that deal — only checkable when `financialAmount` is explicitly set on the stake (stakes without it use runtime waterfall derivation)
- `payout_instructed` postings must not have a `dealId` — payout is against an agent invoice, which may span multiple deals

**Posting balance (double-entry integrity)**
- For every `Posting`, the sum of DEBIT `PostingLine.amount` must equal the sum of CREDIT `PostingLine.amount`

**Deal P&L waterfall consistency**
- Gross Revenue (sum of REVENUE_SOURCE `financialAmount`s) must equal the sum of outbound invoice amounts for that deal
- Total agent payouts (sum of INTERNAL_PAYOUT `financialAmount`s) must equal the sum of inbound invoice amounts to agents for that deal

## Step 4 — Report

Only include sections with findings. Skip clean sections.

```
## Product Integrity Check

### A. Concept breaks
[file:line — rule violated — recommended fix]

### B. Docs to update
[DOMAIN_MODEL.md : section — what to add or change]

### C. Code / docs drift
[file:line — what diverges — which side is wrong]

### D. Deprecated usage
[file:line — which item — recommended path forward]

### E. Cross-app inconsistencies
[file:line — what diverges — which side should change]

### F. Financial reconciliation
[entity id — what doesn't reconcile — expected vs actual amounts]

### Clean
[checks with no findings]
```

If everything is clean: **"No issues found. Code, docs, and product concepts are in sync."**

One line per finding. Do not describe what the change does — only flag problems.

## Step 5 — Commit prompt

After all fixes are applied (or if the report is fully clean with no actionable findings), ask:

> "All checks done. Commit the changes?"

If the user confirms yes:

1. Run `git -C /Users/fulviogargiulo/Documents/projects/Deals diff --stat HEAD` to identify all uncommitted files.
2. Stage all modified and deleted tracked files — use `git add` per file, never `git add -A`.
3. Write a commit message summarising what categories of issues were fixed (e.g. "fix concept breaks and deprecated usage from product-check"). Co-author line required.
4. Commit using the HEREDOC format:

```bash
git -C /Users/fulviogargiulo/Documents/projects/Deals commit -m "$(cat <<'EOF'
<summary line>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

5. Confirm the commit hash with `git log --oneline -1`.
