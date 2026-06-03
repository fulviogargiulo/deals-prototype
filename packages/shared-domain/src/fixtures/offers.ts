import type { Offer } from "../entities";

// All offers below are in "deal-created" status since they have spawned a deal.
// Agent assignments (buyerAgentId/sellerAgentId + splitPct) mirror the INTERNAL_PAYOUT
// entries in sharedPnlEntries — single source of truth for commission splits.
export const sharedOffers: Offer[] = [
  // offer-001 → deal-001 (es/EUR, primary/buy, agent-001/Felicia 100%)
  {
    id: "offer-001", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-001", assetName: "Apartment in La Latina",
    opportunityId: "opp-001", clientId: "client-001",
    offerAmount: 385000, commissionPayer: "buyer", totalCommissionPct: 3,
    buyerAgentId: "agent-001", buyerAgentSplitPct: 100,
    createdAt: "2026-01-04T10:00:00.000Z", updatedAt: "2026-01-06T09:00:00.000Z",
  },
  // offer-002 → deal-002 (es/EUR, secondary/sell, agent-002/Guilherme 100%)
  {
    id: "offer-002", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-002", assetName: "Penthouse in Salamanca",
    opportunityId: "opp-002", clientId: "client-002",
    offerAmount: 720000, commissionPayer: "seller", totalCommissionPct: 2.5,
    sellerAgentId: "agent-002", sellerAgentSplitPct: 100,
    createdAt: "2026-02-05T10:00:00.000Z", updatedAt: "2026-02-08T00:00:00.000Z",
  },
  // offer-003 → deal-003 (es/EUR, leasing, agent-001/Felicia 100%)
  {
    id: "offer-003", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-003", assetName: "Studio in Malasaña",
    opportunityId: "opp-003", clientId: "client-003",
    offerAmount: 14400, commissionPayer: "buyer", totalCommissionPct: 8,
    buyerAgentId: "agent-001", buyerAgentSplitPct: 100,
    createdAt: "2026-02-20T10:00:00.000Z", updatedAt: "2026-02-22T00:00:00.000Z",
  },
  // offer-004 → deal-004 (es/EUR, secondary/sell, agent-002/Guilherme 100%)
  {
    id: "offer-004", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-004", assetName: "Villa in Pozuelo",
    opportunityId: "opp-004", clientId: "client-004",
    offerAmount: 1250000, commissionPayer: "seller", totalCommissionPct: 2,
    sellerAgentId: "agent-002", sellerAgentSplitPct: 100,
    createdAt: "2026-03-01T10:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
  },
  // offer-005 → deal-005 (sa/SAR, primary/buy, agent-003/Omar 100%)
  {
    id: "offer-005", status: "deal-created",
    country: "sa", currency: "SAR",
    assetId: "asset-009", assetName: "Riyadh Hills Tower",
    opportunityId: "opp-005", clientId: "client-005",
    offerAmount: 540000, commissionPayer: "developer", totalCommissionPct: 2.5,
    buyerAgentId: "agent-003", buyerAgentSplitPct: 100,
    createdAt: "2026-02-12T10:00:00.000Z", updatedAt: "2026-02-15T00:00:00.000Z",
  },
  // offer-006 → deal-006 (es/EUR, secondary/sell, agent-001/Felicia 70% + agent-002/Guilherme 30% co-listing)
  {
    id: "offer-006", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-010", assetName: "Lomas de Pozuelo Flat",
    opportunityId: "opp-006", clientId: "client-006",
    offerAmount: 320000, commissionPayer: "seller", totalCommissionPct: 3,
    sellerAgentId: "agent-001", sellerAgentSplitPct: 70,
    buyerAgentId: "agent-002", buyerAgentSplitPct: 30,
    createdAt: "2026-02-17T10:00:00.000Z", updatedAt: "2026-02-20T00:00:00.000Z",
  },
  // offer-007 → deal-007 (es/EUR, secondary/sell, agent-001/Felicia 100%)
  {
    id: "offer-007", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-002", assetName: "Penthouse in Salamanca",
    opportunityId: "opp-001", clientId: "client-007",
    offerAmount: 475000, commissionPayer: "seller", totalCommissionPct: 2.5,
    sellerAgentId: "agent-001", sellerAgentSplitPct: 100,
    createdAt: "2026-03-03T10:00:00.000Z", updatedAt: "2026-03-05T00:00:00.000Z",
  },
  // offer-008 → deal-008 (es/EUR, secondary/sell, agent-002/Guilherme 100%)
  {
    id: "offer-008", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-002", assetName: "Penthouse in Salamanca",
    opportunityId: "opp-002", clientId: "client-008",
    offerAmount: 580000, commissionPayer: "seller", totalCommissionPct: 2.5,
    sellerAgentId: "agent-002", sellerAgentSplitPct: 100,
    createdAt: "2026-02-28T10:00:00.000Z", updatedAt: "2026-03-03T00:00:00.000Z",
  },
  // offer-009 → deal-009 (ae/AED, primary/buy, agent-003/Omar 100%)
  {
    id: "offer-009", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-006", assetName: "Marina Waterfront Tower",
    opportunityId: "opp-007", clientId: "client-009",
    offerAmount: 1850000, commissionPayer: "developer", totalCommissionPct: 2,
    buyerAgentId: "agent-003", buyerAgentSplitPct: 100,
    createdAt: "2026-04-28T10:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z",
  },
  // offer-010 → deal-010 (ae/AED, secondary/sell, agent-005/Ravi 100%)
  {
    id: "offer-010", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-007", assetName: "Dubai Heights Residence",
    opportunityId: "opp-008", clientId: "client-010",
    offerAmount: 4200000, commissionPayer: "buyer", totalCommissionPct: 2,
    sellerAgentId: "agent-005", sellerAgentSplitPct: 100,
    createdAt: "2026-03-15T10:00:00.000Z", updatedAt: "2026-03-18T00:00:00.000Z",
  },
  // offer-011 → deal-011 (ae/AED, primary/mortgage, DIB, agent-006/Zainab 100%)
  {
    id: "offer-011", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-012", assetName: "DIB Islamic Mortgage",
    opportunityId: "opp-009", clientId: "client-004",
    offerAmount: 1400000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-006", buyerAgentSplitPct: 100,
    createdAt: "2026-04-17T10:00:00.000Z", updatedAt: "2026-04-20T00:00:00.000Z",
  },
  // offer-012 → deal-012 (ae/AED, secondary/mortgage, FAB, agent-005/Ravi 100%)
  {
    id: "offer-012", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-013", assetName: "FAB Fixed Mortgage",
    opportunityId: "opp-010", clientId: "client-001",
    offerAmount: 3200000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-005", buyerAgentSplitPct: 100,
    createdAt: "2026-04-25T10:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
  },
  // offer-013 → deal-013 (es/EUR, secondary/sell, agent-004/Gelo 100%)
  {
    id: "offer-013", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-005", assetName: "Townhouse in Las Rozas",
    opportunityId: "opp-011", clientId: "client-003",
    offerAmount: 620000, commissionPayer: "seller", totalCommissionPct: 3,
    sellerAgentId: "agent-004", sellerAgentSplitPct: 100,
    createdAt: "2026-04-07T10:00:00.000Z", updatedAt: "2026-04-10T00:00:00.000Z",
  },
  // offer-014 → deal-014 (es/EUR, secondary/mortgage, CaixaBank, agent-001/Felicia 100%)
  {
    id: "offer-014", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-014", assetName: "CaixaBank Variable Mortgage",
    opportunityId: "opp-011", clientId: "client-003",
    offerAmount: 496000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-001", buyerAgentSplitPct: 100,
    createdAt: "2026-04-07T10:00:00.000Z", updatedAt: "2026-04-10T00:00:00.000Z",
  },
  // offer-015 → deal-015 (sa/SAR, primary/mortgage, Al Rajhi, agent-003/Omar 100%)
  {
    id: "offer-015", status: "deal-created",
    country: "sa", currency: "SAR",
    assetId: "asset-015", assetName: "Al Rajhi Islamic Mortgage",
    opportunityId: "opp-012", clientId: "client-005",
    offerAmount: 920000, commissionPayer: "developer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-003", buyerAgentSplitPct: 100,
    createdAt: "2026-04-25T10:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
  },
  // offer-016 → deal-016 (ae/AED, primary/buy, agent-004/Gelo 100%)
  {
    id: "offer-016", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-006", assetName: "Marina Waterfront Tower",
    opportunityId: "opp-007", clientId: "client-002",
    offerAmount: 2100000, commissionPayer: "developer", totalCommissionPct: 2,
    buyerAgentId: "agent-004", buyerAgentSplitPct: 100,
    createdAt: "2026-04-28T10:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z",
  },
  // offer-017 → deal-017 (es/EUR, primary/buy, agent-001/Felicia 60% + agent-003/Omar 40% referral split)
  {
    id: "offer-017", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-001", assetName: "Apartment in La Latina",
    opportunityId: "opp-013", clientId: "client-006",
    offerAmount: 530000, commissionPayer: "developer", totalCommissionPct: 3,
    sellerAgentId: "agent-001", sellerAgentSplitPct: 60,
    buyerAgentId: "agent-003", buyerAgentSplitPct: 40,
    createdAt: "2026-04-25T10:00:00.000Z", updatedAt: "2026-04-28T00:00:00.000Z",
  },
  // offer-018 → deal-018 (es/EUR, secondary/sell, agent-001/Felicia 100%)
  {
    id: "offer-018", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-004", assetName: "Villa in Pozuelo",
    opportunityId: "opp-004", clientId: "client-007",
    offerAmount: 1250000, commissionPayer: "seller", totalCommissionPct: 2.5,
    sellerAgentId: "agent-001", sellerAgentSplitPct: 100,
    createdAt: "2026-04-09T10:00:00.000Z", updatedAt: "2026-04-12T00:00:00.000Z",
  },
  // offer-019 → deal-019 (es/EUR, secondary/sell, agent-001/Felicia 100%)
  {
    id: "offer-019", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-003", assetName: "Studio in Malasaña",
    opportunityId: "opp-003", clientId: "client-008",
    offerAmount: 260000, commissionPayer: "buyer", totalCommissionPct: 2,
    buyerAgentId: "agent-001", buyerAgentSplitPct: 100,
    createdAt: "2026-03-17T10:00:00.000Z", updatedAt: "2026-03-20T00:00:00.000Z",
  },
  // offer-020 → deal-020 (ae/AED, primary/buy, agent-004/Gelo 100%, Dubai Heights Residence)
  {
    id: "offer-020", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-007", assetName: "Dubai Heights Residence",
    opportunityId: "opp-007", clientId: "client-008",
    offerAmount: 1200000, commissionPayer: "developer", totalCommissionPct: 2,
    buyerAgentId: "agent-004", buyerAgentSplitPct: 100,
    createdAt: "2026-05-10T10:00:00.000Z", updatedAt: "2026-05-12T00:00:00.000Z",
  },
  // offer-022 → deal-022 (ae/AED, primary/mortgage, ADIB, Hassan Khoury borrower, 1.25% bank slab)
  {
    id: "offer-022", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-016", assetName: "ADIB Islamic Mortgage",
    opportunityId: "opp-022", clientId: "client-012",
    offerAmount: 2800000, commissionPayer: "buyer", totalCommissionPct: 1.25,
    buyerAgentId: "agent-006", buyerAgentSplitPct: 100,
    createdAt: "2026-04-28T10:00:00.000Z", updatedAt: "2026-05-05T00:00:00.000Z",
  },
  // offer-021 → deal-021 (es/EUR, primary/buy, agent-002/Guilherme, referral Marta Sáez)
  {
    id: "offer-021", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-005", assetName: "Townhouse in Las Rozas",
    opportunityId: "opp-005", clientId: "client-003",
    offerAmount: 480000, commissionPayer: "developer", totalCommissionPct: 3,
    buyerAgentId: "agent-002", buyerAgentSplitPct: 100,
    createdAt: "2026-03-01T10:00:00.000Z", updatedAt: "2026-03-05T00:00:00.000Z",
  },
  // offer-023 → deal-023 (ae/AED, primary/mortgage, DIB BYOB, Nadia Hassan 100%)
  {
    id: "offer-023", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-017", assetName: "DIB Islamic Mortgage",
    offerAmount: 2_000_000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-006", buyerAgentSplitPct: 100,
    createdAt: "2026-05-08T10:00:00.000Z", updatedAt: "2026-05-10T00:00:00.000Z",
  },
  // offer-024 → deal-024 (ae/AED, primary/mortgage, Mashreq BBG broker sub-channel, Layla Nasser 100%)
  {
    id: "offer-024", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-018", assetName: "Mashreq Fixed Mortgage",
    offerAmount: 2_500_000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-005", buyerAgentSplitPct: 100,
    createdAt: "2026-05-13T10:00:00.000Z", updatedAt: "2026-05-15T00:00:00.000Z",
  },
  // offer-025 → deal-025 (ae/AED, primary/mortgage, Emirates NBD BBG self-generated, Layla Nasser 100%)
  {
    id: "offer-025", status: "deal-created",
    country: "ae", currency: "AED",
    assetId: "asset-019", assetName: "Emirates NBD Fixed Mortgage",
    offerAmount: 1_500_000, commissionPayer: "buyer", totalCommissionPct: 0.5,
    buyerAgentId: "agent-005", buyerAgentSplitPct: 100,
    createdAt: "2026-05-16T10:00:00.000Z", updatedAt: "2026-05-18T00:00:00.000Z",
  },
  // offer-026 → deal-026 + deal-027 (es/EUR, secondary/buy, agent-001/Felicia — split arras+escritura)
  {
    id: "offer-026", status: "deal-created",
    country: "es", currency: "EUR",
    assetId: "asset-001", assetName: "Apartment in Malasaña",
    clientId: "client-001",
    offerAmount: 300000, commissionPayer: "buyer", totalCommissionPct: 3,
    buyerAgentId: "agent-001", buyerAgentSplitPct: 100,
    createdAt: "2026-06-01T09:00:00.000Z", updatedAt: "2026-06-01T09:00:00.000Z",
  },
];
