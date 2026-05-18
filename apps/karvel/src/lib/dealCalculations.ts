import { Deal, AgentEntry, PayableEntry } from "@/data/types";
import {
  calculateProjectedPnL,
  getBlueprint,
  sharedAgentFinancials,
  sharedDealStakeholders,
  sharedAgents,
  sharedParties,
  sharedLedgers,
  type AgentFinancials,
  type Blueprint,
  type DealStakeholder,
  type LedgerEntry,
  type Posting,
  type PostingLine,
  type ProjectedPnL,
} from "@huspy/shared-domain";

/**
 * Phase C3 — REBU deals are now scored by the waterfall engine.
 *
 * Engine path is taken when the deal carries the lean-shape markers
 * (grossRevenue, blueprintId) AND has at least one agent entry. Engine output
 * is projected back onto the legacy Karvel fields (huspyRevenue, netHuspyRevenue,
 * cogsInternal, agents[].agentCommissionPayout, ...) so existing PnL views read
 * the same shape they always did — just with engine-derived numbers underneath.
 *
 * MBU continues to use the legacy `recalculateMBU` (bankSlab × disbursedAmount
 * is product-specific math; gross-revenue derivation is done outside the engine
 * per the agreed split, but the MBU wizard step lives in Phase D).
 */

function buildEngineInput(deal: Deal): Parameters<typeof calculateProjectedPnL>[0] | null {
  if (deal.businessUnit === "mortgage") return null;
  if (deal.grossRevenue == null || !deal.blueprintId) return null;

  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const blueprint = getBlueprint(country, "rebu");

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  // All fixture stakeholders for this deal (agents, payers, cost parties).
  const allFixtureStakes = sharedDealStakeholders.filter((s) => s.dealId === deal.id);

  // Resolve agent financials and party display names.
  for (const stake of allFixtureStakes) {
    const party = sharedParties.find((p) => p.id === stake.partyId);
    if (party) partyDisplayNames[stake.partyId] = party.displayName;

    if (stake.role === "INTERNAL_PAYOUT") {
      const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
      if (!agent) continue;
      const af = sharedAgentFinancials.find((f) => f.agentId === agent.id);
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
        role: "INTERNAL_PAYOUT",
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
    stakeholders = [...allFixtureStakes.filter((s) => s.role !== "INTERNAL_PAYOUT"), ...legacyAgentStakes];
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
    businessUnit: "rebu",
    currency,
    grossRevenue: deal.grossRevenue,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}

function applyEngineToREBU(deal: Deal): Deal | null {
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
    dealAmount: projection.grossRevenue,
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

export function recalculateAgentEntry(agent: AgentEntry, huspyRevenue: number, extPayout: number): AgentEntry {
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

export function recalculateREBU(deal: Deal): Deal {
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

  // OPERATIONAL_DEDUCTION stakeholders replace the deprecated deal.conveyanceRevenue / conveyanceAgentRate fields.
  const opDeductionStakes = sharedDealStakeholders.filter(
    (s) => s.dealId === deal.id && s.role === "OPERATIONAL_DEDUCTION"
  );
  const conveyanceFeeTotal = opDeductionStakes.length > 0
    ? opDeductionStakes.reduce((sum, s) => sum + Math.abs(s.financialAmount ?? 0), 0)
    : (deal.conveyanceRevenue ?? 0);
  const conveyanceAgentPayout = opDeductionStakes.length > 0
    ? conveyanceFeeTotal
    : (deal.conveyanceAgentRate / 100) * conveyanceFeeTotal;
  const huspyConveyanceShare = conveyanceFeeTotal - conveyanceAgentPayout;

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
  const amount = huspyRevenue + conveyanceAsRevenue;

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

  // Conveyance — one entry per OPERATIONAL_DEDUCTION stakeholder; fall back to legacy deal field.
  if (opDeductionStakes.length > 0) {
    opDeductionStakes.forEach((s) => {
      const party = sharedParties.find((p) => p.id === s.partyId);
      payableEntries.push({ entityType: "conveyance", entityLabel: `Conveyance — ${party?.displayName ?? s.partyId}`, expectedAmount: Math.abs(s.financialAmount ?? 0) });
    });
  } else if (deal.conveyanceAgentName || conveyanceAgentPayout > 0) {
    payableEntries.push({ entityType: "conveyance", entityLabel: `Conveyance${deal.conveyanceAgentName ? ` — ${deal.conveyanceAgentName}` : ""}`, expectedAmount: conveyanceAgentPayout });
  }

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
    dealAmount: amount,
    payables,
    payableRefNumber: firstPayable?.refNumber,
    payableStatus: firstPayable?.status,
  };
}

export function recalculateMBU(deal: Deal): Deal {
  const huspyRevenue = (deal.bankSlab / 100) * deal.disbursedAmount;
  const rmPayout = (deal.rmCommissionRate / 100) * huspyRevenue;
  const tlPayout = (deal.tlCommissionRate / 100) * huspyRevenue;
  const dsPayout = (deal.dsCommissionRate / 100) * huspyRevenue;
  const brokerPayout = (deal.brokerCommissionRate / 100) * deal.disbursedAmount;
  const externalPayout = (deal.externalCommissionRate / 100) * huspyRevenue;

  const cogsInternal = rmPayout + tlPayout + dsPayout;
  const cogsExternal = brokerPayout + externalPayout;
  const totalCOGS = cogsInternal + cogsExternal;
  const netHuspyRevenue = huspyRevenue - totalCOGS;

  // Build payable entries for MBU
  const payableEntries: { entityType: PayableEntry["entityType"]; entityLabel: string; expectedAmount: number }[] = [];
  if (deal.rmName || rmPayout > 0) payableEntries.push({ entityType: "rm", entityLabel: `RM${deal.rmName ? ` — ${deal.rmName}` : ""}`, expectedAmount: rmPayout });
  if (deal.tlName || tlPayout > 0) payableEntries.push({ entityType: "tl", entityLabel: `TL${deal.tlName ? ` — ${deal.tlName}` : ""}`, expectedAmount: tlPayout });
  if (deal.dsName || dsPayout > 0) payableEntries.push({ entityType: "ds", entityLabel: `DS${deal.dsName ? ` — ${deal.dsName}` : ""}`, expectedAmount: dsPayout });
  if (brokerPayout > 0) payableEntries.push({ entityType: "broker", entityLabel: "Broker", expectedAmount: brokerPayout });
  if (externalPayout > 0) payableEntries.push({ entityType: "external_partner", entityLabel: "External", expectedAmount: externalPayout });

  const payables = buildPayables(deal, payableEntries);
  const firstPayable = payables[0];

  return {
    ...deal,
    huspyRevenue,
    rmPayout,
    tlPayout,
    dsPayout,
    brokerPayout,
    externalPayout,
    cogsInternal,
    cogsExternal,
    cogsReferrals: 0,
    netHuspyRevenue,
    dealAmount: huspyRevenue,
    dealPrice: deal.disbursedAmount,
    takeRate: deal.bankSlab,
    payables,
    payableRefNumber: firstPayable?.refNumber,
    payableStatus: firstPayable?.status,
  };
}

export function recalculateDeal(deal: Deal): Deal {
  if (deal.businessUnit === "mortgage") return recalculateMBU(deal);
  // Try engine path first; if the deal lacks the lean-shape markers we fall back
  // to the legacy per-agent-rate computation so editing those rates in the PnL
  // panel still has an effect on deals that haven't been migrated yet.
  const viaEngine = applyEngineToREBU(deal);
  return viaEngine ?? recalculateREBU(deal);
}

export function computeDealPnL(deal: Deal) {
  const input = buildEngineInput(deal);
  if (!input) return null;
  const pnl = calculateProjectedPnL(input);

  const fixedAgents = sharedDealStakeholders.filter(
    (s) => s.dealId === deal.id && s.role === "INTERNAL_PAYOUT" && s.fixedAmount != null
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

export function createEmptyAgent(index: number): AgentEntry {
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
