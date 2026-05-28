# Shared Domain Proposal

> **Domain model reference:** [docs/product/domain-model.md](../../docs/product/domain-model.md)


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

- **Karvel-only (inline on Deal):** `AgentEntry`, `PayableEntry`, `ExternalPartnerEntry`, COGS fields — legacy flat fields on `Deal` that predate `DealStakeholder`. Candidates for deprecation once the waterfall engine fully replaces them.
- **Agent-app-only:** `StatementOfAccount`, notes

**Now in shared-domain** (previously app-local — promoted when both apps needed them):
- `Task`, `Document`, `ScheduleActivity`, `VisitFeedback` — in `entities.ts`
- `DealDispute` — in `entities.ts`
- `DealStakeholder`, `Blueprint`, `AgentFinancials`, `DealDocumentRequirement`, `DocumentRequirementTemplate`, `AgentDocument` — all in `entities.ts`

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
| `Client` | ✅ Done | ✅ Done | Both extend `BaseClient`. Karvel renamed `name` → `fullName`. Karvel `status` lowercased to `"active" \| "inactive"`. |
| `Opportunity` | ✅ Done | ✅ Done | Both extend `BaseOpportunity`. Karvel mocks rewritten with lowercase enums + `neighborhoods` array. |
| `Deal` | ✅ **Done** | ✅ Done | Both extend `BaseDeal`. Karvel mocks fully migrated: lowercase enums (status / type / market / businessUnit / country / invoice / payable), `amount` → `dealAmount`, ISO country codes. |

**End state achieved: data shape is now shared across both apps.** Both apps speak the same canonical contract for `Client`, `Opportunity`, and `Deal`. The shared schema lives in [packages/shared-domain/src/](packages/shared-domain/src/) and is the single source of truth for what becomes the real DB schema.

## Display strings

Lowercase canonical values are *data*. Human-readable labels live in [apps/karvel/src/lib/labels.ts](apps/karvel/src/lib/labels.ts) — `dealTypeLabel`, `dealStatusLabel`, `marketLabel`, `businessUnitLabel`, `countryLabel`, `invoiceStatusLabel`, `payableStatusLabel`, `opportunityTypeLabel`, `opportunityStatusLabel`. UI components import these and render the label, never the raw value.
