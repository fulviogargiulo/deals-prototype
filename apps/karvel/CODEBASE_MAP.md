# Codebase Map — Deals Management on Karvel

## 1. Stack & Configuration

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC plugin) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI primitives) |
| State | React `useState` + a module-level mutable variable (`dealStore.ts`) |
| Server state | TanStack Query is installed but **never used** |
| Testing | Vitest + Testing Library (one placeholder test, nothing real) |
| Font | Inter (Google Fonts, loaded in `index.css`) |
| Package manager | **bun** (both `bun.lock` and `bun.lockb` present; `package-lock.json` also present — legacy) |
| Backend | **None** — all data is hardcoded mocks |
| Auth | **None** |

Lovable scaffolding in devDependencies: `lovable-tagger` package + `componentTagger()` in `vite.config.ts`. Dev server runs on **port 8080**.

---

## 2. Routes & Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/Index.tsx` | Opportunity Management — table / kanban of `Opportunity` records |
| `/deals` | `src/pages/Deals.tsx` | Deal Management — 3 sub-views (Listing, P&L, Finance) |
| `/deals/:dealId` | `src/pages/DealDetail.tsx` | Full deal edit page — all sections, status timeline |
| `/clients` | `src/pages/Clients.tsx` | Client directory — searchable table, slide-in detail panel |
| `*` | `src/pages/NotFound.tsx` | 404 fallback |

**Sidebar nav items with no corresponding route** (both link to 404):
- "Properties" → `/properties`
- "Agents" → `/agents`

---

## 3. Agent View vs Karvel View

The app has no auth layer — both views live side-by-side under the same sidebar.

### Agent View (meant for real estate agents)
| File(s) | What it does |
|---|---|
| `pages/Index.tsx` | Opportunity list with table/kanban toggle, search |
| `pages/Clients.tsx` | Client directory |
| `components/OpportunityTable.tsx` | Opportunity rows |
| `components/OpportunityKanban.tsx` | Kanban by opportunity status |
| `components/OpportunityDetailPanel.tsx` | Slide-in detail panel for an opportunity |
| `components/OpportunityBadges.tsx` | Status/type badges |
| `components/ClientTable.tsx` | Client rows |
| `components/ClientDetailPanel.tsx` | Slide-in client detail |
| `data/mockData.ts` | 19 mock `Opportunity` records |
| `data/mockClients.ts` | 10 mock `Client` records |
| `data/clientTypes.ts` | `Client` interface |

### Karvel View (internal finance / operations team)
| File(s) | What it does |
|---|---|
| `pages/Deals.tsx` | Deal Management shell — filters, 3 sub-views |
| `pages/DealDetail.tsx` | Full editable deal page (all sections: info, property, COGS, revenue, payables, receivables, timeline) |
| `components/DealListingView.tsx` | Summary tiles + searchable deal table |
| `components/DealListingTable.tsx` | Deal rows (listing sub-view) |
| `components/DealListingDetailPanel.tsx` | Slide-in deal detail from listing view |
| `components/DealPnLView.tsx` | P&L table with editable cells + summary |
| `components/DealPnLDetailPanel.tsx` | Slide-in P&L detail panel |
| `components/PnLDealTable.tsx` | Row-level P&L table |
| `components/PnLEditableCell.tsx` | Inline editable number cell |
| `components/PnLColumnFilters.tsx` | Column filter UI for P&L |
| `components/PnLSummaryTable.tsx` | Aggregated P&L summary |
| `components/DealFinanceView.tsx` | Receivables / payables / invoice management (Finance sub-view) |
| `components/DealBadges.tsx` | Deal status/type badges |
| `components/AddDealDialog.tsx` | Dialog to manually create a deal |
| `components/BulkUploadDialog.tsx` | Dialog to bulk-upload deals (UI only, no real parsing) |
| `components/PendingDetailsSection.tsx` | Required fields indicator for Pending Details status |
| `components/RequiredDocumentsSection.tsx` | Document upload checklist (Pending Details stage) |
| `components/DealKanban.tsx` | Kanban board for deals (imported but not wired into a route) |
| `components/DealTable.tsx` | Older deal table (imported but not used in any route) |
| `data/mockDeals.ts` | 29 mock `Deal` records (REBU + Mortgage, all statuses) |
| `data/dealStore.ts` | In-memory runtime store seeded from `mockDeals` |
| `lib/dealCalculations.ts` | Pure functions: `recalculateDeal`, `recalculateREBU`, `recalculateMBU`, `createEmptyAgent` |

