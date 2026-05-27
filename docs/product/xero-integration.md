# Xero Integration

This document describes the proposed integration between Huspy's deal management system and Xero, Huspy's accounting platform.

The goal is to eliminate manual double-entry: when an invoice is created or its status changes in either system, the other is updated automatically.

---

## How It Works

### 1. Invoice Created in Huspy → Pushed to Xero

When an invoice transitions to `issued` in Huspy, a server-side job calls the Xero Accounting API to create the corresponding invoice in Xero. This applies to **both directions**:

| Huspy `direction` | Xero `Type` | Xero concept |
|---|---|---|
| `outbound` | `ACCREC` | Sales invoice — Huspy bills a client or external party |
| `inbound` | `ACCPAY` | Bill — an agent or vendor bills Huspy |

```
Huspy status: draft → issued
         ↓
POST https://api.xero.com/api.xro/2.0/Invoices
Body: { "Type": "ACCREC" }  ← outbound
   or { "Type": "ACCPAY" }  ← inbound
         ↓
Xero creates invoice → returns XeroInvoiceID
         ↓
Huspy stores xeroInvoiceId on the Invoice record
```

Huspy's `Invoice.id` is sent as the Xero invoice reference so both sides can cross-reference.

Invoices in `draft` are **not** pushed to Xero — they represent work-in-progress in Huspy's system only. The push happens at the `issued` transition, which corresponds to the invoice being finalised and ready to send to the counterparty.

---

### 2. Status Change in Xero → Pulled into Huspy (Webhooks)

Xero fires a webhook when an invoice is created or updated (e.g. marked as paid by the finance team in Xero).

```
Finance marks invoice PAID in Xero
         ↓
Xero fires POST to Huspy webhook endpoint
Payload: { eventType: "Update", eventCategory: "INVOICE", resourceId: "{XeroInvoiceID}" }
         ↓
Huspy handler: GET /Invoices/{XeroInvoiceID} from Xero API
         ↓
Huspy maps Xero status → internal status
         ↓
Huspy updates Invoice.status + Invoice.paidDate
```

> **Important:** Xero webhooks carry only the resource ID, not the new state. Huspy must fetch the full invoice from Xero on every event to read the current status.

The webhook endpoint must respond with `200 OK` within **5 seconds**. All actual processing must happen asynchronously (background job).

---

### 3. Status Change in Huspy → Pushed to Xero

When Huspy cancels an invoice, Xero is updated via API to keep both systems in sync.

```
Huspy status: issued → cancelled
         ↓
PUT https://api.xero.com/api.xro/2.0/Invoices/{XeroInvoiceID}
Body: { "Status": "VOIDED" }
```

---

## Status Mapping

### Huspy → Xero

| Huspy `InvoiceStatus` | Xero Status | Notes |
|---|---|---|
| `draft` | — | Not synced. Huspy-only until issued. |
| `issued` | `AUTHORISED` | Push triggers on this transition. |
| `paid` | `PAID` | Set by Xero webhook; Huspy mirrors it. |
| `cancelled` | `VOIDED` | Huspy pushes this change to Xero. |

### Xero → Huspy

| Xero Status | Huspy `InvoiceStatus` | Notes |
|---|---|---|
| `DRAFT` | — | Ignored. Huspy never creates drafts in Xero. |
| `SUBMITTED` | — | Ignored. Not part of Huspy's workflow. |
| `AUTHORISED` | `issued` | Already the state Huspy set on push; no change needed. |
| `PAID` | `paid` | Primary inbound sync event. Sets `paidDate`. |
| `VOIDED` | `cancelled` | Sync if voided directly in Xero (rare). |
| `DELETED` | `cancelled` | Treat same as voided. |

---

## Data Model Changes Required

The `Invoice` entity needs two new fields:

```ts
export interface Invoice {
  // ... existing fields ...

  /** Xero invoice ID, set after the invoice is successfully pushed to Xero. */
  xeroInvoiceId?: string;

  /** Last known Xero status, used to detect actual changes on webhook events. */
  xeroStatus?: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "PAID" | "VOIDED" | "DELETED";
}
```

---

## Sync Rules & Conflict Resolution

