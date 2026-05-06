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
export interface Opportunity {
  id: string;
  clientId: string;
  agentId: string;
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  country: Country;
  source?: string;
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
