import type { AgentDocument } from "../entities";

// Agent-level compliance docs managed by Ops.
// kind="file" → scanned/uploaded document
// kind="text" → reusable structured value (IBAN, BIC, ID number) stored in `value`

export const sharedAgentDocuments: AgentDocument[] = [

  // ── Felicia Canovas (ES / Madrid) ─────────────────────────────────────────
  { id: "agdoc-felicia-passport",   agentId: "agent-felicia", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-felicia-eid",        agentId: "agent-felicia", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-felicia-nie-number", agentId: "agent-felicia", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "X-1234567-B", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-felicia-api-license",agentId: "agent-felicia", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-felicia-aml-kyc",    agentId: "agent-felicia", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-felicia-iban",       agentId: "agent-felicia", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "pending" },
  { id: "agdoc-felicia-bic",        agentId: "agent-felicia", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "pending" },

  // ── Guilherme Sousa (ES / Madrid) ─────────────────────────────────────────
  { id: "agdoc-guilherme-passport",   agentId: "agent-guilherme", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-guilherme-eid",        agentId: "agent-guilherme", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-guilherme-nie-number", agentId: "agent-guilherme", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "Y-9876543-Z", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-guilherme-api-license",agentId: "agent-guilherme", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-guilherme-aml-kyc",    agentId: "agent-guilherme", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-guilherme-iban",       agentId: "agent-guilherme", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "approved", value: "ES91 2100 0418 4502 0005 1332", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-guilherme-bic",        agentId: "agent-guilherme", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "approved", value: "CAIXESBBXXX", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },

  // ── Gelo Reyes (ES / Madrid) ──────────────────────────────────────────────
  { id: "agdoc-gelo-passport",   agentId: "agent-gelo", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-gelo-eid",        agentId: "agent-gelo", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-gelo-nie-number", agentId: "agent-gelo", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "Z-5551234-W", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-gelo-api-license",agentId: "agent-gelo", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-gelo-aml-kyc",    agentId: "agent-gelo", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-gelo-iban",       agentId: "agent-gelo", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "approved", value: "ES80 2038 5778 9830 0076 0236", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-gelo-bic",        agentId: "agent-gelo", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "approved", value: "BBVAESMMXXX", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },

  // ── Omar Al-Rashid (SA / Riyadh) ──────────────────────────────────────────
  { id: "agdoc-omar-passport",    agentId: "agent-omar", documentType: "passport",            label: "Passport",          kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-03-10", expiresAt: "2029-06-20" },
  { id: "agdoc-omar-eid",         agentId: "agent-omar", documentType: "eid",                 label: "Iqama (doc)",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-03-10", expiresAt: "2026-03-09" },
  { id: "agdoc-omar-iqama-number",agentId: "agent-omar", documentType: "id-number",           label: "Iqama Number",      kind: "text", required: true,  status: "approved", value: "2456789012", reviewedBy: "ops-team", reviewedAt: "2025-03-10" },
  { id: "agdoc-omar-fal-license", agentId: "agent-omar", documentType: "real-estate-license", label: "Fal License",       kind: "file", required: true,  status: "uploaded",                                               expiresAt: "2026-04-01" },
  { id: "agdoc-omar-aml-kyc",     agentId: "agent-omar", documentType: "aml-kyc",            label: "AML / KYC",         kind: "file", required: true,  status: "pending" },
  { id: "agdoc-omar-iban",        agentId: "agent-omar", documentType: "account-number",                label: "IBAN / Account Number",              kind: "text", required: true,  status: "approved", value: "SA03 8000 0000 6080 1016 7519", reviewedBy: "ops-team", reviewedAt: "2025-03-15" },
  { id: "agdoc-omar-bic",         agentId: "agent-omar", documentType: "bic",                 label: "BIC / SWIFT",       kind: "text", required: true,  status: "approved", value: "RIBLSARIXXX", reviewedBy: "ops-team", reviewedAt: "2025-03-15" },

  // ── Ravi Mehta (AE / Dubai) ───────────────────────────────────────────────
  { id: "agdoc-ravi-passport",   agentId: "agent-ravi", documentType: "passport",            label: "Passport",            kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2030-03-22" },
  { id: "agdoc-ravi-eid",        agentId: "agent-ravi", documentType: "eid",                 label: "UAE Emirates ID",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-ravi-eid-number", agentId: "agent-ravi", documentType: "id-number",           label: "Emirates ID Number",  kind: "text", required: true,  status: "approved", value: "784-1985-1234567-1", reviewedBy: "ops-team", reviewedAt: "2025-01-15" },
  { id: "agdoc-ravi-visa",       agentId: "agent-ravi", documentType: "visa",                label: "UAE Residence Visa",  kind: "file", required: false, status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-ravi-rera",       agentId: "agent-ravi", documentType: "real-estate-license", label: "RERA License",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-02-01", expiresAt: "2026-01-31" },
  { id: "agdoc-ravi-aml-kyc",    agentId: "agent-ravi", documentType: "aml-kyc",            label: "AML / KYC",           kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-ravi-iban",       agentId: "agent-ravi", documentType: "account-number",                label: "IBAN / Account Number",                kind: "text", required: true,  status: "approved", value: "AE07 0331 2345 6789 0123 456", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-ravi-bic",        agentId: "agent-ravi", documentType: "bic",                 label: "BIC / SWIFT",         kind: "text", required: true,  status: "approved", value: "EBILAEAD", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },

  // ── Zainab Al-Farsi (AE / Dubai) — newer agent, some entries pending ──────
  { id: "agdoc-zainab-passport",   agentId: "agent-zainab", documentType: "passport",            label: "Passport",            kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2030-03-22" },
  { id: "agdoc-zainab-eid",        agentId: "agent-zainab", documentType: "eid",                 label: "UAE Emirates ID",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-zainab-eid-number", agentId: "agent-zainab", documentType: "id-number",           label: "Emirates ID Number",  kind: "text", required: true,  status: "pending" },
  { id: "agdoc-zainab-visa",       agentId: "agent-zainab", documentType: "visa",                label: "UAE Residence Visa",  kind: "file", required: false, status: "pending" },
  { id: "agdoc-zainab-rera",       agentId: "agent-zainab", documentType: "real-estate-license", label: "RERA License",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-02-01", expiresAt: "2026-01-31" },
  { id: "agdoc-zainab-aml-kyc",    agentId: "agent-zainab", documentType: "aml-kyc",            label: "AML / KYC",           kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-zainab-iban",       agentId: "agent-zainab", documentType: "account-number",                label: "IBAN / Account Number",                kind: "text", required: true,  status: "pending" },
  { id: "agdoc-zainab-bic",        agentId: "agent-zainab", documentType: "bic",                 label: "BIC / SWIFT",         kind: "text", required: true,  status: "pending" },

];
