import { Deal, AgentEntry, PayableEntry } from "@/data/types";
import { getDeals } from "@/data/dealStore";
import {
  calculateProjectedPnL,
  getBlueprint,
  resolveBrokerRate,
  getMBUDirectRate,
  DEFAULT_EXTERNAL_REFERRAL_RATE,
  sharedAgentFinancials,
  sharedDealStakeholders,
  sharedAgents,
  sharedParties,
  sharedLedgers,
  sharedPostings,
  sharedPostingLines,
  type AgentFinancials,
  type Blueprint,
  type DealStakeholder,
  type Posting,
  type PostingLine,
  type ProjectedPnL,
} from "@huspy/shared-domain";

// ── Engine dispatch ──────────────────────────────────────────────────────────
// Single source of truth for which P&L engine handles a given (businessUnit × channel).
// Rules are MECE: every deal maps to exactly one key.
//
// Engine          businessUnit   channel   Expected stakeholder roles
// ─────────────────────────────────────────────────────────────────────────────
// rebu            rebu           any       AGENT_PAYOUT (1+, AF strategy: flat/slab/max)
//                                          REVENUE_SOURCE (1+, payer → client or developer)
//                                          SUPPLY (seller/developer), DEMAND (buyer/tenant)
//                                          ACQUISITION_DEDUCTION (opt, Huspy-borne co-brokers)
//                                          OPERATIONAL_DEDUCTION (opt, Huspy-borne service costs)
//
// mbu-ma-broker   mortgage       MA        AGENT_PAYOUT (1+, AF strategy: broker-rate-slab)
//                                          REVENUE_SOURCE (bank commission = principal × commissionPct)
//                                          SUPPLY (lending bank), DEMAND (borrower)
//                                          No ACQUISITION_DEDUCTION
//
// mbu-rea         mortgage       REA       AGENT_PAYOUT (1+, AF strategy: mbu-direct-rate-slab)
// mbu-ds          mortgage       DS        REVENUE_SOURCE (bank commission)
// mbu-b2c         mortgage       B2C       SUPPLY (lending bank), DEMAND (borrower)
//                                          OPERATIONAL_DEDUCTION (opt, external referral — 0.3% of principal by default; signals external sourcing → lower agent rate)
//
// mbu-byob        mortgage       BYOB      Same as mbu-ma-broker + byobPenaltyRate on AgentFinancials
//                                          reduces broker payout by that % (Huspy service fee).
// ─────────────────────────────────────────────────────────────────────────────

export type DealEngineKey = "rebu" | "mbu-ma-broker" | "mbu-direct" | "manual";

// Derives engine from businessUnit + channel — used as fallback for deals without pnlEngine set.
export function derivePnlEngine(deal: Pick<Deal, "businessUnit" | "channel">): DealEngineKey {
  if (deal.businessUnit !== "mortgage") return "rebu";
  switch (deal.channel) {
    case "MA":
    case "BYOB":               return "mbu-ma-broker";
    case "REA":
    case "DS":
    case "B2C":                return "mbu-direct";
    case "BBG":                return "manual";
    default:                   return "manual"; // safe: fixed payout, no silent rate lookup
  }
}

export function getDealEngine(deal: Pick<Deal, "businessUnit" | "channel" | "pnlEngine">): DealEngineKey {
  if (deal.pnlEngine) return deal.pnlEngine as DealEngineKey;
  return derivePnlEngine(deal);
}

// ── Posting policy ───────────────────────────────────────────────────────────
// Defines at which DealStatus the commission_accrual posting fires automatically.
// REBU: agent is owed commission once the deal is fully finalized.
// MBU:  broker is owed commission only when Huspy raises the invoice to the bank.
const ENGINE_POSTING_POLICY: Record<DealEngineKey, { agentCommissionTrigger: string }> = {
  "rebu":          { agentCommissionTrigger: "finalized" },
  "mbu-ma-broker": { agentCommissionTrigger: "invoicing" },
  "mbu-direct":    { agentCommissionTrigger: "invoicing" },
  "manual":       { agentCommissionTrigger: "invoicing" },
};

export function fireCommissionAccrualOnTransition(deal: Deal, toStatus: string): void {
  const trigger = ENGINE_POSTING_POLICY[getDealEngine(deal)].agentCommissionTrigger;
  if (toStatus === trigger && deal.status !== trigger) {
    createCommissionAccrualPosting(deal);
  }
}

