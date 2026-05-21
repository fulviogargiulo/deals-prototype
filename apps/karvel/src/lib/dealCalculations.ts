import { Deal, AgentEntry, PayableEntry } from "@/data/types";
import { getDeals } from "@/data/dealStore";
import {
  calculateProjectedPnL,
  getBlueprint,
  resolveBrokerRate,
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
  type LedgerEntry,
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
//                                          No ACQUISITION_DEDUCTION / OPERATIONAL_DEDUCTION
//
// mbu-b2c         mortgage       B2C       [TO BE DETERMINED]
// mbu-bbg         mortgage       BBG       [TO BE DETERMINED]
// ─────────────────────────────────────────────────────────────────────────────

export type DealEngineKey = "rebu" | "mbu-ma-broker" | "mbu-b2c" | "mbu-bbg";

export function getDealEngine(deal: Pick<Deal, "businessUnit" | "channel">): DealEngineKey {
  if (deal.businessUnit !== "mortgage") return "rebu";
  switch (deal.channel) {
    case "MA":  return "mbu-ma-broker";
    case "B2C": return "mbu-b2c";
    case "BBG": return "mbu-bbg";
    default:    return "mbu-b2c"; // unrecognised mortgage channel → B2C path until defined
  }
}

function buildEngineInput(deal: Deal): Parameters<typeof calculateProjectedPnL>[0] | null {
  if (deal.grossRevenue == null || !deal.blueprintId) return null;

  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const businessUnit = deal.businessUnit ?? "rebu";
  const blueprint = getBlueprint(country, businessUnit);

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  // All fixture stakeholders for this deal (agents, payers, cost parties).
  const allFixtureStakes = sharedDealStakeholders.filter((s) => s.dealId === deal.id);

  // Resolve agent financials and party display names.
  for (const stake of allFixtureStakes) {
    const party = sharedParties.find((p) => p.id === stake.partyId);
    if (party) partyDisplayNames[stake.partyId] = party.displayName;

    if (stake.role === "AGENT_PAYOUT") {
      const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
      if (!agent) continue;
      let af = sharedAgentFinancials.find((f) => f.agentId === agent.id);
      const engine = getDealEngine(deal);
      const isMABroker = engine === "mbu-ma-broker";
      if (isMABroker && stake.financialAmount != null && stake.financialAmount > 0) {
        // Fixture deal: financialAmount pre-computed from BrokerRateSlab — back-compute implied %.
        const synBase = (deal.dealAmount ?? 0) * ((stake.splitPercentage ?? 100) / 100);
        const impliedPct = synBase > 0 ? (stake.financialAmount / synBase) * 100 : 0;
        af = {
          id: `af-syn-${agent.id}`,
          agentId: agent.id,
          strategy: { kind: "flat", pct: impliedPct },
          teamLeadRate: 0,
          managerRate: 0,
        };
      } else if (isMABroker) {
        // No pre-computed amount (e.g. bulk-uploaded deal) — resolve dynamically.
        // Rate depends on: reporting month, lending bank, broker's total monthly GMV.
        const reportingMonth = deal.reportDate?.slice(0, 7);
        const bankStake = allFixtureStakes.find((s) => s.role === "SUPPLY");
        const bankId = bankStake?.partyId;
        const brokerMonthlyGmv = getDeals()
          .filter((d) => d.channel === "MA" && d.reportDate?.startsWith(reportingMonth ?? "\0"))
          .reduce((sum, d) => {
            const hasBroker = sharedDealStakeholders.some(
              (s) => s.dealId === d.id && s.role === "AGENT_PAYOUT" && s.partyId === stake.partyId
            );
            return hasBroker ? sum + (d.dealAmount ?? 0) : sum;
          }, 0);
        const resolvedPct = reportingMonth && bankId
          ? resolveBrokerRate(reportingMonth, bankId, brokerMonthlyGmv)
          : undefined;
        if (resolvedPct != null) {
          af = {
            id: `af-syn-${agent.id}`,
            agentId: agent.id,
            strategy: { kind: "flat", pct: resolvedPct },
            teamLeadRate: 0,
            managerRate: 0,
          };
        }
      } else if (!af && stake.financialAmount != null && stake.financialAmount > 0) {
        // REBU / other channels fallback — no AF entry, synthesise from financialAmount.
        const synBase = (deal.grossRevenue ?? 0) * ((stake.splitPercentage ?? 100) / 100);
        const impliedPct = synBase > 0 ? (stake.financialAmount / synBase) * 100 : 0;
        af = {
          id: `af-syn-${agent.id}`,
          agentId: agent.id,
          strategy: { kind: "flat", pct: impliedPct },
        };
      }
      if (!af) continue;
      agentFinancialsByAgentId[agent.id] = af;
      partyIdToAgentId[stake.partyId] = agent.id;
    }
  }

  let stakeholders: DealStakeholder[] = allFixtureStakes;

  // Fallback: legacy AgentEntry[] on the deal (wizard-created deals before stakeholder migration).
  if (Object.keys(agentFinancialsByAgentId).length === 0 && deal.agents && deal.agents.length > 0) {
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
      const fromFixture = sharedAgentFinancials.find((af) => af.agentId === agentId);
      const af: AgentFinancials = fromFixture ?? {
        id: `af-syn-${agentId}`,
        agentId,
        strategy: { kind: "flat", pct: a.agentCommissionRate || 40 },
        teamLeadRate: a.teamLeadRate,
        managerRate: a.managerOverrideRate,
      };
      agentFinancialsByAgentId[agentId] = af;
      partyIdToAgentId[partyId] = agentId;
    });
    stakeholders = [...allFixtureStakes.filter((s) => s.role !== "AGENT_PAYOUT"), ...legacyAgentStakes];
  }

  if (Object.keys(agentFinancialsByAgentId).length === 0) return null;

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
  return {
    country,
    businessUnit,
    currency,
    grossRevenue: deal.grossRevenue,
    // MA/Broker: payout base is the mortgage principal, not Huspy's gross revenue.
    agentPayoutBase: getDealEngine(deal) === "mbu-ma-broker" ? deal.dealAmount : undefined,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}

