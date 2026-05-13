import type {
  AgentDocumentType,
  BusinessProcess,
  BusinessUnit,
  Country,
  Currency,
  DealStatus,

  DocumentRequirementStatus,
  InvoiceStatus,
  LedgerType,
  Market,
  OpportunityStatus,
  OpportunityType,
  PostingSide,
  StakeholderType,
} from "./enums";

// ============================================================
// Party — central identity record shared by Agent, Client, and
// any other counterparty (bank, developer, third-party firm).
// Agent and Client link here via partyId instead of embedding
// contact fields directly.
// ============================================================
export interface Party {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  legalType?: string;
  /** Deduplication key. Two Party records with the same taxId represent the same legal entity. */
  taxId?: string;
}

// ============================================================
// Client — sub-type of Party for real-estate clients.
// Contact fields (displayName, email, phone) live on the linked Party.
// ============================================================
export interface Client {
  id: string;
  partyId: string;
  createdAt: string;
  updatedAt: string;

  // Lifecycle / verification
  status?: "active" | "inactive";
  verificationStatus?: "incoming" | "pending" | "verified";
  source?: string;
  origin?: string;
  expiresAt?: string;
  lastActivity?: string;

  // Optional canonical
  description?: string;
  location?: string;
  preferredLanguage?: string;

  /** @deprecated Access via the linked Party (partyId) instead. */
  fullName?: string;
  /** @deprecated Access via the linked Party (partyId) instead. */
  phone?: string;
  /** @deprecated Access via the linked Party (partyId) instead. */
  email?: string;
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

// ============================================================
// Task / Document / Agent / ScheduleActivity
// ============================================================
// Currently used by agent-app only. Karvel may consume them later
// (operations team needs a task list too). Co-located in shared-domain
// so all canonical data lives in one place.
// ============================================================

export type TaskStatus = "todo" | "in-progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  clientId?: string;
  opportunityId?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = "contract" | "id" | "financial" | "property" | "legal" | "other";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  clientId?: string;
  opportunityId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  partyId: string;
  uid?: number;
  employmentStatus?: string;
  teamLeadName?: string;
  managerName?: string;
  workingZones?: string[];
  // UI-only display fields (not in ERD; prototype convenience)
  photo?: string;
  specialties?: string[];
  experience?: number;
  rating?: number;
  totalSales?: number;
  /** @deprecated Access via the linked Party (partyId) instead. */
  name?: string;
  /** @deprecated Access via the linked Party (partyId) instead. */
  email?: string;
  /** @deprecated Access via the linked Party (partyId) instead. */
  phone?: string;
}

export type ScheduleActivityType = "viewing" | "task";
export type ScheduleActivityStatus = "scheduled" | "completed" | "overdue" | "no-show" | "cancelled";
export type VisitOutcome = "completed" | "no-show" | "cancelled" | "rescheduled";
export type ClientInterestLevel = "high" | "medium" | "low" | "none";

export interface PropertyAddress {
  street: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export interface MeetingPoint {
  message: string;
  sentVia: "whatsapp" | "sms" | "email";
  sentTo: string;
}

export interface VisitDocument {
  id: string;
  name: string;
  type: string;
}

export interface VisitFeedback {
  outcome: VisitOutcome;
  notes?: string;
  clientInterest?: ClientInterestLevel;
  clientLiked?: boolean;
  reason?: string;
}

export interface ScheduleActivity {
  id: string;
  type: ScheduleActivityType;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: string;
  status: ScheduleActivityStatus;
  clientId?: string;
  clientName?: string;
  opportunityId?: string;
  opportunityName?: string;
  propertyId?: string;
  propertyName?: string;
  propertyImage?: string;
  propertyLocation?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAvatar?: string;
  propertyAddress?: PropertyAddress;
  meetingPoint?: MeetingPoint;
  meetingPointLabel?: string;
  documents?: VisitDocument[];
  feedback?: VisitFeedback;
}

// Convenience aggregate: a client with their full opportunity list joined.
export interface ClientWithOpportunities extends Client {
  opportunities: Opportunity[];
}

export interface Deal {
  // Required core
  id: string;
  status: DealStatus;
  dealAmount: number;
  reportDate: string;

  // Optional canonical
  opportunityId?: string;
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
  /** @deprecated Conveyance fee — now modelled as a DealStakeholder with role "conveyance" and negative financialAmount. */
  conveyanceRevenue?: number;

  // Lean waterfall — set by the new Deal creation flow.
  /** Gross commission Huspy charges. For multi-payer deals, equals Σ DealStakeholder.financialAmount where > 0. */
  grossRevenue?: number;
  /** Blueprint id the engine used for the most recent projection. */
  blueprintId?: string;

  // Rebates / Subsidy (inputs — kept as deal config)
  rebatePercentage?: number;
  subsidyAmount?: number;

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

  // Receivables (derived from outbound Invoices)
  receivables?: ReceivableEntry[];
  paymentReceivedDate?: string;
  paymentReceivedAmount?: number;

  // Notes / Dispute
  latestNote?: string;
  isDisputed?: boolean;
  disputeNote?: string;

