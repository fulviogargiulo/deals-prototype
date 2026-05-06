# CODEBASE_MAP — Deals on H2-Web

Lovable export. Real-estate agent CRM prototype (Huspy Agents) — multi-page app with home, clients, opportunities, deals, properties, tasks, documents.

## Stack

| Layer | Library | Version |
|---|---|---|
| Build | Vite (SWC plugin) | 5.4.19 |
| UI | React + ReactDOM | 18.3.1 |
| Lang | TypeScript | 5.8.3 (`strictNullChecks: false`, `noImplicitAny: false`) |
| Routing | react-router-dom | 7.12.0 |
| Server state | @tanstack/react-query | 5.83.0 — **provider mounted, zero `useQuery`/`useMutation` in codebase** |
| Forms | react-hook-form + zod + @hookform/resolvers | 7.61 / 3.25 / 3.10 |
| Styling | Tailwind 3.4 + shadcn/ui (Radix primitives) + tailwindcss-animate + @tailwindcss/container-queries | — |
| Theming | next-themes (light default), custom HSL token system | 0.3 |
| Dates | date-fns | 3.6.0 |
| Animation | framer-motion | 12.29 |
| Charts | recharts | 3.2 |
| Icons | lucide-react | 0.462 |
| Maps | **leaflet 1.9.4 + mapbox-gl 3.17** (both shipped) | — |
| Phone | libphonenumber-js | 1.12 |
| PDF | react-pdf | 10.3 |
| Misc | lottie-react, sonner (toast), embla-carousel-react, vaul, cmdk, input-otp, react-easy-crop | — |
| Lovable scaffold | `lovable-tagger` (devDep) + `componentTagger()` plugin in [vite.config.ts](vite.config.ts) | 1.1.9 |

Package name still `vite_react_shadcn_ts`. Three lockfiles present: `bun.lock`, `bun.lockb`, `package-lock.json`.

## Routes

