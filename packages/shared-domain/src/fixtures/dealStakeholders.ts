import type { DealStakeholder } from "../entities";

// Canonical stakeholder relationships for each deal, grouped by dealId.
//
// status: "confirmed" — stakes locked at invoicing transition; amount is authoritative.
// status: "draft"     — deal not yet at invoicing.
//
// source: "engine" — amount written by the P&L engine (at deal creation or on save-for-approval).
//                    For draft stakes the engine re-derives live; amount is the last saved estimate.
// source: "manual" — amount explicitly declared by ops (revenue lines, cost fees, BBG fixed payouts).
//                    Engine uses this value directly without recomputing.
//
// Connected-agent AGENT_PAYOUT stakes (Team Lead, Manager) exist on ALL deals from creation
// with source: "engine". For draft deals they carry the initial engine estimate; financialAmount
// is locked at confirmation.
//
// Deals 010 and 019 are canceled before reaching invoicing → all stakes remain draft.

export const sharedDealStakeholders: DealStakeholder[] = [

  // ── deal-001 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  // agent-001 40% flat · CB 11,550 − 173 = 11,377 · agent net 4,550.80
  // TL (agent-008) 10% = 455.08 · Mgr (agent-009) 5% = 227.54
  { id: "ds-deal-001-client",  dealId: "deal-001", partyId: "party-client-001",          role: "REVENUE_SOURCE",        amount: 11550,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-001-rebate",  dealId: "deal-001", partyId: "party-client-001",          role: "ACQUISITION_DEDUCTION", amount: -173,     source: "manual",  status: "confirmed" },
  { id: "ds-deal-001-agent",   dealId: "deal-001", partyId: "party-agent-001",           role: "AGENT_PAYOUT",          isPrimary: true, splitPercentage: 100, amount: 4550.80,  source: "engine", status: "confirmed" },
  { id: "ds-deal-001-ca-tl",   dealId: "deal-001", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead", amount: 455.08,   source: "engine", status: "confirmed" },
  { id: "ds-deal-001-ca-mgr",  dealId: "deal-001", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",   amount: 227.54,   source: "engine", status: "confirmed" },
  { id: "ds-deal-001-conv",    dealId: "deal-001", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,     source: "manual",  status: "confirmed" },
  { id: "ds-deal-001-demand",  dealId: "deal-001", partyId: "party-client-001",          role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-001-supply",  dealId: "deal-001", partyId: "party-dev-neinor",          role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-002 ─ pending-agent-approval ─ REBU ES EUR ─ draft ──────────────────────────────────
  // agent-002 45% flat · CB 14,000 · engine estimate: agent net 6,300 · TL 630 · Mgr 315
  { id: "ds-deal-002-client",  dealId: "deal-002", partyId: "party-client-002",          role: "REVENUE_SOURCE",        amount: 18000,  source: "manual",  status: "draft" },
  { id: "ds-deal-002-subsidy", dealId: "deal-002", partyId: "party-client-002",          role: "ACQUISITION_DEDUCTION", amount: -4000,  source: "manual",  status: "draft" },
  { id: "ds-deal-002-agent",   dealId: "deal-002", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6300,   source: "engine", status: "draft" },
  { id: "ds-deal-002-ca-tl",   dealId: "deal-002", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 630,    source: "engine", status: "draft" },
  { id: "ds-deal-002-ca-mgr",  dealId: "deal-002", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 315,    source: "engine", status: "draft" },
  { id: "ds-deal-002-conv",    dealId: "deal-002", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },
  { id: "ds-deal-002-demand",  dealId: "deal-002", partyId: "party-client-002",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-002-supply",  dealId: "deal-002", partyId: "party-seller-002",          role: "SUPPLY",                                status: "draft" },

  // ── deal-003 ─ pending-details ─ REBU ES EUR ─ draft ─────────────────────────────────────────
  // agent-001 40% flat · CB 1,152 · engine estimate: agent net 460.80 · TL 46.08 · Mgr 23.04
  { id: "ds-deal-003-client",  dealId: "deal-003", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 1152,   source: "manual",  status: "draft" },
  { id: "ds-deal-003-agent",   dealId: "deal-003", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 460.80, source: "engine", status: "draft" },
  { id: "ds-deal-003-ca-tl",   dealId: "deal-003", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 46.08,  source: "engine", status: "draft" },
  { id: "ds-deal-003-ca-mgr",  dealId: "deal-003", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 23.04,  source: "engine", status: "draft" },
  { id: "ds-deal-003-conv",    dealId: "deal-003", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -400,   source: "manual",  status: "draft" },
  { id: "ds-deal-003-demand",  dealId: "deal-003", partyId: "party-client-003",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-003-supply",  dealId: "deal-003", partyId: "party-seller-003",          role: "SUPPLY",                                status: "draft" },

  // ── deal-004 ─ pending-details ─ REBU ES EUR ─ draft ─────────────────────────────────────────
  // agent-002 45% flat · CB 19,000 · engine estimate: agent net 8,550 · TL 855 · Mgr 427.50
  { id: "ds-deal-004-client",  dealId: "deal-004", partyId: "party-client-004",          role: "REVENUE_SOURCE",        amount: 25000,  source: "manual",  status: "draft" },
  { id: "ds-deal-004-subsidy", dealId: "deal-004", partyId: "party-client-004",          role: "ACQUISITION_DEDUCTION", amount: -6000,  source: "manual",  status: "draft" },
  { id: "ds-deal-004-agent",   dealId: "deal-004", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 8550,   source: "engine", status: "draft" },
  { id: "ds-deal-004-ca-tl",   dealId: "deal-004", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 855,    source: "engine", status: "draft" },
  { id: "ds-deal-004-ca-mgr",  dealId: "deal-004", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 427.50, source: "engine", status: "draft" },
  { id: "ds-deal-004-conv",    dealId: "deal-004", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -1200,  source: "manual",  status: "draft" },
  { id: "ds-deal-004-demand",  dealId: "deal-004", partyId: "party-client-004",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-004-supply",  dealId: "deal-004", partyId: "party-seller-004",          role: "SUPPLY",                                status: "draft" },

  // ── deal-005 ─ under-review ─ REBU SA SAR ─ draft ────────────────────────────────────────────
  // agent-003 40% flat · CB 13,230 · engine estimate: agent net 5,292 · TL 529.20 · Mgr 264.60
  { id: "ds-deal-005-client",  dealId: "deal-005", partyId: "party-client-005",            role: "REVENUE_SOURCE",        amount: 13500,  source: "manual",  status: "draft" },
  { id: "ds-deal-005-rebate",  dealId: "deal-005", partyId: "party-client-005",            role: "ACQUISITION_DEDUCTION", amount: -270,   source: "manual",  status: "draft" },
  { id: "ds-deal-005-agent",   dealId: "deal-005", partyId: "party-agent-003",             role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 5292,   source: "engine", status: "draft" },
  { id: "ds-deal-005-ca-tl",   dealId: "deal-005", partyId: "party-ca-majid-sar",             role: "AGENT_PAYOUT", description: "Team Lead",               amount: 529.20, source: "engine", status: "draft" },
  { id: "ds-deal-005-ca-mgr",  dealId: "deal-005", partyId: "party-ca-karim-aed",             role: "AGENT_PAYOUT", description: "Manager",                 amount: 264.60, source: "engine", status: "draft" },
  { id: "ds-deal-005-conv",    dealId: "deal-005", partyId: "party-conv-alrajhi-notarial", role: "OPERATIONAL_DEDUCTION", amount: -2000,  source: "manual",  status: "draft" },
  { id: "ds-deal-005-demand",  dealId: "deal-005", partyId: "party-client-005",            role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-005-supply",  dealId: "deal-005", partyId: "party-dev-dar-al-arkan",      role: "SUPPLY",                                status: "draft" },

  // ── deal-006 ─ pending-agent-approval ─ REBU ES EUR ─ draft ─ 70/30 co-listing ─────────────
  // agent-001 70%: allocated 4,970 → 40% net 1,988 · TL 198.80 · Mgr 99.40
  // agent-002 30%: allocated 2,130 → 45% net 958.50 · TL 95.85 · Mgr 47.93
  { id: "ds-deal-006-client",      dealId: "deal-006", partyId: "party-client-006",          role: "REVENUE_SOURCE",        amount: 9600,   source: "manual",  status: "draft" },
  { id: "ds-deal-006-subsidy",     dealId: "deal-006", partyId: "party-client-006",          role: "ACQUISITION_DEDUCTION", amount: -2500,  source: "manual",  status: "draft" },
  { id: "ds-deal-006-agent",       dealId: "deal-006", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 70,  amount: 1988,   source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-tl-a1",   dealId: "deal-006", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead (agent-001)",   amount: 198.80, source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-mgr-a1",  dealId: "deal-006", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager (agent-001)",     amount: 99.40,  source: "engine", status: "draft" },
  { id: "ds-deal-006-agent-co",    dealId: "deal-006", partyId: "party-agent-002",           role: "AGENT_PAYOUT", splitPercentage: 30,                    amount: 958.50, source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-tl-a2",   dealId: "deal-006", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead (agent-002)",   amount: 95.85,  source: "engine", status: "draft" },
  { id: "ds-deal-006-ca-mgr-a2",  dealId: "deal-006", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager (agent-002)",     amount: 47.93,  source: "engine", status: "draft" },
  { id: "ds-deal-006-conv",        dealId: "deal-006", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },
  { id: "ds-deal-006-demand",      dealId: "deal-006", partyId: "party-client-006",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-006-supply",      dealId: "deal-006", partyId: "party-seller-006",          role: "SUPPLY",                                status: "draft" },

  // ── deal-007 ─ under-review ─ REBU ES EUR ─ draft ────────────────────────────────────────────
  // agent-001 40% flat · CB 8,875 · engine estimate: agent net 3,550 · TL 355 · Mgr 177.50
  { id: "ds-deal-007-client",  dealId: "deal-007", partyId: "party-client-001",          role: "REVENUE_SOURCE",        amount: 11875,  source: "manual",  status: "draft" },
  { id: "ds-deal-007-subsidy", dealId: "deal-007", partyId: "party-client-001",          role: "ACQUISITION_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },
  { id: "ds-deal-007-agent",   dealId: "deal-007", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 3550,   source: "engine", status: "draft" },
  { id: "ds-deal-007-ca-tl",   dealId: "deal-007", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 355,    source: "engine", status: "draft" },
  { id: "ds-deal-007-ca-mgr",  dealId: "deal-007", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 177.50, source: "engine", status: "draft" },
  { id: "ds-deal-007-conv",    dealId: "deal-007", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },
  { id: "ds-deal-007-demand",  dealId: "deal-007", partyId: "party-client-001",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-007-supply",  dealId: "deal-007", partyId: "party-seller-007",          role: "SUPPLY",                                status: "draft" },

  // ── deal-008 ─ invoicing ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  // agent-002 45% flat · CB (8,700 + 5,800) − 5,000 = 9,500 · agent net 4,275
  // TL (agent-008) 10% = 427.50 · Mgr (agent-009) 5% = 213.75
  { id: "ds-deal-008-client",    dealId: "deal-008", partyId: "party-client-002",                     role: "REVENUE_SOURCE",        amount: 8700,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-developer", dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte", role: "REVENUE_SOURCE",        amount: 5800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-subsidy",   dealId: "deal-008", partyId: "party-client-002",                     role: "ACQUISITION_DEDUCTION", amount: -5000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-agent",     dealId: "deal-008", partyId: "party-agent-002",                      role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 4275,    source: "engine", status: "confirmed" },
  { id: "ds-deal-008-ca-tl",     dealId: "deal-008", partyId: "party-ca-santiago-eur",                      role: "AGENT_PAYOUT", description: "Team Lead", amount: 427.50,  source: "engine", status: "confirmed" },
  { id: "ds-deal-008-ca-mgr",    dealId: "deal-008", partyId: "party-ca-isabel-eur",                      role: "AGENT_PAYOUT", description: "Manager",   amount: 213.75,  source: "engine", status: "confirmed" },
  { id: "ds-deal-008-conv",      dealId: "deal-008", partyId: "party-conv-gestoria-lopez",            role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-008-demand",    dealId: "deal-008", partyId: "party-client-002",                     role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-008-supply",    dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte", role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-009 ─ under-review ─ REBU AE AED ─ draft ────────────────────────────────────────────
  // agent-005 slab 35/45/55 · CB 36,260 · engine estimate: net 17,443 · TL 1,744.30 · Mgr 872.15
  { id: "ds-deal-009-client",  dealId: "deal-009", partyId: "party-client-007",      role: "REVENUE_SOURCE",        amount: 37000,  source: "manual",  status: "draft" },
  { id: "ds-deal-009-rebate",  dealId: "deal-009", partyId: "party-client-007",      role: "ACQUISITION_DEDUCTION", amount: -740,   source: "manual",  status: "draft" },
  { id: "ds-deal-009-agent",   dealId: "deal-009", partyId: "party-agent-005",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 17443,  source: "engine", status: "draft" },
  { id: "ds-deal-009-ca-tl",   dealId: "deal-009", partyId: "party-ca-leila-aed",       role: "AGENT_PAYOUT", description: "Team Lead",               amount: 1744.30, source: "engine", status: "draft" },
  { id: "ds-deal-009-ca-mgr",  dealId: "deal-009", partyId: "party-ca-karim-aed",       role: "AGENT_PAYOUT", description: "Manager",                 amount: 872.15, source: "engine", status: "draft" },
  { id: "ds-deal-009-conv",    dealId: "deal-009", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },
  { id: "ds-deal-009-demand",  dealId: "deal-009", partyId: "party-client-007",      role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-009-supply",  dealId: "deal-009", partyId: "party-third-emaar",     role: "SUPPLY",                                status: "draft" },

  // ── deal-010 ─ canceled (before invoicing) ─ REBU AE AED ─ draft ─────────────────────────────
  // agent-005 slab · CB 84,000 · engine estimate: net 43,700 · TL 4,370 · Mgr 2,185
  { id: "ds-deal-010-client",  dealId: "deal-010", partyId: "party-client-008",      role: "REVENUE_SOURCE",        amount: 84000,  source: "manual",  status: "draft" },
  { id: "ds-deal-010-agent",   dealId: "deal-010", partyId: "party-agent-005",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 43700,  source: "engine", status: "draft" },
  { id: "ds-deal-010-ca-tl",   dealId: "deal-010", partyId: "party-ca-leila-aed",       role: "AGENT_PAYOUT", description: "Team Lead",               amount: 4370,   source: "engine", status: "draft" },
  { id: "ds-deal-010-ca-mgr",  dealId: "deal-010", partyId: "party-ca-karim-aed",       role: "AGENT_PAYOUT", description: "Manager",                 amount: 2185,   source: "engine", status: "draft" },
  { id: "ds-deal-010-conv",    dealId: "deal-010", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,  source: "manual",  status: "draft" },
  { id: "ds-deal-010-demand",  dealId: "deal-010", partyId: "party-client-008",      role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-010-supply",  dealId: "deal-010", partyId: "party-seller-010",      role: "SUPPLY",                                status: "draft" },

  // ── deal-011 ─ invoicing ─ MBU MA/Broker AE AED ─ confirmed ──────────────────────────────────
  // broker-001 (Omar Rahman) · DIB tier 1 0.624% × 1.5M = 9,360
  { id: "ds-deal-011-bank",   dealId: "deal-011", partyId: "party-third-dib",          role: "REVENUE_SOURCE", amount: 18_000, source: "manual",  status: "confirmed" },
  { id: "ds-deal-011-broker", dealId: "deal-011", partyId: "party-broker-omar-rahman", role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 9360,  source: "engine", status: "confirmed" },
  { id: "ds-deal-011-demand", dealId: "deal-011", partyId: "party-client-011",         role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-011-supply", dealId: "deal-011", partyId: "party-third-dib",          role: "SUPPLY",                          status: "confirmed" },

  // ── deal-012 ─ under-review ─ MBU B2C AE AED ─ draft ─────────────────────────────────────────
  // agent-005 · B2C self-sourced Apr 2026 rate 28% · engine estimate: net 8,960
  // (no connected agents — agent-005 has no mbu-direct AF config)
  { id: "ds-deal-012-bank",   dealId: "deal-012", partyId: "party-third-fab",  role: "REVENUE_SOURCE", amount: 32_000, source: "manual",  status: "draft" },
  { id: "ds-deal-012-agent",  dealId: "deal-012", partyId: "party-agent-005",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 8960, source: "engine", status: "draft" },
  { id: "ds-deal-012-demand", dealId: "deal-012", partyId: "party-client-008", role: "DEMAND",                         status: "draft" },
  { id: "ds-deal-012-supply", dealId: "deal-012", partyId: "party-third-fab",  role: "SUPPLY",                         status: "draft" },

  // ── deal-013 ─ pending-agent-approval ─ REBU ES EUR ─ draft ──────────────────────────────────
  // agent-002 45% flat · CB 14,100 · engine estimate: agent net 6,345 · TL 634.50 · Mgr 317.25
  { id: "ds-deal-013-client",  dealId: "deal-013", partyId: "party-client-009",          role: "REVENUE_SOURCE",        amount: 18600,  source: "manual",  status: "draft" },
  { id: "ds-deal-013-subsidy", dealId: "deal-013", partyId: "party-client-009",          role: "ACQUISITION_DEDUCTION", amount: -4500,  source: "manual",  status: "draft" },
  { id: "ds-deal-013-agent",   dealId: "deal-013", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6345,   source: "engine", status: "draft" },
  { id: "ds-deal-013-ca-tl",   dealId: "deal-013", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 634.50, source: "engine", status: "draft" },
  { id: "ds-deal-013-ca-mgr",  dealId: "deal-013", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 317.25, source: "engine", status: "draft" },
  { id: "ds-deal-013-conv",    dealId: "deal-013", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },
  { id: "ds-deal-013-demand",  dealId: "deal-013", partyId: "party-client-009",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-013-supply",  dealId: "deal-013", partyId: "party-seller-013",          role: "SUPPLY",                                status: "draft" },

  // ── deal-014 ─ invoicing ─ MBU direct B2C ES EUR ─ confirmed ─────────────────────────────────
  // agent-001 · B2C self-sourced Apr 2026 rate 28% · gross 2,480 · net 694.40
  { id: "ds-deal-014-bank",   dealId: "deal-014", partyId: "party-third-caixabank", role: "REVENUE_SOURCE", amount: 2480,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-014-agent",  dealId: "deal-014", partyId: "party-agent-001",       role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 694.40, source: "engine", status: "confirmed" },
  { id: "ds-deal-014-demand", dealId: "deal-014", partyId: "party-client-001",      role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-014-supply", dealId: "deal-014", partyId: "party-third-caixabank", role: "SUPPLY",                          status: "confirmed" },

  // ── deal-015 ─ invoicing ─ MBU direct B2C SA SAR ─ confirmed ─────────────────────────────────
  // agent-003 · B2C self-sourced Apr 2026 rate 28% · gross 4,600 · net 1,288
  { id: "ds-deal-015-bank",   dealId: "deal-015", partyId: "party-third-snb",  role: "REVENUE_SOURCE", amount: 4600,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-015-agent",  dealId: "deal-015", partyId: "party-agent-003",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 1288,   source: "engine", status: "confirmed" },
  { id: "ds-deal-015-demand", dealId: "deal-015", partyId: "party-client-003", role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-015-supply", dealId: "deal-015", partyId: "party-third-snb",  role: "SUPPLY",                          status: "confirmed" },

  // ── deal-016 ─ finalized ─ REBU AE AED ─ confirmed ───────────────────────────────────────────
  // agent-004 42% flat · CB (25,200 + 16,800) − 630 = 41,370 · agent net 17,375.40
  // TL (agent-010) 10% = 1,737.54 · Mgr (agent-011) 5% = 868.77
  { id: "ds-deal-016-client",    dealId: "deal-016", partyId: "party-client-007",      role: "REVENUE_SOURCE",        amount: 25200,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-developer", dealId: "deal-016", partyId: "party-third-emaar",     role: "REVENUE_SOURCE",        amount: 16800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-rebate",    dealId: "deal-016", partyId: "party-client-007",      role: "ACQUISITION_DEDUCTION", amount: -630,     source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-agent",     dealId: "deal-016", partyId: "party-agent-004",       role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 17375.40, source: "engine", status: "confirmed" },
  { id: "ds-deal-016-ca-tl",     dealId: "deal-016", partyId: "party-ca-leila-aed",       role: "AGENT_PAYOUT", description: "Team Lead", amount: 1737.54,  source: "engine", status: "confirmed" },
  { id: "ds-deal-016-ca-mgr",    dealId: "deal-016", partyId: "party-ca-karim-aed",       role: "AGENT_PAYOUT", description: "Manager",   amount: 868.77,   source: "engine", status: "confirmed" },
  { id: "ds-deal-016-conv",      dealId: "deal-016", partyId: "party-conv-tamm-legal", role: "OPERATIONAL_DEDUCTION", amount: -3000,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-016-demand",    dealId: "deal-016", partyId: "party-client-007",      role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-016-supply",    dealId: "deal-016", partyId: "party-third-emaar",     role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-017 ─ under-review ─ REBU ES EUR ─ draft ─ 60/40 referral split ─────────────────────
  // agent-001 60%: allocated 9,396.60 → 40% net 3,758.64 · TL 375.86 · Mgr 187.93
  // agent-003 40%: allocated 6,264.40 → 40% net 2,505.76 · TL 250.58 · Mgr 125.29
  { id: "ds-deal-017-client",      dealId: "deal-017", partyId: "party-client-002",          role: "REVENUE_SOURCE",        amount: 15900,   source: "manual",  status: "draft" },
  { id: "ds-deal-017-rebate",      dealId: "deal-017", partyId: "party-client-002",          role: "ACQUISITION_DEDUCTION", amount: -239,    source: "manual",  status: "draft" },
  { id: "ds-deal-017-agent",       dealId: "deal-017", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 60,  amount: 3758.64, source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-tl-a1",   dealId: "deal-017", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead (agent-001)",   amount: 375.86,  source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-mgr-a1",  dealId: "deal-017", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager (agent-001)",     amount: 187.93,  source: "engine", status: "draft" },
  { id: "ds-deal-017-agent-co",    dealId: "deal-017", partyId: "party-agent-003",           role: "AGENT_PAYOUT", splitPercentage: 40,                    amount: 2505.76, source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-tl-a3",   dealId: "deal-017", partyId: "party-ca-majid-sar",           role: "AGENT_PAYOUT", description: "Team Lead (agent-003)",   amount: 250.58,  source: "engine", status: "draft" },
  { id: "ds-deal-017-ca-mgr-a3",  dealId: "deal-017", partyId: "party-ca-karim-aed",           role: "AGENT_PAYOUT", description: "Manager (agent-003)",     amount: 125.29,  source: "engine", status: "draft" },
  { id: "ds-deal-017-conv",        dealId: "deal-017", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "draft" },
  { id: "ds-deal-017-demand",      dealId: "deal-017", partyId: "party-client-002",          role: "DEMAND",                                 status: "draft" },
  { id: "ds-deal-017-supply",      dealId: "deal-017", partyId: "party-dev-neinor",          role: "SUPPLY",                                 status: "draft" },

  // ── deal-018 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  // agent-001 40% flat · CB 31,250 − 7,000 = 24,250 · agent net 9,700
  // TL (agent-008) 10% = 970 · Mgr (agent-009) 5% = 485
  { id: "ds-deal-018-client",  dealId: "deal-018", partyId: "party-client-004",          role: "REVENUE_SOURCE",        amount: 31250,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-018-subsidy", dealId: "deal-018", partyId: "party-client-004",          role: "ACQUISITION_DEDUCTION", amount: -7000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-018-agent",   dealId: "deal-018", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 9700,    source: "engine", status: "confirmed" },
  { id: "ds-deal-018-ca-tl",   dealId: "deal-018", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead", amount: 970,     source: "engine", status: "confirmed" },
  { id: "ds-deal-018-ca-mgr",  dealId: "deal-018", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",   amount: 485,     source: "engine", status: "confirmed" },
  { id: "ds-deal-018-conv",    dealId: "deal-018", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -1200,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-018-demand",  dealId: "deal-018", partyId: "party-client-004",          role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-018-supply",  dealId: "deal-018", partyId: "party-seller-018",          role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-019 ─ canceled (before invoicing) ─ REBU ES EUR ─ draft ─────────────────────────────
  // agent-001 40% flat · CB 5,200 · engine estimate: net 2,080 · TL 208 · Mgr 104
  { id: "ds-deal-019-client",  dealId: "deal-019", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 5200,   source: "manual",  status: "draft" },
  { id: "ds-deal-019-agent",   dealId: "deal-019", partyId: "party-agent-001",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 2080,   source: "engine", status: "draft" },
  { id: "ds-deal-019-ca-tl",   dealId: "deal-019", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead",               amount: 208,    source: "engine", status: "draft" },
  { id: "ds-deal-019-ca-mgr",  dealId: "deal-019", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",                 amount: 104,    source: "engine", status: "draft" },
  { id: "ds-deal-019-conv",    dealId: "deal-019", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,   source: "manual",  status: "draft" },
  { id: "ds-deal-019-demand",  dealId: "deal-019", partyId: "party-client-003",          role: "DEMAND",                                status: "draft" },
  { id: "ds-deal-019-supply",  dealId: "deal-019", partyId: "party-seller-019",          role: "SUPPLY",                                status: "draft" },

  // ── deal-020 ─ finalized ─ REBU AE AED ─ confirmed ───────────────────────────────────────────
  // agent-004 42% flat · CB 24,000 · agent net 10,080
  // TL (agent-010) 10% = 1,008 · Mgr (agent-011) 5% = 504
  { id: "ds-deal-020-developer", dealId: "deal-020", partyId: "party-third-emaar",  role: "REVENUE_SOURCE", amount: 24000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-020-agent",     dealId: "deal-020", partyId: "party-agent-004",    role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 10080,   source: "engine", status: "confirmed" },
  { id: "ds-deal-020-ca-tl",     dealId: "deal-020", partyId: "party-ca-leila-aed",    role: "AGENT_PAYOUT", description: "Team Lead", amount: 1008,    source: "engine", status: "confirmed" },
  { id: "ds-deal-020-ca-mgr",    dealId: "deal-020", partyId: "party-ca-karim-aed",    role: "AGENT_PAYOUT", description: "Manager",   amount: 504,     source: "engine", status: "confirmed" },
  { id: "ds-deal-020-demand",    dealId: "deal-020", partyId: "party-client-008",   role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-020-supply",    dealId: "deal-020", partyId: "party-third-emaar",  role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-021 ─ finalized ─ REBU ES EUR ─ confirmed ───────────────────────────────────────────
  // agent-002 45% flat · CB 14,400 − 600 (referral) = 13,800 · agent net 6,210
  // TL (agent-008) 10% = 621 · Mgr (agent-009) 5% = 310.50
  { id: "ds-deal-021-client",   dealId: "deal-021", partyId: "party-client-003",          role: "REVENUE_SOURCE",        amount: 14400,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-021-referral", dealId: "deal-021", partyId: "party-agent-007",           role: "ACQUISITION_DEDUCTION", amount: -600,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-021-agent",    dealId: "deal-021", partyId: "party-agent-002",           role: "AGENT_PAYOUT", isPrimary: true, splitPercentage: 100, amount: 6210,    source: "engine", status: "confirmed" },
  { id: "ds-deal-021-ca-tl",    dealId: "deal-021", partyId: "party-ca-santiago-eur",           role: "AGENT_PAYOUT", description: "Team Lead", amount: 621,     source: "engine", status: "confirmed" },
  { id: "ds-deal-021-ca-mgr",   dealId: "deal-021", partyId: "party-ca-isabel-eur",           role: "AGENT_PAYOUT", description: "Manager",   amount: 310.50,  source: "engine", status: "confirmed" },
  { id: "ds-deal-021-conv",     dealId: "deal-021", partyId: "party-conv-gestoria-lopez", role: "OPERATIONAL_DEDUCTION", amount: -800,    source: "manual",  status: "confirmed" },
  { id: "ds-deal-021-demand",   dealId: "deal-021", partyId: "party-client-003",          role: "DEMAND",                                  status: "confirmed" },
  { id: "ds-deal-021-supply",   dealId: "deal-021", partyId: "party-dev-neinor",          role: "SUPPLY",                                  status: "confirmed" },

  // ── deal-022 ─ finalized ─ MBU MA/Broker AE AED ─ confirmed ──────────────────────────────────
  // ADIB tier 1 0.663% · Omar 0.663% × 1.68M = 11,138.40 · Khalid 0.663% × 1.12M = 7,425.60
  { id: "ds-deal-022-bank",          dealId: "deal-022", partyId: "party-third-adib",          role: "REVENUE_SOURCE", amount: 35_000,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-022-broker-omar",   dealId: "deal-022", partyId: "party-broker-omar-rahman",  role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 60, amount: 11138.40, source: "engine", status: "confirmed" },
  { id: "ds-deal-022-broker-khalid", dealId: "deal-022", partyId: "party-broker-khalid-assoc", role: "AGENT_PAYOUT",   splitPercentage: 40,        amount: 7425.60,  source: "engine", status: "confirmed" },
  { id: "ds-deal-022-demand",        dealId: "deal-022", partyId: "party-client-012",          role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-022-supply",        dealId: "deal-022", partyId: "party-third-adib",          role: "SUPPLY",                          status: "confirmed" },

  // ── deal-023 ─ invoicing ─ MBU BYOB AE AED ─ confirmed ───────────────────────────────────────
  // (DIB tier 1 0.624% − 0.10% penalty) × 2M = 0.524% × 2M = 10,480
  { id: "ds-deal-023-bank",   dealId: "deal-023", partyId: "party-third-dib",                role: "REVENUE_SOURCE", amount: 22_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-023-broker", dealId: "deal-023", partyId: "party-byob-broker-nadia-hassan", role: "AGENT_PAYOUT",   isPrimary: true, splitPercentage: 100, amount: 10480,   source: "engine", status: "confirmed" },
  { id: "ds-deal-023-demand", dealId: "deal-023", partyId: "party-client-011",               role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-023-supply", dealId: "deal-023", partyId: "party-third-dib",                role: "SUPPLY",                          status: "confirmed" },

  // ── deal-024 ─ invoicing ─ BBG Broker AE AED ─ confirmed ─────────────────────────────────────
  // Manual engine: all payouts declared by ops as fixed amounts. source: "manual" throughout.
  // RM 25% = 12,500 · TL 5% = 2,500 · DS 5% = 2,500 · External 54% = 27,000 · Huspy 11% = 5,500
  { id: "ds-deal-024-bank",   dealId: "deal-024", partyId: "party-third-adib",             role: "REVENUE_SOURCE", amount: 50_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-rm",     dealId: "deal-024", partyId: "party-bbg-rm-layla-nasser",    role: "AGENT_PAYOUT",   isPrimary: true, amount: 12_500,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-tl",     dealId: "deal-024", partyId: "party-bbg-tl-omar-sheikh",     role: "AGENT_PAYOUT",   amount: 2_500,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-ds",     dealId: "deal-024", partyId: "party-bbg-ds-rami-haddad",     role: "AGENT_PAYOUT",   amount: 2_500,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-ext",    dealId: "deal-024", partyId: "party-bbg-ext-falcon-capital", role: "AGENT_PAYOUT",   amount: 27_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-024-demand", dealId: "deal-024", partyId: "party-client-012",             role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-024-supply", dealId: "deal-024", partyId: "party-third-adib",             role: "SUPPLY",                          status: "confirmed" },

  // ── deal-025 ─ invoicing ─ BBG Self-Generated AE AED ─ confirmed ──────────────────────────────
  // Manual: RM 60% = 18,000 · TL 5% = 1,500 · Huspy 35% = 10,500
  { id: "ds-deal-025-bank",   dealId: "deal-025", partyId: "party-third-fab",           role: "REVENUE_SOURCE", amount: 30_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-025-rm",     dealId: "deal-025", partyId: "party-bbg-rm-layla-nasser", role: "AGENT_PAYOUT",   isPrimary: true, amount: 18_000,  source: "manual",  status: "confirmed" },
  { id: "ds-deal-025-tl",     dealId: "deal-025", partyId: "party-bbg-tl-omar-sheikh",  role: "AGENT_PAYOUT",   amount: 1_500,   source: "manual",  status: "confirmed" },
  { id: "ds-deal-025-demand", dealId: "deal-025", partyId: "party-client-011",          role: "DEMAND",                          status: "confirmed" },
  { id: "ds-deal-025-supply", dealId: "deal-025", partyId: "party-third-fab",           role: "SUPPLY",                          status: "confirmed" },
];
