import type { BusinessUnit, Currency } from "../enums";
import { sharedDeals } from "../fixtures/deals";
import { sharedLedgers } from "../fixtures/ledgers";
import { sharedPostings } from "../fixtures/postings";
import { sharedPostingLines } from "../fixtures/postingLines";

export interface DealPnL {
  revenue: number;
  commissionExpense: number;
  grossProfit: number;
  currency: Currency;
}

export interface BusinessUnitPnL {
  bu: BusinessUnit;
  currency: Currency;
  revenue: number;
  commissionExpense: number;
  grossProfit: number;
}

const REV_PATTERN = /^REV_/;
const EXP_PATTERN = /^EXP_COMMISSION_/;

function sumLines(postingIds: Set<string>): { revenue: number; commissionExpense: number } {
  let revenue = 0;
  let commissionExpense = 0;

  for (const line of sharedPostingLines) {
    if (!postingIds.has(line.postingId)) continue;
    const ledger = sharedLedgers.find((l) => l.id === line.ledgerId);
    if (!ledger) continue;

    if (ledger.type === "revenue" && REV_PATTERN.test(ledger.name)) {
      revenue += line.side === "CREDIT" ? line.amount : -line.amount;
    }
    if (ledger.type === "expense" && EXP_PATTERN.test(ledger.name)) {
      commissionExpense += line.side === "DEBIT" ? line.amount : -line.amount;
    }
  }

  return { revenue, commissionExpense };
}

export const getDealPnL = (dealId: string): DealPnL => {
  const postingIds = new Set(
    sharedPostings.filter((p) => p.dealId === dealId).map((p) => p.id)
  );
  const currency: Currency =
    sharedPostings.find((p) => p.dealId === dealId)?.currency ?? "EUR";

  const { revenue, commissionExpense } = sumLines(postingIds);
  return { revenue, commissionExpense, grossProfit: revenue - commissionExpense, currency };
};

// Deals without an explicit businessUnit are implicitly REBU (real estate).
function dealBU(dealId: string): BusinessUnit {
  return sharedDeals.find((d) => d.id === dealId)?.businessUnit ?? "rebu";
}

export const getBusinessUnitPnL = (bu: BusinessUnit, currency: Currency): BusinessUnitPnL => {
  const postingIds = new Set(
    sharedPostings
      .filter((p) => {
        if (p.currency !== currency) return false;
        // Explicit BU tag takes precedence for standalone postings.
        if (!p.dealId) return p.businessUnit === bu;
        // Deal-linked: resolve BU from the deal, but honour an explicit override.
        return (p.businessUnit ?? dealBU(p.dealId)) === bu;
      })
      .map((p) => p.id)
  );

  const { revenue, commissionExpense } = sumLines(postingIds);
  return { bu, currency, revenue, commissionExpense, grossProfit: revenue - commissionExpense };
};
