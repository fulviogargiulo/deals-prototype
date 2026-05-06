import { Deal, AgentEntry, PayableEntry } from "@/data/types";

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
        status: prev?.status || "Pending",
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

  const conveyanceAgentPayout = (deal.conveyanceAgentRate / 100) * deal.conveyanceRevenue;
  const huspyConveyanceShare = deal.conveyanceRevenue - conveyanceAgentPayout;

  // Referrals are now per-agent
  const totalReferralAmount = agents.reduce((sum, a) => sum + a.referralAmount, 0);
  const totalClientKickback = agents.reduce((sum, a) => sum + (a.clientKickback || 0), 0);

  // Rebates & Subsidy
  const rebateAmount = deal.market === "Primary" ? (deal.rebatePercentage / 100) * deal.dealPrice : 0;
  const subsidyAmount = deal.market === "Secondary" ? (deal.subsidyAmount || 0) : 0;

  const cogsInternal = totalAgentPayout + totalTeamLeadShare + totalManagerOverride + conveyanceAgentPayout;
  const cogsExternal = extPayout + Math.max(0, rebateAmount) + Math.max(0, subsidyAmount);
  const cogsReferrals = Math.max(0, totalReferralAmount) + totalClientKickback;
  const cogsRebates = Math.max(0, rebateAmount);
  const cogsSubsidy = Math.max(0, subsidyAmount);
  const totalCOGS = cogsInternal + cogsExternal + cogsReferrals;
  const netHuspyRevenue = huspyRevenue + deal.conveyanceRevenue - totalCOGS;
  const amount = huspyRevenue + deal.conveyanceRevenue;

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

  // Conveyance agent
  if (deal.conveyanceAgentName || conveyanceAgentPayout > 0) {
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
    amount,
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
    amount: huspyRevenue,
    dealPrice: deal.disbursedAmount,
    takeRate: deal.bankSlab,
    payables,
    payableRefNumber: firstPayable?.refNumber,
    payableStatus: firstPayable?.status,
  };
}

export function recalculateDeal(deal: Deal): Deal {
  return deal.businessUnit === "Mortgage" ? recalculateMBU(deal) : recalculateREBU(deal);
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
