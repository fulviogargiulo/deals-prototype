import type { BrokerRateSlab } from "../entities";

// Monthly broker commission rate config for MBU MA/Broker channel.
// Rates are expressed as a percentage of the disbursed mortgage amount (0.5–1.5 range).
// Tier selected by broker's total disbursed amount across ALL banks for the month.
// BizOps updates this each month via the BizOps Google Sheet.
export const sharedBrokerRateSlabs: BrokerRateSlab[] = [
  {
    id: "brs-2026-04",
    reportingMonth: "2026-04",
    slabs: [
      {
        // Tier 1: < AED 5M monthly GMV
        upTo: 5_000_000,
        bankRates: [
          { bankId: "party-third-dib",     pct: 0.624 },
          { bankId: "party-third-adib",    pct: 0.663 },
          { bankId: "party-third-mashreq", pct: 0.580 },
          { bankId: "party-third-fab",     pct: 0.550 },
        ],
      },
      {
        // Tier 2: ≥ AED 5M monthly GMV
        upTo: null,
        bankRates: [
          { bankId: "party-third-dib",     pct: 0.720 },
          { bankId: "party-third-adib",    pct: 0.760 },
          { bankId: "party-third-mashreq", pct: 0.680 },
          { bankId: "party-third-fab",     pct: 0.650 },
        ],
      },
    ],
  },
  {
    id: "brs-2026-05",
    reportingMonth: "2026-05",
    slabs: [
      {
        upTo: 5_000_000,
        bankRates: [
          { bankId: "party-third-dib",     pct: 0.624 },
          { bankId: "party-third-adib",    pct: 0.663 },
          { bankId: "party-third-mashreq", pct: 0.580 },
          { bankId: "party-third-fab",     pct: 0.550 },
        ],
      },
      {
        upTo: null,
        bankRates: [
          { bankId: "party-third-dib",     pct: 0.720 },
          { bankId: "party-third-adib",    pct: 0.760 },
          { bankId: "party-third-mashreq", pct: 0.680 },
          { bankId: "party-third-fab",     pct: 0.650 },
        ],
      },
    ],
  },
];

export function getBrokerRateSlabForMonth(reportingMonth: string): BrokerRateSlab | undefined {
  return sharedBrokerRateSlabs.find((s) => s.reportingMonth === reportingMonth);
}

/** Returns the applicable pct for a broker+bank given the broker's total monthly GMV. */
export function resolveBrokerRate(
  reportingMonth: string,
  bankId: string,
  brokerMonthlyGmv: number
): number | undefined {
  const config = getBrokerRateSlabForMonth(reportingMonth);
  if (!config) return undefined;
  const slab = config.slabs.find((s) => s.upTo === null || brokerMonthlyGmv <= s.upTo);
  return slab?.bankRates.find((r) => r.bankId === bankId)?.pct;
}