function applyWaterfallEngine(deal: Deal): Deal | null {
  const input = buildEngineInput(deal);
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
      teamLeadRate: af?.teamLeadRate ?? a.teamLeadRate,
      teamLeadShare: s.teamLeadPayout,
      managerOverrideRate: af?.managerRate ?? a.managerOverrideRate,
      managerOverride: s.managerPayout,
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
        e.bucket === "B"
          ? e.label.startsWith("Agent")
            ? "agent"
            : e.label.startsWith("Team")
              ? "team_lead"
              : "manager"
          : e.bucket === "C"
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
    teamLeadShare: projection.splits.reduce((s, sp) => s + sp.teamLeadPayout, 0),
    managerName: first?.managerName,
    managerOverrideRate: first?.managerOverrideRate ?? 0,
    managerOverride: projection.splits.reduce((s, sp) => s + sp.managerPayout, 0),
    cogsInternal: projection.totalBucketB,
    cogsExternal: projection.totalBucketC,
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

  // Rebates & Subsidy
  const rebateAmount = deal.market === "primary" ? (deal.rebatePercentage / 100) * huspyRevenue : 0;
  const subsidyAmount = deal.market === "secondary" ? (deal.subsidyAmount || 0) : 0;

  const cogsInternal = totalAgentPayout + totalTeamLeadShare + totalManagerOverride + conveyanceAgentPayout;
  const cogsExternal = extPayout + Math.max(0, rebateAmount) + Math.max(0, subsidyAmount);
  const cogsReferrals = Math.max(0, totalReferralAmount) + totalClientKickback;
  const cogsRebates = Math.max(0, rebateAmount);
  const cogsSubsidy = Math.max(0, subsidyAmount);
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
    cogsRebates,
    cogsSubsidy,
    rebateAmount,
    subsidyAmount,
    netHuspyRevenue,
    payables,
    payableRefNumber: firstPayable?.refNumber,
    payableStatus: firstPayable?.status,
  };
}


