import type { DocumentRequirementTemplate } from "../entities";

// Configurable registry of required documents per (market, businessUnit, country).
// Ops manages this in Karvel; the engine instantiates DealDocumentRequirement rows
// from matching templates when a deal is created.
//
// Notes:
//   - Ejari is AE-only (UAE tenancy registration requirement).
//   - Form F is AE-only (Dubai MOU for property transactions).
//   - Visa documents are optional (only required if buyer/seller/tenant is non-resident).
//   - AML/KYC covers the client, not the agent. Agent KYC lives on the Agent profile in Karvel.
export const sharedDocumentRequirementTemplates: DocumentRequirementTemplate[] = [

  // ── Primary — AE ──────────────────────────────────────────────────────────
  { id: "tmpl-primary-ae-booking-form",   market: "primary",   businessUnit: "rebu", country: "ae",        label: "Booking Form / Reservation Form", required: true  },
  { id: "tmpl-primary-ae-passport-buyer", market: "primary",   businessUnit: "rebu", country: "ae",            label: "Buyer Passport",                  required: true  },
  { id: "tmpl-primary-ae-eid-buyer",      market: "primary",   businessUnit: "rebu", country: "ae",                 label: "Buyer EID",                       required: true  },
  { id: "tmpl-primary-ae-aml-kyc",        market: "primary",   businessUnit: "rebu", country: "ae",             label: "AML/KYC",                         required: true  },

  // ── Primary — ES ──────────────────────────────────────────────────────────
  { id: "tmpl-primary-es-booking-form",   market: "primary",   businessUnit: "rebu", country: "es",        label: "Booking Form / Reservation Form", required: true  },
  { id: "tmpl-primary-es-passport-buyer", market: "primary",   businessUnit: "rebu", country: "es",            label: "Buyer Passport",                  required: true  },
  { id: "tmpl-primary-es-eid-buyer",      market: "primary",   businessUnit: "rebu", country: "es",                 label: "Buyer EID",                       required: true  },
  { id: "tmpl-primary-es-aml-kyc",        market: "primary",   businessUnit: "rebu", country: "es",             label: "AML/KYC",                         required: true  },

  // ── Primary — SA ──────────────────────────────────────────────────────────
  { id: "tmpl-primary-sa-booking-form",   market: "primary",   businessUnit: "rebu", country: "sa",        label: "Booking Form / Reservation Form", required: true  },
  { id: "tmpl-primary-sa-passport-buyer", market: "primary",   businessUnit: "rebu", country: "sa",            label: "Buyer Passport",                  required: true  },
  { id: "tmpl-primary-sa-eid-buyer",      market: "primary",   businessUnit: "rebu", country: "sa",                 label: "Buyer EID",                       required: true  },
  { id: "tmpl-primary-sa-aml-kyc",        market: "primary",   businessUnit: "rebu", country: "sa",             label: "AML/KYC",                         required: true  },

  // ── Secondary — AE ────────────────────────────────────────────────────────
  { id: "tmpl-secondary-ae-handover",        market: "secondary", businessUnit: "rebu", country: "ae", label: "Agent Handover Sheet",            required: true  },
  { id: "tmpl-secondary-ae-form-f",          market: "secondary", businessUnit: "rebu", country: "ae",               label: "Form F",                          required: true  },
  { id: "tmpl-secondary-ae-title-deed",      market: "secondary", businessUnit: "rebu", country: "ae",           label: "Title Deed",                      required: true  },
  { id: "tmpl-secondary-ae-deposit-cheque",  market: "secondary", businessUnit: "rebu", country: "ae",       label: "Copy of 10% Deposit Cheque",      required: true  },
  { id: "tmpl-secondary-ae-passport-buyer",  market: "secondary", businessUnit: "rebu", country: "ae",             label: "Buyer Passport",                  required: true  },
  { id: "tmpl-secondary-ae-eid-buyer",       market: "secondary", businessUnit: "rebu", country: "ae",                  label: "Buyer EID",                       required: true  },
  { id: "tmpl-secondary-ae-visa-buyer",      market: "secondary", businessUnit: "rebu", country: "ae",                 label: "Buyer Visa",                      required: false },
  { id: "tmpl-secondary-ae-passport-seller", market: "secondary", businessUnit: "rebu", country: "ae",             label: "Seller Passport",                 required: true  },
  { id: "tmpl-secondary-ae-eid-seller",      market: "secondary", businessUnit: "rebu", country: "ae",                  label: "Seller EID",                      required: true  },
  { id: "tmpl-secondary-ae-visa-seller",     market: "secondary", businessUnit: "rebu", country: "ae",                 label: "Seller Visa",                     required: false },
  { id: "tmpl-secondary-ae-aml-kyc",         market: "secondary", businessUnit: "rebu", country: "ae",              label: "AML/KYC",                         required: true  },

  // ── Secondary — ES ────────────────────────────────────────────────────────
  { id: "tmpl-secondary-es-handover",        market: "secondary", businessUnit: "rebu", country: "es", label: "Agent Handover Sheet",            required: true  },
  { id: "tmpl-secondary-es-title-deed",      market: "secondary", businessUnit: "rebu", country: "es",           label: "Title Deed",                      required: true  },
  { id: "tmpl-secondary-es-deposit-cheque",  market: "secondary", businessUnit: "rebu", country: "es",       label: "Copy of 10% Deposit Cheque",      required: true  },
  { id: "tmpl-secondary-es-passport-buyer",  market: "secondary", businessUnit: "rebu", country: "es",             label: "Buyer Passport",                  required: true  },
  { id: "tmpl-secondary-es-eid-buyer",       market: "secondary", businessUnit: "rebu", country: "es",                  label: "Buyer EID",                       required: true  },
  { id: "tmpl-secondary-es-passport-seller", market: "secondary", businessUnit: "rebu", country: "es",             label: "Seller Passport",                 required: true  },
  { id: "tmpl-secondary-es-eid-seller",      market: "secondary", businessUnit: "rebu", country: "es",                  label: "Seller EID",                      required: true  },
  { id: "tmpl-secondary-es-aml-kyc",         market: "secondary", businessUnit: "rebu", country: "es",              label: "AML/KYC",                         required: true  },

  // ── Secondary — SA ────────────────────────────────────────────────────────
  { id: "tmpl-secondary-sa-handover",        market: "secondary", businessUnit: "rebu", country: "sa", label: "Agent Handover Sheet",            required: true  },
  { id: "tmpl-secondary-sa-form-f",          market: "secondary", businessUnit: "rebu", country: "sa",               label: "Form F",                          required: true  },
  { id: "tmpl-secondary-sa-title-deed",      market: "secondary", businessUnit: "rebu", country: "sa",           label: "Title Deed",                      required: true  },
  { id: "tmpl-secondary-sa-deposit-cheque",  market: "secondary", businessUnit: "rebu", country: "sa",       label: "Copy of 10% Deposit Cheque",      required: true  },
  { id: "tmpl-secondary-sa-passport-buyer",  market: "secondary", businessUnit: "rebu", country: "sa",             label: "Buyer Passport",                  required: true  },
  { id: "tmpl-secondary-sa-eid-buyer",       market: "secondary", businessUnit: "rebu", country: "sa",                  label: "Buyer EID",                       required: true  },
  { id: "tmpl-secondary-sa-visa-buyer",      market: "secondary", businessUnit: "rebu", country: "sa",                 label: "Buyer Visa",                      required: false },
  { id: "tmpl-secondary-sa-passport-seller", market: "secondary", businessUnit: "rebu", country: "sa",             label: "Seller Passport",                 required: true  },
  { id: "tmpl-secondary-sa-eid-seller",      market: "secondary", businessUnit: "rebu", country: "sa",                  label: "Seller EID",                      required: true  },
  { id: "tmpl-secondary-sa-visa-seller",     market: "secondary", businessUnit: "rebu", country: "sa",                 label: "Seller Visa",                     required: false },
  { id: "tmpl-secondary-sa-aml-kyc",         market: "secondary", businessUnit: "rebu", country: "sa",              label: "AML/KYC",                         required: true  },

  // ── Leasing — AE (includes Ejari) ─────────────────────────────────────────
  { id: "tmpl-leasing-ae-tenancy-contract", market: "leasing",   businessUnit: "rebu", country: "ae",    label: "Tenancy Contract",                required: true  },
  { id: "tmpl-leasing-ae-passport-tenant",  market: "leasing",   businessUnit: "rebu", country: "ae",            label: "Tenant Passport",                 required: true  },
  { id: "tmpl-leasing-ae-eid-tenant",       market: "leasing",   businessUnit: "rebu", country: "ae",                 label: "Tenant EID",                      required: true  },
  { id: "tmpl-leasing-ae-ejari",            market: "leasing",   businessUnit: "rebu", country: "ae",               label: "Ejari",                           required: true  },
  { id: "tmpl-leasing-ae-aml-kyc",          market: "leasing",   businessUnit: "rebu", country: "ae",             label: "AML/KYC",                         required: true  },

  // ── Leasing — ES ──────────────────────────────────────────────────────────
  { id: "tmpl-leasing-es-tenancy-contract", market: "leasing",   businessUnit: "rebu", country: "es",    label: "Tenancy Contract",                required: true  },
  { id: "tmpl-leasing-es-passport-tenant",  market: "leasing",   businessUnit: "rebu", country: "es",            label: "Tenant Passport",                 required: true  },
  { id: "tmpl-leasing-es-eid-tenant",       market: "leasing",   businessUnit: "rebu", country: "es",                 label: "Tenant EID",                      required: true  },
  { id: "tmpl-leasing-es-aml-kyc",          market: "leasing",   businessUnit: "rebu", country: "es",             label: "AML/KYC",                         required: true  },

  // ── Leasing — SA ──────────────────────────────────────────────────────────
  { id: "tmpl-leasing-sa-tenancy-contract", market: "leasing",   businessUnit: "rebu", country: "sa",    label: "Tenancy Contract",                required: true  },
  { id: "tmpl-leasing-sa-passport-tenant",  market: "leasing",   businessUnit: "rebu", country: "sa",            label: "Tenant Passport",                 required: true  },
  { id: "tmpl-leasing-sa-eid-tenant",       market: "leasing",   businessUnit: "rebu", country: "sa",                 label: "Tenant EID",                      required: true  },
  { id: "tmpl-leasing-sa-aml-kyc",          market: "leasing",   businessUnit: "rebu", country: "sa",             label: "AML/KYC",                         required: true  },

  // ── MBU — AE (MA/Broker channel) ─────────────────────────────────────────
  { id: "tmpl-primary-mortgage-ae-fol",        market: "primary", businessUnit: "mortgage", country: "ae", label: "Final Offer Letter (FOL)", required: true  },
  { id: "tmpl-primary-mortgage-ae-title-deed", market: "primary", businessUnit: "mortgage", country: "ae", label: "Title Deed",               required: true  },
];
