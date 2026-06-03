import { sharedDeals } from "@huspy/shared-domain";
import type { Deal } from "./types";
import { enrichDeal } from "@/lib/dealEnricher";

// Deal is now a thin header — no P&L enrichment needed at the deal level.
// All financial data lives in Tranche (see mockTranches.ts).
export const mockDeals: Deal[] = sharedDeals.map((d) => enrichDeal(d));
