# NEXT_STEPS — Deals on H2-Web

Prioritized list of cleanups, correctness bugs, architecture concerns, and missing real-world wiring. Mark items with `~~strikethrough~~` as completed.

## ~~P0 — Universal Lovable cleanup (Step 1, awaiting approval)~~

- [x] ~~Remove `lovable-tagger` from `package.json` devDependencies ([package.json:86](package.json#L86))~~
- [x] ~~Simplify [vite.config.ts](vite.config.ts): drop `componentTagger` import + plugin entry; collapse `defineConfig(({ mode }) => …)` back to plain `defineConfig({…})`~~
- [x] ~~Delete `package-lock.json` and move to monorepo with pnpm~~
- [x] ~~`pnpm install` and verify `pnpm dev:agent` serves Vite on port 8081.~~

## P0 — Correctness & security bugs

- [ ] **`PasswordGate` is imported but never rendered** ([src/App.tsx:12](src/App.tsx#L12) imports; nothing renders `<PasswordGate>`). Decide: wire it around routes, or delete component + import. The component hardcodes the password string in the bundle ([src/components/auth/password-gate.tsx:7](src/components/auth/password-gate.tsx#L7)) — never ship as-is.
- [ ] **No auth gating around the app**. `/login` route exists ([src/App.tsx:57](src/App.tsx#L57)) but every other route is reachable without authentication. Either wrap routes in a guard, or remove `/login` from the prototype.
- [ ] **Deals mutations don't persist**. `disputedDealIds` and `invoiceCreated` are local component state in [src/pages/deals/DealsList.tsx:16-17](src/pages/deals/DealsList.tsx#L16-L17); leaving the page resets them. `mockDeals` is a static import, not in any context. Move deals into `DataContext` (or a new `DealsContext`) and expose mutation methods if these flows need to feel real.
- [ ] **Tasks are read-only by data layer**. `mockTasks` is re-exported from `DataContext` ([src/contexts/data-context.tsx:138](src/contexts/data-context.tsx#L138)) without a setter. Any "create task" / "complete task" handler in the UI cannot update the source. Confirm the UX and either move tasks into context or document the limitation.

## P1 — Architecture

- [ ] **`QueryClientProvider` with zero `useQuery`/`useMutation`** ([src/App.tsx:33,90](src/App.tsx#L90)). Standard Lovable scaffolding — keep only when the API layer lands; otherwise remove the provider + import.
- [ ] **Disconnected data layer.** `clients`/`opportunities` live in `DataContext` (mutable). `deals` are direct imports. `tasks`/`documents`/`agents` are static re-exports. `schedule` has its own context. Consolidate behind one provider (or one query layer) before swapping in a real API.
- [ ] **Two map libraries shipped**: `leaflet` 1.9 + `mapbox-gl` 3.17 in [package.json:52,56](package.json#L52). Pick one and remove the other (~600KB+ gzip savings).
- [ ] **TypeScript safety holes.** `tsconfig.json` has `strictNullChecks: false` and `noImplicitAny: false` ([tsconfig.json:3-13](tsconfig.json#L3-L13)). 8+ `as any` casts hiding shape mismatches — see [matches-modal.tsx:1282,1882](src/components/modals/matches-modal.tsx#L1282), [OpportunityDetails.tsx:1009,1028,1205](src/pages/opportunities/OpportunityDetails.tsx#L1009), [generateMockClients.ts:66](src/data/generateMockClients.ts#L66). Tighten `tsconfig` and fix casts incrementally.
- [ ] **`mockData.ts` is 3466 lines** — a single monolithic mock file. Split per entity (clients, opportunities, tasks, documents, agents, schedule) once the data layer consolidates.
- [ ] **Heavy dev-tools surface in production code.** [HomeDevTool](src/components/dev-tools/home-dev-tool.tsx) toggles ~12 layout/header variants (`HomeLayoutVariant`, `HomeHeaderVariant`, `PropertiesLayoutMode`, `OpportunitiesLayoutMode`, `TableFilterStyle`, …). Once design lands, prune unused variants from [Home.tsx](src/pages/Home.tsx) and the dev tool.

## P2 — Cleanups

- [ ] Delete dead [src/pages/Index.tsx](src/pages/Index.tsx) — Lovable scaffold fallback, not in any route or import.
- [ ] Replace [README.md](README.md) (Lovable default with project URL) with a project-specific README.
- [ ] **Orphan routes** without sidebar links: `/dashboard`, `/tasks`, `/documents`. Either add them to [sidebar.tsx:26-38](src/components/layout/sidebar.tsx#L26-L38) or remove the routes.
- [ ] **Inline placeholders** at [App.tsx:75-76](src/App.tsx#L75-L76): `/settings` and `/help` render `<div>Coming soon</div>` inline. Extract to real page components or hide from the sidebar.
- [ ] **Inline blob CSS via `dangerouslySetInnerHTML`** in [Dashboard.tsx:167-236](src/pages/dashboard/Dashboard.tsx#L167-L236). Move keyframes to [src/index.css](src/index.css) or [tailwind.config.ts](tailwind.config.ts).
- [ ] Likely duplicate components — consolidate or delete:
  - `new-task-modal.tsx` vs `new-task-modal-v2.tsx` ([src/components/modals/](src/components/modals/))
  - Two `add-property-dialog` flows: [opportunities/add-property-dialog.tsx](src/components/opportunities/add-property-dialog.tsx) vs [properties/add-property-dialog/](src/components/properties/add-property-dialog/)
  - Two `empty-properties-state.tsx` (one in `opportunities/`, one in `properties/`)

## P3 — Lower priority

- [ ] Resolve `// TODO: Open book a visit modal` at [src/pages/clients/ClientDetails.tsx:1087](src/pages/clients/ClientDetails.tsx#L1087)
- [ ] [src/components/auth/password-gate.tsx](src/components/auth/password-gate.tsx) bundles `localStorage` flag `app-access-granted` — if kept, switch to a session-scoped check or proper auth.
- [ ] Audit `as any` casts (P1 lists locations) — most are dev-only mocks but a couple are in real flows (matches-modal, opportunity details).
