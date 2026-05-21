import type { DealStakeholder } from "../entities";

// Canonical stakeholder relationships for each deal.
//
// ── REVENUE_SOURCE ────────────────────────────────────────
// One or more per deal. Each MUST have explicit financialAmount (no implicit fallback).
// financialAmount = the gross revenue that party pays to Huspy (positive).
// For simple deals: one payer receives the full grossRevenue.
// For split receivables: multiple payers split the grossRevenue per their invoice amounts.
//
// ── AGENT_PAYOUT ───────────────────────────────────────
// One or more agents per deal. splitPercentage reflects each agent's share of the commission pool.
// deal-006 and deal-017 have two-agent splits to exercise multi-agent commission logic.
// isPrimary marks the agent who owns the deal workflow.
//
// ── OPERATIONAL_DEDUCTION ─────────────────────────────────
// Fixed service costs (conveyances, notarial fees). financialAmount is negative (cost).
export const sharedDealStakeholders: DealStakeholder[] = [
  // deal-001 — buy, agent-001, client-001 | rebate 1.5% × 11 550 = 173 → net 11 377
  { id: "ds-deal-001-agent",  dealId: "deal-001", partyId: "party-agent-001", role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100, financialAmount: 4550.8 },
  { id: "ds-deal-001-client", dealId: "deal-001", partyId: "party-client-001",    role: "REVENUE_SOURCE", financialAmount: 11377 },

  // deal-002 — sell, agent-002, client-002 | subsidy 4 000 → net 14 000
  { id: "ds-deal-002-agent",  dealId: "deal-002", partyId: "party-agent-002", role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-002-client", dealId: "deal-002", partyId: "party-client-002",    role: "REVENUE_SOURCE", financialAmount: 14000 },

  // deal-003 — rent, agent-001, client-003
  { id: "ds-deal-003-agent",  dealId: "deal-003", partyId: "party-agent-001",   role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-003-client", dealId: "deal-003", partyId: "party-client-003",      role: "REVENUE_SOURCE", financialAmount: 1152 },

  // deal-004 — buy, agent-002, client-004 | subsidy 6 000 → net 19 000
  { id: "ds-deal-004-agent",  dealId: "deal-004", partyId: "party-agent-002", role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-004-client", dealId: "deal-004", partyId: "party-client-004",      role: "REVENUE_SOURCE", financialAmount: 19000 },

  // deal-005 — buy, agent-003, client-005 | rebate 2% × 13 500 = 270 → net 13 230
  { id: "ds-deal-005-agent",  dealId: "deal-005", partyId: "party-agent-003",      role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-005-client", dealId: "deal-005", partyId: "party-client-005",      role: "REVENUE_SOURCE", financialAmount: 13230 },

  // deal-006 — sell, felicia 70% / guilherme 30% co-listing split | subsidy 2 500 → net 7 100
  { id: "ds-deal-006-agent",    dealId: "deal-006", partyId: "party-agent-001",   role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 70 },
  { id: "ds-deal-006-agent-co", dealId: "deal-006", partyId: "party-agent-002", role: "AGENT_PAYOUT", splitPercentage: 30 },
  { id: "ds-deal-006-client",   dealId: "deal-006", partyId: "party-client-006",      role: "REVENUE_SOURCE", financialAmount: 7100 },

  // deal-007 — buy, agent-001, client-001 | subsidy 3 000 → net 8 875
  { id: "ds-deal-007-agent",  dealId: "deal-007", partyId: "party-agent-001",   role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-007-client", dealId: "deal-007", partyId: "party-client-001",      role: "REVENUE_SOURCE", financialAmount: 8875 },

  // deal-008 — sell, agent-002, client-002 + developer split | subsidy 5 000 → client net 3 700
  { id: "ds-deal-008-agent",    dealId: "deal-008", partyId: "party-agent-002",              role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-008-client",   dealId: "deal-008", partyId: "party-client-002",                   role: "REVENUE_SOURCE", financialAmount: 3700 },
  { id: "ds-deal-008-developer", dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte", role: "REVENUE_SOURCE", financialAmount: 5800 },

  // deal-009 — buy, agent-005, client-007
  { id: "ds-deal-009-agent",  dealId: "deal-009", partyId: "party-agent-005",      role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-009-client", dealId: "deal-009", partyId: "party-client-007",      role: "REVENUE_SOURCE", financialAmount: 37000 },

  // deal-010 — buy (canceled), agent-005, client-008
  { id: "ds-deal-010-agent",  dealId: "deal-010", partyId: "party-agent-005",      role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-010-client", dealId: "deal-010", partyId: "party-client-008",      role: "REVENUE_SOURCE", financialAmount: 84000 },

  // deal-011 — mortgage, agent-006, client-007
  { id: "ds-deal-011-agent",  dealId: "deal-011", partyId: "party-agent-006",    role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-011-client", dealId: "deal-011", partyId: "party-client-007",      role: "REVENUE_SOURCE", financialAmount: 7000 },

  // deal-012 — mortgage, agent-005, client-008
  { id: "ds-deal-012-agent",  dealId: "deal-012", partyId: "party-agent-005",      role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-012-client", dealId: "deal-012", partyId: "party-client-008",      role: "REVENUE_SOURCE", financialAmount: 16000 },

  // deal-013 — buy, agent-002, client-009 | subsidy 4 500 → net 14 100
  { id: "ds-deal-013-agent",  dealId: "deal-013", partyId: "party-agent-002",      role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-013-client", dealId: "deal-013", partyId: "party-client-009",      role: "REVENUE_SOURCE", financialAmount: 14100 },

  // deal-014 — mortgage, agent-001, bank revenue source
  { id: "ds-deal-014-agent",  dealId: "deal-014", partyId: "party-agent-001",   role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-014-bank",   dealId: "deal-014", partyId: "party-third-caixabank", role: "REVENUE_SOURCE", financialAmount: 2480 },

  // deal-015 — mortgage, agent-003, bank revenue source
  { id: "ds-deal-015-agent",  dealId: "deal-015", partyId: "party-agent-003",  role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-015-bank",   dealId: "deal-015", partyId: "party-third-snb",   role: "REVENUE_SOURCE", financialAmount: 4600 },

  // deal-016 — sell, agent-004, client-007 + developer split | rebate 1.5% × 42 000 = 630 → client net 24 570
  { id: "ds-deal-016-agent",     dealId: "deal-016", partyId: "party-agent-004",       role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100, financialAmount: 17375.4 },
  { id: "ds-deal-016-client",    dealId: "deal-016", partyId: "party-client-007",       role: "REVENUE_SOURCE", financialAmount: 24570 },
  { id: "ds-deal-016-developer", dealId: "deal-016", partyId: "party-third-emaar",      role: "REVENUE_SOURCE", financialAmount: 16800 },

  // deal-017 — buy, felicia 60% / omar 40% referral split | rebate 1.5% × 15 900 = 239 → net 15 661
  { id: "ds-deal-017-agent",    dealId: "deal-017", partyId: "party-agent-001", role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 60 },
  { id: "ds-deal-017-agent-co", dealId: "deal-017", partyId: "party-agent-003",    role: "AGENT_PAYOUT", splitPercentage: 40 },
  { id: "ds-deal-017-client",   dealId: "deal-017", partyId: "party-client-002",    role: "REVENUE_SOURCE", financialAmount: 15661 },

  // deal-018 — buy, agent-001, client-004 | subsidy 7 000 → net 24 250
  { id: "ds-deal-018-agent",  dealId: "deal-018", partyId: "party-agent-001",   role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100, financialAmount: 9700 },
  { id: "ds-deal-018-client", dealId: "deal-018", partyId: "party-client-004",      role: "REVENUE_SOURCE", financialAmount: 24250 },

  // deal-019 — buy (canceled), agent-001, client-003
  { id: "ds-deal-019-agent",  dealId: "deal-019", partyId: "party-agent-001",   role: "AGENT_PAYOUT",  isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-019-client", dealId: "deal-019", partyId: "party-client-003",      role: "REVENUE_SOURCE", financialAmount: 5200 },

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

  // deal-020 — primary, ae/AED, agent-004, developer-pay (Emaar AED 1.2M @ 2%)
  { id: "ds-deal-020-client",    dealId: "deal-020", partyId: "party-client-008",   role: "REVENUE_SOURCE" },
  { id: "ds-deal-020-developer", dealId: "deal-020", partyId: "party-third-emaar",  role: "REVENUE_SOURCE",  financialAmount: 24000 },
  { id: "ds-deal-020-agent",     dealId: "deal-020", partyId: "party-agent-004",    role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, financialAmount: 10080 },

  // deal-021 — primary buy, es/EUR, agent-002/Guilherme, referral Marta Sáez (salaried)
  // gross 14 400 − referral 600 (C) − conveyance 800 (D) = net 13 000
  // Guilherme 45%: 5 850 | TL Santiago 10%: 585 | Mgr Isabel 5%: 292.50
  { id: "ds-deal-021-client",   dealId: "deal-021", partyId: "party-client-003",          role: "REVENUE_SOURCE",        financialAmount: 14400 },
  { id: "ds-deal-021-agent",    dealId: "deal-021", partyId: "party-agent-002",            role: "AGENT_PAYOUT",       isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-021-referral", dealId: "deal-021", partyId: "party-agent-007",            role: "ACQUISITION_DEDUCTION", financialAmount: -600 },
  { id: "ds-deal-021-conv",     dealId: "deal-021", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },

  // ── DEMAND stakeholders (non-financial — buyer/tenant/borrower side) ────────
  // First DEMAND entry per deal is the canonical source for Deal.clientName.
  { id: "ds-deal-001-demand",  dealId: "deal-001", partyId: "party-client-001", role: "DEMAND" },
  { id: "ds-deal-002-demand",  dealId: "deal-002", partyId: "party-client-002", role: "DEMAND" },
  { id: "ds-deal-003-demand",  dealId: "deal-003", partyId: "party-client-003", role: "DEMAND" },
  { id: "ds-deal-004-demand",  dealId: "deal-004", partyId: "party-client-004", role: "DEMAND" },
  { id: "ds-deal-005-demand",  dealId: "deal-005", partyId: "party-client-005", role: "DEMAND" },
  { id: "ds-deal-006-demand",  dealId: "deal-006", partyId: "party-client-006", role: "DEMAND" },
  { id: "ds-deal-007-demand",  dealId: "deal-007", partyId: "party-client-001", role: "DEMAND" },
  { id: "ds-deal-008-demand",  dealId: "deal-008", partyId: "party-client-002", role: "DEMAND" },
  { id: "ds-deal-009-demand",  dealId: "deal-009", partyId: "party-client-007", role: "DEMAND" },
  { id: "ds-deal-010-demand",  dealId: "deal-010", partyId: "party-client-008", role: "DEMAND" },
  { id: "ds-deal-011-demand",  dealId: "deal-011", partyId: "party-client-007", role: "DEMAND" },
  { id: "ds-deal-012-demand",  dealId: "deal-012", partyId: "party-client-008", role: "DEMAND" },
  { id: "ds-deal-013-demand",  dealId: "deal-013", partyId: "party-client-009", role: "DEMAND" },
  { id: "ds-deal-014-demand",  dealId: "deal-014", partyId: "party-client-001", role: "DEMAND" },
  { id: "ds-deal-015-demand",  dealId: "deal-015", partyId: "party-client-003", role: "DEMAND" },
  { id: "ds-deal-016-demand",  dealId: "deal-016", partyId: "party-client-007", role: "DEMAND" },
  { id: "ds-deal-017-demand",  dealId: "deal-017", partyId: "party-client-002", role: "DEMAND" },
  { id: "ds-deal-018-demand",  dealId: "deal-018", partyId: "party-client-004", role: "DEMAND" },
  { id: "ds-deal-019-demand",  dealId: "deal-019", partyId: "party-client-003", role: "DEMAND" },
  { id: "ds-deal-020-demand",  dealId: "deal-020", partyId: "party-client-008", role: "DEMAND" },
  { id: "ds-deal-021-demand",  dealId: "deal-021", partyId: "party-client-003", role: "DEMAND" },

  // ── SUPPLY stakeholders (non-financial — seller/developer/lender side) ──────
  // REBU primary → developer;  REBU secondary/leasing → individual seller/landlord;  MBU → bank.
  { id: "ds-deal-001-supply",  dealId: "deal-001", partyId: "party-dev-neinor",                       role: "SUPPLY" },
  { id: "ds-deal-002-supply",  dealId: "deal-002", partyId: "party-seller-002",                       role: "SUPPLY" },
  { id: "ds-deal-003-supply",  dealId: "deal-003", partyId: "party-seller-003",                       role: "SUPPLY" },
  { id: "ds-deal-004-supply",  dealId: "deal-004", partyId: "party-seller-004",                       role: "SUPPLY" },
  { id: "ds-deal-005-supply",  dealId: "deal-005", partyId: "party-dev-dar-al-arkan",                 role: "SUPPLY" },
  { id: "ds-deal-006-supply",  dealId: "deal-006", partyId: "party-seller-006",                       role: "SUPPLY" },
  { id: "ds-deal-007-supply",  dealId: "deal-007", partyId: "party-seller-007",                       role: "SUPPLY" },
  { id: "ds-deal-008-supply",  dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte",   role: "SUPPLY" },
  { id: "ds-deal-009-supply",  dealId: "deal-009", partyId: "party-third-emaar",                      role: "SUPPLY" },
  { id: "ds-deal-010-supply",  dealId: "deal-010", partyId: "party-seller-010",                       role: "SUPPLY" },
  { id: "ds-deal-011-supply",  dealId: "deal-011", partyId: "party-third-fab",                        role: "SUPPLY" },
  { id: "ds-deal-012-supply",  dealId: "deal-012", partyId: "party-third-fab",                        role: "SUPPLY" },
  { id: "ds-deal-013-supply",  dealId: "deal-013", partyId: "party-seller-013",                       role: "SUPPLY" },
  { id: "ds-deal-014-supply",  dealId: "deal-014", partyId: "party-third-caixabank",                  role: "SUPPLY" },
  { id: "ds-deal-015-supply",  dealId: "deal-015", partyId: "party-third-snb",                        role: "SUPPLY" },
  { id: "ds-deal-016-supply",  dealId: "deal-016", partyId: "party-third-emaar",                      role: "SUPPLY" },
  { id: "ds-deal-017-supply",  dealId: "deal-017", partyId: "party-dev-neinor",                       role: "SUPPLY" },
  { id: "ds-deal-018-supply",  dealId: "deal-018", partyId: "party-seller-018",                       role: "SUPPLY" },
  { id: "ds-deal-019-supply",  dealId: "deal-019", partyId: "party-seller-019",                       role: "SUPPLY" },
  { id: "ds-deal-020-supply",  dealId: "deal-020", partyId: "party-third-emaar",                      role: "SUPPLY" },
  { id: "ds-deal-021-supply",  dealId: "deal-021", partyId: "party-dev-neinor",                       role: "SUPPLY" },
];
