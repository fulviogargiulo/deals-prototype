import type { DealDocumentRequirement, Deal, Tranche } from "../entities";
import type { DocumentRequirementStatus, DealStatus } from "../enums";
import { sharedDocumentRequirementTemplates } from "./documentRequirementTemplates";

function statusForIndex(trancheStatus: DealStatus, index: number): DocumentRequirementStatus {
  switch (trancheStatus) {
    case "finalized":
    case "invoicing":
    case "pending-agent-approval":
    case "canceled":
      return "approved";
    case "under-review":
      return index === 0 ? "uploaded" : index % 3 === 0 ? "pending" : "uploaded";
    case "pending-details":
      return index === 0 ? "uploaded" : "pending";
    default:
      return "pending";
  }
}

// Per-tranche overrides keyed by template suffix (everything after `tmpl-<market>-<country>-`).
// Only specify docs that differ from the statusForIndex default.
const overrides: Record<string, Partial<Record<string, DocumentRequirementStatus>>> = {

  // tranche-003 — leasing ES, pending-details: contract + passport uploaded, ID + AML pending
  "tranche-003": {
    "tenancy-contract": "uploaded",
    "passport-tenant":  "uploaded",
    "eid-tenant":       "pending",
    "aml-kyc":          "pending",
  },

  // tranche-004 — secondary ES, pending-details: handover + buyer passport uploaded, rest pending
  "tranche-004": {
    "handover":         "uploaded",
    "title-deed":       "pending",
    "deposit-cheque":   "pending",
    "passport-buyer":   "uploaded",
    "eid-buyer":        "pending",
    "passport-seller":  "pending",
    "eid-seller":       "pending",
    "aml-kyc":          "pending",
  },

  // tranche-005 — primary SA, under-review: all uploaded except AML still pending
  "tranche-005": {
    "booking-form":   "uploaded",
    "passport-buyer": "uploaded",
    "eid-buyer":      "uploaded",
    "aml-kyc":        "pending",
  },

  // tranche-007 — secondary ES, under-review: all uploaded except AML pending
  "tranche-007": {
    "handover":        "uploaded",
    "title-deed":      "uploaded",
    "deposit-cheque":  "uploaded",
    "passport-buyer":  "uploaded",
    "eid-buyer":       "uploaded",
    "passport-seller": "uploaded",
    "eid-seller":      "uploaded",
    "aml-kyc":         "pending",
  },

  // tranche-009 — primary AE, under-review: ID + booking uploaded, AML pending
  "tranche-009": {
    "booking-form":   "uploaded",
    "passport-buyer": "uploaded",
    "eid-buyer":      "uploaded",
    "aml-kyc":        "pending",
  },

  // tranche-012 — primary AE mortgage, under-review: FOL uploaded, title deed still pending
  "tranche-012": {
    "ae-fol":        "uploaded",
    "ae-title-deed": "pending",
  },

  // tranche-017 — primary ES, under-review: booking + passport uploaded, ID + AML pending
  "tranche-017": {
    "booking-form":   "uploaded",
    "passport-buyer": "uploaded",
    "eid-buyer":      "pending",
    "aml-kyc":        "pending",
  },

  // tranche-026b — secondary ES Escritura, pending-details:
  // IDs/KYC carried over from Arras (approved), only title deed outstanding
  "tranche-026b": {
    "handover":        "uploaded",
    "title-deed":      "pending",
    "deposit-cheque":  "approved",
    "passport-buyer":  "approved",
    "eid-buyer":       "approved",
    "passport-seller": "approved",
    "eid-seller":      "approved",
    "aml-kyc":         "approved",
  },
};

function instantiate(tranche: Tranche, deal: Deal): DealDocumentRequirement[] {
  const templates = sharedDocumentRequirementTemplates.filter(
    (t) => t.market === deal.market && t.country === deal.country && t.businessUnit === (deal.businessUnit ?? "rebu")
  );
  const trancheOverrides = overrides[tranche.id] ?? {};
  return templates.map((t, i) => {
    const suffix = t.id.replace(/^tmpl-[^-]+-[^-]+-/, "");
    return {
      id:        `ddr-${tranche.id}-${suffix}`,
      trancheId: tranche.id,
      label:     t.label,
      required:  t.required,
      status:    trancheOverrides[suffix] ?? statusForIndex(tranche.status, i),
    };
  });
}

// Lazily imported to avoid circular deps — deals imports nothing from here.
import { sharedDeals } from "./deals";
import { sharedTranches } from "./tranches";

function instantiateAll(): DealDocumentRequirement[] {
  const result: DealDocumentRequirement[] = [];
  for (const tranche of sharedTranches) {
    const deal = sharedDeals.find((d) => d.id === tranche.dealId);
    if (deal) result.push(...instantiate(tranche, deal));
  }
  return result;
}

export const sharedDealDocumentRequirements: DealDocumentRequirement[] = instantiateAll();
