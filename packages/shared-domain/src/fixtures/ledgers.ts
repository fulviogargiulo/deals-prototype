import type { Ledger } from "../entities";

export const sharedLedgers: Ledger[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // EUR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 1,  name: "ASSET_BANK_BankX_EUR",       description: "BankX Operating Account (EUR)",     type: "asset",     currency: "EUR" },
  { id: 2,  name: "ASSET_AR_EUR",               description: "Client AR (EUR)",                   type: "asset",     currency: "EUR" },
  { id: 3,  name: "LIAB_AGENT_EUR",              description: "Agent Liability GL (EUR)",          type: "liability", currency: "EUR", isControlAccount: true },
  { id: 4,  name: "LIAB_PAYABLE_EUR",           description: "External Partner Payable (EUR)",    type: "liability", currency: "EUR" },
  { id: 5,  name: "LIAB_VAT_EUR",                description: "VAT Liability (EUR)",               type: "liability", currency: "EUR" },
  { id: 6,  name: "REV_EUR",                    description: "Revenue (EUR)",                     type: "revenue",   currency: "EUR" },
  { id: 7,  name: "EXP_COMMISSION_EUR",         description: "Commission Expense (EUR)",          type: "expense",   currency: "EUR" },
  { id: 28, name: "LIAB_WITHHOLDING_TAX_EUR",   description: "Withholding Tax Payable (EUR)",      type: "liability", currency: "EUR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // AED
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 8,  name: "ASSET_BANK_BankX_AED",       description: "BankX Operating Account (AED)",     type: "asset",     currency: "AED" },
  { id: 9,  name: "ASSET_AR_AED",               description: "Client AR (AED)",                   type: "asset",     currency: "AED" },
  { id: 10, name: "LIAB_AGENT_AED",              description: "Agent Liability GL (AED)",          type: "liability", currency: "AED", isControlAccount: true },
  { id: 11, name: "LIAB_PAYABLE_AED",           description: "External Partner Payable (AED)",    type: "liability", currency: "AED" },
  { id: 12, name: "LIAB_VAT_AED",                description: "VAT Liability (AED)",               type: "liability", currency: "AED" },
  { id: 13, name: "REV_AED",                    description: "Revenue (AED)",                     type: "revenue",   currency: "AED" },
  { id: 14, name: "EXP_COMMISSION_AED",         description: "Commission Expense (AED)",          type: "expense",   currency: "AED" },
  { id: 29, name: "LIAB_WITHHOLDING_TAX_AED",   description: "Withholding Tax Payable (AED)",      type: "liability", currency: "AED" },

  // ══════════════════════════════════════════════════════════════════════════════
  // SAR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 15, name: "ASSET_BANK_BankX_SAR",       description: "BankX Operating Account (SAR)",     type: "asset",     currency: "SAR" },
  { id: 16, name: "ASSET_AR_SAR",               description: "Client AR (SAR)",                   type: "asset",     currency: "SAR" },
  { id: 17, name: "LIAB_AGENT_SAR",              description: "Agent Liability GL (SAR)",          type: "liability", currency: "SAR", isControlAccount: true },
  { id: 18, name: "LIAB_PAYABLE_SAR",           description: "External Partner Payable (SAR)",    type: "liability", currency: "SAR" },
  { id: 19, name: "LIAB_VAT_SAR",                description: "VAT Liability (SAR)",               type: "liability", currency: "SAR" },
  { id: 20, name: "REV_SAR",                    description: "Revenue (SAR)",                     type: "revenue",   currency: "SAR" },
  { id: 21, name: "EXP_COMMISSION_SAR",         description: "Commission Expense (SAR)",          type: "expense",   currency: "SAR" },
  { id: 30, name: "LIAB_WITHHOLDING_TAX_SAR",   description: "Withholding Tax Payable (SAR)",      type: "liability", currency: "SAR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — EUR (Madrid)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 22,
    name: "AgentLiability_agent-001",
    description: "Agent Liability — Felicia Canovas",
    type: "liability",
    glId: 3,
    partyId: "party-agent-001",
    currency: "EUR",
  },
  {
    id: 23,
    name: "AgentLiability_agent-002",
    description: "Agent Liability — Guilherme Castro",
    type: "liability",
    glId: 3,
    partyId: "party-agent-002",
    currency: "EUR",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — AED (Dubai)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 24,
    name: "AgentLiability_agent-004",
    description: "Agent Liability — Gelo Huspy",
    type: "liability",
    glId: 10,
    partyId: "party-agent-004",
    currency: "AED",
  },
  {
    id: 25,
    name: "AgentLiability_agent-005",
    description: "Agent Liability — Ravi Nair",
    type: "liability",
    glId: 10,
    partyId: "party-agent-005",
    currency: "AED",
  },
  {
    id: 26,
    name: "AgentLiability_agent-006",
    description: "Agent Liability — Zainab Al-Qadi",
    type: "liability",
    glId: 10,
    partyId: "party-agent-006",
    currency: "AED",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — SAR (Riyadh)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 27,
    name: "AgentLiability_agent-003",
    description: "Agent Liability — Omar Al Saleem",
    type: "liability",
    glId: 17,
    partyId: "party-agent-003",
    currency: "SAR",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Connected agent subledgers — EUR (Madrid)
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 31, name: "AgentLiability_ca-santiago-eur", description: "Agent Liability — Santiago Vega (EUR)", type: "liability", glId: 3,  partyId: "party-ca-santiago-eur", currency: "EUR" },
  { id: 32, name: "AgentLiability_ca-isabel-eur",   description: "Agent Liability — Isabel Torres (EUR)", type: "liability", glId: 3,  partyId: "party-ca-isabel-eur",   currency: "EUR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Connected agent subledgers — AED (Dubai)
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 33, name: "AgentLiability_ca-santiago-aed", description: "Agent Liability — Santiago Vega (AED)", type: "liability", glId: 10, partyId: "party-ca-santiago-aed", currency: "AED" },
  { id: 34, name: "AgentLiability_ca-isabel-aed",   description: "Agent Liability — Isabel Torres (AED)", type: "liability", glId: 10, partyId: "party-ca-isabel-aed",   currency: "AED" },
  { id: 35, name: "AgentLiability_ca-leila-aed",    description: "Agent Liability — Leila Ahmadi (AED)",  type: "liability", glId: 10, partyId: "party-ca-leila-aed",    currency: "AED" },
  { id: 36, name: "AgentLiability_ca-karim-aed",    description: "Agent Liability — Karim Mourad (AED)", type: "liability", glId: 10, partyId: "party-ca-karim-aed",    currency: "AED" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Connected agent subledgers — SAR (Riyadh)
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 37, name: "AgentLiability_ca-majid-sar",    description: "Agent Liability — Majid Al Harbi (SAR)", type: "liability", glId: 17, partyId: "party-ca-majid-sar",    currency: "SAR" },
  { id: 38, name: "AgentLiability_ca-karim-sar",    description: "Agent Liability — Karim Mourad (SAR)",  type: "liability", glId: 17, partyId: "party-ca-karim-sar",    currency: "SAR" },
];
