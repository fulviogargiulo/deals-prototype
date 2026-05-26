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

  // ── deal-001 — buy, agent-001, client-001 | rebate 1.5% × 11 550 = 173 → net 11 377
  { id: "ds-deal-001-client", dealId: "deal-001", partyId: "party-client-001",           role: "REVENUE_SOURCE",        financialAmount: 11377 },
  { id: "ds-deal-001-agent",  dealId: "deal-001", partyId: "party-agent-001",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-001-conv",   dealId: "deal-001", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-001-demand", dealId: "deal-001", partyId: "party-client-001",           role: "DEMAND" },
  { id: "ds-deal-001-supply", dealId: "deal-001", partyId: "party-dev-neinor",           role: "SUPPLY" },

  // ── deal-002 — sell, agent-002, client-002 | subsidy 4 000 → net 14 000
  { id: "ds-deal-002-client", dealId: "deal-002", partyId: "party-client-002",           role: "REVENUE_SOURCE",        financialAmount: 14000 },
  { id: "ds-deal-002-agent",  dealId: "deal-002", partyId: "party-agent-002",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-002-conv",   dealId: "deal-002", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-002-demand", dealId: "deal-002", partyId: "party-client-002",           role: "DEMAND" },
  { id: "ds-deal-002-supply", dealId: "deal-002", partyId: "party-seller-002",           role: "SUPPLY" },

  // ── deal-003 — rent, agent-001, client-003
  { id: "ds-deal-003-client", dealId: "deal-003", partyId: "party-client-003",           role: "REVENUE_SOURCE",        financialAmount: 1152 },
  { id: "ds-deal-003-agent",  dealId: "deal-003", partyId: "party-agent-001",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-003-conv",   dealId: "deal-003", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -400 },
  { id: "ds-deal-003-demand", dealId: "deal-003", partyId: "party-client-003",           role: "DEMAND" },
  { id: "ds-deal-003-supply", dealId: "deal-003", partyId: "party-seller-003",           role: "SUPPLY" },

  // ── deal-004 — buy, agent-002, client-004 | subsidy 6 000 → net 19 000
  { id: "ds-deal-004-client", dealId: "deal-004", partyId: "party-client-004",           role: "REVENUE_SOURCE",        financialAmount: 19000 },
  { id: "ds-deal-004-agent",  dealId: "deal-004", partyId: "party-agent-002",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-004-conv",   dealId: "deal-004", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -1200 },
  { id: "ds-deal-004-demand", dealId: "deal-004", partyId: "party-client-004",           role: "DEMAND" },
  { id: "ds-deal-004-supply", dealId: "deal-004", partyId: "party-seller-004",           role: "SUPPLY" },

  // ── deal-005 — buy, agent-003, client-005 | rebate 2% × 13 500 = 270 → net 13 230
  { id: "ds-deal-005-client", dealId: "deal-005", partyId: "party-client-005",           role: "REVENUE_SOURCE",        financialAmount: 13230 },
  { id: "ds-deal-005-agent",  dealId: "deal-005", partyId: "party-agent-003",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-005-conv",   dealId: "deal-005", partyId: "party-conv-alrajhi-notarial", role: "OPERATIONAL_DEDUCTION", financialAmount: -2000 },
  { id: "ds-deal-005-demand", dealId: "deal-005", partyId: "party-client-005",           role: "DEMAND" },
  { id: "ds-deal-005-supply", dealId: "deal-005", partyId: "party-dev-dar-al-arkan",     role: "SUPPLY" },

  // ── deal-006 — sell, felicia 70% / guilherme 30% co-listing | subsidy 2 500 → net 7 100
  { id: "ds-deal-006-client",   dealId: "deal-006", partyId: "party-client-006",           role: "REVENUE_SOURCE",        financialAmount: 7100 },
  { id: "ds-deal-006-agent",    dealId: "deal-006", partyId: "party-agent-001",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 70 },
  { id: "ds-deal-006-agent-co", dealId: "deal-006", partyId: "party-agent-002",            role: "AGENT_PAYOUT",          splitPercentage: 30 },
  { id: "ds-deal-006-conv",     dealId: "deal-006", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-006-demand",   dealId: "deal-006", partyId: "party-client-006",           role: "DEMAND" },
  { id: "ds-deal-006-supply",   dealId: "deal-006", partyId: "party-seller-006",           role: "SUPPLY" },

  // ── deal-007 — buy, agent-001, client-001 | subsidy 3 000 → net 8 875
  { id: "ds-deal-007-client", dealId: "deal-007", partyId: "party-client-001",           role: "REVENUE_SOURCE",        financialAmount: 8875 },
  { id: "ds-deal-007-agent",  dealId: "deal-007", partyId: "party-agent-001",            role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-007-conv",   dealId: "deal-007", partyId: "party-conv-gestoria-lopez",  role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-007-demand", dealId: "deal-007", partyId: "party-client-001",           role: "DEMAND" },
  { id: "ds-deal-007-supply", dealId: "deal-007", partyId: "party-seller-007",           role: "SUPPLY" },

  // ── deal-008 — sell, agent-002, client-002 + developer split | subsidy 5 000 → client net 3 700
  { id: "ds-deal-008-client",    dealId: "deal-008", partyId: "party-client-002",                        role: "REVENUE_SOURCE",        financialAmount: 3700 },
  { id: "ds-deal-008-developer", dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte",    role: "REVENUE_SOURCE",        financialAmount: 5800 },
  { id: "ds-deal-008-agent",     dealId: "deal-008", partyId: "party-agent-002",                         role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-008-conv",      dealId: "deal-008", partyId: "party-conv-gestoria-lopez",               role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-008-demand",    dealId: "deal-008", partyId: "party-client-002",                        role: "DEMAND" },
  { id: "ds-deal-008-supply",    dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte",    role: "SUPPLY" },

  // ── deal-009 — buy, agent-005, client-007
  { id: "ds-deal-009-client", dealId: "deal-009", partyId: "party-client-007",       role: "REVENUE_SOURCE",        financialAmount: 37000 },
  { id: "ds-deal-009-agent",  dealId: "deal-009", partyId: "party-agent-005",        role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-009-conv",   dealId: "deal-009", partyId: "party-conv-tamm-legal",  role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
  { id: "ds-deal-009-demand", dealId: "deal-009", partyId: "party-client-007",       role: "DEMAND" },
  { id: "ds-deal-009-supply", dealId: "deal-009", partyId: "party-third-emaar",      role: "SUPPLY" },

  // ── deal-010 — buy (canceled), agent-005, client-008
  { id: "ds-deal-010-client", dealId: "deal-010", partyId: "party-client-008",       role: "REVENUE_SOURCE",        financialAmount: 84000 },
  { id: "ds-deal-010-agent",  dealId: "deal-010", partyId: "party-agent-005",        role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-010-conv",   dealId: "deal-010", partyId: "party-conv-tamm-legal",  role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
  { id: "ds-deal-010-demand", dealId: "deal-010", partyId: "party-client-008",       role: "DEMAND" },
  { id: "ds-deal-010-supply", dealId: "deal-010", partyId: "party-seller-010",       role: "SUPPLY" },

  // ── deal-011 — MBU MA/Broker, DIB, Omar Rahman (sole broker)
  // Revenue: 1,500,000 × 1.20% = 18,000 | DIB tier 1 0.624% × 1.5M = 9,360
  { id: "ds-deal-011-bank",   dealId: "deal-011", partyId: "party-third-dib",          role: "REVENUE_SOURCE", financialAmount: 18_000 },
  { id: "ds-deal-011-broker", dealId: "deal-011", partyId: "party-broker-omar-rahman", role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-011-demand", dealId: "deal-011", partyId: "party-client-011",         role: "DEMAND" },
  { id: "ds-deal-011-supply", dealId: "deal-011", partyId: "party-third-dib",          role: "SUPPLY" },

  // ── deal-012 — MBU B2C, FAB (internal MC TBD when B2C channel is built)
  // Revenue: 3,200,000 × 1.00% = 32,000
  { id: "ds-deal-012-bank",   dealId: "deal-012", partyId: "party-third-fab", role: "REVENUE_SOURCE", financialAmount: 32_000 },
  { id: "ds-deal-012-demand", dealId: "deal-012", partyId: "party-client-008", role: "DEMAND" },
  { id: "ds-deal-012-supply", dealId: "deal-012", partyId: "party-third-fab",  role: "SUPPLY" },

  // ── deal-013 — buy, agent-002, client-009 | subsidy 4 500 → net 14 100
  { id: "ds-deal-013-client", dealId: "deal-013", partyId: "party-client-009",          role: "REVENUE_SOURCE",        financialAmount: 14100 },
  { id: "ds-deal-013-agent",  dealId: "deal-013", partyId: "party-agent-002",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-013-conv",   dealId: "deal-013", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-013-demand", dealId: "deal-013", partyId: "party-client-009",          role: "DEMAND" },
  { id: "ds-deal-013-supply", dealId: "deal-013", partyId: "party-seller-013",          role: "SUPPLY" },

  // ── deal-014 — mortgage, agent-001, bank revenue source
  { id: "ds-deal-014-bank",   dealId: "deal-014", partyId: "party-third-caixabank", role: "REVENUE_SOURCE", financialAmount: 2480 },
  { id: "ds-deal-014-agent",  dealId: "deal-014", partyId: "party-agent-001",       role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-014-demand", dealId: "deal-014", partyId: "party-client-001",      role: "DEMAND" },
  { id: "ds-deal-014-supply", dealId: "deal-014", partyId: "party-third-caixabank", role: "SUPPLY" },

  // ── deal-015 — mortgage, agent-003, bank revenue source
  { id: "ds-deal-015-bank",   dealId: "deal-015", partyId: "party-third-snb",  role: "REVENUE_SOURCE", financialAmount: 4600 },
  { id: "ds-deal-015-agent",  dealId: "deal-015", partyId: "party-agent-003",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-015-demand", dealId: "deal-015", partyId: "party-client-003", role: "DEMAND" },
  { id: "ds-deal-015-supply", dealId: "deal-015", partyId: "party-third-snb",  role: "SUPPLY" },

  // ── deal-016 — sell, agent-004, client-007 + developer split | rebate 1.5% × 42 000 = 630 → client net 24 570
  { id: "ds-deal-016-client",    dealId: "deal-016", partyId: "party-client-007",       role: "REVENUE_SOURCE",        financialAmount: 24570 },
  { id: "ds-deal-016-developer", dealId: "deal-016", partyId: "party-third-emaar",      role: "REVENUE_SOURCE",        financialAmount: 16800 },
  { id: "ds-deal-016-agent",     dealId: "deal-016", partyId: "party-agent-004",        role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-016-conv",      dealId: "deal-016", partyId: "party-conv-tamm-legal",  role: "OPERATIONAL_DEDUCTION", financialAmount: -3000 },
  { id: "ds-deal-016-demand",    dealId: "deal-016", partyId: "party-client-007",       role: "DEMAND" },
  { id: "ds-deal-016-supply",    dealId: "deal-016", partyId: "party-third-emaar",      role: "SUPPLY" },

  // ── deal-017 — buy, felicia 60% / omar 40% referral split | rebate 1.5% × 15 900 = 239 → net 15 661
  { id: "ds-deal-017-client",   dealId: "deal-017", partyId: "party-client-002",          role: "REVENUE_SOURCE",        financialAmount: 15661 },
  { id: "ds-deal-017-agent",    dealId: "deal-017", partyId: "party-agent-001",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 60 },
  { id: "ds-deal-017-agent-co", dealId: "deal-017", partyId: "party-agent-003",           role: "AGENT_PAYOUT",          splitPercentage: 40 },
  { id: "ds-deal-017-conv",     dealId: "deal-017", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-017-demand",   dealId: "deal-017", partyId: "party-client-002",          role: "DEMAND" },
  { id: "ds-deal-017-supply",   dealId: "deal-017", partyId: "party-dev-neinor",          role: "SUPPLY" },

  // ── deal-018 — buy, agent-001, client-004 | subsidy 7 000 → net 24 250
  { id: "ds-deal-018-client", dealId: "deal-018", partyId: "party-client-004",          role: "REVENUE_SOURCE",        financialAmount: 24250 },
  { id: "ds-deal-018-agent",  dealId: "deal-018", partyId: "party-agent-001",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-018-conv",   dealId: "deal-018", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", financialAmount: -1200 },
  { id: "ds-deal-018-demand", dealId: "deal-018", partyId: "party-client-004",          role: "DEMAND" },
  { id: "ds-deal-018-supply", dealId: "deal-018", partyId: "party-seller-018",          role: "SUPPLY" },

  // ── deal-019 — buy (canceled), agent-001, client-003
  { id: "ds-deal-019-client", dealId: "deal-019", partyId: "party-client-003",          role: "REVENUE_SOURCE",        financialAmount: 5200 },
  { id: "ds-deal-019-agent",  dealId: "deal-019", partyId: "party-agent-001",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-019-conv",   dealId: "deal-019", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-019-demand", dealId: "deal-019", partyId: "party-client-003",          role: "DEMAND" },
  { id: "ds-deal-019-supply", dealId: "deal-019", partyId: "party-seller-019",          role: "SUPPLY" },

  // ── deal-020 — primary buy, ae/AED, agent-004, developer-pay (Emaar AED 1.2M @ 2%)
  // Only Emaar is a payer; client is captured via DEMAND
  { id: "ds-deal-020-developer", dealId: "deal-020", partyId: "party-third-emaar", role: "REVENUE_SOURCE", financialAmount: 24000 },
  { id: "ds-deal-020-agent",     dealId: "deal-020", partyId: "party-agent-004",   role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-020-demand",    dealId: "deal-020", partyId: "party-client-008",  role: "DEMAND" },
  { id: "ds-deal-020-supply",    dealId: "deal-020", partyId: "party-third-emaar", role: "SUPPLY" },

  // ── deal-021 — primary buy, es/EUR, agent-002/Guilherme, referral Marta Sáez (salaried)
  // gross 14 400 − referral 600 (C) − conveyance 800 (D) = net 13 000
  // Guilherme 45%: 5 850 | TL Santiago 10%: 585 | Mgr Isabel 5%: 292.50
  { id: "ds-deal-021-client",   dealId: "deal-021", partyId: "party-client-003",         role: "REVENUE_SOURCE",        financialAmount: 14400 },
  { id: "ds-deal-021-agent",    dealId: "deal-021", partyId: "party-agent-002",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-021-referral", dealId: "deal-021", partyId: "party-agent-007",           role: "ACQUISITION_DEDUCTION", financialAmount: -600 },
  { id: "ds-deal-021-conv",     dealId: "deal-021", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", financialAmount: -800 },
  { id: "ds-deal-021-demand",   dealId: "deal-021", partyId: "party-client-003",          role: "DEMAND" },
  { id: "ds-deal-021-supply",   dealId: "deal-021", partyId: "party-dev-neinor",          role: "SUPPLY" },

  // ── deal-022 — MBU MA/Broker, ADIB, Omar Rahman 60% + Khalid & Associates 40%
  // Revenue: 2,800,000 × 1.25% = 35,000 | ADIB tier 1 0.663%: Omar 0.663% × 1.68M = 11,138 | Khalid 0.663% × 1.12M = 7,426
  { id: "ds-deal-022-bank",          dealId: "deal-022", partyId: "party-third-adib",          role: "REVENUE_SOURCE", financialAmount: 35_000 },
  { id: "ds-deal-022-broker-omar",   dealId: "deal-022", partyId: "party-broker-omar-rahman",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 60 },
  { id: "ds-deal-022-broker-khalid", dealId: "deal-022", partyId: "party-broker-khalid-assoc", role: "AGENT_PAYOUT",   splitPercentage: 40 },
  { id: "ds-deal-022-demand",        dealId: "deal-022", partyId: "party-client-012",          role: "DEMAND" },
  { id: "ds-deal-022-supply",        dealId: "deal-022", partyId: "party-third-adib",          role: "SUPPLY" },

  // ── deal-024 — BBG Broker: gross 50,000 | RM 25%=12,500 | TL 5%=2,500 | DS 5%=2,500 | Ext 54%=27,000 | Huspy 11%=5,500
  { id: "ds-deal-024-bank",   dealId: "deal-024", partyId: "party-third-adib",             role: "REVENUE_SOURCE", financialAmount: 50_000 },
  { id: "ds-deal-024-rm",     dealId: "deal-024", partyId: "party-bbg-rm-layla-nasser",    role: "AGENT_PAYOUT",   isPrimary: true, financialAmount: 12_500 },
  { id: "ds-deal-024-tl",     dealId: "deal-024", partyId: "party-bbg-tl-omar-sheikh",     role: "AGENT_PAYOUT",   financialAmount: 2_500 },
  { id: "ds-deal-024-ds",     dealId: "deal-024", partyId: "party-bbg-ds-rami-haddad",     role: "AGENT_PAYOUT",   financialAmount: 2_500 },
  { id: "ds-deal-024-ext",    dealId: "deal-024", partyId: "party-bbg-ext-falcon-capital", role: "AGENT_PAYOUT",   financialAmount: 27_000 },
  { id: "ds-deal-024-demand", dealId: "deal-024", partyId: "party-client-012",             role: "DEMAND" },
  { id: "ds-deal-024-supply", dealId: "deal-024", partyId: "party-third-adib",             role: "SUPPLY" },

  // ── deal-025 — BBG Self-Generated: gross 30,000 | RM 60%=18,000 | TL 5%=1,500 | Huspy 35%=10,500
  { id: "ds-deal-025-bank",   dealId: "deal-025", partyId: "party-third-fab",           role: "REVENUE_SOURCE", financialAmount: 30_000 },
  { id: "ds-deal-025-rm",     dealId: "deal-025", partyId: "party-bbg-rm-layla-nasser", role: "AGENT_PAYOUT",   isPrimary: true, financialAmount: 18_000 },
  { id: "ds-deal-025-tl",     dealId: "deal-025", partyId: "party-bbg-tl-omar-sheikh",  role: "AGENT_PAYOUT",   financialAmount: 1_500 },
  { id: "ds-deal-025-demand", dealId: "deal-025", partyId: "party-client-011",          role: "DEMAND" },
  { id: "ds-deal-025-supply", dealId: "deal-025", partyId: "party-third-fab",           role: "SUPPLY" },

  // ── deal-023 — MBU BYOB, DIB, Nadia Hassan (sole broker)
  // Revenue: 2,000,000 × 1.10% = 22,000 | (DIB tier 1 0.624% − 0.10% penalty) × 2M = 10,480
  { id: "ds-deal-023-bank",   dealId: "deal-023", partyId: "party-third-dib",                  role: "REVENUE_SOURCE", financialAmount: 22_000 },
  { id: "ds-deal-023-broker", dealId: "deal-023", partyId: "party-byob-broker-nadia-hassan",   role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100 },
  { id: "ds-deal-023-demand", dealId: "deal-023", partyId: "party-client-011",                 role: "DEMAND" },
  { id: "ds-deal-023-supply", dealId: "deal-023", partyId: "party-third-dib",                  role: "SUPPLY" },
];