export function recalculateDeal(deal: Deal): Deal {
  switch (getDealEngine(deal)) {
    case "rebu":
      // Try waterfall engine first; fall back to legacy field-based calc for
      // deals that predate the stakeholder migration (no grossRevenue/blueprintId).
      return applyWaterfallEngine(deal) ?? recalculateREBU(deal);
    case "mbu-ma-broker":
      // Waterfall engine handles MA/Broker via BrokerRateSlab; no legacy fallback.
      return applyWaterfallEngine(deal) ?? deal;
    case "mbu-b2c":
    case "mbu-bbg":
      // Waterfall engine works for internal-agent mortgage deals; no legacy fallback.
      return applyWaterfallEngine(deal) ?? deal;
  }
}

export function computeDealPnL(deal: Deal) {
  const input = buildEngineInput(deal);
  if (!input) return null;
  const pnl = calculateProjectedPnL(input);

  const fixedAgents = sharedDealStakeholders.filter(
    (s) => s.dealId === deal.id && s.role === "AGENT_PAYOUT" && s.fixedAmount != null
  );
  if (fixedAgents.length === 0) return pnl;

  let additionalB = 0;
  const extraLedger: LedgerEntry[] = [];
  for (const stake of fixedAgents) {
    const name = sharedParties.find((p) => p.id === stake.partyId)?.displayName ?? stake.partyId;
    const amount = Math.abs(stake.fixedAmount!);
    additionalB += amount;
    extraLedger.push({ id: `fixed::${stake.id}`, label: `${name} — fixed commission`, bucket: "B", side: "DEBIT", amount, partyId: stake.partyId });
  }

  return {
    ...pnl,
    totalBucketB: pnl.totalBucketB + additionalB,
    huspyMargin: pnl.huspyMargin - additionalB,
    ledger: [...pnl.ledger, ...extraLedger],
  };
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

  // Bucket C + D (external partners): Expense debit + External payable credit
  const externalTotal = projection.totalBucketC + projection.totalBucketD;
  if (externalTotal > 0) {
    lines.push(line(ids.exp, "DEBIT", externalTotal));
    lines.push(line(ids.extPayable, "CREDIT", externalTotal));
  }

  // Bucket B (agent payouts): one Expense debit for the total, then one Credit per
  // agent subledger (AgentLiability_agent-{id}). Falls back to the GL parent only
  // when no subledger is found for an agent — preserving double-entry balance.
  if (projection.totalBucketB > 0) {
    lines.push(line(ids.exp, "DEBIT", projection.totalBucketB));
    for (const split of projection.splits) {
      const agentTotal = split.agentPayout + split.teamLeadPayout + split.managerPayout;
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
  if (!pnl || pnl.totalBucketB <= 0) return;

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
    const af = sharedAgentFinancials.find((x) => x.agentId === split.agentId);
    const agentName = sharedParties.find((p) => p.id === split.partyId)?.displayName ?? split.agentId;

    if (split.agentPayout > 0) {
      const subledger = sharedLedgers.find((l) => l.name === `AgentLiability_${split.agentId}`);
      if (!subledger) throw new Error(`No subledger for agent ${split.agentId}`);
      const pid = `posting-finalize-${deal.id}-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${agentName} (${deal.id})`);
      push2Lines(pid, subledger.id, Math.round(split.agentPayout * 100) / 100);
    }

    if (split.teamLeadPayout > 0 && af?.teamLeadLedgerId) {
      const subledger = sharedLedgers.find((l) => l.id === af.teamLeadLedgerId);
      if (!subledger) throw new Error(`No TL subledger for agent ${split.agentId}`);
      const tlName = sharedParties.find((p) => p.id === subledger.partyId)?.displayName ?? "Team Lead";
      const pid = `posting-finalize-${deal.id}-tl-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${tlName} / TL for ${agentName} (${deal.id})`);
      push2Lines(pid, subledger.id, Math.round(split.teamLeadPayout * 100) / 100);
    }

    if (split.managerPayout > 0 && af?.managerLedgerId) {
      const subledger = sharedLedgers.find((l) => l.id === af.managerLedgerId);
      if (!subledger) throw new Error(`No Mgr subledger for agent ${split.agentId}`);
      const mgrName = sharedParties.find((p) => p.id === subledger.partyId)?.displayName ?? "Manager";
      const pid = `posting-finalize-${deal.id}-mgr-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${mgrName} / Mgr for ${agentName} (${deal.id})`);
      push2Lines(pid, subledger.id, Math.round(split.managerPayout * 100) / 100);
    }
  }
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