  // ==========================================================
  // Agent-app — agent-facing commission / invoice fields
  // ==========================================================
  marketType?: "primary" | "secondary" | "leasing"; // alias for `market` used by agent-app UI
  commissionPercentage?: number;
  commissionAmount?: number;
  paymentDate?: string;
  dispute?: DealDispute;
}

// ============================================================
// AgentFinancials — per-agent commission strategy & rate config.
// Replaces the in-memory agentFinancialsStore in AgentDetail.tsx.
// Every internal split for an agent on a deal is derived from
// the agent's strategy applied to the deal's net revenue.
// ============================================================

/** Flat: a constant % of the agent's share of net revenue. */
export interface FlatAgentStrategy {
  kind: "flat";
  /** Percentage of net revenue paid as commission, e.g. 40 = 40%. */
  pct: number;
}

/** Slab: progressive tiers applied to the agent's allocated net on the current deal.
 *  Each `pct` applies to the slice between the previous slab's `upTo` and this one's. */
export interface SlabAgentStrategy {
  kind: "slab";
  /** Slabs ordered by ascending `upTo`. Final slab should have `upTo: null` to mean unbounded. */
  slabs: Array<{ upTo: number | null; pct: number }>;
}

/** Max: a flat % capped at an absolute amount. payout = min(pct × net, capAmount). */
export interface MaxAgentStrategy {
  kind: "max";
  pct: number;
  capAmount: number;
}

export type AgentStrategy = FlatAgentStrategy | SlabAgentStrategy | MaxAgentStrategy;

export interface AgentFinancials {
  id: string;
  agentId: string;
  /** Strategy used to compute the agent's payout against deal net revenue. */
  strategy: AgentStrategy;
  /** % of agent payout passed to the team lead (Huspy-borne overhead, additive on top). */
  teamLeadRate?: number;
  /** % of agent payout passed to the manager (Huspy-borne overhead, additive on top). */
  managerRate?: number;
  /** ISO date the policy became effective. Used when multiple records exist for one agent. */
  effectiveFrom?: string;
}

// ============================================================
// Blueprint — statutory tax configuration per (country, businessUnit).
//
// Tax is NOT modelled as a stakeholder or waterfall step. The Blueprint
// service reads this at deal_close and emits the required PostingLines
// against LIAB_STATUTORY_TAX_{CUR}. The P&L waterfall operates on
// tax-exclusive amounts only.
// ============================================================
export interface Blueprint {
  id: string;
  country: Country;
  businessUnit: BusinessUnit;

  /** Statutory tax rate applied to gross commission (e.g. 5 = VAT 5%, 21 = IVA 21%). */
  taxRate: number;
  /** Human-readable tax label for ledger descriptions (e.g. "VAT", "IVA"). */
  taxLabel: string;
}

// ============================================================
// DealStakeholder — links a Party to a Deal with a specific role.
// Replaces the agentId/clientId FKs that were embedded on Deal.
// ============================================================
export interface DealStakeholder {
  id: string;
  dealId: string;
  partyId: string;
  role: StakeholderType;
  isPrimary?: boolean;
  /** Agent's share of the commission pool (0–100). Only relevant for agent roles. */
  splitPercentage?: number;
  fixedAmount?: number;
  /** Signed financial impact on the deal P&L.
   *  Positive → party pays Huspy (gross revenue source). Engine sums these instead of Deal.grossRevenue when present.
   *  Negative → Huspy pays party (cost). Bucket derived from role: conveyance → D; all others → C. */
  financialAmount?: number;
}

// ============================================================
// DealDocumentRequirement — per-deal document checklist.
// Instantiated from DocumentRequirementTemplate when a deal is
// created. Primary agent submits all documents; Ops approves or
// waives in Karvel. Agent-specific docs (KYC, identity) are
// managed on the Agent profile in Karvel, not here.
// ============================================================
export interface DealDocumentRequirement {
  id: string;
  dealId: string;
  label: string;
  required: boolean;
  status: DocumentRequirementStatus;
  documentId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ============================================================
// DocumentRequirementTemplate — configurable registry of
// required documents per (market, businessUnit, country).
// Ops manages templates in Karvel; the engine instantiates
// DealDocumentRequirement rows from matching templates on deal
// creation.
// ============================================================
export interface DocumentRequirementTemplate {
  id: string;
  market: Market;
  businessUnit: BusinessUnit;
  country: Country;
  label: string;
  required: boolean;
}

// AgentDocument — per-agent compliance documents managed by Ops in Karvel.
// Not deal-scoped. Covers identity, licensing, and payment details.
// kind="file"  → Ops uploads a scanned document (passport, license, AML/KYC…)
// kind="text"  → Ops types a reusable value (IBAN, BIC, NIE number…) stored in `value`
export interface AgentDocument {
  id: string;
  agentId: string;
  documentType: AgentDocumentType;
  label: string;
  required: boolean;
  kind: "file" | "text";
  status: DocumentRequirementStatus;
  value?: string;
  documentId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  expiresAt?: string;
  notes?: string;
}

// ============================================================
// Accounting — Ledger / Posting / PostingLine
// ============================================================

export interface Ledger {
  id: number;
  name: string;
  description?: string;
  type: LedgerType;
  glId?: number;
  partyId?: string;
  currency?: Currency;
}

export interface Posting {
  id: string;
  dealId?: string;
  businessUnit?: BusinessUnit | null;
  externalRef?: string;
  businessProcess: BusinessProcess;
  createdBy: string;
  createdAt: string;
  valueDate: string;
  currency: Currency;
  reversedByPostingId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PostingLine {
  id: string;
  postingId: string;
  ledgerId: number;
  side: PostingSide;
  amount: number;
  invoiceId?: string;
}

// ============================================================
// Invoice — unified outbound (Huspy → client) and inbound (agent → Huspy).
// partyId links to the Party that Huspy is billing (outbound) or
// that is billing Huspy (inbound). Replaces entityType/entityName/counterpartyId.
// ============================================================
export interface Invoice {
  id: string;
  direction: "outbound" | "inbound";
  partyId: string;
  dealId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  currency: Currency;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  period?: string;
  createdAt: string;
  updatedAt: string;
}
