import { Deal, Tranche, AgentEntry, PayableEntry } from "@/data/types";
import { getTranches } from "@/data/trancheStore";
import { getDeals } from "@/data/dealStore";
import {
  calculateProjectedPnL,
  getBlueprint,
  resolveBrokerRate,
  getMBUDirectRate,
  DEFAULT_EXTERNAL_REFERRAL_RATE,
  sharedAgentFinancials,
  sharedPnlEntries,
  sharedDealParticipants,
  sharedAgents,
  sharedParties,
  sharedLedgers,
  sharedPostings,
  sharedPostingLines,
  type AgentFinancials,
  type Blueprint,
  type PnlEntry,
  type Posting,
  type PostingLine,
  type ProjectedPnL,
} from "@huspy/shared-domain";


// ── Engine dispatch ──────────────────────────────────────────────────────────
// businessUnit + channel live on Deal (header); pnlEngine lives on Tranche.
export type DealEngineKey = "rebu" | "mbu-ma-broker" | "mbu-direct" | "manual";

export function derivePnlEngine(deal: Pick<Deal, "businessUnit" | "channel">): DealEngineKey {
  if (deal.businessUnit !== "mortgage") return "rebu";
  switch (deal.channel) {
    case "MA":
    case "BYOB":               return "mbu-ma-broker";
    case "REA":
    case "DS":
    case "B2C":                return "mbu-direct";
    case "BBG":                return "manual";
    default:                   return "manual";
  }
}

export function getDealEngine(
  deal: Pick<Deal, "businessUnit" | "channel">,
  tranche?: Pick<Tranche, "pnlEngine">
): DealEngineKey {
  if (tranche?.pnlEngine) return tranche.pnlEngine as DealEngineKey;
  return derivePnlEngine(deal);
}

// ── Posting policy ───────────────────────────────────────────────────────────
const ENGINE_POSTING_POLICY: Record<DealEngineKey, { agentCommissionTrigger: string }> = {
  "rebu":          { agentCommissionTrigger: "finalized" },
  "mbu-ma-broker": { agentCommissionTrigger: "invoicing" },
  "mbu-direct":    { agentCommissionTrigger: "invoicing" },
  "manual":        { agentCommissionTrigger: "invoicing" },
};

export function fireCommissionAccrualOnTransition(tranche: Tranche, deal: Deal, toStatus: string): void {
  const trigger = ENGINE_POSTING_POLICY[getDealEngine(deal, tranche)].agentCommissionTrigger;
  if (toStatus === trigger && tranche.status !== trigger) {
    createCommissionAccrualPosting(tranche, deal);
  }
}

