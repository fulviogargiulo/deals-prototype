# P&L Engines — How Huspy Calculates Deal Profitability

This document explains how Huspy computes the P&L (profit and loss) for each deal. It is written for non-technical readers: Finance, BizOps, and Product. No engineering knowledge is required.

---

## The core idea

Every time a deal is saved or its status changes, the system runs a **P&L engine** in the background. The engine reads the deal's details — what Huspy earned, who the agents are, whether a referral partner was involved — and produces a set of numbers: agent payouts, acquisition costs, and Huspy's net margin.

The engine chosen depends on **which business unit and channel** the deal belongs to. Each engine has its own rules for where the money comes from and how it is distributed.

---

## The five engines at a glance

| Engine | Business Unit | Channel | Who closes the deal |
|---|---|---|---|
| **REBU** | Real Estate (rebu) | Any | Huspy's real-estate agents |
| **MBU MA/Broker** | Mortgage | MA | External mortgage broker |
| **MBU REA** | Mortgage | REA | Huspy mortgage agent via Real Estate Agent referral |
| **MBU DS** | Mortgage | DS | Huspy mortgage agent via Direct Sales |
| **MBU B2C** | Mortgage | B2C | Huspy mortgage agent, direct customer |

> BBG is reserved for a future channel and shares the B2C engine for now.

### Connected agents — universal rule

Every Huspy agent can have a **Team Lead** and a **Manager** configured in their profile (set by Finance via Agent Financials). When present, the system automatically calculates their payouts from the agent's net commission and adds them to Huspy's cost — they are **never** deducted from the agent's take-home. This applies to every engine, for every channel.

### P&L waterfall — universal structure

All five engines share the same waterfall. What varies is what fills each bucket.

```
Gross Revenue              (client/bank commission)
  − Acquisition Costs      (Huspy-borne co-broker fees — reduce agent commission pool)
  = Commission Base
  − Agent Commission       (strategy/rate × split share, per agent)
    − Agent-borne costs    (if any, deducted from that agent's gross commission only)
    = Agent take-home
    + Team Lead            (% of agent take-home — additive Huspy cost)
    + Manager              (% of agent take-home — additive Huspy cost)
  = Huspy Gross Share
  − Operational Costs      (service fees, referral fees — Huspy-borne, paid after agents)
  ─────────────────────────────────────────────
  = Huspy Net Margin
```

Not every bucket is filled in every engine — see the per-engine sections below.

---

## REBU — Real Estate Business Unit

### What triggers the commission

The deal moves to **Finalized**. At that point, the agent commission posting is created automatically.

### Where the revenue comes from

The **client or developer** pays Huspy a commission on the property transaction. This is declared as one or more **Revenue Lines** on the deal. The total is Huspy's gross revenue for the deal.

### How agent pay is calculated

Each agent has a **commission strategy** on file (set by Finance via the Agent Financials upload):

- **Flat %** — agent earns a fixed percentage of the revenue attributed to them (e.g. 40%)
- **Slab** — the rate increases in steps as the deal value rises (e.g. 35% up to AED 5,000, then 45%)
- **Max/Cap** — a flat rate with a ceiling payout amount

When multiple agents share a deal, each agent's strategy applies only to their share of the revenue pool (their split %).

### What fills each bucket

| Bucket | REBU source |
|---|---|
| Gross Revenue | Client / developer commission (one or more `REVENUE_SOURCE` lines) |
| Acquisition Costs | Huspy-borne co-broker fees (`ACQUISITION_DEDUCTION` without `chargedTo`) |
| Agent-borne costs | Referral fees the agent absorbs (`ACQUISITION_DEDUCTION` with `chargedTo`) |
| Operational Costs | Notary, legal, conveyance fees (`OPERATIONAL_DEDUCTION`) |

### CSV upload example

