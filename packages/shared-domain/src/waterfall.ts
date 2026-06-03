import type {
  AgentFinancials,
  AgentStrategy,
  Blueprint,
  PnlEntry,
} from "./entities";
import type {
  BusinessUnit,
  CostBucket,
  Country,
  Currency,

} from "./enums";
import { getBlueprint } from "./blueprints";

/**
 * calculateProjectedPnL — pure, functional waterfall engine.
 *
 * Operates exclusively on tax-exclusive amounts. Tax is NOT deducted inside
 * the engine — it is emitted as a separate PostingLine by draftPostings using
 * blueprint.taxRate (hitting LIAB_VAT_{CUR}).
 *
 * Waterfall flow:
 *   REVENUE_SOURCE stakes — positive = commission charged; negative = rebate/discount on client invoice
 *     − ACQUISITION_DEDUCTION stakes (co-brokers, external referrals that reduce the commission pool)
 *   = Commission Base  ← agent splits applied here
 *     − AGENT_PAYOUT per agent (strategy-derived)
 *   = Huspy Gross Share
 *     − OPERATIONAL_DEDUCTION stakes (Huspy-borne service costs, NOT shared with agents)
 *   = Huspy Net Margin
 *
 * Agent split percentages are read from PnlEntry.splitPercentage.
 * [TO BE DETERMINED] These will migrate to an Offer entity once that entity exists.
 */

// ─── Public types ────────────────────────────────────────────────────────────

export interface ProjectedAgentSplit {
  agentId: string;
  partyId: string;
  /** Agent's share of the commission pool (PnlEntry.splitPercentage / 100). */
  shareOfPool: number;
  /** Agent's share of the commission base (= commissionBase × shareOfPool). */
  allocatedNet: number;
  /** Agent payout after applying their AgentStrategy and subtracting any agent-sourced deductions.
   *  This is what the agent actually receives. */
  agentPayout: number;
  /** Deductions sourced from this agent's commission pool (referrals, costs the agent absorbs).
   *  Each item becomes a separate payable to the third party. */
  agentSourcedDeductions: Array<{ partyId: string; label: string; amount: number }>;
  /** Overhead payouts for connected agents (team leads, managers, etc.) — Huspy-borne, additive. */
  connectedAgentPayouts: Array<{ agentId: string; label: string; amount: number; ledgerId?: number }>;
  strategyKind: AgentStrategy["kind"];
}

export interface LedgerEntry {
  id: string;
  label: string;
  bucket?: CostBucket;
  side: "DEBIT" | "CREDIT";
  amount: number;
  partyId?: string;
}

export interface ProjectedPnL {
  blueprintId: string;
  currency: Currency;
  grossRevenue: number;
  totalAcquisitionCost: number;
  /** gross − acquisitionCost: the base on which all agent splits are calculated. */
  commissionBase: number;
  totalOperationalCost: number;
  totalAgentPayout: number;
  huspyMargin: number;
  splits: ProjectedAgentSplit[];
  ledger: LedgerEntry[];
}

export interface ProjectedPnLInput {
  country: Country;
  businessUnit: BusinessUnit;

