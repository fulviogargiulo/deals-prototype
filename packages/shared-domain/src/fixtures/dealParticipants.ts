import type { DealParticipant } from "../entities";

// Identity-only participants on each Deal: DEMAND (buyer/borrower/tenant) and SUPPLY (seller/developer/bank).
// Deal-scoped — shared across all Tranches on the same Deal.
// No amount, no waterfall position.

export const sharedDealParticipants: DealParticipant[] = [
  { id: "dp-deal-001-demand", dealId: "deal-001", partyId: "party-client-001",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-001-supply", dealId: "deal-001", partyId: "party-dev-neinor",                     role: "SUPPLY" },

  { id: "dp-deal-002-demand", dealId: "deal-002", partyId: "party-client-002",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-002-supply", dealId: "deal-002", partyId: "party-seller-002",                     role: "SUPPLY" },

  { id: "dp-deal-003-demand", dealId: "deal-003", partyId: "party-client-003",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-003-supply", dealId: "deal-003", partyId: "party-seller-003",                     role: "SUPPLY" },

  { id: "dp-deal-004-demand", dealId: "deal-004", partyId: "party-client-004",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-004-supply", dealId: "deal-004", partyId: "party-seller-004",                     role: "SUPPLY" },

  { id: "dp-deal-005-demand", dealId: "deal-005", partyId: "party-client-005",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-005-supply", dealId: "deal-005", partyId: "party-dev-dar-al-arkan",               role: "SUPPLY" },

  { id: "dp-deal-006-demand", dealId: "deal-006", partyId: "party-client-006",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-006-supply", dealId: "deal-006", partyId: "party-seller-006",                     role: "SUPPLY" },

  { id: "dp-deal-007-demand", dealId: "deal-007", partyId: "party-client-001",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-007-supply", dealId: "deal-007", partyId: "party-seller-007",                     role: "SUPPLY" },

  { id: "dp-deal-008-demand", dealId: "deal-008", partyId: "party-client-002",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-008-supply", dealId: "deal-008", partyId: "party-third-inmobiliaria-grupo-norte", role: "SUPPLY" },

  { id: "dp-deal-009-demand", dealId: "deal-009", partyId: "party-client-007",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-009-supply", dealId: "deal-009", partyId: "party-third-emaar",                    role: "SUPPLY" },

  { id: "dp-deal-010-demand", dealId: "deal-010", partyId: "party-client-008",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-010-supply", dealId: "deal-010", partyId: "party-seller-010",                     role: "SUPPLY" },

  { id: "dp-deal-011-demand", dealId: "deal-011", partyId: "party-client-011",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-011-supply", dealId: "deal-011", partyId: "party-third-dib",                      role: "SUPPLY" },

  { id: "dp-deal-012-demand", dealId: "deal-012", partyId: "party-client-008",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-012-supply", dealId: "deal-012", partyId: "party-third-fab",                      role: "SUPPLY" },

  { id: "dp-deal-013-demand", dealId: "deal-013", partyId: "party-client-009",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-013-supply", dealId: "deal-013", partyId: "party-seller-013",                     role: "SUPPLY" },

  { id: "dp-deal-014-demand", dealId: "deal-014", partyId: "party-client-001",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-014-supply", dealId: "deal-014", partyId: "party-third-caixabank",                role: "SUPPLY" },

  { id: "dp-deal-015-demand", dealId: "deal-015", partyId: "party-client-003",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-015-supply", dealId: "deal-015", partyId: "party-third-snb",                      role: "SUPPLY" },

  { id: "dp-deal-016-demand", dealId: "deal-016", partyId: "party-client-007",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-016-supply", dealId: "deal-016", partyId: "party-third-emaar",                    role: "SUPPLY" },

  { id: "dp-deal-017-demand", dealId: "deal-017", partyId: "party-client-002",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-017-supply", dealId: "deal-017", partyId: "party-dev-neinor",                     role: "SUPPLY" },

  { id: "dp-deal-018-demand", dealId: "deal-018", partyId: "party-client-004",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-018-supply", dealId: "deal-018", partyId: "party-seller-018",                     role: "SUPPLY" },

  { id: "dp-deal-019-demand", dealId: "deal-019", partyId: "party-client-003",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-019-supply", dealId: "deal-019", partyId: "party-seller-019",                     role: "SUPPLY" },

  { id: "dp-deal-020-demand", dealId: "deal-020", partyId: "party-client-008",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-020-supply", dealId: "deal-020", partyId: "party-third-emaar",                    role: "SUPPLY" },

  { id: "dp-deal-021-demand", dealId: "deal-021", partyId: "party-client-003",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-021-supply", dealId: "deal-021", partyId: "party-dev-neinor",                     role: "SUPPLY" },

  // deal-026 has two Tranches (Arras + Escritura) but one buyer and one seller.
  { id: "dp-deal-026-demand", dealId: "deal-026", partyId: "party-client-001",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-026-supply", dealId: "deal-026", partyId: "party-dev-neinor",                     role: "SUPPLY" },

  { id: "dp-deal-022-demand", dealId: "deal-022", partyId: "party-client-012",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-022-supply", dealId: "deal-022", partyId: "party-third-adib",                     role: "SUPPLY" },

  { id: "dp-deal-023-demand", dealId: "deal-023", partyId: "party-client-011",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-023-supply", dealId: "deal-023", partyId: "party-third-dib",                      role: "SUPPLY" },

  { id: "dp-deal-024-demand", dealId: "deal-024", partyId: "party-client-012",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-024-supply", dealId: "deal-024", partyId: "party-third-adib",                     role: "SUPPLY" },

  { id: "dp-deal-025-demand", dealId: "deal-025", partyId: "party-client-011",                     role: "DEMAND", isPrimary: true },
  { id: "dp-deal-025-supply", dealId: "deal-025", partyId: "party-third-fab",                      role: "SUPPLY" },
];
