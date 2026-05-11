import type { Ledger } from "../entities";

export const sharedLedgers: Ledger[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // Legacy GL ledgers — no currency, kept for backward-compat with existing
  // PostingLine fixture records that reference these IDs.
  // New postings should reference the currency-specific variants below.
  // ══════════════════════════════════════════════════════════════════════════════
  { id: "Receivables_Buyer",       code: "Receivables_Buyer",       name: "Receivables — Buyer",            type: "asset" },
  { id: "Receivables_Seller",      code: "Receivables_Seller",      name: "Receivables — Seller",           type: "asset" },
  { id: "Receivables_Developer",   code: "Receivables_Developer",   name: "Receivables — Developer",        type: "asset" },
  { id: "Receivables_Bank",        code: "Receivables_Bank",        name: "Receivables — Bank (Mortgage)",  type: "asset" },
  { id: "Bank_Operating",          code: "Bank_Operating",          name: "Operating Bank Account",         type: "asset" },
  { id: "Revenue_Commission_REBU", code: "Revenue_Commission_REBU", name: "Commission Revenue — REBU",      type: "revenue" },
  { id: "Revenue_Commission_MBU",  code: "Revenue_Commission_MBU",  name: "Commission Revenue — MBU",       type: "revenue" },
  { id: "Revenue_PlatformFees",    code: "Revenue_PlatformFees",    name: "Platform & Support Fees",        type: "revenue" },
  { id: "AgentLiability",          code: "AgentLiability",          name: "Agent Liability (GL)",           type: "liability" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Currency-specific GL ledgers — EUR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: "Bank_Operating_EUR",          code: "Bank_Operating_EUR",          name: "Operating Bank Account (EUR)",       type: "asset",     currency: "EUR" },
  { id: "Receivables_Buyer_EUR",       code: "Receivables_Buyer_EUR",       name: "Receivables — Buyer (EUR)",          type: "asset",     currency: "EUR" },
  { id: "Receivables_Seller_EUR",      code: "Receivables_Seller_EUR",      name: "Receivables — Seller (EUR)",         type: "asset",     currency: "EUR" },
  { id: "Receivables_Developer_EUR",   code: "Receivables_Developer_EUR",   name: "Receivables — Developer (EUR)",      type: "asset",     currency: "EUR" },
  { id: "Receivables_Bank_EUR",        code: "Receivables_Bank_EUR",        name: "Receivables — Bank/Mortgage (EUR)",  type: "asset",     currency: "EUR" },
  { id: "Revenue_Commission_REBU_EUR", code: "Revenue_Commission_REBU_EUR", name: "Commission Revenue — REBU (EUR)",    type: "revenue",   currency: "EUR" },
  { id: "Revenue_Commission_MBU_EUR",  code: "Revenue_Commission_MBU_EUR",  name: "Commission Revenue — MBU (EUR)",     type: "revenue",   currency: "EUR" },
  { id: "Revenue_PlatformFees_EUR",    code: "Revenue_PlatformFees_EUR",    name: "Platform & Support Fees (EUR)",      type: "revenue",   currency: "EUR" },
  { id: "AgentLiability_EUR",          code: "AgentLiability_EUR",          name: "Agent Liability GL (EUR)",           type: "liability", currency: "EUR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Currency-specific GL ledgers — AED
  // ══════════════════════════════════════════════════════════════════════════════
  { id: "Bank_Operating_AED",          code: "Bank_Operating_AED",          name: "Operating Bank Account (AED)",       type: "asset",     currency: "AED" },
  { id: "Receivables_Buyer_AED",       code: "Receivables_Buyer_AED",       name: "Receivables — Buyer (AED)",          type: "asset",     currency: "AED" },
  { id: "Receivables_Seller_AED",      code: "Receivables_Seller_AED",      name: "Receivables — Seller (AED)",         type: "asset",     currency: "AED" },
  { id: "Receivables_Developer_AED",   code: "Receivables_Developer_AED",   name: "Receivables — Developer (AED)",      type: "asset",     currency: "AED" },
  { id: "Receivables_Bank_AED",        code: "Receivables_Bank_AED",        name: "Receivables — Bank/Mortgage (AED)",  type: "asset",     currency: "AED" },
  { id: "Revenue_Commission_REBU_AED", code: "Revenue_Commission_REBU_AED", name: "Commission Revenue — REBU (AED)",    type: "revenue",   currency: "AED" },
  { id: "Revenue_Commission_MBU_AED",  code: "Revenue_Commission_MBU_AED",  name: "Commission Revenue — MBU (AED)",     type: "revenue",   currency: "AED" },
  { id: "Revenue_PlatformFees_AED",    code: "Revenue_PlatformFees_AED",    name: "Platform & Support Fees (AED)",      type: "revenue",   currency: "AED" },
  { id: "AgentLiability_AED",          code: "AgentLiability_AED",          name: "Agent Liability GL (AED)",           type: "liability", currency: "AED" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Currency-specific GL ledgers — SAR
  // ══════════════════════════════════════════════════════════════════════════════
  { id: "Bank_Operating_SAR",          code: "Bank_Operating_SAR",          name: "Operating Bank Account (SAR)",       type: "asset",     currency: "SAR" },
  { id: "Receivables_Buyer_SAR",       code: "Receivables_Buyer_SAR",       name: "Receivables — Buyer (SAR)",          type: "asset",     currency: "SAR" },
  { id: "Receivables_Seller_SAR",      code: "Receivables_Seller_SAR",      name: "Receivables — Seller (SAR)",         type: "asset",     currency: "SAR" },
  { id: "Revenue_Commission_REBU_SAR", code: "Revenue_Commission_REBU_SAR", name: "Commission Revenue — REBU (SAR)",    type: "revenue",   currency: "SAR" },
  { id: "Revenue_Commission_MBU_SAR",  code: "Revenue_Commission_MBU_SAR",  name: "Commission Revenue — MBU (SAR)",     type: "revenue",   currency: "SAR" },
  { id: "Revenue_PlatformFees_SAR",    code: "Revenue_PlatformFees_SAR",    name: "Platform & Support Fees (SAR)",      type: "revenue",   currency: "SAR" },
  { id: "AgentLiability_SAR",          code: "AgentLiability_SAR",          name: "Agent Liability GL (SAR)",           type: "liability", currency: "SAR" },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — EUR (Madrid)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: "AgentLiability_agent-felicia",
    code: "AgentLiability_agent-felicia",
    name: "Agent Liability — Felicia Canovas",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-felicia",
    currency: "EUR",
  },
  {
    id: "AgentLiability_agent-guilherme",
    code: "AgentLiability_agent-guilherme",
    name: "Agent Liability — Guilherme Castro",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-guilherme",
    currency: "EUR",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — AED (Dubai + Gelo)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: "AgentLiability_agent-gelo",
    code: "AgentLiability_agent-gelo",
    name: "Agent Liability — Gelo Huspy",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-gelo",
    currency: "AED",
  },
  {
    id: "AgentLiability_agent-ravi",
    code: "AgentLiability_agent-ravi",
    name: "Agent Liability — Ravi Nair",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-ravi",
    currency: "AED",
  },
  {
    id: "AgentLiability_agent-zainab",
    code: "AgentLiability_agent-zainab",
    name: "Agent Liability — Zainab Al-Qadi",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-zainab",
    currency: "AED",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // Agent subledgers — SAR (Riyadh)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    id: "AgentLiability_agent-omar",
    code: "AgentLiability_agent-omar",
    name: "Agent Liability — Omar Al Saleem",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-omar",
    currency: "SAR",
  },
];
