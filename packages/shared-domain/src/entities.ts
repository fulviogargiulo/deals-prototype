import type {
  AgentDocumentType,
  AssetType,
  BusinessProcess,
  BusinessUnit,
  CommissionPayer,
  Country,
  Currency,
  DealStatus,
  DocumentRequirementStatus,
  InvoiceStatus,
  LedgerType,
  Market,
  OfferStatus,
  OpportunityStatus,
  OpportunityType,
  ParticipantRole,
  PnlEngine,
  PnlRole,
  PostingSide,
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
  /** IBAN used for outbound payments to this party. */
  iban?: string;
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
// Property — a real-estate unit that can be referenced by Offers.
// ============================================================
export interface Property {
  id: string;
  name: string;
  country: Country;
  currency: Currency;
  address?: string;
  type?: string;
  developmentName?: string;
}

// ============================================================
// Mortgage — a loan product brokered by Huspy MBU.
// ============================================================
export interface Mortgage {
  id: string;
  lenderName: string;
  country: Country;
  currency: Currency;
  loanAmount?: number;
  termYears?: number;
  productType?: "fixed" | "variable" | "islamic";
}

// ============================================================
// Asset — generic deal-level bridge to the thing being transacted.
// Lightweight: just a type discriminator + redirect key to the
// canonical record in the BU-specific system (Property for REBU,
// loan product for MBU, etc.).
// ============================================================
export interface Asset {
  id: string;
  assetType: AssetType;
  sourceSystem?: "rebu" | "mbu";
  sourceId?: string;
}

// ============================================================
// Offer — a formal bid on a property, linking a client + agents
// to a specific transaction. A Deal is spawned when an Offer
// reaches the `documents-complete` state.
// ============================================================
export interface Offer {
  id: string;
  status: OfferStatus;

  // First-class context — not derived from property lookup
  country: Country;
  currency: Currency;

  // Links
  assetId?: string;
  opportunityId?: string;
  clientId?: string;

  // Transaction
  offerAmount?: number;
  commissionPayer?: CommissionPayer;
  totalCommissionPct?: number;

  // Agent splits — feeds directly into the Waterfall Engine
  // buyerAgentId  = the "Closer" (buyer-side agent)
  // sellerAgentId = the "Lister" (seller-side agent)
  buyerAgentId?: string;
  sellerAgentId?: string;
  /** Closer's share of the agent commission pool (0–100). */
  buyerAgentSplitPct?: number;
  /** Lister's share of the agent commission pool (0–100). */
  sellerAgentSplitPct?: number;

  createdAt: string;
  updatedAt: string;

  // Display caches
  assetName?: string;
  clientName?: string;
}

// ============================================================
// Deal — full operational + agent-facing schema
// ============================================================

// Karvel-specific support types (lived in apps/karvel/src/data/types.ts before flattening)
export type ReceivableEntityType = "developer" | "buyer" | "seller" | "tenant" | "bank" | "landlord";
export type PaymentMode = "cash" | "mortgage";

export interface StatusHistoryEntry {
  from: DealStatus;
  to: DealStatus;
  timestamp: string;
  note?: string;
}
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

export type DocumentType = "contract" | "id" | "financial" | "property" | "legal" | "invoice" | "other";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  clientId?: string;
  opportunityId?: string;
  dealId?: string;
  /** Set when type === "invoice". Live link to the Invoice for status/badge display. */
  invoiceId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  partyId: string;
  country?: Country;
  uid?: number;
  /** Whether the agent is paid via payroll (salaried) or self-invoices (commission). */
  employmentType?: "salaried" | "commission";
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
  dealAmount: number;

  // Optional canonical
  offerId?: string;
  assetId?: string;
  market?: Market;
  businessUnit?: BusinessUnit;
  country?: Country;
  currency?: Currency;
  channel?: string;
  createdAt?: string;
  updatedAt?: string;

  title?: string;
  /** Optional free-text label for this deal (e.g. "Arras + Escritura split"). */
  description?: string;
}

// ============================================================
// Tranche — a single financial settlement event within a Deal.
// Each commission payment is a Tranche: one Deal can have 1..N
// Tranches (e.g. Arras tranche + Escritura tranche in Spain).
// The state machine, P&L, invoices, postings and documents are
// all scoped to a Tranche, not the parent Deal.
// ============================================================
export interface Tranche {
  // Identity
  id: string;
  dealId: string;
  /** Short human label shown on tabs: "Arras", "Escritura", "Full". */
  label?: string;
  /** 0-based ordering index within the deal. Controls tab order. */
  index: number;

  // State machine
  status: DealStatus;
  statusHistory?: StatusHistoryEntry[];

