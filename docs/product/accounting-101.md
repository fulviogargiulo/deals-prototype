<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2432073741 -->

# 1. Intro

This page aims at introducing key accounting and financial concepts that will be applied in the Deals and Payment product.

It provides a foundational overview of essential principles and terminology that are crucial for understanding how the Deals and Payment product operates within financial contexts.

By familiarizing yourself with these concepts, you will gain a clearer insight into the product's functionalities and how they relate to broader accounting and financial practices.

# 2. Key concepts

## 2.1 Double-entry bookkeeping

Every movement of value is recorded **twice** — once on the side that gains, once on the side that loses. The two sides must always equal. This is not optional and not a Huspy convention — it's how all real accounting works, going back to 15th-century Venice.

Two reasons it matters for us:

1. **It makes errors visible.** If debits ≠ credits, the system rejects the posting. A single-entry system can lose money silently; a double-entry system cannot.
2. **It tells a complete story.** Every posting answers two questions at once: "where did the value come from?" and "where did it go?". This is exactly what we need to explain to an agent why their balance is what it is.

## 2.2 Ledger

A **ledger** is an account that records the running balance of one specific thing. Think of it as a bank statement, but for any kind of value — not just cash.

Examples of things that have ledgers at Huspy:

* The cash sitting in our operating bank account
* The total commission we're owed by all developers but haven't collected yet
* The amount we specifically owe Agent #XYZ right now

## 2.3 General Ledger vs Subledger

| Type | What it is | Granularity | Example |
| --- | --- | --- | --- |
| **General Ledger (GL)** | A single account that holds the total balance for a category of value | Aggregate — no per-entity breakdown | `Revenues` holds _all_ revenues across all counterparties and deals |
| **Subledger** | A breakdown of a GL account into per-entity records | One record per entity | `AgentLiability` GL is the sum of `AgentLiability_[1042]` + `AgentLiability_[1043]` + ... one per agent |

**Rule:** `GL balance = Σ (all subledger balances under it)`. Always.

A GL with no subledger is just a flat account (e.g. `Bank_X_Account` — there's only one operating bank account, no need to split it further).

## 2.4 Posting and Posting Line

| Term | Definition |
| --- | --- |
| **Posting** | One accounting event. E.g. "SOA approved for Deal #4501". A posting is atomic — either the whole posting commits or none of it does. |
| **Posting Line** | One row inside a posting. Each line specifies: which ledger, which side (debit or credit), how much. |
| **Rule** | A posting must have at least 2 lines, and `Σ debits = Σ credits`. Otherwise it's rejected. |

## 2.5 Ledger natures

Every ledger has a **nature** that defines what it represents and how its balance behaves. There are five natures we use:

| Nature | What it represents | Example | When debited | When credited |
| --- | --- | --- | --- | --- |
| **Asset** | Something Huspy owns or is owed | `ASSET_BANK_BankX_EUR` | Value comes in | Value goes out |
| **Liability** | Something Huspy owes to someone else | `AgentLiability_[1042]` | We pay it down | We incur more debt |
| **Revenue** | Income earned by Huspy | `REV_EUR` | Refunds / reversals | Revenue recognised |
| **Expense** | Expensed we incur | `EXP_COMMISSION_EUR` | Expense confirmed | Refunds / reversals |

**Debit vs Credit:**

* To increase an Asset or Expense → **Debit**
* To increase a Liability or Revenue → **Credit**

# 2. Posting and Posting Line - Generic Metadata

The posting engine is generic. It doesn't know about deals, agents, or banks specifically — it only knows about postings, lines, ledgers, and the balance invariant. Domain context (which deal, which agent, which invoice) is carried as **metadata** on the posting and on each line.

This separation is what makes the engine reusable across REBU, MBU, conveyance, and any future BU we add.

### 3.1 Posting fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `posting_id` | UUID | yes | System-generated, immutable. Used for audit trail. |
| `external_ref` | string | no | Human-readable reference (e.g. `P0001`, `SOA-4501`). Optional, for UI display only. |
| `business_process` | enum | yes | What business process caused this posting. Examples: `soa_approved`, `bank_statement_inbound_matched`, `payout_instructed`, `bank_statement_outbound_matched`, `manual_adjustment`, `reversal`. |
| `created_by` | user_id \| system | yes | Who or what created the posting (a Finance user, an Ops user, a webhook handler). |
| `created_at` | timestamp | yes | When the posting was committed to the ledger. Immutable. |
| `value_date` | date | yes | The accounting date this posting belongs to (may differ from `posted_at` for back-dated entries). |
| `currency` | ISO 4217 | yes | All lines in one posting share the same currency. Cross-currency requires an FX bridge posting. |
| `reversed_by_posting_id` | UUID | no | If reversed, the ID of the reversal posting. |
| `metadata` | JSON | no | Free-form domain context: `{ deal_id, market, bu, invoice_id, soa_id, ... }`. The engine doesn't read it; downstream systems do. |
| `description` | string | no | Human-readable description shown in the UI. |
| `deal_id` | UUID | no | Deal id if connected to a specific deal |

### 3.2 Postingline fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `line_id` | UUID | yes | System-generated. |
| `posting_id` | UUID | yes | The posting this line belongs to. |
| `ledger_id` | string | yes | Which ledger this line affects. For subledgered ledgers this includes the subledger key (e.g. `AgentLiability_[1042]`). |
| `side` | enum | yes | `DEBIT` or `CREDIT`. |
| `amount` | decimal | yes | Always positive. The `side` field carries the sign. |
| `metadata` | JSON | no | Per-line domain context: `{ deal_id, counterparty_id, counterparty_type, invoice_id, payout_ref, bank_ref, ... }`. Used to link lines to deals, allocations, and reconciliation. |
| `invoice_id` | UUID | no | Set when this line has been allocated against an invoice. |
