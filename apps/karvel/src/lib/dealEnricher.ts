import {
  sharedPnlEntries,
  sharedAgents,
  sharedParties,
} from "@huspy/shared-domain";
import type { Deal as BaseDeal, Tranche as BaseTranche } from "@huspy/shared-domain";
import type { Deal, Tranche, AgentEntry } from "@/data/types";

const agentDisplayName: Record<string, string> = {
  "agent-001": "Felicia Canovas",
  "agent-002": "Guilherme Castro",
  "agent-003": "Omar Al Saleem",
  "agent-004": "Gelo Huspy",
  "agent-005": "Ravi Nair",
  "agent-006": "Zainab Al-Qadi",
};

export function enrichDeal(deal: BaseDeal): Deal {
  // Deal is now a thin header — no P&L enrichment needed.
  // agentName is the primary agent resolved from the first tranche's stakeholders.
  const primaryStake = sharedPnlEntries.find(
    (s) => s.trancheId.startsWith(deal.id) && s.role === "AGENT_PAYOUT" && s.isPrimary
  );
  const primaryAgent = primaryStake ? sharedAgents.find((a) => a.partyId === primaryStake.partyId) : undefined;
  const agentName = primaryAgent
    ? (agentDisplayName[primaryAgent.id] ?? primaryAgent.id)
    : deal.agentName ?? "Unknown";

  return { ...deal, agentName };
}

export function enrichTranche(tranche: BaseTranche, deal: BaseDeal): Tranche {
  const agentStakes = sharedPnlEntries.filter(
    (s) => s.trancheId === tranche.id && s.role === "AGENT_PAYOUT"
  );
  const agents: AgentEntry[] = agentStakes.map((stake) => {
    const agent = sharedAgents.find((a) => a.partyId === stake.partyId);
    const name = agent ? (agentDisplayName[agent.id] ?? agent.id) : stake.partyId;
    return {
      agentName: name,
      agentId: agent?.id,
      agentShare: stake.splitPercentage ?? 100,
      agentCommissionRate: 0,
      agentCommissionPayout: 0,
      agentIncentive: 0,
      agentDeductions: 0,
      agentTotalAmount: 0,
      teamLeadName: agent?.teamLeadName,
      teamLeadRate: 0,
      teamLeadShare: 0,
      managerName: agent?.managerName,
      managerOverrideRate: 0,
      managerOverride: 0,
      referralPercentage: 0,
      referralAmount: 0,
      clientKickback: 0,
    };
  });

  const primaryEntry = agents[0];

  const conveyanceStake = sharedPnlEntries.find(
    (s) => s.trancheId === tranche.id && s.role === "OPERATIONAL_DEDUCTION"
  );
  const conveyanceParty = conveyanceStake
    ? sharedParties.find((p) => p.id === conveyanceStake.partyId)
    : undefined;

  return {
    ...tranche,
    agents,
    agentShare: 100,
    agentCommissionRate: 0,
    agentCommissionPayout: 0,
    teamLeadName: primaryEntry?.teamLeadName,
    teamLeadRate: 0,
    teamLeadShare: 0,
    managerName: primaryEntry?.managerName,
    managerOverrideRate: 0,
    managerOverride: 0,
    conveyanceAgentName: conveyanceParty?.displayName,
    conveyanceAgentRate: 0,
    conveyanceAgentPayout: 0,
    huspyConveyanceShare: 0,
    clientKickback: 0,
    referralPercentage: 0,
    referralAmount: 0,
    cogsInternal: 0,
    cogsExternal: 0,
    cogsReferrals: 0,
    externalPartners: [],
    payables: [],
  };
}
