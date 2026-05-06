import type {
  BusinessUnit,
  Country,
  Currency,
  DealStatus,
  DealType,
  Market,
  OpportunityStatus,
  OpportunityType,
} from "./enums";

// ---------- Client ----------
// Fields both apps agree on. App-specific richness (verification flow, CRM
// timeline) lives in each app's own extended type.
export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// ---------- Opportunity ----------
// Canonical leans on agent-app's richer property-attribute shape. Karvel
// extends with denormalized display caches (clientName, agentName).
export interface PriceRange {
  min: number;
  max: number;
  currency: Currency;
}

export interface SizeRange {
  min: number;
  max: number;
  unit: string; // e.g. "m²", "sqft"
}

export interface Opportunity {
  id: string;
  clientId: string;
  agentId?: string; // optional in canonical; karvel narrows to required
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  country?: Country; // optional in canonical for now
  neighborhoods: string[];
  source?: string;
  priceRange?: PriceRange;
  originalPriceRange?: PriceRange;
  bedrooms?: number;
  bathrooms?: number;
  sizeRange?: SizeRange;
  propertyTypes?: string[];
  description?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Deal ----------
// Canonical core. Karvel adds COGS, payables, receivables, multi-agent splits.
// Agent-app adds invoice + payment fields visible to the agent.
export interface Deal {
  id: string;
  opportunityId: string;
  clientId: string;
  agentId: string;
  type: DealType;
  status: DealStatus;
  market: Market;
  businessUnit: BusinessUnit;
  country: Country;
  currency: Currency;
  dealAmount: number;
  reportDate: string; // ISO date
  createdAt: string;
  updatedAt: string;
}
