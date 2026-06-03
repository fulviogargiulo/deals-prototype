# apps/karvel — agent guide

Internal **Ops & Finance** back-office for Deals. React + Vite + shadcn/ui + Tailwind.
Users reconcile deals, P&L and invoices all day. Optimise for **scanning speed and
trust**, not delight. Dense but calm.

> Inherits all root rules (`/CLAUDE.md`) and the DS rules (`packages/design-system/CLAUDE.md`). Highlights specific to Karvel below.

## Theme
- Theme comes entirely from `@huspy/design-system`. `src/index.css` only imports `tokens.css` + `shadcn-bridge.css` — it must NOT define colour vars locally.
- If you see a hard-coded `bg-emerald/blue/purple/amber/slate`, navy primary, or an `Inter` import, that's drift — remove it.

## Domain-driven layout (don't fight the model)
- **Deal header** = identity only: id, asset/title, `dealAmount`, BU, market, `offerId`, and the DEMAND/SUPPLY `DealParticipant`s (read from participants, not by filtering `PnlEntry`). **No status badge here** — a Deal has no status.
- **Tranche context** = status, the workflow stepper, the primary transition button, P&L, docs, invoices, postings. Always show tranche tabs (label "Single tranche" when there's one).
- **Status** via `statusTier(status)` → tier pill. The six `DealStatus` values map: pending-details→neutral, under-review→info, pending-agent-approval→warning, invoicing→info, finalized→success, canceled→danger.

## Workflow stepper (don't linearise it)
Forward path is 4 states: `under-review → pending-agent-approval → invoicing → finalized`.
- `pending-details` is a **backward loop** (sent to agent) — a pill on Under-review, not a 5th step.
- `canceled` is **terminal** from any non-final state.
- `invoicing → finalized` is **automatic** (last outbound invoice paid) — system transition, no button.
- Senior-Ops sign-off on commission-affecting P&L edits is a hard gate before Agent approval.

## P&L waterfall order
Revenue → **Gross revenue** → Acquisition costs → **Net revenue** → Agent commissions (primary + connected agents indented + agent-funded sub-costs nested, with pool-% indicator) → Operating costs → **Huspy margin (% of gross)**. Surface draft vs confirmed; confirmed locks at invoicing.

## Chrome
- Sections = heading + 1px hairline, not bordered+shadowed `SectionCard`. No tables inside a second border.
- Collapse Invoices / Accounting events / Documents / Comments by default → row with count + tier pill. Keep the waterfall open.
