import type {
  AgentFinancials,
  AgentStrategy,
  Blueprint,
  DealStakeholder,
  Opportunity,
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
 * blueprint.taxRate (hitting LIAB_STATUTORY_TAX_{CUR}).
 *
 * Waterfall flow:
 *   REVENUE_SOURCE stakes (or grossRevenue fallback)
 *     − ACQUISITION_DEDUCTION stakes (Bucket C: referrals, rebates)
 *     − OPERATIONAL_DEDUCTION stakes (Bucket D: notaries, conveyance)
 *   = Net Basis
 *     − INTERNAL_PAYOUT per agent (Bucket B: strategy-derived)
 *   = Huspy Margin
 *
 * Agent split percentages are read from DealStakeholder.splitPercentage.
 * [TO BE DETERMINED] These will migrate to an Offer entity once that entity exists.
 */

// ─── Public types ────────────────────────────────────────────────────────────

export interface ProjectedAgentSplit {
  agentId: string;
  partyId: string;
  /** Agent's share of the commission pool (DealStakeholder.splitPercentage / 100). */
  shareOfPool: number;
  /** Net basis allocated to this agent (= netRevenue × shareOfPool). */
  allocatedNet: number;
  /** Agent payout after applying their AgentStrategy. */
  agentPayout: number;
  /** Team-lead payout (% of agentPayout, Huspy-borne, additive). */
  teamLeadPayout: number;
  /** Manager override payout (% of agentPayout, Huspy-borne, additive). */
  managerPayout: number;
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
  /** Always 0 — tax is routed to LIAB_STATUTORY_TAX via draftPostings, not the waterfall. */
  totalBucketA: 0;
  totalBucketC: number;
  totalBucketD: number;
  netRevenue: number;
  totalBucketB: number;
  huspyMargin: number;
  splits: ProjectedAgentSplit[];
  ledger: LedgerEntry[];
}

export interface ProjectedPnLInput {
  opportunity?: Pick<Opportunity, "id" | "country">;
  country: Country;
  businessUnit: BusinessUnit;

  currency: Currency;
  grossRevenue: number;
  stakeholders: DealStakeholder[];
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
  const payerStakes = input.stakeholders.filter(
    (s) => s.role === "REVENUE_SOURCE" && (s.financialAmount ?? 0) > 0,
  );
  const gross =
    payerStakes.length > 0
      ? Math.max(0, payerStakes.reduce((s, p) => s + (p.financialAmount ?? 0), 0))
      : Math.max(0, input.grossRevenue);

  if (payerStakes.length > 0) {
    payerStakes.forEach((stake, idx) => {
      const name = input.partyDisplayNames?.[stake.partyId] ?? "Payer";
      ledger.push({
        id: `gross::${idx}`,
        label: name,
        side: "CREDIT",
        amount: Math.max(0, stake.financialAmount ?? 0),
        partyId: stake.partyId,
      });
    });
  } else {
    ledger.push({ id: "gross", label: "Gross Commission", side: "CREDIT", amount: gross });
  }

  // ── Step 2: Deductions ───────────────────────────────────────────────────
  let totalC = 0;
  let totalD = 0;

  for (const stake of input.stakeholders) {
    if (stake.role === "ACQUISITION_DEDUCTION") {
      const amount = Math.abs(stake.financialAmount ?? 0);
      if (amount === 0) continue;
      totalC += amount;
      const name = input.partyDisplayNames?.[stake.partyId] ?? stake.partyId;
      ledger.push({ id: `acq::${stake.id}`, label: name, bucket: "C", side: "DEBIT", amount, partyId: stake.partyId });
    } else if (stake.role === "OPERATIONAL_DEDUCTION") {
      const amount = Math.abs(stake.financialAmount ?? 0);
      if (amount === 0) continue;
      totalD += amount;
      const name = input.partyDisplayNames?.[stake.partyId] ?? stake.partyId;
      ledger.push({ id: `ops::${stake.id}`, label: name, bucket: "D", side: "DEBIT", amount, partyId: stake.partyId });
    }
  }

  // Legacy convenience reductions (rebates/subsidies from deal wizard).
  for (const r of input.reductions ?? []) {
    if (r.amount <= 0) continue;
    totalC += r.amount;
    ledger.push({ id: `red::${r.label}`, label: r.label, bucket: "C", side: "DEBIT", amount: r.amount });
  }

  const netRevenue = gross - totalC - totalD;
  ledger.push({ id: "net", label: "Net Revenue", side: "CREDIT", amount: netRevenue });

  // ── Step 3: Internal splits (INTERNAL_PAYOUT / Bucket B) ─────────────────
  const agentStakes = input.stakeholders.filter((s) => s.role === "INTERNAL_PAYOUT");
  const splits: ProjectedAgentSplit[] = [];
  let totalB = 0;

  for (const stake of agentStakes) {
    const agentId = input.partyIdToAgentId[stake.partyId];
    if (!agentId) continue;
    const af = input.agentFinancialsByAgentId[agentId];
    if (!af) continue;

    const shareOfPool = (stake.splitPercentage ?? 100) / 100;
    const allocatedNet = netRevenue * shareOfPool;
    const agentPayout = applyAgentStrategy(af.strategy, allocatedNet);
    const teamLeadPayout = ((af.teamLeadRate ?? 0) / 100) * agentPayout;
    const managerPayout = ((af.managerRate ?? 0) / 100) * agentPayout;

    splits.push({ agentId, partyId: stake.partyId, shareOfPool, allocatedNet, agentPayout, teamLeadPayout, managerPayout, strategyKind: af.strategy.kind });

    const name = input.partyDisplayNames?.[stake.partyId] ?? agentId;
    ledger.push({ id: `int::${stake.id}::agent`, label: `${name} — commission (${af.strategy.kind})`, bucket: "B", side: "DEBIT", amount: agentPayout, partyId: stake.partyId });
    if (teamLeadPayout > 0) {
      ledger.push({ id: `int::${stake.id}::tl`, label: `Team-lead (${af.teamLeadRate ?? 0}%)`, bucket: "B", side: "DEBIT", amount: teamLeadPayout });
    }
    if (managerPayout > 0) {
      ledger.push({ id: `int::${stake.id}::mgr`, label: `Manager (${af.managerRate ?? 0}%)`, bucket: "B", side: "DEBIT", amount: managerPayout });
    }

    totalB += agentPayout + teamLeadPayout + managerPayout;
  }

  const huspyMargin = netRevenue - totalB;

  return {
    blueprintId: blueprint.id,
    currency: input.currency,
    grossRevenue: gross,
    totalBucketA: 0,
    totalBucketC: totalC,
    totalBucketD: totalD,
    netRevenue,
    totalBucketB: totalB,
    huspyMargin,
    splits,
    ledger,
  };
}