All routes live in [src/App.tsx:56-79](src/App.tsx#L56-L79). Layout: `MainLayout` wraps every authenticated route.

| Path | Component | In sidebar? |
|---|---|---|
| `/login` | [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx) | no — and **not enforced** (rest of app reachable without auth) |
| `/` | [src/pages/Home.tsx](src/pages/Home.tsx) | yes — "Home" |
| `/dashboard` | [src/pages/dashboard/Dashboard.tsx](src/pages/dashboard/Dashboard.tsx) | **no — orphan** |
| `/clients` | [src/pages/clients/ClientsList.tsx](src/pages/clients/ClientsList.tsx) | yes |
| `/clients/:id` | [src/pages/clients/ClientDetails.tsx](src/pages/clients/ClientDetails.tsx) | drilldown |
| `/opportunities` | [src/pages/opportunities/OpportunitiesList.tsx](src/pages/opportunities/OpportunitiesList.tsx) | yes |
| `/opportunities/:id` | [src/pages/opportunities/OpportunityDetails.tsx](src/pages/opportunities/OpportunityDetails.tsx) | drilldown |
| `/deals` | [src/pages/deals/DealsList.tsx](src/pages/deals/DealsList.tsx) | yes |
| `/deals/:id` | [src/pages/deals/DealDetails.tsx](src/pages/deals/DealDetails.tsx) | drilldown |
| `/income-details` | [src/pages/deals/PaymentHistory.tsx](src/pages/deals/PaymentHistory.tsx) | drilldown |
| `/properties` | [src/pages/properties/PropertiesList.tsx](src/pages/properties/PropertiesList.tsx) | yes — "Search properties" |
| `/properties/:id` | [src/pages/properties/PropertyDetails.tsx](src/pages/properties/PropertyDetails.tsx) | drilldown |
| `/my-properties` | [src/pages/properties/MyPropertiesList.tsx](src/pages/properties/MyPropertiesList.tsx) | yes |
| `/my-properties/:id` | [src/pages/properties/MyPropertyDetails.tsx](src/pages/properties/MyPropertyDetails.tsx) | drilldown |
| `/tasks` | [src/pages/tasks/TasksList.tsx](src/pages/tasks/TasksList.tsx) | **no — orphan** |
| `/tasks/:id` | [src/pages/tasks/TaskDetails.tsx](src/pages/tasks/TaskDetails.tsx) | drilldown |
| `/documents` | [src/pages/documents/DocumentsList.tsx](src/pages/documents/DocumentsList.tsx) | **no — orphan** |
| `/settings` | inline `<div>Coming soon</div>` ([App.tsx:75](src/App.tsx#L75)) | no |
| `/help` | inline `<div>Coming soon</div>` ([App.tsx:76](src/App.tsx#L76)) | yes — links to placeholder |
| `*` | [src/pages/NotFound.tsx](src/pages/NotFound.tsx) | — |

Sidebar items defined at [src/components/layout/sidebar.tsx:26-38](src/components/layout/sidebar.tsx#L26-L38).

## File-by-file responsibility split

### Providers & global infra
| File | Role |
|---|---|
| [src/main.tsx](src/main.tsx) | Mounts `<DataProvider><ScheduleProvider><App/>`. |
| [src/App.tsx](src/App.tsx) | Wraps `QueryClientProvider` → `ThemeProvider` → `LanguageProvider` → `DevToolsProvider` → `PageTitleProvider` → `TooltipProvider` → router. **Imports `PasswordGate` ([line 12](src/App.tsx#L12)) but never renders it.** |
| [src/contexts/data-context.tsx](src/contexts/data-context.tsx) | Source of truth for clients & opportunities; `dataViewMode` switch (`default`/`empty`/`few`/`many`); `addClient`, `addOpportunity`, `updateClient`. Re-exports static `mockTasks`, `mockDocuments`, `mockAgents`. |
| [src/contexts/schedule-context.tsx](src/contexts/schedule-context.tsx) | Schedule activities CRUD + visit outcome handlers. |
| [src/contexts/dev-tools-context.tsx](src/contexts/dev-tools-context.tsx) | Heavy prototype scaffolding: loading delay, skeleton targets, header visibility, splash, header title mode, persisted to `localStorage`. |
| [src/contexts/language-context.tsx](src/contexts/language-context.tsx) | i18n en/es with localStorage override + `navigator.language` fallback (per [.lovable/plan.md](.lovable/plan.md)). |
| [src/contexts/theme-context.tsx](src/contexts/theme-context.tsx) | next-themes wrapper. |
| [src/contexts/page-title-context.tsx](src/contexts/page-title-context.tsx) | Sets header title from each page. |

### Layout
- [src/components/layout/main-layout.tsx](src/components/layout/main-layout.tsx) — wraps every route
- [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx) — left nav + dev-tools popover
- [src/components/layout/top-bar.tsx](src/components/layout/top-bar.tsx) — header / profile sheet (also where the language switcher lives per the plan)
- [src/components/layout/header-breadcrumbs.tsx](src/components/layout/header-breadcrumbs.tsx)
- [src/components/layout/page-container.tsx](src/components/layout/page-container.tsx)
- [src/components/layout/global-search.tsx](src/components/layout/global-search.tsx)

### Per-view component groups
| Folder | Owns |
|---|---|
| [src/components/home/](src/components/home/) | Home page widgets (action cards, opportunity grid, properties grid, deals summary, income overview, mesh gradient) |
| [src/components/opportunities/](src/components/opportunities/) | Opportunity cards, banners, buyer cards, property tables, view toggles |
| [src/components/properties/](src/components/properties/) | Property cards, add-property dialog (multi-step), address selectors, empty states |
| [src/components/clients/](src/components/clients/) | Client selectors, new-client form |
| [src/components/deals/](src/components/deals/) | Deals table, summary cards, date range, actions-required, payout, deal timeline |
| [src/components/schedule/](src/components/schedule/) | Activity widget, visit detail, calendar picker, reschedule/visit-outcome modals |
| [src/components/tasks/](src/components/tasks/) | Opportunity & property selectors only — list/detail rendering lives in pages |
| [src/components/matches/](src/components/matches/) | Match cards, matches table, keyboard shortcut tutorial |
| [src/components/notes/](src/components/notes/) | Notes side menu |
| [src/components/filters/](src/components/filters/) | Generic filter components |
| [src/components/modals/](src/components/modals/) | 40+ modals: review-inquiry, book-visit, close-deal, create-invoice, deal-dispute, edit-*, new-client/opportunity/task, etc. |
| [src/components/dev-tools/](src/components/dev-tools/) | Per-page dev panels (home/clients/opportunities/properties/schedule/login) — design exploration UI |
| [src/components/auth/](src/components/auth/) | `password-gate.tsx` only (orphan, see above) |
| [src/components/ui/](src/components/ui/) | Standard shadcn primitives + custom: `enhanced-card`, `floating-label-*`, `lazy-image`, `leaflet-map`, `pdf-viewer`, `slideshow`, `splash-screen`, `standard-modal`, `tracked-title` |

### Hooks / lib / types
- Hooks: `use-mobile`, `use-sidebar`, `use-toast`, `use-command`
- Lib: `utils` (cn), `countries`, `property-types`, `mock-addresses`, `add-to-calendar`, `translations`
- Types: [src/types/index.ts](src/types/index.ts) (239 lines — Client, Opportunity, Task, Document, Deal, ScheduleActivity, …) + `types/notes.ts` (8 lines)

## Data sources

All in-memory mocks. No Supabase, no API calls, no fetch, no `useQuery`.

| Source | Wired through context? | Mutation path |
|---|---|---|
| `mockClients`, `mockOpportunities` ([src/data/mockData.ts](src/data/mockData.ts), 3466 lines) | yes — `DataContext` | `addClient`, `addOpportunity`, `updateClient` |
| `mockTasks` | re-exported from `DataContext` but **read-only** — no setter | none — task edits won't persist |
| `mockDocuments`, `mockAgents` | re-exported from `DataContext`, read-only | none |
| `generateMockScheduleActivities()` | `ScheduleContext` initial state | full CRUD inside provider |
| `mockDeals`, `mockStatement` ([src/data/mockDeals.ts](src/data/mockDeals.ts), 595 lines) | **no context** — imported directly by deal pages | none — disputes/invoice flags live in component state ([DealsList.tsx:17](src/pages/deals/DealsList.tsx#L17)) |
| `generateManyClients(150)` ([src/data/generateMockClients.ts](src/data/generateMockClients.ts)) | DataContext "many" mode | — |

## Lovable scaffolding inventory

- `lovable-tagger` in `package.json` devDeps + `componentTagger()` plugin in [vite.config.ts:4,12](vite.config.ts#L4)
- `.lovable/plan.md` (i18n implementation plan)
- [README.md](README.md) — Lovable default README with project URL
- Three lockfiles: `bun.lock`, `bun.lockb`, `package-lock.json`
- Package name `vite_react_shadcn_ts`
- [src/pages/Index.tsx](src/pages/Index.tsx) — Lovable fallback page, **not referenced anywhere**
- `componentTagger` requires `defineConfig(({ mode }) => …)` wrapper — collapsible to plain object once removed
