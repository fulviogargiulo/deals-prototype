import type { AgentDocument } from "../entities";

// Agent-level compliance docs managed by Ops.
// kind="file" → scanned/uploaded document
// kind="text" → reusable structured value (IBAN, BIC, ID number) stored in `value`

export const sharedAgentDocuments: AgentDocument[] = [

  // ── Felicia Canovas (ES / Madrid) ─────────────────────────────────────────
  { id: "agdoc-felicia-passport",   agentId: "agent-001", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-felicia-eid",        agentId: "agent-001", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-felicia-nie-number", agentId: "agent-001", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "X-1234567-B", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-felicia-api-license",agentId: "agent-001", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-felicia-aml-kyc",    agentId: "agent-001", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-felicia-iban",       agentId: "agent-001", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "pending" },
  { id: "agdoc-felicia-bic",        agentId: "agent-001", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "pending" },

  // ── Guilherme Sousa (ES / Madrid) ─────────────────────────────────────────
  { id: "agdoc-guilherme-passport",   agentId: "agent-002", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-guilherme-eid",        agentId: "agent-002", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-guilherme-nie-number", agentId: "agent-002", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "Y-9876543-Z", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-guilherme-api-license",agentId: "agent-002", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-guilherme-aml-kyc",    agentId: "agent-002", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-guilherme-iban",       agentId: "agent-002", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "approved", value: "ES91 2100 0418 4502 0005 1332", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-guilherme-bic",        agentId: "agent-002", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "approved", value: "CAIXESBBXXX", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },

  // ── Gelo Reyes (ES / Madrid) ──────────────────────────────────────────────
  { id: "agdoc-gelo-passport",   agentId: "agent-004", documentType: "passport",            label: "Passport",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05", expiresAt: "2031-08-14" },
  { id: "agdoc-gelo-eid",        agentId: "agent-004", documentType: "eid",                 label: "NIE / DNI (doc)", kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-gelo-nie-number", agentId: "agent-004", documentType: "id-number",           label: "NIE Number",      kind: "text", required: true,  status: "approved", value: "Z-5551234-W", reviewedBy: "ops-team", reviewedAt: "2024-11-05" },
  { id: "agdoc-gelo-api-license",agentId: "agent-004", documentType: "real-estate-license", label: "API License",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-12-01", expiresAt: "2026-11-30" },
  { id: "agdoc-gelo-aml-kyc",    agentId: "agent-004", documentType: "aml-kyc",            label: "AML / KYC",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-gelo-iban",       agentId: "agent-004", documentType: "account-number",                label: "IBAN / Account Number",            kind: "text", required: true,  status: "approved", value: "ES80 2038 5778 9830 0076 0236", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },
  { id: "agdoc-gelo-bic",        agentId: "agent-004", documentType: "bic",                 label: "BIC / SWIFT",     kind: "text", required: true,  status: "approved", value: "BBVAESMMXXX", reviewedBy: "ops-team", reviewedAt: "2024-11-10" },

  // ── Omar Al-Rashid (SA / Riyadh) ──────────────────────────────────────────
  { id: "agdoc-omar-passport",    agentId: "agent-003", documentType: "passport",            label: "Passport",          kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-03-10", expiresAt: "2029-06-20" },
  { id: "agdoc-omar-eid",         agentId: "agent-003", documentType: "eid",                 label: "Iqama (doc)",       kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-03-10", expiresAt: "2026-03-09" },
  { id: "agdoc-omar-iqama-number",agentId: "agent-003", documentType: "id-number",           label: "Iqama Number",      kind: "text", required: true,  status: "approved", value: "2456789012", reviewedBy: "ops-team", reviewedAt: "2025-03-10" },
  { id: "agdoc-omar-fal-license", agentId: "agent-003", documentType: "real-estate-license", label: "Fal License",       kind: "file", required: true,  status: "uploaded",                                               expiresAt: "2026-04-01" },
  { id: "agdoc-omar-aml-kyc",     agentId: "agent-003", documentType: "aml-kyc",            label: "AML / KYC",         kind: "file", required: true,  status: "pending" },
  { id: "agdoc-omar-iban",        agentId: "agent-003", documentType: "account-number",                label: "IBAN / Account Number",              kind: "text", required: true,  status: "approved", value: "SA03 8000 0000 6080 1016 7519", reviewedBy: "ops-team", reviewedAt: "2025-03-15" },
  { id: "agdoc-omar-bic",         agentId: "agent-003", documentType: "bic",                 label: "BIC / SWIFT",       kind: "text", required: true,  status: "approved", value: "RIBLSARIXXX", reviewedBy: "ops-team", reviewedAt: "2025-03-15" },

  // ── Ravi Mehta (AE / Dubai) ───────────────────────────────────────────────
  { id: "agdoc-ravi-passport",   agentId: "agent-005", documentType: "passport",            label: "Passport",            kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2030-03-22" },
  { id: "agdoc-ravi-eid",        agentId: "agent-005", documentType: "eid",                 label: "UAE Emirates ID",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-ravi-eid-number", agentId: "agent-005", documentType: "id-number",           label: "Emirates ID Number",  kind: "text", required: true,  status: "approved", value: "784-1985-1234567-1", reviewedBy: "ops-team", reviewedAt: "2025-01-15" },
  { id: "agdoc-ravi-visa",       agentId: "agent-005", documentType: "visa",                label: "UAE Residence Visa",  kind: "file", required: false, status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-ravi-rera",       agentId: "agent-005", documentType: "real-estate-license", label: "RERA License",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-02-01", expiresAt: "2026-01-31" },
  { id: "agdoc-ravi-aml-kyc",    agentId: "agent-005", documentType: "aml-kyc",            label: "AML / KYC",           kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-ravi-iban",       agentId: "agent-005", documentType: "account-number",                label: "IBAN / Account Number",                kind: "text", required: true,  status: "approved", value: "AE07 0331 2345 6789 0123 456", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-ravi-bic",        agentId: "agent-005", documentType: "bic",                 label: "BIC / SWIFT",         kind: "text", required: true,  status: "approved", value: "EBILAEAD", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },

  // ── Zainab Al-Farsi (AE / Dubai) — newer agent, some entries pending ──────
  { id: "agdoc-zainab-passport",   agentId: "agent-006", documentType: "passport",            label: "Passport",            kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2030-03-22" },
  { id: "agdoc-zainab-eid",        agentId: "agent-006", documentType: "eid",                 label: "UAE Emirates ID",     kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-15", expiresAt: "2027-09-10" },
  { id: "agdoc-zainab-eid-number", agentId: "agent-006", documentType: "id-number",           label: "Emirates ID Number",  kind: "text", required: true,  status: "pending" },
  { id: "agdoc-zainab-visa",       agentId: "agent-006", documentType: "visa",                label: "UAE Residence Visa",  kind: "file", required: false, status: "pending" },
  { id: "agdoc-zainab-rera",       agentId: "agent-006", documentType: "real-estate-license", label: "RERA License",        kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-02-01", expiresAt: "2026-01-31" },
  { id: "agdoc-zainab-aml-kyc",    agentId: "agent-006", documentType: "aml-kyc",            label: "AML / KYC",           kind: "file", required: true,  status: "approved", reviewedBy: "ops-team", reviewedAt: "2025-01-20" },
  { id: "agdoc-zainab-iban",       agentId: "agent-006", documentType: "account-number",                label: "IBAN / Account Number",                kind: "text", required: true,  status: "pending" },
  { id: "agdoc-zainab-bic",        agentId: "agent-006", documentType: "bic",                 label: "BIC / SWIFT",         kind: "text", required: true,  status: "pending" },

];