### Shared (used in both views)
| File(s) | What it does |
|---|---|
| `components/AppSidebar.tsx` | Navigation sidebar |
| `components/NavLink.tsx` | Active-state-aware link wrapper |
| `components/MultiSelectFilter.tsx` | Multi-select dropdown filter chip |
| `components/DateRangePicker.tsx` | Date range picker with MTD/QTD/YTD presets |
| `components/ColumnVisibilityManager.tsx` | Toggle columns in tables |
| `src/index.css` | Tailwind base + CSS custom properties for deal-status colors |
| `src/lib/utils.ts` | shadcn `cn()` helper |
| `src/hooks/use-mobile.tsx` | Mobile breakpoint hook |
| `src/hooks/use-toast.ts` | Toast hook (shadcn) |
| `src/components/ui/` | All shadcn/Radix UI primitives |

---

## 4. Data Model

All data is **100% mocked — no backend, no Supabase, no API calls**.

### Key Types (`src/data/types.ts`)
- `Opportunity` — agent-facing pipeline item (city, type, status, client, agent)
- `Deal` — Karvel financial record; two sub-types:
  - **REBU** (Real Estate Business Unit): property + agents + external partners + conveyance + receivables/payables
  - **Mortgage (MBU)**: disbursed amount + bank slab + RM/TL/DS/broker/external commissions
- `AgentEntry` — per-agent commission breakdown (share %, rate %, TL, manager, referral, kickback)
- `ExternalPartnerEntry` — external partner payout
- `PayableEntry` — per-entity payable (agent, TL, manager, broker, RM, DS, external, conveyance)
- `ReceivableEntry` — per-entity receivable (developer, buyer, seller, tenant, landlord, bank)

### Data Sources
| File | Records | Notes |
|---|---|---|
| `src/data/mockData.ts` | 19 `Opportunity` | Read-only; used only by Index page |
| `src/data/mockDeals.ts` | 29 `Deal` | Seeded into `dealStore` on load |
| `src/data/mockClients.ts` | 10 `Client` | Read-only; used only by Clients page |
| `src/data/dealStore.ts` | Runtime only | Module-level `let allDeals` — changes survive navigation but are wiped on page refresh |

### Deal statuses (in workflow order)
`pending-details → under-review → pending-agent-approval → invoicing → finalized`

`canceled` is reachable from any state. `isDisputed` is a cross-cutting boolean, not a state.
See `packages/shared-domain/DOMAIN_MODEL.md` for the full state machine.

---

## 5. Lovable Scaffolding / Dead Code to Clean Up Later

- `lovable-tagger` in devDependencies + `componentTagger()` in `vite.config.ts` — Lovable live-editing plugin, not needed outside Lovable
- Two lockfiles: `bun.lock`, `bun.lockb`, and `package-lock.json` — pick one
- `components/DealKanban.tsx` — exists, never rendered in any route
- `components/DealTable.tsx` — exists, never rendered in any route
- Sidebar "Properties" and "Agents" nav items — link to 404
- Client kanban toggle in `pages/Clients.tsx` — toggle UI exists, but selecting "kanban" renders nothing
- `DealDetail.tsx` Receivables section — renders a single hardcoded entry ignoring `deal.receivables[]`; "Add Another Client" button does nothing
- `src/test/example.test.ts` — placeholder test only
- TanStack Query (`QueryClientProvider`) — wired into App.tsx but zero queries exist anywhere
- `getStageDates()` in `DealDetail.tsx` — fakes stage dates by adding 2 days per stage from reportDate; not real data
- `handleSave()` in `DealDetail.tsx` — only sets local baseline, does not persist to `dealStore`