function buildEngineInput(
  tranche: Tranche,
  deal: Deal,
  allTranches: Tranche[]
): Parameters<typeof calculateProjectedPnL>[0] | null {
  const country = deal.country ?? "ae";
  const currency = deal.currency ?? "AED";
  const businessUnit = deal.businessUnit ?? "rebu";
  const blueprint = getBlueprint(country, businessUnit);

  const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
  const partyIdToAgentId: Record<string, string> = {};
  const partyDisplayNames: Record<string, string> = {};

  const allFixtureStakes = sharedPnlEntries.filter((s) => s.trancheId === tranche.id);

  // grossRevenue is always derived from REVENUE_SOURCE stakes — not stored on Tranche.
  const revenueStakes = allFixtureStakes.filter((s) => s.role === "REVENUE_SOURCE" && (s.amount ?? 0) > 0);
  const derivedGrossRevenue = revenueStakes.length > 0
    ? revenueStakes.reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0)
    : null;
  if (derivedGrossRevenue == null) return null;

  const engine = getDealEngine(deal, tranche);

  for (const stake of allFixtureStakes) {
    const party = sharedParties.find((p) => p.id === stake.partyId);
    if (party) partyDisplayNames[stake.partyId] = party.displayName;

    if (stake.role === "AGENT_PAYOUT") {
      const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
      if (!agent) continue;
      let af = sharedAgentFinancials.find((f) => f.agentId === agent.id && f.pnlEngine === engine);
      if (engine === "mbu-ma-broker") {
        const reportingMonth = tranche.reportDate?.slice(0, 7);
        const bankParticipant = sharedDealParticipants.find((p) => p.dealId === deal.id && p.role === "SUPPLY");
        const bankId = bankParticipant?.partyId;
        // GMV scan across all tranches in the same reporting month for this broker
        const brokerMonthlyGmv = allTranches
          .filter((t) => {
            const tDeal = getDeals().find((d) => d.id === t.dealId);
            return tDeal && getDealEngine(tDeal, t) === "mbu-ma-broker" && t.reportDate?.startsWith(reportingMonth ?? "\0");
          })
          .reduce((sum, t) => {
            const hasBroker = sharedPnlEntries.some(
              (s) => s.trancheId === t.id && s.role === "AGENT_PAYOUT" && s.partyId === stake.partyId
            );
            if (!hasBroker) return sum;
            const tDeal = getDeals().find((d) => d.id === t.dealId);
            return sum + (tDeal?.dealAmount ?? 0);
          }, 0);
        let resolvedPct = reportingMonth && bankId
          ? resolveBrokerRate(reportingMonth, bankId, brokerMonthlyGmv)
          : undefined;
        const penalty = af?.byobPenaltyRate ?? 0;
        if (resolvedPct != null && penalty > 0) resolvedPct = resolvedPct - penalty;
        if (resolvedPct != null) {
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
        const reportingMonth = tranche.reportDate?.slice(0, 7);
        const channel = deal.channel as "REA" | "DS" | "B2C";
        const isSelfSourced = !allFixtureStakes.some((s) => s.role === "OPERATIONAL_DEDUCTION");
        const resolvedPct = reportingMonth ? getMBUDirectRate(reportingMonth, channel, isSelfSourced) : undefined;
        if (resolvedPct != null) {
          af = {
            id: af?.id ?? `af-syn-${agent.id}`,
            agentId: agent.id,
            pnlEngine: engine,
            connectedAgents: af?.connectedAgents,
            strategy: { kind: "flat", pct: resolvedPct },
          };
        }
      }
      partyIdToAgentId[stake.partyId] = agent.id;
      if (!af) continue;
      agentFinancialsByAgentId[agent.id] = af;
    }
  }

  let stakeholders: PnlEntry[] = allFixtureStakes;

  const hasFixedPayouts = allFixtureStakes.some(
    (s) => s.role === "AGENT_PAYOUT" && s.source === "manual" && s.amount != null
  );

  // Legacy AgentEntry[] fallback (wizard-created deals before stakeholder migration).
  if (Object.keys(agentFinancialsByAgentId).length === 0 && !hasFixedPayouts && tranche.agents && tranche.agents.length > 0) {
    const legacyAgentStakes: PnlEntry[] = [];
    tranche.agents.forEach((a, idx) => {
      const agentId = a.agentId ?? `agent-${tranche.id}-${idx}`;
      const partyId = a.agentId ? `party-${a.agentId}` : `party-${agentId}`;
      legacyAgentStakes.push({
        id: `ds-${tranche.id}-agent-${idx}`,
        trancheId: tranche.id,
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

  // All REVENUE_SOURCE amounts come from explicit stakes — no implicit fallback needed.

  if (getDealEngine(deal, tranche) === "mbu-direct") {
    stakeholders = stakeholders.map((s) => {
      if (s.role === "OPERATIONAL_DEDUCTION" && !s.amount) {
        return { ...s, amount: -(deal.dealAmount * DEFAULT_EXTERNAL_REFERRAL_RATE / 100) };
      }
      return s;
    });
  }

  return {
    country,
    businessUnit,
    currency,
    grossRevenue: derivedGrossRevenue,
    agentPayoutBase: getDealEngine(deal, tranche) === "mbu-ma-broker" ? deal.dealAmount : undefined,
    stakeholders,
    agentFinancialsByAgentId,
    partyIdToAgentId,
    blueprint,
    partyDisplayNames,
  };
}

function applyWaterfallEngine(tranche: Tranche, deal: Deal, allTranches: Tranche[]): Tranche | null {
  const input = buildEngineInput(tranche, deal, allTranches);
  if (!input) return null;
  const projection = calculateProjectedPnL(input);

  const splitsByAgentId = new Map(projection.splits.map((s) => [s.agentId, s]));
  const updatedAgents: AgentEntry[] = (tranche.agents ?? []).map((a, idx) => {
    const agentId = a.agentId ?? `agent-${tranche.id}-${idx}`;
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

  const externals = tranche.externalPartners ?? [];

  const existing = tranche.payables ?? [];
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
    ...tranche,
    agents: updatedAgents,
    externalPartners: externals,
    huspyRevenue: projection.grossRevenue,   // KarvelTranche extension field
    netHuspyRevenue: projection.huspyMargin, // KarvelTranche extension field
    agentShare: first?.agentShare ?? (tranche as Tranche).agentShare ?? 0,
    agentCommissionRate: first?.agentCommissionRate ?? (tranche as Tranche).agentCommissionRate ?? 0,
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

export function recalculateTranche(tranche: Tranche, deal: Deal, allTranches: Tranche[] = getTranches()): Tranche {
  return applyWaterfallEngine(tranche, deal, allTranches) ?? tranche;
}

/** @deprecated Use recalculateTranche instead. */
export function recalculateDeal(deal: Deal, _allDeals: Deal[] = []): Deal {
  return deal;
}

export function computeTranchePnL(tranche: Tranche, deal: Deal) {
  const input = buildEngineInput(tranche, deal, getTranches());
  if (!input) return null;
  return calculateProjectedPnL(input);
}

/** @deprecated Use computeTranchePnL instead. */
export function computeDealPnL(deal: Deal & { status?: string; grossRevenue?: number; pnlEngine?: string }) {
  return null;
}

export function syncEngineAmounts(tranche: Tranche, deal: Deal): void {
  const pnl = computeTranchePnL(tranche, deal);
  if (!pnl) return;

  const draftStakes = sharedPnlEntries.filter(
    (s) => s.trancheId === tranche.id && s.status !== "confirmed" && s.source === "engine" && s.role === "AGENT_PAYOUT"
  );

  for (const split of pnl.splits) {
    const agentStake = draftStakes.find((s) => s.partyId === split.partyId);
    if (agentStake) agentStake.amount = split.agentPayout;

    for (const cp of split.connectedAgentPayouts) {
      const caAgent = sharedAgents.find((a) => a.id === cp.agentId);
      if (!caAgent) continue;
      const rounded = Math.round(cp.amount * 100) / 100;
      const caStake = draftStakes.find((s) => s.partyId === caAgent.partyId);
      if (caStake) {
        caStake.amount = rounded;
      } else {
        sharedPnlEntries.push({
          id: `ds-${tranche.id}-ca-${cp.agentId}-for-${split.partyId}`,
          trancheId: tranche.id,
          partyId: caAgent.partyId,
          role: "AGENT_PAYOUT",
          description: cp.label,
          amount: rounded,
          source: "engine",
          status: "draft",
        });
      }
    }
  }
}

const LEDGER_IDS: Record<string, { ar: number; rev: number; exp: number; agentPayable: number; extPayable: number; tax: number; withholding: number }> = {
  EUR: { ar: 2,  rev: 6,  exp: 7,  agentPayable: 3,  extPayable: 4,  tax: 5,  withholding: 28 },
  AED: { ar: 9,  rev: 13, exp: 14, agentPayable: 10, extPayable: 11, tax: 12, withholding: 29 },
  SAR: { ar: 16, rev: 20, exp: 21, agentPayable: 17, extPayable: 18, tax: 19, withholding: 30 },
};

export function draftPostings(
  projection: ProjectedPnL,
  tranche: { id: string; dealId?: string },
  deal: { businessUnit?: string; currency?: string },
  blueprint?: Blueprint
): { posting: Posting; lines: PostingLine[] } {
  const currency = (deal.currency ?? "EUR") as "EUR" | "AED" | "SAR";
  const ids = LEDGER_IDS[currency] ?? LEDGER_IDS.EUR;
  const postingId = `draft-${tranche.id}`;
  const now = new Date().toISOString();

  const posting: Posting = {
    id: postingId,
    trancheId: tranche.id,
    businessUnit: deal.businessUnit as any,
    businessProcess: "invoice_issued",
    createdBy: "user-ops",
    createdAt: now,
    valueDate: now.slice(0, 10),
    currency,
    description: `Deal close — ${tranche.id}`,
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

  lines.push(line(ids.ar, "DEBIT", projection.grossRevenue));
  lines.push(line(ids.rev, "CREDIT", projection.grossRevenue));

  if (blueprint && blueprint.taxRate > 0) {
    const taxAmount = Math.round(projection.grossRevenue * (blueprint.taxRate / 100) * 100) / 100;
    if (taxAmount > 0) {
      lines.push(line(ids.rev, "DEBIT", taxAmount));
      lines.push(line(ids.tax, "CREDIT", taxAmount));
    }
  }

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

export function createCommissionAccrualPosting(tranche: Tranche, deal: Deal): void {
  const pnl = computeTranchePnL(tranche, deal);
  if (!pnl || pnl.totalAgentPayout <= 0) return;

  const currency = (deal.currency ?? "EUR") as "EUR" | "AED" | "SAR";
  const ids = LEDGER_IDS[currency] ?? LEDGER_IDS.EUR;
  const now = new Date().toISOString();
  const ts = Date.now();

  const pushPosting = (pid: string, description: string) => {
    sharedPostings.push({
      id: pid, trancheId: tranche.id, businessUnit: deal.businessUnit as any,
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
      const pid = `posting-finalize-${tranche.id}-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${agentName} (${tranche.id})`);
      push2Lines(pid, subledger.id, Math.round(split.agentPayout * 100) / 100);
    }

    for (const cp of split.connectedAgentPayouts) {
      if (cp.amount <= 0 || !cp.ledgerId) continue;
      const subledger = sharedLedgers.find((l) => l.id === cp.ledgerId);
      if (!subledger) throw new Error(`No subledger id=${cp.ledgerId} for ${cp.label} of agent ${split.agentId}`);
      const cpName = sharedParties.find((p) => p.id === subledger.partyId)?.displayName ?? cp.label;
      const pid = `posting-finalize-${tranche.id}-ca-${cp.agentId}-${split.agentId}-${ts}`;
      pushPosting(pid, `Commission accrual — ${cpName} / ${cp.label} for ${agentName} (${tranche.id})`);
      push2Lines(pid, subledger.id, Math.round(cp.amount * 100) / 100);
    }
  }

  for (const entry of pnl.ledger) {
    if (entry.side !== "DEBIT" || (entry.bucket !== "acquisition-cost" && entry.bucket !== "operational-cost")) continue;
    if (entry.amount <= 0) continue;
    const subledger = entry.partyId ? sharedLedgers.find((l) => l.partyId === entry.partyId) : undefined;
    if (!subledger) continue;
    const creditId = subledger.id;
    const name = entry.partyId
      ? (sharedParties.find((p) => p.id === entry.partyId)?.displayName ?? entry.partyId)
      : entry.label;
    const pid = `posting-finalize-${tranche.id}-cost-${entry.id}-${ts}`;
    pushPosting(pid, `Cost accrual — ${name} (${tranche.id})`);
    push2Lines(pid, creditId, Math.round(entry.amount * 100) / 100);
  }
}

export function confirmTrancheStakeholders(tranche: Tranche, deal: Deal): void {
  const pnl = computeTranchePnL(tranche, deal);
  if (!pnl) return;

  const splitByPartyId = new Map(pnl.splits.map((s) => [s.partyId, s]));
  const trancheStakes = sharedPnlEntries.filter((s) => s.trancheId === tranche.id);

  for (const stake of trancheStakes) {
    if (stake.role === "AGENT_PAYOUT" && stake.source !== "manual") {
      const split = splitByPartyId.get(stake.partyId);
      if (split) {
        stake.amount = split.agentPayout;
        stake.source = "engine";
      }
    }
    stake.status = "confirmed";
  }

  for (const split of pnl.splits) {
    for (const cp of split.connectedAgentPayouts) {
      if (cp.amount <= 0) continue;
      const caAgent = sharedAgents.find((a) => a.id === cp.agentId);
      const caPartyId = caAgent?.partyId ?? `party-${cp.agentId}`;
      const stakeId = `ds-${tranche.id}-ca-${cp.agentId}-for-${split.partyId}`;
      const rounded = Math.round(cp.amount * 100) / 100;

      const existing = sharedPnlEntries.find((s) => s.id === stakeId);
      if (existing) {
        existing.amount = rounded;
        existing.source = "engine";
        existing.status = "confirmed";
      } else {
        sharedPnlEntries.push({
          id: stakeId,
          trancheId: tranche.id,
          partyId: caPartyId,
          role: "AGENT_PAYOUT",
          description: cp.label,
          amount: rounded,
          source: "engine",
          status: "confirmed",
        });
      }
    }
  }
}

export function getMissingAgentFinancials(
  engine: DealEngineKey,
  stakeholders: PnlEntry[]
): Array<{ agentId: string; displayName: string }> {
  if (engine === "manual") return [];
  const missing: Array<{ agentId: string; displayName: string }> = [];
  for (const stake of stakeholders) {
    if (stake.role !== "AGENT_PAYOUT") continue;
    if (stake.source === "manual" && stake.amount != null) continue;
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

// ── deriveDisplayStatus — used by deal list / kanban ──────────────────────────
// Picks the "most active" status from a deal's tranches for display purposes.
const STATUS_PRIORITY: Partial<Record<string, number>> = {
  "under-review":           6,
  "pending-agent-approval": 5,
  "pending-details":        4,
  "invoicing":              3,
  "finalized":              2,
  "canceled":               1,
};

export function deriveDisplayStatus(tranches: Tranche[]): string {
  if (tranches.length === 0) return "pending-details";
  return tranches.reduce((best, t) =>
    (STATUS_PRIORITY[t.status] ?? 0) > (STATUS_PRIORITY[best.status] ?? 0) ? t : best
  ).status;
}
