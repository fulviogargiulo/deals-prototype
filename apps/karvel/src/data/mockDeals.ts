import { sharedDeals } from "@huspy/shared-domain";
import type { Deal } from "./types";
import { enrichDeal } from "@/lib/dealEnricher";
import { recalculateDeal } from "@/lib/dealCalculations";

export const mockDeals: Deal[] = sharedDeals.map((d) => recalculateDeal(enrichDeal(d)));
