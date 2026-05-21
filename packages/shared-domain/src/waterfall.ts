import type {
  AgentFinancials,
  AgentStrategy,
  Blueprint,
  DealStakeholder,
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
 *     − ACQUISITION_DEDUCTION stakes (Bucket C: co-brokers, external referrals Huspy pays)
 *   = Commission Base  ← agent splits applied here
 *     − AGENT_PAYOUT per agent (Bucket B: strategy-derived)
 *   = Huspy Gross Share
 *     − OPERATIONAL_DEDUCTION stakes (Bucket D: Huspy operational costs, NOT shared with agents)
 *   = Huspy Net Margin
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
  /** Agent's share of the commission base (= commissionBase × shareOfPool). */
  allocatedNet: number;
  /** Agent payout after applying their AgentStrategy and subtracting any agent-sourced deductions.
   *  This is what the agent actually receives. */
  agentPayout: number;
  /** Deductions sourced from this agent's commission pool (referrals, costs the agent absorbs).
   *  Each item becomes a separate payable to the third party. */
  agentSourcedDeductions: Array<{ partyId: string; label: string; amount: number }>;
  /** Team-lead payout (% of gross agent payout before sourced deductions, Huspy-borne, additive). */
  teamLeadPayout: number;
  /** Manager override payout (% of gross agent payout before sourced deductions, Huspy-borne, additive). */
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
  /** Always 0 — tax is routed to LIAB_VAT via draftPostings, not the waterfall. */
  totalBucketA: 0;
  totalBucketC: number;
  /** gross − C: the base on which all agent splits are calculated. */
  commissionBase: number;
  totalBucketD: number;
  totalBucketB: number;
  huspyMargin: number;
  splits: ProjectedAgentSplit[];
  ledger: LedgerEntry[];
}

export interface ProjectedPnLInput {
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
  // All REVENUE_SOURCE stakes are summed: positive = commission, negative = client rebate/discount.
  // Rebates reduce gross directly and appear as line items on the client's invoice.
  const payerStakes = input.stakeholders.filter((s) => s.role === "REVENUE_SOURCE");
  const hasExplicitPayers = payerStakes.some((s) => s.financialAmount != null);
  const gross = hasExplicitPayers
    ? Math.max(0, payerStakes.reduce((s, p) => s + (p.financialAmount ?? 0), 0))
    : Math.max(0, input.grossRevenue);

  if (hasExplicitPayers) {
    payerStakes.forEach((stake, idx) => {
      const name = input.partyDisplayNames?.[stake.partyId] ?? "Payer";
      const amt = stake.financialAmount ?? 0;
      ledger.push({
        id: `gross::${idx}`,
        label: name,
        side: amt >= 0 ? "CREDIT" : "DEBIT",
        amount: Math.abs(amt),
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
    if (stake.parentStakeholderId) continue; // child of an agent stake — handled in Step 3
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

  // commissionBase = gross − C: this is what agent splits are calculated on.
  // D is a Huspy-only cost and does NOT reduce the agent commission pool.
  const commissionBase = gross - totalC;

  // ── Step 3: Internal splits (AGENT_PAYOUT / Bucket B) ─────────────────
  const agentStakes = input.stakeholders.filter((s) => s.role === "AGENT_PAYOUT");
  const splits: ProjectedAgentSplit[] = [];
  let totalB = 0;

  for (const stake of agentStakes) {
    const agentId = input.partyIdToAgentId[stake.partyId];
    if (!agentId) continue;
    const af = input.agentFinancialsByAgentId[agentId];
    if (!af) continue;

    const shareOfPool = (stake.splitPercentage ?? 100) / 100;
    const allocatedNet = commissionBase * shareOfPool;
    const agentGrossPayout = applyAgentStrategy(af.strategy, allocatedNet);

    // Agent-borne costs: child stakes whose parentStakeholderId points to this agent stake.
    const childStakes = input.stakeholders.filter((s) => s.parentStakeholderId === stake.id);
    const agentSourcedDeductions: ProjectedAgentSplit["agentSourcedDeductions"] = [];
    for (const child of childStakes) {
      const childAmount = Math.abs(child.financialAmount ?? 0);
      if (childAmount <= 0) continue;
      const childName = input.partyDisplayNames?.[child.partyId] ?? child.partyId;
      const childLabel = child.description ? `${childName} — ${child.description}` : childName;
      agentSourcedDeductions.push({ partyId: child.partyId, label: childLabel, amount: childAmount });
      ledger.push({ id: `agtsub::${child.id}`, label: childLabel, bucket: "B", side: "DEBIT", amount: childAmount, partyId: child.partyId });
    }
    const agentBorneCostsTotal = agentSourcedDeductions.reduce((s, d) => s + d.amount, 0);

    // TL and Mgr are Huspy-borne additive costs — they don't reduce the agent's take-home.
    // Their base is the agent's net after their own borne costs (not the gross).
    const agentNetForHierarchy = Math.max(0, agentGrossPayout - agentBorneCostsTotal);
    const teamLeadPayout = ((af.teamLeadRate ?? 0) / 100) * agentNetForHierarchy;
    const managerPayout = ((af.managerRate ?? 0) / 100) * agentNetForHierarchy;
    const agentPayout = agentNetForHierarchy;

    splits.push({ agentId, partyId: stake.partyId, shareOfPool, allocatedNet, agentPayout, agentSourcedDeductions, teamLeadPayout, managerPayout, strategyKind: af.strategy.kind });

    const name = input.partyDisplayNames?.[stake.partyId] ?? agentId;
    ledger.push({ id: `int::${stake.id}::agent`, label: `${name} — commission (${af.strategy.kind})`, bucket: "B", side: "DEBIT", amount: agentPayout, partyId: stake.partyId });
    if (teamLeadPayout > 0) {
      ledger.push({ id: `int::${stake.id}::tl`, label: `Team-lead (${af.teamLeadRate ?? 0}%)`, bucket: "B", side: "DEBIT", amount: teamLeadPayout });
    }
    if (managerPayout > 0) {
      ledger.push({ id: `int::${stake.id}::mgr`, label: `Manager (${af.managerRate ?? 0}%)`, bucket: "B", side: "DEBIT", amount: managerPayout });
    }

    // totalB = agentPayout + agentBorneCosts + teamLeadPayout + managerPayout = agentGrossPayout + TL + Mgr
    totalB += agentGrossPayout + teamLeadPayout + managerPayout;
  }

  const huspyMargin = commissionBase - totalD - totalB;

  return {
    blueprintId: blueprint.id,
    currency: input.currency,
    grossRevenue: gross,
    totalBucketA: 0,
    totalBucketC: totalC,
    commissionBase,
    totalBucketD: totalD,
    totalBucketB: totalB,
    huspyMargin,
    splits,
    ledger,
  };
}
