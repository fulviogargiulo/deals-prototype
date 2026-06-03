# Huspy Deals — agent guide

Monorepo (pnpm workspaces). Two apps + shared packages.

- `apps/karvel` — internal **Ops & Finance** back-office. shadcn/ui + Tailwind. Dense, scannable, trustworthy. Clean over pretty.
- `apps/agent-app` — external-facing **agent** app.
- `packages/shared-domain` — the domain model: `Deal`, `Tranche`, `DealParticipant`, `PnlEntry`, the `DealStatus` enum, the state machine (`dealWorkflow.ts`), and the P&L engine. **This is the source of truth — do not redesign it.**
- `packages/design-system` — **`@huspy/design-system`**. The ONLY source of visual style. See its own `CLAUDE.md`.

## Non-negotiables

1. **Design system, always.** Every colour, font, radius and spacing value comes from `@huspy/design-system`. Never hard-code a hex, never `@import` a Google Font, never invent a token. If a value isn't in the DS, it doesn't ship.
   - Brand colour is **black `#1A1A1A`** (grey-900), not navy. Font is **Figtree**, not Inter.
2. **Status = tiers, not hues.** A deal/tranche STATE renders only as one of five tiers (success / info / warning / danger / neutral). Resolve with `statusTier()` in `@huspy/shared-domain`. The opportunity hues (teal/terracota/indigo/orchid/olive) are for VERTICALS only.
3. **Respect the domain model.** A `Deal` is a commercial header with **no status of its own** — status lives on each `Tranche`. `DealParticipant` (DEMAND/SUPPLY identity) and `PnlEntry` (financial roles) are separate systems; never blend them. Don't change the model, the state machine, transitions, the P&L engine, or party links — only how they're presented.
4. **One source per fact.** If two components show the same field, one is wrong. Deal identity → deal header. Status/progress/P&L/docs/invoices → the active tranche.
5. **Less chrome.** Group with whitespace + 1px hairlines, not stacked bordered+shadowed cards. Tables never nest inside a second border. Sentence case; UPPERCASE only for the one tracked micro-label.
6. **Progressive disclosure.** Open the primary thing (the P&L waterfall); collapse Invoices / Accounting / Documents / Comments to a row with a count + tier pill.

## Workflow
- pnpm workspace: `pnpm -F @huspy/karvel dev`, `pnpm build`, `pnpm test`.
- After any UI change, verify both apps build and tests pass (`waterfall.test.ts` must stay green).
