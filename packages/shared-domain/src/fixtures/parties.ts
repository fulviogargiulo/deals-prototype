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
  },
  {
    id: "party-client-002",
    displayName: "Carlos Fernández",
    email: "carlos.fernandez@email.com",
    phone: "+34698765432",
    legalType: "individual",
  },
  {
    id: "party-client-003",
    displayName: "Ana Rodríguez",
    email: "ana.rodriguez@email.com",
    phone: "+34611223344",
    legalType: "individual",
  },
  {
    id: "party-client-004",
    displayName: "Javier Martínez",
    email: "javier.martinez@email.com",
    phone: "+34699887766",
    legalType: "individual",
  },
  {
    id: "party-client-005",
    displayName: "Khalid Alharbi",
    email: "khalid.alharbi@email.com",
    phone: "+966504269287",
    legalType: "individual",
  },
  {
    id: "party-client-006",
    displayName: "Esra Sertcetin",
    email: "esra.sertcetin@email.com",
    phone: "+905387764299",
    legalType: "individual",
  },
  {
    id: "party-client-007",
    displayName: "Fatima Al Mansouri",
    email: "fatima.almansouri@email.com",
    phone: "+971501234567",
    legalType: "individual",
  },
  {
    id: "party-client-008",
    displayName: "Ahmed Al Rashidi",
    email: "ahmed.alrashidi@email.com",
    phone: "+971509876543",
    legalType: "individual",
  },
  {
    id: "party-client-009",
    displayName: "Lorenzo Romano",
    email: "lorenzo.romano@email.com",
    phone: "+34612998877",
    legalType: "individual",
  },
  {
    id: "party-client-010",
    displayName: "Nadia Al Zubairi",
    email: "nadia.alzubairi@email.com",
    phone: "+966551122334",
    legalType: "individual",
  },

  // ── Third parties (banks, developers) ─────────────────────────────────────
  {
    id: "party-third-inmobiliaria-grupo-norte",
    displayName: "Inmobiliaria Grupo Norte",
    legalType: "company",
  },
  {
    id: "party-third-caixabank",
    displayName: "CaixaBank",
    legalType: "financial_institution",
  },
  {
    id: "party-third-snb",
    displayName: "Saudi National Bank",
    legalType: "financial_institution",
  },
  {
    id: "party-third-emaar",
    displayName: "Emaar Properties",
    legalType: "company",
  },
];