| Scenario | Rule |
|---|---|
| Invoice pushed to Xero, then amount edited in Huspy before payment | Huspy re-pushes updated line items via `PUT /Invoices/{id}` |
| Invoice marked PAID in both systems within the same minute | Idempotent — both result in `paid`; no conflict |
| Invoice voided in Xero directly (not via Huspy) | Xero webhook fires → Huspy sets `cancelled` |
| Xero returns an error on push | Invoice stays `issued` in Huspy; retry with exponential backoff; alert Finance if unresolved after N retries |
| `xeroInvoiceId` missing when status change fires | Skip sync; log warning — invoice was likely created before integration went live |

**Tie-breaking rule:** Xero is authoritative for **payment status**. Huspy is authoritative for **amounts, line items, and party data**.

---

## Constraints & Gotchas

| Item | Detail |
|---|---|
| Rate limits | 60 API calls/min · 5,000/day per Xero org |
| Webhook response window | 5 seconds — must ACK immediately, process async |
| Webhook delivery | At-least-once, not necessarily ordered — handlers must be idempotent |
| Requires backend | OAuth 2.0 client credentials cannot live in the browser; a server-side service is mandatory |
| Xero app registration | A connected app must be registered at [developer.xero.com](https://developer.xero.com) and approved before going live |

---

## Engineering Estimate

Assumes a backend service already exists (Node.js/TypeScript). The prototype is currently frontend-only with mocks — if a backend needs to be built first, add **4–6 weeks** as a prerequisite.

| Work stream | What's involved | Days |
|---|---|---|
| **Xero OAuth 2.0 & API client** | App registration in Xero Developer portal, token storage + refresh, tenant ID resolution, shared HTTP client | 2–3 |
| **Data model** | Add `xeroInvoiceId`, `xeroStatus` to Invoice entity; DB migration | 0.5 |
| **Push: issued → Xero** | Map Huspy fields to Xero format for both ACCREC and ACCPAY; contact lookup/creation in Xero; error handling; retry with exponential backoff | 3–4 |
| **Push: cancelled → Xero VOIDED** | `PUT /Invoices/{id}` on cancel transition; guard if `xeroInvoiceId` not set | 1 |
| **Push: edits before payment** | Re-push line items + amounts on any field update while status is `issued` | 1 |
| **Webhook receiver** | HTTPS endpoint, Xero signature verification, 5-second ACK, async job queue, idempotency (deduplicate re-delivered events), fetch-and-diff, status mapping | 3–4 |
| **Sync visibility in Karvel** | Show `xeroSyncStatus` on invoice — synced / pending / error — so Finance knows if something failed | 1–2 |
| **Error alerting** | Alert Finance (email or Slack) when a sync fails after N retries; dead-letter queue | 1 |
| **Tests** | Unit tests for field mapping and status transitions; integration tests against Xero sandbox | 2–3 |
| **Xero sandbox QA** | End-to-end validation against Xero's test environment before go-live | 1–2 |

**Total: 15–21 days** (~3–4 weeks for one mid-level backend engineer)

### Critical path note

The webhook receiver is the most complex piece. Xero does not include the new status in the payload — only the invoice ID — so the handler must fetch, diff, and update idempotently. This is also the piece most likely to surface edge cases in QA.

### Not included in this estimate

- Backend infrastructure (if greenfield)
- Xero marketplace certification (required only if the app is published; not needed for a private internal integration)
- Historical invoice backfill (syncing invoices created before the integration goes live)

---

## References

- [Xero Accounting API — Invoices](https://developer.xero.com/documentation/api/accounting/invoices)
- [Xero Webhooks Overview](https://developer.xero.com/documentation/guides/webhooks/overview/)
- [Xero Webhooks — Invoice Events](https://developer.xero.com/documentation/guides/webhooks/invoices)
- [Best Practices: Creating Invoices](https://developer.xero.com/documentation/best-practices/data-integrity/creating-invoices)
- [Best Practices: Invoice Status](https://developer.xero.com/documentation/best-practices/user-experience/invoice-status/)
- [Xero OpenAPI Specification (GitHub)](https://github.com/XeroAPI/Xero-OpenAPI)
