import type { Deal as BaseDeal, Tranche as BaseTranche } from "@huspy/shared-domain";
import type { Deal, Tranche } from "@/data/types";

// Deal is a thin header — no enrichment needed beyond pass-through.
export function enrichDeal(deal: BaseDeal): Deal {
  return deal as Deal;
}

export function enrichTranche(tranche: BaseTranche): Tranche {
  return tranche as Tranche;
}