function buildEngineInput(deal: Deal, allDeals: Deal[]): Parameters<typeof calculateProjectedPnL>[0] | null {
  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const businessUnit = deal.businessUnit ?? "rebu";
  const blueprint = getBlueprint(country, businessUnit);

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  // All fixture stakeholders for this deal (agents, payers, cost parties).
  const allFixtureStakes = sharedDealStakeholders.filter((s) => s.dealId === deal.id);

  // Derive grossRevenue from explicit REVENUE_SOURCE payers when not set on the deal.
  // The waterfall already prefers payer financialAmounts over grossRevenue when both are present,
  // so this only matters for the fallback path (single implicit payer).
  const derivedGrossRevenue = deal.grossRevenue ??
    (allFixtureStakes.some((s) => s.role === "REVENUE_SOURCE" && (s.financialAmount ?? 0) > 0)
      ? allFixtureStakes.filter((s) => s.role === "REVENUE_SOURCE").reduce((sum, s) => sum + Math.abs(s.financialAmount ?? 0), 0)
      : null);
  if (derivedGrossRevenue == null) return null;

  const engine = getDealEngine(deal);

  // Resolve agent financials and party display names.
  for (const stake of allFixtureStakes) {
    const party = sharedParties.find((p) => p.id === stake.partyId);
    if (party) partyDisplayNames[stake.partyId] = party.displayName;

    if (stake.role === "AGENT_PAYOUT") {
      const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
      if (!agent) continue;
      // Stored AF carries agent-specific config: strategy (rebu), BYOB penalty (mbu-ma-broker),
      // and connectedAgents (all engines). For rate-resolved engines the strategy is replaced
      // at runtime but connectedAgents must be preserved from the stored record.
      let af = sharedAgentFinancials.find((f) => f.agentId === agent.id && f.pnlEngine === engine);
      if (engine === "mbu-ma-broker") {
        // Rate depends on: reporting month, lending bank, broker's total monthly GMV (MA + BYOB combined).
        const reportingMonth = deal.reportDate?.slice(0, 7);
        const bankStake = allFixtureStakes.find((s) => s.role === "SUPPLY");
        const bankId = bankStake?.partyId;
        const brokerMonthlyGmv = allDeals
          .filter((d) => getDealEngine(d) === "mbu-ma-broker" && d.reportDate?.startsWith(reportingMonth ?? "\0"))
          .reduce((sum, d) => {
            const hasBroker = sharedDealStakeholders.some(
              (s) => s.dealId === d.id && s.role === "AGENT_PAYOUT" && s.partyId === stake.partyId
            );
            return hasBroker ? sum + (d.dealAmount ?? 0) : sum;
          }, 0);
        let resolvedPct = reportingMonth && bankId
          ? resolveBrokerRate(reportingMonth, bankId, brokerMonthlyGmv)
          : undefined;
        // BYOB: af already holds the stored record; penalty is agent-specific.
        const penalty = af?.byobPenaltyRate ?? 0;
        if (resolvedPct != null && penalty > 0) {
          resolvedPct = resolvedPct - penalty;
        }
        if (resolvedPct != null) {
          // Merge: keep connectedAgents from stored AF; override strategy with resolved rate.
          af = {
            id: af?.id ?? `af-syn-${agent.id}`,
            agentId: agent.id,
            pnlEngine: engine,
            connectedAgents: af?.connectedAgents,
            byobPenaltyRate: af?.byobPenaltyRate,
            strategy: { kind: "flat", pct: resolvedPct },
          };
        }
      } else if (engine === "mbu-direct") {
        // Rate resolved from MBUDirectMonthlyRate by channel + month + sourcing type.
        const reportingMonth = deal.reportDate?.slice(0, 7);
        const channel = deal.channel as "REA" | "DS" | "B2C";
        const isSelfSourced = !allFixtureStakes.some((s) => s.role === "OPERATIONAL_DEDUCTION");
        const resolvedPct = reportingMonth ? getMBUDirectRate(reportingMonth, channel, isSelfSourced) : undefined;
        if (resolvedPct != null) {
          // Merge: keep connectedAgents from stored AF; override strategy with resolved rate.
          af = {
            id: af?.id ?? `af-syn-${agent.id}`,
            agentId: agent.id,
            pnlEngine: engine,
            connectedAgents: af?.connectedAgents,
            strategy: { kind: "flat", pct: resolvedPct },
          };
        }
      }
      // Always map party → agent so fixed-amount payouts (e.g. BBG) resolve display names properly.
      partyIdToAgentId[stake.partyId] = agent.id;
      if (!af) continue;
      agentFinancialsByAgentId[agent.id] = af;
    }
  }

  let stakeholders: DealStakeholder[] = allFixtureStakes;

  const hasFixedPayouts = allFixtureStakes.some(
    (s) => s.role === "AGENT_PAYOUT" && s.financialAmount != null
  );

  // Fallback: legacy AgentEntry[] on the deal (wizard-created deals before stakeholder migration).
  // Skip when fixed-amount payouts are present (e.g. BBG) — waterfall handles those directly.
  if (Object.keys(agentFinancialsByAgentId).length === 0 && !hasFixedPayouts && deal.agents && deal.agents.length > 0) {
    const legacyAgentStakes: DealStakeholder[] = [];
    deal.agents.forEach((a, idx) => {
      const agentId = a.agentId ?? `agent-${deal.id}-${idx}`;
      const partyId = a.agentId ? `party-${a.agentId}` : `party-${agentId}`;
      legacyAgentStakes.push({
        id: `ds-${deal.id}-agent-${idx}`,
        dealId: deal.id,
        partyId,
        role: "AGENT_PAYOUT",
        splitPercentage: a.agentShare,
      });
      const fromFixture = sharedAgentFinancials.find((af) => af.agentId === agentId && af.pnlEngine === engine);
      const af: AgentFinancials = fromFixture ?? {
        id: `af-syn-${agentId}`,
        agentId,
        pnlEngine: engine,
        strategy: { kind: "flat", pct: a.agentCommissionRate || 40 },
      };
      agentFinancialsByAgentId[agentId] = af;
      partyIdToAgentId[partyId] = agentId;
    });
    stakeholders = [...allFixtureStakes.filter((s) => s.role !== "AGENT_PAYOUT"), ...legacyAgentStakes];
  }

  if (Object.keys(agentFinancialsByAgentId).length === 0 && !hasFixedPayouts) return null;

  // Infer financialAmount for payer stakeholders when none is set explicitly.
  // Single payer gets the full grossRevenue; multiple payers split it evenly.
  const hasExplicitPayer = stakeholders.some((s) => (s.financialAmount ?? 0) > 0);
  if (!hasExplicitPayer && deal.grossRevenue) {
    const implicit = stakeholders.filter((s) => s.role === "REVENUE_SOURCE" && !s.financialAmount);
    if (implicit.length > 0) {
      const perPayer = deal.grossRevenue / implicit.length;
      stakeholders = stakeholders.map((s) =>
        s.role === "REVENUE_SOURCE" && !s.financialAmount ? { ...s, financialAmount: perPayer } : s
      );
    }
  }

  // MBU direct channels: fill in default referral fee (0.3% of disbursed principal) for any
  // OPERATIONAL_DEDUCTION (referral party) that has no explicit amount set.
  // Base is dealAmount (mortgage principal), not grossRevenue (bank commission).
  if (getDealEngine(deal) === "mbu-direct") {
    stakeholders = stakeholders.map((s) => {
      if (s.role === "OPERATIONAL_DEDUCTION" && !s.financialAmount) {
        return { ...s, financialAmount: -(deal.dealAmount * DEFAULT_EXTERNAL_REFERRAL_RATE / 100) };
      }
      return s;
    });
  }
  return {
    country,
    businessUnit,
    currency,
    grossRevenue: derivedGrossRevenue,
    // MA/Broker: payout base is the mortgage principal, not Huspy's gross revenue.
    agentPayoutBase: getDealEngine(deal) === "mbu-ma-broker" ? deal.dealAmount : undefined,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}

function applyWaterfallEngine(deal: Deal, allDeals: Deal[]): Deal | null {
  const input = buildEngineInput(deal, allDeals);
  if (!input) return null;
  const projection = calculateProjectedPnL(input);

  // Project results back onto legacy AgentEntry rows.
  const splitsByAgentId = new Map(projection.splits.map((s) => [s.agentId, s]));
  const updatedAgents: AgentEntry[] = (deal.agents ?? []).map((a, idx) => {
    const agentId = a.agentId ?? `agent-${deal.id}-${idx}`;
    const s = splitsByAgentId.get(agentId);
    if (!s) return a;
    const af = sharedAgentFinancials.find((x) => x.agentId === agentId);
    return {
      ...a,
      agentCommissionRate:
        af?.strategy.kind === "flat" ? af.strategy.pct : a.agentCommissionRate,
      agentCommissionPayout: s.agentPayout,
      agentTotalAmount: s.agentPayout + (a.agentIncentive ?? 0) - (a.agentDeductions ?? 0),
      teamLeadRate: (af?.connectedAgents?.[0]?.rate) ?? a.teamLeadRate,
      teamLeadShare: s.connectedAgentPayouts[0]?.amount ?? 0,
      managerOverrideRate: (af?.connectedAgents?.[1]?.rate) ?? a.managerOverrideRate,
      managerOverride: s.connectedAgentPayouts[1]?.amount ?? 0,
    };
  });

  const externals = deal.externalPartners ?? [];

  // Build payables from engine ledger entries (DEBITs with a bucket).
  const existing = deal.payables ?? [];
  const payables: PayableEntry[] = [];
  projection.ledger
    .filter((e) => e.side === "DEBIT" && e.bucket)
    .forEach((e) => {
      const entityType: PayableEntry["entityType"] =
        e.bucket === "agent-payout"
          ? e.label.startsWith("Agent")
            ? "agent"
            : e.label.startsWith("Team")
              ? "team_lead"
              : "manager"
          : e.bucket === "acquisition-cost"
            ? "external_partner"
            : "conveyance";
      const prev = existing.find((p) => p.entityLabel === e.label);
      payables.push({
        entityType,
        entityLabel: e.label,
        expectedAmount: e.amount,
        refNumber: prev?.refNumber ?? "",
        status: prev?.status ?? "pending",
        paidAmount: prev?.paidAmount,
        paidDate: prev?.paidDate,
      });
    });

  const first = updatedAgents[0];
  return {
    ...deal,
    agents: updatedAgents,
    externalPartners: externals,
    huspyRevenue: projection.grossRevenue,
    netHuspyRevenue: projection.huspyMargin,
    agentName: first?.agentName ?? deal.agentName,
    agentShare: first?.agentShare ?? deal.agentShare ?? 0,
    agentCommissionRate: first?.agentCommissionRate ?? deal.agentCommissionRate ?? 0,
    agentCommissionPayout: projection.splits.reduce((s, sp) => s + sp.agentPayout, 0),
    teamLeadName: first?.teamLeadName,
    teamLeadRate: first?.teamLeadRate ?? 0,
    teamLeadShare: projection.splits.reduce((s, sp) => s + (sp.connectedAgentPayouts[0]?.amount ?? 0), 0),
    managerName: first?.managerName,
    managerOverrideRate: first?.managerOverrideRate ?? 0,
    managerOverride: projection.splits.reduce((s, sp) => s + (sp.connectedAgentPayouts[1]?.amount ?? 0), 0),
    cogsInternal: projection.totalAgentPayout,
    cogsExternal: projection.totalAcquisitionCost,
    cogsReferrals: 0,
    payables,
  };
}

/** Build payable entries from all COGS entities, preserving user-edited payment fields */
function buildPayables(deal: Deal, entries: { entityType: PayableEntry["entityType"]; entityLabel: string; expectedAmount: number }[]): PayableEntry[] {
  const existing = deal.payables || [];
  return entries
    .filter((e) => e.expectedAmount > 0 || existing.some((p) => p.entityType === e.entityType && p.entityLabel === e.entityLabel))
    .map((e) => {
      const prev = existing.find((p) => p.entityType === e.entityType && p.entityLabel === e.entityLabel);
      return {
        entityType: e.entityType,
        entityLabel: e.entityLabel,
        expectedAmount: e.expectedAmount,
        refNumber: prev?.refNumber || "",
        status: prev?.status || "pending",
        paidAmount: prev?.paidAmount,
        paidDate: prev?.paidDate,
      };
    });
}

function recalculateAgentEntry(agent: AgentEntry, huspyRevenue: number, extPayout: number): AgentEntry {
  const netRevenuePerAgent = (huspyRevenue - extPayout) * (agent.agentShare / 100);
  const baseCommission = (agent.agentCommissionRate / 100) * netRevenuePerAgent;
  const agentTotalAmount = baseCommission + agent.agentIncentive - agent.agentDeductions;
  const teamLeadShare = (agent.teamLeadRate / 100) * Math.max(0, agentTotalAmount);
  const managerOverride = (agent.managerOverrideRate / 100) * Math.max(0, agentTotalAmount);
  const referralAmount = (agent.referralPercentage / 100) * (netRevenuePerAgent - (agent.clientKickback || 0));

  return {
    ...agent,
    agentCommissionPayout: Math.max(0, baseCommission),
    agentTotalAmount: Math.max(0, agentTotalAmount),
    teamLeadShare: Math.max(0, teamLeadShare),
    managerOverride: Math.max(0, managerOverride),
    referralAmount: Math.max(0, referralAmount),
  };
}

function recalculateREBU(deal: Deal): Deal {
  const huspyRevenue = deal.dealPrice * (deal.takeRate / 100);

  // Recalculate external partners
  const partners = (deal.externalPartners || []).map((p) => ({
    ...p,
    partnerAmount: (p.partnerShare / 100) * huspyRevenue,
  }));
  const extPayout = partners.reduce((sum, p) => sum + p.partnerAmount, 0);

  // Recalculate each agent
  const agents = deal.agents.map((a) => recalculateAgentEntry(a, huspyRevenue, extPayout));

  // Aggregate agent COGS
  const totalAgentPayout = agents.reduce((sum, a) => sum + a.agentTotalAmount, 0);
  const totalTeamLeadShare = agents.reduce((sum, a) => sum + a.teamLeadShare, 0);
  const totalManagerOverride = agents.reduce((sum, a) => sum + a.managerOverride, 0);

  // OPERATIONAL_DEDUCTION stakeholders are the canonical source for conveyance / service costs.
  const opDeductionStakes = sharedDealStakeholders.filter(
    (s) => s.dealId === deal.id && s.role === "OPERATIONAL_DEDUCTION"
  );
  const conveyanceFeeTotal = opDeductionStakes.reduce((sum, s) => sum + Math.abs(s.financialAmount ?? 0), 0);
  const conveyanceAgentPayout = conveyanceFeeTotal;
  const huspyConveyanceShare = 0;

  // Referrals are now per-agent
  const totalReferralAmount = agents.reduce((sum, a) => sum + a.referralAmount, 0);
  const totalClientKickback = agents.reduce((sum, a) => sum + (a.clientKickback || 0), 0);

  const cogsInternal = totalAgentPayout + totalTeamLeadShare + totalManagerOverride + conveyanceAgentPayout;
  const cogsExternal = extPayout;
  const cogsReferrals = Math.max(0, totalReferralAmount) + totalClientKickback;
  const totalCOGS = cogsInternal + cogsExternal + cogsReferrals;
  // Conveyance fee is Huspy additional revenue only in legacy (non-stakeholder) model.
  const conveyanceAsRevenue = opDeductionStakes.length > 0 ? 0 : conveyanceFeeTotal;
  const netHuspyRevenue = huspyRevenue + conveyanceAsRevenue - totalCOGS;

  // Build payable entries from all COGS entities
  const payableEntries: { entityType: PayableEntry["entityType"]; entityLabel: string; expectedAmount: number }[] = [];

  // External partners
  partners.forEach((p, idx) => {
    payableEntries.push({ entityType: "external_partner", entityLabel: `External Partner ${idx + 1}${p.partnerName ? ` — ${p.partnerName}` : ""}`, expectedAmount: p.partnerAmount });
  });

  // Per-agent entries: agent, team lead, manager, referrer
  agents.forEach((a, idx) => {
    const label = (suffix: string) => `Agent ${idx + 1}${a.agentName ? ` — ${a.agentName}` : ""} ${suffix}`;
    payableEntries.push({ entityType: "agent", entityLabel: label("Commission"), expectedAmount: a.agentTotalAmount });
    if (a.teamLeadName || a.teamLeadShare > 0) {
      payableEntries.push({ entityType: "team_lead", entityLabel: `Team Lead ${idx + 1}${a.teamLeadName ? ` — ${a.teamLeadName}` : ""}`, expectedAmount: a.teamLeadShare });
    }
    if (a.managerName || a.managerOverride > 0) {
      payableEntries.push({ entityType: "manager", entityLabel: `Manager ${idx + 1}${a.managerName ? ` — ${a.managerName}` : ""}`, expectedAmount: a.managerOverride });
    }
    if (a.referrerName || a.referralAmount > 0) {
      payableEntries.push({ entityType: "referrer", entityLabel: `Referrer ${idx + 1}${a.referrerName ? ` — ${a.referrerName}` : ""}`, expectedAmount: a.referralAmount });
    }
  });

  // Operating costs — one payable entry per OPERATIONAL_DEDUCTION stakeholder.
  opDeductionStakes.forEach((s) => {
    const party = sharedParties.find((p) => p.id === s.partyId);
    payableEntries.push({ entityType: "conveyance", entityLabel: `Operating Cost — ${party?.displayName ?? s.partyId}`, expectedAmount: Math.abs(s.financialAmount ?? 0) });
  });

  const payables = buildPayables(deal, payableEntries);

  const firstPayable = payables[0];
  const firstPartner = partners[0] || { partnerName: "", partnerShare: 0, partnerAmount: 0 };
  const first = agents[0] || {} as Partial<AgentEntry>;

  return {
    ...deal,
    agents,
    externalPartners: partners,
    huspyRevenue,
    agentName: first.agentName || deal.agentName,
    agentShare: first.agentShare ?? 0,
    agentCommissionRate: first.agentCommissionRate ?? 0,
    agentCommissionPayout: totalAgentPayout,
    teamLeadName: first.teamLeadName,
    teamLeadRate: first.teamLeadRate ?? 0,
    teamLeadShare: totalTeamLeadShare,
    managerName: first.managerName,
    managerOverrideRate: first.managerOverrideRate ?? 0,
    managerOverride: totalManagerOverride,
    externalPartnerName: firstPartner.partnerName,
    externalPartnerShare: firstPartner.partnerShare ?? 0,
    externalPayout: extPayout,
    conveyanceAgentPayout,
    huspyConveyanceShare,
    referralAmount: Math.max(0, totalReferralAmount),
    cogsInternal: Math.max(0, cogsInternal),
    cogsExternal: Math.max(0, cogsExternal),
    cogsReferrals: Math.max(0, cogsReferrals),
    netHuspyRevenue,
    payables,
    payableRefNumber: firstPayable?.refNumber,
    payableStatus: firstPayable?.status,
  };
}


export function recalculateDeal(deal: Deal, allDeals: Deal[] = getDeals()): Deal {
  switch (getDealEngine(deal)) {
    case "rebu":
      // Try waterfall engine first; fall back to legacy field-based calc for
      // deals that predate the stakeholder migration (no grossRevenue/blueprintId).
      return applyWaterfallEngine(deal, allDeals) ?? recalculateREBU(deal);
    case "mbu-ma-broker":
    case "mbu-direct":
    case "manual":
      return applyWaterfallEngine(deal, allDeals) ?? deal;
  }
}

export function computeDealPnL(deal: Deal) {
  const input = buildEngineInput(deal, getDeals());
  if (!input) return null;
  return calculateProjectedPnL(input);
}

// Maps currency to chart-of-accounts ledger IDs (matches sharedLedgers fixture).
const LEDGER_IDS: Record<string, { ar: number; rev: number; exp: number; agentPayable: number; extPayable: number; tax: number; withholding: number }> = {
  EUR: { ar: 2,  rev: 6,  exp: 7,  agentPayable: 3,  extPayable: 4,  tax: 5,  withholding: 28 },
  AED: { ar: 9,  rev: 13, exp: 14, agentPayable: 10, extPayable: 11, tax: 12, withholding: 29 },
  SAR: { ar: 16, rev: 20, exp: 21, agentPayable: 17, extPayable: 18, tax: 19, withholding: 30 },
};

export function draftPostings(projection: ProjectedPnL, deal: { id: string; businessUnit?: string; currency?: string }, blueprint?: Blueprint): { posting: Posting; lines: PostingLine[] } {
  const currency = (deal.currency ?? "EUR") as "EUR" | "AED" | "SAR";
  const ids = LEDGER_IDS[currency] ?? LEDGER_IDS.EUR;
  const postingId = `draft-${deal.id}`;
  const now = new Date().toISOString();

  const posting: Posting = {
    id: postingId,
    dealId: deal.id,
    businessUnit: deal.businessUnit as any,
    businessProcess: "invoice_issued",
    createdBy: "user-ops",
    createdAt: now,
    valueDate: now.slice(0, 10),
    currency,
    description: `Deal close — ${deal.id}`,
  };

  const lines: PostingLine[] = [];
  let lineIdx = 0;
  const line = (ledgerId: number, side: "DEBIT" | "CREDIT", amount: number): PostingLine => ({
    id: `${postingId}-L${++lineIdx}`,
    postingId,
    ledgerId,
    side,
    amount: Math.round(amount * 100) / 100,
  });

  // Gross revenue: AR debit + Revenue credit
  lines.push(line(ids.ar, "DEBIT", projection.grossRevenue));
  lines.push(line(ids.rev, "CREDIT", projection.grossRevenue));

  // Statutory tax: Revenue debit + Tax liability credit (Blueprint service — tax-exclusive model).
  // taxAmount = grossRevenue × blueprint.taxRate. Only emitted when blueprint is provided.
  if (blueprint && blueprint.taxRate > 0) {
    const taxAmount = Math.round(projection.grossRevenue * (blueprint.taxRate / 100) * 100) / 100;
    if (taxAmount > 0) {
      lines.push(line(ids.rev, "DEBIT", taxAmount));
      lines.push(line(ids.tax, "CREDIT", taxAmount));
    }
  }

  // Acquisition + operational costs: one Expense debit for the total, then one Credit per party.
  // Routes to the party's subledger when one exists (e.g. a REBU agent referring an MBU deal),
  // otherwise falls back to the general EXT_PAYABLE control account.
  const externalEntries = projection.ledger.filter(
    (e) => e.side === "DEBIT" && (e.bucket === "acquisition-cost" || e.bucket === "operational-cost")
  );
  if (externalEntries.length > 0) {
    const externalTotal = externalEntries.reduce((s, e) => s + e.amount, 0);
    lines.push(line(ids.exp, "DEBIT", externalTotal));
    for (const entry of externalEntries) {
      const subledger = entry.partyId ? sharedLedgers.find((l) => l.partyId === entry.partyId) : undefined;
      lines.push(line(subledger?.id ?? ids.extPayable, "CREDIT", entry.amount));
    }
  }

  // Agent payouts: one Expense debit for the total, then one Credit per
  // agent subledger (AgentLiability_agent-{id}). Falls back to the GL parent only
  // when no subledger is found for an agent — preserving double-entry balance.
  if (projection.totalAgentPayout > 0) {
    lines.push(line(ids.exp, "DEBIT", projection.totalAgentPayout));
    for (const split of projection.splits) {
      const agentTotal = split.agentPayout + split.connectedAgentPayouts.reduce((s, p) => s + p.amount, 0);
      if (agentTotal <= 0) continue;
      const subledger = sharedLedgers.find((l) => l.name === `AgentLiability_${split.agentId}`);
      lines.push(line(subledger?.id ?? ids.agentPayable, "CREDIT", agentTotal));
    }
  }

  return { posting, lines };
}

function assertNotControlAccount(ledgerId: number, context: string): void {
  const ledger = sharedLedgers.find((l) => l.id === ledgerId);
  if (ledger?.isControlAccount) {
    throw new Error(`Cannot post directly to control account "${ledger.name}" (id ${ledgerId}) in ${context}. Specify a subledger.`);
  }
}

export function createCommissionAccrualPosting(deal: Deal): void {
  const pnl = computeDealPnL(deal);
  if (!pnl || pnl.totalAgentPayout <= 0) return;

  const currency = (deal.currency ?? "EUR") as "EUR" | "AED" | "SAR";
  const ids = LEDGER_IDS[currency] ?? LEDGER_IDS.EUR;
  const now = new Date().toISOString();
  const ts = Date.now();

  const pushPosting = (pid: string, description: string) => {
    sharedPostings.push({
      id: pid, dealId: deal.id, businessUnit: deal.businessUnit as any,
      businessProcess: "commission_accrual" as any, createdBy: "system",
      createdAt: now, valueDate: now.slice(0, 10), currency, description,
    });
  };

  const push2Lines = (pid: string, subledgerId: number, amount: number) => {
    assertNotControlAccount(subledgerId, `commission_accrual ${pid}`);
    sharedPostingLines.push({ id: `${pid}-L1`, postingId: pid, ledgerId: ids.exp,     side: "DEBIT",  amount });
    sharedPostingLines.push({ id: `${pid}-L2`, postingId: pid, ledgerId: subledgerId, side: "CREDIT", amount });
  };

  for (const split of pnl.splits) {
    const agentName = sharedParties.find((p) => p.id === split.partyId)?.displayName ?? split.agentId;

    if (split.agentPayout > 0) {
      const subledger = sharedLedgers.find((l) => l.partyId === split.partyId);
      if (!subledger) throw new Error(`No subledger for party ${split.partyId} (agent ${split.agentId})`);
      const pid = `posting-finalize-${deal.id}-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${agentName} (${deal.id})`);
      push2Lines(pid, subledger.id, Math.round(split.agentPayout * 100) / 100);
    }

    for (const cp of split.connectedAgentPayouts) {
      if (cp.amount <= 0 || !cp.ledgerId) continue;
      const subledger = sharedLedgers.find((l) => l.id === cp.ledgerId);
      if (!subledger) throw new Error(`No subledger id=${cp.ledgerId} for ${cp.label} of agent ${split.agentId}`);
      const cpName = sharedParties.find((p) => p.id === subledger.partyId)?.displayName ?? cp.label;
      const pid = `posting-finalize-${deal.id}-ca-${cp.agentId}-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${cpName} / ${cp.label} for ${agentName} (${deal.id})`);
      push2Lines(pid, subledger.id, Math.round(cp.amount * 100) / 100);
    }
  }

  // Acquisition and operational costs: only parties that have a subledger settle here.
  // Parties without a subledger are settled via invoice (external_cost_accrual at invoice issuance).
  for (const entry of pnl.ledger) {
    if (entry.side !== "DEBIT" || (entry.bucket !== "acquisition-cost" && entry.bucket !== "operational-cost")) continue;
    if (entry.amount <= 0) continue;
    const subledger = entry.partyId ? sharedLedgers.find((l) => l.partyId === entry.partyId) : undefined;
    if (!subledger) continue;
    const creditId = subledger.id;
    const name = entry.partyId
      ? (sharedParties.find((p) => p.id === entry.partyId)?.displayName ?? entry.partyId)
      : entry.label;
    const pid = `posting-finalize-${deal.id}-cost-${entry.id}-${ts}`;
    pushPosting(pid, `Cost accrual — ${name} (${deal.id})`);
    push2Lines(pid, creditId, Math.round(entry.amount * 100) / 100);
  }
}

