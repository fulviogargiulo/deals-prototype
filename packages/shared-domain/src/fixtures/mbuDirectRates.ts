import type { MBUDirectMonthlyRate } from "../entities";

export const DEFAULT_EXTERNAL_REFERRAL_RATE = 0.3; // % of gross revenue

// Monthly commission rates for MBU direct channels (REA, DS, B2C).
// selfSourcedRate: agent gets this % when there is no referral party on the deal.
// externalSourcedRate: agent gets this % when a referral party (ACQUISITION_DEDUCTION) is present.
// The referral party always gets DEFAULT_EXTERNAL_REFERRAL_RATE % unless their stakeholder amount is overridden.
export const sharedMBUDirectRates: MBUDirectMonthlyRate[] = [
  // ── REA channel ────────────────────────────────────────────
  { id: "mdr-rea-2026-04", reportingMonth: "2026-04", channel: "REA", selfSourcedRate: 25, externalSourcedRate: 20 },
  { id: "mdr-rea-2026-05", reportingMonth: "2026-05", channel: "REA", selfSourcedRate: 25, externalSourcedRate: 20 },
  // ── DS channel ─────────────────────────────────────────────
  { id: "mdr-ds-2026-04",  reportingMonth: "2026-04", channel: "DS",  selfSourcedRate: 30, externalSourcedRate: 25 },
  { id: "mdr-ds-2026-05",  reportingMonth: "2026-05", channel: "DS",  selfSourcedRate: 30, externalSourcedRate: 25 },
  // ── B2C channel ────────────────────────────────────────────
  { id: "mdr-b2c-2026-04", reportingMonth: "2026-04", channel: "B2C", selfSourcedRate: 28, externalSourcedRate: 23 },
  { id: "mdr-b2c-2026-05", reportingMonth: "2026-05", channel: "B2C", selfSourcedRate: 28, externalSourcedRate: 23 },
];

export function getMBUDirectRate(
  reportingMonth: string,
  channel: "REA" | "DS" | "B2C",
  isSelfSourced: boolean
): number | undefined {
  const config = sharedMBUDirectRates.find(
    (r) => r.reportingMonth === reportingMonth && r.channel === channel
  );
  if (!config) return undefined;
  return isSelfSourced ? config.selfSourcedRate : config.externalSourcedRate;
}
