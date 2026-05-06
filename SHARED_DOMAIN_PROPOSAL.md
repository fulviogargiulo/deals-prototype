# Shared Domain Proposal

Canonical types and enums that both apps will agree on. Lives in [packages/shared-domain/src/](packages/shared-domain/src/).

This is the type-level equivalent of "shared tables" — the schema both apps speak. Real DB tables (Postgres/Supabase) will mirror these later.

## Decisions made (override if you disagree)

| Topic | Karvel | Agent-app | Picked | Why |
|---|---|---|---|---|
| **Enum casing** | `"Reported"`, `"Buy"` (Title Case) | `'reported'`, `'buy'` (lowercase kebab) | **lowercase kebab** | Standard for API/JSON serialization. Display strings should be derived in the UI, not the data. |
| **`Client.name` field** | `name` | `fullName` | **`fullName`** | More explicit; allows future `firstName`/`lastName` split without ambiguity. |
| **`DealStatus` set** | 7 values, no `canceled` | 8 values, includes `canceled`, `finalised` | **superset, 8 values** (`canceled` kept; `finalised` mapped to `ready-for-invoicing`) | Lossless. Karvel never used a "canceled" path but real ops always need it. `finalised` was an agent-app oddity overlapping with `ready-for-invoicing`. |
| **`OpportunityType`** | no `mortgage` | has `mortgage` | **includes `mortgage`** | Mortgage is a real product line at Huspy. |
| **`DealType`** | includes `Buy+Sell`, `Rent+Lease` | doesn't | **kept as `buy-sell`, `rent-lease`** | Karvel's combined deals are real; agent-app just hadn't modeled them yet. |
| **`OpportunityStatus`** | 4 values | 6 values | **superset, 7 values** (added `inactive`) | No data loss. Each app's UI filters to what it cares about. |
| **`Country`** | `"UAE" \| "Spain" \| "KSA"` | not modeled | **ISO-alpha-2 lowercase: `ae \| es \| sa`** | International standard. Display names live in UI. |
| **`Currency`** | implicit per country | explicit string | **explicit ISO-4217: `AED \| EUR \| SAR`** | Required for any cross-country reporting. |
| **`BusinessUnit`** | `REBU \| Mortgage` | not modeled | **`rebu \| mortgage`** | From karvel; agent-app needs it eventually. |
| **Denormalized `clientName`/`agentName`** | yes | no | **excluded from canonical Deal** | These are display caches, app-local. The canonical schema carries IDs only; UIs join. |

## What's in shared-domain

- [packages/shared-domain/src/enums.ts](packages/shared-domain/src/enums.ts) — `DealStatus`, `OpportunityType`, `DealType`, `OpportunityStatus`, `BusinessUnit`, `Country`, `Currency`, `Market`, `InvoiceStatus`, `PayableStatus`
- [packages/shared-domain/src/entities.ts](packages/shared-domain/src/entities.ts) — `Client`, `Opportunity`, `Deal` (intersection only — fields both apps agree on)
- [packages/shared-domain/src/index.ts](packages/shared-domain/src/index.ts) — barrel export

## What's deliberately NOT in shared-domain (yet)

These are app-local until proven shared:

- **Karvel-only:** `AgentEntry`, `PayableEntry`, `ReceivableEntry`, `ExternalPartnerEntry`, COGS fields, `StatusHistoryEntry`, dispute model
- **Agent-app-only:** `Task`, `Document`, `ScheduleActivity`, `StatementOfAccount`, `VisitFeedback`, notes, verification status
- **Both have, but diverge significantly:** rich `Opportunity` property attributes (priceRange, bedrooms, neighborhoods, images) — agent-app-only for now

When we identify a type that genuinely belongs to both, we promote it to `shared-domain` then.

## Migration pattern (for each app, later)

```ts
// apps/karvel/src/data/types.ts
import type { Deal as BaseDeal } from "@huspy/shared-domain";

export interface Deal extends BaseDeal {
  // Karvel-only fields stay here
  agents: AgentEntry[];
  payables: PayableEntry[];
  receivables: ReceivableEntry[];
  // ...
}
```

The app keeps its full type. The base type becomes the contract that's enforceable across the workspace.

## Migration progress

| Entity | Karvel | Agent-app | Notes |
|---|---|---|---|
| `Client` | ✅ Done (commit `7c6108f`) | ✅ Done (commit `7c6108f`) | Karvel renamed `name` → `fullName`; both extend `BaseClient` |
| `Opportunity` | ✅ Done (commit `f7e9830`) | ✅ Done (commit `f7e9830`) | Karvel mocks rewritten with lowercase enums + `neighborhoods`; new `apps/karvel/src/lib/labels.ts` for display strings |
| `Deal` | ⏳ **Deferred** — see below | ✅ Done | Agent-app extends `BaseDeal`; mock currency `€` → `EUR`; `finalised` → `ready-for-invoicing` |

### Karvel Deal — why deferred

Karvel uses Title-Case multi-word enum values (`"Reported"`, `"Pending Details"`, `"Ready For Invoicing"`, `"Buy+Sell"`, `"REBU"`, `"UAE"`) across:
- 29 mock records in [apps/karvel/src/data/mockDeals.ts](apps/karvel/src/data/mockDeals.ts)
- ~17 component files (filters, tables, dialogs, badges)
- Field name divergence: karvel uses `amount`, canonical uses `dealAmount`

The risk: enum values overlap across `DealStatus` / `InvoiceStatus` / `PayableStatus` (e.g. `"Paid"` exists in all three) — a global find-and-replace would corrupt records. Each file needs context-aware editing.

**Estimated effort:** ~30 minutes of focused editing + iterative build fixing. Worth doing as a dedicated task, not bundled into a multi-step session.

**Karvel's `Deal` is unchanged** until that migration runs. The shared contract is structurally agreed on (`BaseDeal` exists in `packages/shared-domain/`), karvel just doesn't extend it yet.
