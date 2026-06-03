import { sharedTranches, sharedDeals } from "@huspy/shared-domain";
import type { Tranche } from "./types";
import { enrichTranche } from "@/lib/dealEnricher";
import { recalculateTranche } from "@/lib/dealCalculations";

export const mockTranches: Tranche[] = sharedTranches.map((t) => {
  const deal = sharedDeals.find((d) => d.id === t.dealId);
  if (!deal) return t as Tranche;
  const enriched = enrichTranche(t, deal);
  return recalculateTranche(enriched, deal, []);
});