  currency: Currency;
  grossRevenue: number;
  /**
   * When set, agent allocations are computed as `agentPayoutBase × shareOfPool` instead of
   * `commissionBase × shareOfPool`. Used for MBU MA/Broker channel where broker payout is
   * a % of the disbursed mortgage amount, not of Huspy's gross revenue.
   */
  agentPayoutBase?: number;
  stakeholders: PnlEntry[];
  agentFinancialsByAgentId: Record<string, AgentFinancials>;
  partyIdToAgentId: Record<string, string>;
  blueprint?: Blueprint;
  partyDisplayNames?: Record<string, string>;
  /**
   * @deprecated Pass rebates/subsidies as ACQUISITION_DEDUCTION stakeholders instead.
   * Kept for backward compatibility with the deal creation wizard.
   */
  reductions?: Array<{ label: string; amount: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyAgentStrategy(strategy: AgentStrategy, allocatedNet: number): number {
  switch (strategy.kind) {
    case "flat":
      return Math.max(0, (strategy.pct / 100) * allocatedNet);
    case "max": {
      const raw = (strategy.pct / 100) * allocatedNet;
      return Math.max(0, Math.min(raw, strategy.capAmount));
    }
    case "slab": {
      let remaining = Math.max(0, allocatedNet);
      let prevCeiling = 0;
      let payout = 0;
      for (const slab of strategy.slabs) {
        const ceiling = slab.upTo ?? Number.POSITIVE_INFINITY;
        const slabSize = ceiling - prevCeiling;
        const slice = Math.min(remaining, slabSize);
        if (slice <= 0) break;
        payout += (slab.pct / 100) * slice;
        remaining -= slice;
        prevCeiling = ceiling;
        if (remaining <= 0) break;
      }
      return Math.max(0, payout);
    }
  }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export function calculateProjectedPnL(input: ProjectedPnLInput): ProjectedPnL {
  const blueprint = input.blueprint ?? getBlueprint(input.country, input.businessUnit);
  const ledger: LedgerEntry[] = [];

  // ── Step 1: Commissionable Gross ─────────────────────────────────────────
  // All REVENUE_SOURCE stakes are summed: positive = commission, negative = client rebate/discount.
  // Rebates reduce gross directly and appear as line items on the client's invoice.
  const payerStakes = input.stakeholders.filter((s) => s.role === "REVENUE_SOURCE");
  const hasExplicitPayers = payerStakes.some((s) => s.amount != null);
  const gross = hasExplicitPayers
    ? Math.max(0, payerStakes.reduce((s, p) => s + (p.amount ?? 0), 0))
    : Math.max(0, input.grossRevenue);

  if (hasExplicitPayers) {
    payerStakes.forEach((stake, idx) => {
      const name = input.partyDisplayNames?.[stake.partyId] ?? "Payer";
      const stakeAmt = stake.amount ?? 0;
      ledger.push({
        id: `gross::${idx}`,
        label: name,
        side: stakeAmt >= 0 ? "CREDIT" : "DEBIT",
        amount: Math.abs(stakeAmt),
        partyId: stake.partyId,
      });
    });
  } else {
    ledger.push({ id: "gross", label: "Gross Commission", side: "CREDIT", amount: gross });
  }

  // ── Step 2: Deductions ───────────────────────────────────────────────────
  let totalAcquisitionCost = 0;
  let totalOperationalCost = 0;

  for (const stake of input.stakeholders) {
    if (stake.parentEntryId) continue; // child of an agent stake — handled in Step 3
    if (stake.role === "ACQUISITION_DEDUCTION") {
      const deductAmt = Math.abs(stake.amount ?? 0);
      if (deductAmt === 0) continue;
      totalAcquisitionCost += deductAmt;
      const name = input.partyDisplayNames?.[stake.partyId] ?? stake.partyId;
      ledger.push({ id: `acq::${stake.id}`, label: name, bucket: "acquisition-cost", side: "DEBIT", amount: deductAmt, partyId: stake.partyId });
    } else if (stake.role === "OPERATIONAL_DEDUCTION") {
      const deductAmt = Math.abs(stake.amount ?? 0);
      if (deductAmt === 0) continue;
      totalOperationalCost += deductAmt;
      const name = input.partyDisplayNames?.[stake.partyId] ?? stake.partyId;
      ledger.push({ id: `ops::${stake.id}`, label: name, bucket: "operational-cost", side: "DEBIT", amount: deductAmt, partyId: stake.partyId });
    }
  }

  // Legacy convenience reductions (rebates/subsidies from deal wizard).
  for (const r of input.reductions ?? []) {
    if (r.amount <= 0) continue;
    totalAcquisitionCost += r.amount;
    ledger.push({ id: `red::${r.label}`, label: r.label, bucket: "acquisition-cost", side: "DEBIT", amount: r.amount });
  }

  // commissionBase = gross − acquisitionCost: this is what agent splits are calculated on.
  // operationalCost is Huspy-only and does NOT reduce the agent commission pool.
  const commissionBase = gross - totalAcquisitionCost;

  // ── Step 3: Agent payouts ────────────────────────────────────────────────
  const agentStakes = input.stakeholders.filter((s) => s.role === "AGENT_PAYOUT");
  const splits: ProjectedAgentSplit[] = [];
  let totalAgentPayout = 0;

  for (const stake of agentStakes) {
    const agentId = input.partyIdToAgentId[stake.partyId];
    const af = agentId ? input.agentFinancialsByAgentId[agentId] : undefined;

    // Fixed-amount path: use amount directly when it was manually set OR the stake is confirmed.
    // Draft engine-computed amounts (source === "engine" + status === "draft") are re-derived live.
    const useFixed = stake.amount != null && (stake.source === "manual" || stake.status === "confirmed");
    if (useFixed) {
      const agentPayout = Math.abs(stake.amount!);
      const effectiveId = agentId ?? stake.partyId;
      const name = input.partyDisplayNames?.[stake.partyId] ?? effectiveId;
      splits.push({ agentId: effectiveId, partyId: stake.partyId, shareOfPool: 1, allocatedNet: agentPayout, agentPayout, agentSourcedDeductions: [], connectedAgentPayouts: [], strategyKind: "flat" });
      ledger.push({ id: `int::${stake.id}::agent`, label: `${name} — fixed payout`, bucket: "agent-payout", side: "DEBIT", amount: agentPayout, partyId: stake.partyId });
      totalAgentPayout += agentPayout;
      continue;
    }

    if (!agentId || !af) continue;

    const shareOfPool = (stake.splitPercentage ?? 100) / 100;
    const allocatedNet = (input.agentPayoutBase ?? commissionBase) * shareOfPool;
    const agentGrossPayout = applyAgentStrategy(af.strategy, allocatedNet);

    // Agent-borne costs: child stakes whose parentEntryId points to this agent stake.
    const childStakes = input.stakeholders.filter((s) => s.parentEntryId === stake.id);
    const agentSourcedDeductions: ProjectedAgentSplit["agentSourcedDeductions"] = [];
    for (const child of childStakes) {
      const childAmount = Math.abs(child.amount ?? 0);
      if (childAmount <= 0) continue;
      const childName = input.partyDisplayNames?.[child.partyId] ?? child.partyId;
      const childLabel = child.description ? `${childName} — ${child.description}` : childName;
      agentSourcedDeductions.push({ partyId: child.partyId, label: childLabel, amount: childAmount });
      ledger.push({ id: `agtsub::${child.id}`, label: childLabel, bucket: "agent-payout", side: "DEBIT", amount: childAmount, partyId: child.partyId });
    }
    const agentBorneCostsTotal = agentSourcedDeductions.reduce((s, d) => s + d.amount, 0);

    // Connected agents (TL, manager, etc.) are Huspy-borne additive costs.
    // Their base is the agent's net after their own borne costs (not the gross).
    const agentNetForHierarchy = Math.max(0, agentGrossPayout - agentBorneCostsTotal);
    const connectedAgentPayouts = (af.connectedAgents ?? []).map((ca) => ({
      agentId: ca.agentId,
      label: ca.label,
      amount: (ca.rate / 100) * agentNetForHierarchy,
      ledgerId: ca.ledgerId,
    }));
    const totalConnectedPayout = connectedAgentPayouts.reduce((s, p) => s + p.amount, 0);
    const agentPayout = agentNetForHierarchy;

    splits.push({ agentId, partyId: stake.partyId, shareOfPool, allocatedNet, agentPayout, agentSourcedDeductions, connectedAgentPayouts, strategyKind: af.strategy.kind });

    const name = input.partyDisplayNames?.[stake.partyId] ?? agentId;
    ledger.push({ id: `int::${stake.id}::agent`, label: `${name} — commission (${af.strategy.kind})`, bucket: "agent-payout", side: "DEBIT", amount: agentPayout, partyId: stake.partyId });
    for (const cp of connectedAgentPayouts) {
      if (cp.amount > 0) {
        ledger.push({ id: `int::${stake.id}::ca::${cp.agentId}`, label: cp.label, bucket: "agent-payout", side: "DEBIT", amount: cp.amount });
      }
    }

    totalAgentPayout += agentGrossPayout + totalConnectedPayout;
  }

  const huspyMargin = commissionBase - totalOperationalCost - totalAgentPayout;

  return {
    blueprintId: blueprint.id,
    currency: input.currency,
    grossRevenue: gross,
    totalAcquisitionCost,
    commissionBase,
    totalOperationalCost,
    totalAgentPayout,
    huspyMargin,
    splits,
    ledger,
  };
}
