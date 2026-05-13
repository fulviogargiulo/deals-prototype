import type { DealStakeholder } from "../entities";

// One or more INTERNAL_PAYOUT (agent) stakeholders + one REVENUE_SOURCE (client) per deal.
// OPERATIONAL_DEDUCTION entries carry a negative financialAmount for fixed service costs.
// splitPercentage on INTERNAL_PAYOUT records reflects each agent's share of the commission pool.
// deal-006 and deal-017 have two-agent splits to exercise multi-agent commission logic.
// isPrimary marks the agent who owns the deal workflow.
export const sharedDealStakeholders: DealStakeholder[] = [
  // deal-001 — buy, agent-felicia, client-001
  { id: "ds-deal-001-agent",  dealId: "deal-001", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-001-client", dealId: "deal-001", partyId: "party-client-001",      role: "REVENUE_SOURCE" },

  // deal-002 — sell, agent-guilherme, client-002
  { id: "ds-deal-002-agent",  dealId: "deal-002", partyId: "party-agent-guilherme", role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-002-client", dealId: "deal-002", partyId: "party-client-002",      role: "REVENUE_SOURCE" },

  // deal-003 — rent, agent-felicia, client-003
  { id: "ds-deal-003-agent",  dealId: "deal-003", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-003-client", dealId: "deal-003", partyId: "party-client-003",      role: "REVENUE_SOURCE" },

  // deal-004 — buy, agent-guilherme, client-004
  { id: "ds-deal-004-agent",  dealId: "deal-004", partyId: "party-agent-guilherme", role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-004-client", dealId: "deal-004", partyId: "party-client-004",      role: "REVENUE_SOURCE" },

  // deal-005 — buy, agent-omar, client-005
  { id: "ds-deal-005-agent",  dealId: "deal-005", partyId: "party-agent-omar",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-005-client", dealId: "deal-005", partyId: "party-client-005",      role: "REVENUE_SOURCE" },

  // deal-006 — sell, felicia 70% / guilherme 30% co-listing split
  { id: "ds-deal-006-agent",    dealId: "deal-006", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT", isPrimary: true, splitPercentage: 70 },
  { id: "ds-deal-006-agent-co", dealId: "deal-006", partyId: "party-agent-guilherme", role: "INTERNAL_PAYOUT", splitPercentage: 30 },
  { id: "ds-deal-006-client",   dealId: "deal-006", partyId: "party-client-006",      role: "REVENUE_SOURCE" },

  // deal-007 — buy, agent-felicia, client-001
  { id: "ds-deal-007-agent",  dealId: "deal-007", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-007-client", dealId: "deal-007", partyId: "party-client-001",      role: "REVENUE_SOURCE" },

  // deal-008 — sell, agent-guilherme, client-002
  { id: "ds-deal-008-agent",  dealId: "deal-008", partyId: "party-agent-guilherme", role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-008-client", dealId: "deal-008", partyId: "party-client-002",      role: "REVENUE_SOURCE" },

  // deal-009 — buy, agent-omar, client-007
  { id: "ds-deal-009-agent",  dealId: "deal-009", partyId: "party-agent-omar",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-009-client", dealId: "deal-009", partyId: "party-client-007",      role: "REVENUE_SOURCE" },

  // deal-010 — buy (canceled), agent-ravi, client-008
  { id: "ds-deal-010-agent",  dealId: "deal-010", partyId: "party-agent-ravi",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-010-client", dealId: "deal-010", partyId: "party-client-008",      role: "REVENUE_SOURCE" },

  // deal-011 — mortgage, agent-zainab, client-007
  { id: "ds-deal-011-agent",  dealId: "deal-011", partyId: "party-agent-zainab",    role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-011-client", dealId: "deal-011", partyId: "party-client-007",      role: "REVENUE_SOURCE" },

  // deal-012 — mortgage, agent-ravi, client-008
  { id: "ds-deal-012-agent",  dealId: "deal-012", partyId: "party-agent-ravi",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-012-client", dealId: "deal-012", partyId: "party-client-008",      role: "REVENUE_SOURCE" },

  // deal-013 — buy, agent-gelo, client-009
  { id: "ds-deal-013-agent",  dealId: "deal-013", partyId: "party-agent-gelo",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-013-client", dealId: "deal-013", partyId: "party-client-009",      role: "REVENUE_SOURCE" },

  // deal-014 — mortgage, agent-felicia, client-009
  { id: "ds-deal-014-agent",  dealId: "deal-014", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-014-client", dealId: "deal-014", partyId: "party-client-009",      role: "REVENUE_SOURCE" },

  // deal-015 — mortgage, agent-omar, client-010
  { id: "ds-deal-015-agent",  dealId: "deal-015", partyId: "party-agent-omar",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-015-client", dealId: "deal-015", partyId: "party-client-010",      role: "REVENUE_SOURCE" },

  // deal-016 — sell, agent-ravi, client-007
  { id: "ds-deal-016-agent",  dealId: "deal-016", partyId: "party-agent-ravi",      role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-016-client", dealId: "deal-016", partyId: "party-client-007",      role: "REVENUE_SOURCE" },

  // deal-017 — buy, felicia 60% / omar 40% referral split
  { id: "ds-deal-017-agent",    dealId: "deal-017", partyId: "party-agent-felicia", role: "INTERNAL_PAYOUT", isPrimary: true, splitPercentage: 60 },
  { id: "ds-deal-017-agent-co", dealId: "deal-017", partyId: "party-agent-omar",    role: "INTERNAL_PAYOUT", splitPercentage: 40 },
  { id: "ds-deal-017-client",   dealId: "deal-017", partyId: "party-client-002",    role: "REVENUE_SOURCE" },

  // deal-018 — buy, agent-felicia, client-004
  { id: "ds-deal-018-agent",  dealId: "deal-018", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-018-client", dealId: "deal-018", partyId: "party-client-004",      role: "REVENUE_SOURCE" },

  // deal-019 — buy (canceled), agent-felicia, client-003
  { id: "ds-deal-019-agent",  dealId: "deal-019", partyId: "party-agent-felicia",   role: "INTERNAL_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-019-client", dealId: "deal-019", partyId: "party-client-003",      role: "REVENUE_SOURCE" },

  // ── OPERATIONAL_DEDUCTION stakeholders (fixed service costs) ───────────────
  // Spain (ES) deals → Gestoría López & Asociados
  { id: "ds-deal-001-conv", dealId: "deal-001", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-002-conv", dealId: "deal-002", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-003-conv", dealId: "deal-003", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -400 },
  { id: "ds-deal-004-conv", dealId: "deal-004", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -1200 },
  { id: "ds-deal-006-conv", dealId: "deal-006", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-007-conv", dealId: "deal-007", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-008-conv", dealId: "deal-008", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-013-conv", dealId: "deal-013", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-017-conv", dealId: "deal-017", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-018-conv", dealId: "deal-018", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -1200 },
  { id: "ds-deal-019-conv", dealId: "deal-019", partyId: "party-conv-gestoria-lopez",   role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  // KSA (SA) deals → Al Rajhi Notarial
  { id: "ds-deal-005-conv", dealId: "deal-005", partyId: "party-conv-alrajhi-notarial", role: "OPERATIONAL_DEDUCTION", financialAmount: -2000 },
  // UAE (AE) deals → TAMM Legal Services
  { id: "ds-deal-009-conv", dealId: "deal-009", partyId: "party-conv-tamm-legal",       role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
  { id: "ds-deal-010-conv", dealId: "deal-010", partyId: "party-conv-tamm-legal",       role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
  { id: "ds-deal-016-conv", dealId: "deal-016", partyId: "party-conv-tamm-legal",       role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
];
