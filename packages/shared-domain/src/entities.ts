import type {
  BusinessUnit,
  Country,
  Currency,
  DealStatus,
  DealType,
  InvoiceStatus,
  Market,
  OpportunityStatus,
  OpportunityType,
  PayableStatus,
} from "./enums";

// ============================================================
// Client
// ============================================================
//
// One canonical Client type. Karvel and agent-app each consume the same
// records; each renders the subset of fields it cares about.
//
// Field-name notes (collisions resolved):
//   - `creationChannel`  = where the client record was created (karvel concept,
//     formerly `source` in karvel)
//   - `inquirySource`    = where an inbound inquiry originated (agent-app
//     concept, formerly `source` in agent-app)
// ============================================================
export interface Client {
  // Required core
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;

  // Optional canonical
  email?: string;
  description?: string;
  location?: string;
  preferredLanguage?: string;

  // Lifecycle / verification
  status?: "active" | "inactive";
  verificationStatus?: "incoming" | "pending" | "verified";

  // Where the client/inquiry came from. Loose string — values vary by app:
  //   karvel: "AGENT_APP" | "BACKOFFICE"
  //   agent-app: "self-created" | "idealista" | "fotocasa"
  source?: string;
  origin?: string; // karvel-only; secondary categorisation
  expiresAt?: string;
  lastActivity?: string;
}

// ============================================================
// Opportunity
// ============================================================
export interface PriceRange {
  min: number;
  max: number;
  currency: Currency;
}

export interface SizeRange {
  min: number;
  max: number;
  unit: string;
}

export interface Opportunity {
  // Required core
  id: string;
  clientId: string;
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  createdAt: string;
  updatedAt: string;

  // Optional canonical
  agentId?: string;
  country?: Country;
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

  // Karvel display caches (denormalized)
  clientName?: string;
  clientPhone?: string;
  agentName?: string;
  lastActivity?: string;

  // Agent-app-relevant
  tags?: string[];
  portalBadges?: string[];
  updatesCount?: number;
  pendingActions?: string[];
}

// ============================================================
// Deal — full operational + agent-facing schema
// ============================================================

// Karvel-specific support types (lived in apps/karvel/src/data/types.ts before flattening)
export type ReceivableEntityType = "developer" | "buyer" | "seller" | "tenant" | "bank" | "landlord";
export type PaymentMode = "cash" | "mortgage";
export type SOAStatus = "pending" | "generated" | "approved" | "disputed";

export interface ReceivableEntry {
  entityName: string;
  entityType: ReceivableEntityType;
  amount: number;
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;
}

export interface PayableEntry {
  entityType: "external_partner" | "agent" | "team_lead" | "manager" | "referrer" | "conveyance" | "broker" | "rm" | "tl" | "ds";
  entityLabel: string;
  expectedAmount: number;
  refNumber?: string;
  status: PayableStatus;
  paidAmount?: number;
  paidDate?: string;
  soaReference?: string;
  soaStatus?: SOAStatus;
  soaDisputeNote?: string;
  entityUploadedInvoice?: string;
}

export interface AgentEntry {
  agentName: string;
  agentId?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentShare: number;
  agentCommissionRate: number;
  agentCommissionPayout: number;
  agentIncentive: number;
  agentDeductions: number;
  agentTotalAmount: number;
  teamLeadName?: string;
  teamLeadRate: number;
  teamLeadShare: number;
  managerName?: string;
  managerOverrideRate: number;
  managerOverride: number;
  referralType?: string;
  referrerName?: string;
  referralPercentage: number;
  referralAmount: number;
  clientKickback: number;
}

export interface ExternalPartnerEntry {
  partnerName: string;
  partnerShare: number;
  partnerAmount: number;
  partnerBank?: string;
  partnerBankAccount?: string;
}

export interface StatusHistoryEntry {
  from: DealStatus;
  to: DealStatus;
  timestamp: string;
  note?: string;
}

