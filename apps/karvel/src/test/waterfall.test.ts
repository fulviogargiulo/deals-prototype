import { describe, it, expect } from "vitest";
import {
  calculateProjectedPnL,
  type AgentFinancials,
  type Blueprint,
  type DealStakeholder,
  type ProjectedPnLInput,
} from "@huspy/shared-domain";

/**
 * Waterfall engine — unit + parity tests.
 *
 * The engine operates on tax-exclusive amounts. Bucket A is always 0.
 * Tax PostingLines are emitted by draftPostings using blueprint.taxRate.
 *
 * Strategy:
 *   - Use a minimal hand-rolled blueprint per test so each step is verifiable.
 *   - Verify the LEDGER is balanced: Σ CREDITs (gross + net) and Σ DEBITs
 *     match each bucket total. commissionBase = gross − C. Net = gross − C − D.
 *     Agent splits apply to commissionBase (D does not reduce the agent pool).
 *     Huspy margin = net − B.
 *   - Cover all three AgentStrategy kinds (flat, slab, max).
 */

const baseInput = (overrides: Partial<ProjectedPnLInput> = {}): ProjectedPnLInput => ({
  country: "ae",
  businessUnit: "rebu",
  currency: "AED",
  grossRevenue: 10_000,
  stakeholders: [],
  agentFinancialsByAgentId: {},
  partyIdToAgentId: {},
  ...overrides,
});

const minimalBlueprint: Blueprint = {
  id: "bp-test-minimal",
  country: "ae",
  businessUnit: "rebu",
  taxRate: 0,
  taxLabel: "VAT",
};

describe("calculateProjectedPnL — no costs, no agents", () => {
  it("emits gross + net ledger entries and zero everything else", () => {
    const r = calculateProjectedPnL(baseInput({ blueprint: minimalBlueprint }));
    expect(r.grossRevenue).toBe(10_000);

    expect(r.totalAcquisitionCost).toBe(0);
    expect(r.totalOperationalCost).toBe(0);
    expect(r.totalAgentPayout).toBe(0);
    expect(r.huspyMargin).toBe(10_000);
    expect(r.splits).toHaveLength(0);

    const credits = r.ledger.filter((e) => e.side === "CREDIT");
    expect(credits).toHaveLength(1); // gross only
    expect(credits[0]?.amount).toBe(10_000);
  });
});

describe("calculateProjectedPnL — deduction costs", () => {
  it("routes ACQUISITION_DEDUCTION to acquisition cost and OPERATIONAL_DEDUCTION to operational cost", () => {
    const stakeholders: DealStakeholder[] = [
      { id: "s-c1", dealId: "d", partyId: "p-ref-a", role: "ACQUISITION_DEDUCTION", financialAmount: -800 },
      { id: "s-c2", dealId: "d", partyId: "p-ref-b", role: "ACQUISITION_DEDUCTION", financialAmount: -500 },
      { id: "s-d1", dealId: "d", partyId: "p-notary", role: "OPERATIONAL_DEDUCTION", financialAmount: -1_200 },
    ];
    const r = calculateProjectedPnL(baseInput({ blueprint: minimalBlueprint, stakeholders }));
    expect(r.totalAcquisitionCost).toBe(800 + 500);
    expect(r.totalOperationalCost).toBe(1_200);
    expect(r.commissionBase).toBe(10_000 - 1_300); // 8_700 — agent splits apply here
    expect(r.huspyMargin).toBe(10_000 - 1_300 - 1_200); // 7_500 — no agents

  });
});

