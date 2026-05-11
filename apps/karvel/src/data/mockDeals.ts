import { sharedDeals } from "@huspy/shared-domain";
import type { Deal } from "./types";
import { enrichDeal } from "@/lib/dealEnricher";

export const mockDeals: Deal[] = sharedDeals.map(enrichDeal);
