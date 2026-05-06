# Next Steps — Deals Management on Karvel

Prioritized from "blocks real use" → "nice to have". ~~Strikethrough~~ = done.

---

## P0 — Breaks on First Run / Misleading UX

### ~~1. Pick one package manager and delete the others~~
~~Deleted `package-lock.json`, using npm.~~

### ~~2. Remove Lovable-specific scaffolding~~
~~Removed `lovable-tagger` from `package.json` and `componentTagger()` from `vite.config.ts`.~~

### 3. Fix the Clients page kanban toggle
`pages/Clients.tsx` has a table/kanban toggle but only renders `ClientTable` regardless of mode. Either wire in a `ClientKanban` component or remove the toggle.

### 4. Remove or wire the sidebar's dead nav items
"Properties" (`/properties`) and "Agents" (`/agents`) both 404. Either stub the pages or remove the nav items until they're built.

---

## P1 — Correctness Issues That Would Affect Finance Reviews

### ~~5. Fix DealDetail Receivables section~~
~~Now iterates `draft.receivables[]` with per-entity invoice number, date, status, and payment fields.~~

### ~~6. Fix DealDetail Save to actually persist~~
~~`handleSave()` now calls `updateDeal(draft)` — changes survive navigation within the session.~~

### ~~7. Remove fake stage date generation~~
~~`getStageDates()` now reads from `deal.statusHistory[]` and `reportDate`. Completed stages without history show no date instead of fabricated timestamps.~~

---

## P2 — Architecture: Prevent State Bugs as the App Grows

### 8. Replace the module-level mutable store with React Context or Zustand
`dealStore.ts` uses a module-level `let allDeals`. Any component that imports `getDeals()` directly (instead of receiving deals as props) bypasses React's render cycle and can show stale data. The current pattern works today but will cause subtle bugs as more views share the store. Zustand is already a natural fit; alternatively, lift state into a Context at the App level.

### 9. Remove TanStack Query or actually use it
`QueryClientProvider` wraps the app but zero `useQuery` / `useMutation` calls exist. If the goal is future API integration, keep the provider and wire real queries when the backend arrives. If there's no near-term API plan, remove it to avoid confusion.

### 10. Separate agent view from Karvel view at the routing level
Currently both views share one sidebar and one React app with no auth gating. As this moves toward real users, the Karvel (internal finance) routes need protection. Consider: a route-level `<PrivateRoute>` wrapper, or separate apps entirely. Doing this early avoids reworking every page later.

---

## P3 — Shared Code: Reduce Duplication

### 11. Consolidate the two deal detail panels (DealListingDetailPanel vs DealPnLDetailPanel)
Both slide-in panels show deal information with status/badges/sections. They differ in which sections they emphasize. Extract a shared `<DealDetailPanelBase>` that both compose, rather than duplicating header/badge/layout code.

### 12. Merge legacy single-agent/single-partner fields on `Deal`
`types.ts` has parallel sets of fields: `agents[]` (multi-agent) and `agentName`, `agentCommissionRate`, `agentCommissionPayout`, etc. (legacy single-agent). Same for `externalPartners[]` vs `externalPartnerName/Share`. These are kept "for table display compatibility" but create confusion about which is source of truth. The table/list views should read from the arrays and derive display values, then the legacy fields can be removed.

### 13. Extract `formatAmount` helper
`formatAmount(amount, currency)` is defined independently in at least 4 files (`DealDetail.tsx`, `DealFinanceView.tsx`, `DealListingView.tsx`, `DealPnLView.tsx`). Move it to `src/lib/utils.ts` and import from there.

### 14. Lift shared filter state out of Deals.tsx
Country / BU / Market / Channel filters are managed in `Deals.tsx` and passed down. The sub-views (Listing, P&L, Finance) all independently re-filter. A filter context or a shared hook would let each view consume the same filtered list without prop-drilling.

---

## P4 — Missing Real-World Implementation

### 15. Bulk Upload: add real CSV/Excel parsing
`BulkUploadDialog.tsx` has a UI (drag and drop area) but no actual file parsing. When this feature is needed, use `papaparse` (CSV) or `xlsx` (Excel). The `Deal` type is well-defined — the schema for the import template is already derivable from `types.ts`.

### 16. Add Deal: wire to dealStore properly
`AddDealDialog.tsx` creates a deal and calls `onDealCreated`, which prepends to local state. The new deal goes into `dealStore` via `setAllDeals`. This mostly works, but navigating to `/deals/:id` for the new deal before refreshing works only because `dealStore` is module-level. This will break if you ever move to a real backend — make sure new deals always go through the same store write path.

### 17. Clients: almost empty, not linked to deals
`mockClients.ts` has 10 records with mostly placeholder emails (`"-"`). Clients are not linked to deals by ID in the Karvel view — only by matching `clientName` string (fragile). When building real client management, add `clientId` FK to `Deal` and join on it.

### 18. Build the stub pages (Properties, Agents)
Both are linked in the sidebar. Properties and Agents are natural extensions of the REBU workflow. Even simple read-only list pages would eliminate the 404 experience.

### 19. Real backend / persistence
Today: all data lives in memory, lost on refresh. The natural path is Supabase (already a common pairing with Lovable/shadcn stacks) — tables map cleanly from `types.ts`. TanStack Query is already in the dependency tree, ready to wrap the API calls.

---

## P5 — Code Quality / Test Coverage

### 20. Write real tests
`src/test/example.test.ts` is a placeholder. `lib/dealCalculations.ts` is pure and fully testable — start there. Add tests for `recalculateREBU`, `recalculateMBU`, and the `buildPayables` logic.

### 21. Add TypeScript strictness
`tsconfig.app.json` likely has `strict: true` already (Vite default), but several places use `as any` casts (e.g., `mockDeals.ts:153` — `"Reported" as any`). These are all in mock data, but they hide real type mismatches. Fix by using proper `DealStatus` literals.

---

## How to Run (Current State)

```bash
# Install
npm install

# Start dev server (http://localhost:8080)
npm run dev
```

No environment variables required — there is no backend. The app runs entirely from in-memory mock data.
