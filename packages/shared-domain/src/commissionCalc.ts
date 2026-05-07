/**
 * HUSPY COMMISSION MODEL
 * ======================
 *
 * This module is the single source of truth for deal P&L calculations.
 * Both Karvel (back-office) and the Agent App derive their numbers from here.
 *
 * ─── Revenue chain ────────────────────────────────────────────────────────
 *
 *   Deal amount (e.g. €385 000)
 *       × take rate (3%)
 *       = huspyRevenue (€11 550)  ← what Huspy invoices the client
 *
 *   huspyRevenue splits into two buckets:
 *     a) Conveyance bucket  (12.5% of huspyRevenue = €1 444)
 *        — covers legal / title-transfer costs
 *     b) Net commission     (87.5% of huspyRevenue = €10 106)
 *        — main brokerage income
 *
 * ─── Net commission distribution ─────────────────────────────────────────
 *
 *   Agent gross payout    = agentGrossRate (40%) × huspyRevenue        = €4 620
 *   Team lead share       = teamLeadRate (10%) × agentGrossPayout      = €462
 *   Manager override      = managerOverrideRate (5%) × agentGrossPayout= €231
 *
 *   IMPORTANT — TL and manager are Huspy-borne costs, additive on top of
 *   the agent payout. The agent always receives the full agentGrossPayout
 *   regardless of whether a TL or manager is assigned.
 *   → If TL or manager are absent (rates = 0), their shares are retained
 *     by Huspy. Removing them never reduces the agent's earnings and never
 *     makes the deal negative for Huspy.
 *
 * ─── Conveyance distribution ─────────────────────────────────────────────
 *
 *   External conveyance agent = conveyanceAgentRate (25%) × conveyanceRevenue
 *   Huspy conveyance share    = remaining 75% × conveyanceRevenue
 *
 * ─── Full P&L (all roles present) ─────────────────────────────────────────
 *
 *   huspyRevenue                               100.000%   €11 550
 *     Agent payout           40% × rev        - 40.000%  - €4 620
 *     Team lead              10% × agent      -  4.000%  -   €462
 *     Manager override        5% × agent      -  2.000%  -   €231
 *     Conveyance agent       25% × conv.      -  3.125%  -   €361
 *     ─────────────────────────────────────────────────────────────
 *     Huspy net                                  50.875%    €5 876
 *
 * ─── Safety invariant ────────────────────────────────────────────────────
 *
 *   Huspy is at risk only if total outflows exceed 100% of huspyRevenue:
 *     agentGrossRate × (1 + teamLeadRate/100 + managerOverrideRate/100)
 *       + conveyanceAgentRate/100 × conveyanceSplit/100  >  1
 *
 *   With current defaults:
 *     0.40 × (1 + 0.10 + 0.05) + 0.25 × 0.125
 *     = 0.40 × 1.15 + 0.03125
 *     = 0.46 + 0.03125 = 0.491  ✓  (well below 1)
 *
 *   The model becomes unsafe only if agentGrossRate is pushed above ~87%.
 *
 * ─── Agent App vs Karvel ─────────────────────────────────────────────────
 *
 *   Agent App  → shows `commissionAmount` = agentCommissionPayout
 *                (what the agent actually receives in cash)
 *
 *   Karvel     → shows the full P&L: huspyRevenue, each payout line, huspyNet
 *                Postings crystallise agentCommissionPayout via `soa_approved`
 *                (see posting-003 / pline-003-2 for a worked example)
 */

// ─── Rate constants ───────────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  /** % Huspy charges the client on the deal amount */
  takeRate: 3,
  /** % of huspyRevenue allocated to the conveyance (legal/transfer) bucket */
  conveyanceSplit: 12.5,
  /** % of huspyRevenue paid to the agent — guaranteed, not reduced by TL/manager */
  agentGrossRate: 40,
  /** % of agentGrossPayout passed to the team lead (Huspy-borne overhead) */
  teamLeadRate: 10,
  /** % of agentGrossPayout passed to the manager (Huspy-borne overhead) */
  managerOverrideRate: 5,
  /** % of conveyanceRevenue paid to the external conveyance agent */
  conveyanceAgentRate: 25,
} as const;

// ─── Output type ──────────────────────────────────────────────────────────────

export interface DealFinancials {
  /** Gross commission Huspy earns from the client */
  huspyRevenue: number;
  /** huspyRevenue minus the conveyance bucket — main brokerage income */
  netHuspyRevenue: number;
  /** Portion of huspyRevenue earmarked for legal/title-transfer costs */
  conveyanceRevenue: number;
  /** Cash paid to the agent (40% of huspyRevenue) */
  agentCommissionPayout: number;
  /** Cash paid to the team lead (10% of agentCommissionPayout, Huspy-borne) */
  teamLeadShare: number;
  /** Cash paid to the manager (5% of agentCommissionPayout, Huspy-borne) */
  managerOverride: number;
  /** Cash paid to the external conveyance agent (25% of conveyanceRevenue) */
  conveyanceAgentPayout: number;
  /** Conveyance revenue retained by Huspy (75% of conveyanceRevenue) */
  huspyConveyanceShare: number;
  /** Sum of all outflows: agent + TL + manager + conveyanceAgent */
  cogsInternal: number;
  /** huspyRevenue minus all outflows — Huspy's retained margin */
  huspyNet: number;
}

// ─── Calculation function ─────────────────────────────────────────────────────

export function computeDealFinancials(
  dealAmount: number,
  overrides?: Partial<typeof COMMISSION_RATES>,
): DealFinancials {
  const rates = { ...COMMISSION_RATES, ...overrides };

  const huspyRevenue = dealAmount * (rates.takeRate / 100);
  const conveyanceRevenue = huspyRevenue * (rates.conveyanceSplit / 100);
  const netHuspyRevenue = huspyRevenue - conveyanceRevenue;

  const agentCommissionPayout = huspyRevenue * (rates.agentGrossRate / 100);
  const teamLeadShare = agentCommissionPayout * (rates.teamLeadRate / 100);
  const managerOverride = agentCommissionPayout * (rates.managerOverrideRate / 100);

  const conveyanceAgentPayout = conveyanceRevenue * (rates.conveyanceAgentRate / 100);
  const huspyConveyanceShare = conveyanceRevenue - conveyanceAgentPayout;

  const cogsInternal = agentCommissionPayout + teamLeadShare + managerOverride + conveyanceAgentPayout;
  const huspyNet = huspyRevenue - cogsInternal;

  return {
    huspyRevenue,
    netHuspyRevenue,
    conveyanceRevenue,
    agentCommissionPayout,
    teamLeadShare,
    managerOverride,
    conveyanceAgentPayout,
    huspyConveyanceShare,
    cogsInternal,
    huspyNet,
  };
}
