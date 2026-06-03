import type { Mortgage } from "../entities";

export const sharedMortgages: Mortgage[] = [
  { id: "mortgage-001", lenderName: "DIB",         country: "ae", currency: "AED", loanAmount: 1_500_000, termYears: 25, productType: "islamic"  },
  { id: "mortgage-002", lenderName: "FAB",         country: "ae", currency: "AED", loanAmount: 3_200_000, termYears: 25, productType: "fixed"    },
  { id: "mortgage-003", lenderName: "CaixaBank",   country: "es", currency: "EUR", loanAmount: 496_000,   termYears: 30, productType: "variable" },
  { id: "mortgage-004", lenderName: "Al Rajhi",    country: "sa", currency: "SAR", loanAmount: 920_000,   termYears: 20, productType: "islamic"  },
  { id: "mortgage-005", lenderName: "ADIB",        country: "ae", currency: "AED", loanAmount: 2_800_000, termYears: 25, productType: "islamic"  },
  { id: "mortgage-006", lenderName: "DIB",         country: "ae", currency: "AED", loanAmount: 2_000_000, termYears: 20, productType: "islamic"  },
  { id: "mortgage-007", lenderName: "Mashreq",     country: "ae", currency: "AED", loanAmount: 2_500_000, termYears: 25, productType: "fixed"    },
  { id: "mortgage-008", lenderName: "Emirates NBD", country: "ae", currency: "AED", loanAmount: 1_500_000, termYears: 20, productType: "fixed"   },
];