// ── AF validation ─────────────────────────────────────────────────────────────
// Returns the list of agents on non-manual deals that are missing an AF config
// for the deal's engine. Used to block deal creation / bulk upload.
// Agents with a fixed financialAmount on their stake are exempt (manual-priced).
export function getMissingAgentFinancials(
  engine: DealEngineKey,
  stakeholders: DealStakeholder[]
): Array<{ agentId: string; displayName: string }> {
  if (engine === "manual") return [];
  const missing: Array<{ agentId: string; displayName: string }> = [];
  for (const stake of stakeholders) {
    if (stake.role !== "AGENT_PAYOUT") continue;
    if (stake.financialAmount != null) continue; // declared fixed amount — exempt
    const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
    if (!agent) continue;
    const af = sharedAgentFinancials.find((f) => f.agentId === agent.id && f.pnlEngine === engine);
    if (!af) {
      const party = sharedParties.find((p) => p.id === stake.partyId);
      missing.push({ agentId: agent.id, displayName: party?.displayName ?? agent.id });
    }
  }
  return missing;
}

export function createEmptyAgent(_index: number): AgentEntry {
  return {
    agentName: "",
    agentShare: 0,
    agentCommissionRate: 0,
    agentCommissionPayout: 0,
    agentIncentive: 0,
    agentDeductions: 0,
    agentTotalAmount: 0,
    teamLeadRate: 0,
    teamLeadShare: 0,
    managerOverrideRate: 0,
    managerOverride: 0,
    referralType: "",
    referralPercentage: 0,
    referralAmount: 0,
    clientKickback: 0,
  };
}

