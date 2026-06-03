import type { Asset } from "../entities";

// Each Asset is a deal-level bridge to the canonical record in a BU-specific system.
// Detail fields (name, country, currency, etc.) live in the source record.
export const sharedAssets: Asset[] = [
  // REBU — real estate properties
  { id: "asset-001", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-001" },
  { id: "asset-002", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-002" },
  { id: "asset-003", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-003" },
  { id: "asset-004", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-004" },
  { id: "asset-005", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-005" },
  { id: "asset-006", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-006" },
  { id: "asset-007", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-007" },
  { id: "asset-008", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-008" },
  { id: "asset-009", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-009" },
  { id: "asset-010", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-010" },
  { id: "asset-011", assetType: "real_estate",      sourceSystem: "rebu", sourceId: "prop-011" },
  // MBU — mortgage loan products
  { id: "asset-012", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-001" },
  { id: "asset-013", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-002" },
  { id: "asset-014", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-003" },
  { id: "asset-015", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-004" },
  { id: "asset-016", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-005" },
  { id: "asset-017", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-006" },
  { id: "asset-018", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-007" },
  { id: "asset-019", assetType: "financial_product", sourceSystem: "mbu", sourceId: "mortgage-008" },
];
