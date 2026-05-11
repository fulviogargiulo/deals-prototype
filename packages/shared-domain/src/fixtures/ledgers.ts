import type { Ledger } from "../entities";

export const sharedLedgers: Ledger[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // EUR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 1,  name: "ASSET_BANK_BankX_EUR",       description: "BankX Operating Account (EUR)",     type: "asset",     currency: "EUR" },
  { id: 2,  name: "ASSET_AR_EUR",               description: "Client AR (EUR)",                   type: "asset",     currency: "EUR" },
  { id: 3,  name: "LIAB_AGENT_PAYABLE_EUR",     description: "Agent Payable GL (EUR)",            type: "liability", currency: "EUR" },
  { id: 4,  name: "LIAB_EXTERNAL_PAYABLE_EUR",  description: "External Partner Payable (EUR)",    type: "liability", currency: "EUR" },
  { id: 5,  name: "LIAB_STATUTORY_TAX_EUR",     description: "Statutory Tax Withheld (EUR)",      type: "liability", currency: "EUR" },
  { id: 6,  name: "REV_EUR",                    description: "Revenue (EUR)",                     type: "revenue",   currency: "EUR" },
  { id: 7,  name: "EXP_COMMISSION_EUR",         description: "Commission Expense (EUR)",          type: "expense",   currency: "EUR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // AED
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 8,  name: "ASSET_BANK_BankX_AED",       description: "BankX Operating Account (AED)",     type: "asset",     currency: "AED" },
  { id: 9,  name: "ASSET_AR_AED",               description: "Client AR (AED)",                   type: "asset",     currency: "AED" },
  { id: 10, name: "LIAB_AGENT_PAYABLE_AED",     description: "Agent Payable GL (AED)",            type: "liability", currency: "AED" },
  { id: 11, name: "LIAB_EXTERNAL_PAYABLE_AED",  description: "External Partner Payable (AED)",    type: "liability", currency: "AED" },
  { id: 12, name: "LIAB_STATUTORY_TAX_AED",     description: "Statutory Tax Withheld (AED)",      type: "liability", currency: "AED" },
  { id: 13, name: "REV_AED",                    description: "Revenue (AED)",                     type: "revenue",   currency: "AED" },
  { id: 14, name: "EXP_COMMISSION_AED",         description: "Commission Expense (AED)",          type: "expense",   currency: "AED" },

  // ══════════════════════════════════════════════════════════════════════════════
  // SAR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: 15, name: "ASSET_BANK_BankX_SAR",       description: "BankX Operating Account (SAR)",     type: "asset",     currency: "SAR" },
  { id: 16, name: "ASSET_AR_SAR",               description: "Client AR (SAR)",                   type: "asset",     currency: "SAR" },
  { id: 17, name: "LIAB_AGENT_PAYABLE_SAR",     description: "Agent Payable GL (SAR)",            type: "liability", currency: "SAR" },
  { id: 18, name: "LIAB_EXTERNAL_PAYABLE_SAR",  description: "External Partner Payable (SAR)",    type: "liability", currency: "SAR" },
  { id: 19, name: "LIAB_STATUTORY_TAX_SAR",     description: "Statutory Tax Withheld (SAR)",      type: "liability", currency: "SAR" },
  { id: 20, name: "REV_SAR",                    description: "Revenue (SAR)",                     type: "revenue",   currency: "SAR" },
  { id: 21, name: "EXP_COMMISSION_SAR",         description: "Commission Expense (SAR)",          type: "expense",   currency: "SAR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — EUR (Madrid)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 22,
    name: "AgentLiability_agent-felicia",
    description: "Agent Liability — Felicia Canovas",
    type: "liability",
    glId: 3,
    partyId: "party-agent-felicia",
    currency: "EUR",
  },
  {
    id: 23,
    name: "AgentLiability_agent-guilherme",
    description: "Agent Liability — Guilherme Castro",
    type: "liability",
    glId: 3,
    partyId: "party-agent-guilherme",
    currency: "EUR",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — AED (Dubai)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 24,
    name: "AgentLiability_agent-gelo",
    description: "Agent Liability — Gelo Huspy",
    type: "liability",
    glId: 10,
    partyId: "party-agent-gelo",
    currency: "AED",
  },
  {
    id: 25,
    name: "AgentLiability_agent-ravi",
    description: "Agent Liability — Ravi Nair",
    type: "liability",
    glId: 10,
    partyId: "party-agent-ravi",
    currency: "AED",
  },
  {
    id: 26,
    name: "AgentLiability_agent-zainab",
    description: "Agent Liability — Zainab Al-Qadi",
    type: "liability",
    glId: 10,
    partyId: "party-agent-zainab",
    currency: "AED",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — SAR (Riyadh)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: 27,
    name: "AgentLiability_agent-omar",
    description: "Agent Liability — Omar Al Saleem",
    type: "liability",
    glId: 17,
    partyId: "party-agent-omar",
    currency: "SAR",
  },
];
