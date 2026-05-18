import type { Blueprint } from "./entities";
import type { BusinessUnit, Country } from "./enums";

/**
 * DEFAULT_BLUEPRINTS — statutory tax configuration per (country, businessUnit).
 *
 * Tax is NOT part of the waterfall engine. At invoice_issued, draftPostings reads
 * blueprint.taxRate to emit LIAB_VAT_{CUR} posting lines.
 * All P&L amounts flowing through the engine are tax-exclusive.
 *
 * Lookup order (most specific first):
 *   1. (country, businessUnit, dealType)
 *   2. (country, businessUnit, undefined)
 *   3. fallback to "ae" / "rebu" if no match
 */

const REBU_AE: Blueprint = {
  id: "bp-ae-rebu",
  country: "ae",
  businessUnit: "rebu",
  taxRate: 5,
  taxLabel: "VAT",
};

const REBU_ES: Blueprint = {
  id: "bp-es-rebu",
  country: "es",
  businessUnit: "rebu",
  taxRate: 21,
  taxLabel: "IVA",
  withholdingRate: 15,
  withholdingLabel: "IRPF",
};

const REBU_SA: Blueprint = {
  id: "bp-sa-rebu",
  country: "sa",
  businessUnit: "rebu",
  taxRate: 15,
  taxLabel: "VAT",
};

const MBU_AE: Blueprint = {
  id: "bp-ae-mortgage",
  country: "ae",
  businessUnit: "mortgage",
  taxRate: 5,
  taxLabel: "VAT",
};

const MBU_ES: Blueprint = {
  id: "bp-es-mortgage",
  country: "es",
  businessUnit: "mortgage",
  taxRate: 21,
  taxLabel: "IVA",
  withholdingRate: 15,
  withholdingLabel: "IRPF",
};

const MBU_SA: Blueprint = {
  id: "bp-sa-mortgage",
  country: "sa",
  businessUnit: "mortgage",
  taxRate: 15,
  taxLabel: "VAT",
};

export const DEFAULT_BLUEPRINTS: Record<Country, Partial<Record<BusinessUnit, Blueprint>>> = {
  ae: { rebu: REBU_AE, mortgage: MBU_AE },
  es: { rebu: REBU_ES, mortgage: MBU_ES },
  sa: { rebu: REBU_SA, mortgage: MBU_SA },
};

export function getBlueprint(
  country: Country | undefined,
  businessUnit: BusinessUnit | undefined,
): Blueprint {
  const c = country ?? "ae";
  const bu = businessUnit ?? "rebu";
  const found = DEFAULT_BLUEPRINTS[c]?.[bu];
  if (found) return found;
  return DEFAULT_BLUEPRINTS.ae.rebu as Blueprint;
}