describe("calculateProjectedPnL — agent payout, flat strategy", () => {
  it("pays the agent flat% of allocated net, plus TL and manager additive", () => {
    const stakeholders: DealStakeholder[] = [
      { id: "ds-1", dealId: "d", partyId: "party-felicia", role: "AGENT_PAYOUT", splitPercentage: 100 },
    ];
    const af: AgentFinancials = {
      id: "af-001",
      agentId: "agent-001",
      strategy: { kind: "flat", pct: 40 },
      teamLeadRate: 10,
      managerRate: 5,
    };
    const r = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        stakeholders,
        agentFinancialsByAgentId: { "agent-001": af },
        partyIdToAgentId: { "party-felicia": "agent-001" },
      }),
    );

    expect(r.splits).toHaveLength(1);
    const s = r.splits[0];
    expect(s.allocatedNet).toBe(10_000);
    expect(s.agentPayout).toBe(4_000);
    expect(s.teamLeadPayout).toBe(400);
    expect(s.managerPayout).toBe(200);
    expect(r.totalAgentPayout).toBe(4_000 + 400 + 200);
    expect(r.huspyMargin).toBe(10_000 - 4_600);
  });

  it("matches the legacy commissionCalc formula for the no-deduction baseline", () => {
    // Legacy: deal €385k × 3% takeRate → huspyRevenue €11,550
    //         agentGrossRate 40% → agent €4,620
    //         teamLead 10% of agent → €462
    //         manager 5% of agent → €231
    //         huspyNet = 11,550 − 4,620 − 462 − 231 = €6,237
    const stakeholders: DealStakeholder[] = [
      { id: "ds-1", dealId: "d", partyId: "party-felicia", role: "AGENT_PAYOUT", splitPercentage: 100 },
    ];
    const af: AgentFinancials = {
      id: "af-001",
      agentId: "agent-001",
      strategy: { kind: "flat", pct: 40 },
      teamLeadRate: 10,
      managerRate: 5,
    };
    const r = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 11_550,
        currency: "EUR",
        country: "es",
        stakeholders,
        agentFinancialsByAgentId: { "agent-001": af },
        partyIdToAgentId: { "party-felicia": "agent-001" },
      }),
    );

    expect(r.splits[0].agentPayout).toBe(4_620);
    expect(r.splits[0].teamLeadPayout).toBe(462);
    expect(r.splits[0].managerPayout).toBe(231);
    expect(r.huspyMargin).toBe(6_237);
  });
});

describe("calculateProjectedPnL — slab strategy", () => {
  it("applies progressive slabs on allocated net", () => {
    // Slabs: 0..5000 @ 35%, 5000..20000 @ 45%, 20000..∞ @ 55%
    // allocatedNet 25_000 → 5000×0.35 + 15000×0.45 + 5000×0.55 = 1_750 + 6_750 + 2_750 = 11_250
    const stakeholders: DealStakeholder[] = [
      { id: "ds-1", dealId: "d", partyId: "party-ravi", role: "AGENT_PAYOUT", splitPercentage: 100 },
    ];
    const af: AgentFinancials = {
      id: "af-005",
      agentId: "agent-005",
      strategy: {
        kind: "slab",
        slabs: [
          { upTo: 5_000, pct: 35 },
          { upTo: 20_000, pct: 45 },
          { upTo: null, pct: 55 },
        ],
      },
    };
    const r = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 25_000,
        stakeholders,
        agentFinancialsByAgentId: { "agent-005": af },
        partyIdToAgentId: { "party-ravi": "agent-005" },
      }),
    );
    expect(r.splits[0].agentPayout).toBe(11_250);
  });
});

describe("calculateProjectedPnL — max strategy", () => {
  it("caps payout at capAmount", () => {
    const stake: DealStakeholder = { id: "ds-1", dealId: "d", partyId: "party-z", role: "AGENT_PAYOUT", splitPercentage: 100 };
    const af: AgentFinancials = {
      id: "af-z",
      agentId: "agent-z",
      strategy: { kind: "max", pct: 50, capAmount: 25_000 },
    };
    const under = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 30_000,
        stakeholders: [stake],
        agentFinancialsByAgentId: { "agent-z": af },
        partyIdToAgentId: { "party-z": "agent-z" },
      }),
    );
    expect(under.splits[0].agentPayout).toBe(15_000);

    const over = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 60_000,
        stakeholders: [stake],
        agentFinancialsByAgentId: { "agent-z": af },
        partyIdToAgentId: { "party-z": "agent-z" },
      }),
    );
    expect(over.splits[0].agentPayout).toBe(25_000);
  });
});