// Agent-app dispute model
export type DisputeStatus = "open" | "resolved";
export type DisputeField = "deal-amount" | "commission-percentage" | "report-date" | "other";
export interface DealDispute {
  id: string;
  dealId: string;
  field: DisputeField;
  description: string;
  correctValue?: string;
  status: DisputeStatus;
  createdAt: string;
}

export interface Deal {
  // Required core
  id: string;
  type: DealType;
  status: DealStatus;
  dealAmount: number;
  reportDate: string;

  // Optional canonical
  opportunityId?: string;
  clientId?: string;
  agentId?: string;
  market?: Market;
  businessUnit?: BusinessUnit;
  country?: Country;
  currency?: Currency;
  createdAt?: string;
  updatedAt?: string;

  // Display caches (used by both apps)
  clientName?: string;
  agentName?: string;
  opportunityName?: string;
  title?: string;

  // ==========================================================
  // Karvel — operational / financial fields
  // ==========================================================
  channel?: string;
  ofCaseNumber?: string;

  // Property (REBU)
  buildingName?: string;
  unitNumber?: string;
  community?: string;
  subCommunity?: string;
  fullAddress?: string;
  propertyType?: string;
  projectName?: string;

  // Buyer / Seller (REBU)
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  sellerName?: string;
  sellerTaxId?: string;
  sellerEmail?: string;
  paymentMode?: PaymentMode;

  // Revenue
  dealPrice?: number;
  takeRate?: number;
  huspyRevenue?: number;
  netHuspyRevenue?: number;
  conveyanceRevenue?: number;

  // Multi-agent + legacy single-agent display fields
  agents?: AgentEntry[];
  agentShare?: number;
  agentCommissionRate?: number;
  agentCommissionPayout?: number;
  teamLeadName?: string;
  teamLeadRate?: number;
  teamLeadShare?: number;
  managerName?: string;
  managerOverrideRate?: number;
  managerOverride?: number;

  // Conveyance
  conveyanceAgentName?: string;
  conveyanceAgentRate?: number;
  conveyanceAgentPayout?: number;
  huspyConveyanceShare?: number;

  // Kickbacks / Referrals
  clientKickback?: number;
  referralType?: string;
  referralPercentage?: number;
  referralAmount?: number;

  // Rebates / Subsidy
  rebatePercentage?: number;
  rebateAmount?: number;
  subsidyAmount?: number;

  // COGS
  cogsInternal?: number;
  cogsExternal?: number;
  cogsReferrals?: number;
  cogsRebates?: number;
  cogsSubsidy?: number;

  // MBU-specific
  bankName?: string;
  accountManager?: string;
  numberOfTranches?: number;
  disbursedAmount?: number;
  bankSlab?: number;
  brokerCommissionRate?: number;
  brokerPayout?: number;
  rmName?: string;
  rmCommissionRate?: number;
  rmPayout?: number;
  tlName?: string;
  tlCommissionRate?: number;
  tlPayout?: number;
  dsName?: string;
  dsCommissionRate?: number;
  dsPayout?: number;
  externalCommissionRate?: number;
  externalPayout?: number;

  // External partners
  externalPartners?: ExternalPartnerEntry[];
  externalPartnerName?: string;
  externalPartnerShare?: number;
  externalPartnerBank?: string;
  externalPartnerBankAccount?: string;

  // Receivables / Payables
  receivables?: ReceivableEntry[];
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;
  payables?: PayableEntry[];
  payableRefNumber?: string;
  payableStatus?: PayableStatus;

  // Notes / Dispute / History
  latestNote?: string;
  isDisputed?: boolean;
  disputeNote?: string;
  statusHistory?: StatusHistoryEntry[];

  // ==========================================================
  // Agent-app — agent-facing commission / invoice fields
  // ==========================================================
  marketType?: "primary" | "secondary" | "leasing"; // alias for `market` used by agent-app UI
  commissionPercentage?: number;
  commissionAmount?: number;
  invoiceDueDate?: string;
  paymentDate?: string;
  dispute?: DealDispute;
}
