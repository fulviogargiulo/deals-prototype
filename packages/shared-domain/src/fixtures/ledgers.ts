import type { Ledger } from "../entities";

export const sharedLedgers: Ledger[] = [
  // === Assets ===
  { id: "Receivables_Buyer",     code: "Receivables_Buyer",     name: "Receivables — Buyer",            type: "asset" },
  { id: "Receivables_Seller",    code: "Receivables_Seller",    name: "Receivables — Seller",           type: "asset" },
  { id: "Receivables_Developer", code: "Receivables_Developer", name: "Receivables — Developer",        type: "asset" },
  { id: "Receivables_Bank",      code: "Receivables_Bank",      name: "Receivables — Bank (Mortgage)",  type: "asset" },
  { id: "Bank_Operating",        code: "Bank_Operating",        name: "Operating Bank Account",         type: "asset" },

  // === Revenue ===
  { id: "Revenue_Commission_REBU", code: "Revenue_Commission_REBU", name: "Commission Revenue — REBU",   type: "revenue" },
  { id: "Revenue_Commission_MBU",  code: "Revenue_Commission_MBU",  name: "Commission Revenue — MBU",   type: "revenue" },
  { id: "Revenue_PlatformFees",    code: "Revenue_PlatformFees",    name: "Platform & Support Fees",    type: "revenue" },

  // === Liabilities — GL + per-agent subledgers ===
  { id: "AgentLiability", code: "AgentLiability", name: "Agent Liability (GL)", type: "liability" },
  {
    id: "AgentLiability_agent-felicia",
    code: "AgentLiability_agent-felicia",
    name: "Agent Liability — Felicia Canovas",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-felicia",
  },
  {
    id: "AgentLiability_agent-guilherme",
    code: "AgentLiability_agent-guilherme",
    name: "Agent Liability — Guilherme Castro",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-guilherme",
  },
  {
    id: "AgentLiability_agent-omar",
    code: "AgentLiability_agent-omar",
    name: "Agent Liability — Omar Al Saleem",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-omar",
  },
  {
    id: "AgentLiability_agent-gelo",
    code: "AgentLiability_agent-gelo",
    name: "Agent Liability — Gelo Huspy",
    type: "liability",
    glId: "AgentLiability",
    partyId: "party-agent-gelo",
  },
];