describe("calculateProjectedPnL — multi-agent split", () => {
  it("allocates net pro-rata by DealStakeholder.splitPercentage and runs each strategy", () => {
    const stakeholders: DealStakeholder[] = [
      { id: "ds-a", dealId: "d", partyId: "party-a", role: "AGENT_PAYOUT", splitPercentage: 70 },
      { id: "ds-b", dealId: "d", partyId: "party-b", role: "AGENT_PAYOUT", splitPercentage: 30 },
    ];
    const finA: AgentFinancials = { id: "af-a", agentId: "agent-a", strategy: { kind: "flat", pct: 40 } };
    const finB: AgentFinancials = { id: "af-b", agentId: "agent-b", strategy: { kind: "flat", pct: 50 } };
    const r = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 10_000,
        stakeholders,
        agentFinancialsByAgentId: { "agent-a": finA, "agent-b": finB },
        partyIdToAgentId: { "party-a": "agent-a", "party-b": "agent-b" },
      }),
    );

    expect(r.splits).toHaveLength(2);
    expect(r.splits[0].allocatedNet).toBeCloseTo(7_000);
    expect(r.splits[0].agentPayout).toBeCloseTo(2_800);
    expect(r.splits[1].allocatedNet).toBeCloseTo(3_000);
    expect(r.splits[1].agentPayout).toBeCloseTo(1_500);
    expect(r.totalAgentPayout).toBeCloseTo(2_800 + 1_500);
    expect(r.huspyMargin).toBeCloseTo(10_000 - 4_300);
  });
});

describe("calculateProjectedPnL — ledger integrity", () => {
  it("ledger debits sum to cost totals; gross − acquisitionCost = commissionBase; commissionBase − operationalCost − agentPayout = huspyMargin", () => {
    const stakeholders: DealStakeholder[] = [
      { id: "ds-1",  dealId: "d", partyId: "party-x",   role: "AGENT_PAYOUT",        splitPercentage: 100 },
      { id: "s-c1",  dealId: "d", partyId: "p-ref",     role: "ACQUISITION_DEDUCTION",   financialAmount: -500 },
      { id: "s-d1",  dealId: "d", partyId: "p-notary",  role: "OPERATIONAL_DEDUCTION",   financialAmount: -800 },
    ];
    const af: AgentFinancials = {
      id: "af-x",
      agentId: "agent-x",
      strategy: { kind: "flat", pct: 30 },
      teamLeadRate: 0,
      managerRate: 0,
    };
    const r = calculateProjectedPnL(
      baseInput({
        blueprint: minimalBlueprint,
        grossRevenue: 10_000,
        stakeholders,
        agentFinancialsByAgentId: { "agent-x": af },
        partyIdToAgentId: { "party-x": "agent-x" },
      }),
    );

    const sumByBucket = (b: import("@huspy/shared-domain").CostBucket) =>
      r.ledger.filter((e) => e.bucket === b && e.side === "DEBIT").reduce((s, e) => s + e.amount, 0);


    expect(sumByBucket("agent-payout")).toBeCloseTo(r.totalAgentPayout);
    expect(sumByBucket("acquisition-cost")).toBeCloseTo(r.totalAcquisitionCost);
    expect(sumByBucket("operational-cost")).toBeCloseTo(r.totalOperationalCost);

    // gross − acquisitionCost = commissionBase (agent splits use this; operational cost does not reduce the pool)
    expect(r.grossRevenue - r.totalAcquisitionCost).toBeCloseTo(r.commissionBase);
    // commissionBase − operationalCost − agentPayout = huspyMargin
    expect(r.commissionBase - r.totalOperationalCost - r.totalAgentPayout).toBeCloseTo(r.huspyMargin);
  });
});