**Scenario:** Off-plan apartment at Marina Tower. Two agents split the deal (60/40). A co-broker referred the listing to Agent 1 and charges Agent 1 AED 2,000 (agent-borne, via `chargedTo`). Huspy also pays a separate AED 5,000 co-broker fee for the buyer side (Huspy-borne). Agent 1 has a Team Lead and a Manager on file. After closing, a notary fee of AED 1,200 is charged to Huspy.

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,fixedAmount
TEST-REBU-001,Marina Tower 1604,primary,rebu,,ae,AED,2500000,2026-04-15,REVENUE_SOURCE,party-client-001,50000,2% client commission,,,
TEST-REBU-001,,,,,,,,,,AGENT_PAYOUT,party-agent-001,,,,60,
TEST-REBU-001,,,,,,,,,,AGENT_PAYOUT,party-agent-002,,,,40,
TEST-REBU-001,,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-REBU-001,,,,,,,,,,SUPPLY,party-developer-001,,,,,
TEST-REBU-001,,,,,,,,,,ACQUISITION_DEDUCTION,party-cobroke-001,5000,Buyer-side co-broker (Huspy-borne),,,
TEST-REBU-001,,,,,,,,,,ACQUISITION_DEDUCTION,party-cobroke-002,2000,Listing referral (borne by Agent 1),party-agent-001,,
TEST-REBU-001,,,,,,,,,,OPERATIONAL_DEDUCTION,party-notary-001,1200,Notary fee,,,
```

**Expected P&L** (both agents: flat 40%, TL 10%, manager 5%):

| Line | Amount |
|---|---|
| Gross revenue | AED 50,000 |
| − Co-broker fee (Huspy-borne) | − AED 5,000 |
| = Commission base | AED 45,000 |
| Agent 1 pool (60% × 45,000) | AED 27,000 |
| &nbsp;&nbsp;Agent 1 gross commission (40%) | AED 10,800 |
| &nbsp;&nbsp;− Listing referral (agent-borne) | − AED 2,000 |
| &nbsp;&nbsp;= Agent 1 take-home | AED 8,800 |
| &nbsp;&nbsp;+ Team Lead (10% × 8,800) | + AED 880 |
| &nbsp;&nbsp;+ Manager (5% × 8,800) | + AED 440 |
| Agent 2 pool (40% × 45,000) | AED 18,000 |
| &nbsp;&nbsp;Agent 2 commission (40%) | AED 7,200 |
| &nbsp;&nbsp;+ Team Lead (10% × 7,200) | + AED 720 |
| &nbsp;&nbsp;+ Manager (5% × 7,200) | + AED 360 |
| Total agent payout (Huspy cost) | AED 20,400 |
| = Huspy gross share | AED 24,600 |
| − Notary | − AED 1,200 |
| = Huspy net | **AED 23,400** |

> Team Lead and Manager do not appear in the CSV — they are read automatically from the agent's profile at calculation time.

---

> **Tranche disbursements**
>
> Off-plan mortgages are often disbursed in stages. Each disbursement is recorded as a **separate deal** and processed independently by the engine. Tranches belonging to the same underlying sale are linked by setting the same `offerId` on every tranche deal.
>
> - The engine runs per tranche — each one generates its own commission posting at Invoicing.
> - Broker GMV (MA channel) automatically includes all tranches for a broker in the same reporting month, so tier qualification works correctly across tranches.
> - **Referral fee (REA / DS / B2C only):** the 0.3% fee is a one-time origination cost. Only include the `OPERATIONAL_DEDUCTION` row on the **first** tranche. Leave it out on subsequent tranches, or set `amount=0` to signal self-sourced rate for those deals.

## MBU MA/Broker — Mortgage via External Broker

### What triggers the commission

The deal moves to **Invoicing**. The broker commission posting is created automatically at that point, because Huspy's claim on the bank's commission arises when the invoice is raised.

### Where the revenue comes from

The **bank** pays Huspy a commission on the disbursed mortgage amount. Huspy then pays a portion of that to the external broker.

### How broker pay is calculated

Broker rates are not fixed. They are set monthly by BizOps and uploaded via the **Broker Rate Slabs** tab in Deal Configuration. The rate depends on:

1. **Which bank** the mortgage is placed with
2. **The broker's total disbursed volume across all banks** in that month — brokers with higher volume qualify for a higher tier

> Example: A broker places AED 6,000,000 in April. The threshold for Tier 2 is AED 5,000,000, so they qualify for the higher rate. DIB in Tier 2 = 0.720%. If their allocated share on a AED 2,800,000 deal is 60%, their payout = 60% × 2,800,000 × 0.720% = AED 12,096.

### What fills each bucket

| Bucket | MBU MA/Broker source |
|---|---|
| Gross Revenue | Bank commission on disbursed mortgage amount (`REVENUE_SOURCE` from bank) |
| Acquisition Costs | — not used — |
| Agent Commission | Broker payout resolved from monthly Broker Rate Slab (bank + broker GMV tier) |
| Operational Costs | — not used — |

### CSV upload example

Broker payout `amount` left blank — resolved from Broker Rate Slabs at calculation time using `reportDate` month + bank (SUPPLY partyId) + broker GMV.

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,fixedAmount
TEST-MA-001,Burj View Apt 2201,primary,mortgage,MA,ae,AED,3000000,2026-04-15,REVENUE_SOURCE,party-bank-adib,36000,Bank commission 1.2% of 3000000,,,
TEST-MA-001,,,,,,,,,,AGENT_PAYOUT,party-broker-001,,,,70,
TEST-MA-001,,,,,,,,,,AGENT_PAYOUT,party-broker-002,,,,30,
TEST-MA-001,,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-MA-001,,,,,,,,,,SUPPLY,party-bank-adib,,,,,
```

