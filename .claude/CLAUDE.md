# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **pnpm monorepo** (Huspy) with two front-end apps and a shared domain package. No backend — all data is in-memory mocks. The project is a real-estate CRM / deal-management prototype for the Huspy Agents product team.

| Package | Name | Purpose | Port |
|---|---|---|---|
| `apps/karvel` | `@huspy/karvel` | Internal back-office (Ops / Finance) — deal pipeline, P&L, invoices, agent payouts | 8080 |
| `apps/agent-app` | `@huspy/agent-app` | External-facing app for independent agents — deals, commissions, payment status | 8081 |
| `packages/shared-domain` | `@huspy/shared-domain` | Canonical TypeScript types + enums + fixture data; no build step — apps import source directly |

## Running the apps (first time or after a fresh clone)

Open a terminal, then run these commands one by one:

```bash
cd /Users/fulviogargiulo/Documents/projects/Deals
corepack enable
pnpm install
```

Then to start an app:

```bash
pnpm dev:karvel   # opens http://localhost:8080  (back-office / Karvel)
pnpm dev:agent    # opens http://localhost:8081  (agent-facing app)
```

Leave the terminal open while you use the app. Press `Ctrl+C` to stop it.

> If `corepack` or `pnpm` are not found, install Node.js first from https://nodejs.org (LTS version).

## Commands

Run from the monorepo root (`/Users/fulviogargiulo/Documents/projects/Deals`):

```bash
# Dev servers
pnpm dev:karvel          # http://localhost:8080
pnpm dev:agent           # http://localhost:8081

# Build
pnpm build:karvel
pnpm build:agent
pnpm build               # both

# Lint / test
pnpm lint                # both apps
pnpm test                # karvel only (no tests in agent-app)

# Single-app filter
pnpm --filter @huspy/karvel test
pnpm --filter @huspy/karvel test:watch
pnpm --filter @huspy/karvel lint
```

Tests (karvel only): Vitest 3.2 + Testing Library + jsdom. One placeholder test lives at `apps/karvel/src/test/example.test.ts`.

## Architecture

### Shared domain (`packages/shared-domain/src/`)

- `entities.ts` — canonical interfaces. Key types:
  - `Deal` — thin commercial header: amount, market, BU, country, channel. **No state machine, no P&L.**
  - `Tranche` — financial settlement event within a Deal. Owns `status` (state machine), `pnlEngine`, `blueprintId`, `reportDate`. A Deal has 1..N Tranches (e.g. Spain Arras + Escritura = 2 Tranches).
  - `PnlEntry` — one line in a Tranche's P&L waterfall. Role: `REVENUE_SOURCE | AGENT_PAYOUT | ACQUISITION_DEDUCTION | OPERATIONAL_DEDUCTION`. Has `amount`, `source`, `status (draft|confirmed)`, `parentEntryId`. Tranche-scoped.
  - `DealParticipant` — identity-only party on a Deal: `DEMAND` (buyer) or `SUPPLY` (seller/bank). Deal-scoped, no financial effect.
  - `PnlEntryAudit` — append-only mutation log for draft PnlEntries.
- `enums.ts` — string union types: `DealStatus`, `PnlRole`, `ParticipantRole`, `StakeholderType` (deprecated union), `BusinessUnit`, `Country`, `Currency`, `Market`, `PnlEngine`.
- `fixtures/` — seed data: `deals.ts`, `tranches.ts`, `pnlEntries.ts`, `dealParticipants.ts`, `clients.ts`, `agents.ts`, `invoices.ts`, `postings.ts`, `queries.ts`.
- `waterfall.ts` — P&L engine: `buildWaterfallInput` + `calculateProjectedPnL`. Input takes `PnlEntry[]`; uses `parentEntryId` for agent-borne costs.

Apps import via `import { Deal, Tranche, PnlEntry } from "@huspy/shared-domain"`. Karvel's `apps/karvel/src/data/types.ts` is a thin re-export of shared types + Karvel-local extensions.