  // Metadata
  /** Tax config to apply when invoicing this tranche. */
  blueprintId?: string;
  /** Which P&L calculation engine to use. */
  pnlEngine?: PnlEngine;
  /** Reporting / recognition date for this settlement. */
  reportDate: string;
  /** MBU: mortgage principal actually disbursed for this tranche. */
  disbursedAmount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
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

/**
 * BrokerRateSlab: no fixed pct — rate is resolved at calculation time from BrokerRateSlab.
 * Used for MBU MA/Broker channel agents. The actual pct depends on:
 *   - the deal's reporting month
 *   - the lending bank (SUPPLY stakeholder partyId)
 *   - the broker's total monthly GMV across all banks (tier selector)
 */
export interface BrokerRateSlabStrategy {
  kind: "broker-rate-slab";
}

/** Rate resolved at calc time from MBUDirectMonthlyRate by channel + month + sourcing type. */
export interface MBUDirectRateSlabStrategy {
  kind: "mbu-direct-rate-slab";
}

export type AgentStrategy = FlatAgentStrategy | SlabAgentStrategy | MaxAgentStrategy | BrokerRateSlabStrategy | MBUDirectRateSlabStrategy;

// ============================================================
// MBUDirectMonthlyRate — agent commission config for MBU direct channels (REA, DS, B2C).
// Rates are % of gross revenue (what Huspy gets from the bank).
// selfSourcedRate applies when no ACQUISITION_DEDUCTION stakeholder is present.
// externalSourcedRate applies when a referral party (ACQUISITION_DEDUCTION) is present.
// The referral fee defaults to 0.3% of gross revenue unless overridden on the stakeholder.
// ============================================================
export interface MBUDirectMonthlyRate {
  id: string;
  /** "YYYY-MM" — the reporting month this config applies to. */
  reportingMonth: string;
  channel: "REA" | "DS" | "B2C";
  /** % of gross revenue paid to agent when deal is self-sourced. */
  selfSourcedRate: number;
  /** % of gross revenue paid to agent when deal is externally sourced (referral present). */
  externalSourcedRate: number;
}

// ============================================================
// BrokerRateSlab — MBU MA/Broker channel commission config.
// Set monthly by BizOps. Tier is selected by the broker's total
// disbursed amount across ALL banks in the reporting month.
// Rate within the tier is per bank.
// ============================================================
export interface BrokerRateSlab {
  id: string;
  /** "YYYY-MM" — the reporting month this config applies to. */
  reportingMonth: string;
  /** Slabs ordered ascending by upTo. Last slab must have upTo: null. */
  slabs: Array<{
    upTo: number | null;
    bankRates: Array<{ bankId: string; pct: number }>;
  }>;
}

export interface ConnectedAgent {
  id: string;
  agentId: string;
  label: string;
  rate: number;
  ledgerId?: number;
}

export interface AgentFinancials {
  id: string;
  agentId: string;
  /** The P&L engine this config applies to. One agent can have multiple AgentFinancials records,
   *  one per engine they participate in (e.g. REBU agent who also acts as a broker on MBU deals). */
  pnlEngine: PnlEngine;
  /** Strategy used to compute the agent's payout against deal net revenue. */
  strategy: AgentStrategy;
  /** Connected agents (team leads, managers, etc.) — overhead paid by Huspy on top of agent commission. */
  connectedAgents?: ConnectedAgent[];
  /** BYOB channel only: % deducted from the broker's slab-computed payout as a Huspy service fee. */
  byobPenaltyRate?: number;
  /** ISO date the policy became effective. Used when multiple records exist for one agent. */
  effectiveFrom?: string;
}

// ============================================================
// Blueprint — statutory tax configuration per (country, businessUnit).
//
// Tax is NOT modelled as a stakeholder or waterfall step. The Blueprint
// service reads this at invoice_issued and emits the required PostingLines
// against LIAB_VAT_{CUR}. The P&L waterfall operates on
// tax-exclusive amounts only.
// ============================================================
export interface Blueprint {
  id: string;
  country: Country;
  businessUnit: BusinessUnit;