**Expected P&L** (Tier 1 ADIB rate 0.663% of principal):

| Line | Amount |
|---|---|
| Gross revenue | AED 36,000 |
| − Broker 1 (70% × 3,000,000 × 0.663%) | − AED 13,923 |
| − Broker 2 (30% × 3,000,000 × 0.663%) | − AED 5,967 |
| = Huspy net | **AED 16,110** |

> Broker tier is determined by their total disbursed volume across all MA deals in the same reporting month. If either broker exceeds the Tier 2 threshold, the rate and therefore Huspy net will differ.

---

## MBU REA / DS / B2C — Mortgage via Huspy's Direct Agents

These three channels share the same engine logic. The difference is which team of Huspy employees closes the deal:

- **REA** — the lead came from a Real Estate Agent partner
- **DS** — the lead came via Direct Sales outreach
- **B2C** — the customer came directly to Huspy (online, walk-in, etc.)

### What triggers the commission

The deal moves to **Invoicing** — same as MA/Broker.

### Where the revenue comes from

The **bank** pays Huspy a commission on the disbursed mortgage amount. Unlike MA/Broker, the agent closing the deal is a Huspy employee, not an external broker.

### Self-sourced vs externally sourced

This is the key variable for these channels:

| Situation | What it means | Effect on agent pay |
|---|---|---|
| **Self-sourced** | No referral party on the deal | Agent gets the higher rate |
| **Externally sourced** | A referral party is listed as an Operational Deduction on the deal | Agent gets the lower rate; referral party gets 0.3% of the disbursed principal |

The system detects this automatically: if any Operational Deduction stakeholder is present on the deal, it is treated as externally sourced. The referral fee is paid out of Huspy's margin after agent commission — it does not reduce the agent's commission base.

The referral party's fee defaults to **0.3% of the disbursed mortgage amount (principal)** unless the ops team manually overrides the amount on the deal.

### How agent pay is calculated

Agent rates are set monthly by BizOps and uploaded via the **MBU Direct Rates** tab in Deal Configuration. A rate is configured per channel (REA / DS / B2C) and applies to all agents working that channel in that month.

| | Self-sourced rate | Externally sourced rate |
|---|---|---|
| REA (example, Apr 2026) | 25% | 20% |
| DS (example, Apr 2026) | 30% | 25% |
| B2C (example, Apr 2026) | 28% | 23% |

> Example: Disbursed principal AED 500,000 · bank commission AED 10,000 · B2C deal sourced via a referral partner → agent gets 23% of AED 10,000 = AED 2,300 · referral party gets 0.3% of AED 500,000 = AED 1,500 · Huspy keeps AED 6,200.

### What fills each bucket

| Bucket | MBU REA / DS / B2C source |
|---|---|
| Gross Revenue | Bank commission on disbursed mortgage amount (`REVENUE_SOURCE` from bank) |
| Acquisition Costs | — not used — |
| Agent Commission | Monthly direct rate for channel × sourcing type (self or external) |
| Operational Costs | Referral party fee — 0.3% of principal by default (`OPERATIONAL_DEDUCTION`, externally sourced deals only) |

### CSV upload examples

Agent payout `amount` left blank — resolved from MBU Direct Rates using `reportDate` month + channel + sourcing type (detected from presence of OPERATIONAL_DEDUCTION).

