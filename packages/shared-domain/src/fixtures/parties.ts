import type { Party } from "../entities";

// Naming convention: party-agent-{agentId}, party-{clientId}, party-third-{slug}
export const sharedParties: Party[] = [
  // ── Agents ─────────────────────────────────────────────────────────────────
  {
    id: "party-agent-felicia",
    displayName: "Felicia Canovas",
    email: "felicia@huspy.io",
    phone: "+34 612 345 678",
    legalType: "individual",
  },
  {
    id: "party-agent-guilherme",
    displayName: "Guilherme Castro",
    email: "guilherme@huspy.io",
    phone: "+34 623 456 789",
    legalType: "individual",
  },
  {
    id: "party-agent-omar",
    displayName: "Omar Al Saleem",
    email: "omar@huspy.io",
    phone: "+966 55 123 4567",
    legalType: "individual",
  },
  {
    id: "party-agent-gelo",
    displayName: "Gelo Huspy",
    email: "gelo@huspy.io",
    phone: "+34 645 678 901",
    legalType: "individual",
  },
  {
    id: "party-agent-ravi",
    displayName: "Ravi Nair",
    email: "ravi@huspy.io",
    phone: "+971 50 234 5678",
    legalType: "individual",
  },
  {
    id: "party-agent-zainab",
    displayName: "Zainab Al-Qadi",
    email: "zainab@huspy.io",
    phone: "+971 55 876 5432",
    legalType: "individual",
  },

  // ── Clients ────────────────────────────────────────────────────────────────
  {
    id: "party-client-001",
    displayName: "Mariana Dañobeitia",
    email: "mariana.danobeitia@email.com",
    phone: "+34612345678",
    legalType: "individual",
    taxId: "12345678A",
  },
  {
    id: "party-client-002",
    displayName: "Carlos Fernández",
    email: "carlos.fernandez@email.com",
    phone: "+34698765432",
    legalType: "individual",
    taxId: "23456789B",
  },
  {
    id: "party-client-003",
    displayName: "Ana Rodríguez",
    email: "ana.rodriguez@email.com",
    phone: "+34611223344",
    legalType: "individual",
    taxId: "34567890C",
  },
  {
    id: "party-client-004",
    displayName: "Javier Martínez",
    email: "javier.martinez@email.com",
    phone: "+34699887766",
    legalType: "individual",
    taxId: "45678901D",
  },
  {
    id: "party-client-005",
    displayName: "Khalid Alharbi",
    email: "khalid.alharbi@email.com",
    phone: "+966504269287",
    legalType: "individual",
    taxId: "1098765432",
  },
  {
    id: "party-client-006",
    displayName: "Esra Sertcetin",
    email: "esra.sertcetin@email.com",
    phone: "+905387764299",
    legalType: "individual",
    taxId: "56789012E",
  },
  {
    id: "party-client-007",
    displayName: "Fatima Al Mansouri",
    email: "fatima.almansouri@email.com",
    phone: "+971501234567",
    legalType: "individual",
    taxId: "784198512345671",
  },
  {
    id: "party-client-008",
    displayName: "Ahmed Al Rashidi",
    email: "ahmed.alrashidi@email.com",
    phone: "+971509876543",
    legalType: "individual",
    taxId: "784199087654321",
  },
  {
    id: "party-client-009",
    displayName: "Lorenzo Romano",
    email: "lorenzo.romano@email.com",
    phone: "+34612998877",
    legalType: "individual",
    taxId: "67890123F",
  },
  {
    id: "party-client-010",
    displayName: "Nadia Al Zubairi",
    email: "nadia.alzubairi@email.com",
    phone: "+966551122334",
    legalType: "individual",
    taxId: "1087654321",
  },

  // ── Third parties (banks, developers) ─────────────────────────────────────
  {
    id: "party-third-inmobiliaria-grupo-norte",
    displayName: "Inmobiliaria Grupo Norte",
    legalType: "company",
    taxId: "A12345678",
  },
  {
    id: "party-third-caixabank",
    displayName: "CaixaBank",
    legalType: "financial_institution",
    taxId: "A08663619",
  },
  {
    id: "party-third-snb",
    displayName: "Saudi National Bank",
    legalType: "financial_institution",
    taxId: "SA1000000001",
  },
  {
    id: "party-third-emaar",
    displayName: "Emaar Properties",
    legalType: "company",
    taxId: "AE100000001",
  },

  // ── Conveyance firms ───────────────────────────────────────────────────────
  {
    id: "party-conv-gestoria-lopez",
    displayName: "Gestoría López & Asociados",
    legalType: "company",
    taxId: "B98765432",
  },
  {
    id: "party-conv-tamm-legal",
    displayName: "TAMM Legal Services",
    legalType: "company",
    taxId: "AE200000001",
  },
  {
    id: "party-conv-alrajhi-notarial",
    displayName: "Al Rajhi Notarial",
    legalType: "company",
    taxId: "SA2000000001",
  },
];
