import type { PnlEntry } from "../entities";

// Financial P&L waterfall entries per Tranche.
// DEMAND/SUPPLY identity roles are in dealParticipants.ts (Deal-scoped).
//
// status: "confirmed" — locked at invoicing transition; amount is authoritative.
// status: "draft"     — Tranche not yet at invoicing.
// source: "engine"    — amount written by P&L engine; re-derived live while draft.
// source: "manual"    — amount explicitly declared by ops; engine uses as-is.

export const sharedPnlEntries: PnlEntry[] = [

  // ── deal-001 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-001-client",  trancheId: "tranche-001", partyId: "party-client-001",          role: "REVENUE_SOURCE",        amount: 11550,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-001-rebate",  trancheId: "tranche-001", partyId: "party-client-001",          role: "ACQUISITION_DEDUCTION", amount: -173,     source: "manual",  status: "confirmed" },
  { id: "ds-deal-001-agent",   trancheId: "tranche-001", partyId: "party-agent-001",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100, amount: 4550.80,  source: "engine", status: "confirmed" },
  { id: "ds-deal-001-ca-tl",   trancheId: "tranche-001", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 455.08,   source: "engine", status: "confirmed" },
  { id: "ds-deal-001-ca-mgr",  trancheId: "tranche-001", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 227.54,   source: "engine", status: "confirmed" },
  { id: "ds-deal-001-conv",    trancheId: "tranche-001", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,     source: "manual",  status: "confirmed" },

  // ── deal-002 ─ pending-agent-approval ─ REBU ES EUR ─ draft ──────────────────────────────────
  { id: "ds-deal-002-client",  trancheId: "tranche-002", partyId: "party-client-002",          role: "REVENUE_SOURCE",        amount: 18000,  source: "manual",  status: "draft" },
  { id: "ds-deal-002-subsidy", trancheId: "tranche-002", partyId: "party-client-002",          role: "ACQUISITION_DEDUCTION", amount: -4000,  source: "manual",  status: "draft" },
  { id: "ds-deal-002-agent",   trancheId: "tranche-002", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6300,   source: "engine", status: "draft" },
  { id: "ds-deal-002-ca-tl",   trancheId: "tranche-002", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 630,    source: "engine", status: "draft" },
  { id: "ds-deal-002-ca-mgr",  trancheId: "tranche-002", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 315,    source: "engine", status: "draft" },
  { id: "ds-deal-002-conv",    trancheId: "tranche-002", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },

  // ── deal-003 ─ pending-details ─ REBU ES EUR ─ draft ─────────────────────────────────────────
  { id: "ds-deal-003-client",  trancheId: "tranche-003", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 1152,   source: "manual",  status: "draft" },
  { id: "ds-deal-003-agent",   trancheId: "tranche-003", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 460.80, source: "engine", status: "draft" },
  { id: "ds-deal-003-ca-tl",   trancheId: "tranche-003", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 46.08,  source: "engine", status: "draft" },
  { id: "ds-deal-003-ca-mgr",  trancheId: "tranche-003", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 23.04,  source: "engine", status: "draft" },
  { id: "ds-deal-003-conv",    trancheId: "tranche-003", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -400,   source: "manual",  status: "draft" },

  // ── deal-004 ─ pending-details ─ REBU ES EUR ─ draft ─────────────────────────────────────────
  { id: "ds-deal-004-client",  trancheId: "tranche-004", partyId: "party-client-004",          role: "REVENUE_SOURCE",        amount: 25000,  source: "manual",  status: "draft" },
  { id: "ds-deal-004-subsidy", trancheId: "tranche-004", partyId: "party-client-004",          role: "ACQUISITION_DEDUCTION", amount: -6000,  source: "manual",  status: "draft" },
  { id: "ds-deal-004-agent",   trancheId: "tranche-004", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 8550,   source: "engine", status: "draft" },
  { id: "ds-deal-004-ca-tl",   trancheId: "tranche-004", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 855,    source: "engine", status: "draft" },
  { id: "ds-deal-004-ca-mgr",  trancheId: "tranche-004", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 427.50, source: "engine", status: "draft" },
  { id: "ds-deal-004-conv",    trancheId: "tranche-004", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -1200,  source: "manual",  status: "draft" },

  // ── deal-005 ─ under-review ─ REBU SA SAR ─ draft ────────────────────────────────────────────
  { id: "ds-deal-005-client",  trancheId: "tranche-005", partyId: "party-client-005",              role: "REVENUE_SOURCE",        amount: 13500,  source: "manual",  status: "draft" },
  { id: "ds-deal-005-rebate",  trancheId: "tranche-005", partyId: "party-client-005",              role: "ACQUISITION_DEDUCTION", amount: -270,   source: "manual",  status: "draft" },
  { id: "ds-deal-005-agent",   trancheId: "tranche-005", partyId: "party-agent-003",               role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 5292,   source: "engine", status: "draft" },
  { id: "ds-deal-005-ca-tl",   trancheId: "tranche-005", partyId: "party-ca-majid-sar",             role: "AGENT_PAYOUT", description: "Team Lead", amount: 529.20, source: "engine", status: "draft" },
  { id: "ds-deal-005-ca-mgr",  trancheId: "tranche-005", partyId: "party-ca-karim-aed",             role: "AGENT_PAYOUT", description: "Manager",   amount: 264.60, source: "engine", status: "draft" },
  { id: "ds-deal-005-conv",    trancheId: "tranche-005", partyId: "party-conv-alrajhi-notarial",    role: "OPERATIONAL_DEDUCTION", amount: -2000,  source: "manual",  status: "draft" },

  // ── deal-006 ─ pending-agent-approval ─ REBU ES EUR ─ draft ─ 70/30 co-listing ─────────────
  { id: "ds-deal-006-client",      trancheId: "tranche-006", partyId: "party-client-006",          role: "REVENUE_SOURCE",        amount: 9600,   source: "manual",  status: "draft" },
  { id: "ds-deal-006-subsidy",     trancheId: "tranche-006", partyId: "party-client-006",          role: "ACQUISITION_DEDUCTION", amount: -2500,  source: "manual",  status: "draft" },
  { id: "ds-deal-006-agent",       trancheId: "tranche-006", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 70,  amount: 1988,   source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-tl-a1",   trancheId: "tranche-006", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead (agent-001)", amount: 198.80, source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-mgr-a1",  trancheId: "tranche-006", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager (agent-001)",   amount: 99.40,  source: "engine", status: "draft" },
  { id: "ds-deal-006-agent-co",    trancheId: "tranche-006", partyId: "party-agent-002",           role: "AGENT_PAYOUT", splitPercentage: 30, amount: 958.50, source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-tl-a2",   trancheId: "tranche-006", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead (agent-002)", amount: 95.85,  source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-mgr-a2",  trancheId: "tranche-006", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager (agent-002)",   amount: 47.93,  source: "engine", status: "draft" },
  { id: "ds-deal-006-conv",        trancheId: "tranche-006", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },

  // ── deal-007 ─ under-review ─ REBU ES EUR ─ draft ────────────────────────────────────────────
  { id: "ds-deal-007-client",  trancheId: "tranche-007", partyId: "party-client-001",          role: "REVENUE_SOURCE",        amount: 11875,  source: "manual",  status: "draft" },
  { id: "ds-deal-007-subsidy", trancheId: "tranche-007", partyId: "party-client-001",          role: "ACQUISITION_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },
  { id: "ds-deal-007-agent",   trancheId: "tranche-007", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 3550,   source: "engine", status: "draft" },
  { id: "ds-deal-007-ca-tl",   trancheId: "tranche-007", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 355,    source: "engine", status: "draft" },
  { id: "ds-deal-007-ca-mgr",  trancheId: "tranche-007", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 177.50, source: "engine", status: "draft" },
  { id: "ds-deal-007-conv",    trancheId: "tranche-007", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },

  // ── deal-008 ─ invoicing ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-008-client",    trancheId: "tranche-008", partyId: "party-client-002",                     role: "REVENUE_SOURCE",        amount: 8700,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-developer", trancheId: "tranche-008", partyId: "party-third-inmobiliaria-grupo-norte", role: "REVENUE_SOURCE",        amount: 5800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-subsidy",   trancheId: "tranche-008", partyId: "party-client-002",                     role: "REVENUE_SOURCE",        amount: -5000,   source: "manual",  status: "confirmed", description: "Rebate" },
  { id: "ds-deal-008-agent",     trancheId: "tranche-008", partyId: "party-agent-002",                      role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 4275,    source: "engine", status: "confirmed" },
  { id: "ds-deal-008-ca-tl",     trancheId: "tranche-008", partyId: "party-ca-santiago-eur",               role: "AGENT_PAYOUT", description: "Team Lead", amount: 427.50,  source: "engine", status: "confirmed" },
  { id: "ds-deal-008-ca-mgr",    trancheId: "tranche-008", partyId: "party-ca-isabel-eur",                 role: "AGENT_PAYOUT", description: "Manager",   amount: 213.75,  source: "engine", status: "confirmed" },
  { id: "ds-deal-008-conv",      trancheId: "tranche-008", partyId: "party-conv-gestoria-lopez",            role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "confirmed" },

  // ── deal-009 ─ under-review ─ REBU AE AED ─ draft ────────────────────────────────────────────
  { id: "ds-deal-009-client",  trancheId: "tranche-009", partyId: "party-client-007",      role: "REVENUE_SOURCE",        amount: 37000,   source: "manual",  status: "draft" },
  { id: "ds-deal-009-rebate",  trancheId: "tranche-009", partyId: "party-client-007",      role: "ACQUISITION_DEDUCTION", amount: -740,    source: "manual",  status: "draft" },
  { id: "ds-deal-009-agent",   trancheId: "tranche-009", partyId: "party-agent-005",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 17443,  source: "engine", status: "draft" },
  { id: "ds-deal-009-ca-tl",   trancheId: "tranche-009", partyId: "party-ca-leila-aed",   role: "AGENT_PAYOUT", description: "Team Lead", amount: 1744.30, source: "engine", status: "draft" },
  { id: "ds-deal-009-ca-mgr",  trancheId: "tranche-009", partyId: "party-ca-karim-aed",   role: "AGENT_PAYOUT", description: "Manager",   amount: 872.15,  source: "engine", status: "draft" },
  { id: "ds-deal-009-conv",    trancheId: "tranche-009", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },

  // ── deal-010 ─ canceled ─ REBU AE AED ─ draft ────────────────────────────────────────────────
  { id: "ds-deal-010-client",  trancheId: "tranche-010", partyId: "party-client-008",      role: "REVENUE_SOURCE",        amount: 84000,  source: "manual",  status: "draft" },
  { id: "ds-deal-010-agent",   trancheId: "tranche-010", partyId: "party-agent-005",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 43700,  source: "engine", status: "draft" },
  { id: "ds-deal-010-ca-tl",   trancheId: "tranche-010", partyId: "party-ca-leila-aed",   role: "AGENT_PAYOUT", description: "Team Lead", amount: 4370,   source: "engine", status: "draft" },
  { id: "ds-deal-010-ca-mgr",  trancheId: "tranche-010", partyId: "party-ca-karim-aed",   role: "AGENT_PAYOUT", description: "Manager",   amount: 2185,   source: "engine", status: "draft" },
  { id: "ds-deal-010-conv",    trancheId: "tranche-010", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },

  // ── deal-011 ─ invoicing ─ MBU MA/Broker AE AED ─ confirmed ──────────────────────────────────
  { id: "ds-deal-011-bank",   trancheId: "tranche-011", partyId: "party-third-dib",          role: "REVENUE_SOURCE", amount: 18_000, source: "manual",  status: "confirmed" },
  { id: "ds-deal-011-broker", trancheId: "tranche-011", partyId: "party-broker-omar-rahman", role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 9360,  source: "engine", status: "confirmed" },

  // ── deal-012 ─ under-review ─ MBU B2C AE AED ─ draft ─────────────────────────────────────────
  { id: "ds-deal-012-bank",   trancheId: "tranche-012", partyId: "party-third-fab",  role: "REVENUE_SOURCE", amount: 32_000, source: "manual",  status: "draft" },
  { id: "ds-deal-012-agent",  trancheId: "tranche-012", partyId: "party-agent-005",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 8960, source: "engine", status: "draft" },

  // ── deal-013 ─ pending-agent-approval ─ REBU ES EUR ─ draft ──────────────────────────────────
  { id: "ds-deal-013-client",  trancheId: "tranche-013", partyId: "party-client-009",          role: "REVENUE_SOURCE",        amount: 18600,  source: "manual",  status: "draft" },
  { id: "ds-deal-013-subsidy", trancheId: "tranche-013", partyId: "party-client-009",          role: "ACQUISITION_DEDUCTION", amount: -4500,  source: "manual",  status: "draft" },
  { id: "ds-deal-013-agent",   trancheId: "tranche-013", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6345,   source: "engine", status: "draft" },
  { id: "ds-deal-013-ca-tl",   trancheId: "tranche-013", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 634.50, source: "engine", status: "draft" },
  { id: "ds-deal-013-ca-mgr",  trancheId: "tranche-013", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 317.25, source: "engine", status: "draft" },
  { id: "ds-deal-013-conv",    trancheId: "tranche-013", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },

  // ── deal-014 ─ invoicing ─ MBU direct B2C ES EUR ─ confirmed ─────────────────────────────────
  { id: "ds-deal-014-bank",   trancheId: "tranche-014", partyId: "party-third-caixabank", role: "REVENUE_SOURCE", amount: 2480,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-014-agent",  trancheId: "tranche-014", partyId: "party-agent-001",       role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 694.40, source: "engine", status: "confirmed" },

  // ── deal-015 ─ invoicing ─ MBU direct B2C SA SAR ─ confirmed ─────────────────────────────────
  { id: "ds-deal-015-bank",   trancheId: "tranche-015", partyId: "party-third-snb",  role: "REVENUE_SOURCE", amount: 4600,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-015-agent",  trancheId: "tranche-015", partyId: "party-agent-003",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 1288,   source: "engine", status: "confirmed" },

  // ── deal-016 ─ finalized ─ REBU AE AED ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-016-client",    trancheId: "tranche-016", partyId: "party-client-007",      role: "REVENUE_SOURCE",        amount: 25200,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-developer", trancheId: "tranche-016", partyId: "party-third-emaar",     role: "REVENUE_SOURCE",        amount: 16800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-rebate",    trancheId: "tranche-016", partyId: "party-client-007",      role: "ACQUISITION_DEDUCTION", amount: -630,     source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-agent",     trancheId: "tranche-016", partyId: "party-agent-004",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 17375.40, source: "engine", status: "confirmed" },
  { id: "ds-deal-016-ca-tl",     trancheId: "tranche-016", partyId: "party-ca-leila-aed",   role: "AGENT_PAYOUT", description: "Team Lead", amount: 1737.54,  source: "engine", status: "confirmed" },
  { id: "ds-deal-016-ca-mgr",    trancheId: "tranche-016", partyId: "party-ca-karim-aed",   role: "AGENT_PAYOUT", description: "Manager",   amount: 868.77,   source: "engine", status: "confirmed" },
  { id: "ds-deal-016-conv",      trancheId: "tranche-016", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,    source: "manual",  status: "confirmed" },

  // ── deal-017 ─ under-review ─ REBU ES EUR ─ draft ─ 60/40 split ─────────────────────────────
  { id: "ds-deal-017-client",      trancheId: "tranche-017", partyId: "party-client-002",          role: "REVENUE_SOURCE",        amount: 15900,   source: "manual",  status: "draft" },
  { id: "ds-deal-017-rebate",      trancheId: "tranche-017", partyId: "party-client-002",          role: "ACQUISITION_DEDUCTION", amount: -239,    source: "manual",  status: "draft" },
  { id: "ds-deal-017-agent",       trancheId: "tranche-017", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 60,  amount: 3758.64, source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-tl-a1",   trancheId: "tranche-017", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead (agent-001)", amount: 375.86,  source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-mgr-a1",  trancheId: "tranche-017", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager (agent-001)",   amount: 187.93,  source: "engine", status: "draft" },
  { id: "ds-deal-017-agent-co",    trancheId: "tranche-017", partyId: "party-agent-003",           role: "AGENT_PAYOUT", splitPercentage: 40, amount: 2505.76, source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-tl-a3",   trancheId: "tranche-017", partyId: "party-ca-majid-sar",         role: "AGENT_PAYOUT", description: "Team Lead (agent-003)", amount: 250.58,  source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-mgr-a3",  trancheId: "tranche-017", partyId: "party-ca-karim-aed",         role: "AGENT_PAYOUT", description: "Manager (agent-003)",   amount: 125.29,  source: "engine", status: "draft" },
  { id: "ds-deal-017-conv",        trancheId: "tranche-017", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "draft" },

  // ── deal-018 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-018-client",  trancheId: "tranche-018", partyId: "party-client-004",          role: "REVENUE_SOURCE",        amount: 31250,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-018-subsidy", trancheId: "tranche-018", partyId: "party-client-004",          role: "ACQUISITION_DEDUCTION", amount: -7000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-018-agent",   trancheId: "tranche-018", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 9700,    source: "engine", status: "confirmed" },
  { id: "ds-deal-018-ca-tl",   trancheId: "tranche-018", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 970,     source: "engine", status: "confirmed" },
  { id: "ds-deal-018-ca-mgr",  trancheId: "tranche-018", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 485,     source: "engine", status: "confirmed" },
  { id: "ds-deal-018-conv",    trancheId: "tranche-018", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -1200,   source: "manual",  status: "confirmed" },

  // ── deal-019 ─ canceled ─ REBU ES EUR ─ draft ────────────────────────────────────────────────
  { id: "ds-deal-019-client",  trancheId: "tranche-019", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 5200,   source: "manual",  status: "draft" },
  { id: "ds-deal-019-agent",   trancheId: "tranche-019", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 2080,   source: "engine", status: "draft" },
  { id: "ds-deal-019-ca-tl",   trancheId: "tranche-019", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 208,    source: "engine", status: "draft" },
  { id: "ds-deal-019-ca-mgr",  trancheId: "tranche-019", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 104,    source: "engine", status: "draft" },
  { id: "ds-deal-019-conv",    trancheId: "tranche-019", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },

  // ── deal-020 ─ finalized ─ REBU AE AED ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-020-developer", trancheId: "tranche-020", partyId: "party-third-emaar",  role: "REVENUE_SOURCE", amount: 24000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-020-agent",     trancheId: "tranche-020", partyId: "party-agent-004",    role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 10080,   source: "engine", status: "confirmed" },
  { id: "ds-deal-020-ca-tl",     trancheId: "tranche-020", partyId: "party-ca-leila-aed", role: "AGENT_PAYOUT", description: "Team Lead", amount: 1008,    source: "engine", status: "confirmed" },
  { id: "ds-deal-020-ca-mgr",    trancheId: "tranche-020", partyId: "party-ca-karim-aed", role: "AGENT_PAYOUT", description: "Manager",   amount: 504,     source: "engine", status: "confirmed" },

  // ── deal-021 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  { id: "ds-deal-021-client",   trancheId: "tranche-021", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 14400,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-021-referral", trancheId: "tranche-021", partyId: "party-agent-007",           role: "ACQUISITION_DEDUCTION", amount: -600,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-021-agent",    trancheId: "tranche-021", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6210,    source: "engine", status: "confirmed" },
  { id: "ds-deal-021-ca-tl",    trancheId: "tranche-021", partyId: "party-ca-santiago-eur",     role: "AGENT_PAYOUT", description: "Team Lead", amount: 621,     source: "engine", status: "confirmed" },
  { id: "ds-deal-021-ca-mgr",   trancheId: "tranche-021", partyId: "party-ca-isabel-eur",       role: "AGENT_PAYOUT", description: "Manager",   amount: 310.50,  source: "engine", status: "confirmed" },
  { id: "ds-deal-021-conv",     trancheId: "tranche-021", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "confirmed" },

  // ── tranche-026a ─ finalized ─ Arras ─────────────────────────────────────────────────────────
  { id: "ds-arras-client",  trancheId: "tranche-026a", partyId: "party-client-001",      role: "REVENUE_SOURCE", amount: 4500, source: "manual",  status: "confirmed" },
  { id: "ds-arras-agent",   trancheId: "tranche-026a", partyId: "party-agent-001",       role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 1800, source: "engine", status: "confirmed" },
  { id: "ds-arras-ca-tl",   trancheId: "tranche-026a", partyId: "party-ca-santiago-eur", role: "AGENT_PAYOUT",   description: "Team Lead", amount: 180, source: "engine", status: "confirmed" },
  { id: "ds-arras-ca-mgr",  trancheId: "tranche-026a", partyId: "party-ca-isabel-eur",   role: "AGENT_PAYOUT",   description: "Manager",   amount: 90,  source: "engine", status: "confirmed" },

  // ── tranche-026b ─ pending-details ─ Escritura ───────────────────────────────────────────────
  { id: "ds-escr-client",   trancheId: "tranche-026b", partyId: "party-client-001",      role: "REVENUE_SOURCE", amount: 4500, source: "manual",  status: "draft" },
  { id: "ds-escr-agent",    trancheId: "tranche-026b", partyId: "party-agent-001",       role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, source: "engine", status: "draft" },

  // ── deal-022 ─ finalized ─ MBU MA/Broker AE AED ─ confirmed ──────────────────────────────────
  { id: "ds-deal-022-bank",          trancheId: "tranche-022", partyId: "party-third-adib",          role: "REVENUE_SOURCE", amount: 35_000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-022-broker-omar",   trancheId: "tranche-022", partyId: "party-broker-omar-rahman",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 60, amount: 11138.40, source: "engine", status: "confirmed" },
  { id: "ds-deal-022-broker-khalid", trancheId: "tranche-022", partyId: "party-broker-khalid-assoc", role: "AGENT_PAYOUT",   splitPercentage: 40, amount: 7425.60, source: "engine", status: "confirmed" },

  // ── deal-023 ─ invoicing ─ MBU BYOB AE AED ─ confirmed ───────────────────────────────────────
  { id: "ds-deal-023-bank",   trancheId: "tranche-023", partyId: "party-third-dib",                role: "REVENUE_SOURCE", amount: 22_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-023-broker", trancheId: "tranche-023", partyId: "party-byob-broker-nadia-hassan", role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 10480, source: "engine", status: "confirmed" },

  // ── deal-024 ─ invoicing ─ BBG Broker AE AED ─ confirmed ─────────────────────────────────────
  { id: "ds-deal-024-bank",   trancheId: "tranche-024", partyId: "party-third-adib",             role: "REVENUE_SOURCE", amount: 50_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-rm",     trancheId: "tranche-024", partyId: "party-bbg-rm-layla-nasser",    role: "AGENT_PAYOUT",   isPrimary: true, amount: 12_500,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-tl",     trancheId: "tranche-024", partyId: "party-bbg-tl-omar-sheikh",     role: "AGENT_PAYOUT",   amount: 2_500,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-ds",     trancheId: "tranche-024", partyId: "party-bbg-ds-rami-haddad",     role: "AGENT_PAYOUT",   amount: 2_500,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-ext",    trancheId: "tranche-024", partyId: "party-bbg-ext-falcon-capital", role: "AGENT_PAYOUT",   amount: 27_000,  source: "manual",  status: "confirmed" },

  // ── deal-025 ─ invoicing ─ BBG Self-Generated AE AED ─ confirmed ──────────────────────────────
  { id: "ds-deal-025-bank",   trancheId: "tranche-025", partyId: "party-third-fab",           role: "REVENUE_SOURCE", amount: 30_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-025-rm",     trancheId: "tranche-025", partyId: "party-bbg-rm-layla-nasser", role: "AGENT_PAYOUT",   isPrimary: true, amount: 18_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-025-tl",     trancheId: "tranche-025", partyId: "party-bbg-tl-omar-sheikh",  role: "AGENT_PAYOUT",   amount: 1_500,   source: "manual",  status: "confirmed" },
];