#### REA — externally sourced

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,fixedAmount
TEST-REA-001,Creek View Studio 801,primary,mortgage,REA,ae,AED,2000000,2026-04-15,REVENUE_SOURCE,party-bank-fab,22000,Bank commission 1.1% of 2000000,,,
TEST-REA-001,,,,,,,,,,AGENT_PAYOUT,party-agent-001,,,,100,
TEST-REA-001,,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-REA-001,,,,,,,,,,SUPPLY,party-bank-fab,,,,,
TEST-REA-001,,,,,,,,,,OPERATIONAL_DEDUCTION,party-ref-grupo-norte,0,Referral fee - engine defaults to 0.3% of principal,,,
```

**Expected P&L** (Apr 2026, externally sourced REA rate 20%):

| Line | Amount |
|---|---|
| Gross revenue | AED 22,000 |
| − Agent (20% × 22,000) | − AED 4,400 |
| = Huspy gross share | AED 17,600 |
| − Referral fee (0.3% × 2,000,000) | − AED 6,000 |
| = Huspy net | **AED 11,600** |

#### DS — self-sourced

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,fixedAmount
TEST-DS-001,Downtown Heights 1102,primary,mortgage,DS,ae,AED,1500000,2026-04-15,REVENUE_SOURCE,party-bank-dib,15000,Bank commission 1.0% of 1500000,,,
TEST-DS-001,,,,,,,,,,AGENT_PAYOUT,party-agent-003,,,,100,
TEST-DS-001,,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-DS-001,,,,,,,,,,SUPPLY,party-bank-dib,,,,,
```

**Expected P&L** (Apr 2026, self-sourced DS rate 30%):

| Line | Amount |
|---|---|
| Gross revenue | AED 15,000 |
| − Agent (30% × 15,000) | − AED 4,500 |
| = Huspy net | **AED 10,500** |

#### B2C — self-sourced

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,fixedAmount
TEST-B2C-001,Jumeirah Bay 305,primary,mortgage,B2C,ae,AED,900000,2026-04-15,REVENUE_SOURCE,party-bank-enbd,8100,Bank commission 0.9% of 900000,,,
TEST-B2C-001,,,,,,,,,,AGENT_PAYOUT,party-agent-002,,,,100,
TEST-B2C-001,,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-B2C-001,,,,,,,,,,SUPPLY,party-bank-enbd,,,,,
```

**Expected P&L** (Apr 2026, self-sourced B2C rate 28%):

| Line | Amount |
|---|---|
| Gross revenue | AED 8,100 |
| − Agent (28% × 8,100) | − AED 2,268 |
| = Huspy net | **AED 5,832** |

---

## When are rates updated?

| Rate table | Who updates | How often | Where in Karvel |
|---|---|---|---|
| Broker Rate Slabs (MA) | BizOps | Monthly | Deal Config → Broker Rate Slabs |
| MBU Direct Rates (REA/DS/B2C) | BizOps/Finance | Monthly | Deal Config → MBU Direct Rates |
| Agent Financials (REBU) | Finance | Per agent change | Agents page → Agent Financials upload |

---

## When is the commission posting created?

| Engine | Status that triggers automatic posting |
|---|---|
| REBU | Finalized |
| MBU MA/Broker | Invoicing |
| MBU REA | Invoicing |
| MBU DS | Invoicing |
| MBU B2C | Invoicing |

Ops can also create postings manually at any time via the **Create Posting** button on a deal — this is used for corrections and adjustments and is independent of the automatic trigger.

---

## Glossary

| Term | Meaning |
|---|---|
| **Gross Revenue** | What Huspy receives from the client or bank before any deductions |
| **Huspy Net Margin** | Gross Revenue minus all payouts and costs |
| **Agent Commission** | The portion of Huspy's revenue paid to the closing agent(s) |
| **Acquisition Cost** | Fee paid to an external co-broker who shares a REBU deal with Huspy; reduces the agent commission base |
| **Operational Deduction** | Huspy-borne cost paid after agent commission. For REBU: notary, legal, conveyance fees. For MBU direct channels: the referral party's fee (0.3% of principal by default) |
| **Commission Posting** | The accounting entry that records the agent commission liability in the ledger |
| **Reporting Month** | The YYYY-MM used to look up the correct rate slab for a deal — derived from the deal's creation date |
| **Split %** | When two agents share a deal, their combined pool split must sum to 100% |