  /** VAT rate applied to gross commission (e.g. 5 = VAT 5%, 21 = IVA 21%). */
  taxRate: number;
  /** Human-readable VAT label (e.g. "VAT", "IVA"). */
  taxLabel: string;
  /** Income withholding rate deducted from agent payouts and remitted to the tax authority (e.g. 15 = IRPF 15%). Omitted in markets with no withholding obligation. */
  withholdingRate?: number;
  /** Human-readable withholding label (e.g. "IRPF"). */
  withholdingLabel?: string;
}

// ============================================================
// DealParticipant — identity-only party on a Deal.
// DEMAND (buyer / tenant / borrower) and SUPPLY (seller / developer / bank).
// Deal-scoped, not Tranche-scoped: the buyer is the same across all Tranches.
// No financial effect — no amount, no waterfall position.
// ============================================================
export interface DealParticipant {
  id: string;
  dealId: string;
  partyId: string;
  role: ParticipantRole;
  isPrimary?: boolean;
  description?: string;
}

// ============================================================
// PnlEntry — one line in a Tranche's P&L waterfall.
// Scoped to a Tranche (not the Deal). Two Tranches on the same
// Deal have independent PnlEntry sets with independent amounts
// and confirmation state.
//
// Lifecycle:
//   status === "draft"     — working copy. For rate-based AGENT_PAYOUT entries (source === "engine"),
//                            the P&L re-runs the engine live; amount is the last saved engine estimate.
//                            For declared amounts (source === "manual"), amount is used as-is.
//   status === "confirmed" — locked when the Tranche transitions to invoicing. amount is the
//                            authoritative value; engine uses it directly without recomputing.
//                            Who confirmed and when is on tranche.statusHistory (to === "invoicing").
//
// Override detection: source === "manual" on a rate-based AGENT_PAYOUT entry means ops set a
// fixed amount instead of using the engine. Full change history is in PnlEntryAudit.
// ============================================================
export interface PnlEntry {
  id: string;
  trancheId: string;
  partyId: string;
  role: PnlRole;
  isPrimary?: boolean;
  /** Agent's share of the commission pool (0–100). Only meaningful on rate-based AGENT_PAYOUT roles. */
  splitPercentage?: number;
  /** The financial amount for this entry.
   *  Positive → party pays Huspy (REVENUE_SOURCE) or receives a payout (AGENT_PAYOUT).
   *  Negative → cost Huspy pays (ACQUISITION_DEDUCTION / OPERATIONAL_DEDUCTION).
   *  - source === "manual": ops-declared value; engine uses it directly.
   *  - source === "engine" + status === "confirmed": locked engine output; engine uses it directly.
   *  - source === "engine" + status === "draft": last saved engine estimate; engine recomputes live. */
  amount?: number;
  /** Who wrote the current amount value.
   *  "engine" — written by the P&L engine (at Tranche creation or save-for-approval).
   *  "manual" — explicitly entered by ops (overrides the engine for this entry). */
  source?: "engine" | "manual";
  /** draft = editable; confirmed = locked at the invoicing transition. */
  status?: "draft" | "confirmed";
  /** Human-readable label for this line (e.g. "Team Lead", "Conveyance Fee"). */
  description?: string;
  /** Links an ACQUISITION_DEDUCTION or OPERATIONAL_DEDUCTION entry to a parent AGENT_PAYOUT entry.
   *  When set, the cost is deducted from the parent agent's pool rather than from Huspy's gross revenue. */
  parentEntryId?: string;
}

// ============================================================
// PnlEntryAudit — append-only record of every mutation
// to a draft PnlEntry. Written before each change.
// No records are written after status === "confirmed".
// ============================================================
export interface PnlEntryAudit {
  id: string;
  entryId: string;
  trancheId: string;
  field: string;
  oldValue: string | number | null;
  oldSource?: "engine" | "manual";
  newValue: string | number | null;
  newSource?: "engine" | "manual";
  changedBy: string;
  changedAt: string;
  reason?: string;
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
  trancheId: string;
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
// DealComment — ops ↔ agent thread on a deal.
// author="ops" means Huspy ops/finance asked a question or left a note.
// author="agent" means the agent replied or raised a point.
// ============================================================
export interface DealComment {
  id: string;
  trancheId: string;
  author: "ops" | "agent";
  authorName: string;
  text: string;
  createdAt: string;
}

// ============================================================
// Accounting — Ledger / Posting / PostingLine
// ============================================================

export interface Ledger {
  id: number;
  name: string;
  description?: string;
  type: LedgerType;
  /** True for GL parent accounts that have subledgers — direct posting is forbidden; always post to a subledger. */
  isControlAccount?: boolean;
  glId?: number;
  partyId?: string;
  currency?: Currency;
}

export interface Posting {
  id: string;
  trancheId?: string;
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
  /** Set on open-item lines only: AR, AP, and agent subledger (ledgers 22/24).
   *  VAT and P&L lines (REV, EXP) are excluded. */
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
  trancheId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  /** Pre-VAT base amount. For invoices without a VAT breakdown this is the full face value. */
  subtotal: number;
  /** VAT on top of subtotal. Gross (invoice face value) = subtotal + vatAmount. */
  vatAmount?: number;
  /** Withholding deducted at payment (e.g. IRPF 15%). Net payout = subtotal + vatAmount − withholdingAmount. */
  withholdingAmount?: number;
  currency: Currency;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  period?: string;
  invoiceFileName?: string;
  proofFileName?: string;
  proofUploadedAt?: string;
  paymentReference?: string;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Line-item breakdown for bundled invoices (e.g. commission + conveyance on the same party). */
  lineItems?: Array<{ description: string; amount: number }>;
}
