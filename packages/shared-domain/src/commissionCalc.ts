/**
 * HUSPY COMMISSION MODEL
 * ======================
 *
 * This module is the single source of truth for deal P&L calculations.
 * Both Karvel (back-office) and the Agent App derive their numbers from here.
 *
 * ─── Revenue chain ────────────────────────────────────────────────────────
 *
 *   Total Huspy Revenue = Deal Income + Conveyance Fee (Form F)
 *
 *   Deal Income  = dealAmount × takeRate (3%)          e.g. €11 550 on a €385k deal
 *   Conveyance   = separate fee from Form F            e.g. €1 500 (independent of deal size)
 *   totalRevenue = dealIncome + conveyanceFee
 *
 * ─── Net commission distribution ─────────────────────────────────────────
 *
 *   Agent gross payout    = agentGrossRate (40%) × dealIncome           = €4 620
 *   Team lead share       = teamLeadRate (10%) × agentGrossPayout       = €462
 *   Manager override      = managerOverrideRate (5%) × agentGrossPayout = €231
 *
 *   IMPORTANT — TL and manager are Huspy-borne costs, additive on top of
 *   the agent payout. The agent always receives the full agentGrossPayout
 *   regardless of whether a TL or manager is assigned.
 *
 * ─── Conveyance distribution ─────────────────────────────────────────────
 *
 *   External conveyance agent = conveyanceAgentRate (25%) × conveyanceFee
 *   Huspy conveyance share    = remaining 75% × conveyanceFee
 *
 * ─── Full P&L example (conveyanceFee = €1 500) ────────────────────────────
 *
 *   Deal Income                                         €11 550
 *   Conveyance Fee                                    +  €1 500
 *   Total Revenue                                       €13 050
 *     Agent payout           40% × dealIncome         -  €4 620
 *     Team lead              10% × agent payout       -    €462
 *     Manager override        5% × agent payout       -    €231
 *     Conveyance agent       25% × conveyanceFee      -    €375
 *     ─────────────────────────────────────────────────────────────
 *     Huspy net                                          €7 362
 *
 * ─── Agent App vs Karvel ─────────────────────────────────────────────────
 *
 *   Agent App  → shows `commissionAmount` = agentCommissionPayout
 *                (what the agent actually receives in cash, based on dealIncome only)
 *
 *   Karvel     → shows the full P&L: dealIncome, conveyanceFee, totalRevenue,
 *                each payout line, huspyNet
 */

// ─── Rate constants ───────────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  /** % Huspy charges the client on the deal amount */
  takeRate: 3,
  /** % of dealIncome (huspyRevenue) paid to the agent — guaranteed, not reduced by TL/manager */
  agentGrossRate: 40,
  /** % of agentGrossPayout passed to the team lead (Huspy-borne overhead) */
  teamLeadRate: 10,
  /** % of agentGrossPayout passed to the manager (Huspy-borne overhead) */
  managerOverrideRate: 5,
  /** % of conveyanceFee paid to the external conveyance agent */
  conveyanceAgentRate: 25,
} as const;

// ─── Output type ──────────────────────────────────────────────────────────────

export interface DealFinancials {
  /** Brokerage commission: dealAmount × takeRate */
  huspyRevenue: number;
  /** Separate conveyance fee from Form F (not derived from deal size) */
  conveyanceFee: number;
  /** Total Huspy revenue = huspyRevenue + conveyanceFee */
  totalRevenue: number;
  /** Cash paid to the agent (agentGrossRate% of huspyRevenue) */
  agentCommissionPayout: number;
  /** Cash paid to the team lead (teamLeadRate% of agentCommissionPayout, Huspy-borne) */
  teamLeadShare: number;
  /** Cash paid to the manager (managerOverrideRate% of agentCommissionPayout, Huspy-borne) */
  managerOverride: number;
  /** Cash paid to the external conveyance agent (conveyanceAgentRate% of conveyanceFee) */
  conveyanceAgentPayout: number;
  /** Conveyance fee retained by Huspy */
  huspyConveyanceShare: number;
  /** Sum of all outflows: agent + TL + manager + conveyanceAgent */
  cogsInternal: number;
  /** totalRevenue minus all outflows — Huspy's retained margin */
  huspyNet: number;
}

// ─── Calculation function ─────────────────────────────────────────────────────

export function computeDealFinancials(
  dealAmount: number,
  conveyanceFee = 0,
  overrides?: Partial<Record<keyof typeof COMMISSION_RATES, number>>,
): DealFinancials {
  const rates = { ...COMMISSION_RATES, ...overrides };

  const huspyRevenue = dealAmount * (rates.takeRate / 100);
  const totalRevenue = huspyRevenue + conveyanceFee;

  const agentCommissionPayout = huspyRevenue * (rates.agentGrossRate / 100);
  const teamLeadShare = agentCommissionPayout * (rates.teamLeadRate / 100);
  const managerOverride = agentCommissionPayout * (rates.managerOverrideRate / 100);

  const conveyanceAgentPayout = conveyanceFee * (rates.conveyanceAgentRate / 100);
  const huspyConveyanceShare = conveyanceFee - conveyanceAgentPayout;

  const cogsInternal = agentCommissionPayout + teamLeadShare + managerOverride + conveyanceAgentPayout;
  const huspyNet = totalRevenue - cogsInternal;

  return {
    huspyRevenue,
    conveyanceFee,
    totalRevenue,
    agentCommissionPayout,
    teamLeadShare,
    managerOverride,
    conveyanceAgentPayout,
    huspyConveyanceShare,
    cogsInternal,
    huspyNet,
  };
}