### apps/karvel

- **State:** `src/data/dealStore.ts` (deals) + `src/data/trancheStore.ts` (tranches, localStorage, `STORAGE_VERSION="2"`). `sharedPnlEntries` and `sharedDealParticipants` from shared-domain are mutated in place.
- **Deals list:** one row per Tranche (`TranchRow = { deal, tranche }`). Clicking navigates to `/deals/:dealId?tranche=:trancheId`.
- **Router:** react-router-dom v6. Pages under `src/pages/`: `Deals`, `DealDetail`, `Clients`, `Index`, `NotFound`.
- **Key components:** `DealListingTable`, `DealListingView`, `DealDetail` (tranche tabs), `PnLWaterfall`, `StakeholdersPanel`, `AddDealDialog`, `BulkUploadDialog`.
- **Business logic:** `src/lib/dealCalculations.ts` — `getDealEngine`, `buildEngineInput`, `recalculateTranche`, `syncEngineAmounts`, `confirmTrancheStakeholders`, `fireCommissionAccrualOnTransition`.
- **TypeScript:** `strictNullChecks: false`, `noImplicitAny: false`.

### apps/agent-app

- **State:** React contexts in `src/contexts/`. `DataContext` owns clients/opportunities. `ScheduleContext` owns schedule CRUD. `DevToolsContext` drives prototype toggles (localStorage). Deals are **not** in context — `src/data/mockDeals.ts` is imported directly. `AgentDealStatus` (`action-required | in-progress | closed`) is derived from all Tranches on each deal.
- **Router:** react-router-dom v7. Full route map in `src/App.tsx:56-79`. `MainLayout` wraps all authenticated routes.
- **i18n:** `LanguageContext` (`src/contexts/language-context.tsx`) — en/es, localStorage + `navigator.language` fallback. Translation strings in `src/lib/translations.ts`.
- **Theming:** `next-themes` light default, HSL token system.
- **Heavy extras not in karvel:** `framer-motion`, `mapbox-gl`, `leaflet`, `lottie-react`, `react-pdf`, `react-easy-crop`, `libphonenumber-js`.
- **TypeScript:** same loose settings as karvel.

### Key cross-app patterns

- No API calls anywhere. No `useQuery` / `useMutation` wired up (TanStack Query provider is mounted but unused in agent-app; not present in karvel).
- shadcn/ui (Radix primitives) + Tailwind 3.4 is the UI system for both apps. Custom primitives live in `src/components/ui/` in each app — not shared via the monorepo package.
- Both apps use `react-hook-form` + `zod` for forms.

## Design system (`packages/design-system/`)

`@huspy/design-system` is the **only** source of visual style. Hard-coding a hex, importing a Google Font, or inventing a token anywhere else is a bug.

**Consuming an app must:**
```css
/* src/index.css — inside @layer base, order matters */
@import "@huspy/design-system/tokens.css";
@import "@huspy/design-system/shadcn-bridge.css";
```
```ts
// tailwind.config.ts
import huspyPreset from "@huspy/design-system/tailwind-preset";
export default { presets: [huspyPreset], content: [...] } satisfies Config;
```

**Rules:**
- Brand colour = black `#1A1A1A` (`--grey-900`). Font = **Figtree** 400/500/600. Semibold (600) is the max weight. Sentence case.
- New colour tokens come from the Figma source, not invented here. When in doubt, use an existing token.
- Radii: buttons `--radius-sm` (12px), cards `--radius-md` (16px), chips/avatars `--radius-full`.
- Borders over shadows: use 1px `--grey-150` to group; `--shadow-sm` only for floating elements (menus, sticky bars).
- If you see a hard-coded `bg-emerald/blue/purple/amber`, a navy primary, or an `Inter` import — that's drift, remove it.

## Update this file

Update this file when: a new app or package is added, the shared-domain schema materially changes (new top-level entity), state management moves from mocks to a real API, or routing structure is significantly reorganised.
