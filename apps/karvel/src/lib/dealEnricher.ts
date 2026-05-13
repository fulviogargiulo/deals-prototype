import {
  sharedDealStakeholders,
  sharedAgents,
  sharedParties,
  computeDealFinancials,
  COMMISSION_RATES,
} from "@huspy/shared-domain";
import type { Deal as BaseDeal } from "@huspy/shared-domain";
import type { Deal, AgentEntry } from "@/data/types";

const agentDisplayName: Record<string, string> = {
  "agent-felicia": "Felicia Canovas",
  "agent-guilherme": "Guilherme Castro",
  "agent-omar": "Omar Al Saleem",
  "agent-gelo": "Gelo Huspy",
  "agent-ravi": "Ravi Nair",
  "agent-zainab": "Zainab Al-Qadi",
};

export function enrichDeal(deal: BaseDeal): Deal {
  const f = computeDealFinancials(deal.dealAmount, deal.conveyanceRevenue ?? 0);

  const agentStakes = sharedDealStakeholders.filter((s) => s.dealId === deal.id && s.role === "INTERNAL_PAYOUT");
  const agents: AgentEntry[] = agentStakes.map((stake) => {
    const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
    const name = agent ? (agentDisplayName[agent.id] ?? agent.id) : stake.partyId;
    const split = (stake.splitPercentage ?? 100) / 100;
    return {
      agentName: name,
      agentId: agent?.id,
      agentShare: stake.splitPercentage ?? 100,
      agentCommissionRate: COMMISSION_RATES.agentGrossRate,
      agentCommissionPayout: Math.round(f.agentCommissionPayout * split),
      agentIncentive: 0,
      agentDeductions: 0,
      agentTotalAmount: Math.round(f.agentCommissionPayout * split),
      teamLeadName: agent?.teamLeadName,
      teamLeadRate: COMMISSION_RATES.teamLeadRate,
      teamLeadShare: Math.round(f.teamLeadShare * split),
      managerName: agent?.managerName,
      managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
      managerOverride: Math.round(f.managerOverride * split),
      referralPercentage: 0,
      referralAmount: 0,
      clientKickback: 0,
    };
  });

  const primaryEntry = agents[0];

  const conveyanceStake = sharedDealStakeholders.find((s) => s.dealId === deal.id && s.role === "OPERATIONAL_DEDUCTION");
  const conveyanceParty = conveyanceStake ? sharedParties.find((p) => p.id === conveyanceStake.partyId) : undefined;

  const rebateAmount = deal.market === "primary"
    ? Math.round(((deal.rebatePercentage ?? 0) / 100) * deal.dealAmount)
    : 0;
  const subsidyAmt = deal.subsidyAmount ?? 0;

  return {
    ...deal,
    agents,
    agentShare: 100,
    agentCommissionRate: COMMISSION_RATES.agentGrossRate,
    agentCommissionPayout: f.agentCommissionPayout,
    teamLeadName: primaryEntry?.teamLeadName,
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    teamLeadShare: primaryEntry?.teamLeadShare ?? f.teamLeadShare,
    managerName: primaryEntry?.managerName,
    managerOverrideRate: COMMISSION_RATES.managerOverrideRate,
    managerOverride: primaryEntry?.managerOverride ?? f.managerOverride,
    conveyanceAgentName: conveyanceParty?.displayName,
    conveyanceAgentRate: COMMISSION_RATES.conveyanceAgentRate,
    conveyanceAgentPayout: f.conveyanceAgentPayout,
    huspyConveyanceShare: f.huspyConveyanceShare,
    clientKickback: 0,
    referralPercentage: 0,
    referralAmount: 0,
    rebateAmount,
    cogsInternal: f.cogsInternal,
    cogsExternal: rebateAmount + subsidyAmt,
    cogsReferrals: 0,
    cogsRebates: rebateAmount,
    cogsSubsidy: subsidyAmt,
    externalPartners: [],
    externalPartnerShare: 0,
    payables: [],
    statusHistory: [],
  };
}
